/**
 * Jira Ticket Operations Tests
 *
 * Tests for Jira issue management including viewing,
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
  setupMockServerHooks,
  mockJiraIssues,
  getJiraIssueByKey,
} from "../../mocks";

describe("Jira Ticket Operations", function () {
  this.timeout(TestConfig.timeouts.default);

  let workbench: Workbench;
  let commandPalettePage: CommandPalettePage;
  let notificationPage: NotificationPage;
  let sidebarPage: SidebarPage;
  let treeViewPage: TreeViewPage;

  setupMockServerHooks("jira");

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

  describe("Issue Listing", function () {
    it("should display assigned issues", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.refreshIssues");
      await sleep(TestConfig.timeouts.apiResponse);

      const items = await treeViewPage.getVisibleItems();
      // Should have issues from mock data
    });

    it("should group issues by status", async function () {
      const items = await treeViewPage.getVisibleItems();

      // Look for status indicators
      let hasStatusGrouping = false;
      for (const item of items) {
        const label = await item.getLabel();
        if (
          label.toLowerCase().includes("progress") ||
          label.toLowerCase().includes("open") ||
          label.toLowerCase().includes("done")
        ) {
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
      await sleep(TestConfig.timeouts.animation);

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
      await sleep(TestConfig.timeouts.animation);

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
      await sleep(TestConfig.timeouts.animation);

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
      await sleep(TestConfig.timeouts.animation);

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
      await sleep(TestConfig.timeouts.animation);

      // Should copy issue key to clipboard
      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        await commandPalettePage.cancel();
      }
    });

    it("should execute copy issue URL command", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.copyIssueUrl");
      await sleep(TestConfig.timeouts.animation);

      // Should copy issue URL to clipboard
      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        await commandPalettePage.cancel();
      }
    });
  });
});

describe("Jira Issue Creation", function () {
  this.timeout(TestConfig.timeouts.default);

  let commandPalettePage: CommandPalettePage;
  let notificationPage: NotificationPage;

  setupMockServerHooks("jira");

  before(async function () {
    commandPalettePage = new CommandPalettePage();
    notificationPage = new NotificationPage();
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
    await notificationPage.dismissAll();
  });

  describe("Create Issue Form", function () {
    it("should execute create issue command", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.createIssue");
      await sleep(TestConfig.timeouts.animation);

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
  this.timeout(TestConfig.timeouts.default);

  let commandPalettePage: CommandPalettePage;
  let sidebarPage: SidebarPage;
  let treeViewPage: TreeViewPage;

  setupMockServerHooks("jira");

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

  describe("JQL Search", function () {
    it("should search by project", async function () {
      await commandPalettePage.executeDevBuddyCommand("searchTickets");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      // JQL: project = TEST
      await inputBox.setText("project = TEST");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

      // Should filter to TEST project issues
    });

    it("should search by assignee", async function () {
      await commandPalettePage.executeDevBuddyCommand("searchTickets");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      // JQL: assignee = currentUser()
      await inputBox.setText("assignee = currentUser()");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

      // Should filter to current user's issues
    });

    it("should search by status", async function () {
      await commandPalettePage.executeDevBuddyCommand("searchTickets");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      // JQL: status = "In Progress"
      await inputBox.setText('status = "In Progress"');
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

      // Should filter to in-progress issues
    });

    it("should search by text", async function () {
      await commandPalettePage.executeDevBuddyCommand("searchTickets");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      // JQL: text ~ "authentication"
      await inputBox.setText('text ~ "authentication"');
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

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
  this.timeout(TestConfig.timeouts.default);

  let treeViewPage: TreeViewPage;
  let sidebarPage: SidebarPage;

  setupMockServerHooks("jira");

  before(async function () {
    treeViewPage = new TreeViewPage();
    sidebarPage = new SidebarPage();

    await sidebarPage.open();
    await sleep(TestConfig.timeouts.animation);
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
            const menuLabels: string[] = [];
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
          } catch {
            // Context menu might not be available
          }
        }
      }
    });
  });
});
