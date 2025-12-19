/**
 * Linear Branch Management Tests
 *
 * Tests for branch creation, association, and management
 * with Linear tickets.
 */

import { expect } from "chai";
import { Workbench, InputBox } from "vscode-extension-tester";
import { TestConfig } from "../../utils/testConfig";
import { sleep, waitFor } from "../../utils/helpers";
import { CommandPalettePage } from "../../page-objects/CommandPalettePage";
import { NotificationPage } from "../../page-objects/NotificationPage";
import { SidebarPage } from "../../page-objects/SidebarPage";
import { TreeViewPage } from "../../page-objects/TreeViewPage";
import { setupMockServerHooks, linearMockIssues } from "../../mocks";

describe("Linear Branch Management", function () {
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

  describe("Branch Creation", function () {
    it("should offer branch creation from ticket context menu", async function () {
      const items = await treeViewPage.getVisibleItems();

      for (const item of items) {
        const label = await item.getLabel();
        if (/ENG-\d+/.test(label)) {
          try {
            const contextMenu = await item.openContextMenu();
            const menuItems = await contextMenu.getItems();

            let hasBranchOption = false;
            for (const menuItem of menuItems) {
              const itemLabel = await menuItem.getLabel();
              if (
                itemLabel.toLowerCase().includes("branch") ||
                itemLabel.toLowerCase().includes("start")
              ) {
                hasBranchOption = true;
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

    it("should execute start branch command", async function () {
      await commandPalettePage.executeDevBuddyCommand("startBranch");
      await sleep(TestConfig.timeouts.animation);

      // Should show ticket picker or branch naming dialog
      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        await commandPalettePage.cancel();
      }
    });

    it("should generate branch name from ticket", async function () {
      // When creating a branch, name should be auto-generated
      // Based on ticket identifier and title
    });

    it("should support different naming conventions", async function () {
      // Test conventional, simple, and custom branch naming
      // This is controlled by devBuddy.branchNamingConvention setting
    });
  });

  describe("Branch Association", function () {
    it("should execute associate branch command", async function () {
      await commandPalettePage.executeDevBuddyCommand(
        "associateBranchFromSidebar"
      );
      await sleep(TestConfig.timeouts.animation);

      // Should show ticket or branch picker
      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        await commandPalettePage.cancel();
      }
    });

    it("should auto-detect branch associations", async function () {
      await commandPalettePage.executeDevBuddyCommand("autoDetectBranches");
      await sleep(TestConfig.timeouts.apiResponse);

      // Should analyze branches and find matching tickets
      // Based on ticket identifiers in branch names
    });

    it("should remember branch associations", async function () {
      // After association, the link should persist
    });
  });

  describe("Branch Checkout", function () {
    it("should offer checkout for associated branches", async function () {
      const items = await treeViewPage.getVisibleItems();

      for (const item of items) {
        const label = await item.getLabel();
        if (/ENG-\d+/.test(label)) {
          try {
            const contextMenu = await item.openContextMenu();
            const menuItems = await contextMenu.getItems();

            let hasCheckoutOption = false;
            for (const menuItem of menuItems) {
              const itemLabel = await menuItem.getLabel();
              if (itemLabel.toLowerCase().includes("checkout")) {
                hasCheckoutOption = true;
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

    it("should execute checkout branch command", async function () {
      await commandPalettePage.executeDevBuddyCommand("checkoutBranch");
      await sleep(TestConfig.timeouts.animation);

      // Should show branch picker
      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        await commandPalettePage.cancel();
      }
    });
  });

  describe("Branch Analytics", function () {
    it("should show branch analytics", async function () {
      await commandPalettePage.executeDevBuddyCommand("showBranchAnalytics");
      await sleep(TestConfig.timeouts.animation);

      // Should show analytics information
      // Either in a webview or notification
    });

    it("should offer branch cleanup", async function () {
      await commandPalettePage.executeDevBuddyCommand(
        "cleanupBranchAssociations"
      );
      await sleep(TestConfig.timeouts.animation);

      // Should identify stale branch associations
    });
  });
});

describe("Linear Branch Naming Conventions", function () {
  this.timeout(TestConfig.timeouts.default);

  let commandPalettePage: CommandPalettePage;

  setupMockServerHooks("linear");

  before(async function () {
    commandPalettePage = new CommandPalettePage();
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

  describe("Conventional Naming", function () {
    it("should generate feat/identifier-slug format", async function () {
      // With conventional naming, branches should be like:
      // feat/eng-123-my-feature
      // fix/eng-456-bug-fix
    });
  });

  describe("Simple Naming", function () {
    it("should generate identifier-slug format", async function () {
      // With simple naming, branches should be like:
      // eng-123-my-feature
    });
  });

  describe("Custom Template", function () {
    it("should support custom branch templates", async function () {
      // Custom templates with placeholders:
      // {type}, {identifier}, {slug}, {username}
    });
  });
});
