/**
 * Universal Tickets Provider
 * 
 * Platform-agnostic tree view that shows tickets from the active provider.
 * Supports Linear, Jira Cloud, and future platforms.
 */

import * as vscode from "vscode";
import { LinearClient } from "../../providers/linear/LinearClient";
import { LinearIssue } from "../../providers/linear/types";
import { JiraCloudClient } from "../../providers/jira/cloud/JiraCloudClient";
import { JiraIssue } from "../../providers/jira/common/types";
import { getLogger } from "../utils/logger";
import { BranchAssociationManager } from "../git/branchAssociationManager";

const logger = getLogger();

type TicketItem = LinearIssue | JiraIssue;
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

  private currentPlatform: Platform = null;
  private branchManager: BranchAssociationManager;

  constructor(private context: vscode.ExtensionContext) {
    this.detectPlatform();
    
    // Initialize branch manager for Linear
    this.branchManager = new BranchAssociationManager(context);
    
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
    const setupItem = new UniversalTicketTreeItem(
      "⚙️ Choose Your Platform",
      vscode.TreeItemCollapsibleState.None,
      null
    );
    setupItem.command = {
      command: "workbench.action.openSettings",
      title: "Open Settings",
      arguments: ["devBuddy.provider"],
    };
    setupItem.tooltip = "Click to choose Linear or Jira";

    return [setupItem];
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

      // Root level - show 4 main sections
      if (!element) {
        return this.getLinearRootSections();
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
        // Expand team to show team's issues, unassigned, and projects
        const teamId = contextValue.split(":")[1];
        return this.getLinearTeamContent(client, teamId);
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

    if (issues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No active issues",
        vscode.TreeItemCollapsibleState.None,
        "linear"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    // Group by status
    const grouped = this.groupLinearIssuesByStatus(issues);
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
   * Get team content - issues, unassigned, and projects for a team
   */
  private async getLinearTeamContent(
    client: LinearClient,
    teamId: string
  ): Promise<UniversalTicketTreeItem[]> {
    // TODO: Need to implement these methods in LinearClient
    // For now, just show my issues in this team
    const issues = await client.getMyIssues({
      state: ["unstarted", "started"],
      teamId: teamId,
    });

    if (issues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No issues in this team",
        vscode.TreeItemCollapsibleState.None,
        "linear"
      );
      item.iconPath = new vscode.ThemeIcon("info");
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
    // TODO: Need to implement getProjectUnassignedIssues in LinearClient
    // For now, return empty
    const item = new UniversalTicketTreeItem(
      "No unassigned issues",
      vscode.TreeItemCollapsibleState.None,
      "linear"
    );
    item.iconPath = new vscode.ThemeIcon("info");
    return [item];
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
    const attachmentNodes = (issue.attachments as any)?.nodes || [];
    const hasPR = attachmentNodes.some((att: any) => {
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

  private async getJiraChildren(
    element?: UniversalTicketTreeItem
  ): Promise<UniversalTicketTreeItem[]> {
    try {
      const client = await JiraCloudClient.create();

      if (!client.isConfigured()) {
        return this.getJiraSetupInstructions();
      }

      // Root level - show 3 main sections
      if (!element) {
        return this.getJiraRootSections();
      }

      // Handle section expansions
      const contextValue = element.contextValue || "";

      if (contextValue === "jiraSection:myIssues") {
        return this.getJiraMyIssues(client);
      } else if (contextValue === "jiraSection:done") {
        return this.getJiraRecentlyDone(client);
      } else if (contextValue === "jiraSection:boards") {
        return this.getJiraBoards(client);
      } else if (contextValue === "jiraSection:projects") {
        return this.getJiraProjects(client);
      } else if (contextValue.startsWith("jiraStatusGroup:")) {
        // Expand status group to show issues
        const statusCategory = contextValue.split(":")[1];
        return this.getJiraIssuesByStatusCategory(client, statusCategory);
      } else if (contextValue.startsWith("jiraBoard:")) {
        // Expand board to show board's issues
        const boardId = parseInt(contextValue.split(":")[1]);
        return this.getJiraBoardIssues(client, boardId);
      } else if (contextValue.startsWith("jiraProject:")) {
        // Expand project to show project's issues
        const projectKey = contextValue.split(":")[1];
        return this.getJiraProjectIssues(client, projectKey);
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
   * Get the 3 main sections for Jira root view
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
        "jiraSection:done",
        "Recently Done",
        "folder-opened",
        "charts.green",
        "jira"
      ),
      this.createSectionHeader(
        "jiraSection:boards",
        "Your Boards",
        "folder-opened",
        "charts.purple",
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
  private async getJiraMyIssues(client: JiraCloudClient): Promise<UniversalTicketTreeItem[]> {
    const issues = await client.getMyIssues();
    
    // Filter out done issues
    const activeIssues = issues.filter(
      (i) => i.status.statusCategory.key !== "done"
    );

    if (activeIssues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No active issues",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    // Group by status category
    const groups = this.groupJiraIssuesByStatusCategory(activeIssues);
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
   * Get Recently Done section - shows last 10 done issues
   */
  private async getJiraRecentlyDone(client: JiraCloudClient): Promise<UniversalTicketTreeItem[]> {
    const issues = await client.getMyIssues();
    
    // Filter for done issues
    const doneIssues = issues.filter(
      (i) => i.status.statusCategory.key === "done"
    );

    if (doneIssues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No completed issues",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    // Sort by updated date and limit to 10
    const sortedIssues = doneIssues
      .sort((a, b) => {
        const dateA = new Date(a.updated).getTime();
        const dateB = new Date(b.updated).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    return sortedIssues.map((issue) => this.createJiraIssueItem(issue));
  }

  /**
   * Get Your Boards section - shows all boards (teams)
   */
  private async getJiraBoards(client: JiraCloudClient): Promise<UniversalTicketTreeItem[]> {
    const boards = await client.getBoards();

    if (boards.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No boards found",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    return boards.map((board) => {
      const item = new UniversalTicketTreeItem(
        board.name,
        vscode.TreeItemCollapsibleState.Collapsed,
        "jira",
        undefined,
        `jiraBoard:${board.id}`
      );
      
      // Different icons for Scrum vs Kanban
      const icon = board.type === "scrum" ? "rocket" : "layout";
      item.iconPath = new vscode.ThemeIcon(icon);
      
      // Show board type and project in tooltip
      const projectInfo = board.location 
        ? ` (${board.location.projectName})`
        : "";
      item.tooltip = `${board.name} - ${board.type}${projectInfo}`;
      
      return item;
    });
  }

  /**
   * Get issues for a specific board
   */
  private async getJiraBoardIssues(
    client: JiraCloudClient,
    boardId: number
  ): Promise<UniversalTicketTreeItem[]> {
    // Get all issues and filter by board
    // Note: We'd need to implement getBoardIssues in JiraCloudClient for proper filtering
    // For now, we'll show a placeholder or filter from all issues
    const allIssues = await client.getMyIssues();
    
    if (allIssues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No issues on this board",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    // TODO: Implement proper board issue filtering in JiraCloudClient
    // For now, show all user's issues as a fallback
    return allIssues.slice(0, 20).map((issue) => this.createJiraIssueItem(issue));
  }

  /**
   * Get Projects section - shows all projects
   */
  private async getJiraProjects(client: JiraCloudClient): Promise<UniversalTicketTreeItem[]> {
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
    client: JiraCloudClient,
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
   * Get issues for a specific project
   */
  private async getJiraProjectIssues(
    client: JiraCloudClient,
    projectKey: string
  ): Promise<UniversalTicketTreeItem[]> {
    // Filter issues by project
    const allIssues = await client.getMyIssues();
    const projectIssues = allIssues.filter((i) => i.project.key === projectKey);

    if (projectIssues.length === 0) {
      const item = new UniversalTicketTreeItem(
        "No issues in this project",
        vscode.TreeItemCollapsibleState.None,
        "jira"
      );
      item.iconPath = new vscode.ThemeIcon("info");
      return [item];
    }

    return projectIssues.map((issue) => this.createJiraIssueItem(issue));
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

