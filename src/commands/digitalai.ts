/**
 * Digital.ai Agility Commands
 *
 * Commands for interacting with Digital.ai Agility platform (Beta).
 */

import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";
import { DigitalAIClient } from "@providers/digitalai/DigitalAIClient";
import { DigitalAINormalizedStory } from "@providers/digitalai/types";
import {
  runDigitalAISetup,
  testDigitalAIConnection,
  resetDigitalAIConfig,
  updateDigitalAIAccessToken,
} from "@providers/digitalai/firstTimeSetup";

const logger = getLogger();

/**
 * Register all Digital.ai related commands
 */
export function registerDigitalAICommands(
  context: vscode.ExtensionContext,
  ticketsProvider: UniversalTicketsProvider | undefined
): void {
  logger.info("Registering Digital.ai commands (Beta)...");

  // Setup command
  context.subscriptions.push(
    vscode.commands.registerCommand("devBuddy.digitalai.setup", async () => {
      const success = await runDigitalAISetup(context);
      if (success) {
        ticketsProvider?.refresh();
      }
    })
  );

  // Test connection command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devBuddy.digitalai.testConnection",
      async () => {
        await testDigitalAIConnection(context);
      }
    )
  );

  // Reset configuration command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devBuddy.digitalai.resetConfig",
      async () => {
        await resetDigitalAIConfig(context);
        ticketsProvider?.refresh();
      }
    )
  );

  // Update Access Token command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devBuddy.digitalai.updateToken",
      async () => {
        await updateDigitalAIAccessToken(context);
      }
    )
  );

  // Refresh stories command
  context.subscriptions.push(
    vscode.commands.registerCommand("devBuddy.digitalai.refreshStories", () => {
      ticketsProvider?.refresh();
      logger.info("[Digital.ai] Stories refreshed");
    })
  );

  // Open story command - opens in browser for beta
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devBuddy.digitalai.openStory",
      async (story: DigitalAINormalizedStory) => {
        if (!story) {
          vscode.window.showErrorMessage("No story selected");
          return;
        }

        try {
          // For beta, open in browser
          // TODO: Add webview panel in future version
          if (story.url) {
            await vscode.env.openExternal(vscode.Uri.parse(story.url));
            logger.info(
              `[Digital.ai] Opened story ${story.identifier} in browser`
            );
          } else {
            // Construct URL from instance config
            const config = vscode.workspace.getConfiguration("devBuddy.digitalai");
            const instanceUrl = config.get<string>("instanceUrl", "");
            if (instanceUrl) {
              const url = `${instanceUrl}/story.mvc/Summary?oidToken=${story.id}`;
              await vscode.env.openExternal(vscode.Uri.parse(url));
              logger.info(
                `[Digital.ai] Opened story ${story.identifier} in browser`
              );
            } else {
              vscode.window.showErrorMessage(
                "Could not determine story URL. Please check your Digital.ai configuration."
              );
            }
          }
        } catch (error) {
          logger.error(`[Digital.ai] Failed to open story:`, error);
          vscode.window.showErrorMessage(
            `Failed to open story: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }
    )
  );

  // Copy story identifier command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devBuddy.digitalai.copyIdentifier",
      async (item: { story?: DigitalAINormalizedStory }) => {
        const story = item?.story;
        if (!story) {
          vscode.window.showErrorMessage("No story selected");
          return;
        }

        await vscode.env.clipboard.writeText(story.identifier);
        vscode.window.showInformationMessage(
          `Copied ${story.identifier} to clipboard`
        );
      }
    )
  );

  // Copy story URL command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devBuddy.digitalai.copyUrl",
      async (item: { story?: DigitalAINormalizedStory }) => {
        const story = item?.story;
        if (!story) {
          vscode.window.showErrorMessage("No story selected");
          return;
        }

        if (story.url) {
          await vscode.env.clipboard.writeText(story.url);
          vscode.window.showInformationMessage(
            `Copied URL for ${story.identifier} to clipboard`
          );
        } else {
          vscode.window.showErrorMessage("Story URL not available");
        }
      }
    )
  );

  logger.success("Digital.ai commands registered (Beta)");
}

