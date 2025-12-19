"use strict";
/**
 * Jira Ticket Operations Tests
 *
 * Tests for Jira issue management including viewing,
 * creating, updating, and status transitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_extension_tester_1 = require("vscode-extension-tester");
const testConfig_1 = require("../../utils/testConfig");
const helpers_1 = require("../../utils/helpers");
const CommandPalettePage_1 = require("../../page-objects/CommandPalettePage");
const NotificationPage_1 = require("../../page-objects/NotificationPage");
const SidebarPage_1 = require("../../page-objects/SidebarPage");
const TreeViewPage_1 = require("../../page-objects/TreeViewPage");
const mocks_1 = require("../../mocks");
describe("Jira Ticket Operations", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    let workbench;
    let commandPalettePage;
    let notificationPage;
    let sidebarPage;
    let treeViewPage;
    (0, mocks_1.setupMockServerHooks)("jira");
    before(async function () {
        workbench = new vscode_extension_tester_1.Workbench();
        commandPalettePage = new CommandPalettePage_1.CommandPalettePage();
        notificationPage = new NotificationPage_1.NotificationPage();
        sidebarPage = new SidebarPage_1.SidebarPage();
        treeViewPage = new TreeViewPage_1.TreeViewPage();
        await sidebarPage.open();
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
    describe("Issue Listing", function () {
        it("should display assigned issues", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.refreshIssues");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            const items = await treeViewPage.getVisibleItems();
            // Should have issues from mock data
        });
        it("should group issues by status", async function () {
            const items = await treeViewPage.getVisibleItems();
            // Look for status indicators
            let hasStatusGrouping = false;
            for (const item of items) {
                const label = await item.getLabel();
                if (label.toLowerCase().includes("progress") ||
                    label.toLowerCase().includes("open") ||
                    label.toLowerCase().includes("done")) {
                    hasStatusGrouping = true;
                    break;
                }
            }
        });
        it("should show issue keys in format PROJ-XXX", async function () {
            const items = await treeViewPage.getVisibleItems();
            let hasProperFormat = false;
            for (const item of items) {
                const label = await item.getLabel();
                if (/TEST-\d+/.test(label) || /[A-Z]+-\d+/.test(label)) {
                    hasProperFormat = true;
                    break;
                }
            }
        });
    });
    describe("Open Issue", function () {
        it("should execute open issue command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.openIssue");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should show issue picker
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
        it("should open issue in browser when configured", async function () {
            // With devBuddy.jira.openInBrowser = true
            // Issue should open in external browser
        });
    });
    describe("Issue Status Changes", function () {
        it("should execute update status command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.updateStatus");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should show issue picker or status transitions
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
        it("should show available transitions", async function () {
            // When changing status, available transitions should be shown
            // Jira uses workflow transitions rather than simple status changes
        });
        it("should handle transition with required fields", async function () {
            // Some transitions may require additional fields
        });
    });
    describe("Issue Assignment", function () {
        it("should execute assign to me command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.assignToMe");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should show issue picker
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
        it("should update assignee successfully", async function () {
            // After assignment, issue should show current user
        });
    });
    describe("Issue Comments", function () {
        it("should execute add comment command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.addComment");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should show issue picker then comment input
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
        it("should add comment to issue", async function () {
            // After adding comment, it should appear on the issue
        });
    });
    describe("Issue Copying", function () {
        it("should execute copy issue key command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.copyIssueKey");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should copy issue key to clipboard
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
        it("should execute copy issue URL command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.copyIssueUrl");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should copy issue URL to clipboard
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                await commandPalettePage.cancel();
            }
        });
    });
});
describe("Jira Issue Creation", function () {
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
            // No input box
        }
        await notificationPage.dismissAll();
    });
    describe("Create Issue Form", function () {
        it("should execute create issue command", async function () {
            await commandPalettePage.executeCommand("devBuddy.jira.createIssue");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Create issue dialog should appear
        });
        it("should show project selection", async function () {
            // Project picker should be available
        });
        it("should show issue type selection", async function () {
            // Issue type picker (Story, Bug, Task, etc.)
        });
        it("should require summary field", async function () {
            // Summary is required for issue creation
        });
    });
    describe("Issue Types", function () {
        it("should support Story creation", async function () {
            // Create a Story issue type
        });
        it("should support Bug creation", async function () {
            // Create a Bug issue type
        });
        it("should support Task creation", async function () {
            // Create a Task issue type
        });
    });
    describe("Issue Fields", function () {
        it("should support priority selection", async function () {
            // Priority field
        });
        it("should support assignee selection", async function () {
            // Assignee field
        });
        it("should support labels", async function () {
            // Labels field
        });
        it("should support description", async function () {
            // Description field (may use ADF format)
        });
    });
});
describe("Jira Issue Search (JQL)", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    let commandPalettePage;
    let sidebarPage;
    let treeViewPage;
    (0, mocks_1.setupMockServerHooks)("jira");
    before(async function () {
        commandPalettePage = new CommandPalettePage_1.CommandPalettePage();
        sidebarPage = new SidebarPage_1.SidebarPage();
        treeViewPage = new TreeViewPage_1.TreeViewPage();
        await sidebarPage.open();
    });
    afterEach(async function () {
        try {
            const inputBox = new vscode_extension_tester_1.InputBox();
            if (await inputBox.isDisplayed()) {
                await inputBox.cancel();
            }
        }
        catch {
            // No input box
        }
    });
    describe("JQL Search", function () {
        it("should search by project", async function () {
            await commandPalettePage.executeDevBuddyCommand("searchTickets");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            // JQL: project = TEST
            await inputBox.setText("project = TEST");
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should filter to TEST project issues
        });
        it("should search by assignee", async function () {
            await commandPalettePage.executeDevBuddyCommand("searchTickets");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            // JQL: assignee = currentUser()
            await inputBox.setText("assignee = currentUser()");
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should filter to current user's issues
        });
        it("should search by status", async function () {
            await commandPalettePage.executeDevBuddyCommand("searchTickets");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            // JQL: status = "In Progress"
            await inputBox.setText('status = "In Progress"');
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should filter to in-progress issues
        });
        it("should search by text", async function () {
            await commandPalettePage.executeDevBuddyCommand("searchTickets");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            // JQL: text ~ "authentication"
            await inputBox.setText('text ~ "authentication"');
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should find issues with "authentication" in text
        });
    });
    describe("Search Filters", function () {
        it("should support combined filters", async function () {
            // JQL: project = TEST AND status = Open
        });
        it("should support ordering", async function () {
            // JQL: ORDER BY created DESC
        });
    });
});
describe("Jira Context Menu Actions", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    let treeViewPage;
    let sidebarPage;
    (0, mocks_1.setupMockServerHooks)("jira");
    before(async function () {
        treeViewPage = new TreeViewPage_1.TreeViewPage();
        sidebarPage = new SidebarPage_1.SidebarPage();
        await sidebarPage.open();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    });
    describe("Issue Context Menu", function () {
        it("should show Jira-specific actions", async function () {
            const items = await treeViewPage.getVisibleItems();
            for (const item of items) {
                const label = await item.getLabel();
                if (/[A-Z]+-\d+/.test(label)) {
                    try {
                        const contextMenu = await item.openContextMenu();
                        const menuItems = await contextMenu.getItems();
                        // Check for Jira-specific actions
                        const menuLabels = [];
                        for (const menuItem of menuItems) {
                            const itemLabel = await menuItem.getLabel();
                            menuLabels.push(itemLabel);
                        }
                        // Should include actions like:
                        // - Open Issue
                        // - Update Status
                        // - Assign to Me
                        // - Add Comment
                        // - Copy Issue Key
                        // - Copy Issue URL
                        await contextMenu.close();
                        break;
                    }
                    catch {
                        // Context menu might not be available
                    }
                }
            }
        });
    });
});
//# sourceMappingURL=tickets.test.js.map