import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import { BaseAIProvider } from "./BaseAIProvider";
import { AIRequest, AIProviderType, AI_API_KEY_SECRETS } from "./types";

const logger = getLogger();

/**
 * Google AI (Gemini) provider using direct API access with user's API key
 */
export class GoogleProvider extends BaseAIProvider {
  protected providerType: AIProviderType = "google";
  private apiKey: string | null = null;
  private static extensionContext: vscode.ExtensionContext | null = null;

  /**
   * Set the extension context for secret storage access
   */
  static setExtensionContext(context: vscode.ExtensionContext): void {
    GoogleProvider.extensionContext = context;
  }

  protected loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration("devBuddy");
    this.model = config.get<string>("ai.google.model", "gemini-1.5-flash");
  }

  protected async initialize(): Promise<void> {
    await this.loadApiKey();
  }

  /**
   * Load API key from secure storage
   */
  private async loadApiKey(): Promise<void> {
    if (!GoogleProvider.extensionContext) {
      logger.warn("[Google] Extension context not set, cannot load API key");
      return;
    }

    try {
      this.apiKey = await GoogleProvider.extensionContext.secrets.get(
        AI_API_KEY_SECRETS.google
      ) || null;
    } catch (error) {
      logger.error("[Google] Failed to load API key:", error);
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
    await context.secrets.store(AI_API_KEY_SECRETS.google, apiKey);
    logger.success("[Google] API key saved securely");
  }

  /**
   * Remove API key from secure storage
   */
  static async removeApiKey(context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.delete(AI_API_KEY_SECRETS.google);
    logger.info("[Google] API key removed");
  }

  /**
   * Check if API key is configured
   */
  static async hasApiKey(context: vscode.ExtensionContext): Promise<boolean> {
    const key = await context.secrets.get(AI_API_KEY_SECRETS.google);
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
        "Google AI API key not configured. Run 'DevBuddy: Set Google AI API Key' to configure."
      );
    }

    // Build the request body for Gemini API
    const contents: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }> = [];

    // Add system instruction as a user turn if provided (Gemini uses system_instruction)
    const body: {
      contents: typeof contents;
      generationConfig: {
        maxOutputTokens: number;
        temperature: number;
      };
      systemInstruction?: {
        parts: Array<{ text: string }>;
      };
    } = {
      contents: [],
      generationConfig: {
        maxOutputTokens: request.maxTokens || 2048,
        temperature: request.temperature ?? 0.7,
      },
    };

    if (request.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: request.systemPrompt }],
      };
    }

    body.contents = [
      {
        role: "user",
        parts: [{ text: request.prompt }],
      },
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    logger.debug(`[Google] Sending request to model: ${this.model}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Google AI API error: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.error?.message) {
          errorMessage = `Google AI API error: ${errorJson.error.message}`;
        }
      } catch {
        // Use default error message
      }

      logger.error(`[Google] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Google AI API returned empty response");
    }

    if (data.usageMetadata?.totalTokenCount) {
      logger.debug(
        `[Google] Tokens used: ${data.usageMetadata.totalTokenCount}`
      );
    }

    return content.trim();
  }
}

