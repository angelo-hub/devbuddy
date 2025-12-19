"use strict";
/**
 * Mock Manager
 *
 * Centralized management for starting and stopping mock servers
 * during E2E test execution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockManager = exports.MockManager = void 0;
exports.startMockServers = startMockServers;
exports.stopMockServers = stopMockServers;
exports.resetMockServers = resetMockServers;
exports.setupMockServerHooks = setupMockServerHooks;
exports.withMocks = withMocks;
const server_1 = require("./linear/server");
const server_2 = require("./jira/server");
const testConfig_1 = require("../utils/testConfig");
/**
 * MockManager class for managing mock servers
 */
class MockManager {
    constructor() {
        this.linearRunning = false;
        this.jiraRunning = false;
    }
    /**
     * Start mock servers
     */
    start(platform = "all") {
        // Skip if using real APIs
        if ((0, testConfig_1.shouldUseRealApi)()) {
            console.log("Using real APIs - mock servers not started");
            return;
        }
        if (platform === "linear" || platform === "all") {
            if (!this.linearRunning) {
                (0, server_1.startLinearMockServer)();
                this.linearRunning = true;
                console.log("Linear mock server started");
            }
        }
        if (platform === "jira" || platform === "all") {
            if (!this.jiraRunning) {
                (0, server_2.startJiraMockServer)();
                this.jiraRunning = true;
                console.log("Jira mock server started");
            }
        }
    }
    /**
     * Stop mock servers
     */
    stop(platform = "all") {
        if (platform === "linear" || platform === "all") {
            if (this.linearRunning) {
                (0, server_1.stopLinearMockServer)();
                this.linearRunning = false;
                console.log("Linear mock server stopped");
            }
        }
        if (platform === "jira" || platform === "all") {
            if (this.jiraRunning) {
                (0, server_2.stopJiraMockServer)();
                this.jiraRunning = false;
                console.log("Jira mock server stopped");
            }
        }
    }
    /**
     * Reset mock servers (clear custom handlers)
     */
    reset(platform = "all") {
        if (platform === "linear" || platform === "all") {
            if (this.linearRunning) {
                (0, server_1.resetLinearMockServer)();
            }
        }
        if (platform === "jira" || platform === "all") {
            if (this.jiraRunning) {
                (0, server_2.resetJiraMockServer)();
            }
        }
    }
    /**
     * Check if mock server is running
     */
    isRunning(platform) {
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
        return server_1.linearMockServer;
    }
    /**
     * Get the Jira mock server instance
     */
    getJiraServer() {
        return server_2.jiraMockServer;
    }
}
exports.MockManager = MockManager;
// Singleton instance
exports.mockManager = new MockManager();
// Convenience functions
function startMockServers(platform = "all") {
    exports.mockManager.start(platform);
}
function stopMockServers(platform = "all") {
    exports.mockManager.stop(platform);
}
function resetMockServers(platform = "all") {
    exports.mockManager.reset(platform);
}
/**
 * Setup mock servers for Mocha tests
 * Use with before() and after() hooks
 */
function setupMockServerHooks(platform = "all") {
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
function withMocks(platform = "all") {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            startMockServers(platform);
            try {
                return await originalMethod.apply(this, args);
            }
            finally {
                stopMockServers(platform);
            }
        };
        return descriptor;
    };
}
exports.default = {
    MockManager,
    mockManager: exports.mockManager,
    startMockServers,
    stopMockServers,
    resetMockServers,
    setupMockServerHooks,
    withMocks,
};
//# sourceMappingURL=mockManager.js.map