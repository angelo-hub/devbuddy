import * as vscode from "vscode";
import * as path from "path";
import { LinearClient, LinearIssue } from "../utils/linearClient";
import { BranchAssociationManager } from "../utils/branchAssociationManager";
import { getLogger } from "../utils/logger";

/**
 * Convert Linear web URL to desktop app URL if preference is enabled
 */
function getLinearUrl(webUrl: string): string {
  const config = vscode.workspace.getConfiguration("devBuddy");
  const preferDesktop = config.get<boolean>("preferDesktopApp", false);
  
  if (preferDesktop) {
    // Convert https://linear.app/... to linear://...
    return webUrl.replace("https://linear.app/", "linear://");
  }
  
  return webUrl;
}

export class LinearTicketPanel {
  public static currentPanel: LinearTicketPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _issue: LinearIssue | null = null;
  private _linearClient: LinearClient | null = null;
  private _branchManager: BranchAssociationManager;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._branchManager = new BranchAssociationManager(context);
    this.initializeClient();

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
              const urlToOpen = getLinearUrl(this._issue.url);
              vscode.env.openExternal(vscode.Uri.parse(urlToOpen));
            }
            break;
          case "refresh":
            await this.refresh();
            break;
          case "openIssue":
            await this.handleOpenIssue(message.issueId);
            break;
          case "checkoutBranch":
            await this.handleCheckoutBranch(message.ticketId);
            break;
          case "associateBranch":
            await this.handleAssociateBranch(
              message.ticketId,
              message.branchName
            );
            break;
          case "removeAssociation":
            await this.handleRemoveAssociation(message.ticketId);
            break;
          case "loadBranchInfo":
            await this.handleLoadBranchInfo(message.ticketId);
            break;
          case "loadAllBranches":
            await this.handleLoadAllBranches();
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
   * Create or show the ticket panel
   */
  public static async createOrShow(
    extensionUri: vscode.Uri,
    issue: LinearIssue,
    context: vscode.ExtensionContext
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

    LinearTicketPanel.currentPanel = new LinearTicketPanel(
      panel,
      extensionUri,
      context
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

    const client = await this.getClient();
    const updatedIssue = await client.getIssue(this._issue.id);
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
      const client = await this.getClient();
      const issue = await client.getIssue(issueId);
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

    const client = await this.getClient();
    const success = await client.updateIssueStatus(
      this._issue.id,
      stateId
    );

    if (success) {
      vscode.window.showInformationMessage("Status updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("devBuddy.refreshTickets");
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

    const client = await this.getClient();
    const success = await client.addComment(this._issue.id, body);

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

    const client = await this.getClient();
    const success = await client.updateIssueTitle(
      this._issue.id,
      title
    );

    if (success) {
      vscode.window.showInformationMessage("Title updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("devBuddy.refreshTickets");
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

    const client = await this.getClient();
    const success = await client.updateIssueDescription(
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

    const client = await this.getClient();
    const success = await client.updateIssueAssignee(
      this._issue.id,
      assigneeId
    );

    if (success) {
      vscode.window.showInformationMessage("Assignee updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("devBuddy.refreshTickets");
    } else {
      vscode.window.showErrorMessage("Failed to update assignee");
    }
  }

  /**
   * Handle loading users
   */
  private async handleLoadUsers(teamId?: string): Promise<void> {
    const client = await this.getClient();
    let users;

    if (teamId) {
      users = await client.getTeamMembers(teamId);
    } else if (this._issue?.team) {
      // Try to load team members first
      users = await client.getTeamMembers(this._issue.team.id);
    } else {
      // Fall back to organization users
      users = await client.getOrganizationUsers();
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
    const client = await this.getClient();
    const users = await client.searchUsers(searchTerm);

    this._panel.webview.postMessage({
      command: "usersLoaded",
      users,
    });
  }

  /**
   * Handle checkout branch
   */
  private async handleCheckoutBranch(ticketId: string): Promise<void> {
    const success = await this._branchManager.checkoutBranch(ticketId);
    if (success) {
      // Refresh to show updated state
      await this.handleLoadBranchInfo(ticketId);
    }
  }

  /**
   * Handle associate branch
   */
  private async handleAssociateBranch(
    ticketId: string,
    branchName: string
  ): Promise<void> {
    const success = await this._branchManager.associateBranch(
      ticketId,
      branchName
    );
    if (success) {
      vscode.window.showInformationMessage(
        `Branch '${branchName}' associated with ${ticketId}`
      );
      await this.handleLoadBranchInfo(ticketId);
    } else {
      vscode.window.showErrorMessage("Failed to associate branch");
    }
  }

  /**
   * Handle remove association
   */
  private async handleRemoveAssociation(ticketId: string): Promise<void> {
    const success = await this._branchManager.removeAssociation(ticketId);
    if (success) {
      vscode.window.showInformationMessage(
        `Branch association removed for ${ticketId}`
      );
      await this.handleLoadBranchInfo(ticketId);
    } else {
      vscode.window.showErrorMessage("Failed to remove association");
    }
  }

  /**
   * Handle load branch info
   */
  private async handleLoadBranchInfo(ticketId: string): Promise<void> {
    const branchName = this._branchManager.getBranchForTicket(ticketId);
    let exists = false;

    if (branchName) {
      exists = await this._branchManager.verifyBranchExists(branchName);
    }

    // Send branch info back to webview
    this._panel.webview.postMessage({
      command: "branchInfo",
      branchName,
      exists,
    });
  }

  /**
   * Handle load all branches
   */
  private async handleLoadAllBranches(): Promise<void> {
    try {
      const allBranches = await this._branchManager.getAllLocalBranches();
      const currentBranch = await this._branchManager.getCurrentBranch();
      
      // Get suggestions if we have an issue loaded
      let suggestions: string[] = [];
      if (this._issue) {
        suggestions = await this._branchManager.suggestAssociationsForTicket(
          this._issue.identifier
        );
      }

      this._panel.webview.postMessage({
        command: "allBranchesLoaded",
        branches: allBranches,
        currentBranch,
        suggestions,
      });
    } catch (error) {
      console.error("[Linear Buddy] Failed to load branches:", error);
      this._panel.webview.postMessage({
        command: "allBranchesLoaded",
        branches: [],
        currentBranch: null,
        suggestions: [],
      });
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
    const logger = getLogger();
    logger.debug(
      `Webview: Issue ${this._issue.identifier} team: ${this._issue.team?.name || this._issue.team?.id || "default"}`
    );

    const client = await this.getClient();
    const workflowStates = await client.getWorkflowStates(
      this._issue.team?.id
    );

    logger.debug(
      `Webview: Loaded ${
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
