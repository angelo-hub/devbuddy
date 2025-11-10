import simpleGit, { SimpleGit } from "simple-git";
import * as vscode from "vscode";

export interface CodePermalink {
  url: string;
  provider: "github" | "gitlab" | "bitbucket" | "unknown";
  branch: string;
  commitSha: string;
  filePath: string;
  lineNumber: number;
}

export interface CodeContext {
  fileName: string;
  lineNumber: number;
  lineContent: string;
  contextBefore: string[];
  contextAfter: string[];
}

export class GitPermalinkGenerator {
  private git: SimpleGit;
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.git = simpleGit(workspaceRoot);
  }

  /**
   * Generate a permalink to a specific line in a file
   */
  async generatePermalink(
    filePath: string,
    lineNumber: number
  ): Promise<CodePermalink | null> {
    try {
      // Get the current commit SHA
      const commitSha = await this.getCommitSha();
      if (!commitSha) {
        console.warn(
          "[Git Permalink] No commit SHA found - file might be uncommitted"
        );
        return null;
      }

      // Get the remote URL
      const remoteUrl = await this.getRemoteUrl();
      if (!remoteUrl) {
        console.warn("[Git Permalink] No remote URL found");
        return null;
      }

      // Parse the remote URL to detect provider and repo info
      const provider = this.detectProvider(remoteUrl);
      const repoInfo = this.parseRemoteUrl(remoteUrl);
      if (!repoInfo) {
        console.warn("[Git Permalink] Could not parse remote URL:", remoteUrl);
        return null;
      }

      // Get relative file path
      const relativePath = this.getRelativePath(filePath);

      // Get current branch
      const branch = await this.getCurrentBranch();

      // Generate the permalink based on provider
      const url = this.buildPermalink(
        provider,
        repoInfo,
        commitSha,
        relativePath,
        lineNumber
      );

      return {
        url,
        provider,
        branch,
        commitSha,
        filePath: relativePath,
        lineNumber,
      };
    } catch (error) {
      console.error("[Git Permalink] Failed to generate permalink:", error);
      return null;
    }
  }

  /**
   * Get code context around a specific line
   */
  async getCodeContext(
    document: vscode.TextDocument,
    lineNumber: number,
    contextLines: number = 5
  ): Promise<CodeContext> {
    const totalLines = document.lineCount;
    const startLine = Math.max(0, lineNumber - contextLines);
    const endLine = Math.min(totalLines - 1, lineNumber + contextLines);

    const contextBefore: string[] = [];
    const contextAfter: string[] = [];

    for (let i = startLine; i < lineNumber; i++) {
      contextBefore.push(document.lineAt(i).text);
    }

    const lineContent = document.lineAt(lineNumber).text;

    for (let i = lineNumber + 1; i <= endLine; i++) {
      contextAfter.push(document.lineAt(i).text);
    }

    return {
      fileName: this.getRelativePath(document.fileName),
      lineNumber: lineNumber + 1, // Convert to 1-based
      lineContent,
      contextBefore,
      contextAfter,
    };
  }

  /**
   * Format code context for markdown
   */
  formatCodeContextForMarkdown(
    context: CodeContext,
    language?: string
  ): string {
    const allLines = [
      ...context.contextBefore,
      context.lineContent,
      ...context.contextAfter,
    ];

    const startLineNum = context.lineNumber - context.contextBefore.length;
    const numberedLines = allLines.map((line, index) => {
      const lineNum = startLineNum + index;
      return `${lineNum}  ${line}`;
    });

    const codeBlock = numberedLines.join("\n");

    // Detect language from file extension if not provided
    if (!language) {
      const ext = context.fileName.split(".").pop()?.toLowerCase();
      language = this.getLanguageFromExtension(ext || "");
    }

    return `\`\`\`${language}\n${codeBlock}\n\`\`\``;
  }

  /**
   * Get the current commit SHA (short version)
   */
  private async getCommitSha(): Promise<string | null> {
    try {
      const sha = await this.git.revparse(["HEAD"]);
      return sha.trim().substring(0, 40); // Full SHA for permalink stability
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the current branch name
   */
  private async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.git.revparse(["--abbrev-ref", "HEAD"]);
      return branch.trim();
    } catch (error) {
      return "main";
    }
  }

  /**
   * Get the remote URL (tries origin first, then any remote)
   */
  private async getRemoteUrl(): Promise<string | null> {
    try {
      const remotes = await this.git.getRemotes(true);

      // Try to find 'origin' first
      const origin = remotes.find((r) => r.name === "origin");
      if (origin?.refs?.fetch) {
        return origin.refs.fetch;
      }

      // Fall back to first available remote
      if (remotes.length > 0 && remotes[0].refs?.fetch) {
        return remotes[0].refs.fetch;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect the git provider from remote URL
   */
  private detectProvider(
    remoteUrl: string
  ): "github" | "gitlab" | "bitbucket" | "unknown" {
    const url = remoteUrl.toLowerCase();

    if (url.includes("github.com")) {
      return "github";
    } else if (url.includes("gitlab.com") || url.includes("gitlab")) {
      return "gitlab";
    } else if (url.includes("bitbucket.org")) {
      return "bitbucket";
    }

    return "unknown";
  }

  /**
   * Parse remote URL to extract owner and repo
   */
  private parseRemoteUrl(
    remoteUrl: string
  ): { owner: string; repo: string; host: string } | null {
    // Handle SSH URLs: git@github.com:owner/repo.git
    const sshMatch = remoteUrl.match(/git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/);
    if (sshMatch) {
      return {
        host: sshMatch[1],
        owner: sshMatch[2],
        repo: sshMatch[3],
      };
    }

    // Handle HTTPS URLs: https://github.com/owner/repo.git
    const httpsMatch = remoteUrl.match(
      /https?:\/\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/
    );
    if (httpsMatch) {
      return {
        host: httpsMatch[1],
        owner: httpsMatch[2],
        repo: httpsMatch[3],
      };
    }

    return null;
  }

  /**
   * Build permalink URL based on provider
   */
  private buildPermalink(
    provider: "github" | "gitlab" | "bitbucket" | "unknown",
    repoInfo: { owner: string; repo: string; host: string },
    commitSha: string,
    filePath: string,
    lineNumber: number
  ): string {
    const { owner, repo, host } = repoInfo;

    switch (provider) {
      case "github":
        return `https://${host}/${owner}/${repo}/blob/${commitSha}/${filePath}#L${lineNumber}`;

      case "gitlab":
        return `https://${host}/${owner}/${repo}/-/blob/${commitSha}/${filePath}#L${lineNumber}`;

      case "bitbucket":
        return `https://${host}/${owner}/${repo}/src/${commitSha}/${filePath}#lines-${lineNumber}`;

      default:
        // Generic attempt
        return `https://${host}/${owner}/${repo}/blob/${commitSha}/${filePath}#L${lineNumber}`;
    }
  }

  /**
   * Get relative file path from workspace root
   */
  private getRelativePath(filePath: string): string {
    if (filePath.startsWith(this.workspaceRoot)) {
      return filePath.substring(this.workspaceRoot.length + 1);
    }
    return filePath;
  }

  /**
   * Get language identifier from file extension
   */
  getLanguageFromExtension(ext: string): string {
    const languageMap: { [key: string]: string } = {
      ts: "typescript",
      tsx: "tsx", // Use tsx specifically for better JSX highlighting
      js: "javascript",
      jsx: "jsx", // Use jsx specifically for JSX highlighting
      py: "python",
      rb: "ruby",
      go: "go",
      rs: "rust",
      java: "java",
      cpp: "cpp",
      c: "c",
      cs: "csharp",
      php: "php",
      swift: "swift",
      kt: "kotlin",
      scala: "scala",
      sh: "bash",
      yml: "yaml",
      yaml: "yaml",
      json: "json",
      xml: "xml",
      html: "html",
      css: "css",
      scss: "scss",
      md: "markdown",
      sql: "sql",
    };

    return languageMap[ext] || ext || "text";
  }
}

