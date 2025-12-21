/**
 * Jira Server/Data Center Client
 * 
 * Implementation for self-hosted Jira Server and Data Center using REST API v2.
 * 
 * Key Differences from Cloud:
 * - Uses REST API v2 (/rest/api/2/) instead of v3
 * - Self-hosted URL (e.g., http://jira.company.com)
 * - Authentication: Basic Auth (username:password) or Personal Access Token (8.14+)
 * - Version-dependent features (8.0, 8.20, 9.4, 9.12)
 * - Custom field IDs vary per instance
 * 
 * Strategy:
 * 1. Detect server version on connection
 * 2. Build capability map based on version
 * 3. Adapt API calls based on capabilities
 * 4. Dynamic field mapping for custom fields
 * 
 * See: docs/planning/JIRA_VERSION_COMPATIBILITY.md
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
  JiraIssueLink,
  JiraIssueLinkType,
} from "../common/types";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

// ==================== Server Info & Capabilities ====================

/**
 * Jira Server version information
 */
export interface JiraServerInfo {
  version: string; // "9.12.0"
  versionNumbers: number[]; // [9, 12, 0]
  buildNumber: number; // 912000
  deploymentType: string; // "Server" or "Cloud"
  baseUrl: string;
  serverTitle: string;
}

/**
 * Feature capabilities based on server version
 */
export interface JiraCapabilities {
  // Core features (all supported versions)
  basicAuth: boolean;
  issueSearch: boolean;
  issueCreate: boolean;
  issueUpdate: boolean;
  comments: boolean;

  // Authentication methods
  personalAccessTokens: boolean; // 8.14+
  
  // Content format
  richTextEditor: boolean; // 8.0+ (ADF format)
  
  // Advanced features
  bulkOperations: boolean; // 8.5+
  advancedJQL: boolean; // 8.0+
  customFieldSchemas: boolean; // 9.0+
  workflowProperties: boolean; // 8.20+
  
  // Agile features
  agileAPI: boolean; // 8.0+
  sprint: boolean;
  epic: boolean;
}

/**
 * Detected custom field mappings
 */
export interface JiraFieldMapping {
  epicLink?: string; // e.g., "customfield_10000"
  storyPoints?: string; // e.g., "customfield_10002"
  sprint?: string; // e.g., "customfield_10001"
}

// ==================== Client Implementation ====================

export class JiraServerClient extends BaseJiraClient {
  private static instance: JiraServerClient | null = null;
  
  // Configuration
  private baseUrl: string = "";
  private username: string = "";
  private password: string = ""; // Can be password or PAT
  
  // Server metadata
  private serverInfo: JiraServerInfo | null = null;
  private capabilities: JiraCapabilities | null = null;
  private fieldMapping: JiraFieldMapping = {};
  
  // Authentication state
  private authMethod: "basic" | "pat" | null = null;

  private constructor() {
    super();
  }

  /**
   * Get or create singleton instance
   */
  static async create(): Promise<JiraServerClient> {
    if (!JiraServerClient.instance) {
      JiraServerClient.instance = new JiraServerClient();
      await JiraServerClient.instance.initialize();
    }
    return JiraServerClient.instance;
  }

  /**
   * Reset singleton instance (useful after configuration changes)
   */
  static reset(): void {
    JiraServerClient.instance = null;
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
    const config = vscode.workspace.getConfiguration("devBuddy");
    
    // Get server URL
    this.baseUrl = config.get<string>("jira.server.baseUrl", "");
    if (!this.baseUrl) {
      logger.warn("Jira Server base URL not configured");
      return;
    }
    
    // Remove trailing slash
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
    
    // Get username from settings
    this.username = config.get<string>("jira.server.username", "");
    
    // Get password/token from secure storage
    const context = (global as any).devBuddyContext as vscode.ExtensionContext;
    logger.debug(`JiraServerClient.initialize: context=${!!context}, secrets=${!!context?.secrets}`);
    if (context?.secrets) {
      this.password = (await context.secrets.get("jiraServerPassword")) || "";
      logger.debug(`JiraServerClient.initialize: password loaded from secrets: ${this.password ? 'YES' : 'NO'}`);
    } else {
      logger.warn("JiraServerClient.initialize: No context.secrets available!");
    }
    
    logger.debug(`JiraServerClient.initialize: baseUrl=${this.baseUrl}, username=${this.username}, hasPassword=${!!this.password}`);
    
    // If configured, detect server version and capabilities
    if (this.isConfigured()) {
      try {
        await this.detectServerInfo();
      } catch (error) {
        logger.error("Failed to detect Jira Server version", error);
      }
    }
  }

  // ==================== Configuration ====================

  protected getApiBaseUrl(): string {
    return `${this.baseUrl}/rest/api/2`;
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this.username || !this.password) {
      return {};
    }

