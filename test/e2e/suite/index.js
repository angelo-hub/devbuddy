"use strict";
/**
 * E2E Test Suite Index
 *
 * Entry point for all E2E tests. Exports test configuration
 * and provides test utilities.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.suiteConfig = void 0;
// Re-export test utilities
__exportStar(require("../utils/testConfig"), exports);
__exportStar(require("../utils/helpers"), exports);
// Re-export page objects
__exportStar(require("../page-objects"), exports);
// Re-export mocks
__exportStar(require("../mocks"), exports);
/**
 * Test suite configuration
 */
exports.suiteConfig = {
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
//# sourceMappingURL=index.js.map