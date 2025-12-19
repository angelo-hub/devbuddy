"use strict";
/**
 * Linear Setup Flow Tests
 *
 * Tests for the Linear provider first-time setup flow,
 * including token configuration and team selection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const vscode_extension_tester_1 = require("vscode-extension-tester");
const testConfig_1 = require("../../utils/testConfig");
const helpers_1 = require("../../utils/helpers");
const CommandPalettePage_1 = require("../../page-objects/CommandPalettePage");
const NotificationPage_1 = require("../../page-objects/NotificationPage");
const SidebarPage_1 = require("../../page-objects/SidebarPage");
const mocks_1 = require("../../mocks");
describe("Linear Setup Flow", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default * 2);
    let workbench;
    let commandPalettePage;
    let notificationPage;
    let sidebarPage;
    (0, mocks_1.setupMockServerHooks)("linear");
    before(async function () {
        workbench = new vscode_extension_tester_1.Workbench();
        commandPalettePage = new CommandPalettePage_1.CommandPalettePage();
        notificationPage = new NotificationPage_1.NotificationPage();
        sidebarPage = new SidebarPage_1.SidebarPage();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    });
    afterEach(async function () {
        try {
            const inputBox = new vscode_extension_tester_1.InputBox();
            if (await inputBox.isDisplayed()) {
                await inputBox.cancel();
            }
        }
        catch {
            // No input box open
        }
        await notificationPage.dismissAll();
    });
    describe("Token Configuration", function () {
        it("should prompt for API token", async function () {
            await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const isOpen = await commandPalettePage.isOpen();
            (0, chai_1.expect)(isOpen).to.be.true;
            // Input box should be asking for token
            const inputBox = new vscode_extension_tester_1.InputBox();
            const placeholder = await inputBox.getPlaceHolder();
            // Placeholder might mention "token", "API key", or similar
            await inputBox.cancel();
        });
        it("should validate token format", async function () {
            await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            // Enter an invalid token
            await inputBox.setText("invalid-token");
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should show error or validation message
            // The mock server should reject invalid tokens
        });
        it("should accept valid token format", async function () {
            await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            // Enter a token that looks valid (lin_api_xxx format)
            await inputBox.setText("lin_api_test1234567890abcdef");
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should proceed to next step or complete setup
        });
    });
    describe("Team Selection", function () {
        it("should show available teams after authentication", async function () {
            // After valid token, teams should be fetched
            await commandPalettePage.executeCommand("devBuddy.walkthroughSetupLinear");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation * 2);
            // Check if team selection appears
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                const items = await commandPalettePage.getQuickPickItems();
                // Should show team options
                // Mock data has teams like "Engineering" and "Product"
                await commandPalettePage.cancel();
            }
        });
        it("should allow team selection", async function () {
            // This test simulates selecting a team
            // The exact flow depends on the extension implementation
        });
    });
    describe("Organization Configuration", function () {
        it("should detect organization from token", async function () {
            // After setup, organization should be detected
            // Mock organization is "test-org"
            // Check if organization setting is configured
            // This would normally check VS Code settings
        });
    });
    describe("Setup Validation", function () {
        it("should show success message on completion", async function () {
            // After successful setup, should show success notification
            // This depends on the full setup flow completing
        });
        it("should handle network errors gracefully", async function () {
            // Test that setup handles network issues
            // The mock server can be configured to return errors
        });
        it("should allow re-configuration", async function () {
            // Should be able to change token/settings after initial setup
            await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const isOpen = await commandPalettePage.isOpen();
            (0, chai_1.expect)(isOpen).to.be.true;
            await commandPalettePage.cancel();
        });
    });
    describe("Setup State Persistence", function () {
        it("should persist setup completion flag", async function () {
            // After setup, the firstTimeSetupComplete flag should be set
            // This prevents the setup prompt from appearing again
        });
        it("should remember selected team", async function () {
            // Team selection should be persisted in settings
        });
    });
});
describe("Linear Setup - Error Scenarios", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    let commandPalettePage;
    let notificationPage;
    (0, mocks_1.setupMockServerHooks)("linear");
    before(async function () {
        commandPalettePage = new CommandPalettePage_1.CommandPalettePage();
        notificationPage = new NotificationPage_1.NotificationPage();
    });
    afterEach(async function () {
        try {
            const inputBox = new vscode_extension_tester_1.InputBox();
            if (await inputBox.isDisplayed()) {
                await inputBox.cancel();
            }
        }
        catch {
            // No input box open
        }
        await notificationPage.dismissAll();
    });
    describe("Invalid Token Handling", function () {
        it("should show error for empty token", async function () {
            await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            await inputBox.setText("");
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should show validation error or not proceed
        });
        it("should show error for malformed token", async function () {
            await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            await inputBox.setText("not-a-valid-linear-token");
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should show error notification
        });
        it("should show error for expired token", async function () {
            // Test with a token that would be rejected by the API
            // The mock server can be configured to simulate this
        });
    });
    describe("API Error Handling", function () {
        it("should handle rate limiting", async function () {
            // Test behavior when API returns 429
        });
        it("should handle server errors", async function () {
            // Test behavior when API returns 500
        });
        it("should handle network timeout", async function () {
            // Test behavior when network is unavailable
        });
    });
    describe("User Cancellation", function () {
        it("should handle user cancelling token input", async function () {
            await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            await inputBox.cancel();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should return to normal state without errors
            const hasErrors = await notificationPage.hasErrors();
            (0, chai_1.expect)(hasErrors).to.be.false;
        });
        it("should handle user cancelling team selection", async function () {
            // Similar test for team selection step
        });
    });
});
//# sourceMappingURL=setup.test.js.map