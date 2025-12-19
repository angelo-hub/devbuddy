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

export abstract class BaseJiraClient {
  /**
   * Get the base API URL (platform-specific)
   */
  protected abstract getApiBaseUrl(): string;

  /**
   * Get authentication headers (platform-specific)
   */
  protected abstract getAuthHeaders(): Record<string, string>;

  /**
   * Make authenticated HTTP request to Jira API
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getApiBaseUrl()}${endpoint}`;
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Jira API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Handle empty responses (204 No Content)
    const contentLength = response.headers.get("content-length");
    if (response.status === 204 || contentLength === "0") {
      return undefined as T;
    }

    const text = await response.text();
    if (!text || text.trim() === "") {
      return undefined as T;
    }

    return JSON.parse(text) as T;
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

