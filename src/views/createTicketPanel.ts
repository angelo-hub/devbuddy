import * as vscode from "vscode";
import * as path from "path";
import {
  LinearClient,
  LinearIssue,
  LinearTemplate,
} from "../utils/linearClient";

export class CreateTicketPanel {
  public static currentPanel: CreateTicketPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _linearClient: LinearClient | null = null;

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
          case "loadTeams":
            await this.handleLoadTeams();
            break;
          case "loadTemplates":
            await this.handleLoadTemplates(message.teamId);
            break;
          case "loadTeamData":
            await this.handleLoadTeamData(message.teamId);
            break;
          case "loadUsers":
            await this.handleLoadUsers(message.teamId);
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
   * Create or show the create ticket panel
   */
  public static async createOrShow(
    extensionUri: vscode.Uri
  ): Promise<void> {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (CreateTicketPanel.currentPanel) {
      CreateTicketPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "createTicket",
      "Create New Ticket",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "out", "webview"),
        ],
      }
    );

    CreateTicketPanel.currentPanel = new CreateTicketPanel(
      panel,
      extensionUri
    );
    await CreateTicketPanel.currentPanel._update();
  }

  /**
   * Handle loading teams
   */
  private async handleLoadTeams(): Promise<void> {
    const client = await this.getClient();
    const teams = await client.getUserTeams();

    this._panel.webview.postMessage({
      command: "teamsLoaded",
      teams,
    });
  }

  /**
   * Handle loading templates
   */
  private async handleLoadTemplates(teamId: string): Promise<void> {
    const client = await this.getClient();
    const templates = await client.getTeamTemplates(teamId);

    this._panel.webview.postMessage({
      command: "templatesLoaded",
      templates,
    });
  }

  /**
   * Handle loading team data (workflow states, labels, projects)
   */
  private async handleLoadTeamData(teamId: string): Promise<void> {
    const client = await this.getClient();

    const [workflowStates, labels, projects] = await Promise.all([
      client.getWorkflowStates(teamId),
      client.getTeamLabels(teamId),
      client.getUserProjects(),
    ]);

    this._panel.webview.postMessage({
      command: "teamDataLoaded",
      workflowStates,
      labels,
      projects: projects.filter(
        (p) => p.state === "started" || p.state === "planned"
      ),
    });
  }

  /**
   * Handle loading users
   */
  private async handleLoadUsers(teamId?: string): Promise<void> {
    const client = await this.getClient();
    let users;

    if (teamId) {
      users = await client.getTeamMembers(teamId);
    } else {
      users = await client.getOrganizationUsers();
    }

    this._panel.webview.postMessage({
      command: "usersLoaded",
      users,
    });
  }

  /**
   * Handle creating an issue
   */
  private async handleCreateIssue(input: {
    teamId: string;
    title: string;
    description?: string;
    priority?: number;
    assigneeId?: string;
    projectId?: string;
    labelIds?: string[];
    stateId?: string;
  }): Promise<void> {
    const client = await this.getClient();

    try {
      const issue = await client.createIssue(input);

      if (issue) {
        this._panel.webview.postMessage({
          command: "issueCreated",
          issue,
        });

        vscode.window.showInformationMessage(
          `Ticket ${issue.identifier} created successfully!`
        );

        // Refresh the sidebar
        vscode.commands.executeCommand("linearBuddy.refreshTickets");

        // Ask if user wants to open the ticket
        const action = await vscode.window.showInformationMessage(
          `Ticket ${issue.identifier} created!`,
          "Open Ticket",
          "Close"
        );

        if (action === "Open Ticket") {
          vscode.commands.executeCommand("linearBuddy.openTicket", {
            issue,
          });
        }

        // Close the create panel
        this.dispose();
      } else {
        this._panel.webview.postMessage({
          command: "issueCreationFailed",
          error: "Failed to create issue",
        });
        vscode.window.showErrorMessage("Failed to create ticket");
      }
    } catch (error) {
      console.error("[Linear Buddy] Failed to create issue:", error);
      this._panel.webview.postMessage({
        command: "issueCreationFailed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      vscode.window.showErrorMessage(
        `Failed to create ticket: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    CreateTicketPanel.currentPanel = undefined;

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
    this._panel.webview.html = await this._getHtmlForWebview(webview);
  }

  /**
   * Generate HTML for the webview
   */
  private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    // Get the script URI
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "out",
        "webview",
        "create-ticket.js"
      )
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src ${
    webview.cspSource
  } 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Create New Ticket</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__INITIAL_STATE__ = {};
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

