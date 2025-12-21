import * as vscode from "vscode";
import { BaseTicketProvider, CreateTicketInput, TicketFilter } from "@shared/base/BaseTicketProvider";
import { getLogger } from "@shared/utils/logger";
import {
  getHttpClient,
  TTLCache,
  TTL,
  generateQueryCacheKey,
  HttpError,
} from "@shared/http";
import { LinearIssue, LinearUser, LinearProject, LinearTeam, LinearTemplate } from "./types";

const logger = getLogger();

export class LinearClient extends BaseTicketProvider<
  LinearIssue,
  LinearUser,
  LinearProject,
  LinearTeam,
  LinearTemplate,
  { id: string; name: string; color: string }
> {
  private apiToken: string;
  private baseUrl = "https://api.linear.app/graphql";
  private static secretStorage: vscode.SecretStorage | undefined;
  
  /** Cache for API responses */
  private cache: TTLCache;

  constructor(apiToken?: string) {
    super();
    this.apiToken = apiToken || "";
    // Initialize cache with default settings
    this.cache = new TTLCache({
      defaultTTL: TTL.MEDIUM, // 2 minutes default
      maxSize: 150,
    });
  }

  /**
   * Initialize the secret storage (should be called from extension activation)
   */
  static initializeSecretStorage(secretStorage: vscode.SecretStorage) {
    LinearClient.secretStorage = secretStorage;
  }

  /**
   * Get the Linear API token from secure storage
   */
  static async getApiToken(): Promise<string> {
    if (!LinearClient.secretStorage) {
      console.error("[Linear Buddy] Secret storage not initialized");
      return "";
    }
    return (await LinearClient.secretStorage.get("linearApiToken")) || "";
  }

  /**
   * Set the Linear API token in secure storage
   */
  static async setApiToken(token: string): Promise<void> {
    if (!LinearClient.secretStorage) {
      throw new Error("Secret storage not initialized");
    }
    await LinearClient.secretStorage.store("linearApiToken", token);
  }

  /**
   * Delete the Linear API token from secure storage
   */
  static async deleteApiToken(): Promise<void> {
    if (!LinearClient.secretStorage) {
      throw new Error("Secret storage not initialized");
    }
    await LinearClient.secretStorage.delete("linearApiToken");
  }

  /**
   * Initialize client with token from secure storage
   */
  static async create(): Promise<LinearClient> {
    const token = await LinearClient.getApiToken();
    return new LinearClient(token);
  }

  /**
   * Check if Linear API is configured
   */
  isConfigured(): boolean {
    return this.apiToken.length > 0;
  }

  /**
   * Fetch the current user's information
   */
  async getCurrentUser(): Promise<LinearUser | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const query = `
      query {
        viewer {
          id
          name
          email
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      return response.data.viewer;
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch current user:", error);
      return null;
    }
  }

  /**
   * Fetch issues assigned to the current user
   */
  async getMyIssues(filter?: TicketFilter): Promise<LinearIssue[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const stateFilter = filter?.state
      ? `, state: { type: { in: [${filter.state
          .map((s) => `"${s}"`)
          .join(", ")}] } }`
      : "";
    const teamFilter = filter?.teamId
      ? `, team: { id: { eq: "${filter.teamId}" } }`
      : "";

    const query = `
      query {
        viewer {
          assignedIssues(
            filter: { ${stateFilter}${teamFilter} }
            orderBy: updatedAt
            first: 50
          ) {
            nodes {
              id
              identifier
              title
              description
              url
              createdAt
              updatedAt
              priority
              branchName
              state {
                id
                name
                type
              }
              assignee {
                id
                name
                email
                avatarUrl
              }
              labels {
                nodes {
                  id
                  name
                  color
                }
              }
              project {
                id
                name
              }
              team {
                id
                name
                key
              }
              cycle {
                id
                name
                number
                startsAt
                endsAt
              }
              attachments {
                nodes {
                  id
                  url
                  title
                  subtitle
                  sourceType
                }
              }
              children {
                nodes {
                  id
                  identifier
                  title
                  url
                  priority
                  state {
                    id
                    name
                    type
                  }
                  assignee {
                    id
                    name
                    avatarUrl
                  }
                }
              }
              parent {
                id
                identifier
                title
                url
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      const issues = response.data.viewer.assignedIssues.nodes;

      // Debug: Log attachments for the first issue
      if (issues.length > 0 && issues[0].attachments) {
        const logger = getLogger();
        logger.debug(
          `Sample issue attachments: ${JSON.stringify(issues[0].attachments, null, 2)}`
        );
        logger.debug(
          `Sample issue: ${issues[0].identifier} has ${issues[0].attachments?.nodes?.length || 0} attachments`
        );
      }

      return issues;
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch issues:", error);
      throw error;
    }
  }

  /**
   * Get a specific issue by ID or identifier
   */
  async getIssue(idOrIdentifier: string): Promise<LinearIssue | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const query = `
      query {
        issue(id: "${idOrIdentifier}") {
          id
          identifier
          title
          description
          url
          createdAt
          updatedAt
          priority
          branchName
          state {
            id
            name
            type
            position
  
          }
          creator {
            id
            name
            email
            avatarUrl
          }
          assignee {
            id
            name
            email
            avatarUrl
          }
          labels {
            nodes {
              id
              name
              color
            }
          }
          project {
            id
            name
          }
          team {
            id
            name
          }
          cycle {
            id
            name
            number
            startsAt
            endsAt
          }
          attachments {
            nodes {
              id
              url
              title
              subtitle
              sourceType
            }
          }
          children {
            nodes {
              id
              identifier
              title
              url
              priority
              state {
                id
                name
                type
              }
              assignee {
                id
                name
                avatarUrl
              }
            }
          }
          parent {
            id
            identifier
            title
            url
          }
          comments {
            nodes {
              id
              body
              createdAt
              user {
                id
                name
                avatarUrl
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      return response.data.issue;
    } catch (error) {
      console.error(
        `[Linear Buddy] Failed to fetch issue ${idOrIdentifier}:`,
        error
      );
      return null;
    }
  }

  /**
   * Update issue status
   */
  async updateIssueStatus(issueId: string, stateId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    const mutation = `
      mutation {
        issueUpdate(
          id: "${issueId}",
          input: { stateId: "${stateId}" }
        ) {
          success
          issue {
            id
            state {
              name
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(mutation, { skipCache: true });
      if (response.data.issueUpdate.success) {
        // Invalidate cached issue data after successful update
        this.invalidateCache("issue");
      }
      return response.data.issueUpdate.success;
    } catch (error) {
      logger.error(`[Linear] Failed to update issue status:`, error);
      return false;
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueId: string, body: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    const mutation = `
      mutation {
        commentCreate(
          input: {
            issueId: "${issueId}",
            body: "${body.replace(/"/g, '\\"')}"
          }
        ) {
          success
        }
      }
    `;

    try {
      const response = await this.executeQuery(mutation, { skipCache: true });
      return response.data.commentCreate.success;
    } catch (error) {
      logger.error(`[Linear] Failed to add comment:`, error);
      return false;
    }
  }

  /**
   * Update issue title
   */
  async updateIssueTitle(issueId: string, title: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    const mutation = `
      mutation {
        issueUpdate(
          id: "${issueId}",
          input: { title: "${title.replace(/"/g, '\\"')}" }
        ) {
          success
          issue {
            id
            title
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(mutation, { skipCache: true });
      if (response.data.issueUpdate.success) {
        this.invalidateCache("issue");
      }
      return response.data.issueUpdate.success;
    } catch (error) {
      logger.error(`[Linear] Failed to update issue title:`, error);
      return false;
    }
  }

  /**
   * Update issue description
   */
  async updateIssueDescription(
    issueId: string,
    description: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    // Properly escape the description for GraphQL
    const escapeForGraphQL = (str: string): string => {
      return str
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/\n/g, '\\n')    // Escape newlines
        .replace(/\r/g, '\\r')    // Escape carriage returns
        .replace(/"/g, '\\"');     // Escape quotes
    };

    const mutation = `
      mutation {
        issueUpdate(
          id: "${issueId}",
          input: { description: "${escapeForGraphQL(description)}" }
        ) {
          success
          issue {
            id
            description
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(mutation, { skipCache: true });
      if (response.data.issueUpdate.success) {
        this.invalidateCache("issue");
      }
      return response.data.issueUpdate.success;
    } catch (error) {
      logger.error(`[Linear] Failed to update issue description:`, error);
      return false;
    }
  }

  /**
   * Update issue assignee
   */
  async updateIssueAssignee(
    issueId: string,
    assigneeId: string | null
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    const mutation = `
      mutation {
        issueUpdate(
          id: "${issueId}",
          input: { assigneeId: ${assigneeId ? `"${assigneeId}"` : "null"} }
        ) {
          success
          issue {
            id
            assignee {
              id
              name
              email
              avatarUrl
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(mutation, { skipCache: true });
      if (response.data.issueUpdate.success) {
        this.invalidateCache("issue");
      }
      return response.data.issueUpdate.success;
    } catch (error) {
      logger.error(`[Linear] Failed to update issue assignee:`, error);
      return false;
    }
  }

  /**
   * Update issue labels
   * @param issueId The issue ID
   * @param labelIds Array of label IDs to set (replaces all existing labels)
   */
  async updateIssueLabels(
    issueId: string,
    labelIds: string[]
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    const labelIdsString = labelIds.length > 0 
      ? `[${labelIds.map((id) => `"${id}"`).join(", ")}]`
      : "[]";

    const mutation = `
      mutation {
        issueUpdate(
          id: "${issueId}",
          input: { labelIds: ${labelIdsString} }
        ) {
          success
          issue {
            id
            labels {
              nodes {
                id
                name
                color
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(mutation, { skipCache: true });
      if (response.data.issueUpdate.success) {
        this.invalidateCache("issue");
      }
      return response.data.issueUpdate.success;
    } catch (error) {
      logger.error(`[Linear] Failed to update issue labels:`, error);
      return false;
    }
  }

  /**
   * Get cycles for a team
   * Returns active and upcoming cycles
   */
  async getTeamCycles(
    teamId: string
  ): Promise<Array<{ id: string; name: string; number: number; startsAt: string; endsAt: string; progress: number }>> {
    if (!this.isConfigured()) {
      return [];
    }

    const query = `
      query {
        team(id: "${teamId}") {
          cycles(filter: { isActive: { eq: true } }, first: 10) {
            nodes {
              id
              name
              number
              startsAt
              endsAt
              progress
            }
          }
          upcomingCycles: cycles(filter: { isPast: { eq: false }, isActive: { eq: false } }, first: 5) {
            nodes {
              id
              name
              number
              startsAt
              endsAt
              progress
            }
          }
        }
      }
    `;

    try {
      // Cycles are metadata, cache for 15 minutes
      const response = await this.executeQuery(query, { ttl: TTL.LONG });
      const activeCycles = response.data.team.cycles?.nodes || [];
      const upcomingCycles = response.data.team.upcomingCycles?.nodes || [];
      // Combine and deduplicate
      const allCycles = [...activeCycles, ...upcomingCycles];
      const uniqueCycles = allCycles.filter(
        (cycle, index, self) => self.findIndex((c) => c.id === cycle.id) === index
      );
      return uniqueCycles;
    } catch (error) {
      logger.error(`[Linear] Failed to fetch cycles:`, error);
      return [];
    }
  }

  /**
   * Update issue cycle (milestone)
   * @param issueId The issue ID
   * @param cycleId The cycle ID to assign, or null to remove from cycle
   */
  async updateIssueCycle(
    issueId: string,
    cycleId: string | null
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    const mutation = `
      mutation {
        issueUpdate(
          id: "${issueId}",
          input: { cycleId: ${cycleId ? `"${cycleId}"` : "null"} }
        ) {
          success
          issue {
            id
            cycle {
              id
              name
              number
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(mutation, { skipCache: true });
      if (response.data.issueUpdate.success) {
        this.invalidateCache("issue");
      }
      return response.data.issueUpdate.success;
    } catch (error) {
      logger.error(`[Linear] Failed to update issue cycle:`, error);
      return false;
    }
  }

  /**
   * Get team members for a specific team
   */
  async getTeamMembers(teamId: string): Promise<LinearUser[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const query = `
      query {
        team(id: "${teamId}") {
          members {
            nodes {
              id
              name
              email
              avatarUrl
            }
          }
        }
      }
    `;

    try {
      // Team members rarely change, cache for 15 minutes
      const response = await this.executeQuery(query, { ttl: TTL.LONG });
      return response.data.team.members.nodes;
    } catch (error) {
      logger.error(`[Linear] Failed to fetch team members:`, error);
      return [];
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm: string): Promise<LinearUser[]> {
    if (!this.isConfigured() || !searchTerm.trim()) {
      return [];
    }

    // Get all users from the organization
    const query = `
      query {
        users(filter: { 
          or: [
            { name: { containsIgnoreCase: "${searchTerm}" } },
            { email: { containsIgnoreCase: "${searchTerm}" } }
          ]
        }) {
          nodes {
            id
            name
            email
            avatarUrl
          }
        }
      }
    `;

    try {
      // User search results can be cached briefly
      const response = await this.executeQuery(query, { ttl: TTL.MEDIUM });
      return response.data.users.nodes;
    } catch (error) {
      logger.error(`[Linear] Failed to search users:`, error);
      return [];
    }
  }

  /**
   * Get all teams in the organization
   */
  async getTeams(): Promise<LinearTeam[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const query = `
      query {
        teams {
          nodes {
            id
            name
            key
          }
        }
      }
    `;

    try {
      // Teams rarely change, cache for 15 minutes
      const response = await this.executeQuery(query, { ttl: TTL.LONG });
      return response.data.teams.nodes;
    } catch (error) {
      logger.error(`[Linear] Failed to fetch teams:`, error);
      return [];
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(input: CreateTicketInput): Promise<LinearIssue | null> {
    if (!this.isConfigured()) {
      return null;
    }

    // Debug logging to see what we're sending to Linear
    if (input.description) {
      console.log('[Linear Debug] Creating issue with description:');
      console.log('Description length:', input.description.length);
      console.log('First 500 chars:', input.description.substring(0, 500));
      console.log('Has code block markers (```)?', input.description.includes('```'));
      console.log('Raw description being sent:', input.description);
    }

    // Properly escape the description for GraphQL:
    // 1. Replace backslashes first (must be first to avoid double-escaping)
    // 2. Replace newlines with \n
    // 3. Replace quotes with \"
    const escapeForGraphQL = (str: string): string => {
      return str
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/\n/g, '\\n')    // Escape newlines
        .replace(/\r/g, '\\r')    // Escape carriage returns
        .replace(/"/g, '\\"');     // Escape quotes
    };

    const mutation = `
      mutation {
        issueCreate(
          input: {
            teamId: "${input.teamId}"
            title: "${input.title.replace(/"/g, '\\"')}"
            ${
              input.description
                ? `description: "${escapeForGraphQL(input.description)}"`
                : ""
            }
            ${input.priority !== undefined ? `priority: ${input.priority}` : ""}
            ${input.assigneeId ? `assigneeId: "${input.assigneeId}"` : ""}
            ${input.projectId ? `projectId: "${input.projectId}"` : ""}
            ${input.stateId ? `stateId: "${input.stateId}"` : ""}
            ${
              input.labelIds && input.labelIds.length > 0
                ? `labelIds: [${input.labelIds.map((id) => `"${id}"`).join(", ")}]`
                : ""
            }
          }
        ) {
          success
          issue {
            id
            identifier
            title
            description
            url
            priority
            state {
              id
              name
              type
            }
            team {
              id
              name
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(mutation, { skipCache: true });
      if (response.data.issueCreate.success) {
        const createdIssue = response.data.issueCreate.issue;
        
        // Invalidate issues cache after creating new issue
        this.invalidateCache("viewer");
        this.invalidateCache("issue");
        
        // Debug log what came back
        if (createdIssue && createdIssue.description) {
          logger.debug(`[Linear] Created issue returned with description: ${createdIssue.description}`);
        }
        
        return createdIssue;
      }
      return null;
    } catch (error) {
      logger.error(`[Linear] Failed to create issue:`, error);
      return null;
    }
  }

  /**
   * Get templates for a team
   */
  async getTeamTemplates(teamId: string): Promise<LinearTemplate[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const query = `
      query {
        team(id: "${teamId}") {
          templates {
            nodes {
              id
              name
              description
              templateData
            }
          }
        }
      }
    `;

    try {
      // Templates rarely change, cache for 15 minutes
      const response = await this.executeQuery(query, { ttl: TTL.LONG });
      return response.data.team.templates.nodes;
    } catch (error) {
      logger.error(`[Linear] Failed to fetch templates:`, error);
      return [];
    }
  }

  /**
   * Get labels for a team
   */
  async getTeamLabels(
    teamId: string
  ): Promise<Array<{ id: string; name: string; color: string }>> {
    if (!this.isConfigured()) {
      return [];
    }

    const query = `
      query {
        team(id: "${teamId}") {
          labels {
            nodes {
              id
              name
              color
            }
          }
        }
      }
    `;

    try {
      // Labels rarely change, cache for 15 minutes
      const response = await this.executeQuery(query, { ttl: TTL.LONG });
      return response.data.team.labels.nodes;
    } catch (error) {
      logger.error(`[Linear] Failed to fetch labels:`, error);
      return [];
    }
  }

  /**
   * Get all organization users (for populating the assignee list)
   */
  async getOrganizationUsers(): Promise<LinearUser[]> {
    if (!this.isConfigured()) {
      return [];
    }

    // Fetch users without complex filters - Linear API may not support active filter
    const query = `
      query {
        users(first: 100) {
          nodes {
            id
            name
            email
            avatarUrl
          }
        }
      }
    `;

    try {
      getLogger().debug(`Executing query: ${query}`);
      const response = await this.executeQuery(query);
      return response.data.users.nodes;
    } catch (error) {
      getLogger().error("Failed to fetch organization users", error);
      return [];
    }
  }

  /**
   * Get workflow states for a team, optionally filtered by workflow
   */
  async getWorkflowStates(
    teamId?: string,
    workflowId?: string
  ): Promise<
    Array<{ id: string; name: string; type: string; position?: number }>
  > {
    if (!this.isConfigured()) {
      return [];
    }

    let filter = "";
    if (teamId && workflowId) {
      filter = `(filter: { team: { id: { eq: "${teamId}" } }, workflow: { id: { eq: "${workflowId}" } } })`;
    } else if (teamId) {
      filter = `(filter: { team: { id: { eq: "${teamId}" } } })`;
    } else if (workflowId) {
      filter = `(filter: { workflow: { id: { eq: "${workflowId}" } } })`;
    }

    const query = `
      query {
        workflowStates${filter} {
          nodes {
            id
            name
            type
            position
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      const states = response.data.workflowStates.nodes;
      // Sort by position to maintain workflow order
      return states.sort(
        (a: any, b: any) => (a.position || 0) - (b.position || 0)
      );
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch workflow states:", error);
      return [];
    }
  }

  /**
   * Get the workflow ID for a given state
   */
  async getWorkflowForState(stateId: string): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const query = `
      query {
        workflowState(id: "${stateId}") {
          workflow {
            id
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      return response.data.workflowState?.workflow?.id || null;
    } catch (error) {
      console.error(
        "[Linear Buddy] Failed to fetch workflow for state:",
        error
      );
      return null;
    }
  }

  /**
   * Get projects that the user is a member of
   */
  async getUserProjects(): Promise<LinearProject[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const query = `
      query {
        projects(
          filter: { 
            state: { eq: "started" }
          }
          orderBy: updatedAt
          first: 50
        ) {
          nodes {
            id
            name
            url
            state
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      return response.data.projects.nodes;
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch projects:", error);
      return [];
    }
  }

  /**
   * Get user's teams
   */
  async getUserTeams(): Promise<
    Array<{ id: string; name: string; key: string }>
  > {
    if (!this.isConfigured()) {
      return [];
    }

    const query = `
      query {
        viewer {
          teams {
            nodes {
              id
              name
              key
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      return response.data.viewer.teams.nodes;
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch teams:", error);
      return [];
    }
  }

  /**
   * Get unassigned issues for a project
   */
  async getProjectUnassignedIssues(projectId: string): Promise<LinearIssue[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const query = `
      query {
        project(id: "${projectId}") {
          issues(
            filter: { 
              assignee: { null: true }
              state: { type: { in: ["unstarted", "started", "backlog"] } }
            }
            orderBy: updatedAt
            first: 50
          ) {
            nodes {
              id
              identifier
              title
              description
              url
              createdAt
              updatedAt
              priority
              branchName
              state {
                id
                name
                type
              }
              assignee {
                id
                name
                email
                avatarUrl
              }
              labels {
                nodes {
                  id
                  name
                  color
                }
              }
              project {
                id
                name
              }
              team {
                id
                name
                key
              }
              cycle {
                id
                name
                number
                startsAt
                endsAt
              }
              attachments {
                nodes {
                  id
                  url
                  title
                  subtitle
                  sourceType
                }
              }
              children {
                nodes {
                  id
                  identifier
                  title
                  url
                  priority
                  state {
                    id
                    name
                    type
                  }
                  assignee {
                    id
                    name
                    avatarUrl
                  }
                }
              }
              parent {
                id
                identifier
                title
                url
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      return response.data.project.issues.nodes;
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch unassigned issues:", error);
      return [];
    }
  }

  /**
   * Get unassigned issues for a team
   */
  async getTeamUnassignedIssues(teamId: string): Promise<LinearIssue[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const query = `
      query {
        team(id: "${teamId}") {
          issues(
            filter: { 
              assignee: { null: true }
              state: { type: { in: ["unstarted", "backlog"] } }
            }
            orderBy: updatedAt
            first: 50
          ) {
            nodes {
              id
              identifier
              title
              description
              url
              createdAt
              updatedAt
              priority
              branchName
              state {
                id
                name
                type
              }
              assignee {
                id
                name
                email
                avatarUrl
              }
              labels {
                nodes {
                  id
                  name
                  color
                }
              }
              project {
                id
                name
              }
              team {
                id
                name
                key
              }
              cycle {
                id
                name
                number
                startsAt
                endsAt
              }
              attachments {
                nodes {
                  id
                  url
                  title
                  subtitle
                  sourceType
                }
              }
              children {
                nodes {
                  id
                  identifier
                  title
                  url
                  priority
                  state {
                    id
                    name
                    type
                  }
                  assignee {
                    id
                    name
                    avatarUrl
                  }
                }
              }
              parent {
                id
                identifier
                title
                url
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      return response.data.team.issues.nodes;
    } catch (error) {
      console.error(
        "[Linear Buddy] Failed to fetch unassigned team issues:",
        error
      );
      return [];
    }
  }

  /**
   * Get team projects (projects that belong to a specific team)
   */
  async getTeamProjects(teamId: string): Promise<LinearProject[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const query = `
      query {
        team(id: "${teamId}") {
          projects(
            filter: { 
              state: { eq: "started" }
            }
            orderBy: updatedAt
            first: 50
          ) {
            nodes {
              id
              name
              url
              state
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      return response.data.team.projects.nodes;
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch team projects:", error);
      return [];
    }
  }

  /**
   * Execute a GraphQL query with caching and retry support
   * @param query The GraphQL query string
   * @param options Optional configuration for caching
   */
  private async executeQuery(
    query: string,
    options?: { ttl?: number; skipCache?: boolean }
  ): Promise<any> {
    const cacheKey = generateQueryCacheKey(query);
    
    // Check cache first (unless explicitly skipped)
    if (!options?.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug(`[Linear] Cache hit for query`);
        return cached;
      }
    }

    const httpClient = getHttpClient();

    try {
      const response = await httpClient.post<any>(
        this.baseUrl,
        { query },
        {
          headers: {
            Authorization: this.apiToken,
          },
          retry: {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            retryableStatuses: [429, 500, 502, 503, 504],
            retryOnNetworkError: true,
          },
        }
      );

      const data = response.data;

      // GraphQL errors are not retryable - they indicate query/data issues
      if (data.errors) {
        logger.error(`[Linear] GraphQL Errors:`, data.errors);
        throw new Error(`Linear GraphQL error: ${JSON.stringify(data.errors)}`);
      }

      // Cache successful response
      const ttl = options?.ttl ?? TTL.MEDIUM;
      if (ttl > 0) {
        this.cache.set(cacheKey, data, ttl);
      }

      return data;
    } catch (error) {
      if (error instanceof HttpError) {
        logger.error(
          `[Linear] API Error - Status: ${error.status} ${error.statusText}`
        );
        logger.error(`[Linear] Response body:`, error.body);
        throw new Error(
          `Linear API error: ${error.status} ${error.statusText} - ${error.body}`
        );
      }
      throw error;
    }
  }

  /**
   * Clear the API response cache
   * Useful after mutations to ensure fresh data
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug("[Linear] Cache cleared");
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param pattern String pattern to match against cache keys
   */
  invalidateCache(pattern: string): void {
    const count = this.cache.invalidateByPattern(pattern);
    logger.debug(`[Linear] Invalidated ${count} cache entries matching: ${pattern}`);
  }
}

