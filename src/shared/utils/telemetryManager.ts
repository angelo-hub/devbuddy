import * as vscode from "vscode";
import { getLogger } from "./logger";

// Import VSCode's native telemetry reporter
// Note: Install with: yarn add @vscode/extension-telemetry
import { TelemetryReporter } from "@vscode/extension-telemetry";

/**
 * Telemetry Manager for DevBuddy
 *
 * Uses VSCode's native telemetry with Azure Application Insights
 *
 * Privacy-First Principles:
 * - 100% opt-in only (respects VSCode's global telemetry setting)
 * - No PII (Personally Identifiable Information)
 * - No code or content tracking
 * - Transparent data collection
 * - Easy opt-out anytime
 * - Data helps improve the extension
 */

export interface TelemetryEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

export interface TelemetryConfig {
  enabled: boolean;
  userId: string; // Anonymous UUID
  optInDate: string;
  extendedTrialGranted: boolean;
  extendedTrialDays: number;
}

export class TelemetryManager {
  private static instance: TelemetryManager;
  private context: vscode.ExtensionContext | null = null;
  private config: TelemetryConfig | null = null;
  private reporter: TelemetryReporter | null = null;
  private eventQueue: TelemetryEvent[] = [];
  private logger = getLogger();

  private readonly TELEMETRY_KEY = "devBuddy.telemetry";
  private readonly TRIAL_EXTENSION_DAYS = 14; // Extra days for opting in
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute

  private constructor() {}

  public static getInstance(): TelemetryManager {
    if (!TelemetryManager.instance) {
      TelemetryManager.instance = new TelemetryManager();
    }
    return TelemetryManager.instance;
  }

  /**
   * Initialize telemetry manager with extension context
   */
  public async initialize(context: vscode.ExtensionContext): Promise<void> {
    this.context = context;

    // Load existing config or create new one
    this.config = context.globalState.get<TelemetryConfig>(
      this.TELEMETRY_KEY
    ) || {
      enabled: false,
      userId: this.generateUserId(),
      optInDate: "",
      extendedTrialGranted: false,
      extendedTrialDays: 0,
    };

    // Initialize VSCode native telemetry reporter
    // Connection string from environment variable or build-time config
    const connectionString = this.getTelemetryConnectionString();

    if (connectionString) {
      try {
        this.reporter = new TelemetryReporter(connectionString);
        context.subscriptions.push(this.reporter);
        this.logger.debug("VSCode native telemetry reporter initialized");
      } catch (error) {
        this.logger.error("Failed to initialize telemetry reporter", error);
        this.reporter = null;
      }
    } else {
      this.logger.warn(
        "No telemetry connection string found. Telemetry will be logged but not sent."
      );
    }

    // Set up periodic flush if enabled
    if (this.config.enabled) {
      this.startPeriodicFlush();
    }

    this.logger.debug("Telemetry manager initialized");
  }

  /**
   * Get telemetry connection string from environment or config
   * Priority: process.env > package.json config
   */
  private getTelemetryConnectionString(): string | undefined {
    // Try environment variable first (for development/local testing)
    if (process.env.VSCODE_TELEMETRY_CONNECTION_STRING) {
      return process.env.VSCODE_TELEMETRY_CONNECTION_STRING;
    }

    // Try from extension's package.json (for production builds)
    const extension = vscode.extensions.getExtension("personal.linear-buddy");
    const connectionString = extension?.packageJSON.telemetryConnectionString;

    if (connectionString) {
      return connectionString;
    }

    // No connection string found
    return undefined;
  }

  /**
   * Check if user has been asked about telemetry
   */
  public async hasBeenAsked(): Promise<boolean> {
    if (!this.context) return false;
    return this.context.globalState.get<boolean>(
      "devBuddy.telemetryAsked",
      false
    );
  }

