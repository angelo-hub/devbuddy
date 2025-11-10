import * as vscode from "vscode";
import { FallbackSummarizer } from "./fallbackSummarizer";
import { getLogger } from "./logger";

export interface AISummaryRequest {
  commits: Array<{ hash: string; message: string; branch?: string }>;
  changedFiles: string[];
  fileDiffs?: string; // NEW: actual line diffs
  ticketId?: string | null;
  context?: string;
}

export interface AISummaryResponse {
  summary: string;
  keyChanges: string[];
  suggestedTitle?: string;
}

export class AISummarizer {
  private model: vscode.LanguageModelChat | null = null;
  private modelFamily: string = "gpt-4o";
  private writingTone: string = "professional";
  private preferredModelSelector: string = "auto";
  private fallbackSummarizer: FallbackSummarizer;
  private aiDisabled: boolean = false;

  constructor() {
    this.fallbackSummarizer = new FallbackSummarizer();
    this.loadConfiguration();
    this.initializeModel();
  }

  private loadConfiguration() {
    const config = vscode.workspace.getConfiguration("devBuddy");
    
    // Check if AI is completely disabled (for sensitive organizations)
    this.aiDisabled = config.get<boolean>("ai.disabled", false);
    
    // Get the preferred model selector (new setting)
    this.preferredModelSelector = config.get<string>("ai.model", "auto");
    this.writingTone = config.get<string>("writingTone", "professional");

    // Extract model family from selector
    if (this.preferredModelSelector === "auto") {
      this.modelFamily = ""; // Will select best available
    } else {
      // Remove "copilot:" prefix if present
      const modelPart = this.preferredModelSelector.replace(/^copilot:/, "");
      
      // Map to model family names used by VS Code Language Model API
      switch (modelPart) {
        case "gpt-4o":
          this.modelFamily = "gpt-4o";
          break;
        case "gpt-4.1":
          this.modelFamily = "gpt-4.1";
          break;
        case "gpt-4-turbo":
          this.modelFamily = "gpt-4-turbo";
          break;
        case "gpt-4":
          this.modelFamily = "gpt-4";
          break;
        case "gpt-4o-mini":
          this.modelFamily = "gpt-4o-mini";
          break;
        case "gpt-3.5-turbo":
          this.modelFamily = "gpt-3.5-turbo";
          break;
        case "gemini-2.0-flash":
          this.modelFamily = "gemini-2.0-flash-exp";
          break;
        default:
          // Try legacy setting as fallback
          const legacyModel = config.get<string>("aiModel", "gpt-4o");
          this.modelFamily = legacyModel === "gemini-2.0-flash" 
            ? "gemini-2.0-flash-exp" 
            : legacyModel;
      }
    }
  }

  private async initializeModel() {
    const logger = getLogger();
    
    // Skip AI initialization if disabled
    if (this.aiDisabled) {
      logger.info("AI features disabled by user preference, using rule-based fallback");
      this.model = null;
      return;
    }
    
    try {
      logger.debug(
        `Requested model: ${this.preferredModelSelector}, Family: ${this.modelFamily || "auto"}`
      );

      // Get ALL available language models
      logger.debug("Fetching all available models...");
      const allModels = await vscode.lm.selectChatModels();

      if (!allModels || allModels.length === 0) {
        logger.warn("No AI models available, falling back to rule-based summarization");
        this.model = null;
        return;
      }

      // Log all available models
      logger.debug(`Found ${allModels.length} available models:`);
      allModels.forEach((m, index) => {
        logger.debug(`  ${index + 1}. ${m.id} (vendor: ${m.vendor}, family: ${m.family}, name: ${m.name})`);
      });

      // If auto mode, select the best available model
      if (this.preferredModelSelector === "auto" || !this.modelFamily) {
        // Try models in preference order (verified working models, best quality first)
        const preferredFamilies = [
          "gpt-4o", // Best: OpenAI's latest flagship
          "gpt-4.1", // Excellent: Proven and reliable
          "gpt-4-turbo", // Great: Fast and powerful
          "gpt-4", // Good: Classic GPT-4
          "gemini-2.0-flash-exp", // Alternative: Google's model
          "gpt-4o-mini", // Faster: When speed matters
          "gpt-3.5-turbo", // Fallback: Most widely available
        ];

        for (const family of preferredFamilies) {
          const match = allModels.find((m) => m.family === family);
          if (match) {
            this.model = match;
            logger.success(
              `Auto-selected model: ${match.id} (vendor: ${match.vendor}, family: ${match.family})`
            );
            return;
          }
        }

        // Use first available as last resort
        this.model = allModels[0];
        logger.info(`Using first available model: ${this.model.id}`);
        return;
      }

      // Try to find a model matching the requested family
      const matchingModel = allModels.find((m) =>
        m.family?.toLowerCase().includes(this.modelFamily.toLowerCase())
      );

      if (matchingModel) {
        this.model = matchingModel;
        logger.success(
          `Using matching model: ${matchingModel.id} (vendor: ${matchingModel.vendor}, family: ${matchingModel.family}, maxInputTokens: ${matchingModel.maxInputTokens})`
        );
      } else {
        // Use first available model as fallback
        this.model = allModels[0];
        logger.warn(
          `Model family "${this.modelFamily}" not found, using fallback: ${this.model.id} (vendor: ${this.model.vendor}, family: ${this.model.family})`
        );
      }
    } catch (error) {
      logger.error("AI model initialization failed", error);
      this.model = null;
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.model) {
      await this.initializeModel();
    }
    return this.model !== null;
  }

