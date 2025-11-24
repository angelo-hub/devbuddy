import * as vscode from "vscode";
import { LinearClient } from "@providers/linear/LinearClient";
import { LinearIssue } from "@providers/linear/types";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";
import { JiraIssue } from "@providers/jira/common/types";
import { GitAnalyzer } from "@shared/git/gitAnalyzer";
import { AISummarizer } from "@shared/ai/aiSummarizer";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

/**
 * Intent types that the chat participant can handle
 */
type UserIntent =
  | "show_tickets"
  | "generate_standup"
  | "generate_pr"
  | "show_ticket_detail"
  | "update_status"
  | "plan_ticket_work"
  | "suggest_work"
  | "help"
  | "unknown";

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
      "dev-buddy",
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
      } else if (request.command === "plan") {
        // Extract ticket ID from prompt for /plan command
        const ticketContext = await this.extractTicketContext(request.prompt);
        if (ticketContext) {
          return await this.handlePlanTicketWork(ticketContext, request.prompt, stream, token);
        } else {
          stream.markdown("⚠️ Please specify a ticket ID (e.g., `/plan ENG-123`)\n");
          return {};
        }
      } else if (request.command === "suggest") {
        return await this.handleSuggestWork(stream, token);
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
    _token: vscode.CancellationToken
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
    _token: vscode.CancellationToken
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
    _token: vscode.CancellationToken
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
    _token: vscode.CancellationToken
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
    // Step 1: Check for ticket context
    const ticketContext = await this.extractTicketContext(request.prompt);
    
    // Step 2: Try AI-powered intent detection
    const intent = await this.detectIntent(request.prompt, token);
    logger.debug(`Detected intent: ${intent.type} (confidence: ${intent.confidence})`);

    // Step 3: Handle planning requests with ticket context
    if (intent.type === "plan_ticket_work" && ticketContext) {
      return await this.handlePlanTicketWork(ticketContext, request.prompt, stream, token);
    }
    
    // Step 4: Handle work suggestions
    if (intent.type === "suggest_work") {
      return await this.handleSuggestWork(stream, token);
    }

    // Step 5: Route based on detected intent
    switch (intent.type) {
      case "show_tickets":
        return await this.handleTicketsCommand(request, stream, token);

      case "generate_standup":
        return await this.handleStandupCommand(request, stream, token);

      case "generate_pr":
        return await this.handlePRCommand(request, stream, token);

      case "update_status":
        return await this.handleStatusCommand(request, stream, token);

      case "show_ticket_detail":
        // Extract ticket ID and show details
        if (intent.ticketId) {
          return await this.showTicketDetail(intent.ticketId, stream);
        }
        break;

      case "help":
        return await this.showHelpMessage(stream);
    }

    // Step 6: If intent is unknown or low confidence, try AI-powered response
    if (intent.confidence < 0.7) {
      const aiResponse = await this.generateAIResponse(request.prompt, stream, token);
      if (aiResponse) {
        return aiResponse;
      }
    }

    // Step 7: Final fallback - show help
    return await this.showHelpMessage(stream);
  }

  /**
   * Detect user intent using AI with pattern matching fallback
   */
  private async detectIntent(
    prompt: string,
    _token: vscode.CancellationToken
  ): Promise<{ type: UserIntent; confidence: number; ticketId?: string }> {
    // Check if AI is available and enabled
    const config = vscode.workspace.getConfiguration("devBuddy");
    const aiDisabled = config.get<boolean>("ai.disabled", false);

    if (!aiDisabled) {
      try {
        // Try AI-powered intent detection
        const aiIntent = await this.detectIntentWithAI(prompt, _token);
        if (aiIntent) {
          return aiIntent;
        }
      } catch (error) {
        logger.debug(`AI intent detection failed, falling back to patterns: ${error}`);
      }
    }

    // Fallback to pattern matching
    return this.detectIntentWithPatterns(prompt);
  }

  /**
   * AI-powered intent detection using VS Code LM API
   */
  private async detectIntentWithAI(
    prompt: string,
    token: vscode.CancellationToken
  ): Promise<{ type: UserIntent; confidence: number; ticketId?: string } | null> {
    try {
      const models = await vscode.lm.selectChatModels({
        vendor: "copilot",
        family: "gpt-4o",
      });

      if (models.length === 0) {
        return null;
      }

      const model = models[0];
      const messages = [
        vscode.LanguageModelChatMessage.User(
          `You are an intent classifier for a developer assistant. Analyze the user's question and classify it into ONE of these intents:

- show_tickets: User wants to see their active tickets/issues
- generate_standup: User wants to generate a standup update
- generate_pr: User wants to generate a PR summary
- update_status: User wants to update a ticket's status
- show_ticket_detail: User is asking about a specific ticket (contains ticket ID like ENG-123)
- help: User wants help or doesn't have a clear intent

User's question: "${prompt}"

Respond with ONLY a JSON object in this format:
{
  "intent": "show_tickets",
  "confidence": 0.95,
  "ticketId": "ENG-123" // only if show_ticket_detail
}

No other text. Just the JSON.`
        ),
      ];

      const response = await model.sendRequest(messages, {}, token);
      let fullResponse = "";

      for await (const fragment of response.text) {
        fullResponse += fragment;
      }

      // Parse AI response
      const cleanedResponse = fullResponse.trim().replace(/```json\n?|\n?```/g, "");
      const parsed = JSON.parse(cleanedResponse);

      return {
        type: parsed.intent as UserIntent,
        confidence: parsed.confidence || 0.8,
        ticketId: parsed.ticketId,
      };
    } catch (error) {
      logger.debug(`AI intent detection error: ${error}`);
      return null;
    }
  }

  /**
   * Pattern-based intent detection (fallback)
   */
  private detectIntentWithPatterns(
    prompt: string
  ): { type: UserIntent; confidence: number; ticketId?: string } {
    const lower = prompt.toLowerCase();

    // Check for ticket ID first
    const ticketMatch = prompt.match(/([A-Z]+-\d+)/);
    
    // Planning patterns
    const planningPatterns = [
      /let'?s make a plan/i,
      /help me (implement|work on|build|create)/i,
      /how (do i|should i|to) (implement|work on|build)/i,
      /plan for/i,
      /get started (on|with)/i,
      /start working on/i,
    ];
    
    if (ticketMatch && planningPatterns.some(p => p.test(prompt))) {
      return {
        type: "plan_ticket_work",
        confidence: 0.9,
        ticketId: ticketMatch[1],
      };
    }
    
    // Work suggestion patterns
    const suggestPatterns = [
      /what should i work on/i,
      /suggest.*ticket/i,
      /what'?s next/i,
      /what (can|should) i (do|work on) (today|now)/i,
      /recommend.*ticket/i,
    ];
    
    if (suggestPatterns.some(p => p.test(prompt))) {
      return { type: "suggest_work", confidence: 0.85 };
    }

    // Check for ticket detail query (just ticket ID mentioned)
    if (ticketMatch) {
      return {
        type: "show_ticket_detail",
        confidence: 0.9,
        ticketId: ticketMatch[1],
      };
    }

    // Check for tickets query
    const ticketsQueryPatterns = [
      /what\s+tickets?\s+(am\s+i|are\s+we|im)\s+(working\s+on|assigned|doing)/i,
      /show\s+(me\s+)?(my|our)\s+tickets?/i,
      /list\s+(my|our)\s+tickets?/i,
      /what\s+(am\s+i|are\s+we)\s+working\s+on/i,
      /my\s+(active\s+)?tickets?/i,
      /current\s+tickets?/i,
    ];

    if (ticketsQueryPatterns.some((pattern) => pattern.test(prompt))) {
      return { type: "show_tickets", confidence: 0.85 };
    }

    // Check for standup queries
    const standupQueryPatterns = [
      /generate\s+(my\s+)?(daily\s+)?standup/i,
      /create\s+(my\s+)?(daily\s+)?standup/i,
      /daily\s+update/i,
      /standup\s+update/i,
      /what\s+did\s+i\s+(do|work\s+on|accomplish)/i,
    ];

    if (standupQueryPatterns.some((pattern) => pattern.test(prompt))) {
      return { type: "generate_standup", confidence: 0.85 };
    }

    // Check for PR queries
    if (lower.includes("pr") || lower.includes("pull request")) {
      return { type: "generate_pr", confidence: 0.8 };
    }

    // Check for status updates
    if (lower.includes("status") && (lower.includes("update") || lower.includes("change"))) {
      return { type: "update_status", confidence: 0.8 };
    }

    // Check for help queries
    if (lower.includes("help") || lower.includes("what can you do")) {
      return { type: "help", confidence: 0.9 };
    }

    return { type: "unknown", confidence: 0.3 };
  }

  /**
   * Generate AI-powered response for general queries
   */
  private async generateAIResponse(
    prompt: string,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken
  ): Promise<vscode.ChatResult | null> {
    try {
      const models = await vscode.lm.selectChatModels({
        vendor: "copilot",
        family: "gpt-4o",
      });

      if (models.length === 0) {
        return null;
      }

      const model = models[0];
      
      // Get context about available features
      const client = await this.getClient();
      const hasLinearAccess = client.isConfigured();

      const messages = [
        vscode.LanguageModelChatMessage.User(
          `You are DevBuddy, a helpful AI assistant for developers integrated with Linear for ticket management.

Available features:
- Show active tickets from Linear ${hasLinearAccess ? "(configured)" : "(not configured)"}
- Generate standup updates from git commits
- Generate PR summaries
- Update ticket status
- Show specific ticket details

User's question: "${prompt}"

Provide a helpful, conversational response. If the user is asking about something you can help with, guide them on how to use the feature. Be friendly and concise.`
        ),
      ];

      stream.progress("Thinking...");

      const response = await model.sendRequest(messages, {}, _token);

      for await (const fragment of response.text) {
        stream.markdown(fragment);
      }

      return {};
    } catch (error) {
      logger.debug(`AI response generation error: ${error}`);
      return null;
    }
  }

  /**
   * Show details for a specific ticket
   */
  private async showTicketDetail(
    ticketId: string,
    stream: vscode.ChatResponseStream
  ): Promise<vscode.ChatResult> {
    stream.progress(`Fetching ${ticketId}...`);

    try {
      const client = await this.getClient();
      const issue = await client.getIssue(ticketId);
      
      if (issue) {
        stream.markdown(`## ${issue.identifier}: ${issue.title}\n\n`);
        stream.markdown(`**Status:** ${issue.state.name}\n`);
        stream.markdown(
          `**Priority:** ${this.getPriorityEmoji(issue.priority)} ${this.getPriorityName(issue.priority)}\n\n`
        );

        if (issue.description) {
          stream.markdown(`**Description:**\n${issue.description}\n\n`);
        }

        const url = getLinearUrl(issue.url);
        stream.markdown(`[Open in Linear](${url})\n`);
        return {};
      } else {
        stream.markdown(`⚠️ Could not find ticket ${ticketId}\n`);
        return {};
      }
    } catch (error) {
      stream.markdown(`❌ Error fetching ticket: ${error instanceof Error ? error.message : "Unknown error"}\n`);
      return {};
    }
  }

  /**
   * Show help message
   */
  private async showHelpMessage(
    stream: vscode.ChatResponseStream
  ): Promise<vscode.ChatResult> {
    stream.markdown(
      "# 👋 Hi! I'm DevBuddy\n\n" +
        "I can help you with:\n\n" +
        "- `/tickets` - Show your active Linear tickets\n" +
        "- `/standup` - Generate a standup update\n" +
        "- `/pr` - Generate a PR summary\n" +
        "- `/status` - Update ticket status\n" +
        "- `/plan [TICKET-ID]` - Create an implementation plan\n" +
        "- `/suggest` - Suggest what to work on next\n\n" +
        "Or just ask me about your work! Try:\n" +
        "- *\"What tickets am I working on?\"*\n" +
        "- *\"Show me ENG-123\"*\n" +
        "- *\"I would like to start working on ENG-125, let's make a plan\"*\n" +
        "- *\"What should I work on today?\"*\n"
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

  /**
   * Helper: Get ticket title (handles both Linear and Jira)
   */
  private getTicketTitle(ticket: LinearIssue | JiraIssue): string {
    return 'identifier' in ticket ? ticket.title : (ticket as JiraIssue).summary;
  }

  /**
   * Helper: Get ticket identifier (handles both Linear and Jira)
   */
  private getTicketIdentifier(ticket: LinearIssue | JiraIssue): string {
    return 'identifier' in ticket ? ticket.identifier : (ticket as JiraIssue).key;
  }

  /**
   * Helper: Get ticket description (handles both Linear and Jira)
   */
  private getTicketDescription(ticket: LinearIssue | JiraIssue): string {
    return ticket.description || "No description provided";
  }

  /**
   * Extract ticket context from user prompt
   */
  private async extractTicketContext(
    prompt: string
  ): Promise<{ ticketId: string; ticket: LinearIssue | JiraIssue } | null> {
    // Extract ticket ID from prompt (e.g., ENG-125, PROJ-456)
    const ticketMatch = prompt.match(/([A-Z]+-\d+)/);
    if (!ticketMatch) {
      return null;
    }

    const ticketId = ticketMatch[1];
    
    // Fetch ticket details based on current platform
    const config = vscode.workspace.getConfiguration("devBuddy");
    const platform = config.get<string>("provider", "linear");
    
    try {
      if (platform === "linear") {
        const client = await LinearClient.create();
        const ticket = await client.getIssue(ticketId);
        return ticket ? { ticketId, ticket } : null;
      } else if (platform === "jira") {
        const client = await JiraCloudClient.create();
        const ticket = await client.getIssue(ticketId);
        return ticket ? { ticketId, ticket } : null;
      }
    } catch (error) {
      logger.debug(`Error fetching ticket ${ticketId}: ${error}`);
      return null;
    }
    
    return null;
  }

  /**
   * Handle ticket planning with AI assistance
   */
  private async handlePlanTicketWork(
    ticketContext: { ticketId: string; ticket: LinearIssue | JiraIssue },
    userPrompt: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    stream.progress(`Analyzing ${ticketContext.ticketId}...`);
    
    // Build rich context prompt for AI
    const planningPrompt = this.buildPlanningPrompt(ticketContext.ticket, userPrompt);
    
    // Get AI model
    const models = await vscode.lm.selectChatModels({
      vendor: "copilot",
      family: "gpt-4o",
    });
    
    if (models.length === 0) {
      // Fallback to template-based planning
      return await this.generateTemplatePlan(ticketContext, stream);
    }
    
    const model = models[0];
    const messages = [vscode.LanguageModelChatMessage.User(planningPrompt)];
    
    // Stream AI response
    const identifier = this.getTicketIdentifier(ticketContext.ticket);
    const title = this.getTicketTitle(ticketContext.ticket);
    
    stream.markdown(`## Implementation Plan for ${identifier}\n\n`);
    stream.markdown(`**${title}**\n\n`);
    
    try {
      const response = await model.sendRequest(messages, {}, token);
      for await (const fragment of response.text) {
        stream.markdown(fragment);
      }
    } catch (error) {
      logger.error("Error generating plan with AI", error);
      // Fallback to template
      return await this.generateTemplatePlan(ticketContext, stream);
    }
    
    // Add action buttons
    stream.markdown("\n\n---\n\n### Quick Actions\n\n");
    
    stream.button({
      command: "devBuddy.startBranch",
      arguments: [{ issue: ticketContext.ticket }],
      title: "$(git-branch) Create Branch",
    });
    
    stream.button({
      command: "devBuddy.startWork",
      arguments: [{ issue: ticketContext.ticket }],
      title: "$(play) Start Work (Update Status)",
    });
    
    stream.button({
      command: "devBuddy.openTicketPanel",
      arguments: [ticketContext.ticketId],
      title: "$(link-external) Open Full Details",
    });
    
    return {};
  }

  /**
   * Generate template-based plan (fallback when AI unavailable)
   */
  private async generateTemplatePlan(
    ticketContext: { ticketId: string; ticket: LinearIssue | JiraIssue },
    stream: vscode.ChatResponseStream
  ): Promise<vscode.ChatResult> {
    const ticket = ticketContext.ticket;
    const isLinear = 'identifier' in ticket;
    const priority = isLinear 
      ? this.getPriorityName(ticket.priority)
      : (ticket as JiraIssue).priority?.name || "None";

    stream.markdown("### Overview\n\n");
    const description = this.getTicketDescription(ticket);
    stream.markdown(`${description}\n\n`);

    stream.markdown("### Key Steps\n\n");
    stream.markdown("1. Review ticket requirements and acceptance criteria\n");
    stream.markdown("2. Break down the work into smaller tasks\n");
    stream.markdown("3. Implement the changes\n");
    stream.markdown("4. Write tests for the new functionality\n");
    stream.markdown("5. Review and refactor code\n\n");

    stream.markdown("### Priority & Context\n\n");
    stream.markdown(`- **Priority:** ${priority}\n`);
    
    if (isLinear && ticket.labels && ticket.labels.length > 0) {
      stream.markdown(`- **Labels:** ${ticket.labels.map(l => l.name).join(", ")}\n`);
    } else if (!isLinear && (ticket as JiraIssue).labels && (ticket as JiraIssue).labels!.length > 0) {
      stream.markdown(`- **Labels:** ${(ticket as JiraIssue).labels!.join(", ")}\n`);
    }

    return {};
  }

  /**
   * Build planning prompt for AI
   */
  private buildPlanningPrompt(
    ticket: LinearIssue | JiraIssue,
    userPrompt: string
  ): string {
    const identifier = this.getTicketIdentifier(ticket);
    const title = this.getTicketTitle(ticket);
    const description = this.getTicketDescription(ticket);
    
    const isLinear = 'identifier' in ticket;
    const priority = isLinear 
      ? this.getPriorityName(ticket.priority)
      : (ticket as JiraIssue).priority?.name || "None";
    const labels = isLinear
      ? ticket.labels?.map(l => l.name).join(", ") || "None"
      : (ticket as JiraIssue).labels?.join(", ") || "None";
    
    return `You are helping a developer plan their work on a ticket.

**Ticket Context:**
- ID: ${identifier}
- Title: ${title}
- Priority: ${priority}
- Labels: ${labels}

**Description:**
${description}

**User's Request:**
${userPrompt}

**Instructions:**
Create a practical, actionable implementation plan with:
1. **Overview** - Brief summary of what needs to be done (2-3 sentences)
2. **Key Steps** - 3-5 concrete implementation steps
3. **Files to Consider** - Suggest likely files/directories to modify based on the ticket context
4. **Testing Approach** - How to verify the implementation
5. **Potential Challenges** - What to watch out for

Keep it concise, practical, and developer-friendly. Use markdown formatting.`;
  }

  /**
   * Handle work suggestion
   */
  private async handleSuggestWork(
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    stream.progress("Analyzing your tickets...");
    
    const client = await this.getClient();
    if (!client.isConfigured()) {
      stream.markdown("⚠️ Please configure your Linear/Jira API token first.\n");
      return {};
    }
    
    // Fetch active tickets
    const issues = await client.getMyIssues({ state: ["unstarted", "started"] });
    
    if (issues.length === 0) {
      stream.markdown("✅ No active tickets! You're all caught up.\n");
      return {};
    }
    
    // Use AI to suggest which ticket to work on
    const suggestionPrompt = this.buildSuggestionPrompt(issues);
    
    const models = await vscode.lm.selectChatModels();
    if (models.length > 0) {
      try {
        const model = models[0];
        const messages = [vscode.LanguageModelChatMessage.User(suggestionPrompt)];
        
        stream.markdown("## Suggested Next Ticket\n\n");
        
        const response = await model.sendRequest(messages, {}, token);
        for await (const fragment of response.text) {
          stream.markdown(fragment);
        }
      } catch (error) {
        logger.error("Error generating AI suggestion", error);
        // Fallback to simple priority-based suggestion
        return await this.generateSimpleSuggestion(issues, stream);
      }
    } else {
      // Fallback: suggest highest priority ticket
      return await this.generateSimpleSuggestion(issues, stream);
    }
    
    return {};
  }

  /**
   * Generate simple priority-based suggestion (fallback)
   */
  private async generateSimpleSuggestion(
    issues: LinearIssue[],
    stream: vscode.ChatResponseStream
  ): Promise<vscode.ChatResult> {
    // Sort by priority (1 is highest/urgent)
    const highPriority = issues.sort((a, b) => a.priority - b.priority)[0];
    
    stream.markdown(`## Suggested Ticket\n\n`);
    const url = getLinearUrl(highPriority.url);
    stream.markdown(`**[${highPriority.identifier}](${url})** - ${highPriority.title}\n\n`);
    stream.markdown(`**Priority:** ${this.getPriorityEmoji(highPriority.priority)} ${this.getPriorityName(highPriority.priority)}\n`);
    stream.markdown(`**Status:** ${highPriority.state.name}\n\n`);
    
    if (highPriority.description) {
      const shortDesc = highPriority.description.substring(0, 200);
      stream.markdown(`${shortDesc}${highPriority.description.length > 200 ? "..." : ""}\n\n`);
    }

    stream.button({
      command: "devBuddy.startBranch",
      arguments: [{ issue: highPriority }],
      title: "$(git-branch) Create Branch & Start",
    });

    return {};
  }

  /**
   * Build suggestion prompt for AI
   */
  private buildSuggestionPrompt(issues: LinearIssue[]): string {
    const ticketList = issues.slice(0, 10).map(issue => {
      return `- **${issue.identifier}** (Priority: ${this.getPriorityName(issue.priority)}, Status: ${issue.state.name}): ${issue.title}`;
    }).join("\n");

    return `You are helping a developer decide which ticket to work on next.

**Available Tickets:**
${ticketList}

**Instructions:**
Analyze these tickets and recommend ONE ticket to work on next. Consider:
- Priority level (Urgent/High should be preferred)
- Current status (unstarted vs in progress)
- Complexity and dependencies (if evident from title)
- Logical workflow order

Format your response as:
**Recommended: [TICKET-ID]** - Brief title

**Why:** 2-3 sentences explaining why this ticket should be next

Keep it concise and actionable.`;
  }
}