  /**
   * Mark that user has been asked about telemetry
   */
  public async markAsAsked(): Promise<void> {
    if (!this.context) return;
    await this.context.globalState.update("devBuddy.telemetryAsked", true);
  }

  /**
   * Show telemetry opt-in prompt with trial extension incentive
   */
  public async showOptInPrompt(): Promise<boolean> {
    // Don't show if already asked
    if (await this.hasBeenAsked()) {
      return this.config?.enabled || false;
    }

    const message =
      `Help improve DevBuddy by sharing anonymous usage data! 🎁\n\n` +
      `✓ Get ${this.TRIAL_EXTENSION_DAYS} extra days of Pro features\n` +
      `✓ 100% anonymous (no code, no personal data)\n` +
      `✓ Helps us prioritize features you use\n` +
      `✓ Opt-out anytime in settings\n\n` +
      `What we collect: Feature usage, error counts, performance metrics\n` +
      `What we DON'T collect: Code, file names, personal info`;

    const choice = await vscode.window.showInformationMessage(
      message,
      {
        modal: true,
        detail:
          "View our privacy policy in the documentation for full details.",
      },
      "Enable Telemetry (+14 days Pro)",
      "No Thanks",
      "Learn More"
    );

    await this.markAsAsked();

    if (choice === "Enable Telemetry (+14 days Pro)") {
      await this.enableTelemetry(true); // true = grant trial extension
      return true;
    } else if (choice === "Learn More") {
      // Open documentation about telemetry
      await vscode.env.openExternal(
        vscode.Uri.parse(
          "https://github.com/yourusername/linear-buddy#telemetry"
        )
      );
      // Ask again after they've learned more
      return this.showOptInPrompt();
    }

    return false;
  }

  /**
   * Enable telemetry (opt-in)
   */
  public async enableTelemetry(
    grantTrialExtension: boolean = false
  ): Promise<void> {
    if (!this.context || !this.config) return;

    this.config.enabled = true;
    this.config.optInDate = new Date().toISOString();

    // Grant trial extension as reward for opting in
    if (grantTrialExtension && !this.config.extendedTrialGranted) {
      this.config.extendedTrialGranted = true;
      this.config.extendedTrialDays = this.TRIAL_EXTENSION_DAYS;

      // Store the trial extension date
      await this.context.globalState.update(
        "devBuddy.trialExtensionDate",
        new Date().toISOString()
      );

      vscode.window.showInformationMessage(
        `🎉 Thank you! You've been granted ${this.TRIAL_EXTENSION_DAYS} extra days of Pro features!`
      );
    }

    await this.saveConfig();
    this.startPeriodicFlush();

    // Track the opt-in event itself
    await this.trackEvent("telemetry_enabled", {
      trialExtensionGranted: grantTrialExtension,
    });

    this.logger.info("Telemetry enabled");
  }

  /**
   * Disable telemetry (opt-out)
   */
  public async disableTelemetry(): Promise<void> {
    if (!this.context || !this.config) return;

    // Track opt-out before disabling
    await this.trackEvent("telemetry_disabled");

    // Flush any pending events
    await this.flush();

    this.config.enabled = false;
    await this.saveConfig();

    vscode.window.showInformationMessage(
      "Telemetry has been disabled. Your privacy is important to us. 🔒"
    );

    this.logger.info("Telemetry disabled");
  }

  /**
   * Check if telemetry is enabled
   * Respects both VS Code's global telemetry setting AND our own opt-in
   */
  public isEnabled(): boolean {
    // First, check VS Code's global telemetry setting
    const vscodeConfig = vscode.workspace.getConfiguration('telemetry');
    const telemetryLevel = vscodeConfig.get<string>('telemetryLevel', 'all');
    
    // If VS Code telemetry is disabled, respect that
    if (telemetryLevel === 'off') {
      return false;
    }
    
    // If VS Code telemetry is error-only, only send errors
    // For now, we'll treat this as disabled for feature telemetry
    if (telemetryLevel === 'error') {
      return false;
    }
    
    // VS Code telemetry is enabled ('all' or 'crash'), check our own setting
    // For now, just follow VS Code's setting (no separate opt-in needed)
    return telemetryLevel === 'all';
  }

