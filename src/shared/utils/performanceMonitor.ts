import * as vscode from "vscode";
import { getLogger } from "./logger";
import { getTelemetryManager } from "./telemetryManager";

/**
 * Lightweight Performance Monitor for DevBuddy
 *
 * Design principles:
 * - Minimal overhead (uses Node.js built-in APIs)
 * - Infrequent sampling (configurable interval, default 5 min)
 * - Non-blocking async operations
 * - Smart triggers (activation + major commands only)
 * - Can be disabled via configuration
 *
 * What it tracks:
 * - Memory usage (heap, RSS)
 * - Extension activation time
 * - API latency (when wrapped)
 * - Long-running operations
 */

export interface MemorySnapshot {
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  externalMB: number;
  timestamp: number;
}

export interface PerformanceMetrics {
  activationTimeMs?: number;
  memorySnapshots: MemorySnapshot[];
  apiLatencies: Map<string, number[]>;
  longOperations: Array<{ operation: string; durationMs: number }>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private logger = getLogger();

  // Timing
  private activationStartTime: number = 0;
  private activationEndTime: number = 0;

  // Metrics storage (kept small)
  private apiLatencies: Map<string, number[]> = new Map();
  private longOperations: Array<{ operation: string; durationMs: number }> = [];

  // Configuration
  private readonly SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_LATENCY_SAMPLES = 20; // Per API endpoint
  private readonly MAX_LONG_OPERATIONS = 50;
  private readonly LONG_OPERATION_THRESHOLD_MS = 3000; // 3 seconds

  // State
  private snapshotTimer: NodeJS.Timeout | null = null;
  private isEnabled: boolean = true;
  private snapshotCount: number = 0;
  private readonly MAX_SNAPSHOTS_PER_SESSION = 50; // Cap to prevent unbounded growth

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Mark the start of extension activation
   * Call this at the very beginning of activate()
   */
  public markActivationStart(): void {
    this.activationStartTime = Date.now();
  }

  /**
   * Mark the end of extension activation and report metrics
   * Call this at the end of activate()
   */
  public async markActivationEnd(): Promise<void> {
    this.activationEndTime = Date.now();
    const activationTimeMs = this.activationEndTime - this.activationStartTime;

    // Check if performance telemetry is enabled
    const config = vscode.workspace.getConfiguration("devBuddy");
    this.isEnabled = config.get<boolean>("telemetry.performance", true);

    if (!this.isEnabled) {
      this.logger.debug("Performance monitoring disabled via configuration");
      return;
    }

    // Report activation time
    const telemetry = getTelemetryManager();
    await telemetry.trackEvent("extension_activation_performance", {
      activationTimeMs,
      ...this.getMemoryMetrics(),
    });

    this.logger.debug(`Extension activated in ${activationTimeMs}ms`);

    // Start periodic snapshots (lightweight, every 5 min)
    this.startPeriodicSnapshots();
  }

  /**
   * Get current memory metrics (very lightweight - uses built-in Node.js API)
   */
  public getMemoryMetrics(): Record<string, number> {
    const memUsage = process.memoryUsage();
    return {
      heapUsedMB: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMB: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
      externalMB: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
    };
  }

  /**
   * Take a memory snapshot (called periodically or on-demand)
   */
  public async takeSnapshot(reason: string = "periodic"): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    // Prevent unbounded growth
    if (this.snapshotCount >= this.MAX_SNAPSHOTS_PER_SESSION) {
      return;
    }

    this.snapshotCount++;

