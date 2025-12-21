import * as vscode from "vscode";
import { GitAnalyzer } from "@shared/git/gitAnalyzer";
import { AISummarizer } from "@shared/ai/aiSummarizer";
import { BaseStandupDataProvider, StandupGenerationOptions, StandupTicket, TicketActivity } from "@shared/base/BaseStandupDataProvider";
import { formatTicketReferencesInText } from "@shared/utils/linkFormatter";
import { getLogger } from "@shared/utils/logger";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";

const logger = getLogger();

/**
 * Auto-detected context for standup generation
 */
interface AutoDetectedContext {
  currentBranch: string;
  currentTicketId: string | null;
  recentCommits: Array<{ hash: string; message: string; ticketId?: string }>;
  detectedTicketIds: string[];
  associatedTickets: Array<{ ticketId: string; branchName: string; source: string }>;
  recentTicketActivity: TicketActivity[];
  timeWindow: string;
  isGitRepo: boolean;
}

/**
 * Universal Standup Builder Panel that works with any platform
 * Platform-specific data fetching is delegated to BaseStandupDataProvider implementations
 */
export class UniversalStandupBuilderPanel {
  public static currentPanel: UniversalStandupBuilderPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _context: vscode.ExtensionContext;
  private _disposables: vscode.Disposable[] = [];
  private _gitAnalyzer: GitAnalyzer | null = null;
  private _aiSummarizer: AISummarizer;
  private _dataProvider: BaseStandupDataProvider;
  private _branchManager: BranchAssociationManager | null = null;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    dataProvider: BaseStandupDataProvider,
    context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._dataProvider = dataProvider;
    this._context = context;
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
          case "loadAutoContext":
            await this.handleLoadAutoContext();
            break;
          case "quickGenerate":
            await this.handleQuickGenerate();
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
   * Opens in a split panel on the right side (ViewColumn.Beside)
   */
  public static async createOrShow(
    extensionUri: vscode.Uri,
    dataProvider: BaseStandupDataProvider,
    context?: vscode.ExtensionContext
  ): Promise<void> {
    // Always open beside the active editor (creates split on right)
    const column = vscode.ViewColumn.Beside;

    // Get context from global if not provided
    const extensionContext = context || (global as any).devBuddyContext;

    // If we already have a panel, show it
    if (UniversalStandupBuilderPanel.currentPanel) {
      UniversalStandupBuilderPanel.currentPanel._panel.reveal(column);
      // Update the data provider in case platform switched
      UniversalStandupBuilderPanel.currentPanel._dataProvider = dataProvider;
      await UniversalStandupBuilderPanel.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel in split view on the right
    const panel = vscode.window.createWebviewPanel(
      "standupBuilder",
      `Standup Builder (${dataProvider.getPlatformName()})`,
      column,
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
      dataProvider,
      extensionContext
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
   * Auto-detect context from git history, branches, and associations
   * This enables the "Quick Generate" feature with zero configuration
   */
  private async handleLoadAutoContext(): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        this._panel.webview.postMessage({
          command: "autoContextLoaded",
          context: null,
          error: "No workspace folder open",
        });
        return;
      }

      // Initialize git analyzer if needed
      if (!this._gitAnalyzer) {
        this._gitAnalyzer = new GitAnalyzer(workspaceFolder.uri.fsPath);
      }

      // Initialize branch manager if needed
      if (!this._branchManager && this._context) {
        this._branchManager = new BranchAssociationManager(this._context, "both");
      }

      // Check if we're in a git repository
      const isGitRepo = await this._gitAnalyzer.isGitRepository();
      if (!isGitRepo) {
        this._panel.webview.postMessage({
          command: "autoContextLoaded",
          context: {
            currentBranch: "",
            currentTicketId: null,
            recentCommits: [],
            detectedTicketIds: [],
            associatedTickets: [],
            recentTicketActivity: [],
            timeWindow: "24 hours ago",
            isGitRepo: false,
          } as AutoDetectedContext,
        });
        return;
      }

      const config = vscode.workspace.getConfiguration("devBuddy");
      const timeWindow = config.get<string>("standupTimeWindow", "24 hours ago");

      // Get current branch and ticket ID
      const currentBranch = await this._gitAnalyzer.getCurrentBranch();
      const currentTicketId = this._gitAnalyzer.extractTicketId(currentBranch);

      // Get recent commits with ticket IDs
      const recentCommits = await this._gitAnalyzer.getCommits(timeWindow);
      const commitsWithTickets = recentCommits.map(commit => ({
        ...commit,
        ticketId: this._gitAnalyzer!.extractTicketId(commit.message) || undefined,
      }));

      // Extract unique ticket IDs from commits
      const commitTicketIds = new Set<string>();
      for (const commit of commitsWithTickets) {
        if (commit.ticketId) {
          commitTicketIds.add(commit.ticketId);
        }
        // Also check commit message for ticket IDs
        const messageIds = this._dataProvider.extractTicketIdsFromText(commit.message);
        messageIds.forEach(id => commitTicketIds.add(id));
      }

      // Add current branch ticket ID
      if (currentTicketId) {
        commitTicketIds.add(currentTicketId);
      }

      // Get branch associations
      const associatedTickets: Array<{ ticketId: string; branchName: string; source: string }> = [];

      if (this._branchManager) {
        // Get associations from current repository
        const repoAssociations = this._branchManager.getGlobalAssociationsForRepository(
          workspaceFolder.uri.fsPath
        );

        for (const assoc of repoAssociations) {
          associatedTickets.push({
            ticketId: assoc.ticketId,
            branchName: assoc.branchName,
            source: "branch_association",
          });
          commitTicketIds.add(assoc.ticketId);
        }

        // Also get workspace-level associations
        const workspaceAssociations = this._branchManager.getAllAssociations();
        for (const assoc of workspaceAssociations) {
          if (!associatedTickets.find(a => a.ticketId === assoc.ticketId)) {
            associatedTickets.push({
              ticketId: assoc.ticketId,
              branchName: assoc.branchName,
              source: "workspace_association",
            });
            commitTicketIds.add(assoc.ticketId);
          }
        }
      }

      // If current branch has a ticket ID, make sure it's first in the list
      if (currentTicketId && !associatedTickets.find(a => a.ticketId === currentTicketId)) {
        associatedTickets.unshift({
          ticketId: currentTicketId,
          branchName: currentBranch,
          source: "current_branch",
        });
      }

      // Fetch recent ticket activity (non-code work)
      let recentTicketActivity: TicketActivity[] = [];
      if (this._dataProvider.isConfigured()) {
        try {
          recentTicketActivity = await this._dataProvider.getRecentTicketActivity(timeWindow);
          logger.debug(`Fetched ${recentTicketActivity.length} recent ticket activities`);
        } catch (error) {
          logger.warn(`Failed to fetch ticket activity: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const autoContext: AutoDetectedContext = {
        currentBranch,
        currentTicketId,
        recentCommits: commitsWithTickets,
        detectedTicketIds: Array.from(commitTicketIds),
        associatedTickets,
        recentTicketActivity,
        timeWindow,
        isGitRepo: true,
      };

      logger.debug(`Auto-detected context: ${autoContext.detectedTicketIds.length} tickets, ${autoContext.recentCommits.length} commits, ${recentTicketActivity.length} activities`);

      this._panel.webview.postMessage({
        command: "autoContextLoaded",
        context: autoContext,
      });

    } catch (error) {
      logger.error("Failed to load auto context:", error);
      this._panel.webview.postMessage({
        command: "autoContextLoaded",
        context: null,
        error: `Failed to auto-detect context: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  /**
   * Quick generate standup with auto-detected context
   * One-click generation without user configuration
   */
  private async handleQuickGenerate(): Promise<void> {
    try {
      this._panel.webview.postMessage({
        command: "generationStarted",
      });

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        this._panel.webview.postMessage({
          command: "generationFailed",
          error: "No workspace folder open",
        });
        return;
      }

      // Initialize git analyzer if needed
      if (!this._gitAnalyzer) {
        this._gitAnalyzer = new GitAnalyzer(workspaceFolder.uri.fsPath);
      }

      // Initialize branch manager if needed
      if (!this._branchManager && this._context) {
        this._branchManager = new BranchAssociationManager(this._context, "both");
      }

      const isGitRepo = await this._gitAnalyzer.isGitRepository();
      if (!isGitRepo) {
        this._panel.webview.postMessage({
          command: "generationFailed",
          error: "Current workspace is not a git repository",
        });
        return;
      }

      const config = vscode.workspace.getConfiguration("devBuddy");
      const timeWindow = config.get<string>("standupTimeWindow", "24 hours ago");
      const baseBranch = config.get<string>("baseBranch", "main");

      this._panel.webview.postMessage({
        command: "progress",
        message: "Gathering git data...",
      });

      // Get current branch and auto-detect ticket
      const currentBranch = await this._gitAnalyzer.getCurrentBranch();
      const currentTicketId = this._gitAnalyzer.extractTicketId(currentBranch);

      // Get commits and file changes
      const commits = await this._gitAnalyzer.getCommits(timeWindow);
      const fileChanges = await this._gitAnalyzer.getChangedFiles(baseBranch);

      // Extract all ticket IDs from commits and current branch
      const ticketIds = new Set<string>();
      if (currentTicketId) {
        ticketIds.add(currentTicketId);
      }
      for (const commit of commits) {
        const ids = this._dataProvider.extractTicketIdsFromText(commit.message);
        ids.forEach(id => ticketIds.add(id));
      }

      // Get branch associations for more context
      if (this._branchManager) {
        const associations = this._branchManager.getGlobalAssociationsForRepository(
          workspaceFolder.uri.fsPath
        );
        for (const assoc of associations) {
          ticketIds.add(assoc.ticketId);
        }
      }

      this._panel.webview.postMessage({
        command: "dataLoaded",
        commits,
        fileChanges,
      });

      // Fetch ticket details for context
      let tickets: StandupTicket[] = [];
      if (ticketIds.size > 0 && this._dataProvider.isConfigured()) {
        this._panel.webview.postMessage({
          command: "progress",
          message: "Fetching ticket details...",
        });
        
        tickets = await this._dataProvider.getTicketsByIds(Array.from(ticketIds));
      }

      // Fetch recent ticket activity (non-code work like spikes, investigations)
      let ticketActivity: TicketActivity[] = [];
      if (this._dataProvider.isConfigured()) {
        this._panel.webview.postMessage({
          command: "progress",
          message: "Fetching ticket activity...",
        });
        
        try {
          ticketActivity = await this._dataProvider.getRecentTicketActivity(timeWindow);
          logger.debug(`Found ${ticketActivity.length} ticket activities for quick generate`);
        } catch (error) {
          logger.warn(`Failed to fetch ticket activity: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Generate with AI
      this._panel.webview.postMessage({
        command: "progress",
        message: "Generating AI summary...",
      });

      const fileDiffs = await this._gitAnalyzer.getFileDiffs(baseBranch, 200);
      const aiDisabled = config.get<boolean>("ai.disabled", false);

      let whatDidYouDo = "";
      let whatWillYouDo = "";
      let blockers = "";

      // Build activity context for AI
      const activityContext = this.buildActivityContext(ticketActivity);
      const ticketContext = tickets.map(t => `${t.identifier}: ${t.description}`).join("; ");
      const combinedContext = [ticketContext, activityContext].filter(Boolean).join("\n\n");

      if (!aiDisabled) {
        try {
          whatDidYouDo = await this._aiSummarizer.summarizeCommitsForStandup({
            commits,
            changedFiles: fileChanges,
            fileDiffs,
            ticketId: tickets.length > 0 ? tickets[0].identifier : currentTicketId,
            context: combinedContext,
          }) || "(No recent commits found)";

          whatWillYouDo = await this._aiSummarizer.suggestNextSteps({
            commits,
            changedFiles: fileChanges,
            fileDiffs,
            ticketId: tickets.length > 0 ? tickets[0].identifier : currentTicketId,
          }) || "Continue current work";

          blockers = await this._aiSummarizer.detectBlockersFromCommits(commits) || "None";
        } catch (error) {
          logger.warn(`AI generation failed, using fallback: ${error}`);
          const fallback = this.generateFallbackStandup(tickets, commits, ticketActivity);
          whatDidYouDo = fallback.split("\n\n**What I'm working on:**")[0].replace("**What I did:**\n", "");
          whatWillYouDo = fallback.split("\n\n**What I'm working on:**")[1]?.split("\n\n**Blockers:**")[0].trim() || "Continue current work";
          blockers = "None";
        }
      } else {
        const fallback = this.generateFallbackStandup(tickets, commits, ticketActivity);
        whatDidYouDo = fallback.split("\n\n**What I'm working on:**")[0].replace("**What I did:**\n", "");
        whatWillYouDo = fallback.split("\n\n**What I'm working on:**")[1]?.split("\n\n**Blockers:**")[0].trim() || "Continue current work";
        blockers = "None";
      }

      // Format ticket references
      const formattedWhatDidYouDo = formatTicketReferencesInText(
        whatDidYouDo,
        (ticketId) => tickets.find(t => t.identifier === ticketId)?.url || ''
      );

      const formattedWhatWillYouDo = formatTicketReferencesInText(
        whatWillYouDo,
        (ticketId) => tickets.find(t => t.identifier === ticketId)?.url || ''
      );

      const formattedBlockers = formatTicketReferencesInText(
        blockers,
        (ticketId) => tickets.find(t => t.identifier === ticketId)?.url || ''
      );

      this._panel.webview.postMessage({
        command: "results",
        data: {
          whatDidYouDo: formattedWhatDidYouDo,
          whatWillYouDo: formattedWhatWillYouDo,
          blockers: formattedBlockers,
          tickets: tickets.map(t => ({ id: t.identifier, branch: t.url })),
          commits: commits.slice(0, 10),
          changedFiles: fileChanges.slice(0, 20),
          ticketActivity: ticketActivity.slice(0, 15).map(a => ({
            ticketId: a.ticketIdentifier,
            type: a.activityType,
            description: a.description,
            timestamp: a.timestamp,
            commentPreview: a.commentBody?.substring(0, 100),
          })),
        },
      });

      logger.success("Quick standup generation completed");

    } catch (error) {
      logger.error("Failed to quick generate standup:", error);
      this._panel.webview.postMessage({
        command: "error",
        message: error instanceof Error ? error.message : "Unknown error",
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

      // Fetch ticket activity (non-code work)
      let ticketActivity: TicketActivity[] = [];
      if (this._dataProvider.isConfigured()) {
        try {
          ticketActivity = await this._dataProvider.getRecentTicketActivity(options.timeWindow);
          logger.debug(`Found ${ticketActivity.length} ticket activities for standup`);
        } catch (error) {
          logger.warn(`Failed to fetch ticket activity: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Send data to webview for display
      this._panel.webview.postMessage({
        command: "dataLoaded",
        commits,
        fileChanges,
        ticketActivity: ticketActivity.slice(0, 15).map(a => ({
          ticketId: a.ticketIdentifier,
          type: a.activityType,
          description: a.description,
          timestamp: a.timestamp,
        })),
      });

      // Generate standup with AI
      const config = vscode.workspace.getConfiguration("devBuddy");
      const tone = options.tone || config.get<string>("writingTone", "professional");
      const aiDisabled = config.get<boolean>("ai.disabled", false);

      let whatDidYouDo = "";
      let whatWillYouDo = "";
      let blockers = "";

      // Build activity context for AI
      const activityContext = this.buildActivityContext(ticketActivity);
      const ticketContext = tickets.map(t => `${t.identifier}: ${t.description}`).join("; ");
      const combinedContext = [ticketContext, activityContext].filter(Boolean).join("\n\n");

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
            context: combinedContext,
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
          const fallbackStandup = this.generateFallbackStandup(tickets, commits, ticketActivity);
          whatDidYouDo = fallbackStandup.split("\n\n**What I'm working on:**")[0].replace("**What I did:**\n", "");
          whatWillYouDo = fallbackStandup.split("\n\n**What I'm working on:**")[1]?.split("\n\n**Blockers:**")[0].replace("", "").trim() || "Continue current work";
          blockers = "None";
        }
      } else {
        const fallbackStandup = this.generateFallbackStandup(tickets, commits, ticketActivity);
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
          ticketActivity: ticketActivity.slice(0, 15).map(a => ({
            ticketId: a.ticketIdentifier,
            type: a.activityType,
            description: a.description,
            timestamp: a.timestamp,
            commentPreview: a.commentBody?.substring(0, 100),
          })),
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
   * Build activity context string for AI summarization
   */
  private buildActivityContext(activities: TicketActivity[]): string {
    if (activities.length === 0) return "";

    const activitySummary = activities.slice(0, 10).map(a => {
      let detail = `- ${a.ticketIdentifier}: ${a.description}`;
      if (a.commentBody) {
        const preview = a.commentBody.substring(0, 150).replace(/\n/g, " ");
        detail += ` (comment: "${preview}${a.commentBody.length > 150 ? '...' : ''}")`;
      }
      return detail;
    }).join("\n");

    return `Recent ticket activity (non-code work):\n${activitySummary}`;
  }

  /**
   * Generate fallback standup without AI
   */
  private generateFallbackStandup(tickets: StandupTicket[], commits: any[], activities?: TicketActivity[]): string {
    let standup = "**What I did:**\n";
    
    // Include commits
    if (commits.length > 0) {
      standup += commits.slice(0, 5).map(c => `- ${c.message}`).join("\n");
    }

    // Include ticket activity (non-code work)
    if (activities && activities.length > 0) {
      const nonCodeWork = activities
        .filter(a => ["description_update", "comment_added", "status_change"].includes(a.activityType))
        .slice(0, 3);
      
      if (nonCodeWork.length > 0) {
        if (commits.length > 0) {
          standup += "\n";
        }
        standup += nonCodeWork.map(a => {
          if (a.activityType === "description_update") {
            return `- Updated ${a.ticketIdentifier} description (spike/investigation work)`;
          } else if (a.activityType === "comment_added") {
            return `- Added findings/notes to ${a.ticketIdentifier}`;
          } else if (a.activityType === "status_change") {
            return `- Moved ${a.ticketIdentifier} to ${a.toStatus}`;
          }
          return `- ${a.description}`;
        }).join("\n");
      }
    }

    if (commits.length === 0 && (!activities || activities.length === 0)) {
      standup += "- No commits or ticket activity in the time window\n";
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

