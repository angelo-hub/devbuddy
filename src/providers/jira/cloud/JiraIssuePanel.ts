import * as vscode from "vscode";
import * as path from "path";
import { JiraCloudClient } from "./JiraCloudClient";
import { JiraIssue, JiraTransition, JiraUser, JiraComment } from "../common/types";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

export class JiraIssuePanel {
  public static currentPanel: JiraIssuePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _issue: JiraIssue | null = null;
  private _jiraClient: JiraCloudClient | null = null;

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
    this._jiraClient = await JiraCloudClient.create();
  }

  /**
   * Get the Jira client, ensuring it's initialized
   */
  private async getClient(): Promise<JiraCloudClient> {
    if (!this._jiraClient) {
      this._jiraClient = await JiraCloudClient.create();
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
    const client = await this.getClient();
    const users = await client.searchUsers("", projectKey);

    this._panel.webview.postMessage({
      command: "usersLoaded",
      users,
    });
  }

  /**
   * Handle searching users
   */
  private async handleSearchUsers(searchTerm: string, projectKey?: string): Promise<void> {
    const client = await this.getClient();
    const users = await client.searchUsers(searchTerm, projectKey);

    this._panel.webview.postMessage({
      command: "usersLoaded",
      users,
    });
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

    // Pass initial state to React
    const initialState = {
      issue: this._issue,
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
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

