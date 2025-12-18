import * as vscode from "vscode";
import { generatePRSummaryCommand } from "@pro/commands/ai/generatePRSummary";
import { generateStandupCommand } from "@pro/commands/ai/generateStandup";
import { convertTodoToTicket } from "@commands/convertTodoToTicket";
import { TodoToTicketCodeActionProvider } from "@utils/todoCodeActionProvider";
import { showFirstTimeSetup } from "@providers/linear/firstTimeSetup";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";
import { DevBuddyChatParticipant } from "@chat/devBuddyParticipant";
import { LinearClient } from "@providers/linear/LinearClient";
import { LinearIssue } from "@providers/linear/types";
import { LinearTicketPanel } from "@providers/linear/LinearTicketPanel";
import { CreateTicketPanel } from "@providers/linear/CreateTicketPanel";
import { LinearStandupDataProvider } from "@providers/linear/LinearStandupDataProvider";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";
import { getLogger } from "@shared/utils/logger";
import { getTelemetryManager } from "@shared/utils/telemetryManager";
import { loadDevCredentials, showDevModeWarning } from "@shared/utils/devEnvLoader";
import { UniversalStandupBuilderPanel } from "@shared/views/UniversalStandupBuilderPanel";

// Jira imports
import { runJiraCloudSetup, testJiraCloudConnection, resetJiraCloudConfig, updateJiraCloudApiToken } from "@providers/jira/cloud/firstTimeSetup";
import { runJiraServerSetup, testJiraServerConnection, resetJiraServerConfig, updateJiraServerPassword, showJiraServerInfo } from "@providers/jira/server/firstTimeSetup";
import {
  openJiraIssue,
  updateJiraIssueStatus,
  assignJiraIssue,
  addJiraComment,
  copyJiraIssueUrl,
  copyJiraIssueKey,
} from "@commands/jira/issueCommands";
import { JiraIssue } from "@providers/jira/common/types";
import { JiraIssuePanel } from "@providers/jira/cloud/JiraIssuePanel";
import { JiraCreateTicketPanel } from "@providers/jira/cloud/JiraCreateTicketPanel";
import { JiraStandupDataProvider } from "@providers/jira/JiraStandupDataProvider";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";
import { getCurrentPlatform } from "@shared/utils/platformDetector";

