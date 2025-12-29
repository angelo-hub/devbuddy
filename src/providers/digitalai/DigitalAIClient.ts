/**
 * Digital.ai Agility Client
 *
 * Implementation for Digital.ai Agility REST API (rest-1.v1)
 * Documentation: https://docs.digital.ai/agility/docs/developerlibrary/002-getting-started-with-the-api
 *
 * Authentication: Access Tokens (recommended)
 * https://docs.digital.ai/agility/docs/developerlibrary/api-authentication
 */

import * as vscode from "vscode";
import {
  getHttpClient,
  TTLCache,
  TTL,
  generateCacheKey,
  HttpError,
} from "@shared/http";
import { getLogger } from "@shared/utils/logger";
import {
  DigitalAIStory,
  DigitalAIMember,
  DigitalAIScope,
  DigitalAITimebox,
  DigitalAITeam,
  DigitalAIStoryStatus,
  DigitalAIPriority,
  DigitalAIApiResponse,
  DigitalAINormalizedStory,
  DigitalAINormalizedUser,
  DigitalAINormalizedProject,
  DigitalAINormalizedSprint,
  DigitalAINormalizedTeam,
  DigitalAINormalizedStatus,
  DigitalAISearchOptions,
  CreateDigitalAIStoryInput,
  UpdateDigitalAIStoryInput,
  DigitalAIAssetState,
  mapAssetStateToType,
  mapPriorityFromName,
  extractIdFromOID,
  buildOID,
} from "./types";

const logger = getLogger();

/**
 * Request options with caching support
 */
export interface DigitalAIRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: object | string;
  headers?: Record<string, string>;
  /** TTL for caching (only applies to GET requests). Use 0 to skip cache. */
  ttl?: number;
  /** Skip cache lookup/storage for this request */
  skipCache?: boolean;
}

export class DigitalAIClient {
  private static instance: DigitalAIClient | null = null;
  private instanceUrl: string = "";
  private accessToken: string = "";
  private currentUsername: string = "";

  /** Cache for API responses */
  private cache: TTLCache;

  private constructor() {
    this.cache = new TTLCache({
      defaultTTL: TTL.MEDIUM,
      maxSize: 200,
    });
  }

  /**
   * Get or create singleton instance
   */
  static async create(): Promise<DigitalAIClient> {
    if (!DigitalAIClient.instance) {
      DigitalAIClient.instance = new DigitalAIClient();
      await DigitalAIClient.instance.initialize();
    }
    return DigitalAIClient.instance;
  }

  /**
   * Reset singleton instance (useful after configuration changes)
   */
  static reset(): void {
    DigitalAIClient.instance = null;
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
    const config = vscode.workspace.getConfiguration("devBuddy.digitalai");
    this.instanceUrl = config.get<string>("instanceUrl", "");

    // Get access token from secure storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context = (global as any).devBuddyContext as vscode.ExtensionContext;
    if (context) {
      this.accessToken =
        (await context.secrets.get("digitalaiAccessToken")) || "";
    }

    if (this.isConfigured()) {
      logger.info(
        `Digital.ai Agility client initialized successfully (${this.instanceUrl})`
      );

      // Try to get current user for username
      try {
        const user = await this.getCurrentUser();
        if (user) {
          this.currentUsername = user.username || user.name;
        }
      } catch {
        logger.debug("Could not fetch current user during initialization");
      }
    } else {
      logger.warn("Digital.ai Agility client not fully configured");
      logger.debug(
        `Config state: instanceUrl=${!!this.instanceUrl}, accessToken=${!!this.accessToken}`
      );
    }
  }

  /**
   * Check if client is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.instanceUrl && this.accessToken);
  }

  /**
   * Get base API URL for Digital.ai REST API
   */
  private getApiBaseUrl(): string {
    // Ensure instanceUrl doesn't have trailing slash
    const cleanUrl = this.instanceUrl.replace(/\/+$/, "");
    return cleanUrl;
  }

