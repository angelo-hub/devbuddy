import * as vscode from "vscode";
import * as path from "path";
import { LinearClient } from "./LinearClient";
import { LinearIssue } from "./types";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";
import { getLogger } from "@shared/utils/logger";

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
  private _navigationHistory: string[] = []; // Stack of issue IDs
  private _currentHistoryIndex: number = -1;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._branchManager = new BranchAssociationManager(context, "both");
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
          case "openInRepository":
            await this.handleOpenInRepository(message.ticketId, message.repositoryPath);
            break;
          case "loadLabels":
            await this.handleLoadLabels(message.teamId);
            break;
          case "updateLabels":
            await this.handleUpdateLabels(message.labelIds);
            break;
          case "loadCycles":
            await this.handleLoadCycles(message.teamId);
            break;
          case "updateCycle":
            await this.handleUpdateCycle(message.cycleId);
            break;
          case "searchIssues":
            await this.handleSearchIssues(message.searchTerm);
            break;
          case "createRelation":
            await this.handleCreateRelation(message.relatedIssueId, message.type);
            break;
          case "deleteRelation":
            await this.handleDeleteRelation(message.relationId);
            break;
          case "goBack":
            await this.handleGoBack();
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
          vscode.Uri.joinPath(extensionUri, "webview-ui", "build"),
        ],
      }
    );

    // Use custom ticket icons for light and dark themes
    panel.iconPath = {
      light: vscode.Uri.joinPath(extensionUri, 'resources', 'ticket-icon-light.svg'),
      dark: vscode.Uri.joinPath(extensionUri, 'resources', 'ticket-icon-dark.svg')
    };

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
        // Add current issue to history before navigating
        if (this._issue) {
          // Truncate forward history if we're not at the end
          this._navigationHistory = this._navigationHistory.slice(0, this._currentHistoryIndex + 1);
          // Add current issue to history
          this._navigationHistory.push(this._issue.id);
          this._currentHistoryIndex++;
        }
        
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
   * Go back to the previous issue in navigation history
   */
  private async handleGoBack(): Promise<void> {
    if (this._currentHistoryIndex <= 0) {
      return; // No history to go back to
    }

    try {
      this._currentHistoryIndex--;
      const previousIssueId = this._navigationHistory[this._currentHistoryIndex];
      
      const client = await this.getClient();
      const issue = await client.getIssue(previousIssueId);
      
      if (issue) {
        this._issue = issue;
        this._panel.title = `${issue.identifier}: ${issue.title}`;
        await this._update();
      } else {
        vscode.window.showErrorMessage("Failed to load previous issue");
        // Restore index if load failed
        this._currentHistoryIndex++;
      }
    } catch (error) {
      console.error("[Linear Buddy] Failed to go back:", error);
      vscode.window.showErrorMessage("Failed to go back");
      // Restore index if load failed
      this._currentHistoryIndex++;
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
    let isInDifferentRepo = false;
    let repositoryName: string | undefined;
    let repositoryPath: string | undefined;

    getLogger().debug(`[BranchManager] Loading branch info for ${ticketId}, found: ${branchName}`);

    if (branchName) {
      // Check if the branch is in a different repository
      const globalAssoc = this._branchManager.getGlobalAssociationForTicket(ticketId);
      getLogger().debug(`[BranchManager] Global association: ${JSON.stringify(globalAssoc)}`);
      
      if (globalAssoc && globalAssoc.repositoryPath) {
        const isCurrentRepo = this._branchManager.isTicketInCurrentRepo(ticketId);
        isInDifferentRepo = !isCurrentRepo;
        repositoryName = globalAssoc.repository;
        repositoryPath = globalAssoc.repositoryPath;
        
        getLogger().debug(`[BranchManager] isCurrentRepo: ${isCurrentRepo}, isInDifferentRepo: ${isInDifferentRepo}`);
        getLogger().debug(`[BranchManager] Repository: ${repositoryName} at ${repositoryPath}`);
        
        // Only check if branch exists in current repo if not in different repo
        if (!isInDifferentRepo) {
          exists = await this._branchManager.verifyBranchExists(branchName);
          getLogger().debug(`[BranchManager] Branch exists in current repo: ${exists}`);
        } else {
          // Branch is in different repo, mark as existing (we trust global storage)
          exists = true;
          getLogger().debug(`[BranchManager] Branch is in different repo, treating as existing`);
        }
      } else {
        // No global association, just check locally
        exists = await this._branchManager.verifyBranchExists(branchName);
        getLogger().debug(`[BranchManager] No global assoc, local exists: ${exists}`);
      }
    }

    // Send branch info back to webview
    this._panel.webview.postMessage({
      command: "branchInfo",
      branchName,
      exists,
      isInDifferentRepo,
      repositoryName,
      repositoryPath,
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
   * Handle open in different repository
   */
  private async handleOpenInRepository(ticketId: string, repositoryPath: string): Promise<void> {
    // Use the devBuddy.openInWorkspace command
    await vscode.commands.executeCommand("devBuddy.openInWorkspace", {
      ticketId,
      repositoryPath,
    });
  }

  /**
   * Handle loading labels for a team
   */
  private async handleLoadLabels(teamId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const labels = await client.getTeamLabels(teamId);
      this._panel.webview.postMessage({
        command: "labelsLoaded",
        labels,
      });
    } catch (error) {
      console.error("[Linear Buddy] Failed to load labels:", error);
      this._panel.webview.postMessage({
        command: "labelsLoaded",
        labels: [],
      });
    }
  }

  /**
   * Handle updating labels on an issue
   */
  private async handleUpdateLabels(labelIds: string[]): Promise<void> {
    if (!this._issue) {
      return;
    }

    const client = await this.getClient();
    const success = await client.updateIssueLabels(
      this._issue.id,
      labelIds
    );

    if (success) {
      vscode.window.showInformationMessage("Labels updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("devBuddy.refreshTickets");
    } else {
      vscode.window.showErrorMessage("Failed to update labels");
    }
  }

  /**
   * Handle loading cycles for a team
   */
  private async handleLoadCycles(teamId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const cycles = await client.getTeamCycles(teamId);
      this._panel.webview.postMessage({
        command: "cyclesLoaded",
        cycles,
      });
    } catch (error) {
      console.error("[Linear Buddy] Failed to load cycles:", error);
      this._panel.webview.postMessage({
        command: "cyclesLoaded",
        cycles: [],
      });
    }
  }

  /**
   * Handle updating the cycle on an issue
   */
  private async handleUpdateCycle(cycleId: string | null): Promise<void> {
    if (!this._issue) {
      return;
    }

    const client = await this.getClient();
    const success = await client.updateIssueCycle(
      this._issue.id,
      cycleId
    );

    if (success) {
      vscode.window.showInformationMessage("Cycle updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("devBuddy.refreshTickets");
    } else {
      vscode.window.showErrorMessage("Failed to update cycle");
    }
  }

  /**
   * Handle searching for issues (for creating relations)
   */
  private async handleSearchIssues(searchTerm: string): Promise<void> {
    try {
      const client = await this.getClient();
      const issues = await client.searchIssues(searchTerm, 20);
      this._panel.webview.postMessage({
        command: "issueSearchResults",
        issues,
      });
    } catch (error) {
      console.error("[Linear Buddy] Failed to search issues:", error);
      this._panel.webview.postMessage({
        command: "issueSearchResults",
        issues: [],
      });
    }
  }

  /**
   * Handle creating a relation between issues
   */
  private async handleCreateRelation(
    relatedIssueId: string,
    type: string
  ): Promise<void> {
    if (!this._issue) {
      return;
    }

    try {
      const client = await this.getClient();
      const result = await client.createIssueRelation(
        this._issue.id,
        relatedIssueId,
        type as "blocks" | "blocked_by" | "related" | "duplicate" | "duplicate_of"
      );

      if (result) {
        vscode.window.showInformationMessage("Issue link created!");
        await this.refresh();
        this._panel.webview.postMessage({
          command: "relationCreated",
          success: true,
        });
      } else {
        vscode.window.showErrorMessage("Failed to create issue link");
        this._panel.webview.postMessage({
          command: "relationCreated",
          success: false,
        });
      }
    } catch (error) {
      console.error("[Linear Buddy] Failed to create relation:", error);
      vscode.window.showErrorMessage("Failed to create issue link");
      this._panel.webview.postMessage({
        command: "relationCreated",
        success: false,
      });
    }
  }

  /**
   * Handle deleting an issue relation
   */
  private async handleDeleteRelation(relationId: string): Promise<void> {
    try {
      const client = await this.getClient();
      const success = await client.deleteIssueRelation(relationId);

      if (success) {
        vscode.window.showInformationMessage("Issue link removed!");
        await this.refresh();
        this._panel.webview.postMessage({
          command: "relationDeleted",
          success: true,
        });
      } else {
        vscode.window.showErrorMessage("Failed to remove issue link");
        this._panel.webview.postMessage({
          command: "relationDeleted",
          success: false,
        });
      }
    } catch (error) {
      console.error("[Linear Buddy] Failed to delete relation:", error);
      vscode.window.showErrorMessage("Failed to remove issue link");
      this._panel.webview.postMessage({
        command: "relationDeleted",
        success: false,
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
    
    // Send navigation state to webview
    this._panel.webview.postMessage({
      command: "navigationState",
      canGoBack: this._currentHistoryIndex > 0,
    });
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
        "webview-ui",
        "build",
        "linear-ticket-panel.js"
      )
    );

    // Get the CSS URI
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "linear-ticket-panel.css"
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
  <link href="${styleUri}" rel="stylesheet">
  <title>${this._issue.identifier}</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__LINEAR_INITIAL_STATE__ = ${JSON.stringify(initialState)};
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
