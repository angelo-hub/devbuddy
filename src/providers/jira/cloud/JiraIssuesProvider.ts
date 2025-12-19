/**
 * Jira Issues Tree View Provider
 * 
 * Displays Jira issues in the VS Code sidebar.
 * Matches the structure of Linear's sidebar with:
 * - My Issues (grouped by status)
 * - Recently Completed
 * - (Future: Current Sprint, Projects)
 */

import * as vscode from "vscode";
import { JiraIssue, JiraProject, JiraSprint, JiraBoard } from "../common/types";
import { IJiraClient, createJiraClient, resetJiraClient } from "../common/JiraClientFactory";
import { getLogger } from "@shared/utils/logger";
import { BranchAssociationManager } from "@shared/git/branchAssociationManager";

const logger = getLogger();

// Tree item types for the Jira sidebar
type JiraTreeItemType = 
  | "section"           // Top-level collapsible sections (My Issues, Recently Completed, Sprint, Projects)
  | "statusGroup"       // Status group within My Issues (In Progress, To Do, etc.)
  | "project"           // Individual project in Projects section
  | "sprintSubsection"  // Subsection within Sprint (My Tasks, Unassigned)
  | "issue";            // Individual issue

interface JiraTreeItemData {
  type: JiraTreeItemType;
  id: string;
  label: string;
  issue?: JiraIssue;
  project?: JiraProject;
  sprint?: JiraSprint;
  statusCategory?: string;
  statusName?: string;
  count?: number;
}

export class JiraIssueTreeItem extends vscode.TreeItem {
  constructor(
    public readonly data: JiraTreeItemData,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    private branchManager?: BranchAssociationManager
  ) {
    super(data.label, collapsibleState);

    if (data.type === "issue" && data.issue) {
      this.setupIssueItem(data.issue);
    } else if (data.type === "section") {
      this.setupSectionItem(data);
    } else if (data.type === "statusGroup") {
      this.setupStatusGroupItem(data);
    } else if (data.type === "project" && data.project) {
      this.setupProjectItem(data.project);
    } else if (data.type === "sprintSubsection") {
      this.setupSprintSubsectionItem(data);
    }
  }

  private setupIssueItem(issue: JiraIssue): void {
    this.label = issue.summary;
    this.description = issue.key;
    this.tooltip = this.buildIssueTooltip(issue);
    this.iconPath = this.getIssueIcon(issue);
    this.contextValue = this.buildContextValue(issue);

    this.command = {
      command: "devBuddy.jira.openIssue",
      title: "Open Issue",
      arguments: [issue],
    };
  }

  private setupSectionItem(data: JiraTreeItemData): void {
    this.contextValue = data.id;
    this.command = undefined;

    // Style section headers
    let icon = "folder-opened";
    let iconColor: vscode.ThemeColor;

    switch (data.id) {
      case "myIssuesSection":
        iconColor = new vscode.ThemeColor("charts.blue");
        break;
      case "completedSection":
        iconColor = new vscode.ThemeColor("charts.green");
        break;
      case "sprintSection":
        iconColor = new vscode.ThemeColor("charts.yellow");
        break;
      case "projectsSection":
        iconColor = new vscode.ThemeColor("charts.orange");
        break;
      default:
        iconColor = new vscode.ThemeColor("symbolIcon.classForeground");
    }

    this.iconPath = new vscode.ThemeIcon(icon, iconColor);
  }

  private setupStatusGroupItem(data: JiraTreeItemData): void {
    this.contextValue = "statusGroup";
    this.command = undefined;
    
    // Indent status groups with spaces
    this.label = `  ${data.label}`;

    // Color based on status category
    let icon: string;
    let iconColor: vscode.ThemeColor;

    switch (data.statusCategory) {
      case "indeterminate": // In Progress
        icon = "record";
        iconColor = new vscode.ThemeColor("charts.blue");
        break;
      case "done":
        icon = "pass-filled";
        iconColor = new vscode.ThemeColor("charts.green");
        break;
      case "new": // To Do
      default:
        icon = "circle-large-outline";
        iconColor = new vscode.ThemeColor("charts.orange");
        break;
    }

    this.iconPath = new vscode.ThemeIcon(icon, iconColor);
  }

