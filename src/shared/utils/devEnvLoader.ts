/**
 * Development Environment Loader
 * 
 * Loads credentials from environment variables during development.
 * This allows developers to quickly test the extension without going through setup each time.
 * 
 * Usage:
 * 1. Copy .env.example to .env
 * 2. Fill in your credentials
 * 3. Launch with "Run Extension (Linear Dev Mode)" or "Run Extension (Jira Dev Mode)"
 */

import * as vscode from "vscode";
import { getLogger } from "./logger";

const logger = getLogger();

export interface DevEnvironment {
  isDevMode: boolean;
  provider?: "linear" | "jira";
  linearToken?: string;
  linearOrg?: string;
  jiraSiteUrl?: string;
  jiraEmail?: string;
  jiraApiToken?: string;
  debugMode?: boolean;
}

/**
 * Parse development environment variables
 */
export function getDevEnvironment(): DevEnvironment {
  const isDevMode = process.env.DEV_MODE === "true";
  
  if (!isDevMode) {
    return { isDevMode: false };
  }

  return {
    isDevMode: true,
    provider: process.env.DEV_PROVIDER as "linear" | "jira" | undefined,
    linearToken: process.env.DEV_LINEAR_API_TOKEN,
    linearOrg: process.env.DEV_LINEAR_ORGANIZATION,
    jiraSiteUrl: process.env.DEV_JIRA_SITE_URL,
    jiraEmail: process.env.DEV_JIRA_EMAIL,
    jiraApiToken: process.env.DEV_JIRA_API_TOKEN,
    debugMode: process.env.DEV_DEBUG_MODE === "true",
  };
}

/**
 * Load development credentials into secure storage and settings
 * Only runs if DEV_MODE=true environment variable is set
 */
export async function loadDevCredentials(context: vscode.ExtensionContext): Promise<void> {
  const devEnv = getDevEnvironment();

  if (!devEnv.isDevMode) {
    return;
  }

  logger.info("🔧 Development mode enabled - loading credentials from environment");

  // Enable debug mode if requested
  if (devEnv.debugMode) {
    const config = vscode.workspace.getConfiguration("devBuddy");
    await config.update("debugMode", true, vscode.ConfigurationTarget.Global);
    logger.debug("Debug mode enabled via DEV_DEBUG_MODE");
  }

  // Set provider
  if (devEnv.provider) {
    const config = vscode.workspace.getConfiguration("devBuddy");
    await config.update("provider", devEnv.provider, vscode.ConfigurationTarget.Global);
    logger.info(`🎯 Provider set to: ${devEnv.provider}`);
  }

  // Load Linear credentials
  if (devEnv.provider === "linear" && devEnv.linearToken) {
    await context.secrets.store("linearApiToken", devEnv.linearToken);
    logger.success("✅ Linear API token loaded from DEV_LINEAR_API_TOKEN");

    if (devEnv.linearOrg) {
      const config = vscode.workspace.getConfiguration("devBuddy");
      await config.update("linearOrganization", devEnv.linearOrg, vscode.ConfigurationTarget.Global);
      logger.success(`✅ Linear organization set to: ${devEnv.linearOrg}`);
    }
  }

  // Load Jira credentials
  if (devEnv.provider === "jira" && devEnv.jiraSiteUrl && devEnv.jiraEmail && devEnv.jiraApiToken) {
    const config = vscode.workspace.getConfiguration("devBuddy.jira.cloud");
    await config.update("siteUrl", devEnv.jiraSiteUrl, vscode.ConfigurationTarget.Global);
    await config.update("email", devEnv.jiraEmail, vscode.ConfigurationTarget.Global);
    await context.secrets.store("jiraCloudApiToken", devEnv.jiraApiToken);
    
    logger.success("✅ Jira Cloud credentials loaded:");
    logger.success(`   - Site URL: ${devEnv.jiraSiteUrl}`);
    logger.success(`   - Email: ${devEnv.jiraEmail}`);
    logger.success(`   - API Token: ****${devEnv.jiraApiToken.slice(-4)}`);
  }

  // Small delay to ensure settings are persisted
  await new Promise(resolve => setTimeout(resolve, 100));

  logger.info("🚀 Development credentials loaded successfully");
}

/**
 * Check if a specific provider is configured in dev mode
 */
export function isDevModeForProvider(provider: "linear" | "jira"): boolean {
  const devEnv = getDevEnvironment();
  return devEnv.isDevMode && devEnv.provider === provider;
}

/**
 * Show a warning banner if in dev mode
 */
export function showDevModeWarning(): void {
  const devEnv = getDevEnvironment();
  
  if (devEnv.isDevMode) {
    vscode.window.showWarningMessage(
      `🔧 Development Mode Active (${devEnv.provider?.toUpperCase() || "Unknown"}) - Credentials loaded from environment variables`,
      "OK"
    );
  }
}

