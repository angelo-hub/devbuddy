/**
 * E2E Test Configuration
 *
 * Central configuration for all E2E tests including timeouts, mock server ports,
 * and test environment settings.
 */

export const TestConfig = {
  // Timeouts (in milliseconds)
  timeouts: {
    default: 30000,
    activation: 15000,
    ui: 10000,
    apiResponse: 5000,
    animation: 500,
  },

  // Mock server configuration
  mockServer: {
    linearPort: 4001,
    jiraPort: 4002,
    host: "localhost",
  },

  // Test data identifiers
  testData: {
    linear: {
      teamId: "test-team-id",
      projectId: "test-project-id",
      userId: "test-user-id",
      orgSlug: "test-org",
    },
    jira: {
      projectKey: "TEST",
      siteUrl: "test.atlassian.net",
      email: "test@example.com",
    },
  },

  // Extension identifiers
  extension: {
    id: "angelogirardi.dev-buddy",
    displayName: "DevBuddy - Linear & Jira Workflow Manager",
    viewId: "myTickets",
    viewContainerId: "dev-buddy",
  },

  // Command prefixes
  commands: {
    prefix: "devBuddy",
    jiraPrefix: "devBuddy.jira",
  },

  // Environment flags
  env: {
    useRealApi: process.env.DEVBUDDY_TEST_REAL_API === "true",
    debugMode: process.env.DEVBUDDY_TEST_DEBUG === "true",
    linearToken: process.env.DEVBUDDY_TEST_LINEAR_TOKEN,
    jiraToken: process.env.DEVBUDDY_TEST_JIRA_TOKEN,
  },
};

/**
 * Get mock server URL for a specific platform
 */
export function getMockServerUrl(
  platform: "linear" | "jira"
): string {
  const { host } = TestConfig.mockServer;
  const port =
    platform === "linear"
      ? TestConfig.mockServer.linearPort
      : TestConfig.mockServer.jiraPort;
  return `http://${host}:${port}`;
}

/**
 * Check if tests should use real APIs
 */
export function shouldUseRealApi(): boolean {
  return TestConfig.env.useRealApi;
}

export default TestConfig;