  private setupProjectItem(project: JiraProject): void {
    this.label = `  ${project.name}`;
    this.description = project.key;
    this.tooltip = `${project.name} (${project.key})\nClick to view unassigned issues`;
    this.contextValue = "jiraProject";
    this.command = undefined;
    this.iconPath = new vscode.ThemeIcon("folder", new vscode.ThemeColor("charts.orange"));
  }

  private setupSprintSubsectionItem(data: JiraTreeItemData): void {
    this.label = `  ${data.label}`;
    this.contextValue = data.id;
    this.command = undefined;

    // Icon based on subsection type
    if (data.id === "mySprintTasks") {
      this.iconPath = new vscode.ThemeIcon("account", new vscode.ThemeColor("charts.blue"));
    } else if (data.id === "sprintUnassigned") {
      this.iconPath = new vscode.ThemeIcon("person-add", new vscode.ThemeColor("charts.orange"));
    } else {
      this.iconPath = new vscode.ThemeIcon("list-unordered");
    }
  }

  private getIssueIcon(issue: JiraIssue): vscode.ThemeIcon {
    const typeLower = issue.issueType.name.toLowerCase();
    const statusCategory = issue.status.statusCategory.key;

    // For completed issues, always show green checkmark
    if (statusCategory === "done") {
      return new vscode.ThemeIcon("check-all", new vscode.ThemeColor("charts.green"));
    }

    // For other statuses, use issue type icons
    if (typeLower.includes("bug")) {
      return new vscode.ThemeIcon("bug", new vscode.ThemeColor("errorForeground"));
    } else if (typeLower.includes("story")) {
      return new vscode.ThemeIcon("book", new vscode.ThemeColor("charts.blue"));
    } else if (typeLower.includes("task")) {
      return new vscode.ThemeIcon("checklist");
    } else if (typeLower.includes("epic")) {
      return new vscode.ThemeIcon("rocket", new vscode.ThemeColor("charts.purple"));
    } else if (typeLower.includes("subtask") || issue.issueType.subtask) {
      return new vscode.ThemeIcon("list-tree");
    }

    return new vscode.ThemeIcon("issue-opened");
  }

  private buildIssueTooltip(issue: JiraIssue): string {
    const lines = [
      `${issue.key}: ${issue.summary}`,
      ``,
      `Type: ${issue.issueType.name}`,
      `Status: ${issue.status.name}`,
      `Priority: ${issue.priority.name}`,
      `Project: ${issue.project.name} (${issue.project.key})`,
    ];

    if (issue.assignee) {
      lines.push(`Assignee: ${issue.assignee.displayName}`);
    }

    if (issue.dueDate) {
      lines.push(`Due: ${new Date(issue.dueDate).toLocaleDateString()}`);
    }

    if (issue.labels.length > 0) {
      lines.push(`Labels: ${issue.labels.join(", ")}`);
    }

    return lines.join("\n");
  }

  private buildContextValue(issue: JiraIssue): string {
    const parts = ["jiraIssue"];

    // Add status category
    const statusCategory = issue.status.statusCategory.key;
    parts.push(statusCategory);

    // Check for branch association
    if (this.branchManager) {
      const associatedBranch = this.branchManager.getBranchForTicket(issue.key);
      if (associatedBranch) {
        parts.push("withBranch");
      }
    }

    return parts.join(":");
  }
}

export class JiraIssuesProvider implements vscode.TreeDataProvider<JiraIssueTreeItem> {
  private client: IJiraClient | null = null;
  private branchManager: BranchAssociationManager;
  private issues: JiraIssue[] = [];
  private completedIssues: JiraIssue[] = [];
  private projects: JiraProject[] = [];
  private activeSprint: JiraSprint | null = null;
  private boards: JiraBoard[] = [];
  private mySprintIssues: JiraIssue[] = [];
  private sprintUnassignedIssues: JiraIssue[] = [];
  private autoRefreshInterval: NodeJS.Timeout | null = null;
  private isRefreshing: boolean = false;
  
  private _onDidChangeTreeData: vscode.EventEmitter<
    JiraIssueTreeItem | undefined | null | void
  > = new vscode.EventEmitter<JiraIssueTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    JiraIssueTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {
    this.branchManager = new BranchAssociationManager(context);
    this.initializeClient();
    this.setupAutoRefresh();
  }

