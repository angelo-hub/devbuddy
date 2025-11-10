/**
 * Jira Issues Tree View Provider
 * 
 * Displays Jira issues in the VS Code sidebar.
 */

import * as vscode from "vscode";
import { JiraCloudClient } from "./JiraCloudClient";
import { JiraIssue } from "../common/types";
import { getLogger } from "../../../shared/utils/logger";

const logger = getLogger();

interface JiraTreeItem {
  type: "group" | "issue";
  label: string;
  issue?: JiraIssue;
  collapsibleState?: vscode.TreeItemCollapsibleState;
}

export class JiraIssuesProvider implements vscode.TreeDataProvider<JiraTreeItem> {
  private client: JiraCloudClient | null = null;
  private issues: JiraIssue[] = [];
  private autoRefreshInterval: NodeJS.Timeout | null = null;
  
  private _onDidChangeTreeData: vscode.EventEmitter<
    JiraTreeItem | undefined | null | void
  > = new vscode.EventEmitter<JiraTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    JiraTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {
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
        this.refresh();
      }, interval);
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
    this.loadIssues();
  }

  private async loadIssues(): Promise<void> {
    if (!this.client || !this.client.isConfigured()) {
      this.issues = [];
      return;
    }

    try {
      this.issues = await this.client.getMyIssues();
      logger.info(`Loaded ${this.issues.length} Jira issues`);
      this._onDidChangeTreeData.fire();
    } catch (error) {
      logger.error("Failed to load Jira issues:", error);
      this.issues = [];
    }
  }

  getTreeItem(element: JiraTreeItem): vscode.TreeItem {
    if (element.type === "group") {
      const item = new vscode.TreeItem(
        element.label,
        vscode.TreeItemCollapsibleState.Expanded
      );
      item.contextValue = "jiraGroup";
      return item;
    }

    // Issue item
    const issue = element.issue!;
    const item = new vscode.TreeItem(
      `${issue.key}: ${issue.summary}`,
      vscode.TreeItemCollapsibleState.None
    );

    item.description = issue.status.name;
    item.tooltip = this.getIssueTooltip(issue);
    item.iconPath = this.getIssueIcon(issue);
    item.contextValue = this.getIssueContextValue(issue);

    item.command = {
      command: "devBuddy.jira.openIssue",
      title: "Open Issue",
      arguments: [issue],
    };

    return item;
  }

  async getChildren(element?: JiraTreeItem): Promise<JiraTreeItem[]> {
    if (!this.client || !this.client.isConfigured()) {
      return [
        {
          type: "group",
          label: "Click here to configure Jira",
          collapsibleState: vscode.TreeItemCollapsibleState.None,
        },
      ];
    }

    if (!element) {
      // Root level - group by status category
      const groups = this.groupIssuesByStatus(this.issues);
      return Object.entries(groups).map(([status, _issues]) => ({
        type: "group" as const,
        label: `${status} (${_issues.length})`,
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
      }));
    }

    if (element.type === "group") {
      // Get issues for this status group
      const status = element.label.split(" (")[0]; // Extract status from "Status (count)"
      const groups = this.groupIssuesByStatus(this.issues);
      const issuesInGroup = groups[status] || [];

      return issuesInGroup.map((issue) => ({
        type: "issue" as const,
        label: issue.key,
        issue,
      }));
    }

    return [];
  }

  private groupIssuesByStatus(issues: JiraIssue[]): Record<string, JiraIssue[]> {
    const groups: Record<string, JiraIssue[]> = {
      "To Do": [],
      "In Progress": [],
      "Done": [],
      "Other": [],
    };

    for (const issue of issues) {
      const categoryKey = issue.status.statusCategory.key;

      if (categoryKey === "new") {
        groups["To Do"].push(issue);
      } else if (categoryKey === "indeterminate") {
        groups["In Progress"].push(issue);
      } else if (categoryKey === "done") {
        groups["Done"].push(issue);
      } else {
        groups["Other"].push(issue);
      }
    }

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, items]) => items.length > 0)
    );
  }

  private getIssueIcon(issue: JiraIssue): vscode.ThemeIcon {
    // Map Jira issue types to VS Code icons
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

  private getIssueTooltip(issue: JiraIssue): string {
    const lines = [
      `**${issue.key}**: ${issue.summary}`,
      ``,
      `**Type**: ${issue.issueType.name}`,
      `**Status**: ${issue.status.name}`,
      `**Priority**: ${issue.priority.name}`,
      `**Project**: ${issue.project.name} (${issue.project.key})`,
    ];

    if (issue.assignee) {
      lines.push(`**Assignee**: ${issue.assignee.displayName}`);
    } else {
      lines.push(`**Assignee**: Unassigned`);
    }

    if (issue.dueDate) {
      lines.push(`**Due**: ${new Date(issue.dueDate).toLocaleDateString()}`);
    }

    if (issue.labels.length > 0) {
      lines.push(`**Labels**: ${issue.labels.join(", ")}`);
    }

    if (issue.description) {
      lines.push(``, `**Description**:`);
      lines.push(issue.description.substring(0, 200) + (issue.description.length > 200 ? "..." : ""));
    }

    return lines.join("\n");
  }

  private getIssueContextValue(issue: JiraIssue): string {
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

  dispose(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }
}
