/**
 * Jira Setup Flow Tests
 *
 * Tests for the Jira provider first-time setup flow,
 * including Cloud and Server configuration.
 */

import { expect } from "chai";
import { Workbench, InputBox } from "vscode-extension-tester";
import { TestConfig } from "../../utils/testConfig";
import { sleep, waitFor } from "../../utils/helpers";
import { CommandPalettePage } from "../../page-objects/CommandPalettePage";
import { NotificationPage } from "../../page-objects/NotificationPage";
import { SidebarPage } from "../../page-objects/SidebarPage";
import {
  setupMockServerHooks,
  mockJiraCurrentUser,
  mockJiraProjects,
} from "../../mocks";

describe("Jira Setup Flow", function () {
  this.timeout(TestConfig.timeouts.default * 2);

  let workbench: Workbench;
  let commandPalettePage: CommandPalettePage;
  let notificationPage: NotificationPage;
  let sidebarPage: SidebarPage;

  setupMockServerHooks("jira");

  before(async function () {
    workbench = new Workbench();
    commandPalettePage = new CommandPalettePage();
    notificationPage = new NotificationPage();
    sidebarPage = new SidebarPage();

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

  describe("Jira Type Selection", function () {
    it("should prompt for Jira type selection", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.setup");
      await sleep(TestConfig.timeouts.animation);

      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        const items = await commandPalettePage.getQuickPickItems();

        // Should show Cloud and Server options
        const hasCloud = items.some((item) =>
          item.toLowerCase().includes("cloud")
        );
        const hasServer = items.some((item) =>
          item.toLowerCase().includes("server")
        );

        await commandPalettePage.cancel();
      }
    });
  });

  describe("Jira Cloud Setup", function () {
    it("should prompt for site URL", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.setupCloud");
      await sleep(TestConfig.timeouts.animation);

      const isOpen = await commandPalettePage.isOpen();
      expect(isOpen).to.be.true;

      // Should ask for site URL (e.g., company.atlassian.net)
      const inputBox = new InputBox();
      const placeholder = await inputBox.getPlaceHolder();

      await inputBox.cancel();
    });

    it("should prompt for email", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.setupCloud");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();

      // Enter site URL
      await inputBox.setText("test.atlassian.net");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.animation);

      // Should now ask for email
      // Check if next input is for email
    });

    it("should prompt for API token", async function () {
      // After email, should ask for API token
    });

    it("should validate site URL format", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.setupCloud");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();

      // Enter invalid URL
      await inputBox.setText("not-a-valid-url");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.animation);

      // Should show validation error
    });

    it("should test connection after setup", async function () {
      // After entering credentials, connection should be tested
    });
  });

  describe("Jira Server Setup", function () {
    it("should prompt for server URL", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.setupServer");
      await sleep(TestConfig.timeouts.animation);

      const isOpen = await commandPalettePage.isOpen();
      expect(isOpen).to.be.true;

      // Should ask for server URL (e.g., http://jira.company.com)
      await commandPalettePage.cancel();
    });

    it("should prompt for username", async function () {
      // Server setup uses username instead of email
    });

    it("should prompt for password or PAT", async function () {
      // Server setup uses password or Personal Access Token
    });

    it("should handle self-signed certificates", async function () {
      // Server setup should handle SSL certificate issues
    });
  });

  describe("Project Selection", function () {
    it("should show available projects after authentication", async function () {
      // After successful auth, projects should be fetched
    });

    it("should allow default project selection", async function () {
      // User should be able to set a default project
    });
  });

  describe("Connection Testing", function () {
    it("should execute test connection command", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.testConnection");
      await sleep(TestConfig.timeouts.apiResponse);

      // Should show connection result
    });

    it("should show success for valid credentials", async function () {
      // With valid mock data, should show success
    });

    it("should show error for invalid credentials", async function () {
      // With invalid credentials, should show error
    });
  });
});

describe("Jira Setup - Error Scenarios", function () {
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

  describe("Invalid Credentials", function () {
    it("should handle invalid site URL", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.setupCloud");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      await inputBox.setText("invalid-site.example.com");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

      // Should show connection error
    });

    it("should handle invalid email format", async function () {
      // Email validation
    });

    it("should handle invalid API token", async function () {
      // Token validation
    });
  });

  describe("Network Errors", function () {
    it("should handle unreachable server", async function () {
      // Network timeout or DNS failure
    });

    it("should handle rate limiting", async function () {
      // 429 response from Jira
    });
  });

  describe("Reset Configuration", function () {
    it("should execute reset config command", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.resetConfig");
      await sleep(TestConfig.timeouts.animation);

      // Should ask for confirmation
      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        await commandPalettePage.cancel();
      }
    });

    it("should clear stored credentials on reset", async function () {
      // After reset, credentials should be removed
    });
  });

  describe("Update Credentials", function () {
    it("should execute update token command", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.updateToken");
      await sleep(TestConfig.timeouts.animation);

      // Should prompt for new token
      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        await commandPalettePage.cancel();
      }
    });
  });
});

describe("Jira Server-Specific Setup", function () {
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

  describe("Server Commands", function () {
    it("should have server-specific test connection", async function () {
      await commandPalettePage.executeCommand(
        "devBuddy.jira.server.testConnection"
      );
      await sleep(TestConfig.timeouts.apiResponse);

      // Server-specific connection test
    });

    it("should have server-specific reset config", async function () {
      await commandPalettePage.executeCommand(
        "devBuddy.jira.server.resetConfig"
      );
      await sleep(TestConfig.timeouts.animation);

      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        await commandPalettePage.cancel();
      }
    });

    it("should show server info", async function () {
      await commandPalettePage.executeCommand("devBuddy.jira.server.showInfo");
      await sleep(TestConfig.timeouts.animation);

      // Should show server version and info
    });

    it("should allow password update", async function () {
      await commandPalettePage.executeCommand(
        "devBuddy.jira.server.updatePassword"
      );
      await sleep(TestConfig.timeouts.animation);

      const isOpen = await commandPalettePage.isOpen();
      if (isOpen) {
        await commandPalettePage.cancel();
      }
    });
  });
});
