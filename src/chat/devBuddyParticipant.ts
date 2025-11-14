import * as vscode from "vscode";
import { LinearClient } from "@providers/linear/LinearClient";
import { LinearIssue } from "@providers/linear/types";
import { GitAnalyzer } from "@shared/git/gitAnalyzer";
import { AISummarizer } from "@shared/ai/aiSummarizer";

/**
 * Convert Linear web URL to desktop app URL if preference is enabled
 */
function getLinearUrl(webUrl: string): string {
  const config = vscode.workspace.getConfiguration("devBuddy");
  const preferDesktop = config.get<boolean>("preferDesktopApp", false);
  
  if (preferDesktop) {
    // Convert https://linear.app/... to linear://...
    return webUrl.replace("https://linear.app/", "linear://");
  }
  
  return webUrl;
}

export class DevBuddyChatParticipant {
  private linearClient: LinearClient | null = null;
  private aiSummarizer: AISummarizer;

  constructor() {
    this.aiSummarizer = new AISummarizer();
    this.initializeClient();
  }

  /**
   * Initialize the Linear client asynchronously
   */
  private async initializeClient(): Promise<void> {
    this.linearClient = await LinearClient.create();
  }

  /**
   * Get the Linear client, ensuring it's initialized
   */
  private async getClient(): Promise<LinearClient> {
    if (!this.linearClient) {
      this.linearClient = await LinearClient.create();
    }
    return this.linearClient;
  }

  /**
   * Register the chat participant
   */
  register(context: vscode.ExtensionContext): vscode.Disposable {
    const participant = vscode.chat.createChatParticipant(
      "linear-buddy",
      this.handleRequest.bind(this)
    );

    participant.iconPath = vscode.Uri.file(
      context.asAbsolutePath("resources/icon.png")
    );

    return participant;
  }

