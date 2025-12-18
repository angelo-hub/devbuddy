import * as vscode from "vscode";

/**
 * Base interface for a ticket/issue in any platform
 */
export interface BaseTicket {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  priority: number;
  state: {
    id: string;
    name: string;
    type: string;
  };
  assignee?: BaseUser;
  creator?: BaseUser;
}

/**
 * Base interface for a user in any platform
 */
export interface BaseUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

/**
 * Base interface for a project in any platform
 */
export interface BaseProject {
  id: string;
  name: string;
  url?: string;
  state: string;
}

/**
 * Base interface for a team in any platform
 */
export interface BaseTeam {
  id: string;
  name: string;
  key: string;
}

/**
 * Base interface for a template in any platform
 */
export interface BaseTemplate {
  id: string;
  name: string;
  description?: string;
}

/**
 * Base interface for a label/tag in any platform
 */
export interface BaseLabel {
  id: string;
  name: string;
  color: string;
}

/**
 * Filter options for fetching tickets
 */
export interface TicketFilter {
  state?: string[];
  teamId?: string;
  projectId?: string;
}

/**
 * Input for creating a new ticket
 */
export interface CreateTicketInput {
  teamId: string;
  title: string;
  description?: string;
  priority?: number;
  assigneeId?: string;
  projectId?: string;
  labelIds?: string[];
  stateId?: string;
}

/**
 * Draft data for pre-populating ticket creation forms
 * Used by AI conversational creator and chat participant
 */
export interface TicketDraftData {
  /** Ticket title (Linear) or summary (Jira) */
  title?: string;
  /** Ticket description/body */
  description?: string;
  /** Priority as string (e.g., "high", "medium", "1", "2") */
  priority?: string;
  /** Label names (strings, not IDs) */
  labels?: string[];
  /** Linear team ID */
  teamId?: string;
  /** Jira project key */
  projectKey?: string;
}

/**
 * Abstract base class for ticket provider implementations
 * Provides a common interface for interacting with different ticketing platforms
 */
export abstract class BaseTicketProvider<
  TTicket extends BaseTicket = BaseTicket,
  TUser extends BaseUser = BaseUser,
  TProject extends BaseProject = BaseProject,
  TTeam extends BaseTeam = BaseTeam,
  TTemplate extends BaseTemplate = BaseTemplate,
  TLabel extends BaseLabel = BaseLabel
> {
  /**
   * Check if the provider is properly configured (e.g., API token exists)
   */
  abstract isConfigured(): boolean;

  /**
   * Get the current authenticated user
   */
  abstract getCurrentUser(): Promise<TUser | null>;

  /**
   * Get tickets assigned to the current user
   */
  abstract getMyIssues(filter?: TicketFilter): Promise<TTicket[]>;

  /**
   * Get a specific ticket by ID
   */
  abstract getIssue(id: string): Promise<TTicket | null>;

  /**
   * Create a new ticket
   */
  abstract createIssue(input: CreateTicketInput): Promise<TTicket | null>;

  /**
   * Update ticket status/state
   */
  abstract updateIssueStatus(issueId: string, stateId: string): Promise<boolean>;

  /**
   * Add a comment to a ticket
   */
  abstract addComment(issueId: string, body: string): Promise<boolean>;

  /**
   * Update ticket title
   */
  abstract updateIssueTitle(issueId: string, title: string): Promise<boolean>;

  /**
   * Update ticket description
   */
  abstract updateIssueDescription(
    issueId: string,
    description: string
  ): Promise<boolean>;

  /**
   * Update ticket assignee
   */
  abstract updateIssueAssignee(
    issueId: string,
    assigneeId: string | null
  ): Promise<boolean>;

  /**
   * Get team members for a specific team
   */
  abstract getTeamMembers(teamId: string): Promise<TUser[]>;

  /**
   * Search users by name or email
   */
  abstract searchUsers(searchTerm: string): Promise<TUser[]>;

  /**
   * Get all teams in the organization
   */
  abstract getTeams(): Promise<TTeam[]>;

  /**
   * Get workflow states/statuses
   */
  abstract getWorkflowStates(
    teamId?: string,
    workflowId?: string
  ): Promise<Array<{ id: string; name: string; type: string; position?: number }>>;

  /**
   * Get templates for a team
   */
  abstract getTeamTemplates(teamId: string): Promise<TTemplate[]>;

  /**
   * Get labels/tags for a team
   */
  abstract getTeamLabels(teamId: string): Promise<TLabel[]>;

  /**
   * Get organization users (for assignee list)
   */
  abstract getOrganizationUsers(): Promise<TUser[]>;

  /**
   * Get user's teams
   */
  abstract getUserTeams(): Promise<TTeam[]>;

  /**
   * Get user's projects
   */
  abstract getUserProjects(): Promise<TProject[]>;

  /**
   * Get unassigned issues for a project
   */
  abstract getProjectUnassignedIssues(projectId: string): Promise<TTicket[]>;

  /**
   * Get unassigned issues for a team
   */
  abstract getTeamUnassignedIssues(teamId: string): Promise<TTicket[]>;

  /**
   * Get projects for a specific team
   */
  abstract getTeamProjects(teamId: string): Promise<TProject[]>;
}

