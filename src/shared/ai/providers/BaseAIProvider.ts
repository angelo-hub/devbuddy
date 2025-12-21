import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import {
  IAIProvider,
  AIProviderType,
  AIRequest,
  AIResponse,
  AIProviderStatus,
} from "./types";

const logger = getLogger();

/**
 * Abstract base class for AI providers
 * Provides common functionality for all providers
 */
export abstract class BaseAIProvider implements IAIProvider {
  protected abstract providerType: AIProviderType;
  protected model: string = "";

  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load provider-specific configuration
   */
  protected abstract loadConfiguration(): void;

  /**
   * Initialize the provider (e.g., validate API key, connect to service)
   */
  protected abstract initialize(): Promise<void>;

  /**
   * Perform the actual API request
   */
  protected abstract performRequest(request: AIRequest): Promise<string>;

  /**
   * Get the provider type
   */
  getProviderType(): AIProviderType {
    return this.providerType;
  }

  /**
   * Get the current model name
   */
  getModelName(): string {
    return this.model;
  }

  /**
   * Check if the provider is available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Send a request to the AI provider with error handling
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    logger.debug(
      `[${this.providerType}] Sending request to model: ${this.model}`
    );

    try {
      const content = await this.performRequest(request);

      logger.success(
        `[${this.providerType}] Request completed successfully`
      );

      return {
        content,
        provider: this.providerType,
        model: this.model,
      };
    } catch (error) {
      logger.error(`[${this.providerType}] Request failed:`, error);
      throw error;
    }
  }

  /**
   * Get the current status of the provider
   */
  async getStatus(): Promise<AIProviderStatus> {
    try {
      const available = await this.isAvailable();
      return {
        provider: this.providerType,
        isConfigured: true,
        isAvailable: available,
        model: this.model,
      };
    } catch (error) {
      return {
        provider: this.providerType,
        isConfigured: false,
        isAvailable: false,
        model: this.model,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Helper to get configuration value
   */
  protected getConfig<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration("devBuddy");
    return config.get<T>(key, defaultValue);
  }
}

