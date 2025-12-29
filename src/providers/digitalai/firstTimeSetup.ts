/**
 * Digital.ai Agility First Time Setup
 *
 * Onboarding flow for configuring Digital.ai Agility integration.
 * Collects instance URL and Access Token.
 *
 * Documentation:
 * - API: https://docs.digital.ai/agility/docs/developerlibrary/002-getting-started-with-the-api
 * - Auth: https://docs.digital.ai/agility/docs/developerlibrary/api-authentication
 */

import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import { DigitalAIClient } from "./DigitalAIClient";

const logger = getLogger();

/**
 * Parse and validate Digital.ai instance URL
 * Supports formats like:
 * - https://www14.v1host.com/MyCompany
 * - https://mycompany.saas.v1.digital.ai
 * - https://agility.mycompany.com
 */
function parseDigitalAIInstanceUrl(url: string): string | null {
  try {
    // Remove trailing slashes and whitespace
    let cleaned = url.trim().replace(/\/+$/, "");

    // Add protocol if missing
    if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
      cleaned = `https://${cleaned}`;
    }

    // Validate it's a valid URL
    const parsed = new URL(cleaned);

    // Must have a hostname
    if (!parsed.hostname) {
      return null;
    }

    // Return the base URL (protocol + host)
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(
      /\/+$/,
      ""
    );
  } catch (error) {
    return null;
  }
}

