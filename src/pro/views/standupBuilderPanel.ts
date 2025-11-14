import * as vscode from "vscode";
import * as path from "path";
import { GitAnalyzer } from "@shared/git/gitAnalyzer";
import { AISummarizer } from "@shared/ai/aiSummarizer";
import { LinearClient } from "@providers/linear/LinearClient";
import { formatTicketReferencesInText } from "@shared/utils/linkFormatter";
import { LicenseManager } from "@pro/utils/licenseManager";

/**
 * Standup Builder Panel - PRO FEATURE
 * 
 * AI-powered standup generation panel for Linear.
 * Requires valid DevBuddy Pro license or active trial.
 * 
 * @license Commercial - See LICENSE.pro
 */

export class StandupBuilderPanel {
  public static currentPanel: StandupBuilderPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _gitAnalyzer: GitAnalyzer | null = null;
  private _aiSummarizer: AISummarizer;
  private _linearClient: LinearClient | null = null;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._aiSummarizer = new AISummarizer();
    this.initializeClient();

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
              "devBuddy"
            );
            break;
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Initialize the Linear client asynchronously
   */
  private async initializeClient(): Promise<void> {
    this._linearClient = await LinearClient.create();
  }

  /**
   * Get the Linear client, ensuring it's initialized
   */
  private async getClient(): Promise<LinearClient> {
    if (!this._linearClient) {
      this._linearClient = await LinearClient.create();
    }
    return this._linearClient;
  }

  /**
   * Load Linear tickets for the dropdown
   */
  private async handleLoadTickets(): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client.isConfigured()) {
        this._panel.webview.postMessage({
          command: "ticketsLoaded",
          tickets: [],
          error: "Linear API not configured",
        });
        return;
      }

      const issues = await client.getMyIssues({
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
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "out", "webview"),
        ],
      }
    );

    // Note: WebviewPanel iconPath only supports Uri (file paths), not ThemeIcon
    // To add icons, we would need to bundle SVG/PNG files in the extension

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

      // For now, only support single ticket mode (multi-ticket needs additional git methods)
      this._panel.webview.postMessage({
        command: "progress",
        message: "Fetching git context...",
      });

      const result = await this._gitAnalyzer.getGitContext(data.timeWindow);
      const allCommits = result.commits;
      const allChangedFiles = result.changedFiles;

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
    // Get Linear organization for generating ticket URLs
    const config = vscode.workspace.getConfiguration("devBuddy");
    const linearOrg = config.get<string>("linearOrganization", "");

    // Format ticket references in the text
    const formattedText = formatTicketReferencesInText(
      text,
      (ticketId) => {
        if (linearOrg) {
          return `https://linear.app/${linearOrg}/issue/${ticketId}`;
        }
        // Fallback to just the ticket ID if no org configured
        return ticketId;
      }
    );

    await vscode.env.clipboard.writeText(formattedText);
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
    // Get the script URI
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "out",
        "webview",
        "standup-builder.js"
      )
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Standup Builder</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
