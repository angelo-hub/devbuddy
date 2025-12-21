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
import { TTL } from "@shared/http";
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
  JiraIssueLink,
  JiraIssueLinkType,
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
  JiraApiIssueLink,
} from "./schemas";
import { getLogger } from "@shared/utils/logger";

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
        "issuelinks",
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
   * Get recently completed issues assigned to current user
   * Returns issues resolved in the last 14 days, sorted by resolution date
   */
  async getRecentlyCompletedIssues(daysAgo: number = 14): Promise<JiraIssue[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return [];
      }

      return this.searchIssues({
        jql: `assignee = currentUser() AND resolution IS NOT EMPTY AND resolved >= -${daysAgo}d ORDER BY resolved DESC`,
        maxResults: 20,
      });
    } catch (error) {
      logger.error("Failed to get recently completed issues:", error);
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

      if (input.descriptionADF) {
        // Use provided ADF description (rich format with code blocks, links, etc.)
        fields.description = input.descriptionADF as unknown as JiraApiADF;
      } else if (input.description) {
        // Check if description is already ADF JSON string
        try {
          const parsed = JSON.parse(input.description);
          if (parsed && parsed.type === "doc" && Array.isArray(parsed.content)) {
            // Already ADF format, use directly
            fields.description = parsed;
          } else {
            throw new Error("Not ADF");
          }
        } catch {
          // Convert plain text description to simple ADF format
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

      // Invalidate cache after creating a new issue
      this.invalidateAfterMutation(validated.key);

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
        if (!input.description) {
          fields.description = null;
        } else {
          // Check if description is already ADF JSON
          try {
            const parsed = JSON.parse(input.description);
            if (parsed && parsed.type === "doc" && Array.isArray(parsed.content)) {
              // Already ADF format, use directly
              fields.description = parsed;
            } else {
              // Not ADF, wrap plain text
              fields.description = {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: input.description }],
                  },
                ],
              };
            }
          } catch {
            // Not JSON, wrap plain text in ADF
            fields.description = {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: input.description }],
                },
              ],
            };
          }
        }
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

      // Debug: log the fields being sent
      logger.debug(`Updating issue ${key} with fields: ${JSON.stringify(fields, null, 2)}`);

      await this.request(`/issue/${key}`, {
        method: "PUT",
        body: JSON.stringify({ fields }),
        skipCache: true,
      });

      // Invalidate cache after updating issue
      this.invalidateAfterMutation(key);

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
        skipCache: true,
      });

      // Invalidate cache after transition
      this.invalidateAfterMutation(key);

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
        body: this.serializeADF(validated.body),
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
        skipCache: true,
      });

      // Invalidate cache after deletion
      this.invalidateAfterMutation(key);

      logger.success(`Deleted issue ${key}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete issue ${key}:`, error);
      return false;
    }
  }

  // ==================== Project Operations ====================

  /**
   * Get all accessible projects (handles pagination automatically)
   */
  async getProjects(): Promise<JiraProject[]> {
    try {
      const allProjects: JiraProject[] = [];
      let startAt = 0;
      const maxResults = 100; // Fetch more per page for efficiency
      let isLast = false;

      while (!isLast) {
        // Projects rarely change, cache for 15 minutes
        const response = await this.request<unknown>(
          `/project/search?startAt=${startAt}&maxResults=${maxResults}`,
          { ttl: TTL.LONG }
        );

        // Validate response with Zod
        const validated = JiraProjectsResponseSchema.parse(response);

        const projects = validated.values.map((p) => ({
          id: p.id,
          key: p.key,
          name: p.name,
          description: p.description,
          avatarUrl: p.avatarUrls?.["48x48"],
          projectTypeKey: p.projectTypeKey,
          lead: p.lead ? this.normalizeUser(p.lead) : undefined,
        }));

        allProjects.push(...projects);

        // Check if we've fetched all projects
        isLast = validated.isLast ?? (projects.length < maxResults);
        startAt += maxResults;

        // Safety limit to prevent infinite loops
        if (allProjects.length > 1000) {
          logger.warn("Reached safety limit of 1000 projects");
          break;
        }
      }

      logger.debug(`Fetched ${allProjects.length} projects`);
      return allProjects;
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
   * Get unassigned issues for a project
   * Returns issues that have no assignee, limited to recent unresolved ones
   */
  async getProjectUnassignedIssues(projectKey: string, maxResults: number = 20): Promise<JiraIssue[]> {
    try {
      return this.searchIssues({
        jql: `project = "${projectKey}" AND assignee IS EMPTY AND resolution = Unresolved ORDER BY priority DESC, created DESC`,
        maxResults,
      });
    } catch (error) {
      logger.error(`Failed to get unassigned issues for project ${projectKey}:`, error);
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
  async getIssueTypes(projectKeyOrId: string): Promise<JiraIssueType[]> {
    try {
      // Issue types rarely change, cache for 30 minutes
      const response = await this.request<unknown>(
        `/issuetype/project?projectId=${projectKeyOrId}`,
        { ttl: TTL.VERY_LONG }
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
        logger.error(`Invalid issue types response for ${projectKeyOrId}:`, error);
      } else {
        logger.error(`Failed to get issue types for ${projectKeyOrId}:`, error);
      }
      return [];
    }
  }

  /**
   * Get priorities
   */
  async getPriorities(): Promise<JiraPriority[]> {
    try {
      // Priorities rarely change, cache for 30 minutes
      const response = await this.request<unknown>("/priority", { ttl: TTL.VERY_LONG });

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
      // Statuses rarely change, cache for 15 minutes
      const response = await this.request<unknown>(
        `/project/${projectKey}/statuses`,
        { ttl: TTL.LONG }
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
  
  // Track if Agile API is available (Jira Software vs Jira Core)
  private agileApiAvailable: boolean | null = null;

  /**
   * Check if Agile API is available (Jira Software feature)
   * Returns false if instance is Jira Core only
   */
  async isAgileAvailable(): Promise<boolean> {
    if (this.agileApiAvailable !== null) {
      return this.agileApiAvailable;
    }

    try {
      const agileBaseUrl = this.getApiBaseUrl().replace(
        "/rest/api/3",
        "/rest/agile/1.0"
      );
      const response = await fetch(`${agileBaseUrl}/board?maxResults=1`, {
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
      });

      // 403 or 404 means Agile API not available (Jira Core)
      this.agileApiAvailable = response.ok || response.status === 400;
      
      if (!this.agileApiAvailable) {
        logger.info("Jira Agile API not available - this may be Jira Core (no Software features)");
      }
      
      return this.agileApiAvailable;
    } catch {
      this.agileApiAvailable = false;
      return false;
    }
  }

  /**
   * Get boards accessible to the user (handles pagination automatically)
   * Returns empty array if Agile features not available
   */
  async getBoards(projectKey?: string): Promise<JiraBoard[]> {
    // Check if Agile API is available first
    if (!(await this.isAgileAvailable())) {
      logger.debug("Skipping getBoards - Agile API not available");
      return [];
    }

    try {
      const allBoards: JiraBoard[] = [];
      let startAt = 0;
      const maxResults = 100; // Fetch more per page for efficiency
      let isLast = false;

      // Note: Agile API is not in /rest/api/3, it's in /rest/agile/1.0
      const agileBaseUrl = this.getApiBaseUrl().replace(
        "/rest/api/3",
        "/rest/agile/1.0"
      );

      while (!isLast) {
        let endpoint = `/board?startAt=${startAt}&maxResults=${maxResults}`;
        if (projectKey) {
          endpoint += `&projectKeyOrId=${projectKey}`;
        }

        const url = `${agileBaseUrl}${endpoint}`;

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...this.getAuthHeaders(),
          },
        });

        if (!response.ok) {
          // Don't log error for expected "no boards" cases
          if (response.status === 404) {
            logger.debug("No boards found");
            return allBoards;
          }
          throw new Error(`Failed to get boards: ${response.statusText}`);
        }

        const data = (await response.json()) as unknown;

        // Validate response with Zod
        const validated = JiraBoardsResponseSchema.parse(data);

        const boards = validated.values.map((b): JiraBoard => ({
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

        allBoards.push(...boards);

        // Check if we've fetched all boards
        isLast = validated.isLast ?? (boards.length < maxResults);
        startAt += maxResults;

        // Safety limit to prevent infinite loops
        if (allBoards.length > 500) {
          logger.warn("Reached safety limit of 500 boards");
          break;
        }
      }

      logger.debug(`Fetched ${allBoards.length} boards`);
      return allBoards;
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
   * Note: Kanban boards don't support sprints and return 400 Bad Request
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
        // 400 Bad Request is expected for Kanban boards (they don't have sprints)
        // 404 Not Found can also occur for boards without sprint support
        if (response.status === 400 || response.status === 404) {
          logger.debug(`Board ${boardId} does not support sprints (${response.status})`);
          return [];
        }
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

  /**
   * Get issues in a specific sprint
   */
  async getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
    try {
      const agileBaseUrl = this.getApiBaseUrl().replace(
        "/rest/api/3",
        "/rest/agile/1.0"
      );
      const url = `${agileBaseUrl}/sprint/${sprintId}/issue?maxResults=100`;

      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sprint issues: ${response.statusText}`);
      }

      const data = await response.json() as { issues?: any[] };
      return data.issues?.map((issue: any) => this.normalizeIssue(issue)) || [];
    } catch (error) {
      logger.error(`Failed to fetch issues for sprint ${sprintId}`, error);
      return [];
    }
  }

  /**
   * Get my issues in the current sprint
   */
  async getMySprintIssues(sprintId: number): Promise<JiraIssue[]> {
    const allIssues = await this.getSprintIssues(sprintId);
    const currentUser = await this.getCurrentUser();
    
    if (!currentUser) {
      return [];
    }

    return allIssues.filter(
      (issue) => issue.assignee?.accountId === currentUser.accountId
    );
  }

  /**
   * Get unassigned issues in the current sprint
   */
  async getSprintUnassignedIssues(sprintId: number): Promise<JiraIssue[]> {
    const allIssues = await this.getSprintIssues(sprintId);
    return allIssues.filter((issue) => !issue.assignee);
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
      description: this.serializeADF(fields.description),
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
      issueLinks: this.normalizeIssueLinks(fields.issuelinks),
      comments: fields.comment?.comments?.map((c) => ({
        id: c.id,
        body: this.serializeADF(c.body),
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
   * Normalize Jira issue links to our internal structure
   */
  private normalizeIssueLinks(links: JiraApiIssueLink[] | undefined): JiraIssueLink[] {
    if (!links || links.length === 0) {
      return [];
    }

    return links.map((link) => {
      // Determine direction and get the linked issue
      const isInward = !!link.inwardIssue;
      const linkedIssue = isInward ? link.inwardIssue! : link.outwardIssue!;

      return {
        id: link.id,
        type: {
          id: link.type.id,
          name: link.type.name,
          inward: link.type.inward,
          outward: link.type.outward,
        },
        direction: isInward ? "inward" as const : "outward" as const,
        linkedIssue: {
          id: linkedIssue.id,
          key: linkedIssue.key,
          summary: linkedIssue.fields.summary,
          status: {
            id: linkedIssue.fields.status.id,
            name: linkedIssue.fields.status.name,
            description: linkedIssue.fields.status.description,
            statusCategory: linkedIssue.fields.status.statusCategory,
          },
          issueType: {
            id: linkedIssue.fields.issuetype.id,
            name: linkedIssue.fields.issuetype.name,
            description: linkedIssue.fields.issuetype.description,
            iconUrl: linkedIssue.fields.issuetype.iconUrl,
            subtask: linkedIssue.fields.issuetype.subtask,
          },
        },
      };
    });
  }

  /**
   * Serialize ADF to JSON string for webview rendering
   * Keep the ADF structure intact so it can be parsed and rendered with syntax highlighting
   */
  private serializeADF(adf: JiraApiADF | string | undefined | null): string {
    if (!adf) {
      return "";
    }

    if (typeof adf === "string") {
      return adf;
    }

    // Convert ADF object to JSON string so webview can parse and render it
    return JSON.stringify(adf);
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

  // ==================== Issue Link Operations ====================

  /**
   * Get available issue link types
   */
  async getIssueLinkTypes(): Promise<JiraIssueLinkType[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await this.request<{
        issueLinkTypes: Array<{
          id: string;
          name: string;
          inward: string;
          outward: string;
        }>;
      }>("/issueLinkType", { ttl: TTL.LONG }); // Link types rarely change, cache for 15 min

      return response.issueLinkTypes || [];
    } catch (error) {
      logger.error("[Jira Cloud] Failed to get issue link types:", error);
      return [];
    }
  }

  /**
   * Create a link between two issues
   * @param sourceIssueKey The issue from which the link originates
   * @param targetIssueKey The issue to which the link points
   * @param linkTypeName The name of the link type (e.g., "Blocks", "Relates")
   * @param isOutward Whether the sourceIssue is the outward side of the link
   */
  async createIssueLink(
    sourceIssueKey: string,
    targetIssueKey: string,
    linkTypeName: string,
    isOutward: boolean
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      // For Jira, the link body specifies:
      // - type: { name: "LinkTypeName" }
      // - inwardIssue: The issue that "receives" the relation (e.g., is blocked by)
      // - outwardIssue: The issue that "gives" the relation (e.g., blocks)
      const body = isOutward
        ? {
            type: { name: linkTypeName },
            outwardIssue: { key: sourceIssueKey },
            inwardIssue: { key: targetIssueKey },
          }
        : {
            type: { name: linkTypeName },
            inwardIssue: { key: sourceIssueKey },
            outwardIssue: { key: targetIssueKey },
          };

      await this.request("/issueLink", {
        method: "POST",
        body,
        skipCache: true,
      });

      // Invalidate issue cache to refresh links
      this.invalidateCache("issue");

      return true;
    } catch (error) {
      logger.error(`[Jira Cloud] Failed to create issue link:`, error);
      return false;
    }
  }

  /**
   * Delete an issue link
   * @param linkId The ID of the link to delete
   */
  async deleteIssueLink(linkId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.request(`/issueLink/${linkId}`, {
        method: "DELETE",
        skipCache: true,
      });

      // Invalidate issue cache to refresh links
      this.invalidateCache("issue");

      return true;
    } catch (error) {
      logger.error(`[Jira Cloud] Failed to delete issue link:`, error);
      return false;
    }
  }
}