  /**
   * Generate a summary of commits for PR description
   */
  async summarizeCommitsForPR(
    request: AISummaryRequest
  ): Promise<string | null> {
    const logger = getLogger();
    
    // Use fallback summarizer if no AI model available
    if (!this.model) {
      logger.debug("Using rule-based PR summary");
      return this.fallbackSummarizer.generatePRSummary(request);
    }

    try {
      const prompt = this.buildPRSummaryPrompt(request);
      const messages = [vscode.LanguageModelChatMessage.User(prompt)];

      logger.debug(`Sending PR request to model: ${this.model.id}`);

      const response = await this.model.sendRequest(
        messages,
        {},
        new vscode.CancellationTokenSource().token
      );

      let summary = "";
      for await (const fragment of response.text) {
        summary += fragment;
      }

      logger.success("Successfully generated PR summary");
      return summary.trim();
    } catch (error) {
      logger.error("Error generating PR summary", error);

      // Try fallback to a different model
      logger.debug("Attempting to use fallback model...");
      const fallbackResult = await this.tryFallbackModel(request, "pr");
      
      // If all AI attempts fail, use rule-based fallback
      if (!fallbackResult) {
        logger.info("All AI models failed, using rule-based fallback");
        return this.fallbackSummarizer.generatePRSummary(request);
      }
      
      return fallbackResult;
    }
  }

  /**
   * Generate a summary of work done for standup
   */
  async summarizeCommitsForStandup(
    request: AISummaryRequest
  ): Promise<string | null> {
    const logger = getLogger();
    
    // Use fallback summarizer if no AI model available
    if (!this.model) {
      logger.debug("Using rule-based standup summary");
      return this.fallbackSummarizer.generateStandupSummary(request);
    }

    try {
      const prompt = this.buildStandupSummaryPrompt(request);
      const messages = [vscode.LanguageModelChatMessage.User(prompt)];

      logger.debug(`Sending request to model: ${this.model.id}`);

      const response = await this.model.sendRequest(
        messages,
        {},
        new vscode.CancellationTokenSource().token
      );

      let summary = "";
      for await (const fragment of response.text) {
        summary += fragment;
      }

      logger.success("Successfully generated standup summary");
      return summary.trim();
    } catch (error) {
      logger.error("Error generating standup summary", error);

      // Try fallback to a different model
      logger.debug("Attempting to use fallback model...");
      const fallbackResult = await this.tryFallbackModel(request, "standup");
      
      // If all AI attempts fail, use rule-based fallback
      if (!fallbackResult) {
        logger.info("All AI models failed, using rule-based fallback");
        return this.fallbackSummarizer.generateStandupSummary(request);
      }
      
      return fallbackResult;
    }
  }

