import * as vscode from "vscode";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";
import { getLogger } from "@shared/utils/logger";

/**
 * Register Linear-specific commands
 * These commands are only relevant when using Linear as the provider
 */
export function registerLinearCommands(
  context: vscode.ExtensionContext,
  ticketsProvider: UniversalTicketsProvider | undefined
): void {
  const logger = getLogger();

  // TODO: Extract Linear commands from extension.ts
  // This includes:
  // - devBuddy.refreshTickets
  // - devBuddy.openTicket
  // - devBuddy.openTicketById
  // - devBuddy.startWork
  // - devBuddy.completeTicket
  // - devBuddy.configureLinearToken
  // - devBuddy.changeTicketStatus
  // - devBuddy.startBranch
  // - devBuddy.openPR
  // - devBuddy.copyTicketUrl
  // - devBuddy.copyTicketId
  // - devBuddy.selectLinearTeam
  // - devBuddy.openLinearInBrowser
  // - devBuddy.createTicket
  // - etc.

  logger.debug("Linear commands registered (placeholder)");
}

