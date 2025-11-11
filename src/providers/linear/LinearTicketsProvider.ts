import * as vscode from "vscode";
import { LinearClient } from "./LinearClient";
import { LinearIssue, LinearProject } from "./types";
import { BranchAssociationManager } from "../../shared/git/branchAssociationManager";
import { getLogger } from "../../shared/utils/logger";

export class LinearTicketTreeItem extends vscode.TreeItem {
  constructor(
    public readonly issue: LinearIssue,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: "ticket" | "project" | "section" = "ticket",
    private branchManager?: BranchAssociationManager
  ) {
    super(issue.title, collapsibleState);

    this.tooltip = `${issue.identifier}: ${issue.title}\nStatus: ${issue.state.name}`;
    this.description = issue.identifier;

    // Set contextValue based on item type and status
    if (itemType === "ticket") {
      // Check if ticket has a PR attachment
      const attachmentNodes = issue.attachments?.nodes || [];
      const hasPR = attachmentNodes.some((att) => {
        const sourceType = att.sourceType?.toLowerCase() || "";
        return (
          sourceType.includes("github") ||
          sourceType.includes("gitlab") ||
          sourceType.includes("bitbucket")
        );
      });

      // Build context value
      let contextValue = "linearTicket";

      // Add unstarted indicator for start branch button
      if (issue.state.type === "unstarted") {
        contextValue += ":unstarted";
      }

      // Add started indicator for checkout branch button
      if (issue.state.type === "started") {
        contextValue += ":started";

        // Check if there's an associated branch
        if (branchManager) {
          const associatedBranch = branchManager.getBranchForTicket(
            issue.identifier
          );
          if (associatedBranch) {
            contextValue += ":withBranch";
          }
        }
      }

      // Add PR indicator for open PR button
      if (hasPR) {
        contextValue += ":withPR";
      }

      this.contextValue = contextValue;
    } else {
      this.contextValue = itemType;
    }

    // Set icon based on status with color coding
    if (itemType === "ticket") {
      this.iconPath = this.getStatusIcon(issue.state.type, issue.priority);
    }

    // Command to open ticket when clicked
    if (itemType === "ticket") {
      this.command = {
        command: "devBuddy.openTicket",
        title: "Open Ticket",
        arguments: [issue],
      };
    }
  }

  private getStatusIcon(
    statusType: string,
    priority: number
  ): vscode.ThemeIcon {
    // Color code based on status type
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
      default: // None
        return new vscode.ThemeIcon("dash");
    }
  }
}

