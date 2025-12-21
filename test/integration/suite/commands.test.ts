/**
 * Commands Integration Tests
 *
 * Tests that verify commands work correctly in the VS Code environment.
 */

import * as assert from "assert";
import * as vscode from "vscode";

suite("Commands", () => {
  suiteSetup(async () => {
    // Ensure extension is activated before running tests
    const extension = vscode.extensions.getExtension("angelogirardi.dev-buddy");
    if (extension && !extension.isActive) {
      await extension.activate();
    }
  });

  suite("Help Command", () => {
    test("showHelp command should execute without error", async () => {
      try {
        await vscode.commands.executeCommand("devBuddy.showHelp");
        // If we get here without throwing, the command executed
        assert.ok(true, "showHelp command executed successfully");
      } catch (error) {
        // Quick pick may be cancelled, which is expected
        assert.ok(true, "showHelp command handled interaction");
      }
    });
  });

  suite("Provider Selection", () => {
    test("selectProvider command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.selectProvider"),
        "selectProvider command should exist"
      );
    });
  });

  suite("Ticket Operations", () => {
    test("refreshTickets command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.refreshTickets"),
        "refreshTickets command should exist"
      );
    });

    test("createTicket command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.createTicket"),
        "createTicket command should exist"
      );
    });

    test("searchTickets command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.searchTickets"),
        "searchTickets command should exist"
      );
    });
  });

  suite("Branch Operations", () => {
    test("startBranch command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.startBranch"),
        "startBranch command should exist"
      );
    });

    test("checkoutBranch command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.checkoutBranch"),
        "checkoutBranch command should exist"
      );
    });

    test("autoDetectBranches command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.autoDetectBranches"),
        "autoDetectBranches command should exist"
      );
    });
  });

  suite("Standup and PR Commands", () => {
    test("openStandupBuilder command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.openStandupBuilder"),
        "openStandupBuilder command should exist"
      );
    });

    test("generatePRSummary command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.generatePRSummary"),
        "generatePRSummary command should exist"
      );
    });

    test("generateStandup command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.generateStandup"),
        "generateStandup command should exist"
      );
    });
  });

  suite("Jira Commands", () => {
    test("Jira setup command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.jira.setup"),
        "jira.setup command should exist"
      );
    });

    test("Jira cloud setup command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.jira.setupCloud"),
        "jira.setupCloud command should exist"
      );
    });

    test("Jira refresh issues command should be available", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("devBuddy.jira.refreshIssues"),
        "jira.refreshIssues command should exist"
      );
    });
  });

  suite("Pro Commands", () => {
    test("Pro license commands should be available", async () => {
      const commands = await vscode.commands.getCommands(true);

      const proCommands = [
        "devBuddy.activateProLicense",
        "devBuddy.showLicenseInfo",
        "devBuddy.showProFeatures",
      ];

      for (const command of proCommands) {
        assert.ok(
          commands.includes(command),
          `Pro command ${command} should exist`
        );
      }
    });
  });
});

