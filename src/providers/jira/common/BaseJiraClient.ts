/**
 * Base Jira Client
 * 
 * Abstract class that defines common Jira operations.
 * Extended by JiraCloudClient and JiraServerClient.
 * 
 * Note: Jira has a different structure than BaseTicketProvider,
 * so this doesn't extend it directly.
 */

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
} from "./types";
import {
  getHttpClient,
  TTLCache,
  TTL,
  generateCacheKey,
  HttpError,
} from "@shared/http";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

/**
 * Request options with caching support
 */
export interface JiraRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: object | string;
  headers?: Record<string, string>;
  /** TTL for caching (only applies to GET requests). Use 0 to skip cache. */
  ttl?: number;
  /** Skip cache lookup/storage for this request */
  skipCache?: boolean;
}

export abstract class BaseJiraClient {
  /** Cache for API responses */
  protected cache: TTLCache;

  constructor() {
    // Initialize cache with default settings
    // Jira has stricter rate limits, so we use longer default TTL
    this.cache = new TTLCache({
      defaultTTL: TTL.MEDIUM, // 2 minutes default
      maxSize: 200,
    });
  }

  /**
   * Get the base API URL (platform-specific)
   */
  protected abstract getApiBaseUrl(): string;

  /**
   * Get authentication headers (platform-specific)
   */
  protected abstract getAuthHeaders(): Record<string, string>;

  /**
   * Make authenticated HTTP request to Jira API with retry and caching support
   */
  protected async request<T>(
    endpoint: string,
    options: JiraRequestOptions = {}
  ): Promise<T> {
    const { method = "GET", body, headers = {}, ttl, skipCache = false } = options;
    const url = `${this.getApiBaseUrl()}${endpoint}`;

    // Only cache GET requests
    const isCacheable = method === "GET" && !skipCache;
    const cacheKey = isCacheable ? generateCacheKey("jira", endpoint) : "";

    // Check cache first for GET requests
    if (isCacheable) {
      const cached = this.cache.get(cacheKey);
      if (cached !== undefined) {
        logger.debug(`[Jira] Cache hit for ${endpoint}`);
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
          maxDelay: 30000, // Jira rate limits can require longer waits
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
          `[Jira] API Error - ${method} ${endpoint}: ${error.status} ${error.statusText}`
        );
        throw new Error(
          `Jira API error: ${error.status} ${error.statusText} - ${error.body}`
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
    logger.debug("[Jira] Cache cleared");
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param pattern String pattern to match against cache keys
   */
  invalidateCache(pattern: string): void {
    const count = this.cache.invalidateByPattern(pattern);
    logger.debug(`[Jira] Invalidated ${count} cache entries matching: ${pattern}`);
  }

  /**
   * Invalidate cache after a mutation (create, update, delete)
   * Call this after any operation that modifies data
   */
  protected invalidateAfterMutation(issueKey?: string): void {
    // Invalidate issue-related caches
    this.invalidateCache("issue");
    this.invalidateCache("search");
    if (issueKey) {
      this.invalidateCache(issueKey);
    }
  }

  // ==================== Issue Operations ====================

  /**
   * Get a single issue by key
   */
  abstract getIssue(key: string): Promise<JiraIssue | null>;

  /**
   * Search issues using JQL or filters
   */
  abstract searchIssues(options: JiraSearchOptions): Promise<JiraIssue[]>;

  /**
   * Get issues assigned to current user
   */
  abstract getMyIssues(): Promise<JiraIssue[]>;

  /**
   * Get recently completed issues assigned to current user
   * Returns issues resolved in the last N days
   */
  abstract getRecentlyCompletedIssues(daysAgo?: number): Promise<JiraIssue[]>;

  /**
   * Get unassigned issues for a project
   */
  abstract getProjectUnassignedIssues(projectKey: string, maxResults?: number): Promise<JiraIssue[]>;

  /**
   * Create a new issue
   */
  abstract createIssue(input: CreateJiraIssueInput): Promise<JiraIssue | null>;

  /**
   * Update an existing issue
   */
  abstract updateIssue(
    key: string,
    input: UpdateJiraIssueInput
  ): Promise<boolean>;

  /**
   * Transition issue to a new status
   */
  abstract transitionIssue(key: string, transitionId: string): Promise<boolean>;

  /**
   * Get available transitions for an issue
   */
  abstract getTransitions(key: string): Promise<JiraTransition[]>;

  /**
   * Add a comment to an issue
   */
  abstract addComment(key: string, body: string): Promise<JiraComment | null>;

  /**
   * Delete an issue
   */
  abstract deleteIssue(key: string): Promise<boolean>;

  // ==================== Project Operations ====================

  /**
   * Get all accessible projects
   */
  abstract getProjects(): Promise<JiraProject[]>;

  /**
   * Get a single project by key
   */
  abstract getProject(key: string): Promise<JiraProject | null>;

  // ==================== User Operations ====================

  /**
   * Get current authenticated user
   */
  abstract getCurrentUser(): Promise<JiraUser | null>;

  /**
   * Search users (for assignee picker)
   */
  abstract searchUsers(query: string, projectKey?: string): Promise<JiraUser[]>;

  // ==================== Metadata Operations ====================

  /**
   * Get issue types for a project
   */
  abstract getIssueTypes(projectKeyOrId: string): Promise<JiraIssueType[]>;

  /**
   * Get priorities
   */
  abstract getPriorities(): Promise<JiraPriority[]>;

  /**
   * Get statuses for a project
   */
  abstract getStatuses(projectKey: string): Promise<JiraStatus[]>;

  // ==================== Agile Operations ====================

  /**
   * Get boards accessible to the user
   */
  abstract getBoards(projectKey?: string): Promise<JiraBoard[]>;

  /**
   * Get sprints for a board
   */
  abstract getSprints(boardId: number): Promise<JiraSprint[]>;

  /**
   * Get active sprint for a board
   */
  abstract getActiveSprint(boardId: number): Promise<JiraSprint | null>;

  /**
   * Get issues in a specific sprint
   */
  abstract getSprintIssues(sprintId: number): Promise<JiraIssue[]>;

  /**
   * Get my issues in a specific sprint
   */
  abstract getMySprintIssues(sprintId: number): Promise<JiraIssue[]>;

  /**
   * Get unassigned issues in a specific sprint
   */
  abstract getSprintUnassignedIssues(sprintId: number): Promise<JiraIssue[]>;

  // ==================== Configuration ====================

  /**
   * Check if the client is properly configured
   */
  abstract isConfigured(): boolean;

  /**
   * Test the connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }
}