  /**
   * Try using a fallback model if the primary fails
   */
  private async tryFallbackModel(
    request: AISummaryRequest,
    type: "standup" | "pr"
  ): Promise<string | null> {
    const logger = getLogger();
    
    try {
      // Get all models again and try first available
      const allModels = await vscode.lm.selectChatModels();

      if (!allModels || allModels.length === 0) {
        logger.debug("No fallback models available");
        return null;
      }

      // Try models in preference order (verified working models, best quality first)
      const preferredFamilies = [
        "gpt-4o", // Best: OpenAI's latest flagship
        "gpt-4.1", // Excellent: Proven and reliable
        "gpt-4-turbo", // Great: Fast and powerful
        "gpt-4", // Good: Classic GPT-4
        "gemini-2.0-flash-exp", // Alternative: Google's model
        "gpt-4o-mini", // Faster: When speed matters
        "gpt-3.5-turbo", // Fallback: Most widely available
      ];
      let fallbackModel = null;

      for (const family of preferredFamilies) {
        fallbackModel = allModels.find((m) => m.family === family);
        if (fallbackModel) break;
      }

      if (!fallbackModel) {
        fallbackModel = allModels[0];
      }

      logger.debug(`Trying fallback model: ${fallbackModel.id} (${fallbackModel.family})`);

      const prompt =
        type === "standup"
          ? this.buildStandupSummaryPrompt(request)
          : this.buildPRSummaryPrompt(request);
      const messages = [vscode.LanguageModelChatMessage.User(prompt)];

      const response = await fallbackModel.sendRequest(
        messages,
        {},
        new vscode.CancellationTokenSource().token
      );

      let summary = "";
      for await (const fragment of response.text) {
        summary += fragment;
      }

      logger.success(`Fallback model succeeded: ${fallbackModel.family}`);

      // Update the model for future use
      this.model = fallbackModel;

      return summary.trim();
    } catch (error) {
      logger.error("Fallback model also failed", error);
      return null;
    }
  }

  /**
   * Suggest "what you'll do next" based on current work
   */
  async suggestNextSteps(request: AISummaryRequest): Promise<string | null> {
    const logger = getLogger();
    
    // Use fallback summarizer if no AI model available
    if (!this.model) {
      logger.debug("Using rule-based next steps suggestion");
      return this.fallbackSummarizer.suggestNextSteps(request);
    }

    try {
      const prompt = `Based on these recent commits, suggest 1-2 concise next steps (keep it under 50 words):

Commits:
${request.commits.map((c) => `- ${c.message}`).join("\n")}

Provide only the next steps, no explanations.`;

      const messages = [vscode.LanguageModelChatMessage.User(prompt)];

      const response = await this.model.sendRequest(
        messages,
        {},
        new vscode.CancellationTokenSource().token
      );

      let suggestion = "";
      for await (const fragment of response.text) {
        suggestion += fragment;
      }

      return suggestion.trim();
    } catch (error) {
      logger.error("Error suggesting next steps", error);
      // Fall back to rule-based suggestions
      logger.debug("Using rule-based next steps suggestion");
      return this.fallbackSummarizer.suggestNextSteps(request);
    }
  }

  private buildPRSummaryPrompt(request: AISummaryRequest): string {
    const config = vscode.workspace.getConfiguration("devBuddy");
    const tone = config.get<string>("writingTone", "professional");

    const toneInstructions = this.getToneInstructions(tone);
    const ticketInfo = request.ticketId ? `Ticket: ${request.ticketId}\n` : "";
    const contextInfo = request.context ? `Context: ${request.context}\n` : "";

    // Categorize commits for better understanding
    const categorizedCommits = this.categorizeCommits(request.commits);
    const commitSummary = this.formatCategorizedCommits(categorizedCommits);

    // Categorize files by directory/package
    const categorizedFiles = this.categorizeFilesByPath(request.changedFiles);
    const fileSummary = this.formatCategorizedFiles(categorizedFiles);

    const diffSection = request.fileDiffs
      ? `\n## Code Changes:\n\`\`\`diff\n${request.fileDiffs.substring(0, 3000)}${
          request.fileDiffs.length > 3000 ? "\n... (truncated)" : ""
        }\n\`\`\`\n`
      : "";

    return `You are an expert code reviewer helping generate a PR summary. ${toneInstructions}

# Context
${ticketInfo}${contextInfo}

# Commit History (${request.commits.length} total)
${commitSummary}

# Files Modified (${request.changedFiles.length} total)
${fileSummary}

${diffSection}

# Instructions
Generate a concise PR summary with 2-4 bullet points that:
- Focus on the **what** and **why**, not just the **how**
- Highlight user-facing or architectural changes
- Use clear, action-oriented language
- Each bullet should be one complete sentence

# Example Output Format
- ✨ Implemented user authentication with OAuth2 support
- 🐛 Fixed memory leak in WebSocket connection handling
- ♻️ Refactored API client for better error handling

Output ONLY the bullets, starting with "-" or a relevant emoji. No preamble or conclusion.`;
  }