  /**
   * Get authentication headers for Digital.ai (Bearer token)
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  /**
   * Make authenticated HTTP request to Digital.ai API with retry and caching support
   */
  private async request<T>(
    endpoint: string,
    options: DigitalAIRequestOptions = {}
  ): Promise<T> {
    const { method = "GET", body, headers = {}, ttl, skipCache = false } = options;
    const url = `${this.getApiBaseUrl()}${endpoint}`;

    // Only cache GET requests
    const isCacheable = method === "GET" && !skipCache;
    const cacheKey = isCacheable ? generateCacheKey("digitalai", endpoint) : "";

    // Check cache first for GET requests
    if (isCacheable) {
      const cached = this.cache.get(cacheKey);
      if (cached !== undefined) {
        logger.debug(`[Digital.ai] Cache hit for ${endpoint}`);
        return cached as T;
      }
    }

    const httpClient = getHttpClient();

    try {
      const response = await httpClient.request<T>(url, {
        method,
        body,
        headers: {
          ...this.getAuthHeaders(),
          ...headers,
        },
        retry: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          retryableStatuses: [429, 500, 502, 503, 504],
          retryOnNetworkError: true,
        },
      });

      // Cache successful GET responses
      if (isCacheable && response.data !== undefined) {
        const effectiveTTL = ttl ?? TTL.MEDIUM;
        if (effectiveTTL > 0) {
          this.cache.set(cacheKey, response.data, effectiveTTL);
        }
      }

      return response.data;
    } catch (error) {
      if (error instanceof HttpError) {
        logger.error(
          `[Digital.ai] API Error - ${method} ${endpoint}: ${error.status} ${error.statusText}`
        );
        throw new Error(
          `Digital.ai API error: ${error.status} ${error.statusText} - ${error.body}`
        );
      }
      throw error;
    }
  }

  /**
   * Clear the entire API response cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug("[Digital.ai] Cache cleared");
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidateCache(pattern: string): void {
    const count = this.cache.invalidateByPattern(pattern);
    logger.debug(
      `[Digital.ai] Invalidated ${count} cache entries matching: ${pattern}`
    );
  }

  /**
   * Invalidate cache after a mutation
   */
  private invalidateAfterMutation(storyOid?: string): void {
    this.invalidateCache("Story");
    this.invalidateCache("search");
    if (storyOid) {
      this.invalidateCache(storyOid);
    }
  }

  // ==================== User Operations ====================

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<DigitalAINormalizedUser | null> {
    try {
      // The "me" endpoint returns the current authenticated user
      const response = await this.request<DigitalAIApiResponse<DigitalAIMember>>(
        "/rest-1.v1/Data/Member?where=IsSelf='true'&sel=Name,Nickname,Email,Username,Avatar"
      );

      if (response.Assets && response.Assets.length > 0) {
        return this.normalizeMember(response.Assets[0]);
      }
      return null;
    } catch (error) {
      logger.error("[Digital.ai] Failed to get current user:", error);
      return null;
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<DigitalAINormalizedUser[]> {
    try {
      const escapedQuery = query.replace(/'/g, "''");
      const response = await this.request<DigitalAIApiResponse<DigitalAIMember>>(
        `/rest-1.v1/Data/Member?where=Name~'${escapedQuery}'|Email~'${escapedQuery}'&sel=Name,Nickname,Email,Username,Avatar&pageSize=20`
      );

      return (response.Assets || []).map((m) => this.normalizeMember(m));
    } catch (error) {
      logger.error("[Digital.ai] Failed to search users:", error);
      return [];
    }
  }

  // ==================== Story Operations ====================

  /**
   * Get stories assigned to current user
   */
  async getMyIssues(): Promise<DigitalAINormalizedStory[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      // Fetch stories where current user is an owner and not closed/deleted
      const response = await this.request<DigitalAIApiResponse<DigitalAIStory>>(
        `/rest-1.v1/Data/Story?where=Owners.IsSelf='true';AssetState!='Closed';AssetState!='Dead'&sel=Name,Number,Description,AssetState,Status.Name,Priority.Name,Owners,Scope.Name,Timebox.Name,Team.Name,CreateDate,ChangeDate,Estimate,Super.Name,Super.Number&sort=-ChangeDate&pageSize=100`
      );

      return (response.Assets || []).map((story) =>
        this.normalizeStory(story)
      );
    } catch (error) {
      logger.error("[Digital.ai] Failed to get my stories:", error);
      return [];
    }
  }

  /**
   * Get recently completed stories assigned to current user
   */
  async getRecentlyCompletedIssues(
    daysAgo: number = 14
  ): Promise<DigitalAINormalizedStory[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      // Calculate date filter
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      const dateStr = cutoffDate.toISOString().split("T")[0];

      const response = await this.request<DigitalAIApiResponse<DigitalAIStory>>(
        `/rest-1.v1/Data/Story?where=Owners.IsSelf='true';AssetState='Closed';ChangeDate>='${dateStr}'&sel=Name,Number,Description,AssetState,Status.Name,Priority.Name,Owners,Scope.Name,Timebox.Name,Team.Name,CreateDate,ChangeDate,Estimate,Super.Name,Super.Number&sort=-ChangeDate&pageSize=20`
      );

      return (response.Assets || []).map((story) =>
        this.normalizeStory(story)
      );
    } catch (error) {
      logger.error("[Digital.ai] Failed to get recently completed stories:", error);
      return [];
    }
  }

  /**
   * Get a single story by OID or number
   */
  async getIssue(idOrNumber: string): Promise<DigitalAINormalizedStory | null> {
    try {
      // Determine if it's an OID (e.g., "Story:1234") or a number (e.g., "S-01234")
      let endpoint: string;
      if (idOrNumber.includes(":")) {
        // It's an OID
        endpoint = `/rest-1.v1/Data/${idOrNumber}?sel=Name,Number,Description,AssetState,Status.Name,Priority.Name,Owners,Scope.Name,Timebox.Name,Team.Name,CreateDate,ChangeDate,Estimate,Super.Name,Super.Number`;
      } else {
        // It's a number, search by Number field
        const escapedNumber = idOrNumber.replace(/'/g, "''");
        endpoint = `/rest-1.v1/Data/Story?where=Number='${escapedNumber}'&sel=Name,Number,Description,AssetState,Status.Name,Priority.Name,Owners,Scope.Name,Timebox.Name,Team.Name,CreateDate,ChangeDate,Estimate,Super.Name,Super.Number`;
      }

      const response = await this.request<
        DigitalAIApiResponse<DigitalAIStory> | DigitalAIStory
      >(endpoint);

      // Handle single asset response vs array response
      if ("Assets" in response) {
        const assets = response.Assets;
        if (assets && assets.length > 0) {
          return this.normalizeStory(assets[0]);
        }
        return null;
      } else {
        return this.normalizeStory(response as DigitalAIStory);
      }
    } catch (error) {
      logger.error(`[Digital.ai] Failed to get story ${idOrNumber}:`, error);
      return null;
    }
  }

  /**
   * Search stories with filters
   */
  async searchIssues(
    options: DigitalAISearchOptions
  ): Promise<DigitalAINormalizedStory[]> {
    try {
      const conditions: string[] = [];

      if (options.where) {
        conditions.push(options.where);
      }

      // Build the where clause
      const where =
        conditions.length > 0 ? `where=${conditions.join(";")}&` : "";

      // Build select fields
      const select =
        options.select?.join(",") ||
        "Name,Number,Description,AssetState,Status.Name,Priority.Name,Owners,Scope.Name,Timebox.Name,Team.Name,CreateDate,ChangeDate,Estimate,Super.Name,Super.Number";

      const sort = options.sort || "-ChangeDate";
      const pageSize = options.pageSize || 50;
      const page = options.page || 0;
      const pageStart = page * pageSize;

      const response = await this.request<DigitalAIApiResponse<DigitalAIStory>>(
        `/rest-1.v1/Data/Story?${where}sel=${select}&sort=${sort}&pageSize=${pageSize}&page=${pageStart}`
      );

      return (response.Assets || []).map((story) =>
        this.normalizeStory(story)
      );
    } catch (error) {
      logger.error("[Digital.ai] Failed to search stories:", error);
      return [];
    }
  }

  /**
   * Create a new story
   */
  async createIssue(
    input: CreateDigitalAIStoryInput
  ): Promise<DigitalAINormalizedStory | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attributes: Record<string, any> = {
        Name: { value: input.name, act: "set" },
        Scope: { value: buildOID("Scope", input.scopeId), act: "set" },
      };

      if (input.description) {
        attributes.Description = { value: input.description, act: "set" };
      }

      if (input.ownerId) {
        attributes.Owners = {
          value: [{ idref: buildOID("Member", input.ownerId), act: "add" }],
          act: "set",
        };
      }

      if (input.priorityId) {
        attributes.Priority = {
          value: buildOID("StoryPriority", input.priorityId),
          act: "set",
        };
      }

      if (input.timeboxId) {
        attributes.Timebox = {
          value: buildOID("Timebox", input.timeboxId),
          act: "set",
        };
      }

      if (input.teamId) {
        attributes.Team = {
          value: buildOID("Team", input.teamId),
          act: "set",
        };
      }

      if (input.estimate !== undefined) {
        attributes.Estimate = { value: input.estimate, act: "set" };
      }

      if (input.parentId) {
        attributes.Super = {
          value: buildOID("Epic", input.parentId),
          act: "set",
        };
      }

      const response = await this.request<DigitalAIStory>(
        "/rest-1.v1/Data/Story",
        {
          method: "POST",
          body: JSON.stringify({
            Attributes: attributes,
          }),
        }
      );

      this.invalidateAfterMutation();

      logger.success(`[Digital.ai] Created story: ${response._oid}`);

      // Fetch the full story details
      return this.getIssue(response._oid);
    } catch (error) {
      logger.error("[Digital.ai] Failed to create story:", error);
      return null;
    }
  }

  /**
   * Update an existing story
   */
  async updateIssue(
    oid: string,
    input: UpdateDigitalAIStoryInput
  ): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attributes: Record<string, any> = {};

      if (input.name !== undefined) {
        attributes.Name = { value: input.name, act: "set" };
      }

      if (input.description !== undefined) {
        attributes.Description = { value: input.description, act: "set" };
      }

      if (input.ownerId !== undefined) {
        if (input.ownerId) {
          attributes.Owners = {
            value: [{ idref: buildOID("Member", input.ownerId), act: "add" }],
            act: "set",
          };
        } else {
          attributes.Owners = { act: "set", value: [] };
        }
      }

      if (input.priorityId !== undefined) {
        attributes.Priority = {
          value: input.priorityId
            ? buildOID("StoryPriority", input.priorityId)
            : null,
          act: "set",
        };
      }

      if (input.statusId !== undefined) {
        attributes.Status = {
          value: input.statusId
            ? buildOID("StoryStatus", input.statusId)
            : null,
          act: "set",
        };
      }

      if (input.timeboxId !== undefined) {
        attributes.Timebox = {
          value: input.timeboxId ? buildOID("Timebox", input.timeboxId) : null,
          act: "set",
        };
      }

      if (input.estimate !== undefined) {
        attributes.Estimate = { value: input.estimate, act: "set" };
      }

      await this.request(`/rest-1.v1/Data/${oid}`, {
        method: "POST",
        body: JSON.stringify({
          Attributes: attributes,
        }),
        skipCache: true,
      });

      this.invalidateAfterMutation(oid);

      logger.success(`[Digital.ai] Updated story: ${oid}`);
      return true;
    } catch (error) {
      logger.error(`[Digital.ai] Failed to update story ${oid}:`, error);
      return false;
    }
  }

  /**
   * Update story status
   */
  async updateIssueStatus(oid: string, statusId: string): Promise<boolean> {
    return this.updateIssue(oid, { statusId });
  }

  /**
   * Close a story (set AssetState to Closed)
   */
  async closeIssue(oid: string): Promise<boolean> {
    try {
      // Use the Inactivate operation to close the story
      await this.request(`/rest-1.v1/Data/${oid}?op=Inactivate`, {
        method: "POST",
        skipCache: true,
      });

      this.invalidateAfterMutation(oid);

      logger.success(`[Digital.ai] Closed story: ${oid}`);
      return true;
    } catch (error) {
      logger.error(`[Digital.ai] Failed to close story ${oid}:`, error);
      return false;
    }
  }

  /**
   * Reactivate a closed story
   */
  async reactivateIssue(oid: string): Promise<boolean> {
    try {
      await this.request(`/rest-1.v1/Data/${oid}?op=Reactivate`, {
        method: "POST",
        skipCache: true,
      });

      this.invalidateAfterMutation(oid);

      logger.success(`[Digital.ai] Reactivated story: ${oid}`);
      return true;
    } catch (error) {
      logger.error(`[Digital.ai] Failed to reactivate story ${oid}:`, error);
      return false;
    }
  }

  // ==================== Project Operations ====================

  /**
   * Get all accessible projects (Scopes)
   */
  async getProjects(): Promise<DigitalAINormalizedProject[]> {
    try {
      const response = await this.request<DigitalAIApiResponse<DigitalAIScope>>(
        `/rest-1.v1/Data/Scope?where=AssetState!='Dead'&sel=Name,Description,AssetState,Owner.Name,Parent.Name&sort=Name&pageSize=200`,
        { ttl: TTL.LONG }
      );

      return (response.Assets || []).map((scope) =>
        this.normalizeScope(scope)
      );
    } catch (error) {
      logger.error("[Digital.ai] Failed to get projects:", error);
      return [];
    }
  }

  /**
   * Get unassigned stories for a project
   */
  async getProjectUnassignedIssues(
    projectId: string,
    maxResults: number = 20
  ): Promise<DigitalAINormalizedStory[]> {
    try {
      const response = await this.request<DigitalAIApiResponse<DigitalAIStory>>(
        `/rest-1.v1/Data/Story?where=Scope='Scope:${projectId}';Owners.@Count='0';AssetState!='Closed';AssetState!='Dead'&sel=Name,Number,Description,AssetState,Status.Name,Priority.Name,Owners,Scope.Name,Timebox.Name,Team.Name,CreateDate,ChangeDate,Estimate&sort=-Priority.Order,-ChangeDate&pageSize=${maxResults}`
      );

      return (response.Assets || []).map((story) =>
        this.normalizeStory(story)
      );
    } catch (error) {
      logger.error(
        `[Digital.ai] Failed to get unassigned stories for project ${projectId}:`,
        error
      );
      return [];
    }
  }

  // ==================== Sprint/Timebox Operations ====================

  /**
   * Get sprints (Timeboxes) for a project
   */
  async getSprints(projectId?: string): Promise<DigitalAINormalizedSprint[]> {
    try {
      let where = "AssetState!='Dead'";
      if (projectId) {
        where += `;Schedule.ScheduledScopes='Scope:${projectId}'`;
      }

      const response = await this.request<DigitalAIApiResponse<DigitalAITimebox>>(
        `/rest-1.v1/Data/Timebox?where=${where}&sel=Name,State,BeginDate,EndDate&sort=-BeginDate&pageSize=50`
      );

      return (response.Assets || []).map((timebox) =>
        this.normalizeTimebox(timebox)
      );
    } catch (error) {
      logger.error("[Digital.ai] Failed to get sprints:", error);
      return [];
    }
  }

  /**
   * Get active sprint for a project
   */
  async getActiveSprint(
    projectId?: string
  ): Promise<DigitalAINormalizedSprint | null> {
    try {
      const sprints = await this.getSprints(projectId);
      return sprints.find((s) => s.state === "active") || null;
    } catch (error) {
      logger.error("[Digital.ai] Failed to get active sprint:", error);
      return null;
    }
  }

  // ==================== Team Operations ====================

  /**
   * Get all teams
   */
  async getTeams(): Promise<DigitalAINormalizedTeam[]> {
    try {
      const response = await this.request<DigitalAIApiResponse<DigitalAITeam>>(
        `/rest-1.v1/Data/Team?sel=Name,Description&sort=Name&pageSize=200`,
        { ttl: TTL.LONG }
      );

      return (response.Assets || []).map((team) => this.normalizeTeam(team));
    } catch (error) {
      logger.error("[Digital.ai] Failed to get teams:", error);
      return [];
    }
  }

  // ==================== Status Operations ====================

  /**
   * Get available story statuses
   */
  async getStatuses(): Promise<DigitalAINormalizedStatus[]> {
    try {
      const response = await this.request<
        DigitalAIApiResponse<DigitalAIStoryStatus>
      >(
        `/rest-1.v1/Data/StoryStatus?sel=Name,Description,RollupState&sort=Order`,
        { ttl: TTL.VERY_LONG }
      );

      return (response.Assets || []).map((status) =>
        this.normalizeStatus(status)
      );
    } catch (error) {
      logger.error("[Digital.ai] Failed to get statuses:", error);
      return [];
    }
  }

  // ==================== Priority Operations ====================

  /**
   * Get available priorities
   */
  async getPriorities(): Promise<
    Array<{ id: string; name: string; order: number }>
  > {
    try {
      const response = await this.request<
        DigitalAIApiResponse<DigitalAIPriority>
      >(`/rest-1.v1/Data/StoryPriority?sel=Name,Order&sort=Order`, {
        ttl: TTL.VERY_LONG,
      });

      return (response.Assets || []).map((p) => ({
        id: extractIdFromOID(p._oid),
        name: p.Name?.value || "Unknown",
        order: p.Order?.value || 0,
      }));
    } catch (error) {
      logger.error("[Digital.ai] Failed to get priorities:", error);
      return [];
    }
  }

  // ==================== Connection Test ====================

  /**
   * Test connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch {
      return false;
    }
  }

  // ==================== Normalization Helpers ====================

  /**
   * Normalize raw story to internal format
   */
  private normalizeStory(story: DigitalAIStory): DigitalAINormalizedStory {
    const oid = story._oid;
    const id = extractIdFromOID(oid);
    const identifier = story.Number?.value || `S-${id}`;
    const assetState = story.AssetState?.value || DigitalAIAssetState.Future;
    const statusName = story.Status?.name;

    // Normalize owners
    let assignee: DigitalAINormalizedUser | undefined;
    if (story.Owners?.value && story.Owners.value.length > 0) {
      const owner = story.Owners.value[0];
      assignee = {
        id: extractIdFromOID(owner.idref),
        name: owner.name || "Unknown",
      };
    }

    return {
      id: oid,
      identifier,
      title: story.Name?.value || "",
      description: story.Description?.value,
      url: `${this.instanceUrl}/story.mvc/Summary?oidToken=${oid}`,
      createdAt: story.CreateDate?.value || new Date().toISOString(),
      updatedAt: story.ChangeDate?.value || new Date().toISOString(),
      state: {
        id: story.Status?.idref
          ? extractIdFromOID(story.Status.idref)
          : String(assetState),
        name: statusName || this.getAssetStateName(assetState),
        type: mapAssetStateToType(assetState, statusName),
      },
      priority: mapPriorityFromName(story.Priority?.name),
      assignee,
      project: story.Scope
        ? {
            id: extractIdFromOID(story.Scope.idref),
            name: story.Scope.name || "Unknown",
          }
        : undefined,
      sprint: story.Timebox
        ? {
            id: extractIdFromOID(story.Timebox.idref),
            name: story.Timebox.name || "Unknown",
          }
        : undefined,
      team: story.Team
        ? {
            id: extractIdFromOID(story.Team.idref),
            name: story.Team.name || "Unknown",
          }
        : undefined,
      parent: story.Super
        ? {
            id: extractIdFromOID(story.Super.idref),
            identifier: story.Super.name || "Unknown",
            title: story.Super.name || "Unknown",
          }
        : undefined,
      estimate: story.Estimate?.value,
    };
  }

  /**
   * Normalize raw member to internal format
   */
  private normalizeMember(member: DigitalAIMember): DigitalAINormalizedUser {
    return {
      id: extractIdFromOID(member._oid),
      name: member.Name?.value || member.Nickname?.value || "Unknown",
      email: member.Email?.value,
      username: member.Username?.value,
      avatarUrl: member.Avatar?.value,
    };
  }

  /**
   * Normalize raw scope to internal format
   */
  private normalizeScope(scope: DigitalAIScope): DigitalAINormalizedProject {
    const assetState = scope.AssetState?.value || DigitalAIAssetState.Active;

    return {
      id: extractIdFromOID(scope._oid),
      name: scope.Name?.value || "Unknown",
      description: scope.Description?.value,
      state: this.getAssetStateName(assetState),
    };
  }

  /**
   * Normalize raw timebox to internal format
   */
  private normalizeTimebox(timebox: DigitalAITimebox): DigitalAINormalizedSprint {
    const stateStr = timebox.State?.value?.toLowerCase() || "future";
    let state: "future" | "active" | "closed" = "future";
    if (stateStr === "active" || stateStr === "current") {
      state = "active";
    } else if (stateStr === "closed" || stateStr === "past") {
      state = "closed";
    }

    return {
      id: extractIdFromOID(timebox._oid),
      name: timebox.Name?.value || "Unknown",
      state,
      startDate: timebox.BeginDate?.value,
      endDate: timebox.EndDate?.value,
    };
  }

  /**
   * Normalize raw team to internal format
   */
  private normalizeTeam(team: DigitalAITeam): DigitalAINormalizedTeam {
    const name = team.Name?.value || "Unknown";
    // Generate a key from the name (first word or abbreviation)
    const key = name.split(/\s+/)[0].toUpperCase().slice(0, 5);

    return {
      id: extractIdFromOID(team._oid),
      name,
      key,
    };
  }

  /**
   * Normalize raw status to internal format
   */
  private normalizeStatus(
    status: DigitalAIStoryStatus
  ): DigitalAINormalizedStatus {
    const rollupState = status.RollupState?.value?.toLowerCase() || "";

    let type = "backlog";
    if (rollupState.includes("done") || rollupState.includes("accepted")) {
      type = "completed";
    } else if (rollupState.includes("progress") || rollupState.includes("in")) {
      type = "started";
    } else if (rollupState.includes("ready") || rollupState.includes("todo")) {
      type = "unstarted";
    }

    return {
      id: extractIdFromOID(status._oid),
      name: status.Name?.value || "Unknown",
      type,
    };
  }

  /**
   * Get human-readable name for asset state
   */
  private getAssetStateName(state: number): string {
    switch (state) {
      case DigitalAIAssetState.Future:
        return "Future";
      case DigitalAIAssetState.Active:
        return "Active";
      case DigitalAIAssetState.Closed:
        return "Closed";
      case DigitalAIAssetState.Template:
        return "Template";
      case DigitalAIAssetState.BrokenDown:
        return "Broken Down";
      case DigitalAIAssetState.Deleted:
        return "Deleted";
      default:
        return "Unknown";
    }
  }
}

