/**
 * Jira Cloud Client
 * 
 * Implementation for Jira Cloud (SaaS) using REST API v3.
 * Authentication: Email + API Token
 * Base URL: https://{site}.atlassian.net
 * 
 * Uses Zod v4 for runtime validation of API responses.
 */

import * as vscode from "vscode";
import { BaseJiraClient } from "../common/BaseJiraClient";
import {
  JiraIssue,
  JiraProject,
  JiraUser,
  JiraStatus,
  JiraIssueType,
  JiraPriority,
  JiraTransition,
  JiraBoard,
  JiraSprint,
  CreateJiraIssueInput,
  UpdateJiraIssueInput,
  JiraSearchOptions,
  JiraComment,
  JiraPaginatedResponse,
} from "../common/types";
import {
  JiraApiIssueSchema,
  JiraPaginatedIssueResponseSchema,
  JiraApiUserSchema,
  JiraUsersResponseSchema,
  JiraProjectsResponseSchema,
  JiraApiProjectSchema,
  JiraTransitionsResponseSchema,
  JiraApiCommentSchema,
  JiraIssueTypesResponseSchema,
  JiraPrioritiesResponseSchema,
  JiraStatusesResponseSchema,
  JiraBoardsResponseSchema,
  JiraSprintsResponseSchema,
  JiraApiCreateResponseSchema,
  JiraApiIssue,
  JiraApiUser,
  JiraApiADF,
  JiraApiStatus,
  JiraApiPriority,
  JiraApiIssueType,
  JiraApiProject,
  JiraApiComment,
  JiraApiTransition,
  JiraApiAttachment,
  JiraApiBoard,
  JiraApiSprint,
  JiraApiCreateResponse,
} from "./schemas";
import { getLogger } from "../../../shared/utils/logger";

const logger = getLogger();

// ==================== Client Implementation ====================

export class JiraCloudClient extends BaseJiraClient {
  private static instance: JiraCloudClient | null = null;
  private siteUrl: string = "";
  private email: string = "";
  private apiToken: string = "";

  private constructor() {
    super();
  }

  /**
   * Get or create singleton instance
   */
  static async create(): Promise<JiraCloudClient> {
    if (!JiraCloudClient.instance) {
      JiraCloudClient.instance = new JiraCloudClient();
      await JiraCloudClient.instance.initialize();
    }
    return JiraCloudClient.instance;
  }

  /**
   * Reset singleton instance (useful after configuration changes)
   */
  static reset(): void {
    JiraCloudClient.instance = null;
  }

  /**
   * Reload configuration from VS Code settings and secrets
   */
  async reload(): Promise<void> {
    await this.initialize();
  }

  /**
   * Initialize configuration from VS Code settings and secrets
   */
  private async initialize(): Promise<void> {
    const config = vscode.workspace.getConfiguration("devBuddy.jira.cloud");
    this.siteUrl = config.get<string>("siteUrl", "");
    this.email = config.get<string>("email", "");

    // Get API token from secure storage
    const context = (global as any).devBuddyContext as vscode.ExtensionContext;
    if (context) {
      this.apiToken = (await context.secrets.get("jiraCloudApiToken")) || "";
    }

    if (this.isConfigured()) {
      logger.info(`Jira Cloud client initialized successfully (${this.siteUrl})`);
    } else {
      logger.warn("Jira Cloud client not fully configured");
      logger.debug(`Config state: siteUrl=${!!this.siteUrl}, email=${!!this.email}, apiToken=${!!this.apiToken}`);
    }
  }