  private buildStandupSummaryPrompt(request: AISummaryRequest): string {
    const config = vscode.workspace.getConfiguration("devBuddy");
    const tone = config.get<string>("writingTone", "professional");

    const toneInstructions = this.getToneInstructions(tone, true);

    // Categorize work for better summary
    const categorizedCommits = this.categorizeCommits(request.commits);
    const commitSummary = this.formatCategorizedCommits(categorizedCommits);

    const fileCount = request.changedFiles.length;
    const contextInfo = request.context ? `\nContext: ${request.context}` : "";

    const diffSection = request.fileDiffs
      ? `\n## Recent Code Changes:\n\`\`\`diff\n${request.fileDiffs.substring(0, 1500)}${
          request.fileDiffs.length > 1500 ? "\n... (truncated)" : ""
        }\n\`\`\`\n`
      : "";

    return `You are helping generate a daily standup update. ${toneInstructions}

# Work Completed
${commitSummary}

# Scope
- **Files modified:** ${fileCount}
- **Commits:** ${request.commits.length}${contextInfo}

${diffSection}

# Instructions
Generate a standup summary that:
- Summarizes what was accomplished in 1-2 sentences
- Uses first person ("I worked on...", "I fixed...", "I implemented...")
- Focuses on outcomes and impact, not just tasks
- Is under 100 words total
- Is ready to share directly with the team

# Example Output
I implemented user authentication with OAuth2 and fixed several bugs in the payment flow. Also refactored the API client for better error handling.

Output ONLY the summary text in first person, no introduction or headers.`;
  }

  private getToneInstructions(
    tone: string,
    isStandup: boolean = false
  ): string {
    const context = isStandup ? "standup update" : "PR summary";

    switch (tone) {
      case "casual":
        return `Write in a casual, friendly tone. Use contractions and natural language. Keep it conversational but clear.`;
      case "professional":
        return `Write in a professional, clear tone. Focus on readability and maintainability. Be concise and informative.`;
      case "technical":
        return `Write in a technical, precise tone. Use technical terms accurately. Focus on implementation details and architectural decisions.`;
      case "concise":
        return `Write in an extremely concise tone. Use the fewest words possible while maintaining clarity. No fluff.`;
      default:
        return `Write in a clear, professional tone appropriate for a ${context}.`;
    }
  }

  /**
   * Analyze if commits indicate any potential blockers or risks
   */
  async detectBlockersFromCommits(
    commits: Array<{ message: string }>
  ): Promise<string | null> {
    const logger = getLogger();
    
    // Use fallback summarizer if no AI model available
    if (!this.model) {
      logger.debug("Using rule-based blocker detection");
      return this.fallbackSummarizer.detectBlockers(commits);
    }

    try {
      const commitMessages = commits.map((c) => c.message).join("\n");

      const prompt = `Based on these commit messages, identify any potential blockers, risks, or issues that might need attention. If everything looks normal, respond with "None detected".

Commits:
${commitMessages}

Respond with either "None detected" or a brief description of the concern.`;

      const messages = [vscode.LanguageModelChatMessage.User(prompt)];

      const response = await this.model.sendRequest(
        messages,
        {},
        new vscode.CancellationTokenSource().token
      );

      let result = "";
      for await (const fragment of response.text) {
        result += fragment;
      }

      return result.trim();
    } catch (error) {
      logger.error("Error detecting blockers", error);
      // Fall back to rule-based detection
      logger.debug("Using rule-based blocker detection");
      return this.fallbackSummarizer.detectBlockers(commits);
    }
  }

