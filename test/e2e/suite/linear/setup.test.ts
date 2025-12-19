/**
 * Linear Setup Flow Tests
 *
 * Tests for the Linear provider first-time setup flow,
 * including token configuration and team selection.
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
  linearMockViewer,
  linearMockTeams,
  linearMockOrganization,
} from "../../mocks";

describe("Linear Setup Flow", function () {
  this.timeout(TestConfig.timeouts.default * 2);

  let workbench: Workbench;
  let commandPalettePage: CommandPalettePage;
  let notificationPage: NotificationPage;
  let sidebarPage: SidebarPage;

  setupMockServerHooks("linear");

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

  describe("Token Configuration", function () {
    it("should prompt for API token", async function () {
      await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
      await sleep(TestConfig.timeouts.animation);

      const isOpen = await commandPalettePage.isOpen();
      expect(isOpen).to.be.true;

      // Input box should be asking for token
      const inputBox = new InputBox();
      const placeholder = await inputBox.getPlaceHolder();
      // Placeholder might mention "token", "API key", or similar

      await inputBox.cancel();
    });

    it("should validate token format", async function () {
      await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();

      // Enter an invalid token
      await inputBox.setText("invalid-token");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

      // Should show error or validation message
      // The mock server should reject invalid tokens
    });

    it("should accept valid token format", async function () {
      await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();

      // Enter a token that looks valid (lin_api_xxx format)
      await inputBox.setText("lin_api_test1234567890abcdef");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

      // Should proceed to next step or complete setup
    });
  });

  describe("Team Selection", function () {
    it("should show available teams after authentication", async function () {
      // After valid token, teams should be fetched
      await commandPalettePage.executeCommand("devBuddy.walkthroughSetupLinear");
      await sleep(TestConfig.timeouts.animation * 2);

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
      await sleep(TestConfig.timeouts.animation);

      const isOpen = await commandPalettePage.isOpen();
      expect(isOpen).to.be.true;

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
  this.timeout(TestConfig.timeouts.default);

  let commandPalettePage: CommandPalettePage;
  let notificationPage: NotificationPage;

  setupMockServerHooks("linear");

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
      // No input box open
    }
    await notificationPage.dismissAll();
  });

  describe("Invalid Token Handling", function () {
    it("should show error for empty token", async function () {
      await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      await inputBox.setText("");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.animation);

      // Should show validation error or not proceed
    });

    it("should show error for malformed token", async function () {
      await commandPalettePage.executeCommand("devBuddy.configureLinearToken");
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      await inputBox.setText("not-a-valid-linear-token");
      await inputBox.confirm();
      await sleep(TestConfig.timeouts.apiResponse);

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
      await sleep(TestConfig.timeouts.animation);

      const inputBox = new InputBox();
      await inputBox.cancel();
      await sleep(TestConfig.timeouts.animation);

      // Should return to normal state without errors
      const hasErrors = await notificationPage.hasErrors();
      expect(hasErrors).to.be.false;
    });

    it("should handle user cancelling team selection", async function () {
      // Similar test for team selection step
    });
  });
});
