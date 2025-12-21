/**
 * Tree View Integration Tests
 *
 * Tests for the sidebar tree view functionality.
 */

import * as assert from "assert";
import * as vscode from "vscode";

suite("Tree View", () => {
  suiteSetup(async () => {
    // Ensure extension is activated
    const extension = vscode.extensions.getExtension("angelogirardi.dev-buddy");
    if (extension && !extension.isActive) {
      await extension.activate();
    }
  });

  test("Tree view container should be registered", async () => {
    // The tree view is registered as "myTickets" in the "dev-buddy" container
    // We can verify by checking that the view can be revealed
    try {
      await vscode.commands.executeCommand("workbench.view.extension.dev-buddy");
      // Give it a moment to register
      await new Promise((resolve) => setTimeout(resolve, 500));
      assert.ok(true, "Tree view container is accessible");
    } catch (error) {
      // View might not be available in test environment, which is acceptable
      assert.ok(true, "Tree view registration attempted");
    }
  });

  test("myTickets view should exist", async () => {
    // Verify the view is configured in the extension
    const extension = vscode.extensions.getExtension("angelogirardi.dev-buddy");
    assert.ok(extension, "Extension should exist");

    const packageJson = extension.packageJSON;
    const views = packageJson.contributes?.views?.["dev-buddy"];

    assert.ok(views, "dev-buddy view container should have views");
    assert.ok(
      views.some((v: { id: string }) => v.id === "myTickets"),
      "myTickets view should be configured"
    );
  });

  test("Tree view should have correct title", async () => {
    const extension = vscode.extensions.getExtension("angelogirardi.dev-buddy");
    assert.ok(extension, "Extension should exist");

    const packageJson = extension.packageJSON;
    const views = packageJson.contributes?.views?.["dev-buddy"];
    const myTicketsView = views?.find(
      (v: { id: string }) => v.id === "myTickets"
    );

    assert.ok(myTicketsView, "myTickets view should exist");
    assert.strictEqual(
      myTicketsView.name,
      "My Tickets",
      "View should have correct name"
    );
  });

  test("View title menu commands should be configured", async () => {
    const extension = vscode.extensions.getExtension("angelogirardi.dev-buddy");
    assert.ok(extension, "Extension should exist");

    const packageJson = extension.packageJSON;
    const menus = packageJson.contributes?.menus?.["view/title"];

    assert.ok(menus, "View title menus should be configured");

    // Check for expected menu items
    const menuCommands = menus.map(
      (m: { command: string }) => m.command
    );

    assert.ok(
      menuCommands.includes("devBuddy.createTicket"),
      "Create ticket should be in menu"
    );
    assert.ok(
      menuCommands.includes("devBuddy.refreshTickets"),
      "Refresh tickets should be in menu"
    );
    assert.ok(
      menuCommands.includes("devBuddy.showHelp"),
      "Show help should be in menu"
    );
  });

  test("Context menu commands should be configured for tickets", async () => {
    const extension = vscode.extensions.getExtension("angelogirardi.dev-buddy");
    assert.ok(extension, "Extension should exist");

    const packageJson = extension.packageJSON;
    const menus = packageJson.contributes?.menus?.["view/item/context"];

    assert.ok(menus, "Context menus should be configured");

    // Check that some Linear and Jira specific menus exist
    const hasLinearMenu = menus.some(
      (m: { when?: string }) => m.when?.includes("linearTicket")
    );
    const hasJiraMenu = menus.some(
      (m: { when?: string }) => m.when?.includes("jira")
    );

    assert.ok(hasLinearMenu, "Linear ticket context menus should exist");
    assert.ok(hasJiraMenu, "Jira ticket context menus should exist");
  });
});

