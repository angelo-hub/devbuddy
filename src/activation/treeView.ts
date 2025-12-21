import * as vscode from "vscode";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";
import { getLogger } from "@shared/utils/logger";
import { debounce } from "@shared/utils/debounce";

/**
 * Register the tickets tree view (sidebar)
 */
export async function registerTreeView(context: vscode.ExtensionContext): Promise<UniversalTicketsProvider | undefined> {
  const logger = getLogger();
  logger.info("Registering tree view provider...");
  
  try {
    const ticketsProvider = new UniversalTicketsProvider(context);
    const treeView = vscode.window.createTreeView("myTickets", {
      treeDataProvider: ticketsProvider,
      showCollapseAll: true,
    });
    context.subscriptions.push(treeView);

    // Track if we've done the initial data load
    let hasInitialData = false;
    
    // Debounced refresh to prevent rapid-fire updates on visibility changes
    const debouncedVisibilityRefresh = debounce(() => {
      // Only refresh on visibility if we haven't loaded data yet
      // Once we have data, the cache will keep it fresh
      if (!hasInitialData) {
        logger.debug("Universal tree view became visible, loading initial data");
        ticketsProvider?.refresh();
        hasInitialData = true;
      }
    }, 500);

    // Trigger refresh when the tree view becomes visible (debounced)
    treeView.onDidChangeVisibility((e) => {
      if (e.visible) {
        debouncedVisibilityRefresh();
      }
    });
    
    // Update context keys when tree view refreshes (in case token was added)
    try {
      ticketsProvider.onDidRefresh(() => {
        const updateContextKeys = async () => {
          await vscode.commands.executeCommand("setContext", "devBuddy.hasProvider", true);
        };
        updateContextKeys().catch((error) => {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.debug(`Context key update on refresh failed (non-critical): ${errorMsg}`);
        });
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.debug(`Could not register refresh listener (non-critical): ${errorMsg}`);
    }
    
    logger.success("Tree view registered successfully");
    return ticketsProvider;
  } catch (error) {
    logger.error("CRITICAL: Failed to register tree view", error);
    vscode.window.showErrorMessage(
      `DevBuddy: Failed to initialize sidebar. Please check the Output panel (DevBuddy channel) for details.`,
      "Open Output",
      "Reload Window"
    ).then(selection => {
      if (selection === "Open Output") {
        logger.show();
      } else if (selection === "Reload Window") {
        vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    });
    
    return undefined;
  }
}