  private async initializeClient(): Promise<void> {
    try {
      this.client = await JiraCloudClient.create();
      if (this.client.isConfigured()) {
        logger.info("Jira Issues Provider initialized");
        this.refresh();
      } else {
        logger.warn("Jira Cloud not configured");
      }
    } catch (error) {
      logger.error("Failed to initialize Jira client:", error);
    }
  }

  private setupAutoRefresh(): void {
    const config = vscode.workspace.getConfiguration("devBuddy");
    const interval = config.get<number>("autoRefreshInterval", 5) * 60 * 1000;

    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    if (interval > 0) {
      this.autoRefreshInterval = setInterval(() => {
        logger.debug("Auto-refreshing Jira issues...");
        this.refresh();
      }, interval);
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Refresh data in background without blocking UI
   */
  async refreshInBackground(): Promise<void> {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;
    try {
      if (!this.client || !this.client.isConfigured()) {
        return;
      }

      // Fetch issues and projects in parallel
      const [myIssues, recentlyCompleted, projects] = await Promise.all([
        this.client.getMyIssues().catch(() => [] as JiraIssue[]),
        this.client.getRecentlyCompletedIssues().catch(() => [] as JiraIssue[]),
        this.client.getProjects().catch(() => [] as JiraProject[]),
      ]);

      this.issues = myIssues;
      this.completedIssues = recentlyCompleted;
      this.projects = projects;

      logger.debug("Background refresh completed - Jira data preloaded");
    } catch (error) {
      logger.error("Background refresh failed:", error);
    } finally {
      this.isRefreshing = false;
    }
  }

  getTreeItem(element: JiraIssueTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: JiraIssueTreeItem): Promise<JiraIssueTreeItem[]> {
    if (!this.client || !this.client.isConfigured()) {
      return [this.createConfigureItem()];
    }

    // Root level - show top-level sections
    if (!element) {
      return this.getRootSections();
    }

    // Handle expanding different section types
    switch (element.data.id) {
      case "myIssuesSection":
        return this.getMyIssuesChildren();

      case "completedSection":
        return this.getCompletedIssuesChildren();

      case "projectsSection":
        return this.getProjectsChildren();

      case "statusGroup":
        // Return issues for this status group
        return this.getIssuesForStatus(element.data.statusName || "");

      default:
        // Check if it's a project item (expand to show unassigned issues)
        if (element.data.type === "project" && element.data.project) {
          return this.getProjectUnassignedIssues(element.data.project.key);
        }
        return [];
    }
  }

  /**
   * Get root level sections
   */
  private getRootSections(): JiraIssueTreeItem[] {
    const sections: JiraIssueTreeItem[] = [];

    // Section 1: My Issues
    sections.push(this.createSection("myIssuesSection", "My Issues"));

    // Section 2: Recently Completed
    sections.push(this.createSection("completedSection", "Recently Completed"));

    // Section 3: Projects (with unassigned issues)
    sections.push(this.createSection("projectsSection", "Projects"));

    // Future sections (P0):
    // sections.push(this.createSection("sprintSection", "Current Sprint"));

    return sections;
  }

  /**
   * Get children for My Issues section - groups by status
   */
  private async getMyIssuesChildren(): Promise<JiraIssueTreeItem[]> {
    try {
      if (!this.client) {
        return [this.createErrorItem()];
      }

      // Load issues if not cached
      if (this.issues.length === 0) {
        this.issues = await this.client.getMyIssues();
      }

      if (this.issues.length === 0) {
        return [this.createNoIssuesItem()];
      }

      // Group by status category
      const groups = this.groupIssuesByStatusCategory(this.issues);
      const items: JiraIssueTreeItem[] = [];

      // Define preferred order
      const order = ["indeterminate", "new", "undefined"]; // In Progress, To Do, Other
      
      for (const category of order) {
        const group = groups[category];
        if (group && group.issues.length > 0) {
          items.push(this.createStatusGroup(
            group.displayName,
            group.issues.length,
            category
          ));
        }
      }

      return items;
    } catch (error) {
      logger.error("Failed to get my issues children:", error);
      return [this.createErrorItem()];
    }
  }

  /**
   * Get children for Recently Completed section
   */
  private async getCompletedIssuesChildren(): Promise<JiraIssueTreeItem[]> {
    try {
      if (!this.client) {
        return [this.createErrorItem()];
      }

      // Load completed issues if not cached
      if (this.completedIssues.length === 0) {
        this.completedIssues = await this.client.getRecentlyCompletedIssues();
      }

      if (this.completedIssues.length === 0) {
        return [this.createNoCompletedIssuesItem()];
      }

      // Return issues sorted by resolution date (most recent first)
      // Limit to 10 for better UX
      return this.completedIssues.slice(0, 10).map(
        (issue) => new JiraIssueTreeItem(
          {
            type: "issue",
            id: issue.id,
            label: issue.summary,
            issue,
          },
          vscode.TreeItemCollapsibleState.None,
          this.branchManager
        )
      );
    } catch (error) {
      logger.error("Failed to get completed issues children:", error);
      return [this.createErrorItem()];
    }
  }

  /**
   * Get children for Projects section - list of projects
   */
  private async getProjectsChildren(): Promise<JiraIssueTreeItem[]> {
    try {
      if (!this.client) {
        return [this.createErrorItem()];
      }

      // Load projects if not cached
      if (this.projects.length === 0) {
        this.projects = await this.client.getProjects();
      }

      if (this.projects.length === 0) {
        return [this.createNoProjectsItem()];
      }

      // Return projects as expandable items
      return this.projects.map(
        (project) => new JiraIssueTreeItem(
          {
            type: "project",
            id: `project-${project.id}`,
            label: project.name,
            project,
          },
          vscode.TreeItemCollapsibleState.Collapsed,
          this.branchManager
        )
      );
    } catch (error) {
      logger.error("Failed to get projects children:", error);
      return [this.createErrorItem()];
    }
  }

  /**
   * Get unassigned issues for a specific project
   */
  private async getProjectUnassignedIssues(projectKey: string): Promise<JiraIssueTreeItem[]> {
    try {
      if (!this.client) {
        return [this.createErrorItem()];
      }

      const unassignedIssues = await this.client.getProjectUnassignedIssues(projectKey);

      if (unassignedIssues.length === 0) {
        return [this.createNoUnassignedIssuesItem()];
      }

      // Limit to 15 issues for better UX
      const items = unassignedIssues.slice(0, 15).map(
        (issue) => new JiraIssueTreeItem(
          {
            type: "issue",
            id: issue.id,
            label: issue.summary,
            issue,
          },
          vscode.TreeItemCollapsibleState.None,
          this.branchManager
        )
      );

      // Add "more" indicator if there are more issues
      if (unassignedIssues.length > 15) {
        items.push(this.createMoreIssuesItem(unassignedIssues.length - 15));
      }

      return items;
    } catch (error) {
      logger.error(`Failed to get unassigned issues for project ${projectKey}:`, error);
      return [this.createErrorItem()];
    }
  }

  /**
   * Get issues for a specific status
   */
  private getIssuesForStatus(statusName: string): JiraIssueTreeItem[] {
    const groups = this.groupIssuesByStatusCategory(this.issues);
    
    // Find the group matching this display name
    for (const group of Object.values(groups)) {
      if (group.displayName === statusName) {
        return group.issues.map(
          (issue) => new JiraIssueTreeItem(
            {
              type: "issue",
              id: issue.id,
              label: issue.summary,
              issue,
            },
            vscode.TreeItemCollapsibleState.None,
            this.branchManager
          )
        );
      }
    }

    return [];
  }

  /**
   * Group issues by status category
   */
  private groupIssuesByStatusCategory(issues: JiraIssue[]): Record<string, { displayName: string; issues: JiraIssue[] }> {
    const groups: Record<string, { displayName: string; issues: JiraIssue[] }> = {
      indeterminate: { displayName: "In Progress", issues: [] },
      new: { displayName: "To Do", issues: [] },
      undefined: { displayName: "Other", issues: [] },
    };

    for (const issue of issues) {
      const categoryKey = issue.status.statusCategory.key;

      if (categoryKey === "indeterminate") {
        groups.indeterminate.issues.push(issue);
      } else if (categoryKey === "new") {
        groups.new.issues.push(issue);
      } else if (categoryKey !== "done") {
        // Skip done issues in My Issues
        groups.undefined.issues.push(issue);
      }
    }

    return groups;
  }

  // ==================== Item Creation Helpers ====================

  private createSection(id: string, label: string): JiraIssueTreeItem {
    return new JiraIssueTreeItem(
      {
        type: "section",
        id,
        label,
      },
      vscode.TreeItemCollapsibleState.Collapsed,
      this.branchManager
    );
  }

  private createStatusGroup(displayName: string, count: number, statusCategory: string): JiraIssueTreeItem {
    return new JiraIssueTreeItem(
      {
        type: "statusGroup",
        id: "statusGroup",
        label: `${displayName} (${count})`,
        statusCategory,
        statusName: displayName,
        count,
      },
      vscode.TreeItemCollapsibleState.Collapsed,
      this.branchManager
    );
  }

  private createConfigureItem(): JiraIssueTreeItem {
    const item = new JiraIssueTreeItem(
      {
        type: "section",
        id: "configure",
        label: "Configure Jira Connection",
      },
      vscode.TreeItemCollapsibleState.None,
      this.branchManager
    );
    item.iconPath = new vscode.ThemeIcon("settings-gear");
    item.command = {
      command: "devBuddy.jira.setup",
      title: "Configure Jira",
    };
    item.contextValue = "configure";
    return item;
  }

  private createNoIssuesItem(): JiraIssueTreeItem {
    const item = new JiraIssueTreeItem(
      {
        type: "section",
        id: "no-issues",
        label: "  No active issues assigned to you",
      },
      vscode.TreeItemCollapsibleState.None,
      this.branchManager
    );
    item.iconPath = new vscode.ThemeIcon("check", new vscode.ThemeColor("charts.green"));
    item.contextValue = "no-issues";
    return item;
  }

  private createNoCompletedIssuesItem(): JiraIssueTreeItem {
    const item = new JiraIssueTreeItem(
      {
        type: "section",
        id: "no-completed",
        label: "  No recently completed issues",
      },
      vscode.TreeItemCollapsibleState.None,
      this.branchManager
    );
    item.iconPath = new vscode.ThemeIcon("info", new vscode.ThemeColor("descriptionForeground"));
    item.contextValue = "no-completed";
    return item;
  }

  private createNoProjectsItem(): JiraIssueTreeItem {
    const item = new JiraIssueTreeItem(
      {
        type: "section",
        id: "no-projects",
        label: "  No projects found",
      },
      vscode.TreeItemCollapsibleState.None,
      this.branchManager
    );
    item.iconPath = new vscode.ThemeIcon("info", new vscode.ThemeColor("descriptionForeground"));
    item.contextValue = "no-projects";
    return item;
  }

  private createNoUnassignedIssuesItem(): JiraIssueTreeItem {
    const item = new JiraIssueTreeItem(
      {
        type: "section",
        id: "no-unassigned",
        label: "    No unassigned issues",
      },
      vscode.TreeItemCollapsibleState.None,
      this.branchManager
    );
    item.iconPath = new vscode.ThemeIcon("check", new vscode.ThemeColor("charts.green"));
    item.contextValue = "no-unassigned";
    return item;
  }

  private createMoreIssuesItem(count: number): JiraIssueTreeItem {
    const item = new JiraIssueTreeItem(
      {
        type: "section",
        id: "more-issues",
        label: `    ... and ${count} more`,
      },
      vscode.TreeItemCollapsibleState.None,
      this.branchManager
    );
    item.iconPath = new vscode.ThemeIcon("ellipsis", new vscode.ThemeColor("descriptionForeground"));
    item.contextValue = "more-issues";
    item.tooltip = "View more in Jira";
    return item;
  }

  private createErrorItem(): JiraIssueTreeItem {
    const item = new JiraIssueTreeItem(
      {
        type: "section",
        id: "error",
        label: "Failed to load issues",
      },
      vscode.TreeItemCollapsibleState.None,
      this.branchManager
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
   * Get all cached issues
   */
  getIssues(): JiraIssue[] {
    return this.issues;
  }

  dispose(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }
}
