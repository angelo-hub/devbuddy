import * as vscode from "vscode";

export interface LinearIssue {
  id: string;
  identifier: string; // e.g., "ENG-123"
  title: string;
  description?: string;
  state: {
    id: string;
    name: string;
    type: string; // "backlog", "unstarted", "started", "completed", "canceled"
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
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
}

export interface LinearUser {
  id: string;
  name: string;
  email: string;
}

export interface LinearProject {
  id: string;
  name: string;
  url?: string;
  state: string;
}

export class LinearClient {
  private apiToken: string;
  private baseUrl = "https://api.linear.app/graphql";

  constructor(apiToken?: string) {
    this.apiToken =
      apiToken ||
      vscode.workspace
        .getConfiguration("monorepoTools")
        .get("linearApiToken", "");
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
              state {
                id
                name
                type
              }
              assignee {
                id
                name
                email
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
            }
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      return response.data.viewer.assignedIssues.nodes;
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
          state {
            id
            name
            type
          }
          assignee {
            id
            name
            email
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
   * Get workflow states for a team
   */
  async getWorkflowStates(
    teamId?: string
  ): Promise<Array<{ id: string; name: string; type: string }>> {
    if (!this.isConfigured()) {
      return [];
    }

    const filter = teamId
      ? `(filter: { team: { id: { eq: "${teamId}" } } })`
      : "";

    const query = `
      query {
        workflowStates${filter} {
          nodes {
            id
            name
            type
          }
        }
      }
    `;

    try {
      const response = await this.executeQuery(query);
      return response.data.workflowStates.nodes;
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch workflow states:", error);
      return [];
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
              state {
                id
                name
                type
              }
              assignee {
                id
                name
                email
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
      throw new Error(`Linear API error: ${response.statusText}`);
    }

    const data: any = await response.json();

    if (data.errors) {
      throw new Error(`Linear GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    return data;
  }
}