  /**
   * Categorize commits by type (features, fixes, refactors, etc.)
   */
  private categorizeCommits(commits: Array<{ message: string }>) {
    const categories = {
      features: [] as string[],
      fixes: [] as string[],
      refactors: [] as string[],
      tests: [] as string[],
      docs: [] as string[],
      other: [] as string[],
    };

    commits.forEach((c) => {
      const msg = c.message.toLowerCase();

      if (
        msg.startsWith("feat:") ||
        msg.startsWith("feature:") ||
        msg.includes("implement") ||
        msg.includes("add feature")
      ) {
        categories.features.push(c.message);
      } else if (
        msg.startsWith("fix:") ||
        msg.includes("fix ") ||
        msg.includes("fixed ") ||
        msg.includes("bug")
      ) {
        categories.fixes.push(c.message);
      } else if (
        msg.startsWith("refactor:") ||
        msg.includes("refactor") ||
        msg.includes("cleanup") ||
        msg.includes("reorganize")
      ) {
        categories.refactors.push(c.message);
      } else if (
        msg.startsWith("test:") ||
        msg.includes("test") ||
        msg.includes("spec")
      ) {
        categories.tests.push(c.message);
      } else if (
        msg.startsWith("docs:") ||
        msg.includes("document") ||
        msg.includes("readme")
      ) {
        categories.docs.push(c.message);
      } else {
        categories.other.push(c.message);
      }
    });

    return categories;
  }

  /**
   * Format categorized commits for AI prompt
   */
  private formatCategorizedCommits(
    categories: ReturnType<typeof this.categorizeCommits>
  ): string {
    let output = "";

    if (categories.features.length > 0) {
      output += `\n**Features/Additions:**\n${categories.features.map((c) => `- ${c}`).join("\n")}\n`;
    }
    if (categories.fixes.length > 0) {
      output += `\n**Bug Fixes:**\n${categories.fixes.map((c) => `- ${c}`).join("\n")}\n`;
    }
    if (categories.refactors.length > 0) {
      output += `\n**Refactors:**\n${categories.refactors.map((c) => `- ${c}`).join("\n")}\n`;
    }
    if (categories.tests.length > 0) {
      output += `\n**Tests:**\n${categories.tests.map((c) => `- ${c}`).join("\n")}\n`;
    }
    if (categories.docs.length > 0) {
      output += `\n**Documentation:**\n${categories.docs.map((c) => `- ${c}`).join("\n")}\n`;
    }
    if (categories.other.length > 0 && categories.other.length <= 5) {
      output += `\n**Other:**\n${categories.other.map((c) => `- ${c}`).join("\n")}\n`;
    } else if (categories.other.length > 5) {
      output += `\n**Other:** (${categories.other.length} commits)\n`;
    }

    return output || categories.other.map((c) => `- ${c}`).join("\n");
  }

  /**
   * Categorize files by directory/package
   */
  private categorizeFilesByPath(files: string[]): Map<string, string[]> {
    const categories = new Map<string, string[]>();

    files.forEach((file) => {
      // Extract meaningful category from path
      const parts = file.split("/");
      let category = "root";

      if (parts.includes("src")) {
        const srcIdx = parts.indexOf("src");
        category = parts[srcIdx + 1] || "src";
      } else if (parts.includes("packages")) {
        const pkgIdx = parts.indexOf("packages");
        category = `packages/${parts[pkgIdx + 1] || ""}`;
      } else if (parts.includes("apps")) {
        const appIdx = parts.indexOf("apps");
        category = `apps/${parts[appIdx + 1] || ""}`;
      } else if (parts.length > 1) {
        category = parts[0];
      }

      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(file);
    });

    return categories;
  }

  /**
   * Format categorized files for AI prompt
   */
  private formatCategorizedFiles(
    categories: Map<string, string[]>
  ): string {
    let output = "";
    const topCategories = Array.from(categories.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 10); // Top 10 categories

    topCategories.forEach(([category, files]) => {
      output += `\n**${category}** (${files.length} file${files.length > 1 ? "s" : ""}):\n`;
      files.slice(0, 5).forEach((f) => {
        output += `- ${f}\n`;
      });
      if (files.length > 5) {
        output += `  ... and ${files.length - 5} more\n`;
      }
    });

    return output;
  }
}
