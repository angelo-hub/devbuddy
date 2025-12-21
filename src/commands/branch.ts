import * as vscode from "vscode";
import simpleGit from "simple-git";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";
import { getLogger } from "@shared/utils/logger";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";
import { getCurrentPlatform } from "@shared/utils/platformDetector";
import { LinearIssue } from "@providers/linear/types";
import { JiraIssue } from "@providers/jira/common/types";

const logger = getLogger();

// Type guard for Linear issues
function isLinearIssue(issue: LinearIssue | JiraIssue): issue is LinearIssue {
  return 'identifier' in issue && !('key' in issue);
}

// Get ticket identifier (works for both platforms)
function getTicketIdentifier(issue: LinearIssue | JiraIssue): string {
  return isLinearIssue(issue) ? issue.identifier : issue.key;
}

// Get ticket title (works for both platforms)
function getTicketTitle(issue: LinearIssue | JiraIssue): string {
  return isLinearIssue(issue) ? issue.title : issue.summary;
}

/**
 * Generate a branch name based on ticket and naming convention
 */
function generateBranchName(
  ticketId: string,
  ticketTitle: string,
  convention: string,
  customTemplate?: string
): string {
  // Create a slug from the ticket title
  const slug = ticketTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);

  switch (convention) {
    case "conventional":
      return `feat/${ticketId.toLowerCase()}-${slug}`;
    case "simple":
      return `${ticketId.toLowerCase()}-${slug}`;
    case "ticket-only":
      return ticketId.toLowerCase();
    case "custom":
      if (customTemplate) {
        return customTemplate
          .replace("{type}", "feat")
          .replace("{identifier}", ticketId.toLowerCase())
          .replace("{slug}", slug);
      }
      return `feat/${ticketId.toLowerCase()}-${slug}`;
    default:
      return `feat/${ticketId.toLowerCase()}-${slug}`;
  }
}

/**
 * Register branch-related commands (works across all platforms)
 */
