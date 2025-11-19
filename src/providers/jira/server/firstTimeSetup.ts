/**
 * First-Time Setup for Jira Server/Data Center (Beta)
 *
 * Guides users through configuring connection to self-hosted Jira Server
 * or Jira Data Center instances.
 *
 * Status: Beta - Currently in testing phase
 *
 * Handles:
 * - URL validation
 * - Version detection
 * - Authentication method negotiation (PAT vs Basic Auth)
 * - Capability detection
 * - Test connection
 */

import * as vscode from "vscode";
import { JiraServerClient } from "./JiraServerClient";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

/**
 * Run first-time setup for Jira Server (beta)
 */
export async function runJiraServerSetup(context: vscode.ExtensionContext): Promise<boolean> {
  logger.info("Starting Jira Server setup (beta)...");

  // Step 1: Get Server URL
  const baseUrl = await vscode.window.showInputBox({
    title: "Jira Server Setup (beta) - Step 1/3: Server URL",
    prompt: "Enter your Jira Server base URL",
    placeHolder: "http://jira.company.com",
    validateInput: (value) => {
      if (!value || value.trim() === "") {
        return "Server URL is required";
      }
      // Basic URL validation
      try {
        const url = new URL(value);
        if (!url.protocol.startsWith("http")) {
          return "URL must start with http:// or https://";
        }
      } catch {
        return "Invalid URL format";
      }
      return null;
    },
  });

  if (!baseUrl) {
    logger.info("Setup cancelled: No URL provided");
    return false;
  }

  // Clean URL (remove trailing slash)
  const cleanUrl = baseUrl.replace(/\/$/, "");

  // Step 2: Get Username
  const username = await vscode.window.showInputBox({
    title: "Jira Server Setup (beta) - Step 2/3: Username",
    prompt: "Enter your Jira username",
    placeHolder: "john.doe",
    validateInput: (value) => {
      if (!value || value.trim() === "") {
        return "Username is required";
      }
      return null;
    },
  });

  if (!username) {
    logger.info("Setup cancelled: No username provided");
    return false;
  }

  // Step 3: Get Password or PAT
  const authChoice = await vscode.window.showQuickPick(
    [
      {
        label: "$(key) Personal Access Token (PAT)",
        description: "Recommended for Jira Server 8.14+",
        value: "pat",
      },
      {
        label: "$(lock) Password",
        description: "Basic authentication (works on all versions)",
        value: "password",
      },
    ],
    {
      title: "Jira Server Setup (beta) - Step 3/3: Authentication",
      placeHolder: "Choose authentication method",
    }
  );

  if (!authChoice) {
    logger.info("Setup cancelled: No auth method chosen");
    return false;
  }

  const isPAT = authChoice.value === "pat";

  const credential = await vscode.window.showInputBox({
    title: isPAT ? "Personal Access Token" : "Password",
    prompt: isPAT
      ? "Enter your Jira Personal Access Token (Create at: Settings → Personal Access Tokens)"
      : "Enter your Jira password",
    password: true,
    validateInput: (value) => {
      if (!value || value.trim() === "") {
        return isPAT ? "Token is required" : "Password is required";
      }
      if (isPAT && value.length < 20) {
        return "Token seems too short (tokens are usually 60+ characters)";
      }
      return null;
    },
  });

  if (!credential) {
    logger.info("Setup cancelled: No credential provided");
    return false;
  }

  // Save configuration
  const config = vscode.workspace.getConfiguration("devBuddy");

  try {
    // Save to settings
    await config.update("jira.type", "server", vscode.ConfigurationTarget.Global);
    await config.update("jira.server.baseUrl", cleanUrl, vscode.ConfigurationTarget.Global);
    await config.update("jira.server.username", username, vscode.ConfigurationTarget.Global);

    // Save credential to secure storage
    await context.secrets.store("jiraServerPassword", credential);

    logger.success("Configuration saved");
    logger.debug(`Saved config: baseUrl=${cleanUrl}, username=${username}`);

    // Reset the client instance to reload with new configuration
    JiraServerClient.reset();
    logger.debug("Client instance reset");

    // Give VS Code a moment to persist settings
    await new Promise((resolve) => setTimeout(resolve, 500));
    logger.debug("Starting connection test...");

    // Test connection
    const connected = await testJiraServerConnection();

    if (connected) {
      // Update provider to jira
      await config.update("provider", "jira", vscode.ConfigurationTarget.Global);
      logger.success("Provider set to 'jira'");

      vscode.window
        .showInformationMessage(
          "✅ Successfully connected to Jira Server (beta)! You can now use DevBuddy with your Jira instance. Note: This feature is currently in beta testing.",
          "View Documentation"
        )
        .then((action) => {
          if (action === "View Documentation") {
            vscode.env.openExternal(
              vscode.Uri.parse(
                "https://github.com/angelo-hub/devbuddy/blob/main/JIRA_QUICK_START.md"
              )
            );
          }
        });

      return true;
    } else {
      // Connection failed
      const retry = await vscode.window.showErrorMessage(
        "Connection test failed. Please check your configuration.",
        "Retry Setup",
        "View Logs"
      );

      if (retry === "Retry Setup") {
        return runJiraServerSetup(context);
      } else if (retry === "View Logs") {
        logger.show();
      }

      return false;
    }
  } catch (error) {
    logger.error("Failed to save Jira Server configuration", error);
    vscode.window.showErrorMessage(
      `Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

/**
 * Test connection to Jira Server (beta)
 */
export async function testJiraServerConnection(): Promise<boolean> {
  try {
    logger.debug("Creating JiraServerClient instance...");
    const client = await JiraServerClient.create();

    logger.debug("Checking if client is configured...");
    if (!client.isConfigured()) {
      logger.warn("Client reported as not configured");
      vscode.window.showWarningMessage(
        "Jira Server (beta) is not configured. Please run setup first."
      );
      return false;
    }

    logger.debug("Client is configured, proceeding with connection test...");

    // Show progress
    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Testing Jira Server connection (beta)...",
        cancellable: false,
      },
      async (progress) => {
        try {
          progress.report({ message: "Detecting server version..." });

          // Get server info (this also tests authentication)
          const serverInfo = client.getServerInfo();

          if (!serverInfo) {
            throw new Error("Failed to detect server version");
          }

          logger.success(
            `Connected to Jira Server ${serverInfo.version} (${serverInfo.deploymentType})`
          );

          progress.report({ message: "Fetching current user..." });

          // Test API access
          const user = await client.getCurrentUser();

          if (!user) {
            throw new Error("Failed to authenticate - could not fetch current user");
          }

          logger.success(`Authenticated as: ${user.displayName} (${user.emailAddress})`);

          // Get capabilities
          const capabilities = client.getCapabilities();

          if (capabilities) {
            logger.info("Server capabilities detected:");
            logger.info(`  - Personal Access Tokens: ${capabilities.personalAccessTokens}`);
            logger.info(`  - Rich Text Editor (ADF): ${capabilities.richTextEditor}`);
            logger.info(`  - Agile API: ${capabilities.agileAPI}`);
            logger.info(`  - Custom Field Schemas: ${capabilities.customFieldSchemas}`);
          }

          // Test fetching issues
          progress.report({ message: "Fetching issues..." });

          const issues = await client.getMyIssues();

          logger.success(`Found ${issues.length} issues assigned to you`);

          return true;
        } catch (error) {
          logger.error("Connection test failed", error);

          // Show detailed error
          if (error instanceof Error) {
            if (error.message.includes("401") || error.message.includes("403")) {
              vscode.window
                .showErrorMessage(
                  "❌ Authentication failed. Please check your username and password/token.",
                  "View Logs"
                )
                .then((action) => {
                  if (action === "View Logs") {
                    logger.show();
                  }
                });
            } else if (
              error.message.includes("ECONNREFUSED") ||
              error.message.includes("ENOTFOUND")
            ) {
              vscode.window
                .showErrorMessage(
                  "❌ Could not connect to server. Please check the URL and ensure the server is accessible.",
                  "View Logs"
                )
                .then((action) => {
                  if (action === "View Logs") {
                    logger.show();
                  }
                });
            } else {
              vscode.window
                .showErrorMessage(`❌ Connection test failed: ${error.message}`, "View Logs")
                .then((action) => {
                  if (action === "View Logs") {
                    logger.show();
                  }
                });
            }
          }

          return false;
        }
      }
    );
  } catch (error) {
    logger.error("Failed to test Jira Server connection", error);
    return false;
  }
}

/**
 * Update Jira Server password/token (beta)
 */
export async function updateJiraServerPassword(context: vscode.ExtensionContext): Promise<void> {
  const config = vscode.workspace.getConfiguration("devBuddy");
  const currentUsername = config.get<string>("jira.server.username");

  if (!currentUsername) {
    vscode.window
      .showWarningMessage(
        "Jira Server (beta) is not configured. Please run setup first.",
        "Run Setup"
      )
      .then((action) => {
        if (action === "Run Setup") {
          runJiraServerSetup(context);
        }
      });
    return;
  }

  const authChoice = await vscode.window.showQuickPick(
    [
      {
        label: "$(key) Personal Access Token (PAT)",
        description: "Recommended for Jira Server 8.14+",
        value: "pat",
      },
      {
        label: "$(lock) Password",
        description: "Basic authentication (works on all versions)",
        value: "password",
      },
    ],
    {
      title: "Update Authentication",
      placeHolder: "Choose authentication method",
    }
  );

  if (!authChoice) {
    return;
  }

  const isPAT = authChoice.value === "pat";

  const credential = await vscode.window.showInputBox({
    title: isPAT ? "New Personal Access Token" : "New Password",
    prompt: isPAT ? "Enter your new Jira Personal Access Token" : "Enter your new Jira password",
    password: true,
    validateInput: (value) => {
      if (!value || value.trim() === "") {
        return isPAT ? "Token is required" : "Password is required";
      }
      if (isPAT && value.length < 20) {
        return "Token seems too short (tokens are usually 60+ characters)";
      }
      return null;
    },
  });

  if (!credential) {
    return;
  }

  try {
    // Save to secure storage
    await context.secrets.store("jiraServerPassword", credential);

    // Reset client to reload with new credentials
    JiraServerClient.reset();

    logger.success("Credentials updated successfully");

    // Test connection
    const connected = await testJiraServerConnection();

    if (connected) {
      vscode.window.showInformationMessage("✅ Credentials updated and verified successfully!");
    } else {
      vscode.window.showWarningMessage(
        "⚠️ Credentials updated but connection test failed. Please check your configuration."
      );
    }
  } catch (error) {
    logger.error("Failed to update credentials", error);
    vscode.window.showErrorMessage(
      `Failed to update credentials: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Reset Jira Server configuration (beta)
 */
export async function resetJiraServerConfig(context: vscode.ExtensionContext): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    "Are you sure you want to reset your Jira Server (beta) configuration? This will remove all saved settings.",
    { modal: true },
    "Reset Configuration"
  );

  if (confirm !== "Reset Configuration") {
    return;
  }

  try {
    const config = vscode.workspace.getConfiguration("devBuddy");

    // Clear settings
    await config.update("jira.type", undefined, vscode.ConfigurationTarget.Global);
    await config.update("jira.server.baseUrl", undefined, vscode.ConfigurationTarget.Global);
    await config.update("jira.server.username", undefined, vscode.ConfigurationTarget.Global);

    // Clear secure storage
    await context.secrets.delete("jiraServerPassword");

    // Reset client
    JiraServerClient.reset();

    logger.info("Jira Server configuration reset");

    vscode.window.showInformationMessage(
      "✅ Jira Server (beta) configuration has been reset. You can run setup again to configure a new connection."
    );
  } catch (error) {
    logger.error("Failed to reset configuration", error);
    vscode.window.showErrorMessage(
      `Failed to reset configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Show server info and capabilities (beta)
 */
export async function showJiraServerInfo(): Promise<void> {
  try {
    const client = await JiraServerClient.create();

    if (!client.isConfigured()) {
      vscode.window
        .showWarningMessage(
          "Jira Server (beta) is not configured. Please run setup first.",
          "Run Setup"
        )
        .then((action) => {
          if (action === "Run Setup") {
            const context = (global as any).devBuddyContext as vscode.ExtensionContext;
            runJiraServerSetup(context);
          }
        });
      return;
    }

    const serverInfo = client.getServerInfo();
    const capabilities = client.getCapabilities();

    if (!serverInfo || !capabilities) {
      vscode.window.showWarningMessage("Could not retrieve server information. Please reconnect.");
      return;
    }

    // Build info message
    const infoLines = [
      `**Jira ${serverInfo.deploymentType}** ${serverInfo.version}`,
      ``,
      `**Server:** ${serverInfo.baseUrl}`,
      `**Title:** ${serverInfo.serverTitle}`,
      `**Build:** ${serverInfo.buildNumber}`,
      ``,
      `**Capabilities:**`,
      `- Authentication: ${capabilities.personalAccessTokens ? "PAT + Basic Auth" : "Basic Auth"}`,
      `- Content Format: ${capabilities.richTextEditor ? "ADF (Rich Text)" : "Plain Text"}`,
      `- Agile Features: ${capabilities.agileAPI ? "Yes" : "No"}`,
      `- Custom Field Schemas: ${capabilities.customFieldSchemas ? "Yes" : "No"}`,
      `- Workflow Properties: ${capabilities.workflowProperties ? "Yes" : "No"}`,
      `- Bulk Operations: ${capabilities.bulkOperations ? "Yes" : "No"}`,
    ];

    const panel = vscode.window.createWebviewPanel(
      "jiraServerInfo",
      "Jira Server Information (beta)",
      vscode.ViewColumn.One,
      { enableScripts: false }
    );

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              padding: 20px;
              font-family: var(--vscode-font-family);
              color: var(--vscode-foreground);
              line-height: 1.6;
            }
            h1 {
              color: var(--vscode-foreground);
              border-bottom: 1px solid var(--vscode-foreground);
              padding-bottom: 10px;
            }
            code {
              background: var(--vscode-textCodeBlock-background);
              padding: 2px 4px;
              border-radius: 3px;
            }
            .capability {
              margin-left: 20px;
            }
            .beta-note {
              background: var(--vscode-textBlockQuote-background);
              padding: 10px;
              border-left: 4px solid var(--vscode-textLink-foreground);
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <h1>Jira Server Information (Beta)</h1>
          <div class="beta-note">
            <strong>Note:</strong> Jira Server support is currently in beta. Please report any issues you encounter.
          </div>
          ${infoLines
            .map((line) => {
              if (line.startsWith("**") && line.endsWith("**")) {
                return `<h2>${line.replace(/\*\*/g, "")}</h2>`;
              } else if (line.startsWith("- ")) {
                return `<div class="capability">${line.substring(2)}</div>`;
              } else if (line === "") {
                return "<br>";
              } else {
                return `<p>${line}</p>`;
              }
            })
            .join("\n")}
        </body>
      </html>
    `;

    logger.info("Displayed Jira Server information panel");
  } catch (error) {
    logger.error("Failed to show server info", error);
    vscode.window.showErrorMessage(
      `Failed to retrieve server information: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
