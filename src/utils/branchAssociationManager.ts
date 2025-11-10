import * as vscode from "vscode";
import simpleGit from "simple-git";
import { getLogger } from "./logger";

export interface BranchAssociation {
  ticketId: string;
  branchName: string;
  lastUpdated: string;
  isAutoDetected?: boolean;
}

export interface BranchHistory {
  ticketId: string;
  branches: Array<{
    branchName: string;
    associatedAt: string;
    lastUsed: string;
    isActive: boolean;
  }>;
}

/**
 * Manages associations between Linear tickets and git branches
 * Stores them in workspace state for now, with future support for Linear attachments
 */
export class BranchAssociationManager {
  private static readonly STORAGE_KEY = "devBuddy.branchAssociations";
  private static readonly HISTORY_KEY = "devBuddy.branchHistory";
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Get all branch history
   */
  getAllHistory(): BranchHistory[] {
    return (
      this.context.workspaceState.get<BranchHistory[]>(
        BranchAssociationManager.HISTORY_KEY
      ) || []
    );
  }

  /**
   * Get branch history for a specific ticket
   */
  getHistoryForTicket(ticketId: string): BranchHistory | null {
    const allHistory = this.getAllHistory();
    return allHistory.find((h) => h.ticketId === ticketId) || null;
  }

  /**
   * Add branch to ticket history
   */
  private async addToHistory(
    ticketId: string,
    branchName: string,
    isActive: boolean = true
  ): Promise<void> {
    try {
      const allHistory = this.getAllHistory();
      let ticketHistory = allHistory.find((h) => h.ticketId === ticketId);

      if (!ticketHistory) {
        ticketHistory = {
          ticketId,
          branches: [],
        };
        allHistory.push(ticketHistory);
      }

      // Deactivate all other branches for this ticket if this is the active one
      if (isActive) {
        ticketHistory.branches.forEach((b) => (b.isActive = false));
      }

      // Check if branch already exists in history
      const existingBranch = ticketHistory.branches.find(
        (b) => b.branchName === branchName
      );

      if (existingBranch) {
        existingBranch.lastUsed = new Date().toISOString();
        existingBranch.isActive = isActive;
      } else {
        ticketHistory.branches.push({
          branchName,
          associatedAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          isActive,
        });
      }

      // Sort by lastUsed (most recent first)
      ticketHistory.branches.sort(
        (a, b) =>
          new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      );

      await this.context.workspaceState.update(
        BranchAssociationManager.HISTORY_KEY,
        allHistory
      );
    } catch (error) {
      console.error("[Linear Buddy] Failed to update branch history:", error);
    }
  }

  /**
   * Mark branch as disassociated in history (but keep it in history)
   */
  private async markDisassociatedInHistory(
    ticketId: string,
    branchName: string
  ): Promise<void> {
    try {
      const allHistory = this.getAllHistory();
      const ticketHistory = allHistory.find((h) => h.ticketId === ticketId);

      if (ticketHistory) {
        const branch = ticketHistory.branches.find(
          (b) => b.branchName === branchName
        );
        if (branch) {
          branch.isActive = false;
        }

        await this.context.workspaceState.update(
          BranchAssociationManager.HISTORY_KEY,
          allHistory
        );
      }
    } catch (error) {
      console.error(
        "[Linear Buddy] Failed to mark branch as disassociated:",
        error
      );
    }
  }

  /**
   * Auto-detect all branches that match ticket patterns and suggest associations
   */
  async autoDetectAllBranchAssociations(): Promise<
    Array<{ ticketId: string; branchName: string }>
  > {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return [];
      }

      const git = simpleGit(workspaceFolders[0].uri.fsPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return [];
      }

      // Get all local branches
      const branchSummary = await git.branch();
      const allBranches = branchSummary.all.filter(
        (b) => !b.startsWith("remotes/")
      );

      // Extract ticket IDs from each branch
      const detectedAssociations: Array<{
        ticketId: string;
        branchName: string;
      }> = [];

      for (const branch of allBranches) {
        const match = branch.match(/([A-Z]+-\d+)/);
        if (match) {
          const ticketId = match[1];
          // Check if not already associated
          const existingAssoc = this.getBranchForTicket(ticketId);
          if (!existingAssoc) {
            detectedAssociations.push({ ticketId, branchName: branch });
          }
        }
      }

