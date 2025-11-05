import * as vscode from "vscode";
import { GitAnalyzer } from "../utils/gitAnalyzer";
import { AISummarizer } from "../utils/aiSummarizer";
import { LinearClient } from "../utils/linearClient";

export class StandupBuilderPanel {
  public static currentPanel: StandupBuilderPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _gitAnalyzer: GitAnalyzer | null = null;
  private _aiSummarizer: AISummarizer;
  private _linearClient: LinearClient;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._aiSummarizer = new AISummarizer();
    this._linearClient = new LinearClient();

    // Set up message handling
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "loadTickets":
            await this.handleLoadTickets();
            break;
          case "generate":
            await this.handleGenerate(message.data);
            break;
          case "copy":
            await this.handleCopy(message.text);
            break;
          case "openSettings":
            vscode.commands.executeCommand(
              "workbench.action.openSettings",
              "monorepoTools"
            );
            break;
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Load Linear tickets for the dropdown
   */
  private async handleLoadTickets(): Promise<void> {
    try {
      if (!this._linearClient.isConfigured()) {
        this._panel.webview.postMessage({
          command: "ticketsLoaded",
          tickets: [],
          error: "Linear API not configured",
        });
        return;
      }

      const issues = await this._linearClient.getMyIssues({
        state: ["unstarted", "started"],
      });

      this._panel.webview.postMessage({
        command: "ticketsLoaded",
        tickets: issues.map((issue) => ({
          id: issue.identifier,
          title: issue.title,
          description: issue.description,
          status: issue.state.name,
          priority: issue.priority,
        })),
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: "ticketsLoaded",
        tickets: [],
        error:
          error instanceof Error ? error.message : "Failed to load tickets",
      });
    }
  }

  /**
   * Create or show the standup builder panel
   */
  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.ViewColumn.Two; // Always open in right pane

