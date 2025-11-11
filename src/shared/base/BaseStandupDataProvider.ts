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

