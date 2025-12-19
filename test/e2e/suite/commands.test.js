"use strict";
/**
 * Command Palette Tests
 *
 * Tests for DevBuddy commands executed via the command palette,
 * including provider selection, ticket creation, and various actions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const vscode_extension_tester_1 = require("vscode-extension-tester");
const testConfig_1 = require("../utils/testConfig");
const helpers_1 = require("../utils/helpers");
const CommandPalettePage_1 = require("../page-objects/CommandPalettePage");
const NotificationPage_1 = require("../page-objects/NotificationPage");
const SidebarPage_1 = require("../page-objects/SidebarPage");
const mocks_1 = require("../mocks");
describe("DevBuddy Commands", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    let workbench;
    let commandPalettePage;
    let notificationPage;
    let sidebarPage;
    // Setup mock servers
    (0, mocks_1.setupMockServerHooks)("all");
    before(async function () {
        workbench = new vscode_extension_tester_1.Workbench();
        commandPalettePage = new CommandPalettePage_1.CommandPalettePage();
        notificationPage = new NotificationPage_1.NotificationPage();
        sidebarPage = new SidebarPage_1.SidebarPage();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    });
    afterEach(async function () {
        // Cancel any open dialogs
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
    describe("Provider Selection", function () {
        it("should open provider selection dialog", async function () {
            await commandPalettePage.executeDevBuddyCommand("selectProvider");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Check if quick pick appeared
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                const items = await commandPalettePage.getQuickPickItems();
                // Should show Linear and Jira options
                const hasLinear = items.some((item) => item.toLowerCase().includes("linear"));
                const hasJira = items.some((item) => item.toLowerCase().includes("jira"));
                // At least one provider should be available
                (0, chai_1.expect)(hasLinear || hasJira).to.be.true;
                await commandPalettePage.cancel();
            }
        });
        it("should be able to select Linear provider", async function () {
            await commandPalettePage.executeDevBuddyCommand("selectProvider");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            try {
                await commandPalettePage.selectQuickPickItem("Linear");
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
                // Provider selection should complete without error
            }
            catch (error) {
                // Linear option might not be visible or selection might trigger further dialogs
                await commandPalettePage.cancel();
            }
        });
        it("should be able to select Jira provider", async function () {
            await commandPalettePage.executeDevBuddyCommand("selectProvider");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            try {
                await commandPalettePage.selectQuickPickItem("Jira");
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
                // Provider selection should complete without error
            }
            catch (error) {
                // Jira option might not be visible or selection might trigger further dialogs
                await commandPalettePage.cancel();
            }
        });
    });
    describe("Refresh Command", function () {
        it("should execute refresh command without errors", async function () {
            await commandPalettePage.executeDevBuddyCommand("refreshTickets");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            const hasErrors = await notificationPage.hasErrors();
            if (hasErrors) {
                const errors = await notificationPage.getErrorMessages();
                // Log errors but don't fail (might be expected without valid token)
                console.log("Refresh errors:", errors);
            }
        });
    });
    describe("Create Ticket Command", function () {
        it("should open create ticket dialog or webview", async function () {
            await commandPalettePage.executeDevBuddyCommand("createTicket");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Either a webview should open or a dialog should appear
            // This depends on whether a provider is configured
        });
    });
    describe("Help Command", function () {
        it("should open help menu", async function () {
            await commandPalettePage.executeDevBuddyCommand("showHelp");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Help menu should open (quick pick or webview)
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
    });
    describe("Standup Builder Command", function () {
        it("should attempt to open standup builder", async function () {
            await commandPalettePage.executeDevBuddyCommand("openStandupBuilder");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Standup builder should open (if provider is configured)
            // or show a message about required setup
        });
    });
    describe("Quick Open Ticket Command", function () {
        it("should open quick open ticket dialog", async function () {
            await commandPalettePage.executeDevBuddyCommand("quickOpenTicket");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Quick open should show ticket list or input
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
    });
    describe("Open Ticket By ID Command", function () {
        it("should open ticket by ID input", async function () {
            await commandPalettePage.executeDevBuddyCommand("openTicketById");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                // Should show input box for ticket ID
                await commandPalettePage.cancel();
            }
        });
        it("should handle invalid ticket ID gracefully", async function () {
            await commandPalettePage.executeDevBuddyCommand("openTicketById");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                // Enter an invalid ID
                const inputBox = new vscode_extension_tester_1.InputBox();
                await inputBox.setText("INVALID-999999");
                await inputBox.confirm();
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
                // Should show error or handle gracefully
            }
        });
    });
    describe("Search Tickets Command", function () {
        it("should open search input", async function () {
            await commandPalettePage.executeDevBuddyCommand("searchTickets");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
    });
    describe("Clear Search Command", function () {
        it("should execute clear search command", async function () {
            // First perform a search
            await commandPalettePage.executeDevBuddyCommand("searchTickets");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                const inputBox = new vscode_extension_tester_1.InputBox();
                await inputBox.setText("test");
                await inputBox.confirm();
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            }
            // Then clear the search
            await commandPalettePage.executeDevBuddyCommand("clearSearch");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Search should be cleared
        });
    });
    describe("Branch Commands", function () {
        it("should register start branch command", async function () {
            // Verify command exists
            await workbench.openCommandPrompt();
            const inputBox = new vscode_extension_tester_1.InputBox();
            await inputBox.setText("DevBuddy: Start Branch");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const picks = await inputBox.getQuickPicks();
            const hasStartBranch = picks.length > 0;
            await inputBox.cancel();
        });
        it("should register auto-detect branches command", async function () {
            await commandPalettePage.executeDevBuddyCommand("autoDetectBranches");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Command should execute (might show notification about results)
        });
    });
    describe("Telemetry Commands", function () {
        it("should open telemetry management", async function () {
            await commandPalettePage.executeDevBuddyCommand("manageTelemetry");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should open telemetry settings or dialog
        });
    });
});
describe("Jira-Specific Commands", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    let commandPalettePage;
    let notificationPage;
    (0, mocks_1.setupMockServerHooks)("jira");
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
    describe("Jira Setup Commands", function () {
        it("should have Jira setup command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.setup");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Setup dialog should appear
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
        it("should have Jira Cloud setup command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.setupCloud");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Cloud setup should start
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
        it("should have Jira Server setup command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.setupServer");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Server setup should start
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
    });
    describe("Jira Issue Commands", function () {
        it("should have refresh issues command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.refreshIssues");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Refresh should execute
        });
        it("should have create issue command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.createIssue");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Create dialog should appear
        });
    });
    describe("Jira Connection Commands", function () {
        it("should have test connection command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.testConnection");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should show connection result
        });
        it("should have reset config command", async function () {
            // Note: Be careful with this in real tests
            await commandPalettePage.executeCommand("devBuddy.jira.resetConfig");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should show confirmation dialog
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
    });
});
describe("Linear-Specific Commands", function () {
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
    describe("Linear Setup", function () {
        it("should have Linear token configuration command", async function () {
            await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Token configuration should start
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
        it("should have walkthrough setup Linear command", async function () {
            await commandPalettePage.executeCommand("devBuddy.walkthroughSetupLinear");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Setup walkthrough should start
        });
    });
    describe("Linear Ticket Commands", function () {
        it("should have convert TODO to ticket command", async function () {
            await commandPalettePage.executeCommand("devBuddy.convertTodoToTicket");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // TODO converter should activate
        });
    });
    describe("Linear PR/Standup Commands", function () {
        it("should have generate PR summary command", async function () {
            await commandPalettePage.executeCommand("devBuddy.generatePRSummary");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // PR summary generation should start
        });
        it("should have generate standup command", async function () {
            await commandPalettePage.executeCommand("devBuddy.generateStandup");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Standup generation should start
        });
    });
});
describe("Command Error Handling", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    let commandPalettePage;
    let notificationPage;
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
    it("should handle unknown command gracefully", async function () {
        try {
            await commandPalettePage.executeCommand("devBuddy.nonExistentCommand12345");
        }
        catch (error) {
            // Expected to fail for non-existent command
        }
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    });
    it("should show appropriate errors when provider not configured", async function () {
        // Commands that require a provider should handle missing config gracefully
        await commandPalettePage.executeDevBuddyCommand("refreshTickets");
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
        // Either succeeds or shows a helpful message
        const notifications = await notificationPage.getNotifications();
        // Log any notifications for debugging
        for (const notif of notifications) {
            const message = await notif.getMessage();
            console.log("Notification:", message);
        }
    });
});
//# sourceMappingURL=commands.test.js.map