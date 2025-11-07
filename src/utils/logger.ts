import * as vscode from "vscode";

/**
 * Logger utility for Linear Buddy extension
 * Provides centralized logging with OutputChannel and debug mode support
 */
export class Logger {
  private static instance: Logger;
  private outputChannel: vscode.OutputChannel;
  private debugMode: boolean = false;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Linear Buddy");
    this.loadDebugMode();

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("linearBuddy.debugMode")) {
        this.loadDebugMode();
      }
    });
  }

  /**
   * Get the singleton logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Load debug mode setting from configuration
   */
  private loadDebugMode() {
    const config = vscode.workspace.getConfiguration("linearBuddy");
    this.debugMode = config.get<boolean>("debugMode", false);
    
    if (this.debugMode) {
      this.outputChannel.appendLine(`[${this.timestamp()}] 🐛 Debug mode enabled`);
      this.show(); // Auto-show output when debug mode is enabled
    }
  }

  /**
   * Get current timestamp for log entries
   */
  private timestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false });
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: string, message: string): string {
    return `[${this.timestamp()}] [${level}] ${message}`;
  }

  /**
   * Log an info message (always shown)
   */
  public info(message: string) {
    const formatted = this.formatMessage("INFO", message);
    this.outputChannel.appendLine(formatted);
    console.log(formatted); // Also log to console for debugging
  }

  /**
   * Log a debug message (only shown in debug mode)
   */
  public debug(message: string) {
    if (this.debugMode) {
      const formatted = this.formatMessage("DEBUG", message);
      this.outputChannel.appendLine(formatted);
      console.log(formatted);
    }
  }

  /**
   * Log a warning message (always shown)
   */
  public warn(message: string) {
    const formatted = this.formatMessage("⚠️  WARN", message);
    this.outputChannel.appendLine(formatted);
    console.warn(formatted);
  }

  /**
   * Log an error message (always shown)
   */
  public error(message: string, error?: Error | unknown) {
    const formatted = this.formatMessage("❌ ERROR", message);
    this.outputChannel.appendLine(formatted);
    
    if (error) {
      const errorDetails = error instanceof Error 
        ? `${error.message}\n${error.stack}` 
        : String(error);
      this.outputChannel.appendLine(errorDetails);
      console.error(formatted, error);
    } else {
      console.error(formatted);
    }
  }

  /**
   * Log a success message (always shown)
   */
  public success(message: string) {
    const formatted = this.formatMessage("✓ SUCCESS", message);
    this.outputChannel.appendLine(formatted);
    console.log(formatted);
  }

  /**
   * Show the output channel
   */
  public show() {
    this.outputChannel.show(true); // preserveFocus = true
  }

  /**
   * Clear the output channel
   */
  public clear() {
    this.outputChannel.clear();
  }

  /**
   * Get the output channel (for disposal)
   */
  public getOutputChannel(): vscode.OutputChannel {
    return this.outputChannel;
  }

  /**
   * Check if debug mode is enabled
   */
  public isDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * Log a section divider for better readability
   */
  public divider(title?: string) {
    const line = "=".repeat(60);
    if (title) {
      this.outputChannel.appendLine(`\n${line}`);
      this.outputChannel.appendLine(`  ${title}`);
      this.outputChannel.appendLine(`${line}\n`);
    } else {
      this.outputChannel.appendLine(line);
    }
  }
}

/**
 * Convenience function to get the logger instance
 */
export function getLogger(): Logger {
  return Logger.getInstance();
}

