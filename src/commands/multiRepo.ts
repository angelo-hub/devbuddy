import * as vscode from "vscode";
import * as path from "path";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";
import {
  getRepositoryRegistry,
  initializeRepositoryRegistry,
  RepositoryInfo,
} from "@shared/git/repositoryRegistry";
import { openRepositoryWindow, isCliAvailable, getCliInstallInstructions } from "@shared/utils/windowOpener";
import { getForkDisplayName } from "@shared/utils/forkDetector";
import { getLogger } from "@shared/utils/logger";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";

const logger = getLogger();

/**
 * Register all multi-repo related commands
 */
export function registerMultiRepoCommands(
  context: vscode.ExtensionContext,
  ticketsProvider: UniversalTicketsProvider
): void {
  // Initialize repository registry
  initializeRepositoryRegistry(context);
  const registry = getRepositoryRegistry();
  const branchManager = new BranchAssociationManager(context, "both");

  // Open ticket in its repository window
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devBuddy.openInWorkspace",
      async (ticketIdOrArg?: string | { ticketId: string; repositoryPath?: string }) => {
        let ticketId: string;
        let repositoryPath: string | undefined;

        // Handle different argument formats
        if (typeof ticketIdOrArg === "string") {
          ticketId = ticketIdOrArg;
        } else if (ticketIdOrArg && typeof ticketIdOrArg === "object") {
          ticketId = ticketIdOrArg.ticketId;
          repositoryPath = ticketIdOrArg.repositoryPath;
        } else {
          // Prompt for ticket ID
          const input = await vscode.window.showInputBox({
            prompt: "Enter ticket ID (e.g., FE-123)",
            placeHolder: "TICKET-123",
          });
          if (!input) {
            return;
          }
          ticketId = input.trim().toUpperCase();
        }

        // Find repository for ticket
        if (!repositoryPath) {
          // Check global associations first
          const globalAssoc = branchManager.getGlobalAssociationForTicket(ticketId);
          if (globalAssoc) {
            repositoryPath = globalAssoc.repositoryPath;
          } else {
            // Try to find by ticket prefix
            const repo = await registry.getRepositoryForTicket(ticketId);
            if (repo) {
              repositoryPath = repo.path;
            }
          }
        }

        if (!repositoryPath) {
          vscode.window.showWarningMessage(
            `Could not find repository for ticket ${ticketId}. ` +
              "Try registering the repository or running 'Discover Related Repositories'."
          );
          return;
        }

        // Check if it's the current workspace
        const currentPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (currentPath && path.resolve(currentPath) === path.resolve(repositoryPath)) {
          vscode.window.showInformationMessage(
            `Ticket ${ticketId} is in the current workspace.`
          );
          return;
        }

        // Check CLI availability
        const cliAvailable = await isCliAvailable();
        if (!cliAvailable) {
          const instructions = getCliInstallInstructions();
          const install = await vscode.window.showWarningMessage(
            `CLI command not found for ${getForkDisplayName()}. Would you like to install it?`,
            "Show Instructions",
            "Open Anyway"
          );
          if (install === "Show Instructions") {
            vscode.window.showInformationMessage(instructions);
            return;
          }
        }

        // Open in new window
        const result = await openRepositoryWindow(repositoryPath, {
          ticketId,
          branchName: branchManager.getGlobalAssociationForTicket(ticketId)?.branchName,
          showNotification: true,
        });

        if (!result.success) {
          vscode.window.showErrorMessage(
            `Failed to open repository: ${result.error || "Unknown error"}`
          );
        }
      }
    )
  );

  // Discover related repositories
  context.subscriptions.push(
    vscode.commands.registerCommand("devBuddy.discoverRepositories", async () => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Discovering repositories...",
          cancellable: false,
        },
        async () => {
          const { discovered, alreadyRegistered } = await registry.discoverAndSuggest();

          if (discovered.length === 0) {
            if (alreadyRegistered.length > 0) {
              vscode.window.showInformationMessage(
                `All ${alreadyRegistered.length} repositories already registered.`
              );
            } else {
              vscode.window.showInformationMessage(
                "No new repositories found in the parent directory."
              );
            }
            return;
          }

          // Show quick pick for discovered repositories
          const items = discovered.map((repo) => ({
            label: repo.name,
            description: repo.path,
            detail: repo.ticketPrefixes.length > 0
              ? `Ticket prefixes: ${repo.ticketPrefixes.join(", ")}`
              : "No ticket prefixes detected",
            repo,
          }));

          const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: "Select repositories to register",
            title: `Found ${discovered.length} new repositories`,
          });

          if (!selected || selected.length === 0) {
            return;
          }

          // Register selected repositories
          for (const item of selected) {
            await registry.registerRepository(item.repo);
          }

          vscode.window.showInformationMessage(
            `Registered ${selected.length} repositories.`
          );
        }
      );
    })
  );

  // Register a repository manually
  context.subscriptions.push(
    vscode.commands.registerCommand("devBuddy.registerRepository", async () => {
      // Step 1: Get repository path
      const folders = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: "Select Repository",
        title: "Select a Git Repository",
      });

      if (!folders || folders.length === 0) {
        return;
      }

      const repoPath = folders[0].fsPath;

      // Verify it's a git repository
      const gitDir = path.join(repoPath, ".git");
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(gitDir));
      } catch {
        vscode.window.showErrorMessage(
          "Selected folder is not a Git repository."
        );
        return;
      }

      // Step 2: Get repository name
      const defaultName = path.basename(repoPath);
      const name = await vscode.window.showInputBox({
        prompt: "Repository name",
        value: defaultName,
        placeHolder: "e.g., frontend-app",
      });

      if (!name) {
        return;
      }

      // Step 3: Get ticket prefixes
      const prefixesInput = await vscode.window.showInputBox({
        prompt: "Ticket prefixes (comma-separated)",
        placeHolder: "e.g., FE, FRONT, UI",
        value: "",
      });

      const ticketPrefixes = prefixesInput
        ? prefixesInput
            .split(",")
            .map((p) => p.trim().toUpperCase())
            .filter(Boolean)
        : [];

      // Step 4: Register
      const repoId = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      
      await registry.registerRepository({
        id: repoId,
        name,
        path: repoPath,
        ticketPrefixes,
        isAutoDiscovered: false,
      });

      vscode.window.showInformationMessage(
        `Registered repository: ${name}` +
          (ticketPrefixes.length > 0
            ? ` (prefixes: ${ticketPrefixes.join(", ")})`
            : "")
      );
    })
  );

  // Migrate branch associations to global storage
  context.subscriptions.push(
    vscode.commands.registerCommand("devBuddy.migrateToGlobalStorage", async () => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Migrating branch associations...",
          cancellable: false,
        },
        async () => {
          const count = await branchManager.migrateToGlobalStorage();
          
          if (count > 0) {
            vscode.window.showInformationMessage(
              `Migrated ${count} branch associations to global storage.`
            );
          } else {
            vscode.window.showInformationMessage(
              "No new associations to migrate (all already in global storage)."
            );
          }
        }
      );
    })
  );

  logger.debug("Registered multi-repo commands");
}

