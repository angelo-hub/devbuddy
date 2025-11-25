/**
 * DevBuddy Extension - Main Entry Point
 * 
 * This is the entry point for the DevBuddy VS Code extension.
 * All heavy lifting has been moved to modular files for better maintainability.
 */

import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";

// Activation modules
import { registerUriHandler } from "./activation/uriHandler";
import { initializeCoreServices, setupContextKeys, handleDevMode } from "./activation/initialization";
import { registerTreeView } from "./activation/treeView";
import { registerChatParticipant } from "./activation/chatParticipant";
import { registerLanguageModelTools } from "./activation/lmTools";
import { registerCodeActionProviders } from "./activation/codeActions";

// Command registration
import { registerAllCommands } from "./commands";

/**
 * Extension activation
 */
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

  try {
    // ==================== PHASE 1: Core Infrastructure ====================
    logger.info("Phase 1: Initializing core infrastructure...");
    
    // Register URI handler for deeplinks
    registerUriHandler(context);
    
    // Initialize core services (telemetry, storage, branch manager)
    await initializeCoreServices(context);
    
    // Set up context keys for UI visibility
    setupContextKeys(context);
    
    // Handle development mode auto-open features
    handleDevMode();
    
    logger.success("✅ Core infrastructure initialized");

    // ==================== PHASE 2: UI Components ====================
    logger.info("Phase 2: Initializing UI components...");
    
    // Register tree view (sidebar)
    const ticketsProvider = await registerTreeView(context);
    
    logger.success("✅ UI components initialized");

    // ==================== PHASE 3: AI & Code Features ====================
    logger.info("Phase 3: Initializing AI and code features...");
    
    // Register chat participant (optional)
    registerChatParticipant(context);
    
    // Register Language Model Tools (optional, VS Code 1.93+)
    registerLanguageModelTools(context);
    
    // Register code action providers (TODO converter)
    registerCodeActionProviders(context);
    
    logger.success("✅ AI and code features initialized");

    // ==================== PHASE 4: Commands ====================
    logger.info("Phase 4: Registering commands...");
    
    // Register all commands from modular files
    registerAllCommands(context, ticketsProvider);
    
    logger.success("✅ All commands registered");

    // ==================== Activation Complete ====================
    logger.success("All features registered successfully!");
    logger.info("DevBuddy is now ready to use");
    
  } catch (error) {
    logger.error("CRITICAL: Extension activation failed", error);
    vscode.window.showErrorMessage(
      `DevBuddy failed to activate: ${error instanceof Error ? error.message : "Unknown error"}`,
      "View Logs"
    ).then(selection => {
      if (selection === "View Logs") {
        logger.show();
      }
    });
    throw error;
  }
}

/**
 * Extension deactivation
 */
export function deactivate() {
  const logger = getLogger();
  logger.info("Extension is now deactivated");
}
