import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";

/**
 * Register URI handler for external deeplinks
 * Handles vscode://angelogirardi.dev-buddy/ URIs
 */
export function registerUriHandler(context: vscode.ExtensionContext): void {
  const logger = getLogger();
  
  const uriHandler = vscode.window.registerUriHandler({
    handleUri: async (uri: vscode.Uri) => {
      logger.info(`🔗 [URI Handler] Received URI: ${uri.toString()}`);
      logger.debug(`[URI Handler] Path: ${uri.path}`);
      logger.debug(`[URI Handler] Query: ${uri.query}`);
      
      try {
        // Parse the command from the path (e.g., /devBuddy.openTicketById)
        const commandId = uri.path.replace(/^\//, ""); // Remove leading slash
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
}