    logger.debug(`getAuthHeaders: authMethod="${this.authMethod}", PAT supported=${this.capabilities?.personalAccessTokens}`);

    // Use the negotiated auth method, or try PAT if supported
    if (this.authMethod === "basic") {
      // Explicitly use Basic Auth
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64");
      logger.debug("Using Basic Auth headers");
      return {
        "Authorization": `Basic ${credentials}`,
      };
    } else if (this.authMethod === "pat" || (this.capabilities?.personalAccessTokens && !this.authMethod)) {
      // Use PAT (either explicitly set or if PAT is supported and no method chosen yet)
      logger.debug("Using PAT (Bearer) headers");
      return {
        "Authorization": `Bearer ${this.password}`,
      };
    } else {
      // Default to Basic Auth
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64");
      logger.debug("Using Basic Auth headers (default)");
      return {
        "Authorization": `Basic ${credentials}`,
      };
    }
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.username && this.password);
  }

  /**
   * Get server information and version
   */
  private async detectServerInfo(): Promise<void> {
    try {
      const response = await this.request<any>("/serverInfo");
      
      this.serverInfo = {
        version: response.version,
        versionNumbers: response.versionNumbers,
        buildNumber: response.buildNumber,
        deploymentType: response.deploymentType,
        baseUrl: response.baseUrl,
        serverTitle: response.serverTitle,
      };
      
      logger.info(`Connected to Jira Server ${this.serverInfo.version}`);
      
      // Detect capabilities based on version
      this.capabilities = this.detectCapabilities();
      
      // Validate minimum version
      if (!this.isVersionSupported()) {
        vscode.window.showWarningMessage(
          `Jira Server ${this.serverInfo.version} is not fully supported. ` +
          `DevBuddy requires Jira Server 8.0 or later for all features. ` +
          `Some features may not work correctly.`,
          "Learn More"
        ).then((action) => {
          if (action === "Learn More") {
            vscode.env.openExternal(
              vscode.Uri.parse("https://github.com/angelo-hub/devbuddy/docs/JIRA_VERSION_COMPATIBILITY.md")
            );
          }
        });
      }
      
      // Determine best authentication method
      await this.negotiateAuthMethod();
      
    } catch (error) {
      logger.error("Failed to detect Jira Server info", error);
      throw error;
    }
  }

  /**
   * Check if server version is supported
   */
  private isVersionSupported(): boolean {
    if (!this.serverInfo) return false;
    
    const [major] = this.serverInfo.versionNumbers;
    
    // Support Jira Server 8.0+
    return major >= 8;
  }

  /**
   * Detect feature capabilities based on server version
   */
  private detectCapabilities(): JiraCapabilities {
    if (!this.serverInfo) {
      return this.getDefaultCapabilities();
    }
    
    const [major, minor] = this.serverInfo.versionNumbers;
    
    return {
      // Core (always true for supported versions)
      basicAuth: true,
      issueSearch: true,
      issueCreate: true,
      issueUpdate: true,
      comments: true,
      
      // Version-gated features
      personalAccessTokens: this.checkVersion(major, minor, 8, 14),
      
      // Rich text editor capability
      // NOTE: This indicates the server version CAN support rich text/ADF,
      // but individual projects may still use Wiki Markup format.
      // Use getProjectDescriptionFormat() to detect actual project format.
      richTextEditor: false, // Jira Server uses Wiki Markup (not ADF like Cloud)
      
      bulkOperations: this.checkVersion(major, minor, 8, 5),
      advancedJQL: major >= 8,
      customFieldSchemas: major >= 9,
      workflowProperties: this.checkVersion(major, minor, 8, 20),
      agileAPI: major >= 8,
      sprint: true,
      epic: true,
    };
  }

  /**
   * Get default capabilities (assume oldest supported version)
   */
  private getDefaultCapabilities(): JiraCapabilities {
    return {
      basicAuth: true,
      issueSearch: true,
      issueCreate: true,
      issueUpdate: true,
      comments: true,
      personalAccessTokens: false,
      richTextEditor: false, // Jira Server does NOT support ADF
      bulkOperations: true,
      advancedJQL: true,
      customFieldSchemas: false,
      workflowProperties: false,
      agileAPI: true,
      sprint: true,
      epic: true,
    };
  }

  /**
   * Check if version meets minimum requirement
   */
  private checkVersion(
    actualMajor: number,
    actualMinor: number,
    requiredMajor: number,
    requiredMinor: number
  ): boolean {
    if (actualMajor > requiredMajor) return true;
    if (actualMajor === requiredMajor) return actualMinor >= requiredMinor;
    return false;
  }

  /**
   * Try to determine best authentication method
   */
  private async negotiateAuthMethod(): Promise<void> {
    if (!this.capabilities) return;
    
    logger.debug(`negotiateAuthMethod: Starting negotiation (PAT supported: ${this.capabilities.personalAccessTokens})`);
    
    // If PAT supported, try that first
    if (this.capabilities.personalAccessTokens) {
        this.authMethod = "pat";
      logger.debug("negotiateAuthMethod: Trying PAT authentication...");
      const user = await this.getCurrentUser();
      
      if (user) {
        // PAT worked!
        logger.info("Using Personal Access Token authentication");
        logger.debug(`negotiateAuthMethod: PAT success, authenticated as ${user.displayName}`);
        return;
      } else {
        // PAT failed, fall back to Basic Auth
        logger.debug("negotiateAuthMethod: PAT auth failed (user is null), falling back to Basic Auth");
      }
    }
    
    // Fall back to Basic Auth
    this.authMethod = "basic";
    logger.info("Using Basic Authentication");
    logger.debug(`negotiateAuthMethod: Set authMethod to "${this.authMethod}"`);
  }

  /**
   * Detect custom field mappings for a project
   */
  async detectFieldMapping(projectKey: string): Promise<void> {
    try {
      // Get create metadata for project
      const response = await this.request<any>(
        `/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`
      );
      
      if (!response.projects || response.projects.length === 0) {
        logger.warn(`No metadata found for project ${projectKey}`);
        return;
      }
      
      const project = response.projects[0];
      const issueType = project.issuetypes?.[0];
      
      if (!issueType?.fields) {
        return;
      }
      
      // Scan for common custom fields
      this.fieldMapping = {};
      
      for (const [fieldId, fieldData] of Object.entries(issueType.fields)) {
        const field = fieldData as any;
        
        // Epic Link
        if (field.name === "Epic Link" || field.key === "epic") {
          this.fieldMapping.epicLink = fieldId;
        }
        
        // Story Points
        if (field.name?.includes("Story Points") || field.name?.includes("Estimate")) {
          this.fieldMapping.storyPoints = fieldId;
        }
        
        // Sprint
        if (field.name === "Sprint") {
          this.fieldMapping.sprint = fieldId;
        }
      }
      
    } catch (error) {
      logger.error("Failed to detect field mapping", error);
    }
  }

  // ==================== Issue Operations ====================

  async getIssue(key: string): Promise<JiraIssue | null> {
    try {
      const response = await this.request<any>(`/issue/${key}?expand=renderedFields`);
      // Debug: Log description format
      logger.warn(`[JiraServerClient] getIssue: response=${JSON.stringify(response)}`);
      // if (response.fields?.description) {
        // logger.debug(`=== Issue ${key} Description Format ===`);
        // logger.debug(`Description type: ${typeof response.fields.description}`);
        // logger.debug(`Description value: ${JSON.stringify(response.fields.description, null, 2).substring(0, 500)}`);
        // if (response.renderedFields?.description) {
          // logger.debug(`Rendered description: ${response.renderedFields.description.substring(0, 300)}`);
        // }
        // logger.debug(`=== End Description Debug ===`);
      // }
      
      return this.normalizeIssue(response);
    } catch (error) {
      logger.error(`Failed to fetch issue ${key}`, error);
      return null;
    }
  }

  async searchIssues(options: JiraSearchOptions): Promise<JiraIssue[]> {
    try {
      const jql = this.buildJQL(options);
      const maxResults = options.maxResults || 50;
      const startAt = options.startAt || 0;

      const response = await this.request<any>(
        `/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&startAt=${startAt}&expand=renderedFields`
      );

      return response.issues?.map((issue: any) => this.normalizeIssue(issue)) || [];
    } catch (error) {
      logger.error("Failed to search issues", error);
      return [];
    }
  }

  async getMyIssues(): Promise<JiraIssue[]> {
    return this.searchIssues({
      jql: "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC",
    });
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

  async createIssue(input: CreateJiraIssueInput): Promise<JiraIssue | null> {
    try {
      const fields: any = {
        project: { key: input.projectKey },
        summary: input.summary,
        issuetype: { id: input.issueTypeId },
      };

      // Description (version-aware)
      if (input.description || input.descriptionADF) {
        fields.description = this.formatDescription(input.description, input.descriptionADF);
        logger.debug(`Description field type: ${typeof fields.description}`);
        logger.debug(`Description field value: ${JSON.stringify(fields.description).substring(0, 200)}`);
      }

      // Optional fields
      if (input.priorityId) {
        fields.priority = { id: input.priorityId };
      }

      if (input.assigneeId) {
        fields.assignee = { accountId: input.assigneeId };
      }

      if (input.labels && input.labels.length > 0) {
        fields.labels = input.labels;
      }

      if (input.dueDate) {
        fields.duedate = input.dueDate;
      }

      // Custom fields (if any)
      if (input.customFields) {
        Object.assign(fields, input.customFields);
      }

      // Epic link (using detected field mapping)
      if (input.epicKey && this.fieldMapping.epicLink) {
        fields[this.fieldMapping.epicLink] = input.epicKey;
      }

      // Sprint (using detected field mapping)
      if (input.sprintId && this.fieldMapping.sprint) {
        fields[this.fieldMapping.sprint] = input.sprintId;
      }

      // Parent (for subtasks)
      if (input.parentKey) {
        fields.parent = { key: input.parentKey };
      }

      const response = await this.request<any>("/issue", {
        method: "POST",
        body: JSON.stringify({ fields }),
        skipCache: true,
      });

      // Fetch the created issue to get full details
      if (response.key) {
        // Invalidate cache after creating issue
        this.invalidateAfterMutation(response.key);
        return this.getIssue(response.key);
      }

      return null;
    } catch (error) {
      logger.error("Failed to create issue", error);
      return null;
    }
  }

  async updateIssue(key: string, input: UpdateJiraIssueInput): Promise<boolean> {
    try {
      const fields: any = {};

      if (input.summary !== undefined) {
        fields.summary = input.summary;
      }

      if (input.description !== undefined || input.descriptionADF !== undefined) {
        fields.description = this.formatDescription(input.description, input.descriptionADF);
      }

      if (input.priorityId !== undefined) {
        fields.priority = { id: input.priorityId };
      }

      if (input.assigneeId !== undefined) {
        fields.assignee = input.assigneeId ? { accountId: input.assigneeId } : null;
      }

      if (input.labels !== undefined) {
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
        skipCache: true,
      });

      // Invalidate cache after updating issue
      this.invalidateAfterMutation(key);

      return true;
    } catch (error) {
      logger.error(`Failed to update issue ${key}`, error);
      return false;
    }
  }

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

      return true;
    } catch (error) {
      logger.error(`Failed to transition issue ${key}`, error);
      return false;
    }
  }

  async getTransitions(key: string): Promise<JiraTransition[]> {
    try {
      const response = await this.request<any>(`/issue/${key}/transitions`);
      return response.transitions?.map((t: any) => this.normalizeTransition(t)) || [];
    } catch (error) {
      logger.error(`Failed to get transitions for ${key}`, error);
      return [];
    }
  }

  async addComment(key: string, body: string): Promise<JiraComment | null> {
    try {
      const formattedBody = this.formatCommentBody(body);

      const response = await this.request<any>(`/issue/${key}/comment`, {
        method: "POST",
        body: JSON.stringify({ body: formattedBody }),
      });

      return this.normalizeComment(response);
    } catch (error) {
      logger.error(`Failed to add comment to ${key}`, error);
      return null;
    }
  }

  async deleteIssue(key: string): Promise<boolean> {
    try {
      await this.request(`/issue/${key}`, {
        method: "DELETE",
        skipCache: true,
      });

      // Invalidate cache after deletion
      this.invalidateAfterMutation(key);

      return true;
    } catch (error) {
      logger.error(`Failed to delete issue ${key}`, error);
      return false;
    }
  }

  // ==================== Project Operations ====================

  async getProjects(): Promise<JiraProject[]> {
    try {
      // Projects rarely change, cache for 15 minutes
      const response = await this.request<any>("/project", { ttl: TTL.LONG });
      return response.map((p: any) => this.normalizeProject(p));
    } catch (error) {
      logger.error("Failed to fetch projects", error);
      return [];
    }
  }

  async getProject(key: string): Promise<JiraProject | null> {
    try {
      const response = await this.request<any>(`/project/${key}`);
      return this.normalizeProject(response);
    } catch (error) {
      logger.error(`Failed to fetch project ${key}`, error);
      return null;
    }
  }

  // ==================== User Operations ====================

  async getCurrentUser(): Promise<JiraUser | null> {
    try {
      const response = await this.request<any>("/myself");
      return this.normalizeUser(response);
    } catch (error) {
      logger.error("Failed to fetch current user", error);
      return null;
    }
  }

  async searchUsers(query: string, projectKey?: string): Promise<JiraUser[]> {
    try {
      // Jira Server API uses 'username' parameter, not 'query'
      // See: https://docs.atlassian.com/software/jira/docs/api/REST/8.20.0/#api/2/user-findUsers
      
      // If no query provided, use wildcard to get all users (or project-specific users)
      const searchTerm = query || ".";  // "." is a wildcard in Jira Server
      
      let endpoint = `/user/search?username=${encodeURIComponent(searchTerm)}`;
      if (projectKey) {
        endpoint += `&project=${projectKey}`;
      }

      logger.debug(`Searching users with endpoint: ${endpoint}`);
      const response = await this.request<any>(endpoint);
      logger.debug(`User search response: ${Array.isArray(response) ? response.length : 0} users`);
      
      return Array.isArray(response) ? response.map((u: any) => this.normalizeUser(u)) : [];
    } catch (error) {
      logger.error("Failed to search users", error);
      return [];
    }
  }

  // ==================== Metadata Operations ====================

  async getIssueTypes(projectKeyOrId: string): Promise<JiraIssueType[]> {
    try {
      // Issue types rarely change, cache for 30 minutes
      const response = await this.request<any>(`/project/${projectKeyOrId}`, { ttl: TTL.VERY_LONG });
      return response.issueTypes?.map((it: any) => this.normalizeIssueType(it)) || [];
    } catch (error) {
      logger.error(`Failed to fetch issue types for ${projectKeyOrId}`, error);
      return [];
    }
  }

  async getPriorities(): Promise<JiraPriority[]> {
    try {
      // Priorities rarely change, cache for 30 minutes
      const response = await this.request<any>("/priority", { ttl: TTL.VERY_LONG });
      return response.map((p: any) => this.normalizePriority(p));
    } catch (error) {
      logger.error("Failed to fetch priorities", error);
      return [];
    }
  }

  async getStatuses(projectKey: string): Promise<JiraStatus[]> {
    try {
      // Statuses rarely change, cache for 15 minutes
      const response = await this.request<any>(`/project/${projectKey}/statuses`, { ttl: TTL.LONG });
      
      // Extract unique statuses from all issue types
      const statusMap = new Map<string, any>();
      
      if (Array.isArray(response)) {
        response.forEach((issueTypeStatuses: any) => {
          issueTypeStatuses.statuses?.forEach((status: any) => {
            if (!statusMap.has(status.id)) {
              statusMap.set(status.id, status);
            }
          });
        });
      }
      
      return Array.from(statusMap.values()).map((s) => this.normalizeStatus(s));
    } catch (error) {
      logger.error(`Failed to fetch statuses for ${projectKey}`, error);
      return [];
    }
  }

  // ==================== Agile Operations ====================

  async getBoards(projectKey?: string): Promise<JiraBoard[]> {
    if (!this.capabilities?.agileAPI) {
      logger.warn("Agile API not supported on this Jira Server version");
      return [];
    }

    try {
      const allBoards: JiraBoard[] = [];
      let startAt = 0;
      const maxResults = 100;
      let isLast = false;

      while (!isLast) {
        let endpoint = `/rest/agile/1.0/board?startAt=${startAt}&maxResults=${maxResults}`;
        if (projectKey) {
          endpoint += `&projectKeyOrId=${projectKey}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch boards: ${response.statusText}`);
        }

        const data = await response.json() as { values?: any[]; isLast?: boolean };
        const boards = data.values?.map((b: any) => this.normalizeBoard(b)) || [];
        allBoards.push(...boards);

        // Check if we've fetched all boards
        isLast = data.isLast ?? (boards.length < maxResults);
        startAt += maxResults;

        // Safety limit
        if (allBoards.length > 500) {
          logger.warn("Reached safety limit of 500 boards");
          break;
        }
      }

      logger.debug(`Fetched ${allBoards.length} boards`);
      return allBoards;
    } catch (error) {
      logger.error("Failed to fetch boards", error);
      return [];
    }
  }

  async getSprints(boardId: number): Promise<JiraSprint[]> {
    if (!this.capabilities?.sprint) {
      logger.warn("Sprint feature not supported on this Jira Server version");
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/rest/agile/1.0/board/${boardId}/sprint`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        // 400 Bad Request is expected for Kanban boards (they don't have sprints)
        // 404 Not Found can also occur for boards without sprint support
        if (response.status === 400 || response.status === 404) {
          logger.debug(`Board ${boardId} does not support sprints (${response.status})`);
          return [];
        }
        throw new Error(`Failed to fetch sprints: ${response.statusText}`);
      }

      const data = await response.json() as { values?: any[] };
      return data.values?.map((s: any) => this.normalizeSprint(s)) || [];
    } catch (error) {
      logger.error(`Failed to fetch sprints for board ${boardId}`, error);
      return [];
    }
  }

  async getActiveSprint(boardId: number): Promise<JiraSprint | null> {
    const sprints = await this.getSprints(boardId);
    return sprints.find((s) => s.state === "active") || null;
  }

  /**
   * Get issues in a specific sprint
   */
  async getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
    if (!this.capabilities?.sprint) {
      logger.warn("Sprint feature not supported on this Jira Server version");
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue?maxResults=100`,
        {
          headers: {
            "Accept": "application/json",
            ...this.getAuthHeaders(),
          },
        }
      );

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
   * Get server information (public accessor)
   */
  getServerInfo(): JiraServerInfo | null {
    return this.serverInfo;
  }

  /**
   * Get capabilities (public accessor)
   */
  getCapabilities(): JiraCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get field mapping (public accessor)
   */
  getFieldMapping(): JiraFieldMapping {
    return this.fieldMapping;
  }

  /**
   * Build JQL query from search options
   */
  private buildJQL(options: JiraSearchOptions): string {
    if (options.jql) {
      return options.jql;
    }

    const conditions: string[] = [];

    if (options.projectKeys && options.projectKeys.length > 0) {
      const keys = options.projectKeys.map((k) => `"${k}"`).join(", ");
      conditions.push(`project IN (${keys})`);
    }

    if (options.issueTypes && options.issueTypes.length > 0) {
      const types = options.issueTypes.map((t) => `"${t}"`).join(", ");
      conditions.push(`issuetype IN (${types})`);
    }

    if (options.statuses && options.statuses.length > 0) {
      const statuses = options.statuses.map((s) => `"${s}"`).join(", ");
      conditions.push(`status IN (${statuses})`);
    }

    if (options.assigneeIds && options.assigneeIds.length > 0) {
      if (options.assigneeIds.length === 1) {
        conditions.push(`assignee = "${options.assigneeIds[0]}"`);
      } else {
        const assignees = options.assigneeIds.map((a) => `"${a}"`).join(", ");
        conditions.push(`assignee IN (${assignees})`);
      }
    }

    if (options.labels && options.labels.length > 0) {
      options.labels.forEach((label) => {
        conditions.push(`labels = "${label}"`);
      });
    }

    return conditions.length > 0 ? conditions.join(" AND ") : "project IS NOT EMPTY";
  }

  /**
   * Format description based on server capabilities
   * NOTE: Jira Server does NOT support ADF (Atlassian Document Format)
   * ADF is a Cloud-only feature. We must convert to plain text.
   * See: https://jira.atlassian.com/browse/JRASERVER-72835
   */
  private formatDescription(description?: string, descriptionADF?: any): any {
    // Jira Server does not support ADF - convert to plain text with formatting preserved
    if (descriptionADF) {
      logger.debug("Converting ADF to plain text for Jira Server (ADF not supported)");
      return this.extractTextFromADF(descriptionADF);
    }

    // If description string provided, use it as-is
    if (description) {
      logger.debug("Using plain text for description");
      return description;
    }

    return undefined;
  }

  /**
   * Extract plain text from ADF object with formatting preserved
   * Converts ADF structure to plain text while maintaining readability
   */
  private extractTextFromADF(adf: any): string {
    if (!adf || !adf.content) {
      return "";
    }

    const extractText = (node: any, depth: number = 0): string => {
      if (!node) return "";

      // Text node with potential marks (bold, italic, etc.)
      if (node.type === "text") {
        let text = node.text || "";
        
        // Preserve marks as plain text indicators
        if (node.marks && Array.isArray(node.marks)) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case "strong":
                text = `*${text}*`;
                break;
              case "em":
                text = `_${text}_`;
                break;
              case "code":
                text = `\`${text}\``;
                break;
              case "strike":
                text = `~${text}~`;
                break;
            }
          }
        }
        
        return text;
      }

      // Hard break
      if (node.type === "hardBreak") {
        return "\n";
      }

      // Node with content
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: any) => extractText(child, depth + 1)).join("");
      }

      return "";
    };

    // Process all content nodes
    const lines: string[] = [];
    
    for (const node of adf.content) {
      const text = extractText(node);
      
      // Add appropriate formatting based on node type
      switch (node.type) {
        case "heading": {
          const level = node.attrs?.level || 1;
          lines.push(`${"#".repeat(level)} ${text}`);
          lines.push(""); // Extra line after heading
          break;
        }
          
        case "paragraph":
          if (text.trim()) {
            lines.push(text);
            lines.push(""); // Extra line after paragraph
          }
          break;
          
        case "codeBlock": {
          const language = node.attrs?.language || "";
          lines.push(`\`\`\`${language}`);
          lines.push(text);
          lines.push("```");
          lines.push("");
          break;
        }
          
        case "bulletList":
        case "orderedList":
          // Lists are already processed by their list items
          if (text.trim()) {
            lines.push(text);
            lines.push("");
          }
          break;
          
        case "listItem":
          lines.push(`- ${text.trim()}`);
          break;
          
        case "blockquote": {
          const quoted = text.split("\n").map(line => `> ${line}`).join("\n");
          lines.push(quoted);
          lines.push("");
          break;
        }
          
        case "rule":
          lines.push("---");
          lines.push("");
          break;
          
        default:
          if (text.trim()) {
            lines.push(text);
            lines.push("");
          }
      }
    }

    return lines.join("\n").trim();
  }

  /**
   * Format comment body based on server capabilities
   * NOTE: Jira Server does NOT support ADF for comments either
   */
  private formatCommentBody(body: string): any {
    // Jira Server uses plain text for comments, not ADF
    return body;
  }

  /**
   * Convert markdown to ADF (Atlassian Document Format)
   * Simple implementation - can be enhanced
   */
  private convertMarkdownToADF(markdown: string): any {
    // Basic ADF structure
    const adf: any = {
      version: 1,
      type: "doc",
      content: [],
    };

    // Split by paragraphs
    const paragraphs = markdown.split("\n\n");

    for (const para of paragraphs) {
      if (!para.trim()) continue;

      adf.content.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: para.trim(),
          },
        ],
      });
    }

    return adf;
  }

  /**
   * Normalize Jira API issue to common format
   */
  private normalizeIssue(apiIssue: any): JiraIssue {
    const baseUrl = this.baseUrl;

    return {
      id: apiIssue.id,
      key: apiIssue.key,
      summary: apiIssue.fields.summary,
      description: this.extractDescription(apiIssue.fields.description, apiIssue.renderedFields?.description),
      issueType: this.normalizeIssueType(apiIssue.fields.issuetype),
      status: this.normalizeStatus(apiIssue.fields.status),
      priority: this.normalizePriority(apiIssue.fields.priority),
      assignee: apiIssue.fields.assignee ? this.normalizeUser(apiIssue.fields.assignee) : null,
      reporter: this.normalizeUser(apiIssue.fields.reporter),
      project: this.normalizeProject(apiIssue.fields.project),
      labels: apiIssue.fields.labels || [],
      created: apiIssue.fields.created,
      updated: apiIssue.fields.updated,
      dueDate: apiIssue.fields.duedate || null,
      url: `${baseUrl}/browse/${apiIssue.key}`,
      subtasks: apiIssue.fields.subtasks?.map((st: any) => ({
        id: st.id,
        key: st.key,
        summary: st.fields.summary,
        status: this.normalizeStatus(st.fields.status),
        issueType: this.normalizeIssueType(st.fields.issuetype),
      })),
      issueLinks: this.normalizeIssueLinks(apiIssue.fields.issuelinks),
    };
  }

  /**
   * Normalize Jira issue links to our internal structure
   */
  private normalizeIssueLinks(links: any[] | undefined): JiraIssueLink[] {
    if (!links || links.length === 0) {
      return [];
    }

    return links.map((link: any) => {
      // Determine direction and get the linked issue
      const isInward = !!link.inwardIssue;
      const linkedIssue = isInward ? link.inwardIssue : link.outwardIssue;

      if (!linkedIssue) {
        return null;
      }

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
          status: this.normalizeStatus(linkedIssue.fields.status),
          issueType: this.normalizeIssueType(linkedIssue.fields.issuetype),
        },
      };
    }).filter((link: JiraIssueLink | null): link is JiraIssueLink => link !== null);
  }

  /**
   * Extract description from API response (handle both ADF and plain text)
   */
  private extractDescription(description: any, renderedDescription?: string): string | null {
    if (!description) {
      return null;
    }

    // If plain string, return it
    if (typeof description === "string") {
      return description;
    }

    // If ADF format, try to extract text or use rendered HTML
    if (description.type === "doc" && description.content) {
      return renderedDescription || this.extractTextFromADF(description);
    }

    return renderedDescription || null;
  }

  /**
   * Normalize user
   */
  private normalizeUser(apiUser: any): JiraUser {
    return {
      accountId: apiUser.name || apiUser.accountId || apiUser.key,
      displayName: apiUser.displayName,
      emailAddress: apiUser.emailAddress,
      avatarUrl: apiUser.avatarUrls?.["48x48"],
      active: apiUser.active !== false,
    };
  }

  /**
   * Normalize project
   */
  private normalizeProject(apiProject: any): JiraProject {
    return {
      id: apiProject.id,
      key: apiProject.key,
      name: apiProject.name,
      description: apiProject.description,
      avatarUrl: apiProject.avatarUrls?.["48x48"],
      projectTypeKey: apiProject.projectTypeKey || "software",
      lead: apiProject.lead ? this.normalizeUser(apiProject.lead) : undefined,
    };
  }

  /**
   * Normalize status
   */
  private normalizeStatus(apiStatus: any): JiraStatus {
    return {
      id: apiStatus.id,
      name: apiStatus.name,
      description: apiStatus.description,
      statusCategory: {
        id: apiStatus.statusCategory.id,
        key: apiStatus.statusCategory.key,
        colorName: apiStatus.statusCategory.colorName,
        name: apiStatus.statusCategory.name,
      },
    };
  }

  /**
   * Normalize issue type
   */
  private normalizeIssueType(apiIssueType: any): JiraIssueType {
    return {
      id: apiIssueType.id,
      name: apiIssueType.name,
      description: apiIssueType.description,
      iconUrl: apiIssueType.iconUrl,
      subtask: apiIssueType.subtask || false,
    };
  }

  /**
   * Normalize priority
   */
  private normalizePriority(apiPriority: any): JiraPriority {
    return {
      id: apiPriority.id,
      name: apiPriority.name,
      iconUrl: apiPriority.iconUrl,
    };
  }

  /**
   * Normalize transition
   */
  private normalizeTransition(apiTransition: any): JiraTransition {
    return {
      id: apiTransition.id,
      name: apiTransition.name,
      to: this.normalizeStatus(apiTransition.to),
      hasScreen: apiTransition.hasScreen || false,
    };
  }

  /**
   * Normalize comment
   */
  private normalizeComment(apiComment: any): JiraComment {
    return {
      id: apiComment.id,
      body: this.extractDescription(apiComment.body, apiComment.renderedBody) || "",
      author: this.normalizeUser(apiComment.author),
      created: apiComment.created,
      updated: apiComment.updated,
    };
  }

  /**
   * Normalize board
   */
  private normalizeBoard(apiBoard: any): JiraBoard {
    return {
      id: apiBoard.id,
      name: apiBoard.name,
      type: apiBoard.type,
      location: apiBoard.location ? {
        projectId: apiBoard.location.projectId,
        projectKey: apiBoard.location.projectKey,
        projectName: apiBoard.location.projectName,
      } : undefined,
    };
  }

  /**
   * Normalize sprint
   */
  private normalizeSprint(apiSprint: any): JiraSprint {
    return {
      id: apiSprint.id,
      name: apiSprint.name,
      state: apiSprint.state,
      startDate: apiSprint.startDate,
      endDate: apiSprint.endDate,
      completeDate: apiSprint.completeDate,
      goal: apiSprint.goal,
    };
  }

  // ==================== Issue Link Operations ====================

  /**
   * Get available issue link types
   * Uses REST API v2: GET /rest/api/2/issueLinkType
   */
  async getIssueLinkTypes(): Promise<JiraIssueLinkType[]> {
    try {
      const response = await this.request<{ issueLinkTypes: Array<{
        id: string;
        name: string;
        inward: string;
        outward: string;
      }> }>(
        "/issueLinkType",
        { method: "GET", ttl: TTL.LONG }
      );

      return response.issueLinkTypes.map((linkType) => ({
        id: linkType.id,
        name: linkType.name,
        inward: linkType.inward,
        outward: linkType.outward,
      }));
    } catch (error) {
      logger.error("[Jira Server] Failed to get issue link types:", error);
      throw error;
    }
  }

  /**
   * Create a link between two issues
   * Uses REST API v2: POST /rest/api/2/issueLink
   * 
   * @param sourceIssueKey The issue from which the link originates
   * @param targetIssueKey The issue to which the link points
   * @param linkTypeName The name of the link type (e.g., "Blocks", "Relates")
   * @param isOutward If true, sourceIssue is outward (e.g., "blocks" targetIssue)
   *                  If false, sourceIssue is inward (e.g., "is blocked by" targetIssue)
   * @returns true if link was created successfully
   */
  async createIssueLink(
    sourceIssueKey: string,
    targetIssueKey: string,
    linkTypeName: string,
    isOutward: boolean = true
  ): Promise<boolean> {
    try {
      // For outward: source is outwardIssue, target is inwardIssue
      // For inward: source is inwardIssue, target is outwardIssue
      const body = {
        type: {
          name: linkTypeName,
        },
        outwardIssue: {
          key: isOutward ? sourceIssueKey : targetIssueKey,
        },
        inwardIssue: {
          key: isOutward ? targetIssueKey : sourceIssueKey,
        },
      };

      await this.request(
        "/issueLink",
        {
          method: "POST",
          body: JSON.stringify(body),
          skipCache: true,
        }
      );

      // Invalidate issue cache for both issues
      this.invalidateCache("issue");
      this.invalidateCache(`issue:${sourceIssueKey}`);
      this.invalidateCache(`issue:${targetIssueKey}`);

      logger.info(`[Jira Server] Created issue link: ${sourceIssueKey} --[${linkTypeName}]--> ${targetIssueKey}`);
      return true;
    } catch (error) {
      logger.error(`[Jira Server] Failed to create issue link:`, error);
      return false;
    }
  }

  /**
   * Delete an issue link by its ID
   * Uses REST API v2: DELETE /rest/api/2/issueLink/{linkId}
   * @returns true if link was deleted successfully
   */
  async deleteIssueLink(linkId: string): Promise<boolean> {
    try {
      await this.request(
        `/issueLink/${linkId}`,
        { method: "DELETE", skipCache: true }
      );

      // Invalidate issue cache
      this.invalidateCache("issue");

      logger.info(`[Jira Server] Deleted issue link: ${linkId}`);
      return true;
    } catch (error) {
      logger.error(`[Jira Server] Failed to delete issue link:`, error);
      return false;
    }
  }
}

