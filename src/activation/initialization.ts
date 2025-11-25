import * as vscode from "vscode";
import { LinearClient } from "@providers/linear/LinearClient";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";
import { getLogger } from "@shared/utils/logger";
import { getTelemetryManager } from "@shared/utils/telemetryManager";
import { loadDevCredentials, showDevModeWarning } from "@shared/utils/devEnvLoader";

/**
 * Initialize core services and storage
 */
export async function initializeCoreServices(context: vscode.ExtensionContext): Promise<{
  branchManager: BranchAssociationManager;
  telemetryManager: ReturnType<typeof getTelemetryManager>;
}> {
  const logger = getLogger();
  
  // Store context globally so firstTimeSetup and clients can access it
  (global as any).devBuddyContext = context;
  
  // Load development credentials if in dev mode (non-blocking)
  loadDevCredentials(context).then(() => {
    showDevModeWarning();
  }).catch((error) => {
    logger.error("Failed to load dev credentials (non-critical)", error);
  });
  
  // Handle test mode: simulate fresh install
  await handleTestMode(context);
  
  // Initialize telemetry manager (non-blocking)
  const telemetryManager = getTelemetryManager();
  try {
    telemetryManager.initialize(context);
    telemetryManager.trackEvent("extension_activated");
  } catch (error) {
    logger.error("Failed to initialize telemetry (non-critical)", error);
  }
  
  // Initialize secure storage for Linear API token
  try {
    LinearClient.initializeSecretStorage(context.secrets);
  } catch (error) {
    logger.error("Failed to initialize Linear secret storage", error);
  }
  
  // Initialize Branch Association Manager
  const branchManager = new BranchAssociationManager(context);
  
  return { branchManager, telemetryManager };
}

/**
 * Handle test mode for fresh install simulation
 */
async function handleTestMode(context: vscode.ExtensionContext): Promise<void> {
  if (process.env.DEVBUDDY_TEST_FRESH_INSTALL !== "true") {
    return;
  }
  
  const logger = getLogger();
  logger.warn("TEST MODE: Simulating fresh install...");
  
  // Reset secrets silently
  const secretsToDelete = ["linearApiToken", "jiraCloudApiToken", "jiraServerPassword"];
  for (const secret of secretsToDelete) {
    try {
      await context.secrets.delete(secret);
    } catch (error) {
      // Ignore errors
    }
  }
  
  // Reset settings
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

/**
 * Set up context keys for UI visibility control
 */
export function setupContextKeys(context: vscode.ExtensionContext): void {
  const logger = getLogger();
  
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
  
  // Add cleanup handler
  context.subscriptions.push({
    dispose: () => {
      logger.debug("Extension cleanup - context keys");
    }
  });
}

/**
 * Handle development mode auto-open features
 */
export function handleDevMode(): void {
  const logger = getLogger();
  
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
}

