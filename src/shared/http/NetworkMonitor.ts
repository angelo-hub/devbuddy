/**
 * Network Monitor
 * 
 * Tracks online/offline status based on request success/failure patterns.
 * Provides status bar integration to show network status in VS Code.
 */

import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

/**
 * Configuration for network monitoring
 */
export interface NetworkMonitorConfig {
  /** Number of consecutive failures before marking as offline (default: 3) */
  failureThreshold: number;
  /** Number of consecutive successes to recover from offline (default: 1) */
  recoveryThreshold: number;
  /** Show status bar item (default: true) */
  showStatusBar: boolean;
}

/**
 * Network status
 */
export type NetworkStatus = "online" | "offline" | "degraded";

/**
 * Event listener type
 */
type StatusChangeListener = (status: NetworkStatus) => void;

/**
 * Default configuration
 */
const DEFAULT_CONFIG: NetworkMonitorConfig = {
  failureThreshold: 3,
  recoveryThreshold: 1,
  showStatusBar: true,
};

/**
 * Network Monitor
 * 
 * Singleton that tracks network status based on API request outcomes.
 * Shows a status bar item when offline or degraded.
 */
export class NetworkMonitor {
  private static instance: NetworkMonitor | null = null;

  private config: NetworkMonitorConfig;
  private status: NetworkStatus = "online";
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private statusBarItem: vscode.StatusBarItem | null = null;
  private listeners: Set<StatusChangeListener> = new Set();
  private lastFailureTime: number | null = null;

  private constructor(config?: Partial<NetworkMonitorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the singleton instance
   */
  static getInstance(config?: Partial<NetworkMonitorConfig>): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor(config);
    }
    return NetworkMonitor.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    if (NetworkMonitor.instance) {
      NetworkMonitor.instance.dispose();
    }
    NetworkMonitor.instance = null;
  }

  /**
   * Initialize the network monitor with VS Code context
   * Creates the status bar item
   */
  initialize(context: vscode.ExtensionContext): void {
    if (this.config.showStatusBar && !this.statusBarItem) {
      this.statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        50
      );
      this.statusBarItem.name = "DevBuddy Network Status";
      context.subscriptions.push(this.statusBarItem);
      
      // Only show when not online
      this.updateStatusBar();
    }
  }

  /**
   * Record a successful network request
   */
  recordSuccess(): void {
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;

    // Check for recovery from offline/degraded
    if (
      this.status !== "online" &&
      this.consecutiveSuccesses >= this.config.recoveryThreshold
    ) {
      this.setStatus("online");
      logger.info("Network connection restored");
    }
  }

  /**
   * Record a failed network request
   */
  recordFailure(): void {
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();

    // Check thresholds for status change
    if (this.consecutiveFailures >= this.config.failureThreshold) {
      if (this.status !== "offline") {
        this.setStatus("offline");
        logger.warn("Network appears to be offline");
      }
    } else if (this.consecutiveFailures >= 1 && this.status === "online") {
      this.setStatus("degraded");
      logger.debug("Network connection may be degraded");
    }
  }

  /**
   * Get the current network status
   */
  getStatus(): NetworkStatus {
    return this.status;
  }

  /**
   * Check if the network is online
   */
  isOnline(): boolean {
    return this.status === "online";
  }

  /**
   * Check if the network is offline
   */
  isOffline(): boolean {
    return this.status === "offline";
  }

  /**
   * Get time since last failure (in milliseconds)
   */
  getTimeSinceLastFailure(): number | null {
    if (this.lastFailureTime === null) {
      return null;
    }
    return Date.now() - this.lastFailureTime;
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: StatusChangeListener): vscode.Disposable {
    this.listeners.add(listener);
    return new vscode.Disposable(() => {
      this.listeners.delete(listener);
    });
  }

  /**
   * Manually set status (useful for testing or manual override)
   */
  setStatus(status: NetworkStatus): void {
    if (this.status !== status) {
      const previousStatus = this.status;
      this.status = status;

      logger.debug(`Network status changed: ${previousStatus} -> ${status}`);

      // Update UI
      this.updateStatusBar();

      // Notify listeners
      for (const listener of this.listeners) {
        try {
          listener(status);
        } catch (error) {
          logger.error("Error in network status listener:", error);
        }
      }
    }
  }

  /**
   * Reset counters (useful after manual intervention)
   */
  reset(): void {
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.setStatus("online");
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.statusBarItem) {
      this.statusBarItem.dispose();
      this.statusBarItem = null;
    }
    this.listeners.clear();
  }

  /**
   * Update the status bar item based on current status
   */
  private updateStatusBar(): void {
    if (!this.statusBarItem) {
      return;
    }

    switch (this.status) {
      case "offline":
        this.statusBarItem.text = "$(cloud-offline) DevBuddy Offline";
        this.statusBarItem.tooltip = "Network connection appears to be offline. Some features may be unavailable.";
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.errorBackground"
        );
        this.statusBarItem.show();
        break;

      case "degraded":
        this.statusBarItem.text = "$(warning) DevBuddy";
        this.statusBarItem.tooltip = "Network connection may be unstable.";
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.warningBackground"
        );
        this.statusBarItem.show();
        break;

      case "online":
      default:
        // Hide status bar when online
        this.statusBarItem.hide();
        break;
    }
  }

  /**
   * Get diagnostic information
   */
  getDiagnostics(): {
    status: NetworkStatus;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    lastFailureTime: number | null;
    config: NetworkMonitorConfig;
  } {
    return {
      status: this.status,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      config: { ...this.config },
    };
  }
}

/**
 * Get the singleton network monitor instance
 */
export function getNetworkMonitor(
  config?: Partial<NetworkMonitorConfig>
): NetworkMonitor {
  return NetworkMonitor.getInstance(config);
}

/**
 * Initialize the network monitor with VS Code context
 * Should be called during extension activation
 */
export function initializeNetworkMonitor(
  context: vscode.ExtensionContext,
  config?: Partial<NetworkMonitorConfig>
): NetworkMonitor {
  const monitor = NetworkMonitor.getInstance(config);
  monitor.initialize(context);
  return monitor;
}

