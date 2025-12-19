/**
 * Universal Tickets Provider
 * 
 * Platform-agnostic tree view that shows tickets from the active provider.
 * Supports Linear, Jira Cloud, Jira Server, and future platforms.
 */

import * as vscode from "vscode";
import { LinearClient } from "@providers/linear/LinearClient";
import { LinearIssue } from "@providers/linear/types";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";
import { JiraServerClient } from "@providers/jira/server/JiraServerClient";
import { JiraIssue } from "@providers/jira/common/types";
import { BaseJiraClient } from "@providers/jira/common/BaseJiraClient";
import { getLogger } from "@shared/utils/logger";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";
import { fuzzySearch } from "@shared/utils/fuzzySearch";
import { debounce } from "@shared/utils/debounce";

const logger = getLogger();

export type TicketItem = LinearIssue | JiraIssue;
type Platform = "linear" | "jira" | null;

/**
 * Tree item that can represent either Linear or Jira tickets
 */
export class UniversalTicketTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly platform: Platform,
    public readonly ticket?: TicketItem,
    public readonly contextValue?: string
  ) {
    super(label, collapsibleState);
  }

  // Expose ticket as 'issue' for backwards compatibility with commands
  get issue(): TicketItem | undefined {
    return this.ticket;
  }
}