  /**
   * Handle chat requests
   */
  private async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    try {
      // Check for commands
      if (request.command === "tickets") {
        return await this.handleTicketsCommand(request, stream, token);
      } else if (request.command === "standup") {
        return await this.handleStandupCommand(request, stream, token);
      } else if (request.command === "pr") {
        return await this.handlePRCommand(request, stream, token);
      } else if (request.command === "status") {
        return await this.handleStatusCommand(request, stream, token);
      } else {
        // General conversation
        return await this.handleGeneralQuery(request, stream, token);
      }
    } catch (error) {
      stream.markdown(
        `\n\n❌ **Error:** ${error instanceof Error ? error.message : "Unknown error"}\n`
      );
      return { errorDetails: { message: String(error) } };
    }
  }

  /**
   * Handle /tickets command
   */
  private async handleTicketsCommand(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    const client = await this.getClient();
    if (!client.isConfigured()) {
      stream.markdown(
        "⚠️ **Linear API not configured.**\n\n" +
          "Please configure your Linear API token:\n" +
          "1. Go to [Linear Settings](https://linear.app/settings/api)\n" +
          "2. Create a new API key\n" +
          "3. Run: `DevBuddy: Configure API Token`\n"
      );
      return {};
    }

    stream.progress("Fetching your tickets from Linear...");

    try {
      const issues = await client.getMyIssues({
        state: ["unstarted", "started"],
      });

      if (issues.length === 0) {
        stream.markdown(
          "✅ **No active tickets!**\n\nYou're all caught up. Great work! 🎉\n"
        );
        return {};
      }

      stream.markdown(`## Your Active Tickets (${issues.length})\n\n`);

      // Group by status
      const grouped = this.groupByStatus(issues);

      for (const [status, statusIssues] of Object.entries(grouped)) {
        stream.markdown(`### ${status} (${statusIssues.length})\n\n`);

        for (const issue of statusIssues) {
          const priority = this.getPriorityEmoji(issue.priority);
          const url = getLinearUrl(issue.url);
          stream.markdown(
            `${priority} **[${issue.identifier}](${url})** - ${issue.title}\n`
          );
        }

        stream.markdown("\n");
      }

      // Add helpful suggestions
      stream.button({
        command: "devBuddy.generateStandup",
        title: "Generate Standup",
      });

      return {};
    } catch (error) {
      throw new Error(`Failed to fetch tickets: ${error instanceof Error ? error.message : "Unknown"}`);
    }
  }

  /**
   * Handle /standup command
   */
  private async handleStandupCommand(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    stream.progress("Analyzing your git commits...");

    const workspaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      throw new Error("No workspace folder open");
    }

    const gitAnalyzer = new GitAnalyzer(workspaceRoot);
    const config = vscode.workspace.getConfiguration("devBuddy");
    const standupTimeWindow = config.get<string>(
      "standupTimeWindow",
      "24 hours ago"
    );

    try {
      const gitContext = await gitAnalyzer.getGitContext(standupTimeWindow);
      const baseBranch = await gitAnalyzer.getBaseBranch();
      const fileDiffs = await gitAnalyzer.getFileDiffs(baseBranch, 200);

      stream.progress("Generating AI-powered summary...");

      // Generate AI summary
      const summary = await this.aiSummarizer.summarizeCommitsForStandup({
        commits: gitContext.commits,
        changedFiles: gitContext.changedFiles,
        fileDiffs: fileDiffs,
        ticketId: gitContext.ticketId,
      });

      const nextSteps = await this.aiSummarizer.suggestNextSteps({
        commits: gitContext.commits,
        changedFiles: gitContext.changedFiles,
        fileDiffs: fileDiffs,
        ticketId: gitContext.ticketId,
      });

      const blockers = await this.aiSummarizer.detectBlockersFromCommits(
        gitContext.commits
      );

      stream.markdown("## 📊 Daily Standup Update\n\n");

      if (gitContext.ticketId) {
        stream.markdown(`**Ticket:** ${gitContext.ticketId}\n\n`);
      }

      stream.markdown("### What did you do since the previous update?\n\n");
      stream.markdown(summary || "(No recent commits found)\n\n");

      stream.markdown("### What are you going to do today?\n\n");
      stream.markdown(nextSteps || "Continue current work\n\n");

      stream.markdown("### Are you reaching any blockers?\n\n");
      stream.markdown(blockers || "None\n\n");

      // Show commit details
      if (gitContext.commits.length > 0) {
        stream.markdown(
          `\n---\n\n**Recent commits** (${gitContext.commits.length}):\n`
        );
        gitContext.commits.slice(0, 5).forEach((commit) => {
          stream.markdown(`- ${commit.message}\n`);
        });
      }

      return {};
    } catch (error) {
      throw new Error(`Failed to generate standup: ${error instanceof Error ? error.message : "Unknown"}`);
    }
  }

  /**
   * Handle /pr command
   */
  private async handlePRCommand(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    stream.progress("Generating PR summary...");

    stream.markdown(
      "## 🔧 PR Summary Generator\n\n" +
        "To generate a full PR summary with template validation, " +
        "please use the command:\n\n"
    );

    stream.button({
      command: "devBuddy.generatePRSummary",
      title: "Generate Full PR Summary",
    });

    return {};
  }

  /**
   * Handle /status command
   */
  private async handleStatusCommand(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    const client = await this.getClient();
    if (!client.isConfigured()) {
      stream.markdown(
        "⚠️ **Linear API not configured.** Please configure your API token first.\n"
      );
      return {};
    }

    stream.markdown(
      "## Update Ticket Status\n\n" +
        "To update a ticket's status, please:\n" +
        "1. Open the DevBuddy sidebar\n" +
        "2. Right-click on a ticket\n" +
        "3. Select the desired action\n\n" +
        "Or ask me: *\"What's the status of ENG-123?\"*\n"
    );

    return {};
  }

  /**
   * Handle general conversation
   */
  private async handleGeneralQuery(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    const prompt = request.prompt.toLowerCase();

    // Check for specific queries
    if (prompt.includes("ticket") && prompt.match(/[A-Z]+-\d+/)) {
      // Extract ticket ID
      const ticketMatch = prompt.match(/([A-Z]+-\d+)/);
      if (ticketMatch) {
        const ticketId = ticketMatch[1];
        stream.progress(`Fetching ${ticketId}...`);

        try {
          const client = await this.getClient();
          const issue = await client.getIssue(ticketId);
          if (issue) {
            stream.markdown(`## ${issue.identifier}: ${issue.title}\n\n`);
            stream.markdown(`**Status:** ${issue.state.name}\n`);
            stream.markdown(`**Priority:** ${this.getPriorityEmoji(issue.priority)} ${this.getPriorityName(issue.priority)}\n\n`);

            if (issue.description) {
              stream.markdown(`**Description:**\n${issue.description}\n\n`);
            }

            const url = getLinearUrl(issue.url);
            stream.markdown(`[Open in Linear](${url})\n`);
            return {};
          }
        } catch (error) {
          stream.markdown(`⚠️ Could not find ticket ${ticketId}\n`);
        }
      }
    }

    // Default help message
    stream.markdown(
      "# 👋 Hi! I'm DevBuddy\n\n" +
        "I can help you with:\n\n" +
        "- `/tickets` - Show your active Linear tickets\n" +
        "- `/standup` - Generate a standup update\n" +
        "- `/pr` - Generate a PR summary\n" +
        "- `/status` - Update ticket status\n\n" +
        "Or just ask me about your work! Try:\n" +
        "- *\"What tickets am I working on?\"*\n" +
        "- *\"Show me ENG-123\"*\n" +
        "- *\"Generate my standup\"*\n"
    );

    return {};
  }

  /**
   * Helper: Group issues by status
   */
  private groupByStatus(issues: LinearIssue[]): Record<string, LinearIssue[]> {
    const grouped: Record<string, LinearIssue[]> = {};
    for (const issue of issues) {
      const status = issue.state.name;
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(issue);
    }
    return grouped;
  }

  /**
   * Helper: Get priority emoji
   */
  private getPriorityEmoji(priority: number): string {
    switch (priority) {
      case 1:
        return "🔴"; // Urgent
      case 2:
        return "🟠"; // High
      case 3:
        return "🟡"; // Medium
      case 4:
        return "🟢"; // Low
      default:
        return "⚪"; // None
    }
  }

  /**
   * Helper: Get priority name
   */
  private getPriorityName(priority: number): string {
    switch (priority) {
      case 1:
        return "Urgent";
      case 2:
        return "High";
      case 3:
        return "Medium";
      case 4:
        return "Low";
      default:
        return "None";
    }
  }
}



