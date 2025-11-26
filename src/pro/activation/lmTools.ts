/**
 * Pro Language Model Tools Registration
 * 
 * Language Model Tools for AI agent integration - Pro features only.
 * Requires VS Code 1.93+ and active Pro license.
 * 
 * @license Commercial - See LICENSE.pro
 */

import * as vscode from "vscode";
import { LinearClient } from "@providers/linear/LinearClient";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";
import { getCurrentPlatform } from "@shared/utils/platformDetector";
import { getLogger } from "@shared/utils/logger";
import { LicenseManager } from "../utils/licenseManager";
import { getProBadge } from "../utils/proFeatureGate";

const logger = getLogger();

/**
 * Check if user has Pro access, show upgrade prompt if not
 */
async function checkProAccess(context: vscode.ExtensionContext, featureName: string): Promise<boolean> {
  const licenseManager = LicenseManager.getInstance(context);
  const hasAccess = await licenseManager.hasProAccess();
  
  if (!hasAccess) {
    logger.info(`Pro LM Tool "${featureName}" access denied - no valid license`);
    await licenseManager.promptUpgrade(featureName);
    return false;
  }
  
  logger.debug(`Pro LM Tool "${featureName}" access granted`);
  return true;
}

/**
 * Register Pro Language Model Tools
 * These tools are gated behind Pro license validation
 */
