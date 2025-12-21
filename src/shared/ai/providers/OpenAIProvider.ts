import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import { BaseAIProvider } from "./BaseAIProvider";
import { AIRequest, AIProviderType, AI_API_KEY_SECRETS } from "./types";

const logger = getLogger();

/**
 * OpenAI provider using direct API access with user's API key
 */
export class OpenAIProvider extends BaseAIProvider {
  protected providerType: AIProviderType = "openai";
  private apiKey: string | null = null;
  private static extensionContext: vscode.ExtensionContext | null = null;

  /**
   * Set the extension context for secret storage access
   */
  static setExtensionContext(context: vscode.ExtensionContext): void {
    OpenAIProvider.extensionContext = context;
  }

  protected loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration("devBuddy");
    this.model = config.get<string>("ai.openai.model", "gpt-4o-mini");
  }

  protected async initialize(): Promise<void> {
    await this.loadApiKey();
  }

  /**
   * Load API key from secure storage
   */
  private async loadApiKey(): Promise<void> {
    if (!OpenAIProvider.extensionContext) {
      logger.warn("[OpenAI] Extension context not set, cannot load API key");
      return;
    }

    try {
      this.apiKey = await OpenAIProvider.extensionContext.secrets.get(
        AI_API_KEY_SECRETS.openai
      ) || null;
    } catch (error) {
      logger.error("[OpenAI] Failed to load API key:", error);
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
    await context.secrets.store(AI_API_KEY_SECRETS.openai, apiKey);
    logger.success("[OpenAI] API key saved securely");
  }

  /**
   * Remove API key from secure storage
   */
  static async removeApiKey(context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.delete(AI_API_KEY_SECRETS.openai);
    logger.info("[OpenAI] API key removed");
  }

  /**
   * Check if API key is configured
   */
  static async hasApiKey(context: vscode.ExtensionContext): Promise<boolean> {
    const key = await context.secrets.get(AI_API_KEY_SECRETS.openai);
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
        "OpenAI API key not configured. Run 'DevBuddy: Set OpenAI API Key' to configure."
      );
    }

    const messages: Array<{ role: string; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }

    messages.push({ role: "user", content: request.prompt });

    const body = {
      model: this.model,
      messages,
      max_tokens: request.maxTokens || 2048,
      temperature: request.temperature ?? 0.7,
    };

    logger.debug(`[OpenAI] Sending request to model: ${this.model}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `OpenAI API error: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error?.message) {
          errorMessage = `OpenAI API error: ${errorJson.error.message}`;
        }
      } catch {
        // Use default error message
      }

      logger.error(`[OpenAI] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI API returned empty response");
    }

    if (data.usage?.total_tokens) {
      logger.debug(`[OpenAI] Tokens used: ${data.usage.total_tokens}`);
    }

    return content.trim();
  }
}

