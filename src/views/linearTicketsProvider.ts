import * as vscode from "vscode";
import {
  LinearClient,
  LinearIssue,
  LinearProject,
} from "../utils/linearClient";

export class LinearTicketTreeItem extends vscode.TreeItem {
  constructor(
    public readonly issue: LinearIssue,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: "ticket" | "project" | "section" = "ticket"
  ) {
    super(issue.title, collapsibleState);

    this.tooltip = `${issue.identifier}: ${issue.title}\nStatus: ${issue.state.name}`;
    this.description = issue.identifier;
    this.contextValue = itemType === "ticket" ? "linearTicket" : itemType;

    // Set icon based on status with color coding
    if (itemType === "ticket") {
      this.iconPath = this.getStatusIcon(issue.state.type, issue.priority);
    }

    // Command to open ticket when clicked
    if (itemType === "ticket") {
      this.command = {
        command: "monorepoTools.openTicket",
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

  private linearClient: LinearClient;
  private issues: LinearIssue[] = [];
  private projects: LinearProject[] = [];
  private refreshTimer: NodeJS.Timeout | undefined;
  private showUnassignedSection: boolean = true;

  constructor() {
    this.linearClient = new LinearClient();
    this.startAutoRefresh();
  }

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(): void {
    const config = vscode.workspace.getConfiguration("monorepoTools");
    const intervalMinutes = config.get<number>("autoRefreshInterval", 5);

    // Clear existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Start new timer if interval > 0
    if (intervalMinutes > 0) {
      const intervalMs = intervalMinutes * 60 * 1000;
      this.refreshTimer = setInterval(() => {
        console.log("[Linear Buddy] Auto-refreshing tickets...");
        this.refresh();
      }, intervalMs);

      console.log(
        `[Linear Buddy] Auto-refresh enabled: every ${intervalMinutes} minutes`
      );
    } else {
      console.log("[Linear Buddy] Auto-refresh disabled");
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
    if (!this.linearClient.isConfigured()) {
      // Show a message to configure Linear API token
      return [this.createConfigureItem()];
    }

    // If expanding a project, show its unassigned issues
    if (element && element.contextValue === "project") {
      return this.getUnassignedIssuesForProject(element.issue.id);
    }

    if (element && element.contextValue !== "section") {
      return [];
    }

    try {
      // Fetch issues from Linear
      const config = vscode.workspace.getConfiguration("monorepoTools");
      const teamId = config.get<string>("linearTeamId");

      this.issues = await this.linearClient.getMyIssues({
        state: ["unstarted", "started"], // Only show active issues
        teamId: teamId || undefined,
      });

      // Fetch user's projects
      this.projects = await this.linearClient.getUserProjects();

      const items: LinearTicketTreeItem[] = [];

      // Add "My Tickets" section
      if (this.issues.length > 0) {
        items.push(
          this.createSectionHeader("My Assigned Tickets", this.issues.length)
        );

        // Group by status
        const grouped = this.groupByStatus(this.issues);

        for (const [status, statusIssues] of Object.entries(grouped)) {
          // Add status header with color coding
          items.push(
            this.createStatusHeader(
              status,
              statusIssues.length,
              statusIssues[0]?.state.type || ""
            )
          );

          // Add issues under status
          for (const issue of statusIssues) {
            items.push(
              new LinearTicketTreeItem(
                issue,
                vscode.TreeItemCollapsibleState.None,
                "ticket"
              )
            );
          }
        }
      } else {
        items.push(this.createNoIssuesItem());
      }

      // Add divider
      items.push(this.createDivider());

      // Add "Projects & Unassigned" section
      if (this.projects.length > 0 && this.showUnassignedSection) {
        items.push(
          this.createSectionHeader(
            "Find Unassigned Tickets",
            this.projects.length
          )
        );

        for (const project of this.projects) {
          items.push(this.createProjectItem(project));
        }
      }

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
      const unassignedIssues =
        await this.linearClient.getProjectUnassignedIssues(projectId);

      if (unassignedIssues.length === 0) {
        return [this.createNoUnassignedIssuesItem()];
      }

      return unassignedIssues.map(
        (issue) =>
          new LinearTicketTreeItem(
            issue,
            vscode.TreeItemCollapsibleState.None,
            "ticket"
          )
      );
    } catch (error) {
      console.error("[Linear Buddy] Failed to fetch unassigned issues:", error);
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
   * Create section header item
   */
  private createSectionHeader(
    title: string,
    count: number
  ): LinearTicketTreeItem {
    const item = new LinearTicketTreeItem(
      {
        id: `section-${title}`,
        identifier: "",
        title: `${title} (${count})`,
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
      "layers",
      new vscode.ThemeColor("symbolIcon.classForeground")
    );
    item.command = undefined;
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
      vscode.TreeItemCollapsibleState.None,
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
      "project",
      new vscode.ThemeColor("symbolIcon.colorForeground")
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
      command: "monorepoTools.configureLinearToken",
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
      command: "monorepoTools.refreshTickets",
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
