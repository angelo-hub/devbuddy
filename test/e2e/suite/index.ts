/**
 * E2E Test Suite Index
 *
 * Entry point for all E2E tests. Exports test configuration
 * and provides test utilities.
 */

// Re-export test utilities
export * from "../utils/testConfig";
export * from "../utils/helpers";

// Re-export page objects
export * from "../page-objects";

// Re-export mocks
export * from "../mocks";

/**
 * Test suite configuration
 */
export const suiteConfig = {
  // Test timeouts
  defaultTimeout: 30000,
  activationTimeout: 15000,
  
  // Test categories
  categories: {
    activation: "Extension Activation",
    treeview: "TreeView - My Tickets",
    commands: "DevBuddy Commands",
    linear: "Linear Platform",
    jira: "Jira Platform",
  },
  
  // Test priorities
  priorities: {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  },
};
