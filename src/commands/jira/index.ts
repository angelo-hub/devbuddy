import * as vscode from "vscode";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";
import { getLogger } from "@shared/utils/logger";
import { JiraIssue } from "@providers/jira/common/types";
import { JiraIssuePanel } from "@providers/jira/cloud/JiraIssuePanel";
import { JiraCreateTicketPanel } from "@providers/jira/cloud/JiraCreateTicketPanel";

// Jira Cloud setup functions
import {
  runJiraCloudSetup,
  testJiraCloudConnection,
  resetJiraCloudConfig,
  updateJiraCloudApiToken,
} from "@providers/jira/cloud/firstTimeSetup";

// Jira Server setup functions
import {
  runJiraServerSetup,
  testJiraServerConnection,
  resetJiraServerConfig,
  updateJiraServerPassword,
  showJiraServerInfo,
} from "@providers/jira/server/firstTimeSetup";

// Jira issue commands
import {
  openJiraIssue,
  updateJiraIssueStatus,
  assignJiraIssue,
  addJiraComment,
  copyJiraIssueUrl,
  copyJiraIssueKey,
} from "./issueCommands";

/**
 * Register Jira-specific commands
 * These commands are only relevant when using Jira as the provider
 */
export function registerJiraCommands(
  context: vscode.ExtensionContext,
  ticketsProvider: UniversalTicketsProvider | undefined
): void {
  const logger = getLogger();

  context.subscriptions.push(
    // ==================== SETUP COMMANDS ====================
    
    // Smart setup - ask user which type
    vscode.commands.registerCommand("devBuddy.jira.setup", async () => {
      const choice = await vscode.window.showQuickPick(
        [
          {
            label: "$(cloud) Jira Cloud",
            description: "Connect to Jira Cloud (atlassian.net)",
            value: "cloud",
          },
          {
            label: "$(server) Jira Server/Data Center",
            description: "Connect to self-hosted Jira",
            value: "server",
          },
        ],
        {
          title: "Select Jira Type",
          placeHolder: "Choose your Jira deployment type",
        }
      );

      if (choice) {
        if (choice.value === "cloud") {
          const success = await runJiraCloudSetup(context);
          if (success) {
            ticketsProvider?.refresh();
          }
        } else {
          const success = await runJiraServerSetup(context);
          if (success) {
            ticketsProvider?.refresh();
          }
        }
      }
    }),

    // Jira Cloud Commands
    vscode.commands.registerCommand("devBuddy.jira.setupCloud", async () => {
      const success = await runJiraCloudSetup(context);
      if (success) {
        ticketsProvider?.refresh();
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.cloud.testConnection", async () => {
      await testJiraCloudConnection(context);
    }),

    vscode.commands.registerCommand("devBuddy.jira.cloud.resetConfig", async () => {
      await resetJiraCloudConfig(context);
      ticketsProvider?.refresh();
    }),

    vscode.commands.registerCommand("devBuddy.jira.cloud.updateToken", async () => {
      await updateJiraCloudApiToken(context);
    }),

    // Jira Server Commands
    vscode.commands.registerCommand("devBuddy.jira.setupServer", async () => {
      const success = await runJiraServerSetup(context);
      if (success) {
        ticketsProvider?.refresh();
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.server.testConnection", async () => {
      await testJiraServerConnection();
    }),

    vscode.commands.registerCommand("devBuddy.jira.server.resetConfig", async () => {
      await resetJiraServerConfig(context);
      ticketsProvider?.refresh();
    }),

    vscode.commands.registerCommand("devBuddy.jira.server.updatePassword", async () => {
      await updateJiraServerPassword(context);
    }),

    vscode.commands.registerCommand("devBuddy.jira.server.showInfo", async () => {
      await showJiraServerInfo();
    }),

    // ==================== LEGACY COMMANDS (backward compatibility) ====================
    
    vscode.commands.registerCommand("devBuddy.jira.testConnection", async () => {
      const config = vscode.workspace.getConfiguration("devBuddy");
      const jiraType = config.get<string>("jira.type", "cloud");
      
      if (jiraType === "server") {
        await testJiraServerConnection();
      } else {
        await testJiraCloudConnection(context);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.resetConfig", async () => {
      const config = vscode.workspace.getConfiguration("devBuddy");
      const jiraType = config.get<string>("jira.type", "cloud");
      
      if (jiraType === "server") {
        await resetJiraServerConfig(context);
      } else {
        await resetJiraCloudConfig(context);
      }
      ticketsProvider?.refresh();
    }),

    vscode.commands.registerCommand("devBuddy.jira.updateToken", async () => {
      const config = vscode.workspace.getConfiguration("devBuddy");
      const jiraType = config.get<string>("jira.type", "cloud");
      
      if (jiraType === "server") {
        await updateJiraServerPassword(context);
      } else {
        await updateJiraCloudApiToken(context);
      }
    }),

    // ==================== ISSUE COMMANDS ====================
    
    vscode.commands.registerCommand("devBuddy.jira.refreshIssues", () => {
      ticketsProvider?.refresh();
    }),

    vscode.commands.registerCommand("devBuddy.jira.openIssue", async (issue?: JiraIssue) => {
      await openJiraIssue(issue);
    }),

    vscode.commands.registerCommand("devBuddy.jira.viewIssueDetails", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        // Use webview panel for both Cloud and Server
        await JiraIssuePanel.createOrShow(context.extensionUri, issue, context);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.createIssue", async () => {
      await JiraCreateTicketPanel.createOrShow(context.extensionUri);
    }),

    vscode.commands.registerCommand("devBuddy.jira.updateStatus", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await updateJiraIssueStatus(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.assignIssue", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await assignJiraIssue(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.assignToMe", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await assignJiraIssue(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.addComment", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await addJiraComment(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.copyUrl", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await copyJiraIssueUrl(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.copyIssueUrl", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await copyJiraIssueUrl(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.copyKey", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await copyJiraIssueKey(issue);
      }
    }),

    vscode.commands.registerCommand("devBuddy.jira.copyIssueKey", async (item: { issue?: JiraIssue }) => {
      const issue = item?.issue;
      if (issue) {
        await copyJiraIssueKey(issue);
      }
    })
  );

  logger.debug("Jira commands registered");
}


