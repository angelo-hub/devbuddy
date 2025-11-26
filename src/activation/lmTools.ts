import * as vscode from "vscode";
import { LinearClient } from "@providers/linear/LinearClient";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";
import { getCurrentPlatform } from "@shared/utils/platformDetector";
import { getLogger } from "@shared/utils/logger";

/**
 * Register Language Model Tools for AI agent integration
 * Requires VS Code 1.93+
 */
export function registerLanguageModelTools(context: vscode.ExtensionContext): void {
  const logger = getLogger();
  
  try {
    logger.info("🔧 Attempting to register Language Model Tools...");
    
    // Tool 1: Get specific ticket by ID
    const getTicketTool = vscode.lm.registerTool('devbuddy_get_ticket', {
      invoke: async (options: vscode.LanguageModelToolInvocationOptions<{ ticketId: string }>, token: vscode.CancellationToken) => {
        try {
          const { ticketId } = options.input;
          logger.info(`🎫 [LM Tool] devbuddy_get_ticket invoked with ticketId: ${ticketId}`);
          
          const currentPlatform = await getCurrentPlatform();
          
          if (currentPlatform === "linear") {
            const client = await LinearClient.create();
            const ticket = await client.getIssue(ticketId);
            if (!ticket) {
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Ticket ${ticketId} not found`)
              ]);
            }
            
            const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(ticket.identifier)}`;
            const result = {
              id: ticket.identifier,
              title: ticket.title,
              description: ticket.description,
              status: ticket.state.name,
              priority: ticket.priority,
              assignee: ticket.assignee?.name,
              labels: ticket.labels?.map(l => l.name),
              url: ticket.url,
              platform: "Linear",
              openInDevBuddy: `[Open in DevBuddy](${commandUri})`
            };
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
          } else if (currentPlatform === "jira") {
            const client = await JiraCloudClient.create();
            const ticket = await client.getIssue(ticketId);
            if (!ticket) {
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Ticket ${ticketId} not found`)
              ]);
            }
            
            const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(ticket.key)}`;
            const result = {
              id: ticket.key,
              title: ticket.summary,
              description: ticket.description,
              status: ticket.status.name,
              priority: ticket.priority?.name,
              assignee: ticket.assignee?.displayName,
              labels: ticket.labels,
              url: ticket.url,
              platform: "Jira",
              openInDevBuddy: `[Open in DevBuddy](${commandUri})`
            };
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
          }
          
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart("No platform configured")
          ]);
        } catch (error) {
          logger.error(`[LM Tool] Error in devbuddy_get_ticket: ${error}`);
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`Error fetching ticket: ${error instanceof Error ? error.message : "Unknown error"}`)
          ]);
        }
      }
    });
    context.subscriptions.push(getTicketTool);
    logger.success("✅ Registered tool: devbuddy_get_ticket");

    // Tool 2: List user's active tickets
    const listTicketsTool = vscode.lm.registerTool('devbuddy_list_my_tickets', {
      invoke: async (options: vscode.LanguageModelToolInvocationOptions<object>, token: vscode.CancellationToken) => {
        try {
          logger.info(`📋 [LM Tool] devbuddy_list_my_tickets invoked`);
          
          const currentPlatform = await getCurrentPlatform();
          
          if (currentPlatform === "linear") {
            const client = await LinearClient.create();
            if (!client.isConfigured()) {
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart("Linear not configured. Please run 'DevBuddy: Configure Linear' first.")
              ]);
            }
            
            const tickets = await client.getMyIssues({ state: ["unstarted", "started"] });
            
            if (tickets.length === 0) {
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart("No active tickets found")
              ]);
            }
            
            const ticketList = tickets.slice(0, 20).map(t => {
              const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(t.identifier)}`;
              return {
                id: t.identifier,
                title: t.title,
                status: t.state.name,
                priority: t.priority,
                url: t.url,
                openInDevBuddy: `[Open in DevBuddy](${commandUri})`
              };
            });
            
            const result = {
              platform: "Linear",
              count: tickets.length,
              tickets: ticketList
            };
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
          } else if (currentPlatform === "jira") {
            const client = await JiraCloudClient.create();
            if (!client.isConfigured()) {
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart("Jira not configured. Please run 'DevBuddy: Configure Jira' first.")
              ]);
            }
            
            const tickets = await client.getMyIssues();
            
            if (tickets.length === 0) {
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart("No active tickets found")
              ]);
            }
            
            const ticketList = tickets.slice(0, 20).map(t => {
              const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(t.key)}`;
              return {
                id: t.key,
                title: t.summary,
                status: t.status.name,
                priority: t.priority?.name,
                url: t.url,
                openInDevBuddy: `[Open in DevBuddy](${commandUri})`
              };
            });
            
            const result = {
              platform: "Jira",
              count: tickets.length,
              tickets: ticketList
            };
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
            ]);
          }
          
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart("No platform configured")
          ]);
        } catch (error) {
          logger.error(`[LM Tool] Error in devbuddy_list_my_tickets: ${error}`);
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`Error listing tickets: ${error instanceof Error ? error.message : "Unknown error"}`)
          ]);
        }
      }
    });
    context.subscriptions.push(listTicketsTool);
    logger.success("✅ Registered tool: devbuddy_list_my_tickets");
    
  } catch (error) {
    logger.debug("Language Model Tools not available (requires VS Code 1.93+)");
  }
}


