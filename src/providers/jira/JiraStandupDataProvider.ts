import { BaseStandupDataProvider, StandupTicket } from "@shared/base/BaseStandupDataProvider";
import { BaseJiraClient } from "./common/BaseJiraClient";
import { JiraCloudClient } from "./cloud/JiraCloudClient";
import { JiraServerClient } from "./server/JiraServerClient";
import { getJiraDeploymentType } from "@shared/utils/platformDetector";

/**
 * Jira-specific implementation of standup data provider
 * Supports both Jira Cloud and Jira Server
 */
export class JiraStandupDataProvider extends BaseStandupDataProvider {
  private client: BaseJiraClient | null = null;

  constructor(client?: BaseJiraClient) {
    super();
    this.client = client || null;
  }

  async initialize(): Promise<void> {
    if (!this.client) {
      const jiraType = getJiraDeploymentType();
      if (jiraType === "cloud") {
      this.client = await JiraCloudClient.create();
      } else {
        this.client = await JiraServerClient.create();
      }
    }
  }

  private async getClient(): Promise<BaseJiraClient> {
    if (!this.client) {
      await this.initialize();
    }
    return this.client!;
  }

  getPlatformName(): string {
    return "Jira";
  }

  async getActiveTickets(): Promise<StandupTicket[]> {
    const client = await this.getClient();
    
    // Get issues that are in progress or to do (not done)
    const issues = await client.searchIssues({
      jql: "assignee = currentUser() AND resolution = Unresolved AND status IN ('In Progress', 'To Do', 'Selected for Development')",
      maxResults: 50,
    });

    return issues.map((issue) => ({
      id: issue.id,
      identifier: issue.key,
      title: issue.summary,
      description: issue.description || undefined,
      status: issue.status.name,
      priority: this.mapJiraPriorityToNumber(issue.priority?.name),
      url: issue.url,
    }));
  }

  async getTicketsByIds(ids: string[]): Promise<StandupTicket[]> {
    const client = await this.getClient();
    const tickets: StandupTicket[] = [];

    for (const id of ids) {
      const issue = await client.getIssue(id);
      if (issue) {
        tickets.push({
          id: issue.id,
          identifier: issue.key,
          title: issue.summary,
          description: issue.description || undefined,
          status: issue.status.name,
          priority: this.mapJiraPriorityToNumber(issue.priority?.name),
          url: issue.url,
        });
      }
    }

    return tickets;
  }

  async getTicketById(id: string): Promise<StandupTicket | null> {
    const client = await this.getClient();
    const issue = await client.getIssue(id);

    if (!issue) {
      return null;
    }

    return {
      id: issue.id,
      identifier: issue.key,
      title: issue.summary,
      description: issue.description || undefined,
      status: issue.status.name,
      priority: this.mapJiraPriorityToNumber(issue.priority?.name),
      url: issue.url,
    };
  }

  async getRecentlyUpdatedTickets(timeWindow: string): Promise<StandupTicket[]> {
    const client = await this.getClient();
    
    // Convert time window to JQL format
    const jqlTimeWindow = this.convertTimeWindowToJQL(timeWindow);
    
    const issues = await client.searchIssues({
      jql: `assignee = currentUser() AND updated >= ${jqlTimeWindow}`,
      maxResults: 50,
    });

    return issues.map((issue) => ({
      id: issue.id,
      identifier: issue.key,
      title: issue.summary,
      description: issue.description || undefined,
      status: issue.status.name,
      priority: this.mapJiraPriorityToNumber(issue.priority?.name),
      url: issue.url,
    }));
  }

  isConfigured(): boolean {
    return this.client?.isConfigured() ?? false;
  }

  formatTicketReference(ticket: StandupTicket): string {
    if (ticket.url) {
      return `[${ticket.identifier}](${ticket.url})`;
    }
    return ticket.identifier;
  }

  extractTicketIdsFromText(text: string): string[] {
    // Jira ticket format: PROJECT-123, PROJ-456, etc.
    // Similar to Linear but typically uses full words or abbreviations
    const regex = /\b([A-Z]{2,10}-\d+)\b/g;
    const matches = text.match(regex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Map Jira priority name to numeric value for consistency
   */
  private mapJiraPriorityToNumber(priorityName?: string): number {
    if (!priorityName) return 0;
    
    const normalized = priorityName.toLowerCase();
    if (normalized.includes("highest") || normalized.includes("critical")) return 1;
    if (normalized.includes("high")) return 2;
    if (normalized.includes("medium")) return 3;
    if (normalized.includes("low")) return 4;
    if (normalized.includes("lowest")) return 5;
    
    return 3; // default to medium
  }

  /**
   * Convert human-readable time window to JQL format
   */
  private convertTimeWindowToJQL(timeWindow: string): string {
    const normalized = timeWindow.toLowerCase().trim();
    
    if (normalized.includes("24 hours") || normalized.includes("1 day")) {
      return "-24h";
    }
    if (normalized.includes("48 hours") || normalized.includes("2 days")) {
      return "-48h";
    }
    if (normalized.includes("week")) {
      return "-7d";
    }
    if (normalized.includes("yesterday")) {
      return "-1d";
    }
    
    // Default to 24 hours
    return "-24h";
  }
}

