/**
 * Digital.ai Agility Tickets Provider
 *
 * Tree data provider for displaying Digital.ai Agility stories in the sidebar.
 * This is the beta implementation - provides core functionality with
 * view stories, status updates, and basic details.
 */

import * as vscode from "vscode";
import { DigitalAIClient } from "./DigitalAIClient";
import {
  DigitalAINormalizedStory,
  DigitalAINormalizedProject,
  DigitalAINormalizedTeam,
  DigitalAINormalizedSprint,
} from "./types";
import { getLogger } from "@shared/utils/logger";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";
import { fuzzySearch } from "@shared/utils/fuzzySearch";
import { debounce } from "@shared/utils/debounce";

const logger = getLogger();

/**
 * Tree item for Digital.ai content
 */
export class DigitalAITicketTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly story?: DigitalAINormalizedStory,
    public readonly contextValue?: string
  ) {
    super(label, collapsibleState);
  }

  // Alias for compatibility with shared commands
  get issue(): DigitalAINormalizedStory | undefined {
    return this.story;
  }
}

export class DigitalAITicketsProvider
  implements vscode.TreeDataProvider<DigitalAITicketTreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    DigitalAITicketTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _onDidRefresh = new vscode.EventEmitter<void>();
  readonly onDidRefresh = this._onDidRefresh.event;

  private client: DigitalAIClient | null = null;
  private branchManager: BranchAssociationManager;
  private searchQuery: string | null = null;
  private cachedStories: DigitalAINormalizedStory[] = [];
  private debouncedRefresh: () => void;
  private refreshTimer: NodeJS.Timeout | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.branchManager = new BranchAssociationManager(context, "both");

    // Create debounced refresh for search
    this.debouncedRefresh = debounce(() => {
      this._onDidChangeTreeData.fire();
    }, 300);

    // Initialize client
    this.initializeClient();

    // Start auto-refresh
    this.startAutoRefresh();

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("devBuddy.digitalai")) {
        this.initializeClient();
        this.refresh();
      }
    });
  }

  /**
   * Initialize the Digital.ai client
   */
  private async initializeClient(): Promise<void> {
    try {
      this.client = await DigitalAIClient.create();
      if (this.client.isConfigured()) {
        logger.debug("[Digital.ai] Client initialized for tree view");
      }
    } catch (error) {
      logger.error("[Digital.ai] Failed to initialize client:", error);
    }
  }

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(): void {
    const config = vscode.workspace.getConfiguration("devBuddy");
    const intervalMinutes = config.get<number>("autoRefreshInterval", 5);

    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    if (intervalMinutes > 0) {
      const intervalMs = intervalMinutes * 60 * 1000;
      this.refreshTimer = setInterval(() => {
        logger.debug("[Digital.ai] Auto-refreshing stories...");
        this.refresh();
      }, intervalMs);
    }
  }

  /**
   * Stop auto-refresh timer
   */
  public dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
    this._onDidRefresh.fire();
  }

  /**
   * Set search query and refresh with debounce
   */
  public setSearchQuery(query: string | null): void {
    this.searchQuery = query;
    if (!query || query.length >= 3) {
      this.debouncedRefresh();
    }
  }

  /**
   * Get current search query
   */
  public getSearchQuery(): string | null {
    return this.searchQuery;
  }

  /**
   * Clear search and refresh
   */
  public clearSearch(): void {
    this.searchQuery = null;
    this.refresh();
  }

  /**
   * Get cached stories for quick access
   */
  public getIssues(): DigitalAINormalizedStory[] {
    return this.cachedStories;
  }

  getTreeItem(element: DigitalAITicketTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    element?: DigitalAITicketTreeItem
  ): Promise<DigitalAITicketTreeItem[]> {
    // Ensure client is available
    if (!this.client) {
      this.client = await DigitalAIClient.create();
    }

    if (!this.client.isConfigured()) {
      return this.getSetupInstructions();
    }

    try {
      // Root level - show sections
      if (!element) {
        const items: DigitalAITicketTreeItem[] = [];

        // Search indicator
        if (this.searchQuery && this.searchQuery.length >= 3) {
          const searchIndicator = new DigitalAITicketTreeItem(
            `🔍 "${this.searchQuery}"`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            "searchIndicator"
          );
          searchIndicator.iconPath = new vscode.ThemeIcon(
            "filter",
            new vscode.ThemeColor("charts.blue")
          );
          searchIndicator.description = "filtering";
          searchIndicator.command = {
            command: "devBuddy.clearSearch",
            title: "Click to clear",
          };
          searchIndicator.tooltip = "Click to clear search filter";
          items.push(searchIndicator);
        }

        // Main sections
        items.push(
          this.createSectionHeader(
            "digitalaiSection:myStories",
            "My Stories",
            "folder-opened",
            "charts.blue"
          ),
          this.createSectionHeader(
            "digitalaiSection:completed",
            "Recently Completed",
            "folder-opened",
            "charts.green"
          ),
          this.createSectionHeader(
            "digitalaiSection:teams",
            "Teams",
            "folder-opened",
            "charts.purple"
          ),
          this.createSectionHeader(
            "digitalaiSection:projects",
            "Projects",
            "folder-opened",
            "charts.orange"
          )
        );

        return items;
      }

      // Handle section expansions
      const contextValue = element.contextValue || "";

      if (contextValue === "digitalaiSection:myStories") {
        return this.getMyStories();
      } else if (contextValue === "digitalaiSection:completed") {
        return this.getRecentlyCompleted();
      } else if (contextValue === "digitalaiSection:teams") {
        return this.getTeams();
      } else if (contextValue === "digitalaiSection:projects") {
        return this.getProjects();
      } else if (contextValue.startsWith("digitalaiStatusGroup:")) {
        const status = contextValue.split(":")[1];
        return this.getStoriesByStatus(status);
      } else if (contextValue.startsWith("digitalaiProject:")) {
        const projectId = contextValue.split(":")[1];
        return this.getProjectUnassigned(projectId);
      }

      return [];
    } catch (error) {
      logger.error("[Digital.ai] Failed to load tree data:", error);
      return [this.createErrorItem("Failed to load data")];
    }
  }

  // ==================== Setup Instructions ====================

  private getSetupInstructions(): DigitalAITicketTreeItem[] {
    const setupItem = new DigitalAITicketTreeItem(
      "⚙️ Configure Digital.ai Agility",
      vscode.TreeItemCollapsibleState.None,
      undefined,
      "setup"
    );
    setupItem.command = {
      command: "devBuddy.digitalai.setup",
      title: "Setup Digital.ai",
    };
    setupItem.tooltip = "Click to set up Digital.ai Agility integration (Beta)";
    setupItem.description = "Beta";

    return [setupItem];
  }

  // ==================== Section Helpers ====================

  private createSectionHeader(
    contextValue: string,
    label: string,
    icon: string,
    colorKey: string
  ): DigitalAITicketTreeItem {
    const item = new DigitalAITicketTreeItem(
      label,
      vscode.TreeItemCollapsibleState.Collapsed,
      undefined,
      contextValue
    );
    item.iconPath = new vscode.ThemeIcon(
      icon,
      new vscode.ThemeColor(colorKey)
    );
    return item;
  }

  // ==================== Data Fetching ====================

  private async getMyStories(): Promise<DigitalAITicketTreeItem[]> {
    if (!this.client) return [];

    const stories = await this.client.getMyIssues();
    this.cachedStories = stories;

    // Apply search filter
    const filtered = this.searchQuery
      ? fuzzySearch(stories, this.searchQuery, [
          (s) => s.identifier,
          (s) => s.title,
          (s) => s.description || "",
        ])
      : stories;

    if (filtered.length === 0 && this.searchQuery) {
      const item = new DigitalAITicketTreeItem(
        `No stories found for "${this.searchQuery}"`,
        vscode.TreeItemCollapsibleState.None
      );
      item.iconPath = new vscode.ThemeIcon("search-stop");
      return [item];
    }

    if (filtered.length === 0) {
      const item = new DigitalAITicketTreeItem(
        "No active stories",
        vscode.TreeItemCollapsibleState.None
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    // Group by status
    const groups = this.groupStoriesByStatus(filtered);
    const items: DigitalAITicketTreeItem[] = [];

    // In Progress
    if (groups.started.length > 0) {
      const item = new DigitalAITicketTreeItem(
        `In Progress (${groups.started.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        "digitalaiStatusGroup:started"
      );
      item.iconPath = new vscode.ThemeIcon(
        "play-circle",
        new vscode.ThemeColor("charts.blue")
      );
      items.push(item);
    }

    // To Do
    if (groups.unstarted.length > 0) {
      const item = new DigitalAITicketTreeItem(
        `To Do (${groups.unstarted.length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        undefined,
        "digitalaiStatusGroup:unstarted"
      );
      item.iconPath = new vscode.ThemeIcon(
        "circle-outline",
        new vscode.ThemeColor("foreground")
      );
      items.push(item);
    }

    // Backlog
    if (groups.backlog.length > 0) {
      const item = new DigitalAITicketTreeItem(
        `Backlog (${groups.backlog.length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        undefined,
        "digitalaiStatusGroup:backlog"
      );
      item.iconPath = new vscode.ThemeIcon(
        "archive",
        new vscode.ThemeColor("charts.purple")
      );
      items.push(item);
    }

    return items;
  }

  private async getRecentlyCompleted(): Promise<DigitalAITicketTreeItem[]> {
    if (!this.client) return [];

    const stories = await this.client.getRecentlyCompletedIssues(14);

    if (stories.length === 0) {
      const item = new DigitalAITicketTreeItem(
        "No completed stories in the last 14 days",
        vscode.TreeItemCollapsibleState.None
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    return stories.slice(0, 10).map((story) => this.createStoryItem(story));
  }

  private async getTeams(): Promise<DigitalAITicketTreeItem[]> {
    if (!this.client) return [];

    const teams = await this.client.getTeams();

    if (teams.length === 0) {
      const item = new DigitalAITicketTreeItem(
        "No teams found",
        vscode.TreeItemCollapsibleState.None
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    return teams.map((team) => {
      const item = new DigitalAITicketTreeItem(
        team.name,
        vscode.TreeItemCollapsibleState.None,
        undefined,
        `digitalaiTeam:${team.id}`
      );
      item.iconPath = new vscode.ThemeIcon("organization");
      item.tooltip = `${team.name} (${team.key})`;
      return item;
    });
  }

  private async getProjects(): Promise<DigitalAITicketTreeItem[]> {
    if (!this.client) return [];

    const projects = await this.client.getProjects();

    if (projects.length === 0) {
      const item = new DigitalAITicketTreeItem(
        "No projects found",
        vscode.TreeItemCollapsibleState.None
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    return projects.map((project) => {
      const item = new DigitalAITicketTreeItem(
        project.name,
        vscode.TreeItemCollapsibleState.Collapsed,
        undefined,
        `digitalaiProject:${project.id}`
      );
      item.iconPath = new vscode.ThemeIcon("project");
      item.tooltip = project.description || project.name;
      return item;
    });
  }

  private async getStoriesByStatus(
    status: string
  ): Promise<DigitalAITicketTreeItem[]> {
    const groups = this.groupStoriesByStatus(this.cachedStories);
    const stories = groups[status as keyof typeof groups] || [];
    return stories.map((story) => this.createStoryItem(story));
  }

  private async getProjectUnassigned(
    projectId: string
  ): Promise<DigitalAITicketTreeItem[]> {
    if (!this.client) return [];

    const stories = await this.client.getProjectUnassignedIssues(projectId, 20);

    if (stories.length === 0) {
      const item = new DigitalAITicketTreeItem(
        "No unassigned stories",
        vscode.TreeItemCollapsibleState.None
      );
      item.iconPath = new vscode.ThemeIcon(
        "check",
        new vscode.ThemeColor("charts.green")
      );
      return [item];
    }

    return stories.map((story) => this.createStoryItem(story));
  }

  // ==================== Story Item Creation ====================

  private createStoryItem(
    story: DigitalAINormalizedStory
  ): DigitalAITicketTreeItem {
    const item = new DigitalAITicketTreeItem(
      story.title,
      vscode.TreeItemCollapsibleState.None,
      story,
      this.getStoryContextValue(story)
    );

    // Description with identifier
    let description = story.identifier;

    // Add branch indicator if present
    const branch = this.branchManager.getBranchForTicket(story.identifier);
    if (branch) {
      description += " ✓";
    }

    item.description = description;

    // Icon based on status
    item.iconPath = this.getStatusIcon(story.state.type, story.priority);

    // Tooltip
    item.tooltip = this.getStoryTooltip(story);

    // Command to open story details
    item.command = {
      command: "devBuddy.digitalai.openStory",
      title: "Open Story",
      arguments: [story],
    };

    return item;
  }

  private getStoryContextValue(story: DigitalAINormalizedStory): string {
    let contextValue = "digitalaiStory";

    if (story.state.type === "unstarted") {
      contextValue += ":unstarted";
    } else if (story.state.type === "started") {
      contextValue += ":started";

      const branch = this.branchManager.getBranchForTicket(story.identifier);
      if (branch) {
        contextValue += ":withBranch";
      }
    } else if (story.state.type === "completed") {
      contextValue += ":completed";
    }

    return contextValue;
  }

  private getStatusIcon(
    statusType: string,
    priority: number
  ): vscode.ThemeIcon {
    switch (statusType) {
      case "started":
        return new vscode.ThemeIcon(
          "play-circle",
          new vscode.ThemeColor("charts.blue")
        );
      case "completed":
        return new vscode.ThemeIcon(
          "check-all",
          new vscode.ThemeColor("charts.green")
        );
      case "canceled":
        return new vscode.ThemeIcon(
          "circle-slash",
          new vscode.ThemeColor("disabledForeground")
        );
      case "backlog":
        return new vscode.ThemeIcon(
          "circle-outline",
          new vscode.ThemeColor("charts.purple")
        );
      case "unstarted":
        return this.getPriorityIcon(priority);
      default:
        return new vscode.ThemeIcon("circle");
    }
  }

  private getPriorityIcon(priority: number): vscode.ThemeIcon {
    switch (priority) {
      case 1: // Urgent
        return new vscode.ThemeIcon(
          "alert",
          new vscode.ThemeColor("errorForeground")
        );
      case 2: // High
        return new vscode.ThemeIcon(
          "arrow-up",
          new vscode.ThemeColor("editorWarning.foreground")
        );
      case 3: // Medium
        return new vscode.ThemeIcon(
          "circle-outline",
          new vscode.ThemeColor("charts.yellow")
        );
      case 4: // Low
        return new vscode.ThemeIcon(
          "arrow-down",
          new vscode.ThemeColor("descriptionForeground")
        );
      default:
        return new vscode.ThemeIcon("dash");
    }
  }

  private getStoryTooltip(story: DigitalAINormalizedStory): string {
    const priorityLabels: Record<number, string> = {
      0: "No priority",
      1: "Urgent",
      2: "High",
      3: "Medium",
      4: "Low",
    };

    const lines = [
      `${story.identifier}: ${story.title}`,
      ``,
      `Status: ${story.state.name}`,
      `Priority: ${priorityLabels[story.priority] || "No priority"}`,
    ];

    if (story.assignee) {
      lines.push(`Assignee: ${story.assignee.name}`);
    }

    if (story.project) {
      lines.push(`Project: ${story.project.name}`);
    }

    if (story.sprint) {
      lines.push(`Sprint: ${story.sprint.name}`);
    }

    if (story.team) {
      lines.push(`Team: ${story.team.name}`);
    }

    if (story.estimate) {
      lines.push(`Estimate: ${story.estimate}`);
    }

    return lines.join("\n");
  }

  // ==================== Helpers ====================

  private groupStoriesByStatus(stories: DigitalAINormalizedStory[]) {
    return {
      backlog: stories.filter((s) => s.state.type === "backlog"),
      unstarted: stories.filter((s) => s.state.type === "unstarted"),
      started: stories.filter((s) => s.state.type === "started"),
      completed: stories.filter((s) => s.state.type === "completed"),
      canceled: stories.filter((s) => s.state.type === "canceled"),
    };
  }

  private createErrorItem(message: string): DigitalAITicketTreeItem {
    const item = new DigitalAITicketTreeItem(
      message,
      vscode.TreeItemCollapsibleState.None,
      undefined,
      "error"
    );
    item.iconPath = new vscode.ThemeIcon(
      "error",
      new vscode.ThemeColor("errorForeground")
    );
    item.tooltip = "Click refresh to try again";
    item.description = "Click ↻ to retry";
    return item;
  }
}

