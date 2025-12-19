/**
 * Mock Manager
 *
 * Centralized management for starting and stopping mock servers
 * during E2E test execution.
 */

import {
  linearMockServer,
  startLinearMockServer,
  stopLinearMockServer,
  resetLinearMockServer,
} from "./linear/server";
import {
  jiraMockServer,
  startJiraMockServer,
  stopJiraMockServer,
  resetJiraMockServer,
} from "./jira/server";
import { TestConfig, shouldUseRealApi } from "../utils/testConfig";

export type MockPlatform = "linear" | "jira" | "all";

/**
 * MockManager class for managing mock servers
 */
export class MockManager {
  private linearRunning = false;
  private jiraRunning = false;

  /**
   * Start mock servers
   */
  start(platform: MockPlatform = "all"): void {
    // Skip if using real APIs
    if (shouldUseRealApi()) {
      console.log("Using real APIs - mock servers not started");
      return;
    }

    if (platform === "linear" || platform === "all") {
      if (!this.linearRunning) {
        startLinearMockServer();
        this.linearRunning = true;
        console.log("Linear mock server started");
      }
    }

    if (platform === "jira" || platform === "all") {
      if (!this.jiraRunning) {
        startJiraMockServer();
        this.jiraRunning = true;
        console.log("Jira mock server started");
      }
    }
  }

  /**
   * Stop mock servers
   */
  stop(platform: MockPlatform = "all"): void {
    if (platform === "linear" || platform === "all") {
      if (this.linearRunning) {
        stopLinearMockServer();
        this.linearRunning = false;
        console.log("Linear mock server stopped");
      }
    }

    if (platform === "jira" || platform === "all") {
      if (this.jiraRunning) {
        stopJiraMockServer();
        this.jiraRunning = false;
        console.log("Jira mock server stopped");
      }
    }
  }

  /**
   * Reset mock servers (clear custom handlers)
   */
  reset(platform: MockPlatform = "all"): void {
    if (platform === "linear" || platform === "all") {
      if (this.linearRunning) {
        resetLinearMockServer();
      }
    }

    if (platform === "jira" || platform === "all") {
      if (this.jiraRunning) {
        resetJiraMockServer();
      }
    }
  }

  /**
   * Check if mock server is running
   */
  isRunning(platform: MockPlatform): boolean {
    if (platform === "linear") {
      return this.linearRunning;
    }
    if (platform === "jira") {
      return this.jiraRunning;
    }
    return this.linearRunning && this.jiraRunning;
  }

  /**
   * Get the Linear mock server instance
   */
  getLinearServer() {
    return linearMockServer;
  }

  /**
   * Get the Jira mock server instance
   */
  getJiraServer() {
    return jiraMockServer;
  }
}

// Singleton instance
export const mockManager = new MockManager();

// Convenience functions
export function startMockServers(platform: MockPlatform = "all"): void {
  mockManager.start(platform);
}

export function stopMockServers(platform: MockPlatform = "all"): void {
  mockManager.stop(platform);
}

export function resetMockServers(platform: MockPlatform = "all"): void {
  mockManager.reset(platform);
}

/**
 * Setup mock servers for Mocha tests
 * Use with before() and after() hooks
 */
export function setupMockServerHooks(platform: MockPlatform = "all"): void {
  before(() => {
    startMockServers(platform);
  });

  after(() => {
    stopMockServers(platform);
  });

  afterEach(() => {
    resetMockServers(platform);
  });
}

/**
 * Decorator for running tests with mocked APIs
 */
export function withMocks(platform: MockPlatform = "all") {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      startMockServers(platform);
      try {
        return await originalMethod.apply(this, args);
      } finally {
        stopMockServers(platform);
      }
    };

    return descriptor;
  };
}

export default {
  MockManager,
  mockManager,
  startMockServers,
  stopMockServers,
  resetMockServers,
  setupMockServerHooks,
  withMocks,
};
