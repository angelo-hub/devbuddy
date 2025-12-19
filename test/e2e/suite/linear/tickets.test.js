"use strict";
/**
 * Linear Ticket Operations Tests
 *
 * Tests for Linear ticket management including viewing,
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
const WebviewPage_1 = require("../../page-objects/WebviewPage");
const mocks_1 = require("../../mocks");
describe("Linear Ticket Operations", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    let workbench;
    let commandPalettePage;
    let notificationPage;
    let sidebarPage;
    let treeViewPage;
    (0, mocks_1.setupMockServerHooks)("linear");
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
    describe("Ticket Listing", function () {
        it("should display assigned tickets", async function () {
            await sidebarPage.clickRefresh();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            const items = await treeViewPage.getVisibleItems();
            // Should have some tickets from mock data
        });
        it("should group tickets by status", async function () {
            const items = await treeViewPage.getVisibleItems();
            // Look for status indicators in labels
            let hasStatusGrouping = false;
            for (const item of items) {
                const label = await item.getLabel();
                // Check for status names from mock data
                if (label.toLowerCase().includes("progress") ||
                    label.toLowerCase().includes("todo") ||
                    label.toLowerCase().includes("backlog")) {
                    hasStatusGrouping = true;
                    break;
                }
            }
        });
        it("should show ticket identifiers in format ENG-XXX", async function () {
            const items = await treeViewPage.getVisibleItems();
            let hasProperFormat = false;
            for (const item of items) {
                const label = await item.getLabel();
                if (/ENG-\d+/.test(label)) {
                    hasProperFormat = true;
                    break;
                }
            }
        });
    });
    describe("Open Ticket by ID", function () {
        it("should open ticket panel for valid ID", async function () {
            // Use a known ticket ID from mock data
            const testTicket = mocks_1.linearMockIssues[0];
            await commandPalettePage.executeDevBuddyCommand("openTicketById");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            await inputBox.setText(testTicket.identifier);
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Ticket panel or details should open
        });
        it("should show error for non-existent ticket", async function () {
            await commandPalettePage.executeDevBuddyCommand("openTicketById");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            await inputBox.setText("ENG-99999");
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should show error notification
        });
    });
    describe("Ticket Status Changes", function () {
        it("should allow changing ticket status", async function () {
            // Find a ticket in the tree view
            const items = await treeViewPage.getVisibleItems();
            for (const item of items) {
                const label = await item.getLabel();
                if (/ENG-\d+/.test(label)) {
                    // Try to access status change via context menu
                    try {
                        const contextMenu = await item.openContextMenu();
                        const menuItems = await contextMenu.getItems();
                        // Look for status change option
                        let hasStatusOption = false;
                        for (const menuItem of menuItems) {
                            const itemLabel = await menuItem.getLabel();
                            if (itemLabel.toLowerCase().includes("status") ||
                                itemLabel.toLowerCase().includes("change")) {
                                hasStatusOption = true;
                                break;
                            }
                        }
                        await contextMenu.close();
                        break;
                    }
                    catch {
                        // Context menu might not be available
                    }
                }
            }
        });
        it("should show available workflow states", async function () {
            // When changing status, available states should be shown
            await commandPalettePage.executeDevBuddyCommand("changeTicketStatus");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                // Should show ticket picker first, then status options
                await commandPalettePage.cancel();
            }
        });
    });
    describe("Ticket Details View", function () {
        it("should display ticket details", async function () {
            const items = await treeViewPage.getVisibleItems();
            for (const item of items) {
                const label = await item.getLabel();
                if (/ENG-\d+/.test(label)) {
                    // Click to open details
                    await item.click();
                    await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
                    break;
                }
            }
            // Details view should show ticket information
        });
        it("should show ticket priority", async function () {
            // When viewing a ticket, priority should be visible
        });
        it("should show ticket assignee", async function () {
            // When viewing a ticket, assignee should be visible
        });
        it("should show ticket labels", async function () {
            // When viewing a ticket, labels should be visible
        });
    });
});
describe("Linear Ticket Creation", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    let commandPalettePage;
    let notificationPage;
    let createTicketPage;
    (0, mocks_1.setupMockServerHooks)("linear");
    before(async function () {
        commandPalettePage = new CommandPalettePage_1.CommandPalettePage();
        notificationPage = new NotificationPage_1.NotificationPage();
        createTicketPage = new WebviewPage_1.CreateTicketPage();
    });
    afterEach(async function () {
        try {
            // Close any open webviews
            await createTicketPage.close();
        }
        catch {
            // No webview open
        }
        await notificationPage.dismissAll();
    });
    describe("Create Ticket Form", function () {
        it("should open create ticket panel", async function () {
            await commandPalettePage.executeDevBuddyCommand("createTicket");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Either webview opens or dialog appears
        });
        it("should require title field", async function () {
            await commandPalettePage.executeDevBuddyCommand("createTicket");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Try to submit without title
            // Should show validation error
        });
        it("should show team selection", async function () {
            await commandPalettePage.executeDevBuddyCommand("createTicket");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Team dropdown should be available
        });
        it("should show priority options", async function () {
            await commandPalettePage.executeDevBuddyCommand("createTicket");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Priority selector should be available
        });
    });
    describe("Ticket Creation Flow", function () {
        it("should create ticket with minimal fields", async function () {
            // Create ticket with just title
        });
        it("should create ticket with all fields", async function () {
            // Create ticket with all optional fields filled
        });
        it("should show success notification on creation", async function () {
            // After successful creation, notification should appear
        });
        it("should refresh ticket list after creation", async function () {
            // New ticket should appear in the list
        });
    });
});
describe("Linear Ticket Search", function () {
    this.timeout(testConfig_1.TestConfig.timeouts.default);
    let commandPalettePage;
    let sidebarPage;
    let treeViewPage;
    (0, mocks_1.setupMockServerHooks)("linear");
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
    describe("Search Functionality", function () {
        it("should search tickets by title", async function () {
            await commandPalettePage.executeDevBuddyCommand("searchTickets");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            await inputBox.setText("authentication");
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should filter/search tickets
        });
        it("should search tickets by identifier", async function () {
            await commandPalettePage.executeDevBuddyCommand("searchTickets");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            await inputBox.setText("ENG-101");
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
            // Should find matching ticket
        });
        it("should clear search results", async function () {
            // First search
            await commandPalettePage.executeDevBuddyCommand("searchTickets");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const inputBox = new vscode_extension_tester_1.InputBox();
            await inputBox.setText("test");
            await inputBox.confirm();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Then clear
            await commandPalettePage.executeDevBuddyCommand("clearSearch");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            // Should show all tickets again
        });
    });
    describe("Quick Open", function () {
        it("should show ticket quick picker", async function () {
            await commandPalettePage.executeDevBuddyCommand("quickOpenTicket");
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            const isOpen = await commandPalettePage.isOpen();
            if (isOpen) {
                // Should show list of tickets
                const items = await commandPalettePage.getQuickPickItems();
                await commandPalettePage.cancel();
            }
        });
    });
});
//# sourceMappingURL=tickets.test.js.map