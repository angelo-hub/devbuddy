import * as vscode from "vscode";
import { TodoToTicketCodeActionProvider } from "@utils/todoCodeActionProvider";
import { getLogger } from "@shared/utils/logger";

/**
 * Register code action providers (e.g., TODO converter)
 */
export function registerCodeActionProviders(context: vscode.ExtensionContext): void {
  const logger = getLogger();
  
  try {
    // Register TODO to ticket code action provider
    const todoCodeActionProvider = vscode.languages.registerCodeActionsProvider(
      { scheme: "file" },
      new TodoToTicketCodeActionProvider(),
      {
        providedCodeActionKinds:
          TodoToTicketCodeActionProvider.providedCodeActionKinds,
      }
    );
    context.subscriptions.push(todoCodeActionProvider);
    logger.info("TODO code action provider registered successfully");
  } catch (error) {
    logger.error("Failed to register TODO code action provider", error);
  }
}