export class UniversalTicketsProvider
  implements vscode.TreeDataProvider<UniversalTicketTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    UniversalTicketTreeItem | undefined | null | void
  > = new vscode.EventEmitter<UniversalTicketTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    UniversalTicketTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private _onDidRefresh: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onDidRefresh: vscode.Event<void> = this._onDidRefresh.event;

  private currentPlatform: Platform = null;
  private branchManager: BranchAssociationManager;
  private searchQuery: string | null = null;
  private cachedIssues: TicketItem[] = [];
  private debouncedRefresh: () => void;

  constructor(private context: vscode.ExtensionContext) {
    this.detectPlatform();
    
    // Initialize branch manager for Linear
    this.branchManager = new BranchAssociationManager(context);
    
    // Create debounced refresh for search (300ms delay)
    this.debouncedRefresh = debounce(() => {
      this._onDidChangeTreeData.fire();
    }, 300);
    
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("devBuddy.provider")) {
        this.detectPlatform();
        this.refresh();
      }
    });
  }

  /**
   * Detect which platform is currently configured
   */
  private detectPlatform(): void {
    const config = vscode.workspace.getConfiguration("devBuddy");
    this.currentPlatform = config.get<Platform>("provider", null);
    logger.info(`Current platform: ${this.currentPlatform || "none"}`);
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
    this._onDidRefresh.fire();
  }

  /**
   * Set search query and refresh view with debounce
   */
  public setSearchQuery(query: string | null): void {
    this.searchQuery = query;
    
    // Only filter if query is 3+ characters or empty (clear)
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
   * Get the current issues list (for quick open)
   */
  public getIssues(): TicketItem[] {
    return this.cachedIssues;
  }

  /**
   * Get tree item representation
   */
  getTreeItem(element: UniversalTicketTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for tree view
   */
  async getChildren(
    element?: UniversalTicketTreeItem
  ): Promise<UniversalTicketTreeItem[]> {
    // No platform configured
    if (!this.currentPlatform) {
      return this.getSetupInstructions();
    }

    // Route to appropriate platform provider
    if (this.currentPlatform === "linear") {
      return this.getLinearChildren(element);
    } else if (this.currentPlatform === "jira") {
      return this.getJiraChildren(element);
    }

    return [];
  }

  /**
   * Create section header with icon and color
   */
  private createSectionHeader(
    id: string,
    label: string,
    icon: string,
    colorKey: string,
    platform: Platform
  ): UniversalTicketTreeItem {
    const item = new UniversalTicketTreeItem(
      label,
      vscode.TreeItemCollapsibleState.Collapsed,
      platform,
      undefined,
      id
    );
    item.iconPath = new vscode.ThemeIcon(icon, new vscode.ThemeColor(colorKey));
    return item;
  }

  /**
   * Show setup instructions when no platform is configured
   */
  private getSetupInstructions(): UniversalTicketTreeItem[] {
    const walkthroughItem = new UniversalTicketTreeItem(
      "🚀 Get Started with DevBuddy",
      vscode.TreeItemCollapsibleState.None,
      null
    );
    walkthroughItem.command = {
      command: "workbench.action.openWalkthrough",
      title: "Open Walkthrough",
      arguments: ["angelogirardi.dev-buddy#devBuddy.gettingStarted", false],
    };
    walkthroughItem.tooltip = "Click to start the setup walkthrough";
    walkthroughItem.description = "Click to configure →";

    const settingsItem = new UniversalTicketTreeItem(
      "⚙️ Or Choose Platform Manually",
      vscode.TreeItemCollapsibleState.None,
      null
    );
    settingsItem.command = {
      command: "workbench.action.openSettings",
      title: "Open Settings",
      arguments: ["devBuddy.provider"],
    };
    settingsItem.tooltip = "Open settings to choose Linear or Jira";
    settingsItem.description = "Linear / Jira";

    return [walkthroughItem, settingsItem];
  }

  // ==================== LINEAR IMPLEMENTATION ====================

  private async getLinearChildren(
    element?: UniversalTicketTreeItem
  ): Promise<UniversalTicketTreeItem[]> {
    try {
      const client = await LinearClient.create();

      if (!client.isConfigured()) {
        return this.getLinearSetupInstructions();
      }

      // Root level - show sections with optional search indicator
      if (!element) {
        const items: UniversalTicketTreeItem[] = [];
        
        // Show search indicator if there's an active search
        if (this.searchQuery && this.searchQuery.length >= 3) {
          const searchIndicator = new UniversalTicketTreeItem(
            `🔍 "${this.searchQuery}"`,
            vscode.TreeItemCollapsibleState.None,
            "linear",
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
        
        const sections = this.getLinearRootSections();
        return [...items, ...sections];
      }

      // Handle section expansions
      const contextValue = element.contextValue || "";

      if (contextValue === "linearSection:myIssues") {
        return this.getLinearMyIssues(client);
      } else if (contextValue === "linearSection:completed") {
        return this.getLinearRecentlyCompleted(client);
      } else if (contextValue === "linearSection:teams") {
        return this.getLinearTeams(client);
      } else if (contextValue === "linearSection:projects") {
        return this.getLinearProjects(client);
      } else if (contextValue.startsWith("linearStatusGroup:")) {
        // Expand status group to show tickets
        const status = contextValue.split(":")[1];
        return this.getLinearTicketsByStatus(client, status);
      } else if (contextValue.startsWith("linearTeam:")) {
        // Expand team to show subsections (My Issues, Unassigned)
        const teamId = contextValue.split(":")[1];
        return this.getLinearTeamContent(client, teamId);
      } else if (contextValue.startsWith("linearTeamMyIssues:")) {
        // Show my issues in this team
        const teamId = contextValue.split(":")[1];
        return this.getLinearTeamMyIssues(client, teamId);
      } else if (contextValue.startsWith("linearTeamUnassigned:")) {
        // Show unassigned issues in this team
        const teamId = contextValue.split(":")[1];
        return this.getLinearTeamUnassignedIssues(client, teamId);
      } else if (contextValue.startsWith("linearProject:")) {
        // Expand project to show unassigned issues
        const projectId = contextValue.split(":")[1];
        return this.getLinearProjectUnassigned(client, projectId);
      }

      return [];
    } catch (error) {
      logger.error("Failed to load Linear tickets:", error);
      return [this.createErrorItem("Failed to load Linear tickets")];
    }
  }

  private getLinearSetupInstructions(): UniversalTicketTreeItem[] {
    const setupItem = new UniversalTicketTreeItem(
      "⚙️ Configure Linear API Token",
      vscode.TreeItemCollapsibleState.None,
      "linear"
    );
    setupItem.command = {
      command: "devBuddy.configureLinearToken",
      title: "Configure Linear",
    };
    setupItem.tooltip = "Click to set up Linear integration";

    return [setupItem];
  }

  /**
   * Get the 4 main sections for Linear root view
   */
  private getLinearRootSections(): UniversalTicketTreeItem[] {
    return [
      this.createSectionHeader(
        "linearSection:myIssues",
        "My Issues",
        "folder-opened",
        "charts.blue",
        "linear"
      ),
      this.createSectionHeader(
        "linearSection:completed",
        "Recently Completed",
        "folder-opened",
        "charts.green",
        "linear"
      ),
      this.createSectionHeader(
        "linearSection:teams",
        "Your Teams",
        "folder-opened",
        "charts.purple",
        "linear"
      ),
      this.createSectionHeader(
        "linearSection:projects",
        "Projects",
        "folder-opened",
        "charts.orange",
        "linear"
      ),
    ];
  }

  /**
   * Get My Issues section - shows active issues grouped by status
   */
  private async getLinearMyIssues(client: LinearClient): Promise<UniversalTicketTreeItem[]> {
    const issues = await client.getMyIssues({ state: ["backlog", "unstarted", "started"] });

    // Cache all issues for getIssues() method and quick open
    this.cachedIssues = issues;

    // Apply search filter if active
    const filteredIssues = this.searchQuery 
      ? fuzzySearch(issues, this.searchQuery, [
          (issue) => (issue as LinearIssue).identifier,
          (issue) => (issue as LinearIssue).title,
          (issue) => (issue as LinearIssue).description || "",
        ])
      : issues;

    if (filteredIssues.length === 0 && this.searchQuery) {
      // No search results
      const item = new UniversalTicketTreeItem(
        `No tickets found for "${this.searchQuery}"`,
        vscode.TreeItemCollapsibleState.None,
        "linear"
      );
      item.iconPath = new vscode.ThemeIcon("search-stop");
      return [item];
    }

    if (filteredIssues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No active issues",
        vscode.TreeItemCollapsibleState.None,
        "linear"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    // Group by status
    const grouped = this.groupLinearIssuesByStatus(filteredIssues as LinearIssue[]);
    const items: UniversalTicketTreeItem[] = [];

    // Show status groups
    if (grouped.started.length > 0) {
      const item = new UniversalTicketTreeItem(
        `In Progress (${grouped.started.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        "linear",
        undefined,
        "linearStatusGroup:started"
      );
      item.iconPath = new vscode.ThemeIcon(
        "play-circle",
        new vscode.ThemeColor("charts.blue")
      );
      items.push(item);
    }

    if (grouped.unstarted.length > 0) {
      const item = new UniversalTicketTreeItem(
        `Todo (${grouped.unstarted.length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        "linear",
        undefined,
        "linearStatusGroup:unstarted"
      );
      item.iconPath = new vscode.ThemeIcon(
        "circle-outline",
        new vscode.ThemeColor("foreground")
      );
      items.push(item);
    }

    if (grouped.backlog.length > 0) {
      const item = new UniversalTicketTreeItem(
        `Backlog (${grouped.backlog.length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        "linear",
        undefined,
        "linearStatusGroup:backlog"
      );
      item.iconPath = new vscode.ThemeIcon(
        "archive",
        new vscode.ThemeColor("charts.purple")
      );
      items.push(item);
    }

    return items;
  }

  /**
   * Get Recently Completed section - shows last 10 completed issues
   */
  private async getLinearRecentlyCompleted(client: LinearClient): Promise<UniversalTicketTreeItem[]> {
    const issues = await client.getMyIssues({ state: ["completed"] });

    if (issues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No completed issues",
        vscode.TreeItemCollapsibleState.None,
        "linear"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    // Sort by updated date (most recent first) and limit to 10
    const sortedIssues = issues
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    return sortedIssues.map((issue) => this.createLinearTicketItem(issue));
  }

  /**
   * Get Your Teams section - shows all user's teams
   */
  private async getLinearTeams(client: LinearClient): Promise<UniversalTicketTreeItem[]> {
    const teams = await client.getUserTeams();

    if (teams.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No teams found",
        vscode.TreeItemCollapsibleState.None,
        "linear"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    return teams.map((team) => {
      const item = new UniversalTicketTreeItem(
        team.name,
        vscode.TreeItemCollapsibleState.Collapsed,
        "linear",
        undefined,
        `linearTeam:${team.id}`
      );
      item.iconPath = new vscode.ThemeIcon("organization");
      item.tooltip = `${team.name} (${team.key})`;
      return item;
    });
  }

  /**
   * Get Projects section - shows all user's projects
   */
  private async getLinearProjects(client: LinearClient): Promise<UniversalTicketTreeItem[]> {
    const projects = await client.getUserProjects();

    if (projects.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No projects found",
        vscode.TreeItemCollapsibleState.None,
        "linear"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    return projects.map((project) => {
      const item = new UniversalTicketTreeItem(
        project.name,
        vscode.TreeItemCollapsibleState.Collapsed,
        "linear",
        undefined,
        `linearProject:${project.id}`
      );
      item.iconPath = new vscode.ThemeIcon("project");
      item.tooltip = project.name;
      return item;
    });
  }

  /**
   * Get tickets for a specific status
   */
  private async getLinearTicketsByStatus(
    client: LinearClient,
    status: string
  ): Promise<UniversalTicketTreeItem[]> {
    const issues = await client.getMyIssues({ state: ["backlog", "unstarted", "started", "completed"] });
    const groups = this.groupLinearIssuesByStatus(issues);

    const filteredIssues = groups[status as keyof typeof groups] || [];

    if (filteredIssues.length === 0) {
      return [];
    }

    return filteredIssues.map((issue) => this.createLinearTicketItem(issue));
  }

  /**
   * Get team content - shows "My Issues" and "Unassigned" subsections
   */
  private async getLinearTeamContent(
    _client: LinearClient,
    teamId: string
  ): Promise<UniversalTicketTreeItem[]> {
    const myIssuesItem = new UniversalTicketTreeItem(
      "My Issues",
      vscode.TreeItemCollapsibleState.Collapsed,
      "linear",
      undefined,
      `linearTeamMyIssues:${teamId}`
    );
    myIssuesItem.iconPath = new vscode.ThemeIcon("account", new vscode.ThemeColor("charts.blue"));

    const unassignedItem = new UniversalTicketTreeItem(
      "Unassigned",
      vscode.TreeItemCollapsibleState.Collapsed,
      "linear",
      undefined,
      `linearTeamUnassigned:${teamId}`
    );
    unassignedItem.iconPath = new vscode.ThemeIcon("question", new vscode.ThemeColor("charts.yellow"));

    return [myIssuesItem, unassignedItem];
  }

  /**
   * Get my issues in a specific team
   */
  private async getLinearTeamMyIssues(
    client: LinearClient,
    teamId: string
  ): Promise<UniversalTicketTreeItem[]> {
    const issues = await client.getMyIssues({
      state: ["unstarted", "started", "backlog"],
      teamId: teamId,
    });

    if (issues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No issues assigned to you",
        vscode.TreeItemCollapsibleState.None,
        "linear"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    return issues.map((issue) => this.createLinearTicketItem(issue));
  }

  /**
   * Get unassigned issues in a specific team
   */
  private async getLinearTeamUnassignedIssues(
    client: LinearClient,
    teamId: string
  ): Promise<UniversalTicketTreeItem[]> {
    const issues = await client.getTeamUnassignedIssues(teamId);

    if (issues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No unassigned issues",
        vscode.TreeItemCollapsibleState.None,
        "linear"
      );
      item.iconPath = new vscode.ThemeIcon("check", new vscode.ThemeColor("charts.green"));
      return [item];
    }

    return issues.map((issue) => this.createLinearTicketItem(issue));
  }

  /**
   * Get unassigned issues for a project
   */
  private async getLinearProjectUnassigned(
    client: LinearClient,
    projectId: string
  ): Promise<UniversalTicketTreeItem[]> {
    const issues = await client.getProjectUnassignedIssues(projectId);

    if (issues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No unassigned issues",
        vscode.TreeItemCollapsibleState.None,
        "linear"
      );
      item.iconPath = new vscode.ThemeIcon("check", new vscode.ThemeColor("charts.green"));
      return [item];
    }

    return issues.map((issue) => this.createLinearTicketItem(issue));
  }

  private groupLinearIssuesByStatus(issues: LinearIssue[]) {
    return {
      backlog: issues.filter((i) => i.state.type === "backlog"),
      unstarted: issues.filter((i) => i.state.type === "unstarted"),
      started: issues.filter((i) => i.state.type === "started"),
      completed: issues.filter((i) => i.state.type === "completed"),
      canceled: issues.filter((i) => i.state.type === "canceled"),
    };
  }

  private createLinearTicketItem(issue: LinearIssue): UniversalTicketTreeItem {
    const item = new UniversalTicketTreeItem(
      issue.title,
      vscode.TreeItemCollapsibleState.None,
      "linear",
      issue,
      this.getLinearTicketContextValue(issue)
    );

    // Set description to show identifier
    item.description = issue.identifier;

    // Set icon based on status and priority with proper color coding
    item.iconPath = this.getLinearStatusIcon(issue.state.type, issue.priority);

    // Rich tooltip with detailed information
    item.tooltip = this.getLinearTicketTooltip(issue);

    item.command = {
      command: "devBuddy.openTicket",
      title: "Open Ticket",
      arguments: [issue],
    };

    return item;
  }

  /**
   * Get status icon with color coding for Linear tickets
   */
  private getLinearStatusIcon(statusType: string, priority: number): vscode.ThemeIcon {
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
        // For unstarted, show priority-based colors
        return this.getLinearPriorityIcon(priority);
      default:
        return new vscode.ThemeIcon("circle");
    }
  }

  /**
   * Get priority icon with color coding for Linear tickets
   */
  private getLinearPriorityIcon(priority: number): vscode.ThemeIcon {
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
      default: // None
        return new vscode.ThemeIcon("dash");
    }
  }

  /**
   * Get detailed tooltip for Linear ticket
   */
  private getLinearTicketTooltip(issue: LinearIssue): string {
    const priorityLabels: Record<number, string> = {
      0: "No priority",
      1: "Urgent",
      2: "High",
      3: "Medium",
      4: "Low",
    };

    const lines = [
      `${issue.identifier}: ${issue.title}`,
      ``,
      `Status: ${issue.state.name}`,
      `Priority: ${priorityLabels[issue.priority] || "No priority"}`,
    ];

    if (issue.assignee) {
      lines.push(`Assignee: ${issue.assignee.name}`);
    }

    if (issue.project) {
      lines.push(`Project: ${issue.project.name}`);
    }

    if (issue.labels && issue.labels.length > 0) {
      const labelNames = issue.labels.map(l => l.name).join(", ");
      lines.push(`Labels: ${labelNames}`);
    }

    return lines.join("\n");
  }

  /**
   * Get context value for Linear ticket (for conditional menu items)
   */
  private getLinearTicketContextValue(issue: LinearIssue): string {
    let contextValue = "linearTicket";

    // Add state indicator
    if (issue.state.type === "unstarted") {
      contextValue += ":unstarted";
    } else if (issue.state.type === "started") {
      contextValue += ":started";
      
      // Check if there's an associated branch
      const associatedBranch = this.branchManager.getBranchForTicket(issue.identifier);
      if (associatedBranch) {
        contextValue += ":withBranch";
      }
    }

    // Check if ticket has PR attachments
    interface AttachmentNode {
      sourceType?: string;
    }
    const attachments = issue.attachments as { nodes?: AttachmentNode[] } | undefined;
    const attachmentNodes = attachments?.nodes || [];
    const hasPR = attachmentNodes.some((att: AttachmentNode) => {
      const sourceType = att.sourceType?.toLowerCase() || "";
      return (
        sourceType.includes("github") ||
        sourceType.includes("gitlab") ||
        sourceType.includes("bitbucket")
      );
    });

    if (hasPR) {
      contextValue += ":withPR";
    }

    return contextValue;
  }

  // ==================== JIRA IMPLEMENTATION ====================

  /**
   * Get Jira client based on configured type (cloud vs server)
   */
  private async getJiraClient(): Promise<BaseJiraClient | null> {
    const config = vscode.workspace.getConfiguration("devBuddy");
    const jiraType = config.get<string>("jira.type", "cloud");

    try {
      if (jiraType === "server") {
        return await JiraServerClient.create();
      } else {
        return await JiraCloudClient.create();
      }
    } catch (error) {
      logger.error(`Failed to create ${jiraType} Jira client:`, error);
      return null;
    }
  }

  private async getJiraChildren(
    element?: UniversalTicketTreeItem
  ): Promise<UniversalTicketTreeItem[]> {
    try {
      const client = await this.getJiraClient();

      if (!client || !client.isConfigured()) {
        return this.getJiraSetupInstructions();
      }

      // Root level - show sections with optional search indicator
      if (!element) {
        const items: UniversalTicketTreeItem[] = [];
        
        // Show search indicator if there's an active search
        if (this.searchQuery && this.searchQuery.length >= 3) {
          const searchIndicator = new UniversalTicketTreeItem(
            `🔍 "${this.searchQuery}"`,
            vscode.TreeItemCollapsibleState.None,
            "jira",
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
        
        const sections = this.getJiraRootSections();
        return [...items, ...sections];
      }

      // Handle section expansions
      const contextValue = element.contextValue || "";

      if (contextValue === "jiraSection:myIssues") {
        return this.getJiraMyIssues(client);
      } else if (contextValue === "jiraSection:completed") {
        return this.getJiraRecentlyCompleted(client);
      } else if (contextValue === "jiraSection:sprint") {
        return this.getJiraCurrentSprint(client);
      } else if (contextValue === "jiraSection:projects") {
        return this.getJiraProjects(client);
      } else if (contextValue.startsWith("jiraStatusGroup:")) {
        // Expand status group to show issues
        const statusCategory = contextValue.split(":")[1];
        return this.getJiraIssuesByStatusCategory(client, statusCategory);
      } else if (contextValue.startsWith("jiraSprint:")) {
        // Expand sprint section (myTasks or unassigned)
        const parts = contextValue.split(":");
        const sprintId = parseInt(parts[1]);
        const section = parts[2];
        if (section === "myTasks") {
          return this.getJiraSprintMyTasks(client, sprintId);
        } else if (section === "unassigned") {
          return this.getJiraSprintUnassigned(client, sprintId);
        }
      } else if (contextValue.startsWith("jiraProject:")) {
        // Expand project to show unassigned issues
        const projectKey = contextValue.split(":")[1];
        return this.getJiraProjectUnassigned(client, projectKey);
      }

      return [];
    } catch (error) {
      logger.error("Failed to load Jira issues:", error);
      return [this.createErrorItem("Failed to load Jira issues")];
    }
  }

  private getJiraSetupInstructions(): UniversalTicketTreeItem[] {
    const setupItem = new UniversalTicketTreeItem(
      "⚙️ Configure Jira Cloud",
      vscode.TreeItemCollapsibleState.None,
      "jira"
    );
    setupItem.command = {
      command: "devBuddy.jira.setup",
      title: "Setup Jira",
    };
    setupItem.tooltip = "Click to set up Jira Cloud integration";

    return [setupItem];
  }

  /**
   * Get the main sections for Jira root view
   * Matches the structure defined in ROADMAP_1.0.0.md:
   * - My Issues (grouped by status)
   * - Recently Completed
   * - Current Sprint (with My Tasks and Unassigned)
   * - Projects (with Unassigned issues)
   */
  private getJiraRootSections(): UniversalTicketTreeItem[] {
    return [
      this.createSectionHeader(
        "jiraSection:myIssues",
        "My Issues",
        "folder-opened",
        "charts.blue",
        "jira"
      ),
      this.createSectionHeader(
        "jiraSection:completed",
        "Recently Completed",
        "folder-opened",
        "charts.green",
        "jira"
      ),
      this.createSectionHeader(
        "jiraSection:sprint",
        "Current Sprint",
        "zap",
        "charts.yellow",
        "jira"
      ),
      this.createSectionHeader(
        "jiraSection:projects",
        "Projects",
        "folder-opened",
        "charts.orange",
        "jira"
      ),
    ];
  }

  /**
   * Get My Issues section - shows active issues grouped by status
   */
  private async getJiraMyIssues(client: BaseJiraClient): Promise<UniversalTicketTreeItem[]> {
    const issues = await client.getMyIssues();
    
    // Filter out done issues
    const activeIssues = issues.filter(
      (i) => i.status.statusCategory.key !== "done"
    );

    // Cache all issues for getIssues() method and quick open
    this.cachedIssues = activeIssues;

    // Apply search filter if active
    const filteredIssues = this.searchQuery 
      ? fuzzySearch(activeIssues, this.searchQuery, [
          (issue) => (issue as JiraIssue).key,
          (issue) => (issue as JiraIssue).summary,
          (issue) => (issue as JiraIssue).description || "",
        ])
      : activeIssues;

    if (filteredIssues.length === 0 && this.searchQuery) {
      // No search results
      const item = new UniversalTicketTreeItem(
        `No issues found for "${this.searchQuery}"`,
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("search-stop");
      return [item];
    }

    if (filteredIssues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No active issues",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    // Group by status category
    const groups = this.groupJiraIssuesByStatusCategory(filteredIssues as JiraIssue[]);
    const items: UniversalTicketTreeItem[] = [];

    // In Progress
    if (groups.inprogress.length > 0) {
      const item = new UniversalTicketTreeItem(
        `In Progress (${groups.inprogress.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        "jira",
        undefined,
        "jiraStatusGroup:inprogress"
      );
      item.iconPath = new vscode.ThemeIcon(
        "play-circle",
        new vscode.ThemeColor("charts.blue")
      );
      items.push(item);
    }

    // To Do
    if (groups.todo.length > 0) {
      const item = new UniversalTicketTreeItem(
        `To Do (${groups.todo.length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
        "jira",
        undefined,
        "jiraStatusGroup:todo"
      );
      item.iconPath = new vscode.ThemeIcon(
        "circle-outline",
        new vscode.ThemeColor("foreground")
      );
      items.push(item);
    }

    return items;
  }

  /**
   * Get Recently Completed section - shows last 10 completed issues
   * Uses the dedicated API method for better performance
   */
  private async getJiraRecentlyCompleted(client: BaseJiraClient): Promise<UniversalTicketTreeItem[]> {
    const completedIssues = await client.getRecentlyCompletedIssues(14);

    if (completedIssues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No completed issues in the last 14 days",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    // Limit to 10 for better UX
    return completedIssues.slice(0, 10).map((issue) => this.createJiraIssueItem(issue));
  }

  /**
   * Get Current Sprint section - shows sprint info with My Tasks and Unassigned
   */
  private async getJiraCurrentSprint(client: BaseJiraClient): Promise<UniversalTicketTreeItem[]> {
    // First, get boards to find one with an active sprint
    const boards = await client.getBoards();
    
    if (boards.length === 0) {
      // Check if this is because Agile features aren't available
      const item = new UniversalTicketTreeItem(
        "No sprints available",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      item.tooltip = "Sprints require Jira Software. If you have Jira Software, create a Scrum board to use sprints.";
      return [item];
    }

    // Find first board with an active sprint (try scrum boards first)
    const scrumBoards = boards.filter(b => b.type === "scrum");
    const boardsToCheck = [...scrumBoards, ...boards.filter(b => b.type !== "scrum")];
    
    let activeSprint = null;
    let boardWithSprint = null;
    
    for (const board of boardsToCheck.slice(0, 5)) { // Limit to 5 boards to avoid too many API calls
      const sprint = await client.getActiveSprint(board.id);
      if (sprint) {
        activeSprint = sprint;
        boardWithSprint = board;
        break;
      }
    }

    if (!activeSprint) {
      const item = new UniversalTicketTreeItem(
        "No active sprint found",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      item.tooltip = "Start a sprint in Jira to see it here";
      return [item];
    }

    const items: UniversalTicketTreeItem[] = [];

    // Sprint name header
    const sprintHeader = new UniversalTicketTreeItem(
      `⚡ ${activeSprint.name}`,
      vscode.TreeItemCollapsibleState.None,
      "jira",
      undefined,
      "jiraSprintHeader"
    );
    sprintHeader.iconPath = new vscode.ThemeIcon("milestone", new vscode.ThemeColor("charts.yellow"));
    sprintHeader.description = boardWithSprint?.name;
    sprintHeader.tooltip = activeSprint.goal 
      ? `Goal: ${activeSprint.goal}\nBoard: ${boardWithSprint?.name}`
      : `Board: ${boardWithSprint?.name}`;
    items.push(sprintHeader);

    // Get sprint issues to show counts
    const sprintIssues = await client.getSprintIssues(activeSprint.id);
    const currentUser = await client.getCurrentUser();
    const myIssues = currentUser 
      ? sprintIssues.filter(i => i.assignee?.accountId === currentUser.accountId)
      : [];
    const unassignedIssues = sprintIssues.filter(i => i.assignee === null);

    // My Sprint Tasks (collapsible)
    const myTasksItem = new UniversalTicketTreeItem(
      `My Tasks (${myIssues.length})`,
      vscode.TreeItemCollapsibleState.Collapsed,
      "jira",
      undefined,
      `jiraSprint:${activeSprint.id}:myTasks`
    );
    myTasksItem.iconPath = new vscode.ThemeIcon("account", new vscode.ThemeColor("charts.blue"));
    items.push(myTasksItem);

    // Unassigned (collapsible)
    const unassignedItem = new UniversalTicketTreeItem(
      `Unassigned (${unassignedIssues.length})`,
      vscode.TreeItemCollapsibleState.Collapsed,
      "jira",
      undefined,
      `jiraSprint:${activeSprint.id}:unassigned`
    );
    unassignedItem.iconPath = new vscode.ThemeIcon("person", new vscode.ThemeColor("charts.orange"));
    items.push(unassignedItem);

    return items;
  }

  /**
   * Get my tasks in a specific sprint
   */
  private async getJiraSprintMyTasks(client: BaseJiraClient, sprintId: number): Promise<UniversalTicketTreeItem[]> {
    const myIssues = await client.getMySprintIssues(sprintId);

    if (myIssues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No tasks assigned to you in this sprint",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("check", new vscode.ThemeColor("charts.green"));
      return [item];
    }

    return myIssues.map((issue) => this.createJiraIssueItem(issue));
  }

  /**
   * Get unassigned issues in a specific sprint
   */
  private async getJiraSprintUnassigned(client: BaseJiraClient, sprintId: number): Promise<UniversalTicketTreeItem[]> {
    const unassignedIssues = await client.getSprintUnassignedIssues(sprintId);

    if (unassignedIssues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No unassigned issues in this sprint",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("check", new vscode.ThemeColor("charts.green"));
      return [item];
    }

    // Limit to 20 for performance
    const items = unassignedIssues.slice(0, 20).map((issue) => this.createJiraIssueItem(issue));
    
    if (unassignedIssues.length > 20) {
      const moreItem = new UniversalTicketTreeItem(
        `... and ${unassignedIssues.length - 20} more`,
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      moreItem.iconPath = new vscode.ThemeIcon("ellipsis");
      moreItem.tooltip = "View more in Jira";
      items.push(moreItem);
    }

    return items;
  }

  /**
   * Get Projects section - shows all projects with unassigned issues
   */
  private async getJiraProjects(client: BaseJiraClient): Promise<UniversalTicketTreeItem[]> {
    const projects = await client.getProjects();

    if (projects.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No projects found",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    return projects.map((project) => {
      const item = new UniversalTicketTreeItem(
        project.name,
        vscode.TreeItemCollapsibleState.Collapsed,
        "jira",
        undefined,
        `jiraProject:${project.key}`
      );
      item.iconPath = new vscode.ThemeIcon("project");
      item.tooltip = `${project.name} (${project.key})`;
      return item;
    });
  }

  /**
   * Get issues for a specific status category
   */
  private async getJiraIssuesByStatusCategory(
    client: BaseJiraClient,
    statusCategory: string
  ): Promise<UniversalTicketTreeItem[]> {
    const issues = await client.getMyIssues();
    const groups = this.groupJiraIssuesByStatusCategory(issues);

    const filteredIssues = groups[statusCategory as keyof typeof groups] || [];

    if (filteredIssues.length === 0) {
      return [];
    }

    return filteredIssues.map((issue) => this.createJiraIssueItem(issue));
  }

  /**
   * Get unassigned issues for a specific project
   * This matches the Linear sidebar behavior of showing unassigned items under projects
   */
  private async getJiraProjectUnassigned(
    client: BaseJiraClient,
    projectKey: string
  ): Promise<UniversalTicketTreeItem[]> {
    const unassignedIssues = await client.getProjectUnassignedIssues(projectKey, 20);

    if (unassignedIssues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No unassigned issues",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("check", new vscode.ThemeColor("charts.green"));
      return [item];
    }

    const items = unassignedIssues.map((issue) => this.createJiraIssueItem(issue));
    
    // Add "more" indicator if we hit the limit
    if (unassignedIssues.length === 20) {
      const moreItem = new UniversalTicketTreeItem(
        "... and more in Jira",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      moreItem.iconPath = new vscode.ThemeIcon("ellipsis");
      moreItem.tooltip = "View more unassigned issues in Jira";
      items.push(moreItem);
    }

    return items;
  }

  private groupJiraIssuesByStatusCategory(issues: JiraIssue[]) {
    return {
      todo: issues.filter(
        (i) => i.status.statusCategory.key === "new"
      ),
      inprogress: issues.filter(
        (i) => i.status.statusCategory.key === "indeterminate"
      ),
      done: issues.filter(
        (i) => i.status.statusCategory.key === "done"
      ),
    };
  }

  private createJiraIssueItem(issue: JiraIssue): UniversalTicketTreeItem {
    const item = new UniversalTicketTreeItem(
      issue.summary,
      vscode.TreeItemCollapsibleState.None,
      "jira",
      issue,
      this.getJiraIssueContextValue(issue)
    );

    // Set description to show key and status
    item.description = `${issue.key} • ${issue.status.name}`;

    // Use VS Code ThemeIcons based on issue type
    item.iconPath = this.getJiraIssueIcon(issue);

    // Detailed tooltip (no emojis)
    item.tooltip = this.getJiraIssueTooltip(issue);

    item.command = {
      command: "devBuddy.jira.viewIssueDetails",
      title: "View Issue Details",
      arguments: [{ issue }],
    };

    return item;
  }

  /**
   * Get icon for Jira issue based on type
   */
  private getJiraIssueIcon(issue: JiraIssue): vscode.ThemeIcon {
    const typeLower = issue.issueType.name.toLowerCase();
    
    if (typeLower.includes("bug")) {
      return new vscode.ThemeIcon("bug");
    } else if (typeLower.includes("story")) {
      return new vscode.ThemeIcon("book");
    } else if (typeLower.includes("task")) {
      return new vscode.ThemeIcon("checklist");
    } else if (typeLower.includes("epic")) {
      return new vscode.ThemeIcon("rocket");
    } else if (typeLower.includes("subtask") || issue.issueType.subtask) {
      return new vscode.ThemeIcon("list-tree");
    } else {
      return new vscode.ThemeIcon("issue-opened");
    }
  }

  /**
   * Get detailed tooltip for Jira issue
   */
  private getJiraIssueTooltip(issue: JiraIssue): string {
    const tooltipLines = [
      `${issue.key}: ${issue.summary}`,
      ``,
      `Type: ${issue.issueType.name}`,
      `Status: ${issue.status.name}`,
      `Priority: ${issue.priority?.name || "None"}`,
      `Project: ${issue.project.name} (${issue.project.key})`,
    ];

    if (issue.assignee) {
      tooltipLines.push(`Assignee: ${issue.assignee.displayName}`);
    } else {
      tooltipLines.push(`Assignee: Unassigned`);
    }

    if (issue.dueDate) {
      tooltipLines.push(`Due: ${new Date(issue.dueDate).toLocaleDateString()}`);
    }

    if (issue.labels.length > 0) {
      tooltipLines.push(`Labels: ${issue.labels.join(", ")}`);
    }

    if (issue.description) {
      tooltipLines.push(``, `Description:`);
      tooltipLines.push(issue.description.substring(0, 200) + (issue.description.length > 200 ? "..." : ""));
    }

    return tooltipLines.join("\n");
  }

  /**
   * Get context value for Jira issue (for conditional menu items)
   */
  private getJiraIssueContextValue(issue: JiraIssue): string {
    const parts = ["jiraIssue"];

    if (issue.assignee) {
      parts.push("assigned");
    } else {
      parts.push("unassigned");
    }

    const statusCategory = issue.status.statusCategory.key;
    parts.push(statusCategory);

    return parts.join(":");
  }

  // ==================== UTILITY METHODS ====================

  private createErrorItem(message: string): UniversalTicketTreeItem {
    const item = new UniversalTicketTreeItem(
      `❌ ${message}`,
      vscode.TreeItemCollapsibleState.None,
      null
    );
    item.tooltip = "Click refresh to try again";
    return item;
  }
}

