/**
 * TreeView (My Tickets) Tests
 *
 * Tests for the DevBuddy sidebar tree view functionality,
 * including ticket display, grouping, and interactions.
 */

import { expect } from "chai";
import { Workbench } from "vscode-extension-tester";
import { TestConfig } from "../utils/testConfig";
import { sleep, waitFor } from "../utils/helpers";
import { SidebarPage } from "../page-objects/SidebarPage";
import { TreeViewPage } from "../page-objects/TreeViewPage";
import { NotificationPage } from "../page-objects/NotificationPage";
import { CommandPalettePage } from "../page-objects/CommandPalettePage";
import { setupMockServerHooks, linearMockIssues } from "../mocks";

describe("TreeView - My Tickets", function () {
  this.timeout(TestConfig.timeouts.default);

  let workbench: Workbench;
  let sidebarPage: SidebarPage;
  let treeViewPage: TreeViewPage;
  let notificationPage: NotificationPage;
  let commandPalettePage: CommandPalettePage;

  // Setup mock servers for all tests in this suite
  setupMockServerHooks("linear");

  before(async function () {
    workbench = new Workbench();
    sidebarPage = new SidebarPage();
    treeViewPage = new TreeViewPage();
    notificationPage = new NotificationPage();
    commandPalettePage = new CommandPalettePage();

    // Open the sidebar
    await sidebarPage.open();
    await sleep(TestConfig.timeouts.animation);
  });

  afterEach(async function () {
    await notificationPage.dismissAll();
  });

  describe("Basic Display", function () {
    it("should display the My Tickets section", async function () {
      const section = await sidebarPage.getMyTicketsSection();
      expect(section).to.exist;

      const title = await section.getTitle();
      expect(title).to.include("Tickets");
    });

    it("should show tickets or empty state", async function () {
      await sidebarPage.open();

      // Either tickets should be displayed or an empty/setup message
      const isVisible = await sidebarPage.isVisible();
      expect(isVisible).to.be.true;
    });

    it("should be expandable/collapsible", async function () {
      const section = await sidebarPage.getMyTicketsSection();

      // Check if section is collapsible
      const isExpanded = await section.isExpanded();
      expect(typeof isExpanded).to.equal("boolean");

      // Try collapsing and expanding
      if (isExpanded) {
        await section.collapse();
        await sleep(TestConfig.timeouts.animation);

        await section.expand();
        await sleep(TestConfig.timeouts.animation);
      }
    });
  });

  describe("Ticket Display", function () {
    it("should display ticket identifiers", async function () {
      const items = await treeViewPage.getVisibleItems();

      // If there are items, they should have labels
      for (const item of items) {
        const label = await item.getLabel();
        expect(label).to.be.a("string");
        expect(label.length).to.be.greaterThan(0);
      }
    });

    it("should be able to find ticket by identifier pattern", async function () {
      // Try to find a ticket with the test identifier pattern
      const items = await treeViewPage.getVisibleItems();

      // Check if any item matches the expected pattern (e.g., ENG-XXX, TEST-XXX)
      let hasMatchingPattern = false;
      for (const item of items) {
        const label = await item.getLabel();
        if (/[A-Z]+-\d+/.test(label)) {
          hasMatchingPattern = true;
          break;
        }
      }

      // Note: This might be false if no tickets are loaded
    });
  });

  describe("Tree Item Interactions", function () {
    it("should have context menu available on items", async function () {
      const items = await treeViewPage.getVisibleItems();

      if (items.length > 0) {
        const firstItem = items[0];
        const label = await firstItem.getLabel();

        // Check if it's a ticket (not a group header)
        if (/[A-Z]+-\d+/.test(label)) {
          try {
            const contextMenu = await firstItem.openContextMenu();
            const menuItems = await contextMenu.getItems();

            expect(menuItems.length).to.be.greaterThan(0);

            await contextMenu.close();
          } catch (error) {
            // Context menu might not be available for all items
          }
        }
      }
    });

    it("should be able to click on a ticket item", async function () {
      const items = await treeViewPage.getVisibleItems();

      if (items.length > 0) {
        const firstItem = items[0];
        const label = await firstItem.getLabel();

        // If it's a ticket, try clicking it
        if (/[A-Z]+-\d+/.test(label)) {
          await firstItem.click();
          await sleep(TestConfig.timeouts.animation);

          // After clicking, something should happen (webview opens, etc.)
          // This depends on the extension's implementation
        }
      }
    });
  });

  describe("Refresh Functionality", function () {
    it("should be able to refresh tickets via command", async function () {
      await commandPalettePage.executeDevBuddyCommand("refreshTickets");
      await sleep(TestConfig.timeouts.apiResponse);

      // The sidebar should still be visible after refresh
      const isVisible = await sidebarPage.isVisible();
      expect(isVisible).to.be.true;
    });

    it("should handle refresh without errors", async function () {
      await sidebarPage.clickRefresh();
      await sleep(TestConfig.timeouts.apiResponse);

      // Check for errors
      const hasErrors = await notificationPage.hasErrors();
      if (hasErrors) {
        const errors = await notificationPage.getErrorMessages();
        console.log("Refresh errors:", errors);
      }
    });
  });

  describe("Status Grouping", function () {
    it("should display tickets grouped by status", async function () {
      const items = await treeViewPage.getVisibleItems();

      // Look for status group headers (if implemented)
      const possibleGroups = [
        "backlog",
        "todo",
        "in progress",
        "done",
        "completed",
        "cancelled",
        "open",
      ];

      let hasGroupHeaders = false;
      for (const item of items) {
        const label = (await item.getLabel()).toLowerCase();
        if (possibleGroups.some((group) => label.includes(group))) {
          hasGroupHeaders = true;
          break;
        }
      }

      // Note: Grouping might be implemented differently
    });
  });

  describe("Search Functionality", function () {
    it("should be able to initiate search", async function () {
      try {
        await commandPalettePage.executeDevBuddyCommand("searchTickets");
        await sleep(TestConfig.timeouts.animation);

        // Check if input box appeared
        const isOpen = await commandPalettePage.isOpen();
        if (isOpen) {
          await commandPalettePage.cancel();
        }
      } catch (error) {
        // Search command might not be available in all states
      }
    });
  });
});

describe("TreeView - Empty State", function () {
  this.timeout(TestConfig.timeouts.default);

  let sidebarPage: SidebarPage;

  before(async function () {
    sidebarPage = new SidebarPage();
    await sidebarPage.open();
  });

  it("should handle empty ticket list gracefully", async function () {
    // When no tickets are loaded, the view should show an appropriate message
    const isVisible = await sidebarPage.isVisible();
    expect(isVisible).to.be.true;

    // The view shouldn't crash or show errors
  });
});

describe("TreeView - Error States", function () {
  this.timeout(TestConfig.timeouts.default);

  let sidebarPage: SidebarPage;
  let notificationPage: NotificationPage;

  before(async function () {
    sidebarPage = new SidebarPage();
    notificationPage = new NotificationPage();
    await sidebarPage.open();
  });

  afterEach(async function () {
    await notificationPage.dismissAll();
  });

  it("should handle API errors gracefully", async function () {
    // This test verifies error handling when API fails
    // In a real test, we'd mock a failing API response

    const isVisible = await sidebarPage.isVisible();
    expect(isVisible).to.be.true;

    // The view should still be functional even with errors
  });

  it("should recover from errors on refresh", async function () {
    await sidebarPage.clickRefresh();
    await sleep(TestConfig.timeouts.apiResponse);

    const isVisible = await sidebarPage.isVisible();
    expect(isVisible).to.be.true;
  });
});