  /**
   * Check if client is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.siteUrl && this.email && this.apiToken);
  }

  /**
   * Get base API URL for Jira Cloud REST API v3
   */
  protected getApiBaseUrl(): string {
    // Ensure siteUrl doesn't have protocol
    const cleanUrl = this.siteUrl.replace(/^https?:\/\//, "");
    return `https://${cleanUrl}/rest/api/3`;
  }

  /**
   * Get authentication headers for Jira Cloud (Basic Auth with email + API token)
   */
  protected getAuthHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.email}:${this.apiToken}`).toString(
      "base64"
    );
    return {
      Authorization: `Basic ${credentials}`,
    };
  }

  // ==================== Issue Operations ====================

  /**
   * Get a single issue by key
   */
  async getIssue(key: string): Promise<JiraIssue | null> {
    try {
      const fields = [
        "summary",
        "description",
        "issuetype",
        "status",
        "priority",
        "assignee",
        "reporter",
        "project",
        "labels",
        "created",
        "updated",
        "duedate",
        "comment",
        "attachment",
        "subtasks",
        "parent",
      ].join(",");

      const response = await this.request<unknown>(
        `/issue/${key}?fields=${fields}&expand=renderedFields`
      );

      // Validate response with Zod
      const validated = JiraApiIssueSchema.parse(response);

      return this.normalizeIssue(validated);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error(`Invalid issue response for ${key}:`, error);
      } else {
        logger.error(`Failed to get issue ${key}:`, error);
      }
      return null;
    }
  }

  /**
   * Search issues using JQL or filters
   */
  async searchIssues(options: JiraSearchOptions): Promise<JiraIssue[]> {
    try {
      // Build JQL query
      let jql = options.jql || "";

      if (!jql) {
        const conditions: string[] = [];

        if (options.projectKeys?.length) {
          conditions.push(
            `project in (${options.projectKeys.map((k) => `"${k}"`).join(",")})`
          );
        }

        if (options.issueTypes?.length) {
          conditions.push(
            `issuetype in (${options.issueTypes.map((t) => `"${t}"`).join(",")})`
          );
        }

        if (options.statuses?.length) {
          conditions.push(
            `status in (${options.statuses.map((s) => `"${s}"`).join(",")})`
          );
        }

        if (options.assigneeIds?.length) {
          conditions.push(
            `assignee in (${options.assigneeIds.join(",")})`
          );
        }

        if (options.labels?.length) {
          conditions.push(
            `labels in (${options.labels.map((l) => `"${l}"`).join(",")})`
          );
        }

        jql = conditions.join(" AND ");
      }

      // Only add ORDER BY if not already present
      if (!jql.toUpperCase().includes("ORDER BY")) {
        jql += " ORDER BY updated DESC";
      }

      // Note: /search/jql uses cursor-based pagination with nextPageToken
      // See: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post
      const body: Record<string, any> = {
        jql,
        maxResults: options.maxResults || 50,
        fields: [
          "summary",
          "description",
          "issuetype",
          "status",
          "priority",
          "assignee",
          "reporter",
          "project",
          "labels",
          "created",
          "updated",
          "duedate",
        ],
      };

      // Add nextPageToken for pagination (if provided)
      // Note: startAt is NOT supported by /search/jql
      if (options.startAt && options.startAt > 0) {
        logger.warn(
          "startAt pagination not supported by /search/jql, use nextPageToken instead"
        );
      }

      logger.debug(`Jira search request: ${JSON.stringify(body, null, 2)}`);

      const response = await this.request<unknown>(
        "/search/jql",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      // Validate response with Zod
      const validated = JiraPaginatedIssueResponseSchema.parse(response);

      return (validated.issues || []).map((issue) =>
        this.normalizeIssue(issue)
      );
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error("Invalid search response:", error);
      } else {
        logger.error("Failed to search issues:", error);
      }
      return [];
    }
  }

  /**
   * Get issues assigned to current user
   */
  async getMyIssues(): Promise<JiraIssue[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return [];
      }

      return this.searchIssues({
        jql: `assignee = currentUser() AND resolution = Unresolved`,
        maxResults: 100,
      });
    } catch (error) {
      logger.error("Failed to get my issues:", error);
      return [];
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(input: CreateJiraIssueInput): Promise<JiraIssue | null> {
    try {
      interface JiraCreateFields {
        project: { key: string };
        summary: string;
        issuetype: { id: string };
        description?: JiraApiADF;
        priority?: { id: string };
        assignee?: { accountId: string };
        labels?: string[];
        duedate?: string;
        parent?: { key: string };
        [key: string]: unknown;
      }
      
      const fields: JiraCreateFields = {
        project: { key: input.projectKey },
        summary: input.summary,
        issuetype: { id: input.issueTypeId },
      };

      if (input.description) {
        // Jira Cloud uses ADF (Atlassian Document Format)
        fields.description = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: input.description,
                },
              ],
            },
          ],
        };
      }

      if (input.priorityId) {
        fields.priority = { id: input.priorityId };
      }

      if (input.assigneeId) {
        fields.assignee = { accountId: input.assigneeId };
      }

      if (input.labels?.length) {
        fields.labels = input.labels;
      }

      if (input.dueDate) {
        fields.duedate = input.dueDate;
      }

      if (input.parentKey) {
        fields.parent = { key: input.parentKey };
      }

      // Add custom fields
      if (input.customFields) {
        Object.assign(fields, input.customFields);
      }

      const response = await this.request<unknown>("/issue", {
        method: "POST",
        body: JSON.stringify({ fields }),
      });

      // Validate response with Zod
      const validated = JiraApiCreateResponseSchema.parse(response);

      logger.success(`Created Jira issue: ${validated.key}`);

      // Fetch the full issue details
      return this.getIssue(validated.key);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error("Invalid create issue response:", error);
      } else {
        logger.error("Failed to create issue:", error);
      }
      return null;
    }
  }

  /**
   * Update an existing issue
   */
  async updateIssue(
    key: string,
    input: UpdateJiraIssueInput
  ): Promise<boolean> {
    try {
      interface JiraUpdateFields {
        summary?: string;
        description?: JiraApiADF | null;
        priority?: { id: string };
        assignee?: { accountId: string } | null;
        labels?: string[];
        duedate?: string | null;
        [key: string]: unknown;
      }
      
      const fields: JiraUpdateFields = {};

      if (input.summary) {
        fields.summary = input.summary;
      }

      if (input.description !== undefined) {
        fields.description = input.description
          ? {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: input.description }],
                },
              ],
            }
          : null;
      }

      if (input.priorityId) {
        fields.priority = { id: input.priorityId };
      }

      if (input.assigneeId) {
        fields.assignee = { accountId: input.assigneeId };
      }

      if (input.labels) {
        fields.labels = input.labels;
      }

      if (input.dueDate !== undefined) {
        fields.duedate = input.dueDate;
      }

      if (input.customFields) {
        Object.assign(fields, input.customFields);
      }

      await this.request(`/issue/${key}`, {
        method: "PUT",
        body: JSON.stringify({ fields }),
      });

      logger.success(`Updated Jira issue: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Failed to update issue ${key}:`, error);
      return false;
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(key: string): Promise<JiraTransition[]> {
    try {
      const response = await this.request<unknown>(
        `/issue/${key}/transitions`
      );

      // Validate response with Zod
      const validated = JiraTransitionsResponseSchema.parse(response);

      return validated.transitions.map((t) => ({
        id: t.id,
        name: t.name,
        to: {
          id: t.to.id,
          name: t.to.name,
          description: t.to.description,
          statusCategory: t.to.statusCategory,
        },
        hasScreen: t.hasScreen,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error(`Invalid transitions response for ${key}:`, error);
      } else {
        logger.error(`Failed to get transitions for ${key}:`, error);
      }
      return [];
    }
  }

  /**
   * Transition issue to a new status
   */
  async transitionIssue(key: string, transitionId: string): Promise<boolean> {
    try {
      await this.request(`/issue/${key}/transitions`, {
        method: "POST",
        body: JSON.stringify({
          transition: { id: transitionId },
        }),
      });

      logger.success(`Transitioned issue ${key}`);
      return true;
    } catch (error) {
      logger.error(`Failed to transition issue ${key}:`, error);
      return false;
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(key: string, body: string): Promise<JiraComment | null> {
    try {
      const response = await this.request<unknown>(`/issue/${key}/comment`, {
        method: "POST",
        body: JSON.stringify({
          body: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: body }],
              },
            ],
          },
        }),
      });

      // Validate response with Zod
      const validated = JiraApiCommentSchema.parse(response);

      return {
        id: validated.id,
        body: this.extractTextFromADF(validated.body),
        author: this.normalizeUser(validated.author),
        created: validated.created,
        updated: validated.updated,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error(`Invalid comment response for ${key}:`, error);
      } else {
        logger.error(`Failed to add comment to ${key}:`, error);
      }
      return null;
    }
  }

  /**
   * Delete an issue
   */
  async deleteIssue(key: string): Promise<boolean> {
    try {
      await this.request(`/issue/${key}`, {
        method: "DELETE",
      });

      logger.success(`Deleted issue ${key}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete issue ${key}:`, error);
      return false;
    }
  }

  // ==================== Project Operations ====================

  /**
   * Get all accessible projects
   */
  async getProjects(): Promise<JiraProject[]> {
    try {
      const response = await this.request<unknown>("/project/search");

      // Validate response with Zod
      const validated = JiraProjectsResponseSchema.parse(response);

      return validated.map((p) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        description: p.description,
        avatarUrl: p.avatarUrls?.["48x48"],
        projectTypeKey: p.projectTypeKey,
        lead: p.lead ? this.normalizeUser(p.lead) : undefined,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error("Invalid projects response:", error);
      } else {
        logger.error("Failed to get projects:", error);
      }
      return [];
    }
  }

  /**
   * Get a single project by key
   */
  async getProject(key: string): Promise<JiraProject | null> {
    try {
      const response = await this.request<unknown>(`/project/${key}`);

      // Validate response with Zod
      const validated = JiraApiProjectSchema.parse(response);

      return {
        id: validated.id,
        key: validated.key,
        name: validated.name,
        description: validated.description,
        avatarUrl: validated.avatarUrls?.["48x48"],
        projectTypeKey: validated.projectTypeKey,
        lead: validated.lead ? this.normalizeUser(validated.lead) : undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error(`Invalid project response for ${key}:`, error);
      } else {
        logger.error(`Failed to get project ${key}:`, error);
      }
      return null;
    }
  }

  // ==================== User Operations ====================

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<JiraUser | null> {
    try {
      const response = await this.request<unknown>("/myself");
      
      // Validate response with Zod
      const validated = JiraApiUserSchema.parse(response);
      
      return this.normalizeUser(validated);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error("Invalid user response:", error);
      } else {
        logger.error("Failed to get current user:", error);
      }
      return null;
    }
  }

  /**
   * Search users (for assignee picker)
   */
  async searchUsers(query: string, projectKey?: string): Promise<JiraUser[]> {
    try {
      let endpoint = `/user/search?query=${encodeURIComponent(query)}`;
      if (projectKey) {
        endpoint += `&projectKeys=${projectKey}`;
      }

      const response = await this.request<unknown>(endpoint);
      
      // Validate response with Zod
      const validated = JiraUsersResponseSchema.parse(response);
      
      return validated.map((u) => this.normalizeUser(u));
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error("Invalid users response:", error);
      } else {
        logger.error("Failed to search users:", error);
      }
      return [];
    }
  }

  // ==================== Metadata Operations ====================

  /**
   * Get issue types for a project
   */
  async getIssueTypes(projectKey: string): Promise<JiraIssueType[]> {
    try {
      const response = await this.request<unknown>(
        `/issuetype/project?projectId=${projectKey}`
      );

      // Validate response with Zod
      const validated = JiraIssueTypesResponseSchema.parse(response);

      return validated.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        iconUrl: t.iconUrl,
        subtask: t.subtask,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error(`Invalid issue types response for ${projectKey}:`, error);
      } else {
        logger.error(`Failed to get issue types for ${projectKey}:`, error);
      }
      return [];
    }
  }

  /**
   * Get priorities
   */
  async getPriorities(): Promise<JiraPriority[]> {
    try {
      const response = await this.request<unknown>("/priority");

      // Validate response with Zod
      const validated = JiraPrioritiesResponseSchema.parse(response);

      return validated.map((p) => ({
        id: p.id,
        name: p.name,
        iconUrl: p.iconUrl,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error("Invalid priorities response:", error);
      } else {
        logger.error("Failed to get priorities:", error);
      }
      return [];
    }
  }

  /**
   * Get statuses for a project
   */
  async getStatuses(projectKey: string): Promise<JiraStatus[]> {
    try {
      const response = await this.request<unknown>(
        `/project/${projectKey}/statuses`
      );

      // Validate response with Zod
      const validated = JiraStatusesResponseSchema.parse(response);

      const statuses: JiraStatus[] = [];
      for (const issueType of validated) {
        for (const status of issueType.statuses || []) {
          // Avoid duplicates
          if (!statuses.find((s) => s.id === status.id)) {
            statuses.push({
              id: status.id,
              name: status.name,
              description: status.description,
              statusCategory: status.statusCategory,
            });
          }
        }
      }

      return statuses;
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error(`Invalid statuses response for ${projectKey}:`, error);
      } else {
        logger.error(`Failed to get statuses for ${projectKey}:`, error);
      }
      return [];
    }
  }

  // ==================== Agile Operations ====================

  /**
   * Get boards accessible to the user
   */
  async getBoards(projectKey?: string): Promise<JiraBoard[]> {
    try {
      let endpoint = "/board";
      if (projectKey) {
        endpoint += `?projectKeyOrId=${projectKey}`;
      }

      // Note: Agile API is not in /rest/api/3, it's in /rest/agile/1.0
      const agilBaseUrl = this.getApiBaseUrl().replace(
        "/rest/api/3",
        "/rest/agile/1.0"
      );
      const url = `${agilBaseUrl}${endpoint}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get boards: ${response.statusText}`);
      }

      const data = (await response.json()) as unknown;

      // Validate response with Zod
      const validated = JiraBoardsResponseSchema.parse(data);

      return validated.values.map((b): JiraBoard => ({
        id: b.id,
        name: b.name,
        type: b.type as "scrum" | "kanban",
        location: b.location
          ? {
              projectId: b.location.projectId,
              projectKey: b.location.projectKey,
              projectName: b.location.projectName,
            }
          : undefined,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error("Invalid boards response:", error);
      } else {
        logger.error("Failed to get boards:", error);
      }
      return [];
    }
  }

  /**
   * Get sprints for a board
   */
  async getSprints(boardId: number): Promise<JiraSprint[]> {
    try {
      const agileBaseUrl = this.getApiBaseUrl().replace(
        "/rest/api/3",
        "/rest/agile/1.0"
      );
      const url = `${agileBaseUrl}/board/${boardId}/sprint`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get sprints: ${response.statusText}`);
      }

      const data = (await response.json()) as unknown;

      // Validate response with Zod
      const validated = JiraSprintsResponseSchema.parse(data);

      return validated.values.map((s): JiraSprint => ({
        id: s.id,
        name: s.name,
        state: s.state as "future" | "active" | "closed",
        startDate: s.startDate,
        endDate: s.endDate,
        completeDate: s.completeDate,
        goal: s.goal,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        logger.error(`Invalid sprints response for board ${boardId}:`, error);
      } else {
        logger.error(`Failed to get sprints for board ${boardId}:`, error);
      }
      return [];
    }
  }

  /**
   * Get active sprint for a board
   */
  async getActiveSprint(boardId: number): Promise<JiraSprint | null> {
    try {
      const sprints = await this.getSprints(boardId);
      return sprints.find((s) => s.state === "active") || null;
    } catch (error) {
      logger.error(`Failed to get active sprint for board ${boardId}:`, error);
      return null;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Normalize Jira API issue response to our internal structure
   */
  private normalizeIssue(issue: JiraApiIssue): JiraIssue {
    const fields = issue.fields;

    return {
      id: issue.id,
      key: issue.key,
      summary: fields.summary,
      description: this.extractTextFromADF(fields.description),
      issueType: {
        id: fields.issuetype.id,
        name: fields.issuetype.name,
        description: fields.issuetype.description,
        iconUrl: fields.issuetype.iconUrl,
        subtask: fields.issuetype.subtask,
      },
      status: {
        id: fields.status.id,
        name: fields.status.name,
        description: fields.status.description,
        statusCategory: fields.status.statusCategory,
      },
      priority: fields.priority
        ? {
            id: fields.priority.id,
            name: fields.priority.name,
            iconUrl: fields.priority.iconUrl,
          }
        : { id: "", name: "None" },
      assignee: fields.assignee ? this.normalizeUser(fields.assignee) : null,
      reporter: this.normalizeUser(fields.reporter),
      project: {
        id: fields.project.id,
        key: fields.project.key,
        name: fields.project.name,
        projectTypeKey: fields.project.projectTypeKey,
        avatarUrl: fields.project.avatarUrls?.["48x48"],
      },
      labels: fields.labels || [],
      created: fields.created,
      updated: fields.updated,
      dueDate: fields.duedate || null,
      url: `https://${this.siteUrl}/browse/${issue.key}`,
      subtasks: fields.subtasks?.map((st) => ({
        id: st.id,
        key: st.key,
        summary: st.fields.summary,
        status: st.fields.status,
        issueType: st.fields.issuetype,
      })),
      comments: fields.comment?.comments?.map((c) => ({
        id: c.id,
        body: this.extractTextFromADF(c.body),
        author: this.normalizeUser(c.author),
        created: c.created,
        updated: c.updated,
      })),
      attachments: fields.attachment?.map((a) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
        created: a.created,
        author: this.normalizeUser(a.author),
        content: a.content,
        thumbnail: a.thumbnail,
      })),
    };
  }

  /**
   * Normalize Jira user to our internal structure
   */
  private normalizeUser(user: JiraApiUser): JiraUser {
    return {
      accountId: user.accountId,
      displayName: user.displayName,
      emailAddress: user.emailAddress,
      avatarUrl: user.avatarUrls?.["48x48"],
      active: user.active !== false,
      timeZone: user.timeZone,
    };
  }

  /**
   * Extract plain text from Atlassian Document Format (ADF)
   */
  private extractTextFromADF(adf: JiraApiADF | string | undefined | null): string {
    if (!adf) {
      return "";
    }

    if (typeof adf === "string") {
      return adf;
    }

    if (adf.type === "text" && adf.text) {
      return adf.text;
    }

    if (adf.content && Array.isArray(adf.content)) {
      return adf.content.map((node) => this.extractTextFromADF(node)).join("\n");
    }

    return "";
  }
}

