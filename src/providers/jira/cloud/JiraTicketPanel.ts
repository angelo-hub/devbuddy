import * as vscode from "vscode";
import * as path from "path";
import { JiraCloudClient } from "./JiraCloudClient";
import { JiraIssue } from "../common/types";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

/**
 * Jira Ticket Panel - Webview for viewing and editing Jira issues
 */
export class JiraTicketPanel {
  public static currentPanel: JiraTicketPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _issue: JiraIssue | null = null;
  private _jiraClient: JiraCloudClient | null = null;
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
            await this.handleUpdateStatus(message.transitionId);
            break;
          case "addComment":
            await this.handleAddComment(message.body);
            break;
          case "updateSummary":
            await this.handleUpdateSummary(message.summary);
            break;
          case "updateDescription":
            await this.handleUpdateDescription(message.description);
            break;
          case "updateAssignee":
            await this.handleUpdateAssignee(message.assigneeId);
            break;
          case "loadTransitions":
            await this.handleLoadTransitions();
            break;
          case "loadUsers":
            await this.handleLoadUsers(message.projectKey);
            break;
          case "searchUsers":
            await this.handleSearchUsers(message.searchTerm);
            break;
          case "openInJira":
            if (this._issue?.url) {
              vscode.env.openExternal(vscode.Uri.parse(this._issue.url));
            }
            break;
          case "refresh":
            await this.refresh();
            break;
          case "copyKey":
            if (this._issue?.key) {
              await vscode.env.clipboard.writeText(this._issue.key);
              vscode.window.showInformationMessage(`Copied ${this._issue.key} to clipboard`);
            }
            break;
          case "copyUrl":
            if (this._issue?.url) {
              await vscode.env.clipboard.writeText(this._issue.url);
              vscode.window.showInformationMessage("Copied issue URL to clipboard");
            }
            break;
          case "checkoutBranch":
            await this.handleCheckoutBranch(message.ticketKey);
            break;
          case "associateBranch":
            await this.handleAssociateBranch(message.ticketKey, message.branchName);
            break;
          case "removeAssociation":
            await this.handleRemoveAssociation(message.ticketKey);
            break;
          case "loadBranchInfo":
            await this.handleLoadBranchInfo(message.ticketKey);
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

  private async initializeClient(): Promise<void> {
    try {
      this._jiraClient = await JiraCloudClient.create();
      logger.debug("Jira client initialized in ticket panel");
    } catch (error) {
      logger.error("Failed to initialize Jira client:", error);
    }
  }