export class LinearTicketsProvider
  implements vscode.TreeDataProvider<LinearTicketTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    LinearTicketTreeItem | undefined | null | void
  > = new vscode.EventEmitter<LinearTicketTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    LinearTicketTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private linearClient: LinearClient | null = null;
  private branchManager: BranchAssociationManager;
  private issues: LinearIssue[] = [];
  private projects: LinearProject[] = [];
  private teams: Array<{ id: string; name: string; key: string }> = [];
  private refreshTimer: NodeJS.Timeout | undefined;
  private isRefreshing: boolean = false;

  constructor(context?: vscode.ExtensionContext) {
    this.branchManager = context
      ? new BranchAssociationManager(context)
      : (null as any);
    this.initializeClient();
    this.startAutoRefresh();
  }

  /**
   * Initialize the Linear client asynchronously
   */
  private async initializeClient(): Promise<void> {
    this.linearClient = await LinearClient.create();
    this.refresh();
  }

  /**
   * Get the Linear client, ensuring it's initialized
   */
  private async getClient(): Promise<LinearClient> {
    if (!this.linearClient) {
      this.linearClient = await LinearClient.create();
    }
    return this.linearClient;
  }

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(): void {
    const config = vscode.workspace.getConfiguration("devBuddy");
    const intervalMinutes = config.get<number>("autoRefreshInterval", 5);

    // Clear existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Start new timer if interval > 0
    if (intervalMinutes > 0) {
      const logger = getLogger();
      const intervalMs = intervalMinutes * 60 * 1000;
      this.refreshTimer = setInterval(() => {
        logger.debug("Auto-refreshing tickets...");
        this.refresh();
      }, intervalMs);

      logger.debug(`Auto-refresh enabled: every ${intervalMinutes} minutes`);
    } else {
      getLogger().debug("Auto-refresh disabled");
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
  }

  /**
   * Refresh data in the background without changing the existing view
   * This preloads data so the next view update will be instant
   */
  async refreshInBackground(): Promise<void> {
    if (this.isRefreshing) {
      return; // Don't start another refresh if one is already in progress
    }

    this.isRefreshing = true;
    try {
      const client = await this.getClient();
      if (!client.isConfigured()) {
        return;
      }

      const config = vscode.workspace.getConfiguration("devBuddy");
      const teamId = config.get<string>("linearTeamId");

      // Preload data for all sections in parallel
      const [myIssues, completedIssues, teams, projects] = await Promise.all([
        client
          .getMyIssues({
            state: ["unstarted", "started"],
            teamId: teamId || undefined,
          })
          .catch(() => [] as LinearIssue[]),
        client
          .getMyIssues({
            state: ["completed"],
            teamId: teamId || undefined,
          })
          .catch(() => [] as LinearIssue[]),
        client
          .getUserTeams()
          .catch(() => [] as Array<{ id: string; name: string; key: string }>),
        client.getUserProjects().catch(() => [] as LinearProject[]),
      ]);

      // Update the cached data
      this.issues = myIssues;
      this.projects = projects;
      this.teams = teams;

      getLogger().debug("Background refresh completed - data preloaded");
    } catch (error) {
      getLogger().error("Background refresh failed", error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Get tree item
   */
  getTreeItem(element: LinearTicketTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children (issues)
   */
  async getChildren(
    element?: LinearTicketTreeItem
  ): Promise<LinearTicketTreeItem[]> {
    const client = await this.getClient();
    if (!client.isConfigured()) {
      // Show a message to configure Linear API token
      return [this.createConfigureItem()];
    }

    // Handle expanding different section types
    if (element) {
      switch (element.contextValue) {
        case "myIssuesSection":
          return this.getMyIssuesChildren();

        case "completedSection":
          return this.getCompletedIssuesChildren();

        case "teamsSection":
          return this.getTeamsChildren();

        case "projectsSection":
          return this.getProjectsChildren();

        case "project":
          return this.getUnassignedIssuesForProject(element.issue.id);

        case "team":
          return this.getTeamIssuesChildren(element.issue.id);

        case "myTeamIssues":
        case "unassignedTeamIssues":
        case "teamProjects":
          // These are subsection headers (non-collapsible labels)
          return [];

        case "statusHeader":
          const status = element.issue.state.name;
          const statusIssues = this.issues.filter(
            (issue) => issue.state.name === status
          );
          return statusIssues.map(
            (issue) =>
              new LinearTicketTreeItem(
                issue,
                vscode.TreeItemCollapsibleState.None,
                "ticket",
                this.branchManager
              )
          );

        default:
          return [];
      }
    }

    try {
      // Fetch data from Linear
      const config = vscode.workspace.getConfiguration("devBuddy");
      const teamId = config.get<string>("linearTeamId");

      const items: LinearTicketTreeItem[] = [];

      // Section 1: My Issues (collapsible)
      items.push(this.createCollapsibleSection("myIssuesSection", "My Issues"));

      // Section 2: Recently Completed (collapsible)
      items.push(
        this.createCollapsibleSection("completedSection", "Recently Completed")
      );

      // Section 3: Your Teams (collapsible)
      items.push(this.createCollapsibleSection("teamsSection", "Your Teams"));

      // Section 4: Projects (collapsible)
      items.push(this.createCollapsibleSection("projectsSection", "Projects"));

      return items;
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch issues:", error);
      vscode.window.showErrorMessage(
        `Failed to fetch Linear issues: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return [this.createErrorItem()];
    }
  }

  /**
   * Get unassigned issues for a project
   */
  private async getUnassignedIssuesForProject(
    projectId: string
  ): Promise<LinearTicketTreeItem[]> {
    try {
      const client = await this.getClient();
      const unassignedIssues = await client.getProjectUnassignedIssues(
        projectId
      );

      if (unassignedIssues.length === 0) {
        return [this.createNoUnassignedIssuesItem()];
      }

      return unassignedIssues.map(
        (issue: LinearIssue) =>
          new LinearTicketTreeItem(
            issue,
            vscode.TreeItemCollapsibleState.None,
            "ticket",
            this.branchManager
          )
      );
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch unassigned issues:", error);
      return [this.createErrorItem()];
    }
  }

  /**
   * Get children for My Issues section
   */
  private async getMyIssuesChildren(): Promise<LinearTicketTreeItem[]> {
    try {
      const client = await this.getClient();
      const config = vscode.workspace.getConfiguration("devBuddy");
      const teamId = config.get<string>("linearTeamId");

      this.issues = await client.getMyIssues({
        state: ["unstarted", "started"], // Only show active issues
        teamId: teamId || undefined,
      });

      if (this.issues.length === 0) {
        return [this.createNoIssuesItem()];
      }

      const items: LinearTicketTreeItem[] = [];

      // Group by status
      const grouped = this.groupByStatus(this.issues);

      for (const [status, statusIssues] of Object.entries(grouped)) {
        // Add status header with color coding (collapsible)
        items.push(
          this.createStatusHeader(
            status,
            statusIssues.length,
            statusIssues[0]?.state.type || ""
          )
        );
      }

      return items;
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch my issues:", error);
      return [this.createErrorItem()];
    }
  }

  /**
   * Get children for Recently Completed section
   */
  private async getCompletedIssuesChildren(): Promise<LinearTicketTreeItem[]> {
    try {
      const client = await this.getClient();
      const config = vscode.workspace.getConfiguration("devBuddy");
      const teamId = config.get<string>("linearTeamId");

      const completedIssues = await client.getMyIssues({
        state: ["completed"],
        teamId: teamId || undefined,
      });

      if (completedIssues.length === 0) {
        return [this.createNoCompletedIssuesItem()];
      }

      // Sort by updated date (most recent first) and limit to 10
      const sortedIssues = completedIssues
        .sort((a: LinearIssue, b: LinearIssue) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 10);

      return sortedIssues.map(
        (issue: LinearIssue) =>
          new LinearTicketTreeItem(
            issue,
            vscode.TreeItemCollapsibleState.None,
            "ticket",
            this.branchManager
          )
      );
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch completed issues:", error);
      return [this.createErrorItem()];
    }
  }

  /**
   * Get children for Teams section
   */
  private async getTeamsChildren(): Promise<LinearTicketTreeItem[]> {
    try {
      const client = await this.getClient();
      this.teams = await client.getUserTeams();

      if (this.teams.length === 0) {
        return [this.createNoTeamsItem()];
      }

      return this.teams.map((team) => this.createTeamItem(team));
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch teams:", error);
      return [this.createErrorItem()];
    }
  }

  /**
   * Get children for a specific team
   */
  private async getTeamIssuesChildren(
    teamId: string
  ): Promise<LinearTicketTreeItem[]> {
    try {
      const client = await this.getClient();
      
      // Get both assigned and unassigned issues for this team
      const [myTeamIssues, unassignedIssues, teamProjects] = await Promise.all([
        client.getMyIssues({
          state: ["unstarted", "started"],
          teamId: teamId,
        }),
        client.getTeamUnassignedIssues(teamId),
        client.getTeamProjects(teamId),
      ]);

      const items: LinearTicketTreeItem[] = [];

      // Section 1: My Issues in this team
      if (myTeamIssues.length > 0) {
        items.push(this.createSubSection("myTeamIssues", `My Issues (${myTeamIssues.length})`));
        
        // Group by status
        const grouped = this.groupByStatus(myTeamIssues);
        for (const [status, statusIssues] of Object.entries(grouped)) {
          items.push(
            this.createStatusHeader(
              status,
              statusIssues.length,
              statusIssues[0]?.state.type || ""
            )
          );
        }
      }

      // Section 2: Unassigned Tickets
      if (unassignedIssues.length > 0) {
        items.push(this.createSubSection("unassignedTeamIssues", `Unassigned (${unassignedIssues.length})`));
        
        // Add unassigned issues
        items.push(...unassignedIssues.slice(0, 20).map(
          (issue) =>
            new LinearTicketTreeItem(
              issue,
              vscode.TreeItemCollapsibleState.None,
              "ticket",
              this.branchManager
            )
        ));
        
        if (unassignedIssues.length > 20) {
          items.push(this.createMoreIssuesItem(unassignedIssues.length - 20));
        }
      }

      // Section 3: Team Projects
      if (teamProjects.length > 0) {
        items.push(this.createSubSection("teamProjects", `Team Projects (${teamProjects.length})`));
        items.push(...teamProjects.map((project) => this.createProjectItem(project)));
      }

      if (items.length === 0) {
        return [this.createNoIssuesItem()];
      }

      return items;
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch team issues:", error);
      return [this.createErrorItem()];
    }
  }

  /**
   * Get children for Projects section
   */
  private async getProjectsChildren(): Promise<LinearTicketTreeItem[]> {
    try {
      const client = await this.getClient();
      
      // Get projects from the user's teams
      this.projects = await client.getUserProjects();

      if (this.projects.length === 0) {
        return [this.createNoProjectsItem()];
      }

      return this.projects.map((project) => this.createProjectItem(project));
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch projects:", error);
      return [this.createErrorItem()];
    }
  }

  /**
   * Group issues by status
   */
  private groupByStatus(issues: LinearIssue[]): Record<string, LinearIssue[]> {
    const grouped: Record<string, LinearIssue[]> = {};

    for (const issue of issues) {
      const status = issue.state.name;
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(issue);
    }

    return grouped;
  }

  /**
   * Create collapsible section header
   */
  private createCollapsibleSection(
    contextValue: string,
    title: string
  ): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: contextValue,
        identifier: "",
        title: title,
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.Collapsed,
      "section"
    );

    let icon = "folder";
    let iconColor = new vscode.ThemeColor("symbolIcon.classForeground");

    if (contextValue === "myIssuesSection") {
      icon = "folder-opened";
      iconColor = new vscode.ThemeColor("charts.blue");
    } else if (contextValue === "completedSection") {
      icon = "folder-opened";
      iconColor = new vscode.ThemeColor("charts.green");
    } else if (contextValue === "teamsSection") {
      icon = "folder-opened";
      iconColor = new vscode.ThemeColor("charts.purple");
    } else if (contextValue === "projectsSection") {
      icon = "folder-opened";
      iconColor = new vscode.ThemeColor("charts.orange");
    }

    item.iconPath = new vscode.ThemeIcon(icon, iconColor);
    item.contextValue = contextValue;
    item.command = undefined;
    return item;
  }

  /**
   * Create subsection header (non-collapsible label)
   */
  private createSubSection(
    contextValue: string,
    title: string
  ): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: contextValue,
        identifier: "",
        title: `  ${title}`,
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.None,
      "section"
    );

    item.iconPath = new vscode.ThemeIcon(
      "symbol-field",
      new vscode.ThemeColor("descriptionForeground")
    );
    item.contextValue = contextValue;
    item.command = undefined;
    return item;
  }

  /**
   * Create team item
   */
  private createTeamItem(team: {
    id: string;
    name: string;
    key: string;
  }): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: team.id,
        identifier: team.key,
        title: team.name,
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.Collapsed,
      "section"
    );
    item.iconPath = new vscode.ThemeIcon(
      "folder",
      new vscode.ThemeColor("charts.purple")
    );
    item.description = team.key;
    item.tooltip = `${team.name} (${team.key})`;
    item.contextValue = "team";
    item.command = undefined;
    return item;
  }

  /**
   * Create "No teams" item
   */
  private createNoTeamsItem(): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: "no-teams",
        identifier: "",
        title: "No teams found",
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.None,
      "section"
    );
    item.iconPath = new vscode.ThemeIcon("info");
    item.command = undefined;
    item.contextValue = "no-teams";
    return item;
  }

  /**
   * Create "No projects" item
   */
  private createNoProjectsItem(): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: "no-projects",
        identifier: "",
        title: "No projects found",
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.None,
      "section"
    );
    item.iconPath = new vscode.ThemeIcon("info");
    item.command = undefined;
    item.contextValue = "no-projects";
    return item;
  }

  /**
   * Create status header item with color coding
   */
  private createStatusHeader(
    status: string,
    count: number,
    statusType: string
  ): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: `status-${status}`,
        identifier: "",
        title: `  ${status} (${count})`,
        state: { id: "", name: status, type: statusType },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.Collapsed,
      "section"
    );
    item.contextValue = "statusHeader";

    // Color code status headers
    let iconColor: vscode.ThemeColor;
    let icon: string;

    switch (statusType) {
      case "started":
        icon = "record";
        iconColor = new vscode.ThemeColor("charts.blue");
        break;
      case "completed":
        icon = "pass-filled";
        iconColor = new vscode.ThemeColor("charts.green");
        break;
      case "canceled":
        icon = "circle-slash";
        iconColor = new vscode.ThemeColor("disabledForeground");
        break;
      case "backlog":
        icon = "inbox";
        iconColor = new vscode.ThemeColor("charts.purple");
        break;
      case "unstarted":
        icon = "circle-large-outline";
        iconColor = new vscode.ThemeColor("charts.orange");
        break;
      default:
        icon = "circle-large";
        iconColor = new vscode.ThemeColor("foreground");
    }

    item.iconPath = new vscode.ThemeIcon(icon, iconColor);
    item.command = undefined;
    return item;
  }

  /**
   * Create project item
   */
  private createProjectItem(project: LinearProject): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: project.id,
        identifier: "",
        title: `  ${project.name}`,
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: project.url || "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.Collapsed,
      "project"
    );
    item.iconPath = new vscode.ThemeIcon(
      "folder",
      new vscode.ThemeColor("charts.orange")
    );
    item.tooltip = `${project.name}\nClick to view unassigned tickets`;
    item.contextValue = "project";
    item.command = undefined;
    return item;
  }

  /**
   * Create divider item
   */
  private createDivider(): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: "divider",
        identifier: "",
        title: "───────────────────",
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.None,
      "section"
    );
    item.iconPath = undefined;
    item.command = undefined;
    item.contextValue = "divider";
    return item;
  }

  /**
   * Create "Configure API Token" item
   */
  private createConfigureItem(): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: "configure",
        identifier: "",
        title: "Configure Linear API Token",
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.None
    );
    item.iconPath = new vscode.ThemeIcon("settings-gear");
    item.command = {
      command: "devBuddy.configureLinearToken",
      title: "Configure Linear API Token",
    };
    item.contextValue = "configure";
    return item;
  }

  /**
   * Create "No issues" item
   */
  private createNoIssuesItem(): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: "no-issues",
        identifier: "",
        title: "  No active issues assigned to you",
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.None,
      "section"
    );
    item.iconPath = new vscode.ThemeIcon(
      "check",
      new vscode.ThemeColor("charts.green")
    );
    item.command = undefined;
    item.contextValue = "no-issues";
    return item;
  }

  /**
   * Create "No completed issues" item
   */
  private createNoCompletedIssuesItem(): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: "no-completed-issues",
        identifier: "",
        title: "  No recently completed issues",
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.None,
      "section"
    );
    item.iconPath = new vscode.ThemeIcon(
      "info",
      new vscode.ThemeColor("charts.gray")
    );
    item.command = undefined;
    item.contextValue = "no-completed-issues";
    return item;
  }

  /**
   * Create "No unassigned issues" item
   */
  private createNoUnassignedIssuesItem(): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: "no-unassigned-issues",
        identifier: "",
        title: "    No unassigned tickets",
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.None,
      "section"
    );
    item.iconPath = new vscode.ThemeIcon("info");
    item.command = undefined;
    item.contextValue = "no-unassigned-issues";
    return item;
  }

  /**
   * Create "More issues" item
   */
  private createMoreIssuesItem(count: number): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: "more-issues",
        identifier: "",
        title: `    ... and ${count} more`,
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.None,
      "section"
    );
    item.iconPath = new vscode.ThemeIcon(
      "ellipsis",
      new vscode.ThemeColor("descriptionForeground")
    );
    item.command = undefined;
    item.contextValue = "more-issues";
    item.tooltip = `View more in Linear`;
    return item;
  }

  /**
   * Create error item
   */
  private createErrorItem(): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: "error",
        identifier: "",
        title: "Failed to load issues",
        state: { id: "", name: "", type: "" },
        priority: 0,
        url: "",
        createdAt: "",
        updatedAt: "",
      } as LinearIssue,
      vscode.TreeItemCollapsibleState.None
    );
    item.iconPath = new vscode.ThemeIcon("error");
    item.command = {
      command: "devBuddy.refreshTickets",
      title: "Refresh",
    };
    item.contextValue = "error";
    return item;
  }

  /**
   * Get the current issues list
   */
  getIssues(): LinearIssue[] {
    return this.issues;
  }
}
