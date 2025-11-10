import * as vscode from "vscode";
import { JiraCloudClient } from "./JiraCloudClient";
import { JiraProject, JiraIssueType, JiraUser } from "../common/types";
import { getLogger } from "../../../shared/utils/logger";

const logger = getLogger();

export class JiraCreateTicketPanel {
  public static currentPanel: JiraCreateTicketPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _jiraClient: JiraCloudClient | null = null;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.initializeClient();

    // Set up content and message handling
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "loadProjects":
            await this.handleLoadProjects();
            break;
          case "loadProjectMeta":
            await this.handleLoadProjectMeta(message.projectKey);
            break;
          case "loadUsers":
            await this.handleLoadUsers();
            break;
          case "createIssue":
            await this.handleCreateIssue(message.input);
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
      logger.debug("Jira client initialized in create ticket panel");
    } catch (error) {
      logger.error("Failed to initialize Jira client:", error);
    }
  }

  public static async createOrShow(
    extensionUri: vscode.Uri
  ): Promise<void> {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (JiraCreateTicketPanel.currentPanel) {
      JiraCreateTicketPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "jiraCreateTicket",
      "Create New Jira Issue",
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

    JiraCreateTicketPanel.currentPanel = new JiraCreateTicketPanel(
      panel,
      extensionUri
    );
    await JiraCreateTicketPanel.currentPanel._updateWebview();
  }

  private _updateWebview(): void {
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview(): string {
    const webview = this._panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "jira-create-ticket.js"
      )
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "jira-create-ticket.css"
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
          <title>Create Jira Issue</title>
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

  // ==================== MESSAGE HANDLERS ====================

  private async handleLoadProjects(): Promise<void> {
    if (!this._jiraClient) {
      return;
    }

    try {
      const projects = await this._jiraClient.getProjects();
      this._panel.webview.postMessage({
        command: "projectsLoaded",
        projects,
      });
    } catch (error) {
      logger.error("Failed to load projects:", error);
    }
  }

  private async handleLoadProjectMeta(projectKey: string): Promise<void> {
    if (!this._jiraClient) {
      return;
    }

    try {
      const [issueTypes, priorities] = await Promise.all([
        this._jiraClient.getIssueTypes(projectKey),
        this._jiraClient.getPriorities(),
      ]);

      this._panel.webview.postMessage({
        command: "projectMetaLoaded",
        issueTypes,
        priorities,
      });
    } catch (error) {
      logger.error("Failed to load project metadata:", error);
    }
  }

  private async handleLoadUsers(): Promise<void> {
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

  private async handleCreateIssue(input: {
    projectKey: string;
    summary: string;
    description: string;
    issueTypeId: string;
    priorityId?: string;
    assigneeId?: string;
    labels?: string[];
  }): Promise<void> {
    if (!this._jiraClient) {
      vscode.window.showErrorMessage("Jira client not initialized");
      return;
    }

    try {
      const issue = await this._jiraClient.createIssue({
        projectKey: input.projectKey,
        summary: input.summary,
        description: input.description,
        issueTypeId: input.issueTypeId,
        priorityId: input.priorityId,
        assigneeId: input.assigneeId,
        labels: input.labels || [],
      });

      if (!issue) {
        throw new Error("Failed to create issue");
      }

      vscode.window.showInformationMessage(
        `Issue ${issue.key} created successfully`
      );

      // Refresh tree view
      vscode.commands.executeCommand("devBuddy.refreshTickets");

      // Close the panel
      this._panel.dispose();
    } catch (error) {
      logger.error("Failed to create issue:", error);
      vscode.window.showErrorMessage(
        `Failed to create issue: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  public dispose(): void {
    JiraCreateTicketPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

