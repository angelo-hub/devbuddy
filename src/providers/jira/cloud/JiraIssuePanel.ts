import * as vscode from "vscode";
import { BaseJiraClient } from "../common/BaseJiraClient";
import { JiraCloudClient } from "./JiraCloudClient";
import { JiraServerClient } from "../server/JiraServerClient";
import { JiraIssue } from "../common/types";
import { getLogger } from "@shared/utils/logger";
import { getJiraDeploymentType } from "@shared/utils/platformDetector";

const logger = getLogger();

export class JiraIssuePanel {
  public static currentPanel: JiraIssuePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _issue: JiraIssue | null = null;
  private _jiraClient: BaseJiraClient | null = null;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
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
            await this.handleSearchUsers(message.searchTerm, message.projectKey);
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
              vscode.window.showInformationMessage("Copied URL to clipboard");
            }
            break;
          case "enrichTicketLinks":
            await this.handleEnrichTicketLinks(message.ticketIds);
            break;
          case "openTicket":
            await this.handleOpenTicket(message.ticketKey);
            break;
          case "updatePriority":
            await this.handleUpdatePriority(message.priorityId);
            break;
          case "updateStoryPoints":
            await this.handleUpdateStoryPoints(message.storyPoints);
            break;
          case "updateDueDate":
            await this.handleUpdateDueDate(message.dueDate);
            break;
          case "updateLabels":
            await this.handleUpdateLabels(message.labels);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Initialize the Jira client asynchronously
   */
  private async initializeClient(): Promise<void> {
    const jiraType = getJiraDeploymentType();
    if (jiraType === "cloud") {
    this._jiraClient = await JiraCloudClient.create();
    } else {
      this._jiraClient = await JiraServerClient.create();
    }
  }

  /**
   * Get the Jira client, ensuring it's initialized
   */
  private async getClient(): Promise<BaseJiraClient> {
    if (!this._jiraClient) {
      const jiraType = getJiraDeploymentType();
      if (jiraType === "cloud") {
      this._jiraClient = await JiraCloudClient.create();
      } else {
        this._jiraClient = await JiraServerClient.create();
      }
    }
    return this._jiraClient;
  }

  /**
   * Create or show the issue panel
   */
  public static async createOrShow(
    extensionUri: vscode.Uri,
    issue: JiraIssue,
    context: vscode.ExtensionContext
  ): Promise<void> {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (JiraIssuePanel.currentPanel) {
      JiraIssuePanel.currentPanel._panel.reveal(column);
      JiraIssuePanel.currentPanel._issue = issue;
      await JiraIssuePanel.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "jiraIssueDetail",
      `${issue.key}: ${issue.summary}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "webview-ui", "build"),
        ],
      }
    );

    JiraIssuePanel.currentPanel = new JiraIssuePanel(
      panel,
      extensionUri,
      context
    );
    JiraIssuePanel.currentPanel._issue = issue;
    await JiraIssuePanel.currentPanel._update();
  }

  /**
   * Refresh the current issue
   */
  private async refresh(): Promise<void> {
    if (!this._issue) {
      return;
    }

    const client = await this.getClient();
    const updatedIssue = await client.getIssue(this._issue.key);
    if (updatedIssue) {
      this._issue = updatedIssue;
      await this._update();
      vscode.window.showInformationMessage("Issue refreshed!");
    }
  }

  /**
   * Handle status update via transition
   */
  private async handleUpdateStatus(transitionId: string): Promise<void> {
    if (!this._issue) {
      return;
    }

    const client = await this.getClient();
    const success = await client.transitionIssue(this._issue.key, transitionId);

    if (success) {
      vscode.window.showInformationMessage("Status updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("devBuddy.jira.refreshIssues");
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
    const comment = await client.addComment(this._issue.key, body);

    if (comment) {
      vscode.window.showInformationMessage("Comment added!");
      await this.refresh();
    } else {
      vscode.window.showErrorMessage("Failed to add comment");
    }
  }

  /**
   * Handle updating the summary
   */
  private async handleUpdateSummary(summary: string): Promise<void> {
    if (!this._issue || !summary.trim()) {
      return;
    }

    const client = await this.getClient();
    const success = await client.updateIssue(this._issue.key, {
      summary: summary.trim(),
    });

    if (success) {
      vscode.window.showInformationMessage("Summary updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("devBuddy.jira.refreshIssues");
    } else {
      vscode.window.showErrorMessage("Failed to update summary");
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
    const success = await client.updateIssue(this._issue.key, {
      description,
    });

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
    const success = await client.updateIssue(this._issue.key, {
      assigneeId: assigneeId || undefined,
    });

    if (success) {
      vscode.window.showInformationMessage("Assignee updated!");
      await this.refresh();
      // Refresh the sidebar
      vscode.commands.executeCommand("devBuddy.jira.refreshIssues");
    } else {
      vscode.window.showErrorMessage("Failed to update assignee");
    }
  }

  /**
   * Handle updating the priority
   */
  private async handleUpdatePriority(priorityId: string): Promise<void> {
    if (!this._issue) {
      return;
    }

    const client = await this.getClient();
    const success = await client.updateIssue(this._issue.key, {
      priorityId,
    });

    if (success) {
      vscode.window.showInformationMessage("Priority updated!");
      await this.refresh();
      vscode.commands.executeCommand("devBuddy.jira.refreshIssues");
    } else {
      vscode.window.showErrorMessage("Failed to update priority");
    }
  }

  /**
   * Handle updating story points
   */
  private async handleUpdateStoryPoints(storyPoints: number | null): Promise<void> {
    if (!this._issue) {
      return;
    }

    const client = await this.getClient();
    const success = await client.updateIssue(this._issue.key, {
      storyPoints: storyPoints ?? undefined,
    });

    if (success) {
      vscode.window.showInformationMessage("Story points updated!");
      await this.refresh();
      vscode.commands.executeCommand("devBuddy.jira.refreshIssues");
    } else {
      vscode.window.showErrorMessage("Failed to update story points");
    }
  }

  /**
   * Handle updating due date
   */
  private async handleUpdateDueDate(dueDate: string | null): Promise<void> {
    if (!this._issue) {
      return;
    }

    const client = await this.getClient();
    const success = await client.updateIssue(this._issue.key, {
      dueDate: dueDate || undefined,
    });

    if (success) {
      vscode.window.showInformationMessage("Due date updated!");
      await this.refresh();
      vscode.commands.executeCommand("devBuddy.jira.refreshIssues");
    } else {
      vscode.window.showErrorMessage("Failed to update due date");
    }
  }

  /**
   * Handle updating labels
   */
  private async handleUpdateLabels(labels: string[]): Promise<void> {
    if (!this._issue) {
      return;
    }

    const client = await this.getClient();
    const success = await client.updateIssue(this._issue.key, {
      labels,
    });

    if (success) {
      vscode.window.showInformationMessage("Labels updated!");
      await this.refresh();
      vscode.commands.executeCommand("devBuddy.jira.refreshIssues");
    } else {
      vscode.window.showErrorMessage("Failed to update labels");
    }
  }

  /**
   * Handle loading transitions
   */
  private async handleLoadTransitions(): Promise<void> {
    if (!this._issue) {
      return;
    }

    const client = await this.getClient();
    const transitions = await client.getTransitions(this._issue.key);

    this._panel.webview.postMessage({
      command: "transitionsLoaded",
      transitions,
    });
  }

  /**
   * Handle loading users for assignee picker
   */
  private async handleLoadUsers(projectKey: string): Promise<void> {
    logger.debug(`Loading users for project: ${projectKey}`);
    const client = await this.getClient();
    const users = await client.searchUsers("", projectKey);
    logger.debug(`Loaded ${users.length} users`);

    this._panel.webview.postMessage({
      command: "usersLoaded",
      users,
    });
  }

  /**
   * Handle searching users
   */
  private async handleSearchUsers(searchTerm: string, projectKey?: string): Promise<void> {
    logger.debug(`Searching users with term: "${searchTerm}" in project: ${projectKey || "all"}`);
    const client = await this.getClient();
    const users = await client.searchUsers(searchTerm, projectKey);
    logger.debug(`Found ${users.length} users matching "${searchTerm}"`);

    this._panel.webview.postMessage({
      command: "usersLoaded",
      users,
    });
  }

  /**
   * Handle enriching ticket links with metadata
   */
  private async handleEnrichTicketLinks(ticketIds: string[]): Promise<void> {
    if (!ticketIds || ticketIds.length === 0) {
      return;
    }

    try {
      const client = await this.getClient();
      const enrichedMetadata: Array<{
        id: string;
        identifier: string;
        title: string;
        status: string;
        statusCategory?: string;
        url: string;
      }> = [];

      // Fetch each ticket's metadata
      for (const ticketId of ticketIds) {
        try {
          const issue = await client.getIssue(ticketId);
          if (issue) {
            enrichedMetadata.push({
              id: issue.key,
              identifier: issue.key,
              title: issue.summary,
              status: issue.status.name,
              statusCategory: issue.status.statusCategory.key,
              url: issue.url,
            });
          }
        } catch (error) {
          logger.error(`Failed to fetch issue ${ticketId}:`, error);
          // Continue with other tickets
        }
      }

      // Send enriched metadata back to webview
      this._panel.webview.postMessage({
        command: "enrichedTicketMetadata",
        metadata: enrichedMetadata,
      });
    } catch (error) {
      logger.error("Failed to enrich ticket links:", error);
      // Send empty response to prevent hanging
      this._panel.webview.postMessage({
        command: "enrichedTicketMetadata",
        metadata: [],
      });
    }
  }

  /**
   * Handle opening a related ticket in the panel
   */
  private async handleOpenTicket(ticketKey: string): Promise<void> {
    if (!ticketKey) {
      return;
    }

    try {
      const client = await this.getClient();
      const issue = await client.getIssue(ticketKey);
      
      if (issue) {
        // Update the current panel with the new issue
        this._issue = issue;
        await this._update();
        
        // Also reload transitions and users for the new issue
        await this.handleLoadTransitions();
      } else {
        vscode.window.showErrorMessage(`Could not find issue ${ticketKey}`);
      }
    } catch (error) {
      logger.error(`Failed to open ticket ${ticketKey}:`, error);
      vscode.window.showErrorMessage(`Failed to open issue ${ticketKey}`);
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    JiraIssuePanel.currentPanel = undefined;

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
      ? `${this._issue.key}: ${this._issue.summary}`
      : "Jira Issue";

    this._panel.webview.html = await this._getHtmlForWebview(webview);
  }

  /**
   * Generate HTML for the webview
   */
  private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    if (!this._issue) {
      return "<html><body><p>No issue selected</p></body></html>";
    }

    // Get the script URI
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "jira-ticket-panel.js"
      )
    );

    // Get the CSS URI
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "jira-ticket-panel.css"
      )
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = this.getNonce();

    // Build CSP img-src directive that includes Jira Server base URL if using Server
    const jiraType = getJiraDeploymentType();
    let imgSrc = "https: data:";
    
    if (jiraType === "server") {
      // Add Jira Server base URL to allow loading issue type icons and avatars
      const config = vscode.workspace.getConfiguration("devBuddy");
      const baseUrl = config.get<string>("jira.server.baseUrl", "");
      const isDevMode = config.get<boolean>("debugMode", false);
      
      if (baseUrl) {
        // Parse URL to get origin (protocol + host + port)
        try {
          const url = new URL(baseUrl);
          // Only allow the specific Jira Server origin
          // In dev mode with localhost/http, allow http: protocol
          if (url.protocol === "http:" && (isDevMode || url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
            imgSrc = `https: data: ${url.origin}`;
          } else {
            // Production HTTPS only
            imgSrc = `https: data: ${url.origin}`;
          }
        } catch {
          // If URL parsing fails, default to https only
          imgSrc = "https: data:";
        }
      }
    }

    // Pass initial state to React
    const initialState = {
      issue: this._issue,
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${imgSrc}; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>${this._issue.key}</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__JIRA_INITIAL_STATE__ = ${JSON.stringify(initialState)};
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
}

