import simpleGit, { SimpleGit, LogResult } from "simple-git";
import * as vscode from "vscode";

export interface GitContext {
  currentBranch: string;
  ticketId: string | null;
  changedFiles: string[];
  commits: Array<{ hash: string; message: string; branch?: string }>;
  baseBranch: string;
}

export interface MultiTicketContext {
  tickets: Array<{ id: string; description: string }>;
  allCommits: Array<{
    hash: string;
    message: string;
    branch: string;
    ticketId: string | null;
  }>;
  allChangedFiles: string[];
  currentBranch: string;
  baseBranch: string;
}

export class GitAnalyzer {
  private git: SimpleGit;
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.git = simpleGit(workspaceRoot);
  }

  /**
   * Get the current branch name
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.git.revparse(["--abbrev-ref", "HEAD"]);
      return branch.trim();
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error}`);
    }
  }

  /**
   * Extract ticket ID from branch name
   * Supports Linear issues (e.g., ENG-123) and Jira keys (e.g., PROJ-123)
   * Pattern: [A-Z]+-\d+ matches both formats
   */
  extractTicketId(branchName: string): string | null {
    const match = branchName.match(/[A-Z]+-\d+/);
    return match ? match[0] : null;
  }

  /**
   * Get the base branch with fallback logic: config → main → master
   */
  async getBaseBranch(): Promise<string> {
    const config = vscode.workspace.getConfiguration("devBuddy");
    const configuredBranch = config.get<string>("baseBranch", "main");

    // Check if configured branch exists
    try {
      await this.git.revparse(["--verify", configuredBranch]);
      return configuredBranch;
    } catch {
      // Try 'main'
      try {
        await this.git.revparse(["--verify", "main"]);
        return "main";
      } catch {
        // Try 'master'
        try {
          await this.git.revparse(["--verify", "master"]);
          return "master";
        } catch {
          throw new Error(
            "Could not find base branch (tried: " +
              configuredBranch +
              ", main, master)"
          );
        }
      }
    }
  }

  /**
   * Get list of changed files compared to base branch
   */
  async getChangedFiles(baseBranch: string): Promise<string[]> {
    try {
      const diffResult = await this.git.diff([
        "--name-only",
        `${baseBranch}...HEAD`,
      ]);
      return diffResult
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } catch (error) {
      throw new Error(`Failed to get changed files: ${error}`);
    }
  }

  /**
   * Get commits since base branch or time window
   */
  async getCommits(
    baseBranch: string,
    since?: string
  ): Promise<Array<{ hash: string; message: string }>> {
    try {
      let logOptions: any = {};

      if (since) {
        logOptions = { "--since": since };
      } else {
        logOptions = { from: baseBranch, to: "HEAD" };
      }

      const log: LogResult = await this.git.log(logOptions);

      return log.all.map((commit) => ({
        hash: commit.hash.substring(0, 7),
        message: commit.message,
      }));
    } catch (error) {
      // If no commits, return empty array instead of throwing
      return [];
    }
  }

  /**
   * Get full git context for the current branch
   */
  async getGitContext(since?: string): Promise<GitContext> {
    const currentBranch = await this.getCurrentBranch();
    const ticketId = this.extractTicketId(currentBranch);
    const baseBranch = await this.getBaseBranch();
    const changedFiles = await this.getChangedFiles(baseBranch);
    const commits = await this.getCommits(baseBranch, since);

    return {
      currentBranch,
      ticketId,
      changedFiles,
      commits,
      baseBranch,
    };
  }

  /**
   * Check if the current directory is a git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.revparse(["--git-dir"]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get actual diff (line changes) for files
   */
  async getFileDiffs(
    baseBranch: string,
    maxLines: number = 200
  ): Promise<string> {
    try {
      // Get actual unified diff with context (removed --stat for actual code changes)
      const diffResult = await this.git.diff([
        baseBranch,
        "HEAD",
        "--unified=3", // 3 lines of context (good for AI understanding)
        "--no-color", // Remove ANSI color codes
        "--no-prefix", // Cleaner paths (removes a/ b/ prefixes)
        "--",
      ]);

      // Better truncation: try to preserve complete hunks
      const lines = diffResult.split("\n");
      if (lines.length <= maxLines) {
        return diffResult;
      }

      // Truncate but try to end at a complete hunk
      let truncatedLines = lines.slice(0, maxLines);

      // Find last complete hunk (ends with context or new file marker)
      for (let i = truncatedLines.length - 1; i >= 0; i--) {
        if (
          truncatedLines[i].startsWith("diff --git") ||
          truncatedLines[i].startsWith("@@")
        ) {
          truncatedLines = truncatedLines.slice(0, i);
          break;
        }
      }

      return (
        truncatedLines.join("\n") +
        `\n\n[... truncated ${
          lines.length - truncatedLines.length
        } lines for brevity ...]`
      );
    } catch (error) {
      console.error("Error getting file diffs:", error);
      return "";
    }
  }

  /**
   * Get commits across all local branches within a time window
   */
  async getCommitsAcrossBranches(since: string): Promise<
    Array<{
      hash: string;
      message: string;
      branch: string;
      ticketId: string | null;
    }>
  > {
    try {
      // Get all commits from all branches with author info
      const log: LogResult = await this.git.log({
        "--all": null,
        "--since": since,
        "--format": "%H|%s|%D", // hash|message|refs
      } as any);

      const commits = log.all.map((commit) => {
        // Extract branch name from refs
        const refs = (commit as any).refs || "";
        let branch = "unknown";

        // Try to find a branch name in refs
        const branchMatch = refs.match(/(?:origin\/)?([^,\s]+)/);
        if (branchMatch) {
          branch = branchMatch[1];
        }

        // Extract ticket ID from commit message
        const ticketId = this.extractTicketId(commit.message);

        return {
          hash: commit.hash.substring(0, 7),
          message: commit.message,
          branch,
          ticketId,
        };
      });

      return commits;
    } catch (error) {
      console.error("Error getting commits across branches:", error);
      return [];
    }
  }

  /**
   * Get all ticket IDs from recent commits
   */
  async getRecentTickets(since: string): Promise<string[]> {
    const commits = await this.getCommitsAcrossBranches(since);
    const ticketIds = new Set<string>();

    commits.forEach((commit) => {
      if (commit.ticketId) {
        ticketIds.add(commit.ticketId);
      }
    });

    return Array.from(ticketIds).sort();
  }

  /**
   * Get commits grouped by ticket ID
   */
  async getCommitsByTicket(
    since: string
  ): Promise<
    Map<string, Array<{ hash: string; message: string; branch: string }>>
  > {
    const commits = await this.getCommitsAcrossBranches(since);
    const commitsByTicket = new Map<
      string,
      Array<{ hash: string; message: string; branch: string }>
    >();

    commits.forEach((commit) => {
      const ticketId = commit.ticketId || "no-ticket";

      if (!commitsByTicket.has(ticketId)) {
        commitsByTicket.set(ticketId, []);
      }

      commitsByTicket.get(ticketId)!.push({
        hash: commit.hash,
        message: commit.message,
        branch: commit.branch,
      });
    });

    return commitsByTicket;
  }
}
