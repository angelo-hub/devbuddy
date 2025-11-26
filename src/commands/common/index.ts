import * as vscode from "vscode";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";
import { getLogger } from "@shared/utils/logger";
import { showKeyboardShortcuts, showFAQ } from "./helpCommands";
import { getTelemetryManager } from "@shared/utils/telemetryManager";
import { LinearClient } from "@providers/linear/LinearClient";
import { runJiraCloudSetup } from "@providers/jira/cloud/firstTimeSetup";
import { runJiraServerSetup } from "@providers/jira/server/firstTimeSetup";

/**
 * Register common commands that work across all platforms
 */
export function registerCommonCommands(
  context: vscode.ExtensionContext,
  ticketsProvider: UniversalTicketsProvider | undefined
): void {
  const logger = getLogger();
  const telemetryManager = getTelemetryManager();

  context.subscriptions.push(
    // ==================== HELP & DOCUMENTATION ====================
    
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

    // ==================== PLATFORM SELECTION ====================
    
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

    // ==================== WALKTHROUGH SETUP ====================
    
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

    vscode.commands.registerCommand("devBuddy.walkthroughSetupJira", async () => {
      // Check if already configured (Cloud or Server)
      const config = vscode.workspace.getConfiguration("devBuddy");
      const jiraType = config.get<string>("jira.type", "cloud");
      
      let isConfigured = false;
      let configDetails = "";
      
      if (jiraType === "cloud") {
        const existingToken = await context.secrets.get("jiraCloudApiToken");
        const existingSiteUrl = config.get<string>("jira.cloud.siteUrl");
        const existingEmail = config.get<string>("jira.cloud.email");
        
        if (existingToken && existingSiteUrl && existingEmail) {
          isConfigured = true;
          configDetails = `Site: ${existingSiteUrl}\nEmail: ${existingEmail}`;
        }
      } else {
        const existingPassword = await context.secrets.get("jiraServerPassword");
        const existingUrl = config.get<string>("jira.server.url");
        const existingUsername = config.get<string>("jira.server.username");
        
        if (existingPassword && existingUrl && existingUsername) {
          isConfigured = true;
          configDetails = `Server: ${existingUrl}\nUsername: ${existingUsername}`;
        }
      }
      
      if (isConfigured) {
        const action = await vscode.window.showInformationMessage(
          `✅ Jira ${jiraType === "cloud" ? "Cloud" : "Server"} is already configured!\n\n${configDetails}`,
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
      
      // Ask user to choose between Cloud and Server
      const choice = await vscode.window.showQuickPick(
        [
          {
            label: "$(cloud) Jira Cloud",
            description: "Connect to Jira Cloud (atlassian.net)",
            detail: "Most common - hosted by Atlassian",
            value: "cloud",
          },
          {
            label: "$(server) Jira Server/Data Center",
            description: "Connect to self-hosted Jira",
            detail: "For on-premise or data center installations",
            value: "server",
          },
        ],
        {
          title: "Select Your Jira Type",
          placeHolder: "Which type of Jira are you using?",
          ignoreFocusOut: true,
        }
      );

      if (!choice) {
        return; // User cancelled
      }

      // Delegate to the appropriate setup flow
      let success = false;
      if (choice.value === "cloud") {
        success = await runJiraCloudSetup(context);
      } else {
        success = await runJiraServerSetup(context);
      }

      if (success) {
        const action = await vscode.window.showInformationMessage(
          "🎉 Jira setup complete! Open the DevBuddy sidebar to see your issues.",
          "Open Sidebar",
          "Continue Walkthrough"
        );

        if (action === "Open Sidebar") {
          await vscode.commands.executeCommand("workbench.view.extension.dev-buddy");
        }
      }
    }),

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

    // ==================== EXTENSION MANAGEMENT ====================
    
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

    // ==================== TELEMETRY MANAGEMENT ====================
    
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
                  "• Ticket contents or descriptions\n" +
                  "• Your API tokens or credentials\n" +
                  "• Your code or file contents\n" +
                  "• Personally identifiable information\n" +
                  "• IP addresses\n" +
                  "• Workspace or project names\n\n" +
                  "🔒 All data is anonymous and helps us improve DevBuddy.",
              },
              "Got it"
            );
            break;

          case "stats":
            await vscode.window.showInformationMessage(
              "Telemetry Statistics",
              {
                modal: true,
                detail:
                  `📊 Your Telemetry Stats:\n\n` +
                  `Status: ${isEnabled ? '✅ Enabled' : '⭕ Disabled'}\n` +
                  `Events Sent: ${stats.eventsSent}\n` +
                  `Opt-in Date: ${stats.optInDate || 'N/A'}\n` +
                  `Extension Days: ${stats.trialExtensionDays}\n\n` +
                  `VS Code Telemetry: ${telemetryLevel}\n` +
                  `DevBuddy Opt-out: ${optedOut ? 'Yes' : 'No'}`,
              },
              "Got it"
            );
            break;
        }
      }
    }),

    // ==================== DEBUG COMMANDS ====================
    
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
    })
  );

  logger.debug("Common commands registered");
}


