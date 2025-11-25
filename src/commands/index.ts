import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";

// Import all the legacy commands temporarily
// TODO: These should be moved to their respective command modules
import { generatePRSummaryCommand } from "@pro/commands/ai/generatePRSummary";
import { generateStandupCommand } from "@pro/commands/ai/generateStandup";
import { convertTodoToTicket } from "@commands/convertTodoToTicket";
import { showFirstTimeSetup } from "@providers/linear/firstTimeSetup";
import { LinearClient } from "@providers/linear/LinearClient";
import { LinearIssue } from "@providers/linear/types";
import { LinearTicketPanel } from "@providers/linear/LinearTicketPanel";
import { CreateTicketPanel } from "@providers/linear/CreateTicketPanel";
import { LinearStandupDataProvider } from "@providers/linear/LinearStandupDataProvider";
import { UniversalStandupBuilderPanel } from "@shared/views/UniversalStandupBuilderPanel";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";
import { getCurrentPlatform } from "@shared/utils/platformDetector";
import { JiraStandupDataProvider } from "@providers/jira/JiraStandupDataProvider";
import { JiraCreateTicketPanel } from "@providers/jira/cloud/JiraCreateTicketPanel";
import { JiraIssue } from "@providers/jira/common/types";
import { JiraIssuePanel } from "@providers/jira/cloud/JiraIssuePanel";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";

// Import command modules (these will gradually take over)
import { registerLinearCommands } from "./linear";
import { registerJiraCommands } from "./jira";
import { registerCommonCommands } from "./common";

/**
 * Register all commands for the extension
 * This is the central command registration point
 * 
 * NOTE: This file temporarily contains direct command registrations from the old extension.ts
 * Commands will be gradually migrated to their respective modules (linear/, jira/, common/)
 */
export function registerAllCommands(
  context: vscode.ExtensionContext,
  ticketsProvider: UniversalTicketsProvider | undefined
): void {
  const logger = getLogger();
  logger.info("Registering commands...");

  // Initialize branch manager (needed by commands)
  const branchManager = new BranchAssociationManager(context);

  // ==================== CORE COMMANDS ====================
  // These work across all platforms

  // Register existing commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devBuddy.generatePRSummary",
      generatePRSummaryCommand
    ),
    vscode.commands.registerCommand(
      "devBuddy.generateStandup",
      generateStandupCommand
    ),
    vscode.commands.registerCommand("devBuddy.openStandupBuilder", async () => {
      // Get the current platform and create appropriate data provider
      const platform = getCurrentPlatform();
      let dataProvider;
      
      if (platform === "jira") {
        dataProvider = new JiraStandupDataProvider();
        await dataProvider.initialize();
      } else {
        // Default to Linear
        dataProvider = new LinearStandupDataProvider();
        await dataProvider.initialize();
      }
      
      await UniversalStandupBuilderPanel.createOrShow(context.extensionUri, dataProvider);
    }),
    vscode.commands.registerCommand("devBuddy.createTicket", () => {
      const platform = getCurrentPlatform();
      
      if (platform === "jira") {
        JiraCreateTicketPanel.createOrShow(context.extensionUri);
      } else {
        // Default to Linear
        CreateTicketPanel.createOrShow(context.extensionUri);
      }
    }),

    // Beta: Convert TODO to Linear Ticket
    vscode.commands.registerCommand(
      "devBuddy.convertTodoToTicket",
      convertTodoToTicket
    ),

    // Refresh tickets
    vscode.commands.registerCommand("devBuddy.refreshTickets", () => {
      ticketsProvider?.refresh();
    })
  );

  // ==================== PLATFORM-AGNOSTIC COMMANDS ====================
  // These commands work with any configured platform

  context.subscriptions.push(
    // Open ticket by ID (for AI agent command URIs)
    vscode.commands.registerCommand(
      "devBuddy.openTicketById",
      async (ticketIdOrParams: string | { ticketId: string }) => {
        // Handle both direct string and URI query parameter object
        const ticketId = typeof ticketIdOrParams === 'string' 
          ? ticketIdOrParams 
          : ticketIdOrParams.ticketId;
        
        logger.info(`🎫 [Command] openTicketById called with: ${JSON.stringify(ticketIdOrParams)}`);
        logger.debug(`[Command] Parsed ticketId: ${ticketId}`);
        
        if (!ticketId) {
          vscode.window.showErrorMessage("No ticket ID provided");
          logger.error(`[Command] No ticketId found in parameters`);
          return;
        }
        
        try {
          const platform = await getCurrentPlatform();
          logger.debug(`[Command] Platform: ${platform}`);
          
          if (platform === "linear") {
            const client = await LinearClient.create();
            if (!client.isConfigured()) {
              vscode.window.showErrorMessage("Linear not configured");
              return;
            }
            
            logger.debug(`[Command] Fetching Linear ticket: ${ticketId}`);
            const ticket = await client.getIssue(ticketId);
            if (!ticket) {
              vscode.window.showErrorMessage(`Ticket ${ticketId} not found`);
              return;
            }
            
            logger.success(`[Command] Opening Linear ticket panel for ${ticketId}`);
            await LinearTicketPanel.createOrShow(
              context.extensionUri,
              ticket,
              context
            );
          } else if (platform === "jira") {
            const client = await JiraCloudClient.create();
            if (!client.isConfigured()) {
              vscode.window.showErrorMessage("Jira not configured");
              return;
            }
            
            logger.debug(`[Command] Fetching Jira ticket: ${ticketId}`);
            const ticket = await client.getIssue(ticketId);
            if (!ticket) {
              vscode.window.showErrorMessage(`Ticket ${ticketId} not found`);
              return;
            }
            
            logger.success(`[Command] Opening Jira ticket panel for ${ticketId}`);
            await JiraIssuePanel.createOrShow(
              context.extensionUri,
              ticket,
              context
            );
          } else {
            vscode.window.showErrorMessage("No ticket platform configured");
          }
        } catch (error) {
          logger.error(`[Command] Error opening ticket ${ticketId}:`, error);
          vscode.window.showErrorMessage(`Failed to open ticket: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    )
  );

  // Register command modules (these will gradually take over)
  registerLinearCommands(context, ticketsProvider);
  registerJiraCommands(context, ticketsProvider);
  registerCommonCommands(context, ticketsProvider);

  logger.success("All commands registered!");
}