export async function runDigitalAISetup(
  context: vscode.ExtensionContext
): Promise<boolean> {
  logger.info("Starting Digital.ai Agility setup wizard...");

  try {
    // Step 1: Get Digital.ai instance URL
    const instanceUrl = await vscode.window.showInputBox({
      prompt: "Enter your Digital.ai Agility instance URL",
      placeHolder: "https://www14.v1host.com/MyCompany",
      validateInput: (value) => {
        if (!value) {
          return "Please enter your Digital.ai Agility instance URL";
        }
        const parsed = parseDigitalAIInstanceUrl(value);
        if (!parsed) {
          return "Please enter a valid URL (e.g., https://www14.v1host.com/MyCompany)";
        }
        return null;
      },
    });

    if (!instanceUrl) {
      logger.warn("Digital.ai setup cancelled: No URL provided");
      return false;
    }

    const cleanedUrl = parseDigitalAIInstanceUrl(instanceUrl);
    if (!cleanedUrl) {
      vscode.window.showErrorMessage("Could not parse Digital.ai instance URL");
      return false;
    }

    logger.info(`Using Digital.ai instance: ${cleanedUrl}`);

    // Step 2: Show instructions for Access Token
    const createToken = "Create Access Token";
    const haveToken = "I Have a Token";

    const choice = await vscode.window.showInformationMessage(
      "You need a Digital.ai Access Token to authenticate. Would you like to create one now?",
      createToken,
      haveToken
    );

    if (!choice) {
      logger.warn("Digital.ai setup cancelled: No token choice made");
      return false;
    }

    if (choice === createToken) {
      // Show instructions for creating access token
      const instructions = await vscode.window.showInformationMessage(
        "To create an Access Token:\n\n" +
          "1. Log into your Digital.ai Agility instance\n" +
          "2. Click your profile icon → Applications\n" +
          "3. Click 'Add' to create a new token\n" +
          "4. Copy the generated token\n\n" +
          "Click 'Open Digital.ai' to go to your instance.",
        "Open Digital.ai",
        "Continue"
      );

      if (instructions === "Open Digital.ai") {
        // Open the Digital.ai instance in browser
        await vscode.env.openExternal(vscode.Uri.parse(cleanedUrl));

        await vscode.window.showInformationMessage(
          "A browser window has opened. Create an Access Token and copy it. Click OK when ready to continue.",
          "OK"
        );
      }
    }

    // Step 3: Get Access Token
    const accessToken = await vscode.window.showInputBox({
      prompt: "Paste your Digital.ai Access Token",
      password: true,
      validateInput: (value) => {
        if (!value) {
          return "Access Token is required";
        }
        if (value.length < 10) {
          return "Access Token seems too short";
        }
        return null;
      },
    });

    if (!accessToken) {
      logger.warn("Digital.ai setup cancelled: No Access Token provided");
      return false;
    }

    // Step 4: Save configuration
    const config = vscode.workspace.getConfiguration("devBuddy.digitalai");
    await config.update(
      "instanceUrl",
      cleanedUrl,
      vscode.ConfigurationTarget.Global
    );

    // Save Access Token to secure storage
    await context.secrets.store("digitalaiAccessToken", accessToken);

    // Set provider to digitalai
    const providerConfig = vscode.workspace.getConfiguration("devBuddy");
    await providerConfig.update(
      "provider",
      "digitalai",
      vscode.ConfigurationTarget.Global
    );

    logger.success("Digital.ai Agility configuration saved");
    logger.debug(`Saved config: instanceUrl=${cleanedUrl}`);

    // Small delay to ensure settings are persisted
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Show pin reminder
    const pinAction = await vscode.window.showInformationMessage(
      "Tip: Pin DevBuddy to your Activity Bar for quick access! Right-click the DevBuddy icon and select 'Pin'.",
      "Got it",
      "Show me how"
    );

    if (pinAction === "Show me how") {
      await vscode.commands.executeCommand(
        "workbench.action.openWalkthrough",
        "angelogirardi.dev-buddy#devBuddy.gettingStarted",
        false
      );
    }

    // Step 5: Test connection
    const testing = await vscode.window.showInformationMessage(
      "Configuration saved! Test the connection now?",
      "Test Connection",
      "Skip"
    );

    if (testing === "Test Connection") {
      return await testDigitalAIConnection(context);
    }

    return true;
  } catch (error) {
    logger.error("Digital.ai setup failed:", error);
    vscode.window.showErrorMessage(
      `Digital.ai setup failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return false;
  }
}

/**
 * Test Digital.ai Agility connection
 */
export async function testDigitalAIConnection(
  context: vscode.ExtensionContext
): Promise<boolean> {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Testing Digital.ai Agility connection...",
        cancellable: false,
      },
      async () => {
        // Reset the singleton to force it to reload configuration
        DigitalAIClient.reset();
        const client = await DigitalAIClient.create();

        if (!client.isConfigured()) {
          throw new Error("Digital.ai Agility is not properly configured");
        }

        const user = await client.getCurrentUser();

        if (!user) {
          throw new Error("Failed to authenticate with Digital.ai Agility");
        }

        logger.success(
          `Connected to Digital.ai Agility as ${user.name}${user.email ? ` (${user.email})` : ""}`
        );
      }
    );

    vscode.window.showInformationMessage(
      "✅ Successfully connected to Digital.ai Agility!"
    );
    return true;
  } catch (error) {
    logger.error("Digital.ai connection test failed:", error);
    vscode.window.showErrorMessage(
      `Digital.ai connection failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return false;
  }
}

/**
 * Reset Digital.ai Agility configuration
 */
export async function resetDigitalAIConfig(
  context: vscode.ExtensionContext
): Promise<void> {
  const confirm = await vscode.window.showWarningMessage(
    "Are you sure you want to remove your Digital.ai Agility configuration?",
    "Yes, Remove",
    "Cancel"
  );

  if (confirm !== "Yes, Remove") {
    return;
  }

  try {
    const config = vscode.workspace.getConfiguration("devBuddy.digitalai");
    await config.update(
      "instanceUrl",
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await context.secrets.delete("digitalaiAccessToken");

    // Reset singleton
    DigitalAIClient.reset();

    logger.info("Digital.ai Agility configuration removed");
    vscode.window.showInformationMessage(
      "Digital.ai Agility configuration removed"
    );
  } catch (error) {
    logger.error("Failed to remove Digital.ai configuration:", error);
    vscode.window.showErrorMessage(
      "Failed to remove Digital.ai Agility configuration"
    );
  }
}

/**
 * Update Digital.ai Access Token
 */
export async function updateDigitalAIAccessToken(
  context: vscode.ExtensionContext
): Promise<void> {
  const accessToken = await vscode.window.showInputBox({
    prompt: "Enter your new Digital.ai Access Token",
    password: true,
    validateInput: (value) => {
      if (!value) {
        return "Access Token is required";
      }
      if (value.length < 10) {
        return "Access Token seems too short";
      }
      return null;
    },
  });

  if (!accessToken) {
    return;
  }

  try {
    await context.secrets.store("digitalaiAccessToken", accessToken);

    // Reset singleton to force reload
    DigitalAIClient.reset();

    logger.success("Digital.ai Access Token updated");

    // Test new token
    const test = await vscode.window.showInformationMessage(
      "Access Token updated. Test the connection?",
      "Test Connection",
      "Skip"
    );

    if (test === "Test Connection") {
      await testDigitalAIConnection(context);
    }
  } catch (error) {
    logger.error("Failed to update Digital.ai Access Token:", error);
    vscode.window.showErrorMessage("Failed to update Access Token");
  }
}

