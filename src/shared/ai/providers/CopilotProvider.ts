import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import { BaseAIProvider } from "./BaseAIProvider";
import { AIRequest, AIProviderType } from "./types";

const logger = getLogger();

/**
 * Copilot provider using VS Code's Language Model API
 * This is the default provider that uses GitHub Copilot
 */
export class CopilotProvider extends BaseAIProvider {
  protected providerType: AIProviderType = "copilot";
  private vsCodeModel: vscode.LanguageModelChat | null = null;
  private preferredModelSelector: string = "auto";

  protected loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration("devBuddy");
    this.preferredModelSelector = config.get<string>("ai.model", "auto");

    // Extract model family from selector
    if (this.preferredModelSelector === "auto") {
      this.model = "auto";
    } else {
      // Remove "copilot:" prefix if present
      const modelPart = this.preferredModelSelector.replace(/^copilot:/, "");
      this.model = this.mapModelFamily(modelPart);
    }
  }

  /**
   * Map model selector to VS Code LM API model family
   */
  private mapModelFamily(modelPart: string): string {
    switch (modelPart) {
      case "gpt-4o":
        return "gpt-4o";
      case "gpt-4.1":
        return "gpt-4.1";
      case "gpt-4-turbo":
        return "gpt-4-turbo";
      case "gpt-4":
        return "gpt-4";
      case "gpt-4o-mini":
        return "gpt-4o-mini";
      case "gpt-3.5-turbo":
        return "gpt-3.5-turbo";
      case "gemini-2.0-flash":
        return "gemini-2.0-flash-exp";
      default:
        return modelPart;
    }
  }

  protected async initialize(): Promise<void> {
    try {
      logger.debug(`[Copilot] Initializing with model: ${this.model}`);

      const allModels = await vscode.lm.selectChatModels();

      if (!allModels || allModels.length === 0) {
        logger.warn("[Copilot] No AI models available");
        this.vsCodeModel = null;
        return;
      }

      logger.debug(`[Copilot] Found ${allModels.length} available models`);

      if (this.model === "auto" || !this.model) {
        // Auto-select best available model
        const preferredFamilies = [
          "gpt-4o",
          "gpt-4.1",
          "gpt-4-turbo",
          "gpt-4",
          "gemini-2.0-flash-exp",
          "gpt-4o-mini",
          "gpt-3.5-turbo",
        ];

        for (const family of preferredFamilies) {
          const match = allModels.find((m) => m.family === family);
          if (match) {
            this.vsCodeModel = match;
            this.model = match.family;
            logger.success(`[Copilot] Auto-selected model: ${match.id}`);
            return;
          }
        }

        // Fallback to first available
        this.vsCodeModel = allModels[0];
        this.model = allModels[0].family;
        logger.info(`[Copilot] Using first available: ${this.vsCodeModel.id}`);
      } else {
        // Find specific model
        const matchingModel = allModels.find((m) =>
          m.family?.toLowerCase().includes(this.model.toLowerCase())
        );

        if (matchingModel) {
          this.vsCodeModel = matchingModel;
          logger.success(`[Copilot] Using model: ${matchingModel.id}`);
        } else {
          this.vsCodeModel = allModels[0];
          this.model = allModels[0].family;
          logger.warn(
            `[Copilot] Model "${this.model}" not found, using: ${this.vsCodeModel.id}`
          );
        }
      }
    } catch (error) {
      logger.error("[Copilot] Initialization failed:", error);
      this.vsCodeModel = null;
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.vsCodeModel) {
      await this.initialize();
    }
    return this.vsCodeModel !== null;
  }

  protected async performRequest(request: AIRequest): Promise<string> {
    if (!this.vsCodeModel) {
      await this.initialize();
    }

    if (!this.vsCodeModel) {
      throw new Error(
        "Copilot is not available. Make sure GitHub Copilot is installed and active."
      );
    }

    const messages: vscode.LanguageModelChatMessage[] = [];

    if (request.systemPrompt) {
      messages.push(vscode.LanguageModelChatMessage.User(request.systemPrompt));
    }

    messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

    const response = await this.vsCodeModel.sendRequest(
      messages,
      {},
      new vscode.CancellationTokenSource().token
    );

    let content = "";
    for await (const fragment of response.text) {
      content += fragment;
    }

    return content.trim();
  }

  /**
   * Try to use a fallback model if the primary fails
   */
  async tryFallback(request: AIRequest): Promise<string | null> {
    try {
      const allModels = await vscode.lm.selectChatModels();

      if (!allModels || allModels.length === 0) {
        return null;
      }

      const preferredFamilies = [
        "gpt-4o",
        "gpt-4.1",
        "gpt-4-turbo",
        "gpt-4",
        "gemini-2.0-flash-exp",
        "gpt-4o-mini",
        "gpt-3.5-turbo",
      ];

      let fallbackModel = null;
      for (const family of preferredFamilies) {
        fallbackModel = allModels.find(
          (m) => m.family === family && m !== this.vsCodeModel
        );
        if (fallbackModel) break;
      }

      if (!fallbackModel) {
        fallbackModel = allModels.find((m) => m !== this.vsCodeModel);
      }

      if (!fallbackModel) {
        return null;
      }

      logger.debug(`[Copilot] Trying fallback: ${fallbackModel.id}`);

      const messages: vscode.LanguageModelChatMessage[] = [];
      if (request.systemPrompt) {
        messages.push(
          vscode.LanguageModelChatMessage.User(request.systemPrompt)
        );
      }
      messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

      const response = await fallbackModel.sendRequest(
        messages,
        {},
        new vscode.CancellationTokenSource().token
      );

      let content = "";
      for await (const fragment of response.text) {
        content += fragment;
      }

      // Update model for future use
      this.vsCodeModel = fallbackModel;
      this.model = fallbackModel.family;

      logger.success(`[Copilot] Fallback succeeded: ${fallbackModel.family}`);
      return content.trim();
    } catch (error) {
      logger.error("[Copilot] Fallback failed:", error);
      return null;
    }
  }
}