  public static async createOrShow(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    issue: JiraIssue
  ): Promise<void> {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (JiraTicketPanel.currentPanel) {
      JiraTicketPanel.currentPanel._panel.reveal(column);
      JiraTicketPanel.currentPanel.updateIssue(issue);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "jiraTicketPanel",
      `${issue.key}: ${issue.summary}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "out"),
          vscode.Uri.joinPath(extensionUri, "webview-ui/build"),
        ],
      }
    );

    // Use custom ticket icons for light and dark themes
    panel.iconPath = {
      light: vscode.Uri.joinPath(extensionUri, 'resources', 'ticket-icon-light.svg'),
      dark: vscode.Uri.joinPath(extensionUri, 'resources', 'ticket-icon-dark.svg')
    };

    JiraTicketPanel.currentPanel = new JiraTicketPanel(
      panel,
      extensionUri,
      context
    );
    JiraTicketPanel.currentPanel.updateIssue(issue);
  }

  private updateIssue(issue: JiraIssue): void {
    this._issue = issue;
    this._panel.title = `${issue.key}: ${issue.summary}`;
    this._updateWebview();
  }

  private _updateWebview(): void {
    this._panel.webview.html = this._getHtmlForWebview();
    
    // Send issue data to webview
    if (this._issue) {
      this._panel.webview.postMessage({
        command: "updateIssue",
        issue: this._issue,
      });
    }
  }

  private _getHtmlForWebview(): string {
    const webview = this._panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "jira-ticket-panel.js"
      )
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "jira-ticket-panel.css"
      )
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
          <link href="${styleUri}" rel="stylesheet">
          <title>Jira Ticket</title>
        </head>
        <body>
          <div id="root"></div>
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
  }

  private getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private async refresh(): Promise<void> {
    if (!this._jiraClient || !this._issue) {
      return;
    }

    try {
      const updatedIssue = await this._jiraClient.getIssue(this._issue.key);
      if (updatedIssue) {
        this.updateIssue(updatedIssue);
      }
      vscode.window.showInformationMessage("Issue refreshed");
    } catch (error) {
      logger.error("Failed to refresh issue:", error);
      vscode.window.showErrorMessage("Failed to refresh issue");
    }
  }

  // ==================== MESSAGE HANDLERS ====================

  private async handleUpdateStatus(transitionId: string): Promise<void> {
    if (!this._jiraClient || !this._issue) {
      return;
    }

    try {
      await this._jiraClient.transitionIssue(this._issue.key, transitionId);
      await this.refresh();
      vscode.window.showInformationMessage("Status updated");
      
      // Refresh tree view
      vscode.commands.executeCommand("devBuddy.refreshTickets");
    } catch (error) {
      logger.error("Failed to update status:", error);
      vscode.window.showErrorMessage("Failed to update status");
    }
  }

  private async handleAddComment(body: string): Promise<void> {
    if (!this._jiraClient || !this._issue) {
      return;
    }

    try {
      await this._jiraClient.addComment(this._issue.key, body);
      await this.refresh();
      vscode.window.showInformationMessage("Comment added");
    } catch (error) {
      logger.error("Failed to add comment:", error);
      vscode.window.showErrorMessage("Failed to add comment");
    }
  }

  private async handleUpdateSummary(summary: string): Promise<void> {
    if (!this._jiraClient || !this._issue) {
      return;
    }

    try {
      await this._jiraClient.updateIssue(this._issue.key, { summary });
      await this.refresh();
      vscode.window.showInformationMessage("Summary updated");
      
      // Refresh tree view
      vscode.commands.executeCommand("devBuddy.refreshTickets");
    } catch (error) {
      logger.error("Failed to update summary:", error);
      vscode.window.showErrorMessage("Failed to update summary");
    }
  }

  private async handleUpdateDescription(description: string): Promise<void> {
    if (!this._jiraClient || !this._issue) {
      return;
    }

    try {
      await this._jiraClient.updateIssue(this._issue.key, { description });
      await this.refresh();
      vscode.window.showInformationMessage("Description updated");
    } catch (error) {
      logger.error("Failed to update description:", error);
      vscode.window.showErrorMessage("Failed to update description");
    }
  }

  private async handleUpdateAssignee(assigneeId: string | null): Promise<void> {
    if (!this._jiraClient || !this._issue) {
      return;
    }

    try {
      await this._jiraClient.updateIssue(this._issue.key, {
        assigneeId: assigneeId || undefined,
      });
      await this.refresh();
      vscode.window.showInformationMessage("Assignee updated");
      
      // Refresh tree view
      vscode.commands.executeCommand("devBuddy.refreshTickets");
    } catch (error) {
      logger.error("Failed to update assignee:", error);
      vscode.window.showErrorMessage("Failed to update assignee");
    }
  }

  private async handleLoadTransitions(): Promise<void> {
    if (!this._jiraClient || !this._issue) {
      return;
    }

    try {
      const transitions = await this._jiraClient.getTransitions(this._issue.key);
      this._panel.webview.postMessage({
        command: "transitionsLoaded",
        transitions,
      });
    } catch (error) {
      logger.error("Failed to load transitions:", error);
    }
  }

  private async handleLoadUsers(_projectKey: string): Promise<void> {
    if (!this._jiraClient) {
      return;
    }

    try {
      const users = await this._jiraClient.searchUsers("");
      this._panel.webview.postMessage({
        command: "usersLoaded",
        users,
      });
    } catch (error) {
      logger.error("Failed to load users:", error);
    }
  }

  private async handleSearchUsers(searchTerm: string): Promise<void> {
    if (!this._jiraClient) {
      return;
    }

    try {
      const users = await this._jiraClient.searchUsers(searchTerm);
      this._panel.webview.postMessage({
        command: "usersLoaded",
        users,
      });
    } catch (error) {
      logger.error("Failed to search users:", error);
    }
  }

  // ==================== BRANCH MANAGEMENT HANDLERS ====================

  private async handleCheckoutBranch(ticketKey: string): Promise<void> {
    const success = await this._branchManager.checkoutBranch(ticketKey);
    if (success) {
      // Refresh to show updated state
      await this.handleLoadBranchInfo(ticketKey);
    }
  }

  private async handleAssociateBranch(
    ticketKey: string,
    branchName: string
  ): Promise<void> {
    const success = await this._branchManager.associateBranch(
      ticketKey,
      branchName
    );
    if (success) {
      vscode.window.showInformationMessage(
        `Branch '${branchName}' associated with ${ticketKey}`
      );
      await this.handleLoadBranchInfo(ticketKey);
    } else {
      vscode.window.showErrorMessage("Failed to associate branch");
    }
  }

  private async handleRemoveAssociation(ticketKey: string): Promise<void> {
    const success = await this._branchManager.removeAssociation(ticketKey);
    if (success) {
      vscode.window.showInformationMessage(
        `Branch association removed for ${ticketKey}`
      );
      await this.handleLoadBranchInfo(ticketKey);
    } else {
      vscode.window.showErrorMessage("Failed to remove association");
    }
  }

  private async handleLoadBranchInfo(ticketKey: string): Promise<void> {
    const branchName = this._branchManager.getBranchForTicket(ticketKey);
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

  private async handleLoadAllBranches(): Promise<void> {
    try {
      const allBranches = await this._branchManager.getAllLocalBranches();
      const currentBranch = await this._branchManager.getCurrentBranch();
      
      // Get suggestions if we have an issue loaded
      let suggestions: string[] = [];
      if (this._issue) {
        suggestions = await this._branchManager.suggestAssociationsForTicket(
          this._issue.key
        );
      }

      this._panel.webview.postMessage({
        command: "allBranchesLoaded",
        branches: allBranches,
        currentBranch,
        suggestions,
      });
    } catch (error) {
      logger.error("Failed to load branches:", error);
      this._panel.webview.postMessage({
        command: "allBranchesLoaded",
        branches: [],
        currentBranch: null,
        suggestions: [],
      });
    }
  }

  public dispose(): void {
    JiraTicketPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

