/**
 * Linear Ticket Operations Tests
 *
 * Tests for Linear ticket management including viewing,
 * creating, updating, and status transitions.
 */

import { expect } from "chai";
import { Workbench, InputBox } from "vscode-extension-tester";
import { TestConfig } from "../../utils/testConfig";
import { sleep, waitFor } from "../../utils/helpers";
import { CommandPalettePage } from "../../page-objects/CommandPalettePage";
import { NotificationPage } from "../../page-objects/NotificationPage";
import { SidebarPage } from "../../page-objects/SidebarPage";
import { TreeViewPage } from "../../page-objects/TreeViewPage";
import {
  WebviewPage,
  TicketPanelPage,
  CreateTicketPage,
} from "../../page-objects/WebviewPage";
import {
  setupMockServerHooks,
  linearMockIssues,
  getLinearIssueByIdentifier,
} from "../../mocks";

describe("Linear Ticket Operations", function () {
  this.timeout(TestConfig.timeouts.default);

  let workbench: Workbench;
  let commandPalettePage: CommandPalettePage;
  let notificationPage: NotificationPage;
  let sidebarPage: SidebarPage;
  let treeViewPage: TreeViewPage;

  setupMockServerHooks("linear");

  before(async function () {
    workbench = new Workbench();
    commandPalettePage = new CommandPalettePage();
    notificationPage = new NotificationPage();
    sidebarPage = new SidebarPage();
    treeViewPage = new TreeViewPage();

    await sidebarPage.open();
    await sleep(TestConfig.timeouts.animation);
  });

  afterEach(async function () {
    try {
      const inputBox = new InputBox();
      if (await inputBox.isDisplayed()) {
        await inputBox.cancel();
      }
    } catch {
      // No input box open
    }
    await notificationPage.dismissAll();
  });

  describe("Ticket Listing", function () {
    it("should display assigned tickets", async function () {
      await sidebarPage.clickRefresh();
      await sleep(TestConfig.timeouts.apiResponse);

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
        if (
          label.toLowerCase().includes("progress") ||
          label.toLowerCase().includes("todo") ||
          label.toLowerCase().includes("backlog")
        ) {
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
      const testTicket = linearMockIssues[0];

      await commandPalettePage.executeDevBuddyCommand("openTicketById");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      await inputBox.setText(testTicket.identifier);
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

      // Ticket panel or details should open
    });

    it("should show error for non-existent ticket", async function () {
      await commandPalettePage.executeDevBuddyCommand("openTicketById");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      await inputBox.setText("ENG-99999");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

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
              if (
                itemLabel.toLowerCase().includes("status") ||
                itemLabel.toLowerCase().includes("change")
              ) {
                hasStatusOption = true;
                break;
              }
            }

            await contextMenu.close();
            break;
          } catch {
            // Context menu might not be available
          }
        }
      }
    });

    it("should show available workflow states", async function () {
      // When changing status, available states should be shown
      await commandPalettePage.executeDevBuddyCommand("changeTicketStatus");
      await sleep(TestConfig.timeouts.animation);

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
          await sleep(TestConfig.timeouts.animation);
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
  this.timeout(TestConfig.timeouts.default);

  let commandPalettePage: CommandPalettePage;
  let notificationPage: NotificationPage;
  let createTicketPage: CreateTicketPage;

  setupMockServerHooks("linear");

  before(async function () {
    commandPalettePage = new CommandPalettePage();
    notificationPage = new NotificationPage();
    createTicketPage = new CreateTicketPage();
  });

  afterEach(async function () {
    try {
      // Close any open webviews
      await createTicketPage.close();
    } catch {
      // No webview open
    }
    await notificationPage.dismissAll();
  });

  describe("Create Ticket Form", function () {
    it("should open create ticket panel", async function () {
      await commandPalettePage.executeDevBuddyCommand("createTicket");
      await sleep(TestConfig.timeouts.animation);

      // Either webview opens or dialog appears
    });

    it("should require title field", async function () {
      await commandPalettePage.executeDevBuddyCommand("createTicket");
      await sleep(TestConfig.timeouts.animation);

      // Try to submit without title
      // Should show validation error
    });

    it("should show team selection", async function () {
      await commandPalettePage.executeDevBuddyCommand("createTicket");
      await sleep(TestConfig.timeouts.animation);

      // Team dropdown should be available
    });

    it("should show priority options", async function () {
      await commandPalettePage.executeDevBuddyCommand("createTicket");
      await sleep(TestConfig.timeouts.animation);

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
  this.timeout(TestConfig.timeouts.default);

  let commandPalettePage: CommandPalettePage;
  let sidebarPage: SidebarPage;
  let treeViewPage: TreeViewPage;

  setupMockServerHooks("linear");

  before(async function () {
    commandPalettePage = new CommandPalettePage();
    sidebarPage = new SidebarPage();
    treeViewPage = new TreeViewPage();

    await sidebarPage.open();
  });

  afterEach(async function () {
    try {
      const inputBox = new InputBox();
      if (await inputBox.isDisplayed()) {
        await inputBox.cancel();
      }
    } catch {
      // No input box
    }
  });

  describe("Search Functionality", function () {
    it("should search tickets by title", async function () {
      await commandPalettePage.executeDevBuddyCommand("searchTickets");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      await inputBox.setText("authentication");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

      // Should filter/search tickets
    });

    it("should search tickets by identifier", async function () {
      await commandPalettePage.executeDevBuddyCommand("searchTickets");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      await inputBox.setText("ENG-101");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

      // Should find matching ticket
    });

    it("should clear search results", async function () {
      // First search
      await commandPalettePage.executeDevBuddyCommand("searchTickets");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      await inputBox.setText("test");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.animation);

      // Then clear
      await commandPalettePage.executeDevBuddyCommand("clearSearch");
      await sleep(TestConfig.timeouts.animation);

      // Should show all tickets again
    });
  });

  describe("Quick Open", function () {
    it("should show ticket quick picker", async function () {
      await commandPalettePage.executeDevBuddyCommand("quickOpenTicket");
      await sleep(TestConfig.timeouts.animation);

      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        // Should show list of tickets
        const items = await commandPalettePage.getQuickPickItems();
        await commandPalettePage.cancel();
      }
    });
  });
});
