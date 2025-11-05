import * as vscode from "vscode";
import { LinearClient, LinearIssue } from "../utils/linearClient";

export class LinearTicketPanel {
  public static currentPanel: LinearTicketPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _issue: LinearIssue | null = null;
  private _linearClient: LinearClient;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._linearClient = new LinearClient();

    // Set up content and message handling
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "updateStatus":
            await this.handleUpdateStatus(message.stateId);
            break;
          case "addComment":
            await this.handleAddComment(message.body);
            break;
          case "openInLinear":
            if (this._issue?.url) {
              vscode.env.openExternal(vscode.Uri.parse(this._issue.url));
            }
            break;
          case "refresh":
            await this.refresh();
            break;
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Create or show the ticket panel
   */
  public static async createOrShow(
    extensionUri: vscode.Uri,
    issue: LinearIssue
  ): Promise<void> {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (LinearTicketPanel.currentPanel) {
      LinearTicketPanel.currentPanel._panel.reveal(column);
      LinearTicketPanel.currentPanel._issue = issue;
      await LinearTicketPanel.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "linearTicketDetail",
      `${issue.identifier}: ${issue.title}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      }
    );

    LinearTicketPanel.currentPanel = new LinearTicketPanel(
      panel,
      extensionUri
    );
    LinearTicketPanel.currentPanel._issue = issue;
    await LinearTicketPanel.currentPanel._update();
  }

  /**
   * Refresh the current issue
   */
  private async refresh(): Promise<void> {
    if (!this._issue) {
      return;
    }

    const updatedIssue = await this._linearClient.getIssue(this._issue.id);
    if (updatedIssue) {
      this._issue = updatedIssue;
      await this._update();
      vscode.window.showInformationMessage("Ticket refreshed!");
    }
  }

  /**
   * Handle status update
   */
  private async handleUpdateStatus(stateId: string): Promise<void> {
    if (!this._issue) {
      return;
    }

    const success = await this._linearClient.updateIssueStatus(
      this._issue.id,
      stateId
    );

    if (success) {
      vscode.window.showInformationMessage("Status updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("monorepoTools.refreshTickets");
    } else {
      vscode.window.showErrorMessage("Failed to update status");
    }
  }

  /**
   * Handle adding a comment
   */
  private async handleAddComment(body: string): Promise<void> {
    if (!this._issue || !body.trim()) {
      return;
    }

    const success = await this._linearClient.addComment(this._issue.id, body);

    if (success) {
      vscode.window.showInformationMessage("Comment added!");
      await this.refresh();
    } else {
      vscode.window.showErrorMessage("Failed to add comment");
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    LinearTicketPanel.currentPanel = undefined;

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
  private async _update(): Promise<void> {
    const webview = this._panel.webview;
    this._panel.title = this._issue
      ? `${this._issue.identifier}: ${this._issue.title}`
      : "Linear Ticket";
    this._panel.webview.html = await this._getHtmlForWebview(webview);
  }

  /**
   * Generate HTML for the webview
   */
  private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    if (!this._issue) {
      return "<html><body><p>No ticket selected</p></body></html>";
    }

    const issue = this._issue;

    // Get workflow states for the status dropdown
    const states = await this._linearClient.getWorkflowStates();
    const statusOptions = states
      .map(
        (state) =>
          `<option value="${state.id}" ${state.id === issue.state.id ? "selected" : ""}>${state.name}</option>`
      )
      .join("");

    const priorityName = this.getPriorityName(issue.priority);
    const priorityIcon = this.getPriorityIcon(issue.priority);
    const statusColor = this.getStatusColor(issue.state.type);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${issue.identifier}</title>
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

    .header {
      margin-bottom: 24px;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 16px;
    }

    .ticket-id {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      font-weight: 500;
      margin-bottom: 8px;
    }

    .ticket-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .metadata {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .metadata-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .metadata-label {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      font-weight: 500;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background-color: ${statusColor}20;
      color: ${statusColor};
      border: 1px solid ${statusColor}40;
    }

    .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
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

    .description {
      padding: 12px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .button {
      padding: 8px 16px;
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

    .button-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .button-secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    select {
      padding: 6px 12px;
      border-radius: 4px;
      border: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 13px;
      cursor: pointer;
      min-width: 150px;
    }

    select:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }

    .comment-section {
      margin-top: 24px;
    }

    textarea {
      width: 100%;
      min-height: 100px;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 13px;
      font-family: inherit;
      resize: vertical;
      margin-bottom: 8px;
    }

    textarea:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 16px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 13px;
      color: var(--vscode-foreground);
    }

    .labels {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .label {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      background-color: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }

    .empty-state {
      padding: 24px;
      text-align: center;
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }

    .divider {
      height: 1px;
      background-color: var(--vscode-panel-border);
      margin: 24px 0;
    }

    .url-link {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      font-size: 12px;
    }

    .url-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="ticket-id">${issue.identifier}</div>
      <h1 class="ticket-title">${this.escapeHtml(issue.title)}</h1>
      
      <div class="metadata">
        <div class="metadata-item">
          <span class="status-badge">
            <span>●</span>
            ${issue.state.name}
          </span>
        </div>
        <div class="metadata-item">
          <span class="priority-badge">
            ${priorityIcon}
            ${priorityName}
          </span>
        </div>
        ${
          issue.assignee
            ? `
        <div class="metadata-item">
          <span class="metadata-label">Assigned to:</span>
          <span>${this.escapeHtml(issue.assignee.name)}</span>
        </div>
        `
            : ""
        }
      </div>

      <div class="actions">
        <select id="statusSelect" class="status-select">
          ${statusOptions}
        </select>
        <button class="button" onclick="updateStatus()">Update Status</button>
        <button class="button button-secondary" onclick="openInLinear()">Open in Linear</button>
        <button class="button button-secondary" onclick="refresh()">Refresh</button>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Created</div>
        <div class="info-value">${new Date(issue.createdAt).toLocaleDateString()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Updated</div>
        <div class="info-value">${new Date(issue.updatedAt).toLocaleDateString()}</div>
      </div>
      ${
        issue.project
          ? `
      <div class="info-item">
        <div class="info-label">Project</div>
        <div class="info-value">${this.escapeHtml(issue.project.name)}</div>
      </div>
      `
          : ""
      }
    </div>

    ${
      issue.labels && issue.labels.length > 0
        ? `
    <div class="section">
      <div class="section-title">Labels</div>
      <div class="labels">
        ${issue.labels.map((label) => `<span class="label" style="background-color: ${label.color}22; color: ${label.color}">${this.escapeHtml(label.name)}</span>`).join("")}
      </div>
    </div>
    `
        : ""
    }

    <div class="divider"></div>

    <div class="section">
      <div class="section-title">Description</div>
      ${
        issue.description
          ? `<div class="description">${this.escapeHtml(issue.description)}</div>`
          : `<div class="empty-state">No description provided</div>`
      }
    </div>

    <div class="divider"></div>

    <div class="comment-section">
      <div class="section-title">Add Comment</div>
      <textarea id="commentInput" placeholder="Write a comment..."></textarea>
      <button class="button" onclick="addComment()">Add Comment</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function updateStatus() {
      const select = document.getElementById('statusSelect');
      const stateId = select.value;
      vscode.postMessage({
        command: 'updateStatus',
        stateId: stateId
      });
    }

    function openInLinear() {
      vscode.postMessage({
        command: 'openInLinear'
      });
    }

    function refresh() {
      vscode.postMessage({
        command: 'refresh'
      });
    }

    function addComment() {
      const input = document.getElementById('commentInput');
      const body = input.value.trim();
      
      if (body) {
        vscode.postMessage({
          command: 'addComment',
          body: body
        });
        input.value = '';
      }
    }
  </script>
</body>
</html>`;
  }

  private getPriorityName(priority: number): string {
    switch (priority) {
      case 1:
        return "Urgent";
      case 2:
        return "High";
      case 3:
        return "Medium";
      case 4:
        return "Low";
      default:
        return "None";
    }
  }

  private getPriorityIcon(priority: number): string {
    switch (priority) {
      case 1:
        return "🔴";
      case 2:
        return "🟠";
      case 3:
        return "🟡";
      case 4:
        return "🟢";
      default:
        return "⚪";
    }
  }

  private getStatusColor(statusType: string): string {
    switch (statusType) {
      case "started":
        return "#6366f1"; // Blue
      case "completed":
        return "#10b981"; // Green
      case "canceled":
        return "#6b7280"; // Gray
      case "backlog":
        return "#8b5cf6"; // Purple
      default:
        return "#6b7280"; // Gray
    }
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}


