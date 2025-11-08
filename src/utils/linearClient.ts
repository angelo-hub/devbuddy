import * as vscode from "vscode";
import { getLogger } from "./logger";

export interface LinearIssue {
  id: string;
  identifier: string; // e.g., "ENG-123"
  title: string;
  description?: string;
  state: {
    id: string;
    name: string;
    type: string; // "backlog", "unstarted", "started", "completed", "canceled"
    position?: number;
    workflow?: {
      id: string;
      name?: string;
    };
  };
  creator?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  priority: number; // 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low
  url: string;
  createdAt: string;
  updatedAt: string;
  labels?: Array<{ id: string; name: string; color: string }>;
  project?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
  attachments?: {
    nodes: Array<{
      id: string;
      url: string;
      title?: string;
      subtitle?: string;
      sourceType?: string; // "github", "gitlab", etc.
    }>;
  };
  children?: {
    nodes: Array<{
      id: string;
      identifier: string;
      title: string;
      url: string;
      state: {
        id: string;
        name: string;
        type: string;
      };
      assignee?: {
        id: string;
        name: string;
        avatarUrl?: string;
      };
      priority: number;
    }>;
  };
  parent?: {
    id: string;
    identifier: string;
    title: string;
    url: string;
  };
  comments?: {
    nodes: Array<{
      id: string;
      body: string;
      createdAt: string;
      user?: {
        id: string;
        name: string;
        avatarUrl?: string;
      };
    }>;
  };
  branchName?: string;
  gitBranchName?: string;
}

export interface LinearUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface LinearProject {
  id: string;
  name: string;
  url?: string;
  state: string;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearTemplate {
  id: string;
  name: string;
  description?: string;
  templateData: {
    title?: string;
    description?: string;
    priority?: number;
    labelIds?: string[];
    projectId?: string;
    stateId?: string;
  };
}

export class LinearClient {
  private apiToken: string;
  private baseUrl = "https://api.linear.app/graphql";
  private static secretStorage: vscode.SecretStorage | undefined;

  constructor(apiToken?: string) {
    this.apiToken = apiToken || "";
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
  async getMyIssues(filter?: {
    state?: string[];
    teamId?: string;
  }): Promise<LinearIssue[]> {
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
      const response = await this.executeQuery(mutation);
      return response.data.issueUpdate.success;
    } catch (error) {
      console.error(`[Linear Buddy] Failed to update issue status:`, error);
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
      const response = await this.executeQuery(mutation);
      return response.data.commentCreate.success;
    } catch (error) {
      console.error(`[Linear Buddy] Failed to add comment:`, error);
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
      const response = await this.executeQuery(mutation);
      return response.data.issueUpdate.success;
    } catch (error) {
      console.error(`[Linear Buddy] Failed to update issue title:`, error);
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

    const mutation = `
      mutation {
        issueUpdate(
          id: "${issueId}",
          input: { description: "${description.replace(/"/g, '\\"')}" }
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
      const response = await this.executeQuery(mutation);
      return response.data.issueUpdate.success;
    } catch (error) {
      console.error(
        `[Linear Buddy] Failed to update issue description:`,
        error
      );
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
      const response = await this.executeQuery(mutation);
      return response.data.issueUpdate.success;
    } catch (error) {
      console.error(`[Linear Buddy] Failed to update issue assignee:`, error);
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
      const response = await this.executeQuery(query);
      return response.data.team.members.nodes;
    } catch (error) {
      console.error(`[Linear Buddy] Failed to fetch team members:`, error);
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
      const response = await this.executeQuery(query);
      return response.data.users.nodes;
    } catch (error) {
      console.error(`[Linear Buddy] Failed to search users:`, error);
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
      const response = await this.executeQuery(query);
      return response.data.teams.nodes;
    } catch (error) {
      console.error(`[Linear Buddy] Failed to fetch teams:`, error);
      return [];
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(input: {
    teamId: string;
    title: string;
    description?: string;
    priority?: number;
    assigneeId?: string;
    projectId?: string;
    labelIds?: string[];
    stateId?: string;
  }): Promise<LinearIssue | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const mutation = `
      mutation {
        issueCreate(
          input: {
            teamId: "${input.teamId}"
            title: "${input.title.replace(/"/g, '\\"')}"
            ${
              input.description
                ? `description: "${input.description.replace(/"/g, '\\"')}"`
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
      const response = await this.executeQuery(mutation);
      if (response.data.issueCreate.success) {
        return response.data.issueCreate.issue;
      }
      return null;
    } catch (error) {
      console.error(`[Linear Buddy] Failed to create issue:`, error);
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
      const response = await this.executeQuery(query);
      return response.data.team.templates.nodes;
    } catch (error) {
      console.error(`[Linear Buddy] Failed to fetch templates:`, error);
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
      const response = await this.executeQuery(query);
      return response.data.team.labels.nodes;
    } catch (error) {
      console.error(`[Linear Buddy] Failed to fetch labels:`, error);
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
   * Execute a GraphQL query
   */
  private async executeQuery(query: string): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.apiToken,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[Linear Buddy] API Error - Status: ${response.status} ${response.statusText}`
      );
      console.error(`[Linear Buddy] Response body:`, errorBody);
      throw new Error(
        `Linear API error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const data: any = await response.json();

    if (data.errors) {
      console.error(`[Linear Buddy] GraphQL Errors:`, data.errors);
      throw new Error(`Linear GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return data;
  }
}
