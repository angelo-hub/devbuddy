/**
 * Pro AI Ticket Creator
 * 
 * Platform-agnostic ticket creation with AI assistance.
 * Supports Linear and Jira with intelligent template application.
 * 
 * @license Commercial - See LICENSE.pro
 */

import * as vscode from "vscode";
import { LinearClient } from "@providers/linear/LinearClient";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";
import { getCurrentPlatform } from "@shared/utils/platformDetector";
import { getLogger } from "@shared/utils/logger";
import { CreateTicketInput } from "@shared/base/BaseTicketProvider";
import { LinearIssue, LinearTeam, LinearProject } from "@providers/linear/types";
import { JiraIssue, JiraProject } from "@providers/jira/common/types";
import { convertMarkdownToADF } from "@shared/jira/markdownToADF";

const logger = getLogger();

/**
 * Ticket creation input that works across platforms
 */
export interface UnifiedTicketInput {
  title: string;
  description?: string;
  priority?: number | string; // number for Linear, string for Jira
  assigneeId?: string;
  projectId?: string;
  teamId?: string;
  labelIds?: string[];
  labels?: string[]; // For Jira string labels
  templateId?: string;
  issueTypeId?: string; // Jira-specific
  parentId?: string; // For subtasks
}

/**
 * Ticket creation result
 */
export interface TicketCreationResult {
  success: boolean;
  ticket?: {
    id: string;
    identifier: string;
    title: string;
    url: string;
    platform: "Linear" | "Jira";
    openInDevBuddy?: string; // Command URI
  };
  error?: string;
}

/**
 * AI-powered ticket creator that works across platforms
 */
