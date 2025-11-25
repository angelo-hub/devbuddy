import * as vscode from "vscode";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";
import { getLogger } from "@shared/utils/logger";

/**
 * Register Jira-specific commands
 * These commands are only relevant when using Jira as the provider
 */
export function registerJiraCommands(
  context: vscode.ExtensionContext,
  ticketsProvider: UniversalTicketsProvider | undefined
): void {
  const logger = getLogger();

  // TODO: Extract Jira commands from extension.ts
  // This includes:
  // - devBuddy.jira.setup
  // - devBuddy.jira.setupCloud
  // - devBuddy.jira.setupServer
  // - devBuddy.jira.testConnection
  // - devBuddy.jira.resetConfig
  // - devBuddy.jira.updateToken
  // - devBuddy.jira.refreshIssues
  // - devBuddy.jira.openIssue
  // - devBuddy.jira.viewIssueDetails
  // - devBuddy.jira.createIssue
  // - devBuddy.jira.updateStatus
  // - devBuddy.jira.assignIssue
  // - devBuddy.jira.addComment
  // - devBuddy.jira.copyUrl
  // - devBuddy.jira.copyKey
  // - etc.

  logger.debug("Jira commands registered (placeholder)");
}