      return detectedAssociations;
    } catch (error) {
      console.error("[Linear Buddy] Failed to auto-detect branches:", error);
      return [];
    }
  }

  /**
   * Suggest associations for tickets based on branch naming patterns
   */
  async suggestAssociationsForTicket(ticketId: string): Promise<string[]> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return [];
      }

      const git = simpleGit(workspaceFolders[0].uri.fsPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return [];
      }

      // Get all local branches
      const branchSummary = await git.branch();
      const allBranches = branchSummary.all.filter(
        (b) => !b.startsWith("remotes/")
      );

      // Find branches containing the ticket ID
      const suggestions = allBranches.filter((branch) =>
        branch.includes(ticketId)
      );

      return suggestions;
    } catch (error) {
      console.error("[Linear Buddy] Failed to suggest branches:", error);
      return [];
    }
  }

  /**
   * Get all branch associations
   */
  getAllAssociations(): BranchAssociation[] {
    return (
      this.context.workspaceState.get<BranchAssociation[]>(
        BranchAssociationManager.STORAGE_KEY
      ) || []
    );
  }

  /**
   * Get branch associated with a ticket
   */
  getBranchForTicket(ticketId: string): string | null {
    const associations = this.getAllAssociations();
    const association = associations.find((a) => a.ticketId === ticketId);
    return association?.branchName || null;
  }

  /**
   * Get ticket associated with a branch
   */
  getTicketForBranch(branchName: string): string | null {
    const associations = this.getAllAssociations();
    const association = associations.find((a) => a.branchName === branchName);
    return association?.ticketId || null;
  }

  /**
   * Associate a ticket with a branch
   */
  async associateBranch(
    ticketId: string,
    branchName: string,
    isAutoDetected: boolean = false
  ): Promise<boolean> {
    try {
      const associations = this.getAllAssociations();

      // Remove any existing association for this ticket
      const filtered = associations.filter((a) => a.ticketId !== ticketId);

      // Add the new association
      filtered.push({
        ticketId,
        branchName,
        lastUpdated: new Date().toISOString(),
        isAutoDetected,
      });

      await this.context.workspaceState.update(
        BranchAssociationManager.STORAGE_KEY,
        filtered
      );

      // Update history
      await this.addToHistory(ticketId, branchName);

      getLogger().info(
        `Associated ${ticketId} with branch: ${branchName}${
          isAutoDetected ? " (auto-detected)" : ""
        }`
      );
      return true;
    } catch (error) {
      console.error("[Linear Buddy] Failed to associate branch:", error);
      return false;
    }
  }

  /**
   * Remove association for a ticket
   */
  async removeAssociation(ticketId: string): Promise<boolean> {
    try {
      const associations = this.getAllAssociations();
      const existing = associations.find((a) => a.ticketId === ticketId);

      if (existing) {
        // Mark as disassociated in history
        await this.markDisassociatedInHistory(ticketId, existing.branchName);
      }

      const filtered = associations.filter((a) => a.ticketId !== ticketId);

      await this.context.workspaceState.update(
        BranchAssociationManager.STORAGE_KEY,
        filtered
      );

      getLogger().info(`Removed association for ${ticketId}`);
      return true;
    } catch (error) {
      getLogger().error("Failed to remove association", error);
      return false;
    }
  }

  /**
   * Auto-detect and associate current branch with ticket
   * Extracts ticket ID from branch name (e.g., OB-1234 from feature/OB-1234-description)
   */
  async autoAssociateCurrentBranch(): Promise<boolean> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return false;
      }

      const git = simpleGit(workspaceFolders[0].uri.fsPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return false;
      }

      // Get current branch
      const branchSummary = await git.branch();
      const currentBranch = branchSummary.current;

      // Extract ticket ID from branch name
      const match = currentBranch.match(/([A-Z]+-\d+)/);
      if (!match) {
        return false;
      }

      const ticketId = match[1];
      await this.associateBranch(ticketId, currentBranch);
      return true;
    } catch (error) {
      console.error("[Linear Buddy] Failed to auto-associate branch:", error);
      return false;
    }
  }

  /**
   * Verify that a branch exists in the repository
   */
  async verifyBranchExists(branchName: string): Promise<boolean> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return false;
      }

      const git = simpleGit(workspaceFolders[0].uri.fsPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return false;
      }

      const branchSummary = await git.branch();
      return branchSummary.all.includes(branchName);
    } catch (error) {
      console.error("[Linear Buddy] Failed to verify branch:", error);
      return false;
    }
  }

  /**
   * Check if there are uncommitted changes in the repository
   */
  async hasUncommittedChanges(): Promise<boolean> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return false;
      }

      const git = simpleGit(workspaceFolders[0].uri.fsPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return false;
      }

      const status = await git.status();
      // Check for any modified, added, deleted, or untracked files
      return (
        status.modified.length > 0 ||
        status.created.length > 0 ||
        status.deleted.length > 0 ||
        status.renamed.length > 0 ||
        status.staged.length > 0
      );
    } catch (error) {
      console.error(
        "[Linear Buddy] Failed to check uncommitted changes:",
        error
      );
      return false;
    }
  }

  /**
   * Get summary of uncommitted changes
   */
  async getUncommittedChangesSummary(): Promise<string> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return "";
      }

      const git = simpleGit(workspaceFolders[0].uri.fsPath);
      const status = await git.status();

      const changes: string[] = [];
      if (status.staged.length > 0) {
        changes.push(`${status.staged.length} staged`);
      }
      if (status.modified.length > 0) {
        changes.push(`${status.modified.length} modified`);
      }
      if (status.created.length > 0) {
        changes.push(`${status.created.length} created`);
      }
      if (status.deleted.length > 0) {
        changes.push(`${status.deleted.length} deleted`);
      }

      return changes.join(", ");
    } catch (error) {
      return "unknown changes";
    }
  }

  /**
   * Checkout a branch associated with a ticket
   */
  async checkoutBranch(ticketId: string): Promise<boolean> {
    try {
      const branchName = this.getBranchForTicket(ticketId);
      if (!branchName) {
        vscode.window.showWarningMessage(
          `No branch associated with ${ticketId}`
        );
        return false;
      }

      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder open");
        return false;
      }

      const git = simpleGit(workspaceFolders[0].uri.fsPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        vscode.window.showErrorMessage(
          "Current workspace is not a git repository"
        );
        return false;
      }

      // Verify branch exists
      const branchExists = await this.verifyBranchExists(branchName);
      if (!branchExists) {
        const shouldRemove = await vscode.window.showWarningMessage(
          `Branch '${branchName}' no longer exists. Remove association?`,
          "Yes",
          "No"
        );

        if (shouldRemove === "Yes") {
          await this.removeAssociation(ticketId);
        }
        return false;
      }

      // Check for uncommitted changes
      const hasChanges = await this.hasUncommittedChanges();
      if (hasChanges) {
        const status = await git.status();
        const changedFiles = [
          ...status.modified,
          ...status.created,
          ...status.deleted,
          ...status.renamed.map((r) => r.from),
        ];

        const fileList = changedFiles.slice(0, 5).join("\n  ");
        const moreFiles =
          changedFiles.length > 5
            ? `\n  ... and ${changedFiles.length - 5} more`
            : "";

        const action = await vscode.window.showWarningMessage(
          `You have uncommitted changes. What would you like to do?\n\nFiles with changes:\n  ${fileList}${moreFiles}`,
          {
            modal: true,
            detail:
              "Switching branches with uncommitted changes may cause conflicts or data loss.",
          },
          "Stash & Checkout",
          "Checkout Anyway",
          "Cancel"
        );

        if (!action || action === "Cancel") {
          return false;
        }

        if (action === "Stash & Checkout") {
          // Stash changes with a descriptive message
          const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
          await git.stash([
            "push",
            "-u",
            "-m",
            `Auto-stash from ${currentBranch.trim()} before switching to ${branchName}`,
          ]);
          vscode.window.showInformationMessage(
            "Changes stashed. Use 'git stash pop' to restore them."
          );
        }
        // If "Checkout Anyway", we proceed without stashing
      }

      // Checkout the branch
      await git.checkout(branchName);
      vscode.window.showInformationMessage(
        `Checked out branch: ${branchName} 🚀`
      );
      return true;
    } catch (error) {
      console.error("[Linear Buddy] Failed to checkout branch:", error);
      vscode.window.showErrorMessage(
        `Failed to checkout branch: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  }

  /**
   * Get all local branches
   */
  async getAllLocalBranches(): Promise<string[]> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return [];
      }

      const git = simpleGit(workspaceFolders[0].uri.fsPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return [];
      }

      const branchSummary = await git.branch();
      // Filter out remote branches, return only local ones
      return branchSummary.all.filter((b) => !b.startsWith("remotes/"));
    } catch (error) {
      console.error("[Linear Buddy] Failed to get branches:", error);
      return [];
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string | null> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
      }

      const git = simpleGit(workspaceFolders[0].uri.fsPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return null;
      }

      const branch = await git.revparse(["--abbrev-ref", "HEAD"]);
      return branch.trim();
    } catch (error) {
      console.error("[Linear Buddy] Failed to get current branch:", error);
      return null;
    }
  }

  /**
   * Clean up stale associations (branches that no longer exist)
   */
  async cleanupStaleAssociations(): Promise<number> {
    try {
      const associations = this.getAllAssociations();
      const validAssociations: BranchAssociation[] = [];

      for (const association of associations) {
        const exists = await this.verifyBranchExists(association.branchName);
        if (exists) {
          validAssociations.push(association);
        }
      }

      const removedCount = associations.length - validAssociations.length;
      if (removedCount > 0) {
        await this.context.workspaceState.update(
          BranchAssociationManager.STORAGE_KEY,
          validAssociations
        );
        getLogger().info(
          `Cleaned up ${removedCount} stale branch associations`
        );
      }

      return removedCount;
    } catch (error) {
      console.error("[Linear Buddy] Failed to cleanup associations:", error);
      return 0;
    }
  }

  /**
   * Get analytics about branch usage
   */
  async getBranchAnalytics(): Promise<{
    totalAssociations: number;
    activeAssociations: number;
    staleBranches: number;
    mostUsedBranches: Array<{
      branchName: string;
      ticketId: string;
      usageCount: number;
    }>;
    oldestAssociations: Array<{
      ticketId: string;
      branchName: string;
      daysSinceLastUpdate: number;
    }>;
  }> {
    try {
      const associations = this.getAllAssociations();
      let staleBranchCount = 0;

      // Check for stale branches
      for (const assoc of associations) {
        const exists = await this.verifyBranchExists(assoc.branchName);
        if (!exists) {
          staleBranchCount++;
        }
      }

      // Get oldest associations (not updated in > 30 days)
      const oldAssociations = associations
        .map((assoc) => {
          const daysSince =
            (Date.now() - new Date(assoc.lastUpdated).getTime()) /
            (1000 * 60 * 60 * 24);
          return {
            ticketId: assoc.ticketId,
            branchName: assoc.branchName,
            daysSinceLastUpdate: Math.floor(daysSince),
          };
        })
        .filter((a) => a.daysSinceLastUpdate > 30)
        .sort((a, b) => b.daysSinceLastUpdate - a.daysSinceLastUpdate)
        .slice(0, 10);

      // Get usage statistics from history
      const allHistory = this.getAllHistory();
      const branchUsage = new Map<
        string,
        { branchName: string; ticketId: string; count: number }
      >();

      allHistory.forEach((history) => {
        history.branches.forEach((branch) => {
          const key = `${branch.branchName}:${history.ticketId}`;
          if (!branchUsage.has(key)) {
            branchUsage.set(key, {
              branchName: branch.branchName,
              ticketId: history.ticketId,
              count: 1,
            });
          } else {
            const existing = branchUsage.get(key)!;
            existing.count++;
          }
        });
      });

      const mostUsed = Array.from(branchUsage.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((item) => ({
          branchName: item.branchName,
          ticketId: item.ticketId,
          usageCount: item.count,
        }));

      return {
        totalAssociations: associations.length,
        activeAssociations: associations.length,
        staleBranches: staleBranchCount,
        mostUsedBranches: mostUsed,
        oldestAssociations: oldAssociations,
      };
    } catch (error) {
      console.error("[Linear Buddy] Failed to get analytics:", error);
      return {
        totalAssociations: 0,
        activeAssociations: 0,
        staleBranches: 0,
        mostUsedBranches: [],
        oldestAssociations: [],
      };
    }
  }

  /**
   * Get cleanup suggestions
   */
  async getCleanupSuggestions(): Promise<{
    staleBranches: Array<{ ticketId: string; branchName: string }>;
    oldAssociations: Array<{
      ticketId: string;
      branchName: string;
      daysSinceLastUpdate: number;
    }>;
    duplicateBranches: Array<{
      branchName: string;
      ticketIds: string[];
    }>;
  }> {
    try {
      const associations = this.getAllAssociations();
      const staleBranches: Array<{ ticketId: string; branchName: string }> = [];

      // Find stale branches
      for (const assoc of associations) {
        const exists = await this.verifyBranchExists(assoc.branchName);
        if (!exists) {
          staleBranches.push({
            ticketId: assoc.ticketId,
            branchName: assoc.branchName,
          });
        }
      }

      // Find old associations
      const oldAssociations = associations
        .map((assoc) => {
          const daysSince =
            (Date.now() - new Date(assoc.lastUpdated).getTime()) /
            (1000 * 60 * 60 * 24);
          return {
            ticketId: assoc.ticketId,
            branchName: assoc.branchName,
            daysSinceLastUpdate: Math.floor(daysSince),
          };
        })
        .filter((a) => a.daysSinceLastUpdate > 30);

      // Find duplicate branches (same branch associated with multiple tickets)
      const branchMap = new Map<string, string[]>();
      associations.forEach((assoc) => {
        if (!branchMap.has(assoc.branchName)) {
          branchMap.set(assoc.branchName, []);
        }
        branchMap.get(assoc.branchName)!.push(assoc.ticketId);
      });

      const duplicateBranches = Array.from(branchMap.entries())
        .filter(([_, ticketIds]) => ticketIds.length > 1)
        .map(([branchName, ticketIds]) => ({ branchName, ticketIds }));

      return {
        staleBranches,
        oldAssociations,
        duplicateBranches,
      };
    } catch (error) {
      console.error("[Linear Buddy] Failed to get cleanup suggestions:", error);
      return {
        staleBranches: [],
        oldAssociations: [],
        duplicateBranches: [],
      };
    }
  }
}
