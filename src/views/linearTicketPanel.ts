import * as vscode from "vscode";
import * as path from "path";
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
          case "updateTitle":
            await this.handleUpdateTitle(message.title);
            break;
          case "updateDescription":
            await this.handleUpdateDescription(message.description);
            break;
          case "updateAssignee":
            await this.handleUpdateAssignee(message.assigneeId);
            break;
          case "loadUsers":
            await this.handleLoadUsers(message.teamId);
            break;
          case "searchUsers":
            await this.handleSearchUsers(message.searchTerm);
            break;
          case "openInLinear":
            if (this._issue?.url) {
              vscode.env.openExternal(vscode.Uri.parse(this._issue.url));
            }
            break;
          case "refresh":
            await this.refresh();
            break;
          case "openIssue":
            await this.handleOpenIssue(message.issueId);
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
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "out", "webview"),
        ],
      }
    );

    // Note: WebviewPanel iconPath only supports Uri (file paths), not ThemeIcon
    // To add icons, we would need to bundle SVG/PNG files in the extension

    LinearTicketPanel.currentPanel = new LinearTicketPanel(panel, extensionUri);
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
   * Open a different issue by ID
   */
  private async handleOpenIssue(issueId: string): Promise<void> {
    try {
      const issue = await this._linearClient.getIssue(issueId);
      if (issue) {
        this._issue = issue;
        this._panel.title = `${issue.identifier}: ${issue.title}`;
        await this._update();
      } else {
        vscode.window.showErrorMessage("Failed to load issue");
      }
    } catch (error) {
      console.error("[Linear Buddy] Failed to open issue:", error);
      vscode.window.showErrorMessage("Failed to open issue");
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
   * Handle updating the title
   */
  private async handleUpdateTitle(title: string): Promise<void> {
    if (!this._issue || !title.trim()) {
      return;
    }

    const success = await this._linearClient.updateIssueTitle(
      this._issue.id,
      title
    );

    if (success) {
      vscode.window.showInformationMessage("Title updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("monorepoTools.refreshTickets");
    } else {
      vscode.window.showErrorMessage("Failed to update title");
    }
  }

  /**
   * Handle updating the description
   */
  private async handleUpdateDescription(description: string): Promise<void> {
    if (!this._issue) {
      return;
    }

    const success = await this._linearClient.updateIssueDescription(
      this._issue.id,
      description
    );

    if (success) {
      vscode.window.showInformationMessage("Description updated!");
      await this.refresh();
    } else {
      vscode.window.showErrorMessage("Failed to update description");
    }
  }

  /**
   * Handle updating the assignee
   */
  private async handleUpdateAssignee(assigneeId: string | null): Promise<void> {
    if (!this._issue) {
      return;
    }

    const success = await this._linearClient.updateIssueAssignee(
      this._issue.id,
      assigneeId
    );

    if (success) {
      vscode.window.showInformationMessage("Assignee updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("monorepoTools.refreshTickets");
    } else {
      vscode.window.showErrorMessage("Failed to update assignee");
    }
  }

  /**
   * Handle loading users
   */
  private async handleLoadUsers(teamId?: string): Promise<void> {
    let users;

    if (teamId) {
      users = await this._linearClient.getTeamMembers(teamId);
    } else if (this._issue?.team) {
      // Try to load team members first
      users = await this._linearClient.getTeamMembers(this._issue.team.id);
    } else {
      // Fall back to organization users
      users = await this._linearClient.getOrganizationUsers();
    }

    this._panel.webview.postMessage({
      command: "usersLoaded",
      users,
    });
  }

  /**
   * Handle searching users
   */
  private async handleSearchUsers(searchTerm: string): Promise<void> {
    const users = await this._linearClient.searchUsers(searchTerm);

    this._panel.webview.postMessage({
      command: "usersLoaded",
      users,
    });
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

    // Note: Cannot dynamically update iconPath with ThemeIcon for webview panels

    this._panel.webview.html = await this._getHtmlForWebview(webview);
  }

  /**
   * Generate HTML for the webview
   */
  private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    if (!this._issue) {
      return "<html><body><p>No ticket selected</p></body></html>";
    }

    // Get the script URI
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "out",
        "webview",
        "ticket-panel.js"
      )
    );

    // Get workflow states for the status dropdown
    // Filter by team to get a reasonable set of states
    console.log(
      `[Linear Buddy] Webview: Issue ${this._issue.identifier} team:`,
      this._issue
    );

    const workflowStates = await this._linearClient.getWorkflowStates(
      this._issue.team?.id
    );

    console.log(
      `[Linear Buddy] Webview: Loaded ${
        workflowStates.length
      } workflow states for team ${
        this._issue.team?.name || this._issue.team?.id || "default"
      }`
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = this.getNonce();

    // Pass initial state to React
    const initialState = {
      issue: this._issue,
      workflowStates: workflowStates,
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src ${
    webview.cspSource
  } 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>${this._issue.identifier}</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};
  </script>
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

  private _getErrorHtml(message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
</head>
<body>
  <div style="padding: 20px; color: var(--vscode-errorForeground);">
    <h2>Error</h2>
    <p>${message}</p>
  </div>
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