    // If we already have a panel, show it
    if (StandupBuilderPanel.currentPanel) {
      StandupBuilderPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "standupBuilder",
      "Standup Builder",
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      }
    );

    StandupBuilderPanel.currentPanel = new StandupBuilderPanel(
      panel,
      extensionUri
    );
    StandupBuilderPanel.currentPanel._update();
  }

  /**
   * Handle generating standup
   */
  private async handleGenerate(data: {
    timeWindow: string;
    targetBranch: string;
    tickets: string;
    mode: string;
    selectedTicket?: string;
    ticketContext?: {
      id: string;
      title: string;
      description?: string;
      status?: string;
      priority?: number;
    };
  }): Promise<void> {
    try {
      // Show progress
      this._panel.webview.postMessage({
        command: "progress",
        message: "Analyzing git commits...",
      });

      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        throw new Error("No workspace folder open");
      }

      this._gitAnalyzer = new GitAnalyzer(workspaceRoot);

      let result: any;
      let allCommits: any[];
      let allChangedFiles: string[];

      // For now, only support single ticket mode (multi-ticket needs additional git methods)
      this._panel.webview.postMessage({
        command: "progress",
        message: "Fetching git context...",
      });

      result = await this._gitAnalyzer.getGitContext(data.timeWindow);
      allCommits = result.commits;
      allChangedFiles = result.changedFiles;

      // Get file diffs
      this._panel.webview.postMessage({
        command: "progress",
        message: "Analyzing code changes...",
      });

      const fileDiffs = await this._gitAnalyzer.getFileDiffs(
        data.targetBranch || "main",
        200
      );

      // Generate AI summaries
      this._panel.webview.postMessage({
        command: "progress",
        message: "Generating AI summary...",
      });

      const whatDidYouDo = await this._aiSummarizer.summarizeCommitsForStandup({
        commits: allCommits,
        changedFiles: allChangedFiles,
        fileDiffs: fileDiffs,
        ticketId: data.selectedTicket || result.ticketId,
        context: data.ticketContext?.description,
      });

      this._panel.webview.postMessage({
        command: "progress",
        message: "Suggesting next steps...",
      });

      const whatWillYouDo = await this._aiSummarizer.suggestNextSteps({
        commits: allCommits,
        changedFiles: allChangedFiles,
        fileDiffs: fileDiffs,
        ticketId: data.selectedTicket || result.ticketId,
      });

      this._panel.webview.postMessage({
        command: "progress",
        message: "Detecting blockers...",
      });

      const blockers = await this._aiSummarizer.detectBlockersFromCommits(
        allCommits
      );

      // Send results back
      this._panel.webview.postMessage({
        command: "results",
        data: {
          whatDidYouDo: whatDidYouDo || "(No recent commits found)",
          whatWillYouDo: whatWillYouDo || "Continue current work",
          blockers: blockers || "None",
          tickets: result.ticketId
            ? [{ id: result.ticketId, branch: result.currentBranch }]
            : [],
          commits: allCommits.slice(0, 10),
          changedFiles: allChangedFiles.slice(0, 20),
        },
      });

      vscode.window.showInformationMessage("Standup generated!");
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to generate standup: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      this._panel.webview.postMessage({
        command: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Handle copying to clipboard
   */
  private async handleCopy(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage("Copied to clipboard!");
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    StandupBuilderPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Update the webview content
   */
  private _update(): void {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  /**
   * Generate HTML for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const config = vscode.workspace.getConfiguration("monorepoTools");
    const defaultTimeWindow = config.get<string>(
      "standupTimeWindow",
      "24 hours ago"
    );
    const defaultBaseBranch = config.get<string>("baseBranch", "main");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Standup Builder</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 13px;
      line-height: 1.6;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .subtitle {
      color: var(--vscode-descriptionForeground);
      margin-bottom: 24px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--vscode-foreground);
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 6px;
      color: var(--vscode-foreground);
    }

    input, select, textarea {
      width: 100%;
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 13px;
      font-family: inherit;
    }

    input:focus, select:focus, textarea:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }

    textarea {
      min-height: 100px;
      resize: vertical;
    }

    .button {
      padding: 10px 20px;
      border-radius: 4px;
      border: 1px solid var(--vscode-button-border, transparent);
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .button-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .button-secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    .results {
      margin-top: 32px;
      display: none;
    }

    .results.visible {
      display: block;
    }

    .result-box {
      padding: 16px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .result-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }

    .result-content {
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .progress {
      display: none;
      padding: 12px;
      background-color: var(--vscode-inputValidation-infoBorder);
      color: var(--vscode-foreground);
      border-radius: 4px;
      margin: 16px 0;
    }

    .progress.visible {
      display: block;
    }

    .error {
      display: none;
      padding: 12px;
      background-color: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      border-radius: 4px;
      margin: 16px 0;
    }

    .error.visible {
      display: block;
    }

    .hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }

    .commit-list, .file-list {
      font-size: 12px;
      padding-left: 20px;
      margin-top: 8px;
    }

    .commit-list li, .file-list li {
      margin-bottom: 4px;
    }

    .divider {
      height: 1px;
      background-color: var(--vscode-panel-border);
      margin: 24px 0;
    }

    .mode-selector {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .mode-button {
      flex: 1;
      padding: 12px;
      text-align: center;
      border: 2px solid var(--vscode-panel-border);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .mode-button.active {
      border-color: var(--vscode-focusBorder);
      background-color: var(--vscode-list-activeSelectionBackground);
    }

    .mode-button:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .ticket-context {
      padding: 12px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
    }

    .ticket-title {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .ticket-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      margin-bottom: 8px;
      color: var(--vscode-descriptionForeground);
    }

    .ticket-description {
      font-size: 12px;
      line-height: 1.5;
      color: var(--vscode-descriptionForeground);
      max-height: 100px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Standup Builder</h1>
    <p class="subtitle">Generate AI-powered standup updates from your git commits</p>

    <div class="section">
      <div class="section-title">Linear Ticket</div>
      <div class="form-group">
        <label for="ticketSelect">Select Ticket (Optional)</label>
        <select id="ticketSelect">
          <option value="">Auto-detect from branch</option>
        </select>
        <div class="hint">Select a Linear ticket or leave empty to auto-detect from your current branch</div>
      </div>
      <div id="ticketContext" style="display: none; margin-top: 12px; padding: 12px; background-color: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); border-radius: 4px;">
        <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px;">Ticket Context</div>
        <div id="ticketDescription" style="font-size: 12px; color: var(--vscode-descriptionForeground);"></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Mode</div>
      <div class="mode-selector">
        <div class="mode-button active" data-mode="single" onclick="setMode('single')">
          <div style="font-weight: 600;">Single Ticket</div>
          <div class="hint">One ticket from current branch</div>
        </div>
        <div class="mode-button" data-mode="multi" onclick="setMode('multi')">
          <div style="font-weight: 600;">Multiple Tickets</div>
          <div class="hint">Track work across multiple tickets</div>
        </div>
      </div>
    </div>

    <form id="standupForm">
      <div class="form-group">
        <label for="ticketSelect">Linear Ticket</label>
        <select id="ticketSelect">
          <option value="">Loading tickets...</option>
        </select>
        <div class="hint" id="ticketHint">Select a ticket or leave empty to auto-detect from branch</div>
      </div>

      <div class="form-group" id="ticketDetails" style="display: none;">
        <div class="ticket-context">
          <div class="ticket-title" id="ticketTitle"></div>
          <div class="ticket-meta">
            <span id="ticketStatus"></span>
            <span id="ticketPriority"></span>
          </div>
          <div class="ticket-description" id="ticketDescription"></div>
        </div>
      </div>

      <div class="form-group">
        <label for="timeWindow">Time Window</label>
        <input type="text" id="timeWindow" value="${defaultTimeWindow}" placeholder="24 hours ago">
        <div class="hint">Examples: "24 hours ago", "2 days ago", "since yesterday"</div>
      </div>

      <div class="form-group">
        <label for="targetBranch">Target Branch</label>
        <input type="text" id="targetBranch" value="${defaultBaseBranch}" placeholder="main">
        <div class="hint">Branch to compare against (default: main or master)</div>
      </div>

      <div class="form-group" id="ticketsGroup" style="display: none;">
        <label for="tickets">Ticket IDs (comma-separated)</label>
        <input type="text" id="tickets" placeholder="ENG-123, ENG-456, ENG-789">
        <div class="hint">Enter ticket IDs separated by commas</div>
      </div>

      <div class="actions">
        <button type="submit" class="button" id="generateBtn">Generate Standup</button>
        <button type="button" class="button button-secondary" onclick="openSettings()">Settings</button>
      </div>
    </form>

    <div class="progress" id="progress"></div>
    <div class="error" id="error"></div>

    <div class="results" id="results">
      <div class="divider"></div>
      
      <div class="section">
        <div class="result-box">
          <div class="result-title">What did you do since the previous update?</div>
          <div class="result-content" id="whatDidYouDo"></div>
        </div>

        <div class="result-box">
          <div class="result-title">What are you going to do today?</div>
          <div class="result-content" id="whatWillYouDo"></div>
        </div>

        <div class="result-box">
          <div class="result-title">Are you reaching any blockers?</div>
          <div class="result-content" id="blockers"></div>
        </div>
      </div>

      <div class="section" id="ticketsSection" style="display: none;">
        <div class="section-title">Tickets</div>
        <div id="ticketsList"></div>
      </div>

      <div class="section">
        <div class="section-title">Recent Commits</div>
        <ul class="commit-list" id="commitsList"></ul>
      </div>

      <div class="section">
        <div class="section-title">Changed Files</div>
        <ul class="file-list" id="filesList"></ul>
      </div>

      <div class="actions">
        <button class="button" onclick="copyAll()">Copy All</button>
        <button class="button button-secondary" onclick="copyAnswers()">Copy Answers Only</button>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentMode = 'single';
    let linearTickets = [];
    let selectedTicketData = null;

    // Load tickets on page load
    window.addEventListener('DOMContentLoaded', () => {
      vscode.postMessage({ command: 'loadTickets' });
    });

    // Handle ticket selection
    document.getElementById('ticketSelect').addEventListener('change', (e) => {
      const ticketId = e.target.value;
      const ticketDetails = document.getElementById('ticketDetails');
      
      if (!ticketId) {
        // Auto-detect mode
        ticketDetails.style.display = 'none';
        selectedTicketData = null;
        return;
      }

      // Find selected ticket
      const ticket = linearTickets.find(t => t.id === ticketId);
      if (ticket) {
        selectedTicketData = ticket;
        
        // Show ticket details
        document.getElementById('ticketTitle').textContent = ticket.title;
        document.getElementById('ticketStatus').textContent = 'Status: ' + ticket.status;
        
        const priorityNames = ['None', 'Urgent', 'High', 'Medium', 'Low'];
        document.getElementById('ticketPriority').textContent = 'Priority: ' + (priorityNames[ticket.priority] || 'None');
        
        if (ticket.description) {
          document.getElementById('ticketDescription').textContent = ticket.description;
        } else {
          document.getElementById('ticketDescription').textContent = '(No description)';
        }
        
        ticketDetails.style.display = 'block';
      }
    });

    // Handle form submission
    document.getElementById('standupForm').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const timeWindow = document.getElementById('timeWindow').value;
      const targetBranch = document.getElementById('targetBranch').value;
      const tickets = document.getElementById('tickets').value;
      const selectedTicket = document.getElementById('ticketSelect').value;

      // Disable button
      document.getElementById('generateBtn').disabled = true;

      // Hide previous results/errors
      document.getElementById('results').classList.remove('visible');
      document.getElementById('error').classList.remove('visible');

      vscode.postMessage({
        command: 'generate',
        data: {
          timeWindow,
          targetBranch,
          tickets,
          selectedTicket,
          ticketContext: selectedTicketData,
          mode: currentMode
        }
      });
    });

    // Handle ticket selection
    document.getElementById('ticketSelect').addEventListener('change', (e) => {
      const selectedId = e.target.value;
      const ticketContext = document.getElementById('ticketContext');
      const ticketDescription = document.getElementById('ticketDescription');
      
      if (selectedId) {
        const ticket = linearTickets.find(t => t.id === selectedId);
        if (ticket) {
          selectedTicketData = ticket;
          ticketDescription.textContent = ticket.description || 'No description available';
          ticketContext.style.display = 'block';
        }
      } else {
        selectedTicketData = null;
        ticketContext.style.display = 'none';
      }
    });

    // Mode switching
    function setMode(mode) {
      currentMode = mode;
      
      document.querySelectorAll('.mode-button').forEach(btn => {
        if (btn.dataset.mode === mode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      if (mode === 'multi') {
        document.getElementById('ticketsGroup').style.display = 'block';
      } else {
        document.getElementById('ticketsGroup').style.display = 'none';
      }
    }

    function openSettings() {
      vscode.postMessage({ command: 'openSettings' });
    }

    function copyAll() {
      const text = buildFullStandup();
      vscode.postMessage({ command: 'copy', text });
    }

    function copyAnswers() {
      const whatDidYouDo = document.getElementById('whatDidYouDo').textContent;
      const whatWillYouDo = document.getElementById('whatWillYouDo').textContent;
      const blockers = document.getElementById('blockers').textContent;
      
      const text = \`What did you do?\\n\${whatDidYouDo}\\n\\nWhat will you do?\\n\${whatWillYouDo}\\n\\nBlockers?\\n\${blockers}\`;
      vscode.postMessage({ command: 'copy', text });
    }

    function buildFullStandup() {
      const whatDidYouDo = document.getElementById('whatDidYouDo').textContent;
      const whatWillYouDo = document.getElementById('whatWillYouDo').textContent;
      const blockers = document.getElementById('blockers').textContent;
      
      return \`**Daily Standup Update**\\n\${'='.repeat(50)}\\n\\nWhat did you do since the previous update?\\n\${whatDidYouDo}\\n\\nWhat are you going to do today?\\n\${whatWillYouDo}\\n\\nAre you reaching any blockers?\\n\${blockers}\`;
    }

    // Handle messages from extension
    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.command) {
        case 'ticketsLoaded':
          if (message.error) {
            console.log('Failed to load Linear tickets:', message.error);
            // Keep auto-detect option only
          } else {
            linearTickets = message.tickets;
            const select = document.getElementById('ticketSelect');
            
            // Clear existing options except first one
            select.innerHTML = '<option value="">Auto-detect from branch</option>';
            
            // Add tickets
            message.tickets.forEach(ticket => {
              const option = document.createElement('option');
              option.value = ticket.id;
              option.textContent = \`\${ticket.id}: \${ticket.title}\`;
              select.appendChild(option);
            });
          }
          break;

        case 'progress':
          const progress = document.getElementById('progress');
          progress.textContent = message.message;
          progress.classList.add('visible');
          break;

        case 'error':
          document.getElementById('progress').classList.remove('visible');
          const error = document.getElementById('error');
          error.textContent = 'Error: ' + message.message;
          error.classList.add('visible');
          document.getElementById('generateBtn').disabled = false;
          break;

        case 'results':
          document.getElementById('progress').classList.remove('visible');
          document.getElementById('generateBtn').disabled = false;
          
          // Show results
          document.getElementById('whatDidYouDo').textContent = message.data.whatDidYouDo;
          document.getElementById('whatWillYouDo').textContent = message.data.whatWillYouDo;
          document.getElementById('blockers').textContent = message.data.blockers;

          // Show tickets if multi-ticket mode
          if (message.data.tickets && message.data.tickets.length > 0) {
            document.getElementById('ticketsSection').style.display = 'block';
            const ticketsList = document.getElementById('ticketsList');
            ticketsList.innerHTML = message.data.tickets.map(t => 
              \`<div>\${t.id}\${t.branch ? \` (\${t.branch})\` : ''}\${t.description ? \`: \${t.description}\` : ''}</div>\`
            ).join('');
          }

          // Show commits
          const commitsList = document.getElementById('commitsList');
          commitsList.innerHTML = message.data.commits.map(c => 
            \`<li>\${c.message}\${c.branch ? \` [\${c.branch}]\` : ''}</li>\`
          ).join('');

          // Show files
          const filesList = document.getElementById('filesList');
          filesList.innerHTML = message.data.changedFiles.map(f => 
            \`<li>\${f}</li>\`
          ).join('');

          document.getElementById('results').classList.add('visible');
          break;
      }
    });
  </script>
</body>
</html>`;
  }
}