export function registerBranchCommands(
  context: vscode.ExtensionContext,
  ticketsProvider: UniversalTicketsProvider | undefined
): void {
  const branchManager = new BranchAssociationManager(context);

  context.subscriptions.push(
    // ==================== START BRANCH ====================
    // Creates a new branch for a ticket and updates status
    vscode.commands.registerCommand(
      "devBuddy.startBranch",
      async (item: { issue?: LinearIssue | JiraIssue; ticket?: LinearIssue | JiraIssue }) => {
        const issue = item?.issue || item?.ticket;
        if (!issue) {
          vscode.window.showErrorMessage("No ticket selected");
          return;
        }

        const ticketId = getTicketIdentifier(issue);
        const ticketTitle = getTicketTitle(issue);

        // Get branch naming convention
        const config = vscode.workspace.getConfiguration("devBuddy");
        const convention = config.get<string>(
          "branchNamingConvention",
          "conventional"
        );
        const customTemplate = config.get<string>("customBranchTemplate");

        // Generate branch name
        const suggestedBranch = generateBranchName(
          ticketId,
          ticketTitle,
          convention,
          customTemplate
        );

        // Ask user to confirm/modify branch name
        const branchName = await vscode.window.showInputBox({
          prompt: `Create branch for ${ticketId}`,
          value: suggestedBranch,
          placeHolder: "Enter branch name",
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {
              return "Branch name cannot be empty";
            }
            if (!/^[a-zA-Z0-9/_-]+$/.test(value)) {
              return "Branch name contains invalid characters";
            }
            return null;
          },
        });

        if (!branchName) {
          return; // User cancelled
        }

        // Get workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          vscode.window.showErrorMessage("No workspace folder open");
          return;
        }

        try {
          const git = simpleGit(workspaceFolders[0].uri.fsPath);

          // Check if we're in a git repository
          const isRepo = await git.checkIsRepo();
          if (!isRepo) {
            vscode.window.showErrorMessage(
              "Current workspace is not a git repository"
            );
            return;
          }

          // Check if branch already exists
          const branches = await git.branch();
          if (branches.all.includes(branchName)) {
            const action = await vscode.window.showWarningMessage(
              `Branch '${branchName}' already exists. What would you like to do?`,
              "Checkout existing",
              "Choose different name",
              "Cancel"
            );

            if (action === "Checkout existing") {
              await git.checkout(branchName);
              await branchManager.associateBranch(ticketId, branchName);
              vscode.window.showInformationMessage(
                `Checked out existing branch: ${branchName}`
              );
              ticketsProvider?.refresh();
              return;
            } else if (action !== "Choose different name") {
              return;
            } else {
              // Recursively call to let user pick a new name
              await vscode.commands.executeCommand("devBuddy.startBranch", item);
              return;
            }
          }

          // Check for uncommitted changes
          const status = await git.status();
          if (status.modified.length > 0 || status.created.length > 0 || status.deleted.length > 0) {
            const action = await vscode.window.showWarningMessage(
              "You have uncommitted changes. Creating a new branch will carry them over.",
              "Continue",
              "Stash changes",
              "Cancel"
            );

            if (action === "Cancel") {
              return;
            } else if (action === "Stash changes") {
              await git.stash(["push", "-u", "-m", `Auto-stash before creating ${branchName}`]);
              vscode.window.showInformationMessage(
                "Changes stashed. Use 'git stash pop' to restore them."
              );
            }
          }

          // Create and checkout the branch
          await git.checkoutLocalBranch(branchName);

          // Associate branch with ticket
          await branchManager.associateBranch(ticketId, branchName);

          vscode.window.showInformationMessage(
            `Created and checked out branch: ${branchName} 🚀`
          );

          // Optionally update ticket status to "In Progress"
          const platform = getCurrentPlatform();
          if (platform === "linear") {
            const startWork = await vscode.window.showInformationMessage(
              `Start work on ${ticketId}?`,
              "Yes, update status",
              "No, just branch"
            );
            if (startWork === "Yes, update status") {
              await vscode.commands.executeCommand("devBuddy.startWork", { issue });
            }
          }

          ticketsProvider?.refresh();
        } catch (error) {
          logger.error("Failed to create branch:", error);
          vscode.window.showErrorMessage(
            `Failed to create branch: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }
    ),

    // ==================== CHECKOUT BRANCH ====================
    // Checkout an existing branch associated with a ticket
    vscode.commands.registerCommand(
      "devBuddy.checkoutBranch",
      async (item: { issue?: LinearIssue | JiraIssue; ticket?: LinearIssue | JiraIssue }) => {
        const issue = item?.issue || item?.ticket;
        if (!issue) {
          vscode.window.showErrorMessage("No ticket selected");
          return;
        }

        const ticketId = getTicketIdentifier(issue);
        const success = await branchManager.checkoutBranch(ticketId);
        
        if (success) {
          ticketsProvider?.refresh();
        }
      }
    ),

    // ==================== ASSOCIATE BRANCH FROM SIDEBAR ====================
    // Associate an existing branch with a ticket
    vscode.commands.registerCommand(
      "devBuddy.associateBranchFromSidebar",
      async (item: { issue?: LinearIssue | JiraIssue; ticket?: LinearIssue | JiraIssue }) => {
        const issue = item?.issue || item?.ticket;
        if (!issue) {
          vscode.window.showErrorMessage("No ticket selected");
          return;
        }

        const ticketId = getTicketIdentifier(issue);

        // Get all local branches
        const allBranches = await branchManager.getAllLocalBranches();
        const currentBranch = await branchManager.getCurrentBranch();
        const suggestions = await branchManager.suggestAssociationsForTicket(ticketId);

        if (allBranches.length === 0) {
          vscode.window.showWarningMessage("No local branches found");
          return;
        }

        // Sort branches: suggestions first, current second, then alphabetically
        const sortedBranches = allBranches.sort((a, b) => {
          if (suggestions.includes(a) && !suggestions.includes(b)) return -1;
          if (!suggestions.includes(a) && suggestions.includes(b)) return 1;
          if (a === currentBranch) return -1;
          if (b === currentBranch) return 1;
          return a.localeCompare(b);
        });

        const items = sortedBranches.map((branch) => {
          let description = "";
          if (branch === currentBranch) description = "$(check) Current branch";
          else if (suggestions.includes(branch)) description = "$(lightbulb) Suggested";
          
          return {
            label: branch,
            description,
            picked: branch === currentBranch,
          };
        });

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: `Select branch to associate with ${ticketId}`,
          ignoreFocusOut: true,
        });

        if (selected) {
          const success = await branchManager.associateBranch(ticketId, selected.label);
          if (success) {
            vscode.window.showInformationMessage(
              `Branch '${selected.label}' associated with ${ticketId}`
            );
            ticketsProvider?.refresh();
          }
        }
      }
    ),

    // ==================== AUTO-DETECT BRANCHES ====================
    // Auto-detect branch associations based on naming patterns
    vscode.commands.registerCommand(
      "devBuddy.autoDetectBranches",
      async () => {
        const detected = await branchManager.autoDetectAllBranchAssociations();

        if (detected.length === 0) {
          vscode.window.showInformationMessage(
            "No new branch associations detected"
          );
          return;
        }

        const items = detected.map((d) => ({
          label: d.ticketId,
          description: d.branchName,
          picked: true,
          data: d,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select associations to create",
          canPickMany: true,
          ignoreFocusOut: true,
        });

        if (selected && selected.length > 0) {
          let count = 0;
          for (const item of selected) {
            const success = await branchManager.associateBranch(
              item.data.ticketId,
              item.data.branchName,
              true // isAutoDetected
            );
            if (success) count++;
          }

          vscode.window.showInformationMessage(
            `Created ${count} branch association(s)`
          );
          ticketsProvider?.refresh();
        }
      }
    ),

    // ==================== SHOW BRANCH ANALYTICS ====================
    vscode.commands.registerCommand(
      "devBuddy.showBranchAnalytics",
      async () => {
        const analytics = await branchManager.getBranchAnalytics();

        const message = [
          `📊 Branch Analytics`,
          ``,
          `Total Associations: ${analytics.totalAssociations}`,
          `Active Associations: ${analytics.activeAssociations}`,
          `Stale Branches: ${analytics.staleBranches}`,
        ].join("\n");

        const action = await vscode.window.showInformationMessage(
          message,
          { modal: true },
          "Cleanup Stale",
          "View Details"
        );

        if (action === "Cleanup Stale") {
          await vscode.commands.executeCommand("devBuddy.cleanupBranchAssociations");
        } else if (action === "View Details") {
          // Show more detailed view
          const details = [
            `📊 Branch Analytics`,
            ``,
            `Total Associations: ${analytics.totalAssociations}`,
            `Active: ${analytics.activeAssociations}`,
            `Stale (deleted branches): ${analytics.staleBranches}`,
            ``,
            `Most Used Branches:`,
            ...analytics.mostUsedBranches.slice(0, 5).map(
              (b) => `  • ${b.ticketId}: ${b.branchName} (${b.usageCount}x)`
            ),
            ``,
            `Oldest Associations:`,
            ...analytics.oldestAssociations.slice(0, 5).map(
              (a) => `  • ${a.ticketId}: ${a.daysSinceLastUpdate} days old`
            ),
          ].join("\n");

          await vscode.window.showInformationMessage(details, { modal: true });
        }
      }
    ),

    // ==================== CLEANUP BRANCH ASSOCIATIONS ====================
    vscode.commands.registerCommand(
      "devBuddy.cleanupBranchAssociations",
      async () => {
        const suggestions = await branchManager.getCleanupSuggestions();

        if (
          suggestions.staleBranches.length === 0 &&
          suggestions.oldAssociations.length === 0
        ) {
          vscode.window.showInformationMessage(
            "No stale or old associations found. Everything is clean! ✨"
          );
          return;
        }

        const items: Array<{ label: string; description: string; data: { ticketId: string; type: string } }> = [];

        // Add stale branches
        for (const stale of suggestions.staleBranches) {
          items.push({
            label: `$(warning) ${stale.ticketId}`,
            description: `${stale.branchName} (deleted)`,
            data: { ticketId: stale.ticketId, type: "stale" },
          });
        }

        // Add old associations (30+ days)
        for (const old of suggestions.oldAssociations) {
          items.push({
            label: `$(clock) ${old.ticketId}`,
            description: `${old.branchName} (${old.daysSinceLastUpdate} days old)`,
            data: { ticketId: old.ticketId, type: "old" },
          });
        }

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select associations to remove",
          canPickMany: true,
          ignoreFocusOut: true,
        });

        if (selected && selected.length > 0) {
          let count = 0;
          for (const item of selected) {
            const success = await branchManager.removeAssociation(item.data.ticketId);
            if (success) count++;
          }

          vscode.window.showInformationMessage(
            `Cleaned up ${count} association(s)`
          );
          ticketsProvider?.refresh();
        }
      }
    )
  );

  logger.debug("Branch commands registered");
}

