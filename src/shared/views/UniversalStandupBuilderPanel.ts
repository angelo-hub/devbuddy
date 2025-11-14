import * as vscode from "vscode";
import { GitAnalyzer } from "../git/gitAnalyzer";
import { AISummarizer } from "../ai/aiSummarizer";
import { BaseStandupDataProvider, StandupGenerationOptions, StandupTicket } from "../base/BaseStandupDataProvider";
import { formatTicketReferencesInText } from "../utils/linkFormatter";
import { getLogger } from "../utils/logger";

const logger = getLogger();

/**
 * Universal Standup Builder Panel that works with any platform
 * Platform-specific data fetching is delegated to BaseStandupDataProvider implementations
 */
export class UniversalStandupBuilderPanel {
  public static currentPanel: UniversalStandupBuilderPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _gitAnalyzer: GitAnalyzer | null = null;
  private _aiSummarizer: AISummarizer;
  private _dataProvider: BaseStandupDataProvider;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    dataProvider: BaseStandupDataProvider
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._dataProvider = dataProvider;
    this._aiSummarizer = new AISummarizer();

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
   * Create or show the standup builder panel with platform-specific data provider
   */
  public static async createOrShow(
    extensionUri: vscode.Uri,
    dataProvider: BaseStandupDataProvider
  ): Promise<void> {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (UniversalStandupBuilderPanel.currentPanel) {
      UniversalStandupBuilderPanel.currentPanel._panel.reveal(column);
      // Update the data provider in case platform switched
      UniversalStandupBuilderPanel.currentPanel._dataProvider = dataProvider;
      await UniversalStandupBuilderPanel.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "standupBuilder",
      `Standup Builder (${dataProvider.getPlatformName()})`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "webview-ui", "build"),
        ],
      }
    );

    UniversalStandupBuilderPanel.currentPanel = new UniversalStandupBuilderPanel(
      panel,
      extensionUri,
      dataProvider
    );
    await UniversalStandupBuilderPanel.currentPanel._update();
  }

  /**
   * Load tickets from the current platform
   */
  private async handleLoadTickets(): Promise<void> {
    try {
      if (!this._dataProvider.isConfigured()) {
        this._panel.webview.postMessage({
          command: "ticketsLoaded",
          tickets: [],
          error: `${this._dataProvider.getPlatformName()} is not configured`,
        });
        return;
      }

      const tickets = await this._dataProvider.getActiveTickets();

      this._panel.webview.postMessage({
        command: "ticketsLoaded",
        tickets: tickets.map((ticket) => ({
          id: ticket.identifier,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
        })),
        platform: this._dataProvider.getPlatformName(),
      });
    } catch (error) {
      logger.error("Failed to load tickets:", error);
      this._panel.webview.postMessage({
        command: "ticketsLoaded",
        tickets: [],
        error: `Failed to load tickets: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  /**
   * Generate standup update
   */
  private async handleGenerate(options: StandupGenerationOptions): Promise<void> {
    try {
      this._panel.webview.postMessage({
        command: "generationStarted",
      });

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        const errorMessage = "No workspace folder open. Please open a folder or git repository to generate standup updates.";
        logger.error(errorMessage);
        
        // Show error to user
        vscode.window.showErrorMessage(errorMessage);
        
        // Send error to webview
        this._panel.webview.postMessage({
          command: "generationFailed",
          error: errorMessage,
        });
        return;
      }

      // Initialize git analyzer
      if (!this._gitAnalyzer) {
        this._gitAnalyzer = new GitAnalyzer(workspaceFolder.uri.fsPath);
      }

      // Get tickets based on mode
      let tickets: StandupTicket[] = [];
      if (options.mode === "single" && options.ticketIds && options.ticketIds.length > 0) {
        const ticket = await this._dataProvider.getTicketById(options.ticketIds[0]);
        if (ticket) tickets = [ticket];
      } else if (options.mode === "multi" && options.ticketIds && options.ticketIds.length > 0) {
        tickets = await this._dataProvider.getTicketsByIds(options.ticketIds);
      } else if (options.mode === "custom") {
        tickets = await this._dataProvider.getRecentlyUpdatedTickets(options.timeWindow);
      }

      // Get git data if requested
      let commits: any[] = [];
      let fileChanges: string[] = [];
      
      if (options.includeCommits || options.includeFileChanges) {
        // Check if we're in a git repository
        const isGitRepo = await this._gitAnalyzer.isGitRepository();
        if (!isGitRepo) {
          const errorMessage = "Current workspace is not a git repository. Git-based features (commits and file changes) are not available.";
          logger.warn(errorMessage);
          
          vscode.window.showWarningMessage(errorMessage);
          
          this._panel.webview.postMessage({
            command: "generationFailed",
            error: errorMessage,
          });
          return;
        }
      }
      
      if (options.includeCommits) {
        commits = await this._gitAnalyzer.getCommits(options.timeWindow);
        
        // Extract ticket IDs from commits and link them
        const commitTicketIds = commits.flatMap(commit => 
          this._dataProvider.extractTicketIdsFromText(commit.message)
        );
        
        // Add related tickets found in commits
        if (commitTicketIds.length > 0) {
          const relatedTickets = await this._dataProvider.getTicketsByIds(commitTicketIds);
          // Merge with existing tickets, avoiding duplicates
          const existingIds = new Set(tickets.map(t => t.identifier));
          for (const ticket of relatedTickets) {
            if (!existingIds.has(ticket.identifier)) {
              tickets.push(ticket);
            }
          }
        }
      }

      if (options.includeFileChanges) {
        const changes = await this._gitAnalyzer.getChangedFiles(options.timeWindow);
        fileChanges = changes;
      }

      // Send data to webview for display
      this._panel.webview.postMessage({
        command: "dataLoaded",
        commits,
        fileChanges,
      });

      // Generate standup with AI
      const config = vscode.workspace.getConfiguration("devBuddy");
      const tone = options.tone || config.get<string>("writingTone", "professional");
      const aiDisabled = config.get<boolean>("ai.disabled", false);

      let whatDidYouDo = "";
      let whatWillYouDo = "";
      let blockers = "";

      if (!aiDisabled) {
        try {
          // Get file diffs for better context
          this._panel.webview.postMessage({
            command: "progress",
            message: "Analyzing code changes...",
          });
          
          const config = vscode.workspace.getConfiguration("devBuddy");
          const baseBranch = config.get<string>("baseBranch", "main");
          const fileDiffs = await this._gitAnalyzer.getFileDiffs(baseBranch, 200);

          // Generate AI summaries
          this._panel.webview.postMessage({
            command: "progress",
            message: "Generating AI summary...",
          });

          whatDidYouDo = await this._aiSummarizer.summarizeCommitsForStandup({
            commits,
            changedFiles: fileChanges,
            fileDiffs,
            ticketId: tickets.length > 0 ? tickets[0].identifier : null,
            context: tickets.map(t => `${t.identifier}: ${t.description}`).join("; "),
          }) || "(No recent commits found)";

          this._panel.webview.postMessage({
            command: "progress",
            message: "Suggesting next steps...",
          });

          whatWillYouDo = await this._aiSummarizer.suggestNextSteps({
            commits,
            changedFiles: fileChanges,
            fileDiffs,
            ticketId: tickets.length > 0 ? tickets[0].identifier : null,
          }) || "Continue current work";

          this._panel.webview.postMessage({
            command: "progress",
            message: "Detecting blockers...",
          });

          blockers = await this._aiSummarizer.detectBlockersFromCommits(commits) || "None";

          logger.success("AI standup generation completed");
        } catch (error) {
          logger.warn(`AI standup generation failed, using fallback: ${error instanceof Error ? error.message : String(error)}`);
          const fallbackStandup = this.generateFallbackStandup(tickets, commits);
          whatDidYouDo = fallbackStandup.split("\n\n**What I'm working on:**")[0].replace("**What I did:**\n", "");
          whatWillYouDo = fallbackStandup.split("\n\n**What I'm working on:**")[1]?.split("\n\n**Blockers:**")[0].replace("", "").trim() || "Continue current work";
          blockers = "None";
        }
      } else {
        const fallbackStandup = this.generateFallbackStandup(tickets, commits);
        whatDidYouDo = fallbackStandup.split("\n\n**What I'm working on:**")[0].replace("**What I did:**\n", "");
        whatWillYouDo = fallbackStandup.split("\n\n**What I'm working on:**")[1]?.split("\n\n**Blockers:**")[0].replace("", "").trim() || "Continue current work";
        blockers = "None";
      }

      // Format ticket references using the utility function
      const formattedWhatDidYouDo = formatTicketReferencesInText(
        whatDidYouDo,
        (ticketId) => {
          const ticket = tickets.find(t => t.identifier === ticketId);
          return ticket?.url || '';
        }
      );

      const formattedWhatWillYouDo = formatTicketReferencesInText(
        whatWillYouDo,
        (ticketId) => {
          const ticket = tickets.find(t => t.identifier === ticketId);
          return ticket?.url || '';
        }
      );

      const formattedBlockers = formatTicketReferencesInText(
        blockers,
        (ticketId) => {
          const ticket = tickets.find(t => t.identifier === ticketId);
          return ticket?.url || '';
        }
      );

      // Send results back to webview in the format it expects
      this._panel.webview.postMessage({
        command: "results",
        data: {
          whatDidYouDo: formattedWhatDidYouDo,
          whatWillYouDo: formattedWhatWillYouDo,
          blockers: formattedBlockers,
          tickets: tickets.map(t => ({ id: t.identifier, branch: t.url })),
          commits: commits.slice(0, 10),
          changedFiles: fileChanges.slice(0, 20),
        },
      });

    } catch (error) {
      logger.error("Failed to generate standup:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Show error to user
      vscode.window.showErrorMessage(`Failed to generate standup: ${errorMessage}`);
      
      // Send error to webview
      this._panel.webview.postMessage({
        command: "error",
        message: errorMessage,
      });
    }
  }

  /**
   * Generate fallback standup without AI
   */
  private generateFallbackStandup(tickets: StandupTicket[], commits: any[]): string {
    let standup = "**What I did:**\n";
    
    if (commits.length > 0) {
      standup += commits.slice(0, 5).map(c => `- ${c.message}`).join("\n");
    } else {
      standup += "- No commits in the time window\n";
    }

    standup += "\n\n**What I'm working on:**\n";
    if (tickets.length > 0) {
      standup += tickets.map(t => `- ${t.identifier}: ${t.title}`).join("\n");
    } else {
      standup += "- No active tickets\n";
    }

    standup += "\n\n**Blockers:**\n";
    standup += "- None\n";

    return standup;
  }

  /**
   * Handle copy to clipboard
   */
  private async handleCopy(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage("Standup update copied to clipboard!");
  }

  /**
   * Update the webview content
   */
  private async _update(): Promise<void> {
    this._panel.title = `Standup Builder (${this._dataProvider.getPlatformName()})`;
    this._panel.webview.html = await this._getHtmlForWebview();
  }

  /**
   * Generate HTML for the webview
   */
  private async _getHtmlForWebview(): Promise<string> {
    const webview = this._panel.webview;
    
    // Use the shared standup builder UI (Linear's webview)
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "linear-standup-builder.js"
      )
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "linear-standup-builder.css"
      )
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>Standup Builder - ${this._dataProvider.getPlatformName()}</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__PLATFORM__ = "${this._dataProvider.getPlatformName()}";
  </script>
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

  public dispose(): void {
    UniversalStandupBuilderPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