    const telemetry = getTelemetryManager();
    await telemetry.trackEvent("resource_snapshot", {
      reason,
      snapshotNumber: this.snapshotCount,
      ...this.getMemoryMetrics(),
    });
  }

  /**
   * Wrap an async operation to track its duration
   * Use this for API calls and other operations you want to monitor
   *
   * @example
   * const result = await performanceMonitor.trackOperation('linear_api_call', async () => {
   *   return await linearClient.fetchIssues();
   * });
   */
  public async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const durationMs = Date.now() - startTime;

      // Track API latency
      this.recordLatency(operationName, durationMs);

      // Track if it was a long operation
      if (durationMs > this.LONG_OPERATION_THRESHOLD_MS) {
        this.recordLongOperation(operationName, durationMs);
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // Still record the timing even on failure
      this.recordLatency(operationName, durationMs);

      if (durationMs > this.LONG_OPERATION_THRESHOLD_MS) {
        this.recordLongOperation(`${operationName}_failed`, durationMs);
      }

      throw error;
    }
  }

  /**
   * Record API latency (keeps only recent samples)
   * Called directly from HTTP client for all API requests
   */
  public recordApiLatency(apiName: string, durationMs: number): void {
    this.recordLatency(apiName, durationMs);
  }

  /**
   * Record latency internally (keeps only recent samples)
   */
  private recordLatency(operation: string, durationMs: number): void {
    if (!this.apiLatencies.has(operation)) {
      this.apiLatencies.set(operation, []);
    }

    const samples = this.apiLatencies.get(operation);
    if (samples) {
      samples.push(durationMs);

      // Keep only recent samples (rolling window)
      if (samples.length > this.MAX_LATENCY_SAMPLES) {
        samples.shift();
      }
    }
  }

  /**
   * Record a long operation
   */
  private recordLongOperation(operation: string, durationMs: number): void {
    this.longOperations.push({ operation, durationMs });

    // Keep bounded
    if (this.longOperations.length > this.MAX_LONG_OPERATIONS) {
      this.longOperations.shift();
    }

    this.logger.debug(
      `Long operation detected: ${operation} took ${durationMs}ms`
    );
  }

  /**
   * Start periodic memory snapshots
   * Runs every 5 minutes - very lightweight
   */
  private startPeriodicSnapshots(): void {
    if (this.snapshotTimer) {
      return; // Already running
    }

    this.snapshotTimer = setInterval(async () => {
      await this.takeSnapshot("periodic");
    }, this.SNAPSHOT_INTERVAL_MS);

    // Don't keep the extension alive just for snapshots
    this.snapshotTimer.unref();
  }

  /**
   * Stop periodic snapshots
   */
  public stopPeriodicSnapshots(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
  }

  /**
   * Get aggregated performance summary
   * Useful for end-of-session reporting
   */
  public getPerformanceSummary(): {
    activationTimeMs: number;
    avgApiLatencies: Record<string, number>;
    longOperationCount: number;
    currentMemory: Record<string, number>;
  } {
    // Calculate average latencies
    const avgApiLatencies: Record<string, number> = {};
    for (const [operation, samples] of this.apiLatencies) {
      if (samples.length > 0) {
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        avgApiLatencies[operation] = Math.round(avg);
      }
    }

    return {
      activationTimeMs: this.activationEndTime - this.activationStartTime,
      avgApiLatencies,
      longOperationCount: this.longOperations.length,
      currentMemory: this.getMemoryMetrics(),
    };
  }

  /**
   * Report session summary on deactivation
   */
  public async reportSessionSummary(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const summary = this.getPerformanceSummary();
    const telemetry = getTelemetryManager();

    await telemetry.trackEvent("session_performance_summary", {
      activationTimeMs: summary.activationTimeMs,
      longOperationCount: summary.longOperationCount,
      snapshotCount: this.snapshotCount,
      ...summary.currentMemory,
      // Flatten API latencies for telemetry
      ...Object.fromEntries(
        Object.entries(summary.avgApiLatencies).map(([k, v]) => [
          `avgLatency_${k}`,
          v,
        ])
      ),
    });

    this.logger.debug("Session performance summary reported");
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.stopPeriodicSnapshots();
    this.apiLatencies.clear();
    this.longOperations = [];
  }
}

/**
 * Convenience function to get performance monitor instance
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  return PerformanceMonitor.getInstance();
}

/**
 * Decorator to track method performance
 * Use on methods that should be monitored
 *
 * @example
 * class MyClass {
 *   @trackPerformance("fetch_issues")
 *   async fetchIssues() { ... }
 * }
 */
export function trackPerformance(operationName: string) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const monitor = getPerformanceMonitor();
      return monitor.trackOperation(operationName, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