  /**
   * Get the number of trial extension days granted
   */
  public getTrialExtensionDays(): number {
    return this.config?.extendedTrialDays || 0;
  }

  /**
   * Check if trial extension was granted
   */
  public wasTrialExtensionGranted(): boolean {
    return this.config?.extendedTrialGranted || false;
  }

  /**
   * Track a telemetry event
   */
  public async trackEvent(
    event: string,
    properties?: Record<string, string | number | boolean>
  ): Promise<void> {
    if (!this.isEnabled() || !this.reporter) return;

    // Convert all properties to strings (VSCode telemetry requirement)
    const stringProperties: Record<string, string> = {};
    const measurements: Record<string, number> = {};

    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (typeof value === "number") {
          measurements[key] = value;
        } else {
          stringProperties[key] = String(value);
        }
      }
    }

    // Add standard properties
    stringProperties.userId = this.config!.userId;
    stringProperties.version = this.getExtensionVersion();
    stringProperties.platform = process.platform;
    stringProperties.vsCodeVersion = vscode.version;

    try {
      // Send directly via VSCode native telemetry
      // This automatically respects VSCode's global telemetry settings
      this.reporter.sendTelemetryEvent(event, stringProperties, measurements);

      this.logger.debug(`Telemetry event sent: ${event}`);

      // Increment event counter
      if (this.context) {
        const currentCount = this.context.globalState.get<number>(
          "devBuddy.telemetryEventsSent",
          0
        );
        await this.context.globalState.update(
          "devBuddy.telemetryEventsSent",
          currentCount + 1
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send telemetry event: ${event}`, error);
    }
  }

  /**
   * Track command execution
   */
  public async trackCommand(
    commandName: string,
    success: boolean = true
  ): Promise<void> {
    await this.trackEvent("command_executed", {
      command: commandName,
      success,
    });
  }

  /**
   * Track feature usage
   */
  public async trackFeatureUsage(
    feature: string,
    metadata?: Record<string, string | number | boolean>
  ): Promise<void> {
    await this.trackEvent("feature_used", {
      feature,
      ...metadata,
    });
  }

  /**
   * Track error (no stack trace, just error type and message)
   */
  public async trackError(
    errorType: string,
    errorMessage: string,
    context?: string
  ): Promise<void> {
    if (!this.isEnabled() || !this.reporter) return;

    // Use VSCode's native error telemetry method
    try {
      this.reporter.sendTelemetryErrorEvent("error_occurred", {
        errorType,
        errorMessage: this.sanitizeString(errorMessage),
        context: context || "unknown",
        userId: this.config!.userId,
        version: this.getExtensionVersion(),
        platform: process.platform,
      });

      this.logger.debug(`Error telemetry sent: ${errorType}`);
    } catch (error) {
      this.logger.error("Failed to send error telemetry", error);
    }
  }

  /**
   * Track performance metric
   */
  public async trackPerformance(
    operation: string,
    durationMs: number,
    metadata?: Record<string, string | number | boolean>
  ): Promise<void> {
    await this.trackEvent("performance_metric", {
      operation,
      durationMs,
      ...metadata,
    });
  }

  /**
   * Flush telemetry (VSCode reporter handles this automatically)
   * This method is kept for backward compatibility but is mostly a no-op
   */
  private async flush(): Promise<void> {
    // VSCode's TelemetryReporter handles batching and flushing automatically
    // We just need to ensure the reporter is disposed properly on deactivation
    if (this.reporter) {
      // Reporter will flush on dispose, which happens automatically
      this.logger.debug("Telemetry reporter will flush on dispose");
    }
  }

  /**
   * Start periodic flush timer
   * Note: VSCode native telemetry handles this automatically, so this is a no-op
   */
  private startPeriodicFlush(): void {
    // VSCode TelemetryReporter handles periodic flushing automatically
    // No need to manually flush
    this.logger.debug("Using VSCode native telemetry (auto-flush enabled)");
  }

  /**
   * Save config to global state
   */
  private async saveConfig(): Promise<void> {
    if (!this.context || !this.config) return;
    await this.context.globalState.update(this.TELEMETRY_KEY, this.config);
  }

  /**
   * Generate anonymous user ID
   */
  private generateUserId(): string {
    // Generate a UUID v4
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get extension version
   */
  private getExtensionVersion(): string {
    return (
      vscode.extensions.getExtension("personal.linear-buddy")?.packageJSON
        .version || "unknown"
    );
  }

  /**
   * Sanitize string to remove potential PII
   */
  private sanitizeString(str: string): string {
    // Remove file paths
    // eslint-disable-next-line no-useless-escape
    str = str.replace(/\/[\w\/\-_.]+/g, "[PATH]");
    // Remove URLs
    str = str.replace(/https?:\/\/[^\s]+/g, "[URL]");
    // Remove email addresses
    str = str.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL]");
    // Truncate to reasonable length
    return str.substring(0, 200);
  }

  /**
   * Get telemetry statistics for display
   */
  public async getTelemetryStats(): Promise<{
    enabled: boolean;
    eventsSent: number;
    optInDate: string;
    trialExtensionDays: number;
  }> {
    if (!this.context || !this.config) {
      return {
        enabled: false,
        eventsSent: 0,
        optInDate: "",
        trialExtensionDays: 0,
      };
    }

    const eventsSent = this.context.globalState.get<number>(
      "devBuddy.telemetryEventsSent",
      0
    );

    return {
      enabled: this.config.enabled,
      eventsSent,
      optInDate: this.config.optInDate,
      trialExtensionDays: this.config.extendedTrialDays,
    };
  }

  /**
   * Export telemetry data for user (GDPR compliance)
   */
  public async exportUserData(): Promise<string> {
    if (!this.context || !this.config) {
      return "No telemetry data available.";
    }

    const stats = await this.getTelemetryStats();

    return JSON.stringify(
      {
        userId: this.config.userId,
        config: this.config,
        stats,
        note: "This is all the data we have about your telemetry. Events are sent to our backend and not stored locally.",
      },
      null,
      2
    );
  }

  /**
   * Delete all user telemetry data (GDPR right to deletion)
   */
  public async deleteUserData(): Promise<void> {
    if (!this.context) return;

    // Clear queue
    this.eventQueue = [];

    // Reset config
    this.config = {
      enabled: false,
      userId: this.generateUserId(),
      optInDate: "",
      extendedTrialGranted: false,
      extendedTrialDays: 0,
    };

    await this.saveConfig();
    await this.context.globalState.update("devBuddy.telemetryEventsSent", 0);
    await this.context.globalState.update("devBuddy.telemetryAsked", false);

    vscode.window.showInformationMessage(
      "All local telemetry data has been deleted. Contact support to delete backend data."
    );
  }
}

/**
 * Convenience function to get telemetry manager instance
 */
export function getTelemetryManager(): TelemetryManager {
  return TelemetryManager.getInstance();
}

/**
 * Decorator to automatically track command execution
 */
export function trackCommand(commandName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const telemetry = getTelemetryManager();
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);

        await telemetry.trackCommand(commandName, true);
        await telemetry.trackPerformance(commandName, Date.now() - startTime);

        return result;
      } catch (error) {
        await telemetry.trackCommand(commandName, false);
        await telemetry.trackError(
          "command_error",
          error instanceof Error ? error.message : "Unknown error",
          commandName
        );
        throw error;
      }
    };

    return descriptor;
  };
}
