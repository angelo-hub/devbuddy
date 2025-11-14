import { BaseStandupDataProvider, StandupTicket } from "@shared/base/BaseStandupDataProvider";
import { LinearClient } from "./LinearClient";
import { formatTicketReferencesInText } from "@shared/utils/linkFormatter";

/**
 * Linear-specific implementation of standup data provider
 */
export class LinearStandupDataProvider extends BaseStandupDataProvider {
  private client: LinearClient | null = null;

  constructor(client?: LinearClient) {
    super();
    this.client = client || null;
  }

  async initialize(): Promise<void> {
    if (!this.client) {
      this.client = await LinearClient.create();
    }
  }

  private async getClient(): Promise<LinearClient> {
    if (!this.client) {
      await this.initialize();
    }
    return this.client!;
  }

  getPlatformName(): string {
    return "Linear";
  }

  async getActiveTickets(): Promise<StandupTicket[]> {
    const client = await this.getClient();
    const issues = await client.getMyIssues({
      state: ["unstarted", "started"],
    });

    return issues.map((issue) => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      status: issue.state.name,
      priority: issue.priority,
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
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description,
          status: issue.state.name,
          priority: issue.priority,
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
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      status: issue.state.name,
      priority: issue.priority,
      url: issue.url,
    };
  }

  async getRecentlyUpdatedTickets(timeWindow: string): Promise<StandupTicket[]> {
    // Linear doesn't have a direct time-based filter in the current implementation
    // We'll fetch all active tickets and filter them
    const tickets = await this.getActiveTickets();
    // TODO: Add time-based filtering if needed
    return tickets;
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
    // Linear ticket format: TEAM-123, ABC-456, etc.
    const regex = /\b([A-Z]{2,10}-\d+)\b/g;
    const matches = text.match(regex);
    return matches ? [...new Set(matches)] : [];
  }
}

