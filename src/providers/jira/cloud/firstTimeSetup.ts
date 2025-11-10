/**
 * Jira Cloud First Time Setup
 * 
 * Onboarding flow for configuring Jira Cloud integration.
 * Collects site URL, email, and API token.
 */

import * as vscode from "vscode";
import { getLogger } from "../../../shared/utils/logger";
import { JiraCloudClient } from "./JiraCloudClient";

const logger = getLogger();

/**
 * Parse Jira site URL from a Jira URL
 * Supports formats like:
 * - https://mycompany.atlassian.net/browse/ENG-123
 * - mycompany.atlassian.net/browse/ENG-123
 * - https://mycompany.atlassian.net/jira/software/projects/ENG/boards/1
 */
function parseJiraSiteUrl(url: string): string | null {
  try {
    // Remove protocol and www if present
    let cleaned = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    
    // Check if it's an Atlassian Cloud URL
    if (!cleaned.includes("atlassian.net")) {
      return null;
    }
    
    // Extract site URL (domain before first path segment)
    const match = cleaned.match(/^([^/]+\.atlassian\.net)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

export async function runJiraCloudSetup(
  context: vscode.ExtensionContext
): Promise<boolean> {
  logger.info("Starting Jira Cloud setup wizard...");

  try {
    // Step 1: Get Jira Cloud site URL (or any Jira URL)
    const jiraUrl = await vscode.window.showInputBox({
      prompt: "Enter any URL from your Jira workspace (e.g., a ticket or board URL)",
      placeHolder: "https://mycompany.atlassian.net/browse/ENG-123",
      validateInput: (value) => {
        if (!value) {
          return "Please enter a URL from your Jira workspace";
        }
        const siteUrl = parseJiraSiteUrl(value);
        if (!siteUrl) {
          return "Please enter a valid Jira Cloud URL (must contain *.atlassian.net)";
        }
        return null;
      },
    });

    if (!jiraUrl) {
      logger.warn("Jira Cloud setup cancelled: No URL provided");
      return false;
    }

    // Parse the site URL from the provided URL
    const siteUrl = parseJiraSiteUrl(jiraUrl);
    if (!siteUrl) {
      vscode.window.showErrorMessage("Could not parse Jira site URL");
      return false;
    }

    logger.info(`Detected Jira site: ${siteUrl}`);

    // Step 2: Get email
    const email = await vscode.window.showInputBox({
      prompt: "Enter your Atlassian account email",
      placeHolder: "your.email@company.com",
      validateInput: (value) => {
        if (!value) {
          return "Email is required";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address";
        }
        return null;
      },
    });

    if (!email) {
      logger.warn("Jira Cloud setup cancelled: No email provided");
      return false;
    }

    // Step 3: Show instructions for API token
    const createToken = "Create API Token";
    const haveToken = "I Have a Token";

    const choice = await vscode.window.showInformationMessage(
      "You need a Jira API token to authenticate. Would you like to create one now?",
      createToken,
      haveToken
    );

    if (!choice) {
      logger.warn("Jira Cloud setup cancelled: No token choice made");
      return false;
    }

    if (choice === createToken) {
      // Open Atlassian API token page
      await vscode.env.openExternal(
        vscode.Uri.parse("https://id.atlassian.com/manage-profile/security/api-tokens")
      );

      await vscode.window.showInformationMessage(
        "A browser window has opened. Create an API token and copy it. Click OK when ready to continue.",
        "OK"
      );
    }

    // Step 4: Get API token
    const apiToken = await vscode.window.showInputBox({
      prompt: "Paste your Jira API token",
      password: true,
      validateInput: (value) => {
        if (!value) {
          return "API token is required";
        }
        if (value.length < 10) {
          return "API token seems too short";
        }
        return null;
      },
    });

    if (!apiToken) {
      logger.warn("Jira Cloud setup cancelled: No API token provided");
      return false;
    }

    // Step 5: Save configuration
    const config = vscode.workspace.getConfiguration("devBuddy.jira.cloud");
    await config.update("siteUrl", siteUrl, vscode.ConfigurationTarget.Global);
    await config.update("email", email, vscode.ConfigurationTarget.Global);

    // Save API token to secure storage
    await context.secrets.store("jiraCloudApiToken", apiToken);

    // Set provider to Jira
    const providerConfig = vscode.workspace.getConfiguration("devBuddy");
    await providerConfig.update("provider", "jira", vscode.ConfigurationTarget.Global);

    logger.success("Jira Cloud configuration saved");
    logger.debug(`Saved config: siteUrl=${siteUrl}, email=${email}`);

    // Small delay to ensure settings are persisted
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 6: Test connection
    const testing = await vscode.window.showInformationMessage(
      "Configuration saved! Test the connection now?",
      "Test Connection",
      "Skip"
    );

    if (testing === "Test Connection") {
      return await testJiraCloudConnection(context);
    }

    return true;
  } catch (error) {
    logger.error("Jira Cloud setup failed:", error);
    vscode.window.showErrorMessage(
      `Jira Cloud setup failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return false;
  }
}

/**
 * Test Jira Cloud connection
 */
export async function testJiraCloudConnection(
  context: vscode.ExtensionContext
): Promise<boolean> {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Testing Jira Cloud connection...",
        cancellable: false,
      },
      async () => {
        // Reset the singleton to force it to reload configuration
        JiraCloudClient.reset();
        const client = await JiraCloudClient.create();

        if (!client.isConfigured()) {
          throw new Error("Jira Cloud is not properly configured");
        }

        const user = await client.getCurrentUser();

        if (!user) {
          throw new Error("Failed to authenticate with Jira Cloud");
        }

        logger.success(`Connected to Jira Cloud as ${user.displayName} (${user.emailAddress})`);
      }
    );

    vscode.window.showInformationMessage("✅ Successfully connected to Jira Cloud!");
    return true;
  } catch (error) {
    logger.error("Jira Cloud connection test failed:", error);
    vscode.window.showErrorMessage(
      `Jira Cloud connection failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return false;
  }
}

/**
 * Reset Jira Cloud configuration
 */
export async function resetJiraCloudConfig(
  context: vscode.ExtensionContext
): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    "Are you sure you want to remove your Jira Cloud configuration?",
    "Yes, Remove",
    "Cancel"
  );

  if (confirm !== "Yes, Remove") {
    return;
  }

  try {
    const config = vscode.workspace.getConfiguration("devBuddy.jira.cloud");
    await config.update("siteUrl", undefined, vscode.ConfigurationTarget.Global);
    await config.update("email", undefined, vscode.ConfigurationTarget.Global);
    await context.secrets.delete("jiraCloudApiToken");

    logger.info("Jira Cloud configuration removed");
    vscode.window.showInformationMessage("Jira Cloud configuration removed");
  } catch (error) {
    logger.error("Failed to remove Jira Cloud configuration:", error);
    vscode.window.showErrorMessage("Failed to remove Jira Cloud configuration");
  }
}

/**
 * Update Jira Cloud API token
 */
export async function updateJiraCloudApiToken(
  context: vscode.ExtensionContext
): Promise<void> {
  const apiToken = await vscode.window.showInputBox({
    prompt: "Enter your new Jira API token",
    password: true,
    validateInput: (value) => {
      if (!value) {
        return "API token is required";
      }
      if (value.length < 10) {
        return "API token seems too short";
      }
      return null;
    },
  });

  if (!apiToken) {
    return;
  }

  try {
    await context.secrets.store("jiraCloudApiToken", apiToken);
    logger.success("Jira Cloud API token updated");

    // Test new token
    const test = await vscode.window.showInformationMessage(
      "API token updated. Test the connection?",
      "Test Connection",
      "Skip"
    );

    if (test === "Test Connection") {
      await testJiraCloudConnection(context);
    }
  } catch (error) {
    logger.error("Failed to update Jira Cloud API token:", error);
    vscode.window.showErrorMessage("Failed to update API token");
  }
}

