import * as vscode from "vscode";
import { FallbackSummarizer } from "./fallbackSummarizer";
import { AIProviderManager } from "./aiProviderManager";
import { getLogger } from "@shared/utils/logger";

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
  private providerManager: AIProviderManager;
  private fallbackSummarizer: FallbackSummarizer;
  private writingTone: string = "professional";
  private aiDisabled: boolean = false;

  constructor() {
    this.fallbackSummarizer = new FallbackSummarizer();
    this.providerManager = AIProviderManager.getInstance();
    this.loadConfiguration();
  }

  private loadConfiguration() {
    const config = vscode.workspace.getConfiguration("devBuddy");
    this.aiDisabled = config.get<boolean>("ai.disabled", false);
    this.writingTone = config.get<string>("writingTone", "professional");
  }

  async isAvailable(): Promise<boolean> {
    if (this.aiDisabled) {
      return false;
    }
    return this.providerManager.isAvailable();
  }

  /**
   * Get current provider info for logging/display
   */
  getProviderInfo(): { provider: string; model: string } {
    return {
      provider: this.providerManager.getProviderType() || "fallback",
      model: this.providerManager.getModelName(),
    };
  }

  /**
   * Generate a summary of commits for PR description
   */
  async summarizeCommitsForPR(
    request: AISummaryRequest
  ): Promise<string | null> {
    const logger = getLogger();

    // Use fallback summarizer if AI is disabled or unavailable
    if (this.aiDisabled || !(await this.providerManager.isAvailable())) {
      logger.debug("Using rule-based PR summary");
      return this.fallbackSummarizer.generatePRSummary(request);
    }

    try {
      const prompt = this.buildPRSummaryPrompt(request);
      const { provider, model } = this.getProviderInfo();
      logger.debug(`Sending PR request to ${provider}:${model}`);

      const response = await this.providerManager.sendRequest({
        prompt,
        maxTokens: 2048,
        temperature: 0.7,
      });

      logger.success(
        `Successfully generated PR summary using ${response.provider}`
      );
      return response.content;
    } catch (error) {
      logger.error("Error generating PR summary", error);

      // Fall back to rule-based
      logger.info("AI failed, using rule-based fallback");
      return this.fallbackSummarizer.generatePRSummary(request);
    }
  }

  /**
   * Generate a summary of work done for standup
   */
  async summarizeCommitsForStandup(
    request: AISummaryRequest
  ): Promise<string | null> {
    const logger = getLogger();

    // Use fallback summarizer if AI is disabled or unavailable
    if (this.aiDisabled || !(await this.providerManager.isAvailable())) {
      logger.debug("Using rule-based standup summary");
      return this.fallbackSummarizer.generateStandupSummary(request);
    }

    try {
      const prompt = this.buildStandupSummaryPrompt(request);
      const { provider, model } = this.getProviderInfo();
      logger.debug(`Sending standup request to ${provider}:${model}`);

      const response = await this.providerManager.sendRequest({
        prompt,
        maxTokens: 1024,
        temperature: 0.7,
      });

      logger.success(
        `Successfully generated standup summary using ${response.provider}`
      );
      return response.content;
    } catch (error) {
      logger.error("Error generating standup summary", error);

      // Fall back to rule-based
      logger.info("AI failed, using rule-based fallback");
      return this.fallbackSummarizer.generateStandupSummary(request);
    }
  }

  /**
   * Suggest "what you'll do next" based on current work
   */
  async suggestNextSteps(request: AISummaryRequest): Promise<string | null> {
    const logger = getLogger();

    // Use fallback summarizer if AI is disabled or unavailable
    if (this.aiDisabled || !(await this.providerManager.isAvailable())) {
      logger.debug("Using rule-based next steps suggestion");
      return this.fallbackSummarizer.suggestNextSteps(request);
    }

    try {
      const prompt = `Based on these recent commits, suggest 1-2 concise next steps (keep it under 50 words):

Commits:
${request.commits.map((c) => `- ${c.message}`).join("\n")}

Provide only the next steps, no explanations.`;

      const response = await this.providerManager.sendRequest({
        prompt,
        maxTokens: 256,
        temperature: 0.7,
      });

      return response.content;
    } catch (error) {
      logger.error("Error suggesting next steps", error);
      return this.fallbackSummarizer.suggestNextSteps(request);
    }
  }

  /**
   * Analyze if commits indicate any potential blockers or risks
   */
  async detectBlockersFromCommits(
    commits: Array<{ message: string }>
  ): Promise<string | null> {
    const logger = getLogger();

    // Use fallback summarizer if AI is disabled or unavailable
    if (this.aiDisabled || !(await this.providerManager.isAvailable())) {
      logger.debug("Using rule-based blocker detection");
      return this.fallbackSummarizer.detectBlockers(commits);
    }

    try {
      const commitMessages = commits.map((c) => c.message).join("\n");

      const prompt = `Based on these commit messages, identify any potential blockers, risks, or issues that might need attention. If everything looks normal, respond with "None detected".

Commits:
${commitMessages}

Respond with either "None detected" or a brief description of the concern.`;

      const response = await this.providerManager.sendRequest({
        prompt,
        maxTokens: 256,
        temperature: 0.3,
      });

      return response.content;
    } catch (error) {
      logger.error("Error detecting blockers", error);
      return this.fallbackSummarizer.detectBlockers(commits);
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
  private formatCategorizedFiles(categories: Map<string, string[]>): string {
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