export function registerProLanguageModelTools(context: vscode.ExtensionContext): void {
  try {
    logger.info("🔧 Attempting to register Pro Language Model Tools...");
    
    // Tool 1: Get specific ticket by ID (Pro)
    const getTicketTool = vscode.lm.registerTool('devbuddy_get_ticket', {
      invoke: async (options: vscode.LanguageModelToolInvocationOptions<{ ticketId: string }>, _token: vscode.CancellationToken) => {
        try {
          // Check Pro license
          if (!await checkProAccess(context, 'Get Ticket Details')) {
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(`${getProBadge()} This is a Pro feature. Please upgrade to DevBuddy Pro to use Language Model Tools.`)
            ]);
          }
          
          const { ticketId } = options.input;
          logger.info(`🎫 [Pro LM Tool] devbuddy_get_ticket invoked with ticketId: ${ticketId}`);
          
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
          logger.error(`[Pro LM Tool] Error in devbuddy_get_ticket: ${error}`);
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`Error fetching ticket: ${error instanceof Error ? error.message : "Unknown error"}`)
          ]);
        }
      }
    });
    context.subscriptions.push(getTicketTool);
    logger.success(`✅ Registered Pro tool: devbuddy_get_ticket ${getProBadge()}`);

    // Tool 2: List user's active tickets (Pro)
    const listTicketsTool = vscode.lm.registerTool('devbuddy_list_my_tickets', {
      invoke: async (_options: vscode.LanguageModelToolInvocationOptions<object>, _token: vscode.CancellationToken) => {
        try {
          // Check Pro license
          if (!await checkProAccess(context, 'List My Tickets')) {
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(`${getProBadge()} This is a Pro feature. Please upgrade to DevBuddy Pro to use Language Model Tools.`)
            ]);
          }
          
          logger.info(`📋 [Pro LM Tool] devbuddy_list_my_tickets invoked`);
          
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
          logger.error(`[Pro LM Tool] Error in devbuddy_list_my_tickets: ${error}`);
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`Error listing tickets: ${error instanceof Error ? error.message : "Unknown error"}`)
          ]);
        }
      }
    });
    context.subscriptions.push(listTicketsTool);
    logger.success(`✅ Registered Pro tool: devbuddy_list_my_tickets ${getProBadge()}`);

    // Tool 3: Get current branch ticket (Pro)
    const getCurrentTicketTool = vscode.lm.registerTool('devbuddy_get_current_ticket', {
      invoke: async (_options: vscode.LanguageModelToolInvocationOptions<object>, _token: vscode.CancellationToken) => {
        try {
          // Check Pro license
          if (!await checkProAccess(context, 'Get Current Ticket')) {
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(`${getProBadge()} This is a Pro feature. Please upgrade to DevBuddy Pro to use Language Model Tools.`)
            ]);
          }
          
          logger.info(`🌿 [Pro LM Tool] devbuddy_get_current_ticket invoked`);
          
          const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
          if (!workspaceRoot) {
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart("No workspace folder open")
            ]);
          }
          
          // Get current branch
          const { GitAnalyzer } = await import("@shared/git/gitAnalyzer");
          const gitAnalyzer = new GitAnalyzer(workspaceRoot);
          const currentBranch = await gitAnalyzer.getCurrentBranch();
          
          logger.debug(`[Pro LM Tool] Current branch: ${currentBranch}`);
          
          // Try to extract ticket ID from branch name
          const ticketMatch = currentBranch.match(/([A-Z]+-\d+)/);
          
          if (ticketMatch) {
            const ticketId = ticketMatch[1];
            logger.debug(`[Pro LM Tool] Detected ticket ID from branch: ${ticketId}`);
            
            // Fetch ticket details
            const currentPlatform = await getCurrentPlatform();
            
            if (currentPlatform === "linear") {
              const client = await LinearClient.create();
              const ticket = await client.getIssue(ticketId);
              if (ticket) {
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
                  detectionMethod: "branch_name",
                  branch: currentBranch,
                  openInDevBuddy: `[Open in DevBuddy](${commandUri})`
                };
                
                return new vscode.LanguageModelToolResult([
                  new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                ]);
              }
            } else if (currentPlatform === "jira") {
              const client = await JiraCloudClient.create();
              const ticket = await client.getIssue(ticketId);
              if (ticket) {
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
                  detectionMethod: "branch_name",
                  branch: currentBranch,
                  openInDevBuddy: `[Open in DevBuddy](${commandUri})`
                };
                
                return new vscode.LanguageModelToolResult([
                  new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                ]);
              }
            }
          }
          
          // Fallback: Check In Progress tickets
          logger.debug(`[Pro LM Tool] No ticket ID in branch name, checking In Progress tickets`);
          
          const currentPlatform = await getCurrentPlatform();
          
          if (currentPlatform === "linear") {
            const client = await LinearClient.create();
            if (client.isConfigured()) {
              const tickets = await client.getMyIssues({ state: ["started"] });
              
              if (tickets.length === 1) {
                const ticket = tickets[0];
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
                  detectionMethod: "in_progress_ticket",
                  branch: currentBranch,
                  note: "Inferred from single In Progress ticket (consider creating a feature branch)",
                  openInDevBuddy: `[Open in DevBuddy](${commandUri})`
                };
                
                return new vscode.LanguageModelToolResult([
                  new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                ]);
              } else if (tickets.length > 1) {
                const ticketList = tickets.slice(0, 10).map(t => {
                  const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(t.identifier)}`;
                  return {
                    id: t.identifier,
                    title: t.title,
                    status: t.state.name,
                    priority: t.priority,
                    openInDevBuddy: `[Open in DevBuddy](${commandUri})`
                  };
                });
                
                return new vscode.LanguageModelToolResult([
                  new vscode.LanguageModelTextPart(JSON.stringify({
                    message: "Multiple In Progress tickets found. Consider creating a feature branch for the specific ticket.",
                    branch: currentBranch,
                    ticketsInProgress: ticketList,
                    count: tickets.length
                  }, null, 2))
                ]);
              }
            }
          } else if (currentPlatform === "jira") {
            const client = await JiraCloudClient.create();
            if (client.isConfigured()) {
              const tickets = await client.getMyIssues();
              const inProgressTickets = tickets.filter(t => 
                t.status.name.toLowerCase().includes('progress') ||
                t.status.name.toLowerCase().includes('doing')
              );
              
              if (inProgressTickets.length === 1) {
                const ticket = inProgressTickets[0];
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
                  detectionMethod: "in_progress_ticket",
                  branch: currentBranch,
                  note: "Inferred from single In Progress ticket (consider creating a feature branch)",
                  openInDevBuddy: `[Open in DevBuddy](${commandUri})`
                };
                
                return new vscode.LanguageModelToolResult([
                  new vscode.LanguageModelTextPart(JSON.stringify(result, null, 2))
                ]);
              } else if (inProgressTickets.length > 1) {
                const ticketList = inProgressTickets.slice(0, 10).map(t => {
                  const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(t.key)}`;
                  return {
                    id: t.key,
                    title: t.summary,
                    status: t.status.name,
                    priority: t.priority?.name,
                    openInDevBuddy: `[Open in DevBuddy](${commandUri})`
                  };
                });
                
                return new vscode.LanguageModelToolResult([
                  new vscode.LanguageModelTextPart(JSON.stringify({
                    message: "Multiple In Progress tickets found. Consider creating a feature branch for the specific ticket.",
                    branch: currentBranch,
                    ticketsInProgress: ticketList,
                    count: inProgressTickets.length
                  }, null, 2))
                ]);
              }
            }
          }
          
          // No tickets found
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(JSON.stringify({
              message: "No current ticket detected",
              branch: currentBranch,
              suggestion: "Create a feature branch with a ticket ID (e.g., 'feat/ENG-123-description') or mark a ticket as In Progress"
            }, null, 2))
          ]);
          
        } catch (error) {
          logger.error(`[Pro LM Tool] Error in devbuddy_get_current_ticket: ${error}`);
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`Error detecting current ticket: ${error instanceof Error ? error.message : "Unknown error"}`)
          ]);
        }
      }
    });
    context.subscriptions.push(getCurrentTicketTool);
    logger.success(`✅ Registered Pro tool: devbuddy_get_current_ticket ${getProBadge()}`);
    
    // Tool 4: Create ticket (Pro)
    const createTicketTool = vscode.lm.registerTool('devbuddy_create_ticket', {
      invoke: async (options: vscode.LanguageModelToolInvocationOptions<{
        title: string;
        description?: string;
        priority?: string;
        assigneeId?: string;
        projectId?: string;
        teamId?: string;
        labels?: string[];
      }>, _token: vscode.CancellationToken) => {
        try {
          // Check Pro license
          if (!await checkProAccess(context, 'Create Ticket')) {
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(`${getProBadge()} This is a Pro feature. Please upgrade to DevBuddy Pro to create tickets with AI.`)
            ]);
          }
          
          logger.info(`🎟️ [Pro LM Tool] devbuddy_create_ticket invoked`);
          logger.debug(`[Pro LM Tool] Input: ${JSON.stringify(options.input, null, 2)}`);
          
          // Import ticket creator
          const { TicketCreator } = await import("../ai/ticketCreator");
          const ticketCreator = new TicketCreator(context);
          
          // Create the ticket
          const result = await ticketCreator.createTicket(options.input);
          
          if (result.success && result.ticket) {
            const response = {
              success: true,
              ticket: {
                id: result.ticket.identifier,
                title: result.ticket.title,
                url: result.ticket.url,
                platform: result.ticket.platform,
                openInDevBuddy: `[Open in DevBuddy](${result.ticket.openInDevBuddy})`
              },
              message: `Successfully created ticket ${result.ticket.identifier}`
            };
            
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(response, null, 2))
            ]);
          } else {
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify({
                success: false,
                error: result.error || "Unknown error creating ticket"
              }, null, 2))
            ]);
          }
        } catch (error) {
          logger.error(`[Pro LM Tool] Error in devbuddy_create_ticket: ${error}`);
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error"
            }, null, 2))
          ]);
        }
      }
    });
    context.subscriptions.push(createTicketTool);
    logger.success(`✅ Registered Pro tool: devbuddy_create_ticket ${getProBadge()}`);
    
    logger.success(`✨ Pro Language Model Tools registered successfully ${getProBadge()}`);
    
  } catch (_error) {
    logger.debug("Language Model Tools not available (requires VS Code 1.93+)");
  }
}

