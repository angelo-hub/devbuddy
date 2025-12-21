/**
 * AI Provider types for DevBuddy BYOT (Bring Your Own Token) feature
 */

/**
 * Supported AI providers
 */
export type AIProviderType = "copilot" | "openai" | "anthropic" | "google";

/**
 * Common request interface for AI operations
 */
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Common response interface for AI operations
 */
export interface AIResponse {
  content: string;
  provider: AIProviderType;
  model: string;
  tokensUsed?: number;
}

/**
 * Provider configuration
 */
export interface AIProviderConfig {
  provider: AIProviderType;
  model: string;
  apiKey?: string; // Only for BYOT providers
}

/**
 * Provider status information
 */
export interface AIProviderStatus {
  provider: AIProviderType;
  isConfigured: boolean;
  isAvailable: boolean;
  model: string;
  error?: string;
}

/**
 * Secret storage keys for API keys
 */
export const AI_API_KEY_SECRETS = {
  openai: "devBuddy.ai.openaiApiKey",
  anthropic: "devBuddy.ai.anthropicApiKey",
  google: "devBuddy.ai.googleApiKey",
} as const;

/**
 * Base interface for AI providers
 */
export interface IAIProvider {
  /**
   * Get the provider type
   */
  getProviderType(): AIProviderType;

  /**
   * Get the current model name
   */
  getModelName(): string;

  /**
   * Check if the provider is configured and ready
   */
  isAvailable(): Promise<boolean>;

  /**
   * Send a request to the AI provider
   */
  sendRequest(request: AIRequest): Promise<AIResponse>;

  /**
   * Get the current status of the provider
   */
  getStatus(): Promise<AIProviderStatus>;
}

