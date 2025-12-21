import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import { BaseAIProvider } from "./BaseAIProvider";
import { AIRequest, AIProviderType, AI_API_KEY_SECRETS } from "./types";

const logger = getLogger();

/**
 * Anthropic provider using direct API access with user's API key
 */
export class AnthropicProvider extends BaseAIProvider {
  protected providerType: AIProviderType = "anthropic";
  private apiKey: string | null = null;
  private static extensionContext: vscode.ExtensionContext | null = null;

  /**
   * Set the extension context for secret storage access
   */
  static setExtensionContext(context: vscode.ExtensionContext): void {
    AnthropicProvider.extensionContext = context;
  }

  protected loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration("devBuddy");
    this.model = config.get<string>(
      "ai.anthropic.model",
      "claude-3-5-haiku-20241022"
    );
  }

  protected async initialize(): Promise<void> {
    await this.loadApiKey();
  }

  /**
   * Load API key from secure storage
   */
  private async loadApiKey(): Promise<void> {
    if (!AnthropicProvider.extensionContext) {
      logger.warn("[Anthropic] Extension context not set, cannot load API key");
      return;
    }

    try {
      this.apiKey = await AnthropicProvider.extensionContext.secrets.get(
        AI_API_KEY_SECRETS.anthropic
      ) || null;
    } catch (error) {
      logger.error("[Anthropic] Failed to load API key:", error);
      this.apiKey = null;
    }
  }

  /**
   * Save API key to secure storage
   */
  static async setApiKey(
    context: vscode.ExtensionContext,
    apiKey: string
  ): Promise<void> {
    await context.secrets.store(AI_API_KEY_SECRETS.anthropic, apiKey);
    logger.success("[Anthropic] API key saved securely");
  }

  /**
   * Remove API key from secure storage
   */
  static async removeApiKey(context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.delete(AI_API_KEY_SECRETS.anthropic);
    logger.info("[Anthropic] API key removed");
  }

  /**
   * Check if API key is configured
   */
  static async hasApiKey(context: vscode.ExtensionContext): Promise<boolean> {
    const key = await context.secrets.get(AI_API_KEY_SECRETS.anthropic);
    return !!key;
  }

  async isAvailable(): Promise<boolean> {
    await this.loadApiKey();
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  protected async performRequest(request: AIRequest): Promise<string> {
    await this.loadApiKey();

    if (!this.apiKey) {
      throw new Error(
        "Anthropic API key not configured. Run 'DevBuddy: Set Anthropic API Key' to configure."
      );
    }

    const body: {
      model: string;
      max_tokens: number;
      system?: string;
      messages: Array<{ role: string; content: string }>;
    } = {
      model: this.model,
      max_tokens: request.maxTokens || 2048,
      messages: [{ role: "user", content: request.prompt }],
    };

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }

    logger.debug(`[Anthropic] Sending request to model: ${this.model}`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Anthropic API error: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error?.message) {
          errorMessage = `Anthropic API error: ${errorJson.error.message}`;
        }
      } catch {
        // Use default error message
      }

      logger.error(`[Anthropic] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = await response.json() as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const textContent = data.content?.find((c) => c.type === "text");
    const content = textContent?.text;

    if (!content) {
      throw new Error("Anthropic API returned empty response");
    }

    if (data.usage) {
      const totalTokens =
        (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0);
      logger.debug(`[Anthropic] Tokens used: ${totalTokens}`);
    }

    return content.trim();
  }
}

