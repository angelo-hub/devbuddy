/**
 * Base interface for ticket/issue data used in standup generation
 */
export interface StandupTicket {
  id: string;
  identifier: string; // e.g., "ENG-123" for Jira, "DEV-456" for Linear
  title: string;
  description?: string;
  status: string;
  priority: number;
  url?: string;
}

/**
 * Types of ticket activities that can be tracked
 */
export type TicketActivityType = 
  | "status_change"
  | "description_update"
  | "comment_added"
  | "title_change"
  | "assignee_change"
  | "priority_change"
  | "label_change"
  | "estimate_change"
  | "attachment_added"
  | "other";

/**
 * Represents a single activity/update on a ticket
 * Captures non-code work like updating descriptions, completing spikes, etc.
 */
export interface TicketActivity {
  id: string;
  ticketId: string;
  ticketIdentifier: string;
  ticketTitle: string;
  ticketUrl?: string;
  activityType: TicketActivityType;
  description: string;
  timestamp: string; // ISO date string
  actor?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  // For status changes
  fromStatus?: string;
  toStatus?: string;
  // For field changes
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  // For comments
  commentBody?: string;
}

/**
 * Options for standup generation
 */
export interface StandupGenerationOptions {
  mode: "single" | "multi" | "custom";
  ticketIds?: string[];
  timeWindow: string; // e.g., "24 hours ago", "since yesterday"
  includeCommits: boolean;
  includeFileChanges: boolean;
  tone?: string;
  format?: "slack" | "markdown" | "plain";
}

/**
 * Abstract base class for platform-specific standup data providers
 */
export abstract class BaseStandupDataProvider {
  /**
   * Get the platform name (e.g., "Linear", "Jira")
   */
  abstract getPlatformName(): string;

  /**
   * Get all active/in-progress tickets for the current user
   */
  abstract getActiveTickets(): Promise<StandupTicket[]>;

  /**
   * Get specific tickets by their identifiers
   */
  abstract getTicketsByIds(ids: string[]): Promise<StandupTicket[]>;

  /**
   * Get a single ticket by ID
   */
  abstract getTicketById(id: string): Promise<StandupTicket | null>;

  /**
   * Get tickets updated within a time window
   */
  abstract getRecentlyUpdatedTickets(timeWindow: string): Promise<StandupTicket[]>;

  /**
   * Get recent activity/updates for tickets the user is working on
   * This captures non-code work like:
   * - Updating spike/investigation descriptions
   * - Adding comments with findings
   * - Status transitions
   * - Completing research tasks
   */
  abstract getRecentTicketActivity(timeWindow: string): Promise<TicketActivity[]>;

  /**
   * Check if the provider is properly configured
   */
  abstract isConfigured(): boolean;

  /**
   * Format ticket reference for the platform
   * e.g., Linear: "[ENG-123](https://linear.app/...)"
   * e.g., Jira: "[PROJ-456](https://company.atlassian.net/...)"
   */
  abstract formatTicketReference(ticket: StandupTicket): string;

  /**
   * Extract ticket identifiers from git commit messages
   * This helps link commits to tickets
   */
  abstract extractTicketIdsFromText(text: string): string[];
}