export async function activate(context: vscode.ExtensionContext) {
  // Initialize logger first (must succeed)
  const logger = getLogger();
  
  // Get version and build information
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const packageJson = require('../package.json');
  const version = packageJson.version || 'unknown';
  const extensionMode = context.extensionMode;
  
  // Determine build type
  let buildType = '';
  if (extensionMode === vscode.ExtensionMode.Development) {
    buildType = ' (Development Build)';
  } else if (extensionMode === vscode.ExtensionMode.Test) {
    buildType = ' (Test Mode)';
  } else if (process.env.NODE_ENV === 'development') {
    buildType = ' (Dev Environment)';
  }
  
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logger.info(`🚀 DevBuddy v${version}${buildType}`);
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logger.info("Starting activation...");

  // Add output channel to disposables
  context.subscriptions.push(logger.getOutputChannel());

  // ==================== Register URI Handler ====================
  // Handle vscode://angelogirardi.dev-buddy/ URIs for external links
  const uriHandler = vscode.window.registerUriHandler({
    handleUri: async (uri: vscode.Uri) => {
      logger.info(`🔗 [URI Handler] Received URI: ${uri.toString()}`);
      logger.debug(`[URI Handler] Path: ${uri.path}`);
      logger.debug(`[URI Handler] Query: ${uri.query}`);
      
      try {
        // Parse the command from the path (e.g., /devBuddy.openTicketById)
        const commandId = uri.path.replace(/^\//, ''); // Remove leading slash
        logger.debug(`[URI Handler] Command ID: ${commandId}`);
        
        // Parse query parameters
        const params: Record<string, string> = {};
        if (uri.query) {
          const queryPairs = uri.query.split('&');
          for (const pair of queryPairs) {
            const [key, value] = pair.split('=');
            if (key && value) {
              params[key] = decodeURIComponent(value);
            }
          }
        }
        logger.debug(`[URI Handler] Parsed params: ${JSON.stringify(params)}`);
        
        // Execute the command with the parsed parameters
        if (commandId) {
          logger.info(`[URI Handler] Executing command: ${commandId}`);
          await vscode.commands.executeCommand(commandId, params);
        } else {
          logger.warn(`[URI Handler] No command ID found in URI path`);
        }
      } catch (error) {
        logger.error(`[URI Handler] Error handling URI: ${error}`);
        if (error instanceof Error) {
          logger.error(`[URI Handler] Stack trace: ${error.stack}`);
        }
        vscode.window.showErrorMessage(`Failed to handle URI: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  });
  context.subscriptions.push(uriHandler);
  logger.success("✅ URI handler registered");


  // ==================== Store Context Globally ====================
  // Store globally so firstTimeSetup and clients can access it (needed early)
  (global as any).devBuddyContext = context;
  
  // Declare variables that need to be accessible throughout
  let ticketsProvider: UniversalTicketsProvider | undefined;
  let telemetryManager: ReturnType<typeof getTelemetryManager> | undefined;

  // Load development credentials if in dev mode (non-blocking)
  loadDevCredentials(context).then(() => {
    showDevModeWarning();
  }).catch((error) => {
    logger.error("Failed to load dev credentials (non-critical)", error);
  });

  // Check for test mode: simulate fresh install
  if (process.env.DEVBUDDY_TEST_FRESH_INSTALL === "true") {
    logger.warn("TEST MODE: Simulating fresh install...");
    
    // Reset everything silently
    const secretsToDelete = ["linearApiToken", "jiraCloudApiToken", "jiraServerPassword"];
    for (const secret of secretsToDelete) {
      try {
        await context.secrets.delete(secret);
      } catch (error) {
        // Ignore errors
      }
    }
    
    const config = vscode.workspace.getConfiguration("devBuddy");
    const settingsToReset = [
      "provider", "linearOrganization", "linearTeamId", "linearDefaultTeamId",
      "jira.type", "jira.cloud.siteUrl", "jira.cloud.email", "jira.defaultProject",
      "ai.model", "ai.disabled", "writingTone", "branchNamingConvention",
      "firstTimeSetupComplete", "preferDesktopApp", "linkFormat",
      "telemetry.enabled", "telemetry.showPrompt"
    ];
    for (const setting of settingsToReset) {
      try {
        await config.update(setting, undefined, vscode.ConfigurationTarget.Global);
      } catch (error) {
        // Ignore errors  
      }
    }
    
    logger.info("Fresh install simulation complete");
  }

  // Initialize telemetry manager (non-blocking)
  try {
    telemetryManager = getTelemetryManager();
    telemetryManager.initialize(context);
    telemetryManager.trackEvent("extension_activated");

    // TODO: Re-enable telemetry prompt once Pro features are fully implemented
    // Show telemetry opt-in prompt after delay (non-blocking)
    // setTimeout(async () => {
    //   try {
    //     const config = vscode.workspace.getConfiguration("devBuddy");
    //     const showPrompt = config.get<boolean>("telemetry.showPrompt", true);
    //     
    //     if (showPrompt && telemetryManager && !(await telemetryManager.hasBeenAsked())) {
    //       await telemetryManager.showOptInPrompt();
    //     }
    //   } catch (error) {
    //     logger.error("Failed to show telemetry prompt (non-critical)", error);
    //   }
    // }, 10000);
  } catch (error) {
    logger.error("Failed to initialize telemetry (non-critical)", error);
  }

  // Initialize secure storage for Linear API token (must succeed)
  try {
    LinearClient.initializeSecretStorage(context.secrets);
  } catch (error) {
    logger.error("Failed to initialize Linear secret storage", error);
  }

  // Initialize Branch Association Manager (must succeed)
  const branchManager = new BranchAssociationManager(context);

  // Show first-time setup if needed (non-blocking)
  try {
    showFirstTimeSetup();
  } catch (error) {
    logger.error("Failed to show first-time setup (non-critical)", error);
  }

  // Development mode: Auto-open walkthrough or help menu (non-blocking)
  if (process.env.DEVBUDDY_OPEN_WALKTHROUGH === "true") {
    setTimeout(() => {
      vscode.commands.executeCommand(
        "workbench.action.openWalkthrough",
        "angelogirardi.dev-buddy#devBuddy.gettingStarted",
        false
      ).then(undefined, (error) => {
        logger.error("Failed to open walkthrough", error);
      });
    }, 1000);
  } else if (process.env.DEVBUDDY_OPEN_HELP === "true") {
    setTimeout(() => {
      vscode.commands.executeCommand("devBuddy.showHelp").then(undefined, (error) => {
        logger.error("Failed to open help", error);
      });
    }, 1000);
  }

  // ==================== Set Context Keys for UI ====================
  // These control when toolbar buttons and menus are visible
  const updateContextKeys = async () => {
    try {
      const config = vscode.workspace.getConfiguration("devBuddy");
      const provider = config.get<string>("provider");
      const hasProvider = !!provider;
      
      // Set context for whether any provider is configured
      await vscode.commands.executeCommand("setContext", "devBuddy.hasProvider", hasProvider);
      
      // Check if Linear is configured
      if (provider === "linear") {
        try {
          const linearToken = await LinearClient.getApiToken();
          await vscode.commands.executeCommand("setContext", "devBuddy.linearConfigured", !!linearToken);
        } catch (error) {
          logger.debug("Could not check Linear token status");
          await vscode.commands.executeCommand("setContext", "devBuddy.linearConfigured", false);
        }
      } else {
        await vscode.commands.executeCommand("setContext", "devBuddy.linearConfigured", false);
      }
      
      // Check if Jira is configured
      if (provider === "jira") {
        try {
          const jiraToken = await context.secrets.get("jiraCloudApiToken");
          await vscode.commands.executeCommand("setContext", "devBuddy.jiraConfigured", !!jiraToken);
        } catch (error) {
          logger.debug("Could not check Jira token status");
          await vscode.commands.executeCommand("setContext", "devBuddy.jiraConfigured", false);
        }
      } else {
        await vscode.commands.executeCommand("setContext", "devBuddy.jiraConfigured", false);
      }
      
      logger.debug(`Context keys updated: hasProvider=${hasProvider}, provider=${provider}`);
    } catch (error) {
      logger.error("Failed to update context keys (non-critical)", error);
    }
  };
  
  // Update context keys initially (non-blocking)
  updateContextKeys().catch((error) => {
    logger.error("Initial context key update failed (non-critical)", error);
  });
  
  // Update context keys when configuration changes
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("devBuddy.provider")) {
      updateContextKeys().catch((error) => {
        logger.error("Context key update on config change failed (non-critical)", error);
      });
    }
  });
  
  // Update context keys when secrets change (token added/removed)
  // This is just a placeholder for cleanup
  context.subscriptions.push({
    dispose: () => {
      logger.debug("Extension cleanup - context keys");
    }
  });

  // ==================== Initialize Universal Tickets Tree View (CRITICAL) ====================
  logger.info("Registering tree view provider...");
  try {
    ticketsProvider = new UniversalTicketsProvider(context);
    const treeView = vscode.window.createTreeView("myTickets", {
      treeDataProvider: ticketsProvider,
      showCollapseAll: true,
    });
    context.subscriptions.push(treeView);

    // Trigger refresh when the tree view becomes visible
    treeView.onDidChangeVisibility((e) => {
      if (e.visible) {
        logger.debug("Universal tree view became visible, triggering refresh");
        ticketsProvider?.refresh();
      }
    });
    
    // Update context keys when tree view refreshes (in case token was added)
    try {
      ticketsProvider.onDidRefresh(() => {
        updateContextKeys().catch((error) => {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.debug(`Context key update on refresh failed (non-critical): ${errorMsg}`);
        });
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.debug(`Could not register refresh listener (non-critical): ${errorMsg}`);
    }
    
    logger.success("Tree view registered successfully");
  } catch (error) {
    logger.error("CRITICAL: Failed to register tree view", error);
    vscode.window.showErrorMessage(
      `DevBuddy: Failed to initialize sidebar. Please check the Output panel (DevBuddy channel) for details.`,
      "Open Output",
      "Reload Window"
    ).then(selection => {
      if (selection === "Open Output") {
        logger.show();
      } else if (selection === "Reload Window") {
        vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    });
    
    // Don't return - continue to register commands so at least those work
  }

  // Initialize Chat Participant (optional, may not be available)
  try {
    const chatParticipant = new DevBuddyChatParticipant();
    context.subscriptions.push(chatParticipant.register(context));
    logger.info("Chat participant registered successfully");
  } catch (error) {
    // Chat participant might not be available in all VS Code versions
    logger.debug("Chat participant not available (this is OK)");
  }

  // Register Language Model Tools (enables other AI agents to access DevBuddy data)
  // Requires VS Code 1.93+ - now enabled!
  try {
    logger.info("🔧 Attempting to register Language Model Tools...");
    
    // Tool 1: Get specific ticket by ID
    const getTicketTool = vscode.lm.registerTool('devbuddy_get_ticket', {
      invoke: async (options: vscode.LanguageModelToolInvocationOptions<{ ticketId: string }>, token: vscode.CancellationToken) => {
        try {
          const { ticketId } = options.input;
          logger.info(`🎫 [LM Tool] devbuddy_get_ticket invoked with ticketId: ${ticketId}`);
          logger.debug(`[LM Tool] Full input: ${JSON.stringify(options.input)}`);
          
          const currentPlatform = await getCurrentPlatform();
          logger.debug(`[LM Tool] Current platform: ${currentPlatform}`);
          
          if (currentPlatform === "linear") {
            const client = await LinearClient.create();
            logger.debug(`[LM Tool] Linear client configured: ${client.isConfigured()}`);
            
            const ticket = await client.getIssue(ticketId);
            if (!ticket) {
              logger.warn(`[LM Tool] Ticket ${ticketId} not found in Linear`);
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Ticket ${ticketId} not found`)
              ]);
            }
            
            const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(ticket.identifier)}`;
            const result = {
              id: ticket.identifier,
              title: ticket.title,
              description: ticket.description,
              status: ticket.state.name,
              priority: ticket.priority,
              assignee: ticket.assignee?.name,
              labels: ticket.labels?.map(l => l.name),
              url: ticket.url,
              platform: "Linear",
              openInDevBuddy: `[Open in DevBuddy](${commandUri})`
            };
            
            logger.success(`[LM Tool] Successfully fetched ticket ${ticketId} from Linear`);
            logger.debug(`[LM Tool] Result: ${JSON.stringify(result)}`);
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
          } else if (currentPlatform === "jira") {
            const client = await JiraCloudClient.create();
            logger.debug(`[LM Tool] Jira client configured: ${client.isConfigured()}`);
            
            const ticket = await client.getIssue(ticketId);
            if (!ticket) {
              logger.warn(`[LM Tool] Ticket ${ticketId} not found in Jira`);
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Ticket ${ticketId} not found`)
              ]);
            }
            
            const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(ticket.key)}`;
            const result = {
              id: ticket.key,
              title: ticket.summary,
              description: ticket.description,
              status: ticket.status.name,
              priority: ticket.priority?.name,
              assignee: ticket.assignee?.displayName,
              labels: ticket.labels,
              url: ticket.url,
              platform: "Jira",
              openInDevBuddy: `[Open in DevBuddy](${commandUri})`
            };
            
            logger.success(`[LM Tool] Successfully fetched ticket ${ticketId} from Jira`);
            logger.debug(`[LM Tool] Result: ${JSON.stringify(result)}`);
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
          }
          
          logger.warn(`[LM Tool] No platform configured`);
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart("No platform configured")
          ]);
        } catch (error) {
          logger.error(`[LM Tool] Error in devbuddy_get_ticket: ${error}`);
          if (error instanceof Error) {
            logger.error(`[LM Tool] Stack trace: ${error.stack}`);
          }
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`Error fetching ticket: ${error instanceof Error ? error.message : "Unknown error"}`)
          ]);
        }
      }
    });
    context.subscriptions.push(getTicketTool);
    logger.success("✅ Registered tool: devbuddy_get_ticket");

    // Tool 2: List user's active tickets
    const listTicketsTool = vscode.lm.registerTool('devbuddy_list_my_tickets', {
      invoke: async (options: vscode.LanguageModelToolInvocationOptions<object>, token: vscode.CancellationToken) => {
        try {
          logger.info(`📋 [LM Tool] devbuddy_list_my_tickets invoked`);
          
          const currentPlatform = await getCurrentPlatform();
          logger.debug(`[LM Tool] Current platform: ${currentPlatform}`);
          
          if (currentPlatform === "linear") {
            const client = await LinearClient.create();
            if (!client.isConfigured()) {
              logger.warn(`[LM Tool] Linear not configured`);
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart("Linear not configured. Please run 'DevBuddy: Configure Linear' first.")
              ]);
            }
            
            logger.debug(`[LM Tool] Fetching Linear issues...`);
            const tickets = await client.getMyIssues({ state: ["unstarted", "started"] });
            logger.debug(`[LM Tool] Found ${tickets.length} Linear tickets`);
            
            if (tickets.length === 0) {
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart("No active tickets found")
              ]);
            }
            
            const ticketList = tickets.slice(0, 20).map(t => {
              const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(t.identifier)}`;
              return {
                id: t.identifier,
                title: t.title,
                status: t.state.name,
                priority: t.priority,
                url: t.url,
                openInDevBuddy: `[Open in DevBuddy](${commandUri})`
              };
            });
            
            const result = {
              platform: "Linear",
              count: tickets.length,
              tickets: ticketList
            };
            
            logger.success(`[LM Tool] Successfully listed ${tickets.length} Linear tickets`);
            logger.debug(`[LM Tool] First 3 tickets: ${JSON.stringify(ticketList.slice(0, 3))}`);
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
          } else if (currentPlatform === "jira") {
            const client = await JiraCloudClient.create();
            if (!client.isConfigured()) {
              logger.warn(`[LM Tool] Jira not configured`);
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart("Jira not configured. Please run 'DevBuddy: Configure Jira Cloud' first.")
              ]);
            }
            
            logger.debug(`[LM Tool] Fetching Jira issues...`);
            const tickets = await client.getMyIssues();
            logger.debug(`[LM Tool] Found ${tickets.length} Jira tickets`);
            
            if (tickets.length === 0) {
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart("No active tickets found")
              ]);
            }
            
            const ticketList = tickets.slice(0, 20).map(t => {
              const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(t.key)}`;
              return {
                id: t.key,
                title: t.summary,
                status: t.status.name,
                priority: t.priority?.name,
                url: t.url,
                openInDevBuddy: `[Open in DevBuddy](${commandUri})`
              };
            });
            
            const result = {
              platform: "Jira",
              count: tickets.length,
              tickets: ticketList
            };
            
            logger.success(`[LM Tool] Successfully listed ${tickets.length} Jira tickets`);
            logger.debug(`[LM Tool] First 3 tickets: ${JSON.stringify(ticketList.slice(0, 3))}`);
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
          }
          
          logger.warn(`[LM Tool] No platform configured`);
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart("No platform configured")
          ]);
        } catch (error) {
          logger.error(`[LM Tool] Error in devbuddy_list_my_tickets: ${error}`);
          if (error instanceof Error) {
            logger.error(`[LM Tool] Stack trace: ${error.stack}`);
          }
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`Error listing tickets: ${error instanceof Error ? error.message : "Unknown error"}`)
          ]);
        }
      }
    });
    context.subscriptions.push(listTicketsTool);
    logger.success("✅ Registered tool: devbuddy_list_my_tickets");

    // Tool 3: Get ticket for current branch
    const getCurrentTicketTool = vscode.lm.registerTool('devbuddy_get_current_ticket', {
      invoke: async (options: vscode.LanguageModelToolInvocationOptions<object>, token: vscode.CancellationToken) => {
        try {
          logger.info(`🌿 [LM Tool] devbuddy_get_current_ticket invoked`);
          
          const branchManager = new BranchAssociationManager(context);
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            logger.warn(`[LM Tool] No workspace folder open`);
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart("No workspace folder open")
            ]);
          }
          
          logger.debug(`[LM Tool] Workspace: ${workspaceFolder.uri.fsPath}`);
          
          // Get current branch
          const { default: simpleGit } = await import('simple-git');
          const git = simpleGit(workspaceFolder.uri.fsPath);
          const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
          
          logger.debug(`[LM Tool] Current branch: ${currentBranch}`);
          
          if (!currentBranch || currentBranch === 'HEAD') {
            logger.warn(`[LM Tool] Not on a valid branch`);
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart("Not on a valid branch")
            ]);
          }
          
          // Check for associated ticket
          let ticketId = branchManager.getTicketForBranch(currentBranch);
          logger.debug(`[LM Tool] Branch association found: ${ticketId || 'none'}`);
          
          if (!ticketId) {
            // Try to auto-detect from branch name using GitAnalyzer
            const { GitAnalyzer } = await import('@shared/git/gitAnalyzer');
            const gitAnalyzer = new GitAnalyzer(workspaceFolder.uri.fsPath);
            ticketId = gitAnalyzer.extractTicketId(currentBranch);
            
            logger.debug(`[LM Tool] Auto-detected ticket ID from branch name: ${ticketId || 'none'}`);
            
            if (!ticketId) {
              // No ticket in branch name - fall back to "In Progress" tickets
              logger.debug(`[LM Tool] No ticket in branch name, checking In Progress tickets...`);
              
              const currentPlatform = await getCurrentPlatform();
              let inProgressTickets: any[] = [];
              
              try {
                if (currentPlatform === "linear") {
                  const client = await LinearClient.create();
                  if (client.isConfigured()) {
                    inProgressTickets = await client.getMyIssues({ state: ["started"] });
                    logger.debug(`[LM Tool] Found ${inProgressTickets.length} Linear tickets in "Started" state`);
                  }
                } else if (currentPlatform === "jira") {
                  const client = await JiraCloudClient.create();
                  if (client.isConfigured()) {
                    const allIssues = await client.getMyIssues();
                    // Filter for "In Progress" status
                    inProgressTickets = allIssues.filter(issue => 
                      issue.status?.name && (
                        issue.status.name.toLowerCase().includes("in progress") ||
                        issue.status.name.toLowerCase().includes("in dev") ||
                        issue.status.name.toLowerCase() === "doing"
                      )
                    );
                    logger.debug(`[LM Tool] Found ${inProgressTickets.length} Jira tickets in progress`);
                  }
                }
                
                if (inProgressTickets.length === 1) {
                  // Exactly one "In Progress" ticket - that's probably what they're working on
                  const ticket = inProgressTickets[0];
                  ticketId = currentPlatform === "linear" ? ticket.identifier : ticket.key;
                  logger.info(`✨ [LM Tool] Found 1 In Progress ticket: ${ticketId} (inferred from status)`);
                  
            const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(ticketId!)}`;
            const result = {
              source: "in_progress_status",
              branch: currentBranch,
              ticketId: ticketId,
              title: currentPlatform === "linear" ? ticket.title : ticket.summary,
              description: ticket.description || "",
              status: currentPlatform === "linear" ? ticket.state?.name : ticket.status?.name,
              priority: currentPlatform === "linear" ? ticket.priority : ticket.priority?.name,
              assignee: currentPlatform === "linear" ? ticket.assignee?.name : ticket.assignee?.displayName,
              url: ticket.url || "",
              platform: currentPlatform === "linear" ? "Linear" : "Jira",
              note: `Inferred from ticket status (branch "${currentBranch}" has no ticket ID)`,
              openInDevBuddy: `[Open in DevBuddy](${commandUri})`
            };
                  
                  return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                  ]);
                } else if (inProgressTickets.length > 1) {
                  // Multiple "In Progress" tickets - list them all
                  logger.info(`📋 [LM Tool] Found ${inProgressTickets.length} In Progress tickets`);
                  
                  const ticketList = inProgressTickets.map(ticket => {
                    const ticketId = currentPlatform === "linear" ? ticket.identifier : ticket.key;
                    const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(ticketId)}`;
                    return {
                      ticketId,
                      title: currentPlatform === "linear" ? ticket.title : ticket.summary,
                      priority: currentPlatform === "linear" ? ticket.priority : ticket.priority?.name,
                      url: ticket.url || "",
                      openInDevBuddy: `[Open in DevBuddy](${commandUri})`
                    };
                  });
                  
                  const result = {
                    source: "multiple_in_progress",
                    branch: currentBranch,
                    count: inProgressTickets.length,
                    tickets: ticketList,
                    platform: currentPlatform === "linear" ? "Linear" : "Jira",
                    note: `Multiple tickets in progress. Create a branch with a ticket ID to track specific work.`
                  };
                  
                  return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                  ]);
                }
              } catch (fallbackError) {
                logger.error(`[LM Tool] Error fetching In Progress tickets: ${fallbackError}`);
                // Continue to original error message
              }
              
              // No ticket found anywhere
              logger.warn(`[LM Tool] No ticket associated with branch "${currentBranch}" and no In Progress tickets`);
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`No active ticket found. Branch "${currentBranch}" has no ticket ID and you have no tickets marked as "In Progress". Either create a branch with a ticket ID (e.g., "feat/ENG-123-description") or update a ticket status to "In Progress".`)
              ]);
            }
          }
          
          // Fetch the ticket details
          const currentPlatform = await getCurrentPlatform();
          logger.debug(`[LM Tool] Platform: ${currentPlatform}, Ticket ID: ${ticketId}`);
          
          if (currentPlatform === "linear") {
            const client = await LinearClient.create();
            const ticket = await client.getIssue(ticketId);
            if (!ticket) {
              logger.warn(`[LM Tool] Ticket ${ticketId} not found in Linear`);
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Ticket ${ticketId} not found (associated with branch "${currentBranch}")`)
              ]);
            }
            
            const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(ticket.identifier)}`;
            const result = {
              source: "branch",
              branch: currentBranch,
              ticketId: ticket.identifier,
              title: ticket.title,
              description: ticket.description,
              status: ticket.state.name,
              priority: ticket.priority,
              assignee: ticket.assignee?.name,
              url: ticket.url,
              platform: "Linear",
              openInDevBuddy: `[Open in DevBuddy](${commandUri})`
            };
            
            logger.success(`[LM Tool] Successfully fetched current ticket: ${ticket.identifier}`);
            logger.debug(`[LM Tool] Result: ${JSON.stringify(result)}`);
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
          } else if (currentPlatform === "jira") {
            const client = await JiraCloudClient.create();
            const ticket = await client.getIssue(ticketId);
            if (!ticket) {
              logger.warn(`[LM Tool] Ticket ${ticketId} not found in Jira`);
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Ticket ${ticketId} not found (associated with branch "${currentBranch}")`)
              ]);
            }
            
            const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(ticket.key)}`;
            const result = {
              source: "branch",
              branch: currentBranch,
              ticketId: ticket.key,
              title: ticket.summary,
              description: ticket.description,
              status: ticket.status.name,
              priority: ticket.priority?.name,
              assignee: ticket.assignee?.displayName,
              url: ticket.url,
              platform: "Jira",
              openInDevBuddy: `[Open in DevBuddy](${commandUri})`
            };
            
            logger.success(`[LM Tool] Successfully fetched current ticket: ${ticket.key}`);
            logger.debug(`[LM Tool] Result: ${JSON.stringify(result)}`);
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
          }
          
          logger.warn(`[LM Tool] No platform configured`);
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart("No platform configured")
          ]);
        } catch (error) {
          logger.error(`[LM Tool] Error in devbuddy_get_current_ticket: ${error}`);
          if (error instanceof Error) {
            logger.error(`[LM Tool] Stack trace: ${error.stack}`);
          }
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`Error getting current ticket: ${error instanceof Error ? error.message : "Unknown error"}`)
          ]);
        }
      }
    });
    context.subscriptions.push(getCurrentTicketTool);
    logger.success("✅ Registered tool: devbuddy_get_current_ticket");

    logger.info("✨ Language Model Tools registered successfully (3 tools available for AI agents)");
    logger.info("🔍 To enable debug mode and see tool invocations, go to Settings → DevBuddy: Debug Mode → Enable");
  } catch (error) {
    // Language Model Tools might not be available in all VS Code versions
    logger.error(`❌ Failed to register Language Model Tools: ${error}`);
    if (error instanceof Error) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    logger.debug(`Language Model Tools not available (this may be OK if VS Code < 1.93.0)`);
  }

  // Register Code Action Provider for TODOs (should succeed)
  try {
    const todoCodeActionProvider = vscode.languages.registerCodeActionsProvider(
      { scheme: "file" },
      new TodoToTicketCodeActionProvider(),
      {
        providedCodeActionKinds:
          TodoToTicketCodeActionProvider.providedCodeActionKinds,
      }
    );
    context.subscriptions.push(todoCodeActionProvider);
    logger.info("TODO code action provider registered successfully");
  } catch (error) {
    logger.error("Failed to register TODO code action provider", error);
  }

  // ==================== Register Commands (CRITICAL) ====================
  logger.info("Registering commands...");

  // Register existing commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devBuddy.generatePRSummary",
      generatePRSummaryCommand
    ),
    vscode.commands.registerCommand(
      "devBuddy.generateStandup",
      generateStandupCommand
    ),
    vscode.commands.registerCommand("devBuddy.openStandupBuilder", async () => {
      // Get the current platform and create appropriate data provider
      const platform = getCurrentPlatform();
      let dataProvider;
      
      if (platform === "jira") {
        dataProvider = new JiraStandupDataProvider();
        await dataProvider.initialize();
      } else {
        // Default to Linear
        dataProvider = new LinearStandupDataProvider();
        await dataProvider.initialize();
      }
      
      await UniversalStandupBuilderPanel.createOrShow(context.extensionUri, dataProvider);
    }),
    vscode.commands.registerCommand("devBuddy.createTicket", () => {
      const platform = getCurrentPlatform();
      
      if (platform === "jira") {
        JiraCreateTicketPanel.createOrShow(context.extensionUri);
      } else {
        // Default to Linear
        CreateTicketPanel.createOrShow(context.extensionUri);
      }
    }),

    // Beta: Convert TODO to Linear Ticket
    vscode.commands.registerCommand(
      "devBuddy.convertTodoToTicket",
      convertTodoToTicket
    )
  );

  // Register new Linear commands
  context.subscriptions.push(
    vscode.commands.registerCommand("devBuddy.refreshTickets", () => {
      ticketsProvider?.refresh();
    }),

    vscode.commands.registerCommand(
      "devBuddy.openTicket",
      async (issue: LinearIssue) => {
        if (issue && issue.id) {
          // Open in webview panel instead of browser
          await LinearTicketPanel.createOrShow(
            context.extensionUri,
            issue,
            context
          );
        }
      }
    ),

    // Open ticket by ID (for AI agent command URIs)
    vscode.commands.registerCommand(
      "devBuddy.openTicketById",
      async (ticketIdOrParams: string | { ticketId: string }) => {
        // Handle both direct string and URI query parameter object
        const ticketId = typeof ticketIdOrParams === 'string' 
          ? ticketIdOrParams 
          : ticketIdOrParams.ticketId;
        
        logger.info(`🎫 [Command] openTicketById called with: ${JSON.stringify(ticketIdOrParams)}`);
        logger.debug(`[Command] Parsed ticketId: ${ticketId}`);
        logger.debug(`[Command] ticketId type: ${typeof ticketId}`);
        
        if (!ticketId) {
          vscode.window.showErrorMessage("No ticket ID provided");
          logger.error(`[Command] No ticketId found in parameters`);
          return;
        }
        
        try {
          const platform = await getCurrentPlatform();
          logger.debug(`[Command] Platform: ${platform}`);
          
          if (platform === "linear") {
            const client = await LinearClient.create();
            if (!client.isConfigured()) {
              vscode.window.showErrorMessage("Linear not configured");
              return;
            }
            
            logger.debug(`[Command] Fetching Linear ticket: ${ticketId}`);
            const ticket = await client.getIssue(ticketId);
            if (!ticket) {
              vscode.window.showErrorMessage(`Ticket ${ticketId} not found`);
              return;
            }
            
            logger.success(`[Command] Opening Linear ticket panel for ${ticketId}`);
            await LinearTicketPanel.createOrShow(
              context.extensionUri,
              ticket,
              context
            );
          } else if (platform === "jira") {
            const client = await JiraCloudClient.create();
            if (!client.isConfigured()) {
              vscode.window.showErrorMessage("Jira not configured");
              return;
            }
            
            logger.debug(`[Command] Fetching Jira ticket: ${ticketId}`);
            const ticket = await client.getIssue(ticketId);
            if (!ticket) {
              vscode.window.showErrorMessage(`Ticket ${ticketId} not found`);
              return;
            }
            
            logger.success(`[Command] Opening Jira ticket panel for ${ticketId}`);
            await JiraIssuePanel.createOrShow(
              context.extensionUri,
              ticket,
              context
            );
          } else {
            vscode.window.showErrorMessage("No ticket platform configured");
          }
        } catch (error) {
          logger.error(`[Command] Error opening ticket ${ticketId}:`, error);
          vscode.window.showErrorMessage(`Failed to open ticket: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    ),

    vscode.commands.registerCommand(
      "devBuddy.startWork",
      async (item: { issue?: LinearIssue }) => {
        const issue = item.issue;
        if (!issue) return;

        const linearClient = await LinearClient.create();
        const states = await linearClient.getWorkflowStates();
        const inProgressState = states.find(
          (s) =>
            s.type === "started" || s.name.toLowerCase().includes("progress")
        );

        if (inProgressState) {
          const success = await linearClient.updateIssueStatus(
            issue.id,
            inProgressState.id
          );
          if (success) {
            vscode.window.showInformationMessage(
              `Started work on ${issue.identifier}`
            );
            ticketsProvider?.refresh();
          }
        } else {
          vscode.window.showWarningMessage(
            "Could not find 'In Progress' state"
          );
        }
      }
    ),

    vscode.commands.registerCommand(
      "devBuddy.completeTicket",
      async (item: { issue?: LinearIssue }) => {
        const issue = item.issue;
        if (!issue) return;

        const linearClient = await LinearClient.create();
        const states = await linearClient.getWorkflowStates();
        const completedState = states.find(
          (s) => s.type === "completed" || s.name.toLowerCase().includes("done")
        );

        if (completedState) {
          const success = await linearClient.updateIssueStatus(
            issue.id,
            completedState.id
          );
          if (success) {
            vscode.window.showInformationMessage(
              `Completed ${issue.identifier}! 🎉`
            );
            ticketsProvider?.refresh();
          }
        } else {
          vscode.window.showWarningMessage("Could not find 'Completed' state");
        }
      }
    ),

    vscode.commands.registerCommand("devBuddy.debugToken", async () => {
      try {
        const token = await LinearClient.getApiToken();
        const hasToken = token && token.length > 0;
        const tokenPreview = hasToken
          ? `${token.substring(0, 10)}...${token.substring(token.length - 4)}`
          : "No token found";

        vscode.window.showInformationMessage(
          `Token Status: ${
            hasToken ? "✅ Found" : "❌ Not Found"
          }\n${tokenPreview}`,
          {
            modal: true,
            detail: `Token length: ${token.length} characters`,
          }
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Debug error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }),

    vscode.commands.registerCommand(
      "devBuddy.configureLinearToken",
      async () => {
        const config = vscode.workspace.getConfiguration("devBuddy");
        let org = config.get<string>("linearOrganization");

        // If no organization stored, ask for a Linear URL first
        if (!org) {
          const linearUrl = await vscode.window.showInputBox({
            prompt:
              "Enter any URL from your Linear workspace (e.g., a ticket or project URL)",
            placeHolder: "https://linear.app/yourorg/issue/...",
            ignoreFocusOut: true,
            validateInput: (value) => {
              if (!value) {
                return "Please enter a URL from your Linear workspace";
              }
              // Basic validation
              if (!value.includes("linear.app/")) {
                return "Please enter a valid Linear URL";
              }
              return null;
            },
          });

          if (linearUrl) {
            // Parse organization from URL
            const match = linearUrl
              .replace(/^https?:\/\//, "")
              .replace(/^www\./, "")
              .match(/^linear\.app\/([^/]+)/);
            if (match) {
              org = match[1];
              await config.update(
                "linearOrganization",
                org,
                vscode.ConfigurationTarget.Global
              );
            }
          } else {
            return; // User cancelled
          }
        }

        // Provide direct link to API key settings
        if (org) {
          const apiKeyUrl = `https://linear.app/${org}/settings/account/security`;
          const openSettings = await vscode.window.showInformationMessage(
            `Get your Linear API key from your security settings`,
            "Open API Key Settings",
            "I already have my key"
          );

          if (openSettings === "Open API Key Settings") {
            await vscode.env.openExternal(vscode.Uri.parse(apiKeyUrl));
            await vscode.window.showInformationMessage(
              "Copy your Personal API Key from the security settings page, then click Continue",
              "Continue"
            );
          } else if (openSettings !== "I already have my key") {
            return; // User cancelled
          }
        }

        const token = await vscode.window.showInputBox({
          prompt: "Enter your Linear API token",
          placeHolder: "lin_api_...",
          password: true,
          ignoreFocusOut: true,
          validateInput: (value) => {
            if (!value || value.length < 10) {
              return "Please enter a valid Linear API token";
            }
            return null;
          },
        });

        if (token) {
          // Store in secure storage
          await LinearClient.setApiToken(token);

          vscode.window.showInformationMessage(
            "Linear API token configured securely! 🎉"
          );
          ticketsProvider?.refresh();
        }
      }
    ),

    vscode.commands.registerCommand(
      "devBuddy.changeTicketStatus",
      async (item: { issue?: LinearIssue }) => {
        const issue = item.issue;
        if (!issue) return;

        try {
          // Fetch the full issue details
          const linearClient = await LinearClient.create();
          const fullIssue = await linearClient.getIssue(issue.id);

          if (!fullIssue) {
            vscode.window.showErrorMessage("Could not fetch ticket details");
            return;
          }

          // Get workflow states filtered by team
          // Note: Linear API doesn't expose workflow groupings, so we show all states for the team
          const availableStates = await linearClient.getWorkflowStates(
            fullIssue.team?.id
          );

          if (!availableStates || availableStates.length === 0) {
            vscode.window.showErrorMessage("No workflow states available");
            return;
          }

          logger.debug(
            `Showing ${availableStates.length} workflow states for ${
              fullIssue.identifier
            } (team: ${fullIssue.team?.name || "default"})`
          );

          // Create QuickPick items with icons based on state type
          const stateItems = availableStates.map((state) => {
            let icon = "$(circle)";
            let description = "";

            switch (state.type) {
              case "backlog":
                icon = "$(layers)";
                description = "Backlog";
                break;
              case "unstarted":
                icon = "$(circle-outline)";
                description = "Todo";
                break;
              case "started":
                icon = "$(play-circle)";
                description = "In Progress";
                break;
              case "completed":
                icon = "$(check-all)";
                description = "Done";
                break;
              case "canceled":
                icon = "$(circle-slash)";
                description = "Canceled";
                break;
              case "triage":
                icon = "$(milestone)";
                description = "Triage";
                break;
            }

            return {
              label: `${icon} ${state.name}`,
              description:
                state.name === fullIssue.state.name
                  ? "$(check) Current"
                  : description,
              state: state,
            };
          });

          // Show QuickPick
          const selected = await vscode.window.showQuickPick(stateItems, {
            placeHolder: `Change status for ${issue.identifier}`,
            ignoreFocusOut: true,
          });

          if (!selected) {
            return; // User cancelled
          }

          // Update status
          const success = await linearClient.updateIssueStatus(
            issue.id,
            selected.state.id
          );

          if (success) {
            vscode.window.showInformationMessage(
              `${issue.identifier} status updated to ${selected.state.name} ✓`
            );
            ticketsProvider?.refresh();
          } else {
            vscode.window.showErrorMessage(
              "Failed to update status. This transition may not be allowed by your workflow."
            );
          }
        } catch (error) {
          console.error("[DevBuddy] Failed to change status:", error);
          vscode.window.showErrorMessage(
            `Failed to change status: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    vscode.commands.registerCommand(
      "devBuddy.startBranch",
      async (item: { issue?: LinearIssue | JiraIssue }) => {
        const currentPlatform = getCurrentPlatform();
        
        // Extract issue/ticket data based on platform
        let identifier: string;
        let title: string;
        let labels: Array<{ name: string }>;
        let issueId: string;
        
        if (currentPlatform === "linear") {
          const issue = item.issue as LinearIssue | undefined;
          if (!issue) return;
          identifier = issue.identifier;
          title = issue.title;
          labels = issue.labels || [];
          issueId = issue.id;
        } else if (currentPlatform === "jira") {
          const issue = item.issue as JiraIssue | undefined;
          if (!issue) return;
          identifier = issue.key;
          title = issue.summary;
          labels = issue.labels.map(label => ({ name: label }));
          issueId = issue.id;
        } else {
          vscode.window.showErrorMessage("Unsupported platform for branch creation");
          return;
        }

        try {
          // Initialize git
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const simpleGit = require("simple-git");
          const workspaceFolders = vscode.workspace.workspaceFolders;

          if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("No workspace folder open");
            return;
          }

          const git = simpleGit(workspaceFolders[0].uri.fsPath);

          // Check if git repository exists
          const isRepo = await git.checkIsRepo();
          if (!isRepo) {
            vscode.window.showErrorMessage(
              "Current workspace is not a git repository"
            );
            return;
          }

          // Get all branches and current branch
          const branchSummary = await git.branch();
          const currentBranch = branchSummary.current;
          const allBranches = branchSummary.all;

          // Step 1: Select source branch (with dropdown + text input)
          const sourceBranch = await new Promise<string | undefined>(
            (resolve) => {
              const quickPick = vscode.window.createQuickPick();
              quickPick.title = `Select source branch for ${identifier}`;
              quickPick.placeholder =
                "Type to search or enter a custom branch name";
              quickPick.value = currentBranch; // Default to current branch

              // Create items for all branches
              quickPick.items = allBranches.map((branch: string) => ({
                label: branch,
                description:
                  branch === currentBranch ? "$(check) Current branch" : "",
                alwaysShow: branch === currentBranch,
              }));

              // Highlight current branch at the top
              const currentBranchItem = quickPick.items.find(
                (item) => item.label === currentBranch
              );
              if (currentBranchItem) {
                quickPick.activeItems = [currentBranchItem];
              }

              quickPick.onDidAccept(() => {
                const selected = quickPick.selectedItems[0];
                // If user selected an item, use it; otherwise use the typed value
                resolve(selected ? selected.label : quickPick.value);
                quickPick.hide();
              });

              quickPick.onDidHide(() => {
                resolve(undefined);
                quickPick.dispose();
              });

              quickPick.show();
            }
          );

          if (!sourceBranch) {
            return; // User cancelled
          }

          // Verify source branch exists
          if (!allBranches.includes(sourceBranch)) {
            vscode.window.showErrorMessage(
              `Source branch '${sourceBranch}' does not exist`
            );
            return;
          }

          // Generate default branch name based on convention
          const config = vscode.workspace.getConfiguration("devBuddy");
          const convention = config.get<string>(
            "branchNamingConvention",
            "conventional"
          );
          const customTemplate = config.get<string>(
            "customBranchTemplate",
            "{type}/{identifier}-{slug}"
          );

          // Determine the conventional commit type from the issue labels or default to 'feat'
          let commitType = "feat";
          if (labels && labels.length > 0) {
            const labelName = labels[0].name.toLowerCase();
            if (["bug", "bugfix", "fix"].includes(labelName)) {
              commitType = "fix";
            } else if (["chore", "maintenance"].includes(labelName)) {
              commitType = "chore";
            } else if (["docs", "documentation"].includes(labelName)) {
              commitType = "docs";
            } else if (["test", "testing"].includes(labelName)) {
              commitType = "test";
            } else if (["refactor", "refactoring"].includes(labelName)) {
              commitType = "refactor";
            }
          }

          // Create a slug from the title
          const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .substring(0, 50); // Limit length

          let defaultBranchName: string;

          switch (convention) {
            case "conventional":
              defaultBranchName = `${commitType}/${identifier.toLowerCase()}-${slug}`;
              break;
            case "simple":
              defaultBranchName = `${identifier.toLowerCase()}-${slug}`;
              break;
            case "custom": {
              // Get current username from git config
              let username = "user";
              try {
                const userName = await git.raw(["config", "user.name"]);
                username = userName
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-");
              } catch (error) {
                // Ignore errors and use default
              }

              defaultBranchName = customTemplate
                .replace("{type}", commitType)
                .replace("{identifier}", identifier.toLowerCase())
                .replace("{slug}", slug)
                .replace("{username}", username);
              break;
            }
            default:
              defaultBranchName = `${commitType}/${identifier.toLowerCase()}-${slug}`;
          }

          // Step 2: Enter new branch name
          const branchName = await vscode.window.showInputBox({
            prompt: `Create a new branch for ${identifier} from '${sourceBranch}'`,
            placeHolder: defaultBranchName,
            value: defaultBranchName,
            ignoreFocusOut: true,
            validateInput: (value) => {
              if (!value || value.trim().length === 0) {
                return "Branch name cannot be empty";
              }
              // Check for invalid git branch characters
              // eslint-disable-next-line no-useless-escape
              if (/[\s~^:?*\[\]\\]/.test(value)) {
                return "Branch name contains invalid characters";
              }
              return null;
            },
          });

          if (!branchName) {
            return; // User cancelled
          }

          // Check if branch already exists
          if (allBranches.includes(branchName)) {
            const shouldCheckout = await vscode.window.showWarningMessage(
              `Branch '${branchName}' already exists. Do you want to check it out?`,
              "Yes",
              "No"
            );

            if (shouldCheckout === "Yes") {
              await git.checkout(branchName);
              vscode.window.showInformationMessage(
                `Checked out existing branch: ${branchName}`
              );
              // Associate the branch with the ticket
              await branchManager.associateBranch(identifier, branchName);
            }
            return;
          }

          // Show progress notification
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Creating branch: ${branchName} from ${sourceBranch}`,
              cancellable: false,
            },
            async (progress) => {
              progress.report({ increment: 0, message: "Creating branch..." });

              // Checkout source branch first if not already on it
              if (currentBranch !== sourceBranch) {
                await git.checkout(sourceBranch);
              }

              // Create and checkout the new branch from source
              await git.checkoutLocalBranch(branchName);

              progress.report({ increment: 100 });
            }
          );

          // Associate the branch with the ticket
          await branchManager.associateBranch(identifier, branchName);

          vscode.window.showInformationMessage(
            `Branch '${branchName}' created from '${sourceBranch}' and checked out! 🚀`
          );

          // Optionally update the issue status to "In Progress"
          const shouldUpdateStatus = await vscode.window.showInformationMessage(
            `Do you want to mark ${identifier} as "In Progress"?`,
            "Yes",
            "No"
          );

          if (shouldUpdateStatus === "Yes") {
            if (currentPlatform === "linear") {
              const linearClient = await LinearClient.create();
              const states = await linearClient.getWorkflowStates();
              const inProgressState = states.find(
                (s) =>
                  s.type === "started" ||
                  s.name.toLowerCase().includes("progress")
              );

              if (inProgressState) {
                const success = await linearClient.updateIssueStatus(
                  issueId,
                  inProgressState.id
                );
                if (success) {
                  vscode.window.showInformationMessage(
                    `${identifier} status updated to In Progress`
                  );
                  ticketsProvider?.refresh();
                }
              }
            } else if (currentPlatform === "jira") {
              const jiraClient = await JiraCloudClient.create();
              const transitions = await jiraClient.getTransitions(identifier);
              const inProgressTransition = transitions.find(
                (t: any) => 
                  t.to.name.toLowerCase().includes("progress") ||
                  t.to.name.toLowerCase().includes("doing")
              );

              if (inProgressTransition) {
                const success = await jiraClient.transitionIssue(
                  identifier,
                  inProgressTransition.id
                );
                if (success) {
                  vscode.window.showInformationMessage(
                    `${identifier} status updated to In Progress`
                  );
                  ticketsProvider?.refresh();
                }
              }
            }
          }
        } catch (error) {
          console.error("[DevBuddy] Failed to create branch:", error);
          vscode.window.showErrorMessage(
            `Failed to create branch: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    vscode.commands.registerCommand("devBuddy.openPR", async (item: { issue?: LinearIssue }) => {
      const issue = item.issue;
      if (!issue) return;

      try {
        // Find PR attachments (GitHub, GitLab, etc.)
        const attachmentNodes = issue.attachments?.nodes || [];
        const prAttachments = attachmentNodes.filter(
          (att) =>
            att.sourceType &&
            (att.sourceType.toLowerCase().includes("github") ||
              att.sourceType.toLowerCase().includes("gitlab") ||
              att.sourceType.toLowerCase().includes("bitbucket"))
        );

        if (!prAttachments || prAttachments.length === 0) {
          vscode.window.showInformationMessage(
            `No pull requests found for ${issue.identifier}`
          );
          return;
        }

        // If there's only one PR, open it directly
        if (prAttachments.length === 1) {
          const prUrl = prAttachments[0].url;
          await vscode.env.openExternal(vscode.Uri.parse(prUrl));
          vscode.window.showInformationMessage(
            `Opening PR for ${issue.identifier}`
          );
          return;
        }

        // If there are multiple PRs, let user choose
        const prOptions = prAttachments.map((pr) => ({
          label: pr.title || "Pull Request",
          description: pr.subtitle || pr.url,
          url: pr.url,
        }));

        const selected = await vscode.window.showQuickPick(prOptions, {
          placeHolder: "Select a pull request to open",
          ignoreFocusOut: true,
        });

        if (selected) {
          await vscode.env.openExternal(vscode.Uri.parse(selected.url));
          vscode.window.showInformationMessage(`Opening PR: ${selected.label}`);
        }
      } catch (error) {
        console.error("[DevBuddy] Failed to open PR:", error);
        vscode.window.showErrorMessage(
          `Failed to open PR: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }),

    vscode.commands.registerCommand(
      "devBuddy.checkoutBranch",
      async (item: { issue?: LinearIssue | JiraIssue }) => {
        const currentPlatform = getCurrentPlatform();
        
        // Extract identifier based on platform
        let identifier: string;
        if (currentPlatform === "linear") {
          const issue = item.issue as LinearIssue | undefined;
          if (!issue) return;
          identifier = issue.identifier;
        } else if (currentPlatform === "jira") {
          const issue = item.issue as JiraIssue | undefined;
          if (!issue) return;
          identifier = issue.key;
        } else {
          return;
        }

        try {
          await branchManager.checkoutBranch(identifier);
          ticketsProvider?.refresh();
        } catch (error) {
          console.error("[DevBuddy] Failed to checkout branch:", error);
          vscode.window.showErrorMessage(
            `Failed to checkout branch: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    vscode.commands.registerCommand(
      "devBuddy.associateBranchFromSidebar",
      async (item: { issue?: LinearIssue | JiraIssue }) => {
        const currentPlatform = getCurrentPlatform();
        
        // Extract identifier based on platform
        let identifier: string;
        if (currentPlatform === "linear") {
          const issue = item.issue as LinearIssue | undefined;
          if (!issue) return;
          identifier = issue.identifier;
        } else if (currentPlatform === "jira") {
          const issue = item.issue as JiraIssue | undefined;
          if (!issue) return;
          identifier = issue.key;
        } else {
          return;
        }

        try {
          // Get all local branches
          const allBranches = await branchManager.getAllLocalBranches();

          if (allBranches.length === 0) {
            vscode.window.showWarningMessage("No local branches found");
            return;
          }

          // Get current branch
          const currentBranch = await branchManager.getCurrentBranch();

          // Get suggestions for this ticket
          const suggestions = await branchManager.suggestAssociationsForTicket(
            identifier
          );

          // Create quick pick with branches, highlighting suggestions and current branch
          const quickPick = vscode.window.createQuickPick();
          quickPick.title = `Associate branch with ${identifier}`;
          quickPick.placeholder = "Type to search or select a branch";
          quickPick.matchOnDescription = true;
          quickPick.matchOnDetail = true;

          // Build items with icons and descriptions
          const items = allBranches.map((branch) => {
            let description = "";
            let icon = "$(git-branch)";

            if (branch === currentBranch) {
              description = "$(check) Current branch";
              icon = "$(git-branch)";
            } else if (suggestions.includes(branch)) {
              description = "$(lightbulb) Suggested";
              icon = "$(sparkle)";
            }

            return {
              label: `${icon} ${branch}`,
              description,
              branch,
            };
          });

          // Sort: suggestions first, then current branch, then alphabetically
          items.sort((a, b) => {
            if (a.branch === currentBranch) return -1;
            if (b.branch === currentBranch) return 1;
            if (
              suggestions.includes(a.branch) &&
              !suggestions.includes(b.branch)
            )
              return -1;
            if (
              suggestions.includes(b.branch) &&
              !suggestions.includes(a.branch)
            )
              return 1;
            return a.branch.localeCompare(b.branch);
          });

          quickPick.items = items;

          // If current branch matches pattern, pre-select it
          if (currentBranch && currentBranch.includes(identifier)) {
            const currentItem = items.find((i) => i.branch === currentBranch);
            if (currentItem) {
              quickPick.activeItems = [currentItem];
            }
          }

          quickPick.onDidAccept(async () => {
            const selected = quickPick.selectedItems[0];
            if (selected) {
              const branchName = (selected as { label: string; description: string; branch: string }).branch;
              quickPick.hide();

              const success = await branchManager.associateBranch(
                identifier,
                branchName
              );

              if (success) {
                vscode.window.showInformationMessage(
                  `Associated ${identifier} with ${branchName} ✓`
                );
                ticketsProvider?.refresh();
              } else {
                vscode.window.showErrorMessage("Failed to associate branch");
              }
            }
          });

          quickPick.onDidHide(() => quickPick.dispose());
          quickPick.show();
        } catch (error) {
          console.error("[DevBuddy] Failed to associate branch:", error);
          vscode.window.showErrorMessage(
            `Failed to associate branch: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    vscode.commands.registerCommand(
      "devBuddy.autoDetectBranches",
      async () => {
        try {
          const detected =
            await branchManager.autoDetectAllBranchAssociations();

          if (detected.length === 0) {
            vscode.window.showInformationMessage(
              "No unassociated branches found matching ticket patterns."
            );
            return;
          }

          const message = `Found ${detected.length} branch(es) that could be associated with tickets. Associate them automatically?`;
          const choice = await vscode.window.showInformationMessage(
            message,
            {
              modal: true,
              detail:
                detected
                  .slice(0, 5)
                  .map((d) => `${d.ticketId} → ${d.branchName}`)
                  .join("\n") +
                (detected.length > 5
                  ? `\n... and ${detected.length - 5} more`
                  : ""),
            },
            "Associate All",
            "Review Each",
            "Cancel"
          );

          if (choice === "Associate All") {
            for (const { ticketId, branchName } of detected) {
              await branchManager.associateBranch(ticketId, branchName, true);
            }
            vscode.window.showInformationMessage(
              `Associated ${detected.length} branch(es) with tickets! 🎉`
            );
            ticketsProvider?.refresh();
          } else if (choice === "Review Each") {
            let associated = 0;
            for (const { ticketId, branchName } of detected) {
              const shouldAssociate = await vscode.window.showQuickPick(
                ["Yes", "No"],
                {
                  placeHolder: `Associate ${ticketId} with ${branchName}?`,
                  ignoreFocusOut: true,
                }
              );

              if (shouldAssociate === "Yes") {
                await branchManager.associateBranch(ticketId, branchName, true);
                associated++;
              }
            }

            if (associated > 0) {
              vscode.window.showInformationMessage(
                `Associated ${associated} branch(es) with tickets!`
              );
              ticketsProvider?.refresh();
            }
          }
        } catch (error) {
          console.error(
            "[DevBuddy] Failed to auto-detect branches:",
            error
          );
          vscode.window.showErrorMessage(
            `Failed to auto-detect branches: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    vscode.commands.registerCommand(
      "devBuddy.showBranchAnalytics",
      async () => {
        try {
          const analytics = await branchManager.getBranchAnalytics();

          const items: vscode.QuickPickItem[] = [
            {
              label: "$(info) Overview",
              kind: vscode.QuickPickItemKind.Separator,
            },
            {
              label: `$(git-branch) Total Associations: ${analytics.totalAssociations}`,
              description: "Active: " + analytics.activeAssociations,
            },
            {
              label: `$(warning) Stale Branches: ${analytics.staleBranches}`,
              description: "Branches that no longer exist",
            },
          ];

          if (analytics.oldestAssociations.length > 0) {
            items.push({
              label: "$(clock) Oldest Associations",
              kind: vscode.QuickPickItemKind.Separator,
            });
            analytics.oldestAssociations.forEach((assoc) => {
              items.push({
                label: `${assoc.ticketId} → ${assoc.branchName}`,
                description: `${assoc.daysSinceLastUpdate} days old`,
              });
            });
          }

          if (analytics.mostUsedBranches.length > 0) {
            items.push({
              label: "$(trending-up) Most Used Branches",
              kind: vscode.QuickPickItemKind.Separator,
            });
            analytics.mostUsedBranches.forEach((branch) => {
              items.push({
                label: `${branch.ticketId} → ${branch.branchName}`,
                description: `Used ${branch.usageCount} time(s)`,
              });
            });
          }

          await vscode.window.showQuickPick(items, {
            placeHolder: "Branch Association Analytics",
            ignoreFocusOut: true,
          });
        } catch (error) {
          console.error("[DevBuddy] Failed to show analytics:", error);
          vscode.window.showErrorMessage(
            `Failed to show analytics: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    vscode.commands.registerCommand(
      "devBuddy.cleanupBranchAssociations",
      async () => {
        try {
          const suggestions = await branchManager.getCleanupSuggestions();
          const totalSuggestions =
            suggestions.staleBranches.length +
            suggestions.oldAssociations.length +
            suggestions.duplicateBranches.length;

          if (totalSuggestions === 0) {
            vscode.window.showInformationMessage(
              "No cleanup needed! All associations are up to date. ✨"
            );
            return;
          }

          const items: vscode.QuickPickItem[] = [];

          if (suggestions.staleBranches.length > 0) {
            items.push({
              label: `$(warning) ${suggestions.staleBranches.length} Stale Branch(es)`,
              description: "Branches that no longer exist",
              kind: vscode.QuickPickItemKind.Separator,
            });
            suggestions.staleBranches.forEach((branch) => {
              items.push({
                label: `${branch.ticketId} → ${branch.branchName}`,
                description: "Branch deleted",
              });
            });
          }

          if (suggestions.oldAssociations.length > 0) {
            items.push({
              label: `$(clock) ${suggestions.oldAssociations.length} Old Association(s)`,
              description: "Not updated in > 30 days",
              kind: vscode.QuickPickItemKind.Separator,
            });
            suggestions.oldAssociations.slice(0, 5).forEach((assoc) => {
              items.push({
                label: `${assoc.ticketId} → ${assoc.branchName}`,
                description: `${assoc.daysSinceLastUpdate} days old`,
              });
            });
          }

          if (suggestions.duplicateBranches.length > 0) {
            items.push({
              label: `$(git-branch) ${suggestions.duplicateBranches.length} Duplicate Branch(es)`,
              description: "Same branch, multiple tickets",
              kind: vscode.QuickPickItemKind.Separator,
            });
            suggestions.duplicateBranches.forEach((dup) => {
              items.push({
                label: dup.branchName,
                description: `Used by: ${dup.ticketIds.join(", ")}`,
              });
            });
          }

          const choice = await vscode.window.showQuickPick(
            ["Clean Up Stale", "View Details", "Cancel"],
            {
              placeHolder: `Found ${totalSuggestions} issue(s). What would you like to do?`,
              ignoreFocusOut: true,
            }
          );

          if (choice === "Clean Up Stale") {
            const removed = await branchManager.cleanupStaleAssociations();
            vscode.window.showInformationMessage(
              `Cleaned up ${removed} stale branch association(s)! 🧹`
            );
            ticketsProvider?.refresh();
          } else if (choice === "View Details") {
            await vscode.window.showQuickPick(items, {
              placeHolder: "Cleanup Suggestions",
              ignoreFocusOut: true,
            });
          }
        } catch (error) {
          console.error("[DevBuddy] Failed to cleanup:", error);
          vscode.window.showErrorMessage(
            `Failed to cleanup: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    vscode.commands.registerCommand("devBuddy.showHelp", async () => {
      const choice = await vscode.window.showQuickPick(
        [
          {
            label: "$(book) Getting Started Tutorial",
            description: "Interactive walkthrough of all features",
            value: "walkthrough",
          },
          {
            label: "$(file-text) View Documentation",
            description: "Open the complete guide",
            value: "docs",
          },
          {
            label: "$(gear) Configuration Guide",
            description: "Learn about all settings and customization",
            value: "config",
          },
          {
            label: "$(keyboard) Keyboard Shortcuts",
            description: "See all available commands",
            value: "shortcuts",
          },
          {
            label: "$(question) Frequently Asked Questions",
            description: "Common questions and troubleshooting",
            value: "faq",
          },
        ],
        {
          placeHolder: "How can we help you?",
          matchOnDescription: true,
        }
      );

      if (choice) {
        switch (choice.value) {
          case "walkthrough":
            // Open the DevBuddy walkthrough
            logger.info("Attempting to open DevBuddy walkthrough...");
            try {
              await vscode.commands.executeCommand(
                "workbench.action.openWalkthrough",
                "angelogirardi.dev-buddy#devBuddy.gettingStarted",
                false
              );
              logger.success("Walkthrough command executed successfully");
            } catch (error) {
              logger.error(`Failed to open walkthrough: ${error instanceof Error ? error.message : String(error)}`);
              vscode.window.showErrorMessage(`Failed to open walkthrough. Try: Help > Welcome > DevBuddy`);
            }
            break;

          case "docs": {
            const readmeUri = vscode.Uri.joinPath(
              context.extensionUri,
              "README.md"
            );
            await vscode.commands.executeCommand(
              "markdown.showPreview",
              readmeUri
            );
            break;
          }
          case "config":
            await vscode.commands.executeCommand(
              "workbench.action.openSettings",
              "devBuddy"
            );
            break;

          case "shortcuts":
            await showKeyboardShortcuts();
            break;

          case "faq":
            await showFAQ();
            break;
        }
      }
    }),

    // Select Provider Command for Walkthrough
    vscode.commands.registerCommand("devBuddy.selectProvider", async () => {
      const choice = await vscode.window.showQuickPick(
        [
          {
            label: "$(symbol-namespace) Linear",
            description: "Full feature support with AI workflows",
            detail: "Best for: Linear users who want complete integration",
            value: "linear",
          },
          {
            label: "$(symbol-class) Jira Cloud",
            description: "Core features with workflow transitions",
            detail: "Best for: Jira Cloud users",
            value: "jira",
          },
          {
            label: "$(clock) More platforms coming soon...",
            description: "Monday.com, ClickUp, and others",
            detail: "We're actively expanding platform support!",
            value: "none",
          },
        ],
        {
          placeHolder: "Which ticket management platform do you use?",
          title: "Choose Your Platform",
          ignoreFocusOut: true,
        }
      );

      if (choice && choice.value !== "none") {
        const config = vscode.workspace.getConfiguration("devBuddy");
        await config.update("provider", choice.value, vscode.ConfigurationTarget.Global);
        
        logger.success(`Platform set to: ${choice.value}`);
        
        // Show next steps
        const platform = choice.value === "linear" ? "Linear" : "Jira Cloud";
        const setupCommand = choice.value === "linear" 
          ? "devBuddy.walkthroughSetupLinear" 
          : "devBuddy.walkthroughSetupJira";
        
        const action = await vscode.window.showInformationMessage(
          `✅ ${platform} selected! Ready to connect your workspace?`,
          `Setup ${platform}`,
          "Later"
        );
        
        if (action === `Setup ${platform}`) {
          await vscode.commands.executeCommand(setupCommand);
        }
      }
    }),

    // Walkthrough-specific Linear setup with detailed guidance
    vscode.commands.registerCommand("devBuddy.walkthroughSetupLinear", async () => {
      // Check if already configured
      const existingToken = await context.secrets.get("linearApiToken");
      const config = vscode.workspace.getConfiguration("devBuddy");
      const existingOrg = config.get<string>("linearOrganization");
      
      if (existingToken && existingOrg) {
        const action = await vscode.window.showInformationMessage(
          "✅ Linear is already configured!\n\nYour API token and organization are set up.",
          "View Tickets",
          "Reconfigure",
          "Continue Walkthrough"
        );
        
        if (action === "View Tickets") {
          await vscode.commands.executeCommand("workbench.view.extension.dev-buddy");
          return;
        } else if (action === "Reconfigure") {
          // Continue with setup below
        } else {
          return; // Continue walkthrough
        }
      }
      
      // Step 1: Get API token
      const token = await vscode.window.showInputBox({
        prompt: "Paste your Linear API token",
        password: true,
        ignoreFocusOut: true,
        placeHolder: "lin_api_...",
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return "API token is required";
          }
          if (!value.startsWith("lin_api_")) {
            return "Linear API tokens typically start with 'lin_api_'";
          }
          return null;
        },
      });

      if (!token) {
        vscode.window.showWarningMessage("Linear setup cancelled. You can try again anytime!");
        return;
      }

      // Store the token
      await context.secrets.store("linearApiToken", token.trim());
      logger.success("Linear API token stored securely");

      // Step 2: Get organization
      await vscode.window.showInformationMessage(
        "✅ API token saved! Now let's configure your organization settings.",
        "Continue"
      );

      const orgSlug = await vscode.window.showInputBox({
        prompt: "Enter your Linear organization slug (from your Linear URL)",
        placeHolder: "mycompany (from app.linear.app/mycompany)",
        ignoreFocusOut: true,
        value: existingOrg || "",
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return "Organization slug is required";
          }
          if (value.includes("/") || value.includes(".")) {
            return "Enter only the slug (e.g., 'mycompany'), not the full URL";
          }
          return null;
        },
      });

      if (orgSlug) {
        await config.update("linearOrganization", orgSlug.trim(), vscode.ConfigurationTarget.Global);
        logger.success(`Linear organization set to: ${orgSlug}`);

        // Step 3: Ask about team filtering (optional)
        const setupTeam = await vscode.window.showInformationMessage(
          "Want to filter tickets by team? (Optional)",
          "Yes, select team",
          "No, show all tickets"
        );

        if (setupTeam === "Yes, select team") {
          // This will trigger the existing team selection flow
          await vscode.commands.executeCommand("devBuddy.selectLinearTeam");
        }

        // Success!
        const action = await vscode.window.showInformationMessage(
          "🎉 Linear setup complete! Open the DevBuddy sidebar to see your tickets.",
          "Open Sidebar",
          "Continue Walkthrough"
        );

        if (action === "Open Sidebar") {
          await vscode.commands.executeCommand("workbench.view.extension.dev-buddy");
        }
      }
    }),

    // Walkthrough-specific Jira setup with detailed guidance
    vscode.commands.registerCommand("devBuddy.walkthroughSetupJira", async () => {
      // Check if already configured
      const existingToken = await context.secrets.get("jiraCloudApiToken");
      const config = vscode.workspace.getConfiguration("devBuddy");
      const existingSiteUrl = config.get<string>("jira.cloud.siteUrl");
      const existingEmail = config.get<string>("jira.cloud.email");
      
      if (existingToken && existingSiteUrl && existingEmail) {
        const action = await vscode.window.showInformationMessage(
          `✅ Jira Cloud is already configured!\n\nSite: ${existingSiteUrl}\nEmail: ${existingEmail}`,
          "View Issues",
          "Reconfigure",
          "Continue Walkthrough"
        );
        
        if (action === "View Issues") {
          await vscode.commands.executeCommand("workbench.view.extension.dev-buddy");
          return;
        } else if (action === "Reconfigure") {
          // Continue with setup below
        } else {
          return; // Continue walkthrough
        }
      }
      
      // Step 1: Get site URL (accept any Jira URL)
      const urlInput = await vscode.window.showInputBox({
        prompt: "Paste ANY URL from your Jira (e.g., a ticket URL or your Jira homepage)",
        placeHolder: "https://mycompany.atlassian.net/browse/ENG-123",
        ignoreFocusOut: true,
        value: existingSiteUrl || "",
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return "Please paste a URL from your Jira";
          }
          if (!value.includes("atlassian.net") && !value.includes("jira")) {
            return "This doesn't look like a Jira URL. Please paste a URL from your Jira workspace.";
          }
          return null;
        },
      });

      if (!urlInput) {
        vscode.window.showWarningMessage("Jira setup cancelled. You can try again anytime!");
        return;
      }

      // Extract site URL from any Jira URL
      const extractSiteUrl = (url: string): string => {
        try {
          const urlObj = new URL(url);
          // Extract just the base URL (e.g., https://mycompany.atlassian.net)
          return `${urlObj.protocol}//${urlObj.hostname}`;
        } catch {
          return url.trim();
        }
      };

      const siteUrl = extractSiteUrl(urlInput);
      
      await vscode.window.showInformationMessage(
        `✅ Detected Jira site: ${siteUrl}`,
        "Continue"
      );

      // Step 2: Get email
      const email = await vscode.window.showInputBox({
        prompt: "Enter your Jira account email",
        placeHolder: "your.email@company.com",
        ignoreFocusOut: true,
        value: existingEmail || "",
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return "Email is required";
          }
          if (!value.includes("@")) {
            return "Please enter a valid email address";
          }
          return null;
        },
      });

      if (!email) {
        vscode.window.showWarningMessage("Jira setup cancelled.");
        return;
      }

      // Step 3: Get API token
      const openTokenPage = await vscode.window.showInformationMessage(
        "Next, you'll need to create an API token from Atlassian.",
        "Open Token Page",
        "I already have a token"
      );

      if (openTokenPage === "Open Token Page") {
        await vscode.env.openExternal(
          vscode.Uri.parse("https://id.atlassian.com/manage-profile/security/api-tokens")
        );
        await vscode.window.showInformationMessage(
          "1. Click 'Create API token'\n2. Give it a name (e.g., 'DevBuddy')\n3. Copy the token",
          "I've copied my token"
        );
      }

      const token = await vscode.window.showInputBox({
        prompt: "Paste your Jira API token",
        password: true,
        ignoreFocusOut: true,
        placeHolder: "Your API token from Atlassian",
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return "API token is required";
          }
          return null;
        },
      });

      if (!token) {
        vscode.window.showWarningMessage("Jira setup cancelled.");
        return;
      }

      // Save all credentials
      await config.update("jira.cloud.siteUrl", siteUrl, vscode.ConfigurationTarget.Global);
      await config.update("jira.cloud.email", email.trim(), vscode.ConfigurationTarget.Global);
      await context.secrets.store("jiraCloudApiToken", token.trim());

      logger.success("Jira Cloud credentials saved securely");

      // Success!
      const action = await vscode.window.showInformationMessage(
        "🎉 Jira setup complete! Open the DevBuddy sidebar to see your issues.",
        "Open Sidebar",
        "Continue Walkthrough"
      );

      if (action === "Open Sidebar") {
        await vscode.commands.executeCommand("workbench.view.extension.dev-buddy");
      }
    }),

    // Direct command to open walkthrough (for debugging)
    vscode.commands.registerCommand("devBuddy.openWalkthrough", async () => {
      logger.info("Direct walkthrough command invoked");
      
      // Try to get all available commands
      const allCommands = await vscode.commands.getCommands();
      const walkthroughCommands = allCommands.filter(cmd => cmd.includes('walkthrough'));
      logger.debug(`Available walkthrough commands: ${walkthroughCommands.join(', ')}`);
      
      try {
        // Try method 1: Full extension ID format
        logger.info("Attempting method 1: Full ID format (publisher.extension#walkthroughId)");
        await vscode.commands.executeCommand(
          "workbench.action.openWalkthrough",
          "angelogirardi.dev-buddy#devBuddy.gettingStarted",
          false
        );
        logger.success("Method 1: Walkthrough opened successfully");
      } catch (error) {
        logger.error(`Method 1 failed: ${error instanceof Error ? error.message : String(error)}`);
        
        // Try method 2: Just the walkthrough ID
        try {
          logger.info("Attempting method 2: Just walkthrough ID (devBuddy.gettingStarted)");
          await vscode.commands.executeCommand(
            "workbench.action.openWalkthrough",
            "devBuddy.gettingStarted"
          );
          logger.success("Method 2: Walkthrough opened successfully");
        } catch (error2) {
          logger.error(`Method 2 failed: ${error2 instanceof Error ? error2.message : String(error2)}`);
          
          // Try method 3: Object format
          try {
            logger.info("Attempting method 3: Object format with category");
            await vscode.commands.executeCommand(
              "workbench.action.openWalkthrough",
              { category: "angelogirardi.dev-buddy#devBuddy.gettingStarted" }
            );
            logger.success("Method 3: Walkthrough opened successfully");
          } catch (error3) {
            logger.error(`Method 3 failed: ${error3 instanceof Error ? error3.message : String(error3)}`);
            
            // Try alternative: open welcome page
            try {
              logger.info("Attempting fallback: workbench.action.openWelcome");
              await vscode.commands.executeCommand("workbench.action.openWelcome");
              logger.info("Opened welcome page - look for DevBuddy in the list");
            } catch (error4) {
              logger.error(`Fallback failed: ${error4 instanceof Error ? error4.message : String(error4)}`);
            }
          }
        }
        
        vscode.window.showErrorMessage(
          `Failed to open walkthrough with all methods. Check DevBuddy output for details.\n\nTry: Help > Welcome > DevBuddy`
        );
      }
    }),

    // Reset extension for testing (simulate fresh install)
    vscode.commands.registerCommand("devBuddy.resetExtension", async () => {
      const confirm = await vscode.window.showWarningMessage(
        "⚠️ This will delete ALL DevBuddy settings and credentials!\n\nThis simulates a fresh install for testing. Are you sure?",
        { modal: true },
        "Yes, Reset Everything",
        "Cancel"
      );

      if (confirm !== "Yes, Reset Everything") {
        return;
      }

      logger.warn("Resetting DevBuddy extension (simulating fresh install)...");

      // Clear all secrets
      const secretsToDelete = [
        "linearApiToken",
        "jiraCloudApiToken",
        "jiraServerPassword",
      ];

      for (const secret of secretsToDelete) {
        try {
          await context.secrets.delete(secret);
          logger.info(`Deleted secret: ${secret}`);
        } catch (error) {
          logger.debug(`Secret ${secret} didn't exist or couldn't be deleted`);
        }
      }

      // Clear all settings
      const config = vscode.workspace.getConfiguration("devBuddy");
      const settingsToReset = [
        // Platform
        "provider",
        // Linear
        "linearOrganization",
        "linearTeamId",
        "linearDefaultTeamId",
        "preferDesktopApp",
        "linkFormat",
        // Jira
        "jira.type",
        "jira.cloud.siteUrl",
        "jira.cloud.email",
        "jira.defaultProject",
        "jira.maxResults",
        "jira.autoRefreshInterval",
        "jira.openInBrowser",
        // AI & Features
        "ai.model",
        "ai.disabled",
        "aiModel", // deprecated but reset anyway
        "writingTone",
        "enableAISummarization",
        // Branch Management
        "branchNamingConvention",
        "customBranchTemplate",
        "baseBranch",
        // Monorepo
        "packagesPaths",
        "maxPackageScope",
        "prTemplatePath",
        // Standup
        "standupTimeWindow",
        // General
        "debugMode",
        "autoRefreshInterval",
        "firstTimeSetupComplete",
        // Telemetry
        "telemetry.enabled",
        "telemetry.showPrompt",
      ];

      for (const setting of settingsToReset) {
        try {
          await config.update(setting, undefined, vscode.ConfigurationTarget.Global);
          logger.info(`Reset setting: ${setting}`);
        } catch (error) {
          logger.debug(`Setting ${setting} couldn't be reset`);
        }
      }

      // Clear global state (branch associations, etc.)
      const stateKeys = context.globalState.keys();
      for (const key of stateKeys) {
        if (key.startsWith("devBuddy") || key.startsWith("linearBuddy")) {
          await context.globalState.update(key, undefined);
          logger.info(`Cleared state: ${key}`);
        }
      }

      logger.success("Extension reset complete!");

      // Prompt to reload
      const action = await vscode.window.showInformationMessage(
        "✅ DevBuddy has been reset!\n\nReload the window to simulate a fresh install.",
        "Reload Window",
        "Open Walkthrough"
      );

      if (action === "Reload Window") {
        await vscode.commands.executeCommand("workbench.action.reloadWindow");
      } else if (action === "Open Walkthrough") {
        await vscode.commands.executeCommand("devBuddy.openWalkthrough");
      }
    }),

    // Telemetry Management Commands
    vscode.commands.registerCommand("devBuddy.manageTelemetry", async () => {
      const stats = await telemetryManager?.getTelemetryStats() ?? { enabled: false, eventsSent: 0, optInDate: null, trialExtensionDays: 0 };
      const isEnabled = telemetryManager?.isEnabled() ?? false;
      
      // Check VS Code's global setting
      const vscodeConfig = vscode.workspace.getConfiguration('telemetry');
      const telemetryLevel = vscodeConfig.get<string>('telemetryLevel', 'all');
      
      // Check DevBuddy opt-out setting
      const devBuddyConfig = vscode.workspace.getConfiguration('devBuddy');
      const optedOut = devBuddyConfig.get<boolean>('telemetry.optOut', false);

      const choice = await vscode.window.showQuickPick(
        [
          {
            label: `$(${isEnabled ? "check" : "circle-slash"}) Telemetry: ${
              isEnabled ? "Enabled" : "Disabled"
            }`,
            description: isEnabled
              ? `Following VS Code setting (${telemetryLevel}) • ${stats.eventsSent} events sent`
              : optedOut 
                ? "DevBuddy opted out"
                : `VS Code telemetry is ${telemetryLevel}`,
            value: "toggle",
          },
          {
            label: "$(info) How Telemetry Works",
            description: "Follows VS Code's global telemetry setting",
            value: "info",
          },
          {
            label: "$(book) What Data Do We Collect?",
            description: "See exactly what telemetry data we collect",
            value: "data",
          },
          {
            label: "$(export) Export My Data",
            description: "Download all your telemetry data (GDPR compliant)",
            value: "export",
          },
          {
            label: "$(trash) Delete My Data",
            description: "Permanently delete all telemetry data",
            value: "delete",
          },
          {
            label: "$(graph) View Statistics",
            description: `Events sent: ${stats.eventsSent} • User ID: ${stats.enabled ? 'Active' : 'N/A'}`,
            value: "stats",
          },
        ],
        {
          placeHolder: "Manage Telemetry Settings",
          ignoreFocusOut: true,
        }
      );

      if (choice) {
        switch (choice.value) {
          case "toggle":
            if (optedOut) {
              // User has opted out - offer to opt back in
              const confirm = await vscode.window.showInformationMessage(
                "Enable DevBuddy telemetry?\n\n" +
                  "This will follow VS Code's global telemetry setting.\n\n" +
                  "✓ 100% anonymous data collection\n" +
                  "✓ Helps us prioritize features\n" +
                  "✓ Respects VS Code's privacy settings",
                { modal: true },
                "Enable",
                "Learn More"
              );

              if (confirm === "Enable") {
                await devBuddyConfig.update("telemetry.optOut", false, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(
                  "✅ Telemetry enabled. DevBuddy will now follow VS Code's global telemetry setting."
                );
              } else if (confirm === "Learn More") {
                await vscode.env.openExternal(
                  vscode.Uri.parse(
                    "https://github.com/angelo-hub/devbuddy/blob/main/docs/features/telemetry/TELEMETRY_GUIDE.md"
                  )
                );
              }
            } else {
              // Currently enabled - offer to opt out
              const confirm = await vscode.window.showWarningMessage(
                "Opt out of DevBuddy telemetry?\n\n" +
                  "This will disable telemetry even if VS Code telemetry is enabled.\n\n" +
                  "Note: You can always re-enable it later.",
                { modal: true },
                "Opt Out",
                "Cancel"
              );

              if (confirm === "Opt Out") {
                await telemetryManager?.disableTelemetry();
                vscode.window.showInformationMessage(
                  "⭕ Telemetry disabled. No data will be collected."
                );
              }
            }
            break;

          case "info":
            await vscode.window.showInformationMessage(
              "How DevBuddy Telemetry Works",
              {
                modal: true,
                detail:
                  "📊 DevBuddy follows VS Code's global telemetry setting by default.\n\n" +
                  "⚙️ How it works:\n" +
                  "1. Open VS Code Settings (Cmd/Ctrl + ,)\n" +
                  "2. Search for 'telemetry level'\n" +
                  "3. Choose your preference: all, error, crash, or off\n" +
                  "4. DevBuddy respects your choice\n\n" +
                  "🔒 DevBuddy-specific opt-out:\n" +
                  "You can also opt out of DevBuddy telemetry specifically\n" +
                  "while keeping VS Code telemetry enabled.\n\n" +
                  "Current status:\n" +
                  `• VS Code telemetry: ${telemetryLevel}\n` +
                  `• DevBuddy opt-out: ${optedOut ? 'Yes' : 'No'}\n` +
                  `• Telemetry active: ${isEnabled ? 'Yes' : 'No'}`,
              },
              "Got it",
              "VS Code Settings"
            ).then(choice => {
              if (choice === "VS Code Settings") {
                vscode.commands.executeCommand('workbench.action.openSettings', 'telemetry.telemetryLevel');
              }
            });
            break;

          case "data":
            await vscode.window.showInformationMessage(
              "DevBuddy Telemetry Collection",
              {
                modal: true,
                detail:
                  "✅ What we DO collect:\n" +
                  "• Feature usage (which commands you use)\n" +
                  "• Error types and counts\n" +
                  "• Performance metrics (operation duration)\n" +
                  "• Extension version and platform\n" +
                  "• Anonymous user ID (random UUID)\n" +
                  "• Platform choice (Linear/Jira)\n" +
                  "• AI enabled/disabled status\n\n" +
                  "❌ What we DON'T collect:\n" +
                  "• Your code or file contents\n" +
                  "• File names or paths\n" +
                  "• Personal information\n" +
                  "• API tokens or credentials\n" +
                  "• Ticket content or descriptions\n" +
                  "• Git commit messages or diffs\n" +
                  "• Any identifiable information\n\n" +
                  "🌐 VS Code automatically adds:\n" +
                  "• OS type and version\n" +
                  "• VS Code version\n" +
                  "• CPU architecture (x64/ARM)\n" +
                  "• Remote connection type (if any)\n\n" +
                  "All data is anonymous and helps us build a better extension!",
              },
              "Got it",
              "Read Full Guide"
            ).then(choice => {
              if (choice === "Read Full Guide") {
                vscode.env.openExternal(
                  vscode.Uri.parse(
                    "https://github.com/angelo-hub/devbuddy/blob/main/docs/features/telemetry/TELEMETRY_GUIDE.md"
                  )
                );
              }
            });
            break;

          case "export":
            await vscode.commands.executeCommand(
              "devBuddy.exportTelemetryData"
            );
            break;

          case "delete":
            await vscode.commands.executeCommand(
              "devBuddy.deleteTelemetryData"
            );
            break;

          case "stats":
            await vscode.window.showInformationMessage(
              "Telemetry Statistics",
              {
                modal: true,
                detail:
                  `📊 Current Status:\n` +
                  `• Telemetry: ${isEnabled ? "✅ Enabled" : "⭕ Disabled"}\n` +
                  `• VS Code setting: ${telemetryLevel}\n` +
                  `• DevBuddy opt-out: ${optedOut ? 'Yes' : 'No'}\n\n` +
                  `📈 Usage:\n` +
                  `• Events Sent: ${stats.eventsSent}\n` +
                  `• Tracking Since: ${
                    stats.optInDate
                      ? new Date(stats.optInDate).toLocaleDateString()
                      : "N/A"
                  }\n\n` +
                  `${isEnabled ? "Thank you for helping us improve DevBuddy! 🙏" : "Telemetry is currently disabled."}`,
              },
              "Close"
            );
            break;
        }
      }
    }),

    vscode.commands.registerCommand(
      "devBuddy.exportTelemetryData",
      async () => {
        try {
          const data = await telemetryManager?.exportUserData() ?? "";

          const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file("linear-buddy-telemetry-data.json"),
            filters: {
              "JSON Files": ["json"],
              "All Files": ["*"],
            },
          });

          if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(data, "utf8"));

            vscode.window.showInformationMessage(
              `Telemetry data exported to ${uri.fsPath}`
            );
          }
        } catch (error) {
          logger.error("Failed to export telemetry data", error);
          vscode.window.showErrorMessage(
            `Failed to export telemetry data: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    vscode.commands.registerCommand(
      "devBuddy.deleteTelemetryData",
      async () => {
        const confirm = await vscode.window.showWarningMessage(
          "Delete all your telemetry data?",
          {
            modal: true,
            detail:
              "This will:\n" +
              "• Delete all local telemetry data\n" +
              "• Reset your anonymous user ID\n" +
              "• Disable telemetry collection\n\n" +
              "Note: You'll need to contact support to delete data from our backend.",
          },
          "Delete All Data",
          "Cancel"
        );

        if (confirm === "Delete All Data") {
          await telemetryManager?.deleteUserData();
        }
      }
    )
  );

  // ==================== Register Jira Commands ====================
  context.subscriptions.push(
    // Jira Configuration Commands - Auto-detect type
    vscode.commands.registerCommand("devBuddy.jira.setup", async () => {
      // Smart setup - ask user which type
      const choice = await vscode.window.showQuickPick(
        [
          {
            label: "$(cloud) Jira Cloud",
            description: "https://yourcompany.atlassian.net",
            value: "cloud"
          },
          {
            label: "$(server) Jira Server/Data Center",
            description: "Self-hosted Jira (http://jira.company.com)",
            value: "server"
          }
        ],
        {
          title: "Select Jira Type",
          placeHolder: "Which type of Jira are you using?"
        }
      );

      if (!choice) {
        return;
      }

      let success = false;
      if (choice.value === "cloud") {
        success = await runJiraCloudSetup(context);
      } else {
        success = await runJiraServerSetup(context);
      }

      if (success) {
        ticketsProvider?.refresh();
      }
    }),

    // Jira Cloud Commands
    vscode.commands.registerCommand("devBuddy.jira.setupCloud", async () => {
      const success = await runJiraCloudSetup(context);
      if (success) {
        ticketsProvider?.refresh();
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.cloud.testConnection", async () => {
      await testJiraCloudConnection(context);
    }),

    vscode.commands.registerCommand("devBuddy.jira.cloud.resetConfig", async () => {
      await resetJiraCloudConfig(context);
      ticketsProvider?.refresh();
    }),

    vscode.commands.registerCommand("devBuddy.jira.cloud.updateToken", async () => {
      await updateJiraCloudApiToken(context);
    }),

    // Jira Server Commands
    vscode.commands.registerCommand("devBuddy.jira.setupServer", async () => {
      const success = await runJiraServerSetup(context);
      if (success) {
        ticketsProvider?.refresh();
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.server.testConnection", async () => {
      await testJiraServerConnection();
    }),

    vscode.commands.registerCommand("devBuddy.jira.server.resetConfig", async () => {
      await resetJiraServerConfig(context);
      ticketsProvider?.refresh();
    }),

    vscode.commands.registerCommand("devBuddy.jira.server.updatePassword", async () => {
      await updateJiraServerPassword(context);
    }),

    vscode.commands.registerCommand("devBuddy.jira.server.showInfo", async () => {
      await showJiraServerInfo();
    }),

    // Legacy commands (kept for backward compatibility)
    vscode.commands.registerCommand("devBuddy.jira.testConnection", async () => {
      const config = vscode.workspace.getConfiguration("devBuddy");
      const jiraType = config.get<string>("jira.type", "cloud");
      
      if (jiraType === "server") {
        await testJiraServerConnection();
      } else {
        await testJiraCloudConnection(context);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.resetConfig", async () => {
      const config = vscode.workspace.getConfiguration("devBuddy");
      const jiraType = config.get<string>("jira.type", "cloud");
      
      if (jiraType === "server") {
        await resetJiraServerConfig(context);
      } else {
        await resetJiraCloudConfig(context);
      }
      ticketsProvider?.refresh();
    }),

    vscode.commands.registerCommand("devBuddy.jira.updateToken", async () => {
      const config = vscode.workspace.getConfiguration("devBuddy");
      const jiraType = config.get<string>("jira.type", "cloud");
      
      if (jiraType === "server") {
        await updateJiraServerPassword(context);
      } else {
        await updateJiraCloudApiToken(context);
      }
    }),

    // Jira Issue Commands
    vscode.commands.registerCommand("devBuddy.jira.refreshIssues", () => {
      ticketsProvider?.refresh();
    }),

    vscode.commands.registerCommand("devBuddy.jira.openIssue", async (issue?: JiraIssue) => {
      await openJiraIssue(issue);
    }),

    vscode.commands.registerCommand("devBuddy.jira.viewIssueDetails", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        // Use webview panel for both Cloud and Server
        await JiraIssuePanel.createOrShow(context.extensionUri, issue, context);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.createIssue", async () => {
      await JiraCreateTicketPanel.createOrShow(context.extensionUri);
    }),

    vscode.commands.registerCommand("devBuddy.jira.updateStatus", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await updateJiraIssueStatus(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.assignIssue", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await assignJiraIssue(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.assignToMe", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await assignJiraIssue(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.addComment", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await addJiraComment(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.copyUrl", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await copyJiraIssueUrl(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.copyIssueUrl", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await copyJiraIssueUrl(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.copyKey", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await copyJiraIssueKey(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.copyIssueKey", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await copyJiraIssueKey(issue);
      }
    })
  );

  logger.success("All features registered successfully!");
  logger.info("DevBuddy is now ready to use");
}

/**
 * Show keyboard shortcuts and commands
 */
async function showKeyboardShortcuts() {
  const shortcuts: vscode.QuickPickItem[] = [
    {
      label: "$(keyboard) Command Palette Commands",
      kind: vscode.QuickPickItemKind.Separator,
    },
    {
      label: "DevBuddy: Generate PR Summary",
      description: "Cmd/Ctrl+Shift+P → type 'PR Summary'",
    },
    {
      label: "DevBuddy: Generate Standup",
      description: "Cmd/Ctrl+Shift+P → type 'Standup'",
    },
    {
      label: "DevBuddy: Create New Ticket",
      description: "Cmd/Ctrl+Shift+P → type 'Create Ticket'",
    },
    {
      label: "DevBuddy: Convert TODO to Ticket",
      description: "Select TODO → Right-click or Lightbulb",
    },
    {
      label: "",
      kind: vscode.QuickPickItemKind.Separator,
    },
    {
      label: "$(comment) Chat Commands",
      kind: vscode.QuickPickItemKind.Separator,
    },
    {
      label: "@linear /tickets",
      description: "Show your Linear tickets",
    },
    {
      label: "@linear /standup",
      description: "Generate standup update",
    },
    {
      label: "@linear /pr",
      description: "Generate PR summary",
    },
    {
      label: "@linear /status",
      description: "Update ticket status",
    },
    {
      label: "",
      kind: vscode.QuickPickItemKind.Separator,
    },
    {
      label: "$(info) Tip",
      description:
        "You can create custom keybindings in: Preferences → Keyboard Shortcuts",
    },
  ];

  await vscode.window.showQuickPick(shortcuts, {
    placeHolder: "Available Commands & Shortcuts",
  });
}

/**
 * Show frequently asked questions
 */
async function showFAQ() {
  const faqs: vscode.QuickPickItem[] = [
    {
      label: "$(question) How do I get a Linear API key?",
      description: "Click to see answer",
      detail:
        "Run 'DevBuddy: Configure Linear Token' from the command palette. We'll guide you through getting your API key from Linear's settings.",
    },
    {
      label: "$(question) Why aren't my tickets showing up?",
      description: "Click to see answer",
      detail:
        "1. Make sure your API key is configured correctly\n2. Check that tickets are assigned to you\n3. Try clicking the refresh button in the sidebar\n4. Check your team filter in settings",
    },
    {
      label: "$(question) Can I use this with multiple Linear workspaces?",
      description: "Click to see answer",
      detail:
        "Currently, DevBuddy supports one workspace at a time. You can switch workspaces by updating your API key in settings.",
    },
    {
      label: "$(question) How do I customize branch naming?",
      description: "Click to see answer",
      detail:
        "Go to Settings → DevBuddy → Branch Naming Convention. Choose from:\n- Conventional (feat/eng-123-title)\n- Simple (eng-123-title)\n- Custom (define your own template)",
    },
    {
      label: "$(question) Is my API key secure?",
      description: "Click to see answer",
      detail:
        "Yes! Your API key is stored using VS Code's Secret Storage API, which uses your OS's secure credential storage (Keychain on macOS, Credential Vault on Windows, etc.). It's never transmitted anywhere except to Linear's official API.",
    },
    {
      label: "$(question) Can I change the AI model used for summaries?",
      description: "Click to see answer",
      detail:
        "Yes! Go to Settings → DevBuddy → AI Model. You can choose from various GitHub Copilot models including GPT-4, GPT-4 Turbo, and more. The 'auto' setting automatically uses the best available model.",
    },
    {
      label: "$(question) How do I report a bug or request a feature?",
      description: "Click to see answer",
      detail:
        "We'd love to hear from you! Open an issue on the GitHub repository or reach out through the marketplace page.",
    },
  ];

  const selected = await vscode.window.showQuickPick(faqs, {
    placeHolder: "Frequently Asked Questions",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (selected && selected.detail) {
    await vscode.window.showInformationMessage(selected.label, {
      modal: true,
      detail: selected.detail,
    });
  }
}

export function deactivate() {
  const logger = getLogger();
  logger.info("Extension is now deactivated");
}
