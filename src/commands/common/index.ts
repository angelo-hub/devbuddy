import * as vscode from "vscode";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";
import { getLogger } from "@shared/utils/logger";
import { showKeyboardShortcuts, showFAQ } from "./helpCommands";

/**
 * Register common commands that work across all platforms
 */
export function registerCommonCommands(
  context: vscode.ExtensionContext,
  ticketsProvider: UniversalTicketsProvider | undefined
): void {
  const logger = getLogger();

  // Help & Documentation Commands
  context.subscriptions.push(
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
    })
  );

  logger.debug("Common commands registered");
}

