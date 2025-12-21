import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import {
  IAIProvider,
  AIProviderType,
  AIProviderStatus,
  AIRequest,
  AIResponse,
} from "./providers/types";
import { CopilotProvider } from "./providers/CopilotProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { AnthropicProvider } from "./providers/AnthropicProvider";
import { GoogleProvider } from "./providers/GoogleProvider";
import { FallbackSummarizer } from "./fallbackSummarizer";

const logger = getLogger();

/**
 * AI Provider Manager
 * Manages provider selection, initialization, and request routing
 */
export class AIProviderManager {
  private static instance: AIProviderManager | null = null;
  private static extensionContext: vscode.ExtensionContext | null = null;

  private currentProvider: IAIProvider | null = null;
  private fallbackSummarizer: FallbackSummarizer;
  private aiDisabled: boolean = false;

  private constructor() {
    this.fallbackSummarizer = new FallbackSummarizer();
    this.loadConfiguration();
  }

  /**
   * Initialize the manager with extension context
   * Must be called during extension activation
   */
  static initialize(context: vscode.ExtensionContext): void {
    AIProviderManager.extensionContext = context;

    // Set context for all BYOT providers
    OpenAIProvider.setExtensionContext(context);
    AnthropicProvider.setExtensionContext(context);
    GoogleProvider.setExtensionContext(context);

    logger.debug("[AIProviderManager] Initialized with extension context");
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  /**
   * Load configuration and initialize the appropriate provider
   */
  private loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration("devBuddy");
    this.aiDisabled = config.get<boolean>("ai.disabled", false);

    if (this.aiDisabled) {
      logger.info(
        "[AIProviderManager] AI features disabled, using rule-based fallback"
      );
      this.currentProvider = null;
      return;
    }

    const providerType = config.get<AIProviderType>("ai.provider", "copilot");
    this.initializeProvider(providerType);
  }

  /**
   * Initialize a specific provider
   */
  private initializeProvider(providerType: AIProviderType): void {
    logger.debug(`[AIProviderManager] Initializing provider: ${providerType}`);

    switch (providerType) {
      case "copilot":
        this.currentProvider = new CopilotProvider();
        break;
      case "openai":
        this.currentProvider = new OpenAIProvider();
        break;
      case "anthropic":
        this.currentProvider = new AnthropicProvider();
        break;
      case "google":
        this.currentProvider = new GoogleProvider();
        break;
      default:
        logger.warn(
          `[AIProviderManager] Unknown provider: ${providerType}, falling back to Copilot`
        );
        this.currentProvider = new CopilotProvider();
    }
  }

  /**
   * Refresh provider (e.g., after settings change)
   */
  refresh(): void {
    this.loadConfiguration();
    logger.debug("[AIProviderManager] Provider refreshed");
  }

  /**
   * Check if AI is available
   */
  async isAvailable(): Promise<boolean> {
    if (this.aiDisabled || !this.currentProvider) {
      return false;
    }
    return this.currentProvider.isAvailable();
  }

  /**
   * Get the current provider type
   */
  getProviderType(): AIProviderType | null {
    return this.currentProvider?.getProviderType() ?? null;
  }

  /**
   * Get the current model name
   */
  getModelName(): string {
    return this.currentProvider?.getModelName() ?? "none";
  }

  /**
   * Send a request to the AI provider
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (this.aiDisabled) {
      throw new Error("AI features are disabled. Enable in settings or use rule-based fallback.");
    }

    if (!this.currentProvider) {
      throw new Error("No AI provider configured");
    }

    return this.currentProvider.sendRequest(request);
  }

  /**
   * Get the status of all providers
   */
  async getAllProviderStatuses(): Promise<AIProviderStatus[]> {
    const context = AIProviderManager.extensionContext;
    const statuses: AIProviderStatus[] = [];

    // Copilot
    const copilot = new CopilotProvider();
    statuses.push(await copilot.getStatus());

    // OpenAI
    const openaiConfigured = context
      ? await OpenAIProvider.hasApiKey(context)
      : false;
    statuses.push({
      provider: "openai",
      isConfigured: openaiConfigured,
      isAvailable: openaiConfigured,
      model: vscode.workspace
        .getConfiguration("devBuddy")
        .get<string>("ai.openai.model", "gpt-4o-mini"),
    });

    // Anthropic
    const anthropicConfigured = context
      ? await AnthropicProvider.hasApiKey(context)
      : false;
    statuses.push({
      provider: "anthropic",
      isConfigured: anthropicConfigured,
      isAvailable: anthropicConfigured,
      model: vscode.workspace
        .getConfiguration("devBuddy")
        .get<string>("ai.anthropic.model", "claude-3-5-haiku-20241022"),
    });

    // Google
    const googleConfigured = context
      ? await GoogleProvider.hasApiKey(context)
      : false;
    statuses.push({
      provider: "google",
      isConfigured: googleConfigured,
      isAvailable: googleConfigured,
      model: vscode.workspace
        .getConfiguration("devBuddy")
        .get<string>("ai.google.model", "gemini-1.5-flash"),
    });

    return statuses;
  }

  /**
   * Get the current provider status
   */
  async getCurrentProviderStatus(): Promise<AIProviderStatus | null> {
    if (!this.currentProvider) {
      return null;
    }
    return this.currentProvider.getStatus();
  }

  /**
   * Get the fallback summarizer (for rule-based analysis)
   */
  getFallbackSummarizer(): FallbackSummarizer {
    return this.fallbackSummarizer;
  }

  /**
   * Check if AI is disabled
   */
  isAIDisabled(): boolean {
    return this.aiDisabled;
  }

  /**
   * Get extension context (for commands that need it)
   */
  static getExtensionContext(): vscode.ExtensionContext | null {
    return AIProviderManager.extensionContext;
  }
}