export class TicketCreator {
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Create a ticket on the currently configured platform
   */
  async createTicket(input: UnifiedTicketInput): Promise<TicketCreationResult> {
    try {
      const platform = await getCurrentPlatform();
      
      logger.info(`[Ticket Creator] Creating ticket on ${platform}`);
      logger.debug(`[Ticket Creator] Input: ${JSON.stringify(input, null, 2)}`);
      
      if (platform === "linear") {
        return await this.createLinearTicket(input);
      } else if (platform === "jira") {
        return await this.createJiraTicket(input);
      } else {
        return {
          success: false,
          error: "No platform configured. Please configure Linear or Jira first."
        };
      }
    } catch (error) {
      logger.error("[Ticket Creator] Error creating ticket", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Create a Linear ticket
   */
  private async createLinearTicket(input: UnifiedTicketInput): Promise<TicketCreationResult> {
    try {
      const client = await LinearClient.create();
      
      if (!client.isConfigured()) {
        return {
          success: false,
          error: "Linear not configured. Please run 'DevBuddy: Configure Linear' first."
        };
      }
      
      // Get team ID (required for Linear)
      let teamId = input.teamId;
      if (!teamId) {
        // Try to get default team from settings
        const config = vscode.workspace.getConfiguration("devBuddy");
        teamId = config.get<string>("linearTeamId");
        
        // If still no team, get user's first team
        if (!teamId) {
          const teams = await client.getTeams();
          if (teams.length === 0) {
            return {
              success: false,
              error: "No teams found. Please configure a team ID in settings."
            };
          }
          teamId = teams[0].id;
          logger.info(`[Ticket Creator] Using default team: ${teams[0].name}`);
        }
      }
      
      // Build create input
      const createInput: CreateTicketInput = {
        teamId: teamId,
        title: input.title,
        description: input.description,
        priority: typeof input.priority === 'number' ? input.priority : undefined,
        assigneeId: input.assigneeId,
        projectId: input.projectId,
        labelIds: input.labelIds,
        stateId: undefined // Let Linear use default state
      };
      
      logger.debug(`[Ticket Creator] Creating Linear issue with input: ${JSON.stringify(createInput, null, 2)}`);
      
      // Create the issue
      const issue = await client.createIssue(createInput);
      
      if (!issue) {
        return {
          success: false,
          error: "Failed to create Linear issue. No response from API."
        };
      }
      
      logger.success(`[Ticket Creator] Successfully created Linear issue: ${issue.identifier}`);
      
      // Build command URI for opening in DevBuddy
      const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(issue.identifier)}`;
      
      return {
        success: true,
        ticket: {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          url: issue.url,
          platform: "Linear",
          openInDevBuddy: commandUri
        }
      };
    } catch (error) {
      logger.error("[Ticket Creator] Error creating Linear ticket", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Create a Jira ticket
   */
  private async createJiraTicket(input: UnifiedTicketInput): Promise<TicketCreationResult> {
    try {
      const client = await JiraCloudClient.create();
      
      if (!client.isConfigured()) {
        return {
          success: false,
          error: "Jira not configured. Please run 'DevBuddy: Configure Jira' first."
        };
      }
      
      // Get project key (required for Jira)
      let projectKey = input.projectId;
      let projectId: string | undefined;
      
      if (!projectKey) {
        // Don't use defaultProject setting (it may be from a different Jira instance)
        // Always fetch and use the first available project
        const projects = await client.getProjects();
        if (projects.length === 0) {
          return {
            success: false,
            error: "No projects found. Please ensure your Jira Cloud instance has accessible projects."
          };
        }
        projectKey = projects[0].key;
        projectId = projects[0].id;
        logger.info(`[Ticket Creator] Using project: ${projects[0].name} (${projectKey})`);
      } else {
        // projectKey from input - need to get the ID
        const projects = await client.getProjects();
        const project = projects.find(p => p.key === projectKey);
        if (project) {
          projectId = project.id;
        } else {
          return {
            success: false,
            error: `Project "${projectKey}" not found in your Jira Cloud instance`
          };
        }
      }
      
      if (!projectId) {
        return {
          success: false,
          error: `Could not find project ID for project key: ${projectKey}`
        };
      }
      
      // Get issue type (default to Task) - use project ID (numeric)
      let issueTypeId = input.issueTypeId;
      if (!issueTypeId && projectId) {
        const issueTypes = await client.getIssueTypes(projectId);
        const taskType = issueTypes.find(t => t.name === "Task" || t.name === "Story");
        if (!taskType) {
          return {
            success: false,
            error: "No suitable issue type found. Please specify an issue type."
          };
        }
        issueTypeId = taskType.id;
        logger.info(`[Ticket Creator] Using default issue type: ${taskType.name}`);
      }
      
      // Build create input for Jira - ensure projectKey is defined
      if (!projectKey) {
        return {
          success: false,
          error: "Project key is required but could not be determined"
        };
      }
      
      // Ensure issueTypeId is defined
      if (!issueTypeId) {
        return {
          success: false,
          error: "Issue type ID is required but could not be determined"
        };
      }
      
      const createInput = {
        projectKey: projectKey,
        summary: input.title,
        description: undefined as string | undefined,
        descriptionADF: input.description ? convertMarkdownToADF(input.description) : undefined,
        issueTypeId: issueTypeId,
        priorityId: typeof input.priority === 'string' ? input.priority : undefined,
        assigneeId: input.assigneeId,
        labels: input.labels
      };
      
      logger.debug(`[Ticket Creator] Creating Jira issue with input: ${JSON.stringify(createInput, null, 2)}`);
      
      // Create the issue
      const issue = await client.createIssue(createInput);
      
      if (!issue) {
        return {
          success: false,
          error: "Failed to create Jira issue. No response from API."
        };
      }
      
      logger.success(`[Ticket Creator] Successfully created Jira issue: ${issue.key}`);
      
      // Build command URI for opening in DevBuddy
      const commandUri = `vscode://angelogirardi.dev-buddy/devBuddy.openTicketById?ticketId=${encodeURIComponent(issue.key)}`;
      
      return {
        success: true,
        ticket: {
          id: issue.id,
          identifier: issue.key,
          title: issue.summary,
          url: issue.url,
          platform: "Jira",
          openInDevBuddy: commandUri
        }
      };
    } catch (error) {
      logger.error("[Ticket Creator] Error creating Jira ticket", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Get available teams for the current platform
   */
  async getAvailableTeams(): Promise<{ id: string; name: string; key: string }[]> {
    try {
      const platform = await getCurrentPlatform();
      
      if (platform === "linear") {
        const client = await LinearClient.create();
        if (!client.isConfigured()) {
          return [];
        }
        const teams = await client.getTeams();
        return teams.map(t => ({ id: t.id, name: t.name, key: t.key }));
      } else if (platform === "jira") {
        const client = await JiraCloudClient.create();
        if (!client.isConfigured()) {
          return [];
        }
        const projects = await client.getProjects();
        return projects.map(p => ({ id: p.id, name: p.name, key: p.key }));
      }
      
      return [];
    } catch (error) {
      logger.error("[Ticket Creator] Error fetching teams", error);
      return [];
    }
  }

  /**
   * Get available projects for a team (Linear) or all projects (Jira)
   */
  async getAvailableProjects(teamId?: string): Promise<{ id: string; name: string }[]> {
    try {
      const platform = await getCurrentPlatform();
      
      if (platform === "linear") {
        const client = await LinearClient.create();
        if (!client.isConfigured()) {
          return [];
        }
        const projects = await client.getUserProjects();
        return projects.map((p: any) => ({ id: p.id, name: p.name }));
      } else if (platform === "jira") {
        const client = await JiraCloudClient.create();
        if (!client.isConfigured()) {
          return [];
        }
        const projects = await client.getProjects();
        return projects.map(p => ({ id: p.id, name: p.name }));
      }
      
      return [];
    } catch (error) {
      logger.error("[Ticket Creator] Error fetching projects", error);
      return [];
    }
  }

  /**
   * Get available assignees for the current platform
   */
  async getAvailableAssignees(): Promise<{ id: string; name: string; email: string }[]> {
    try {
      const platform = await getCurrentPlatform();
      
      if (platform === "linear") {
        const client = await LinearClient.create();
        if (!client.isConfigured()) {
          return [];
        }
        const users = await client.getOrganizationUsers();
        return users.map((u: any) => ({ id: u.id, name: u.name, email: u.email }));
      } else if (platform === "jira") {
        const client = await JiraCloudClient.create();
        if (!client.isConfigured()) {
          return [];
        }
        const users = await client.searchUsers("");
        return users.map(u => ({ id: u.accountId, name: u.displayName, email: u.emailAddress || "" }));
      }
      
      return [];
    } catch (error) {
      logger.error("[Ticket Creator] Error fetching assignees", error);
      return [];
    }
  }

  /**
   * Get available labels for the current platform
   */
  async getAvailableLabels(): Promise<{ id: string; name: string; color?: string }[]> {
    try {
      const platform = await getCurrentPlatform();
      
      if (platform === "linear") {
        const client = await LinearClient.create();
        if (!client.isConfigured()) {
          return [];
        }
        // Get teams first, then fetch labels for the first team
        const teams = await client.getTeams();
        if (teams.length === 0) {
          return [];
        }
        const labels = await client.getTeamLabels(teams[0].id);
        return labels.map((l: any) => ({ id: l.id, name: l.name, color: l.color }));
      } else if (platform === "jira") {
        // Jira doesn't have predefined labels, they're just strings
        // Return empty array - user can type any label
        return [];
      }
      
      return [];
    } catch (error) {
      logger.error("[Ticket Creator] Error fetching labels", error);
      return [];
    }
  }
}

