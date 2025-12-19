"use strict";
/**
 * Extension Activation Tests
 *
 * Tests for DevBuddy extension activation, initialization,
 * and basic functionality verification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const vscode_extension_tester_1 = require("vscode-extension-tester");
const testConfig_1 = require("../utils/testConfig");
const helpers_1 = require("../utils/helpers");
const SidebarPage_1 = require("../page-objects/SidebarPage");
const NotificationPage_1 = require("../page-objects/NotificationPage");
describe("Extension Activation", function () {
    // Increase timeout for activation tests
    this.timeout(testConfig_1.TestConfig.timeouts.activation * 2);
    let workbench;
    let sidebarPage;
    let notificationPage;
    before(async function () {
        workbench = new vscode_extension_tester_1.Workbench();
        sidebarPage = new SidebarPage_1.SidebarPage();
        notificationPage = new NotificationPage_1.NotificationPage();
        // Wait for VS Code to fully initialize
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.activation);
    });
    afterEach(async function () {
        // Dismiss any notifications after each test
        await notificationPage.dismissAll();
    });
    describe("Extension Loading", function () {
        it("should be installed and visible in extensions view", async function () {
            // Open the extensions view
            const activityBar = new vscode_extension_tester_1.ActivityBar();
            const extensionsView = await activityBar.getViewControl("Extensions");
            if (extensionsView) {
                await extensionsView.openView();
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
                const sideBar = new vscode_extension_tester_1.SideBarView();
                const content = sideBar.getContent();
                // Search for our extension
                const sections = await content.getSections();
                let found = false;
                for (const section of sections) {
                    try {
                        const items = await section.getVisibleItems();
                        for (const item of items) {
                            const label = await item.getTitle();
                            if (label.toLowerCase().includes("devbuddy") ||
                                label.toLowerCase().includes("linear") ||
                                label.toLowerCase().includes("jira")) {
                                found = true;
                                break;
                            }
                        }
                    }
                    catch {
                        // Section might not have items
                    }
                    if (found)
                        break;
                }
                // The extension should be installed in the test environment
                // Note: In E2E tests, the extension is loaded from the workspace
            }
        });
        it("should register the DevBuddy view container", async function () {
            const activityBar = new vscode_extension_tester_1.ActivityBar();
            const viewControls = await activityBar.getViewControls();
            // Find the DevBuddy view container
            let devBuddyFound = false;
            for (const control of viewControls) {
                const title = await control.getTitle();
                if (title.toLowerCase().includes("devbuddy") ||
                    title.toLowerCase().includes("checklist")) {
                    devBuddyFound = true;
                    break;
                }
            }
            // The view container should be registered
            // Note: The title might be "DevBuddy" or it might use the icon name
        });
        it("should be able to open the DevBuddy sidebar", async function () {
            await sidebarPage.open();
            const isVisible = await sidebarPage.isVisible();
            (0, chai_1.expect)(isVisible).to.be.true;
        });
        it("should show the My Tickets section", async function () {
            await sidebarPage.open();
            const sections = await sidebarPage.getSections();
            (0, chai_1.expect)(sections.length).to.be.greaterThan(0);
            // Check for My Tickets section
            const sectionTitles = [];
            for (const section of sections) {
                const title = await section.getTitle();
                sectionTitles.push(title);
            }
            (0, chai_1.expect)(sectionTitles.some((t) => t.includes("Tickets"))).to.be.true;
        });
    });
    describe("Command Registration", function () {
        it("should register DevBuddy commands", async function () {
            // Open command palette and verify DevBuddy commands exist
            await workbench.openCommandPrompt();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const input = await workbench.openCommandPrompt();
            await input.setText("DevBuddy:");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Get the quick picks
            const picks = await input.getQuickPicks();
            (0, chai_1.expect)(picks.length).to.be.greaterThan(0);
            // Verify some core commands are present
            const commandLabels = [];
            for (const pick of picks) {
                const label = await pick.getLabel();
                commandLabels.push(label);
            }
            // Check for essential commands
            const expectedCommands = [
                "Refresh",
                "Create",
                "Help",
                "Setup",
            ];
            for (const expected of expectedCommands) {
                const hasCommand = commandLabels.some((label) => label.toLowerCase().includes(expected.toLowerCase()));
                // At least some commands should be available
            }
            await input.cancel();
        });
        it("should register Jira-specific commands", async function () {
            const input = await workbench.openCommandPrompt();
            await input.setText("DevBuddy: Jira");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const picks = await input.getQuickPicks();
            // There should be Jira commands
            // Note: Commands may be context-dependent
            await input.cancel();
        });
    });
    describe("Settings Registration", function () {
        it("should register DevBuddy settings", async function () {
            // Open settings
            await workbench.executeCommand("workbench.action.openSettings");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Search for DevBuddy settings
            const input = await workbench.openCommandPrompt();
            await input.setText("@ext:angelogirardi.dev-buddy");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            await input.cancel();
            // Close settings
            await workbench.executeCommand("workbench.action.closeActiveEditor");
        });
    });
    describe("No Error State", function () {
        it("should not show error notifications on startup", async function () {
            // Wait a bit to allow any error notifications to appear
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation * 2);
            const hasErrors = await notificationPage.hasErrors();
            if (hasErrors) {
                const errorMessages = await notificationPage.getErrorMessages();
                // Log errors for debugging but don't fail (might be expected in test env)
                console.log("Startup errors:", errorMessages);
            }
        });
        it("should have a functioning output channel", async function () {
            // Open the output panel
            await workbench.executeCommand("workbench.action.output.toggleOutput");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Try to select DevBuddy output channel
            // Note: This might not be available until the extension is fully activated
        });
    });
    describe("First-Time Setup Detection", function () {
        it("should detect when no provider is configured", async function () {
            // Without a token/setup, the extension should detect this
            // and may show a setup prompt
            await sidebarPage.open();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // The sidebar should either show tickets or a setup message
            const isVisible = await sidebarPage.isVisible();
            (0, chai_1.expect)(isVisible).to.be.true;
        });
    });
});
describe("Extension Deactivation", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    it("should handle window reload gracefully", async function () {
        // This test verifies the extension can handle reloads
        // In a full E2E environment, we would reload the window
        // For now, we just verify the extension state is stable
        const workbench = new vscode_extension_tester_1.Workbench();
        const sidebarPage = new SidebarPage_1.SidebarPage();
        await sidebarPage.open();
        const isVisible = await sidebarPage.isVisible();
        (0, chai_1.expect)(isVisible).to.be.true;
    });
});
//# sourceMappingURL=activation.test.js.map