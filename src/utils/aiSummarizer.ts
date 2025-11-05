import * as vscode from "vscode";

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

  constructor() {
    this.loadConfiguration();
    this.initializeModel();
  }

  private loadConfiguration() {
    const config = vscode.workspace.getConfiguration("monorepoTools");
    const configuredModel = config.get<string>("aiModel", "gpt-4o");
    this.writingTone = config.get<string>("writingTone", "professional");

    // Map config to exact model family for VS Code Language Model API
    // Based on verified working Copilot models
    switch (configuredModel) {
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
        this.modelFamily = "gpt-4o"; // default to GPT-4o (most reliable)
    }
  }

  private async initializeModel() {
    try {
      console.log(
        `[Monorepo Tools] Requested model family: ${this.modelFamily}`
      );

      // Get ALL available language models (no filter)
      console.log("[Monorepo Tools] Fetching all available models...");
      const allModels = await vscode.lm.selectChatModels();

      if (!allModels || allModels.length === 0) {
        console.log(
          "[Monorepo Tools] ✗ No AI models available, falling back to manual input"
        );
        this.model = null;
        return;
      }

      // Log all available models
      console.log(
        `[Monorepo Tools] Found ${allModels.length} available models:`
      );
      allModels.forEach((m, index) => {
        console.log(`  ${index + 1}. ${m.id}`, {
          vendor: m.vendor,
          family: m.family,
          name: m.name,
          maxInputTokens: m.maxInputTokens,
        });
      });

      // Try to find a model matching the requested family
      const matchingModel = allModels.find((m) =>
        m.family?.toLowerCase().includes(this.modelFamily.toLowerCase())
      );

      if (matchingModel) {
        this.model = matchingModel;
        console.log(
          `[Monorepo Tools] ✓ Using matching model: ${matchingModel.id}`,
          {
            vendor: matchingModel.vendor,
            family: matchingModel.family,
            name: matchingModel.name,
            maxInputTokens: matchingModel.maxInputTokens,
          }
        );
      } else {
        // Use first available model as fallback
        this.model = allModels[0];
        console.log(
          `[Monorepo Tools] ⚠ Model family "${this.modelFamily}" not found, using fallback: ${this.model.id}`,
          {
            vendor: this.model.vendor,
            family: this.model.family,
            name: this.model.name,
          }
        );
      }
    } catch (error) {
      console.error("[Monorepo Tools] AI model initialization failed:", error);
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
    if (!this.model) {
      return null;
    }

    try {
      const prompt = this.buildPRSummaryPrompt(request);
      const messages = [vscode.LanguageModelChatMessage.User(prompt)];

      console.log(
        `[Monorepo Tools] Sending PR request to model: ${this.model.id}`
      );

      const response = await this.model.sendRequest(
        messages,
        {},
        new vscode.CancellationTokenSource().token
      );

      let summary = "";
      for await (const fragment of response.text) {
        summary += fragment;
      }

      console.log(`[Monorepo Tools] ✓ Successfully generated PR summary`);
      return summary.trim();
    } catch (error) {
      console.error("[Monorepo Tools] Error generating PR summary:", error);

      // Try fallback to a different model
      console.log("[Monorepo Tools] Attempting to use fallback model...");
      return await this.tryFallbackModel(request, "pr");
    }
  }

  /**
   * Generate a summary of work done for standup
   */
  async summarizeCommitsForStandup(
    request: AISummaryRequest
  ): Promise<string | null> {
    if (!this.model) {
      return null;
    }

    try {
      const prompt = this.buildStandupSummaryPrompt(request);
      const messages = [vscode.LanguageModelChatMessage.User(prompt)];

      console.log(
        `[Monorepo Tools] Sending request to model: ${this.model.id}`
      );

      const response = await this.model.sendRequest(
        messages,
        {},
        new vscode.CancellationTokenSource().token
      );

      let summary = "";
      for await (const fragment of response.text) {
        summary += fragment;
      }

      console.log(`[Monorepo Tools] ✓ Successfully generated standup summary`);
      return summary.trim();
    } catch (error) {
      console.error(
        "[Monorepo Tools] Error generating standup summary:",
        error
      );

      // Try fallback to a different model
      console.log("[Monorepo Tools] Attempting to use fallback model...");
      return await this.tryFallbackModel(request, "standup");
    }
  }

  /**
   * Try using a fallback model if the primary fails
   */
  private async tryFallbackModel(
    request: AISummaryRequest,
    type: "standup" | "pr"
  ): Promise<string | null> {
    try {
      // Get all models again and try first available
      const allModels = await vscode.lm.selectChatModels();

      if (!allModels || allModels.length === 0) {
        console.log("[Monorepo Tools] No fallback models available");
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

      console.log(
        `[Monorepo Tools] Trying fallback model: ${fallbackModel.id} (${fallbackModel.family})`
      );

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

      console.log(
        `[Monorepo Tools] ✓ Fallback model succeeded: ${fallbackModel.family}`
      );

      // Update the model for future use
      this.model = fallbackModel;

      return summary.trim();
    } catch (error) {
      console.error("[Monorepo Tools] Fallback model also failed:", error);
      return null;
    }
  }

  /**
   * Suggest "what you'll do next" based on current work
   */
  async suggestNextSteps(request: AISummaryRequest): Promise<string | null> {
    if (!this.model) {
      return null;
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
      console.error("Error suggesting next steps:", error);
      return null;
    }
  }

  private buildPRSummaryPrompt(request: AISummaryRequest): string {
    const config = vscode.workspace.getConfiguration("monorepoTools");
    const tone = config.get<string>("writingTone", "professional");

    const toneInstructions = this.getToneInstructions(tone);
    const ticketInfo = request.ticketId ? `Ticket: ${request.ticketId}\n` : "";
    const contextInfo = request.context ? `Context: ${request.context}\n` : "";

    const commitList = request.commits.map((c) => `- ${c.message}`).join("\n");

    const fileList = request.changedFiles
      .slice(0, 30)
      .map((f) => `- ${f}`)
      .join("\n");

    const diffSection = request.fileDiffs
      ? `\nCode Changes (sample):\n${request.fileDiffs.substring(0, 2000)}${
          request.fileDiffs.length > 2000 ? "\n... (truncated)" : ""
        }\n`
      : "";

    return `You are helping generate a PR summary. ${toneInstructions}

${ticketInfo}${contextInfo}

Commits:
${commitList}

Changed files:
${fileList}
${
  request.changedFiles.length > 30
    ? `... and ${request.changedFiles.length - 30} more files`
    : ""
}
${diffSection}

Provide ONLY the bullet-pointed summary (2-4 bullets), no introduction or conclusion. Each bullet should be one clear sentence.`;
  }

  private buildStandupSummaryPrompt(request: AISummaryRequest): string {
    const config = vscode.workspace.getConfiguration("monorepoTools");
    const tone = config.get<string>("writingTone", "professional");

    const toneInstructions = this.getToneInstructions(tone, true);

    const commitList = request.commits
      .map((c) => {
        const branchInfo = c.branch ? ` [${c.branch}]` : "";
        return `- ${c.message}${branchInfo}`;
      })
      .join("\n");

    const fileCount = request.changedFiles.length;
    const contextInfo = request.context ? `\nContext: ${request.context}` : "";

    const diffSection = request.fileDiffs
      ? `\nCode Changes (sample):\n${request.fileDiffs.substring(0, 1500)}${
          request.fileDiffs.length > 1500 ? "\n... (truncated)" : ""
        }\n`
      : "";

    return `You are helping generate a daily standup update. ${toneInstructions}

Commits:
${commitList}

Files changed: ${fileCount}${contextInfo}
${diffSection}

Provide ONLY the summary text (1-2 sentences, under 100 words), no introduction. Write in first person (I worked on..., I fixed..., etc.).`;
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
    if (!this.model) {
      return null;
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
      console.error("Error detecting blockers:", error);
      return null;
    }
  }
}
