import * as vscode from "vscode";
import { BaseTicket } from "./BaseTicketProvider";

/**
 * Abstract base class for tree view providers
 * Provides common tree view patterns for any ticketing platform
 */
export abstract class BaseTreeViewProvider<TTicket extends BaseTicket>
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  protected _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  protected issues: TTicket[] = [];
  protected refreshTimer: NodeJS.Timeout | undefined;
  protected isRefreshing: boolean = false;
  protected searchQuery: string | null = null;

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Set search query (to be implemented by subclasses)
   */
  public setSearchQuery(query: string | null): void {
    this.searchQuery = query;
    this.refresh();
  }

  /**
   * Get current search query
   */
  public getSearchQuery(): string | null {
    return this.searchQuery;
  }

  /**
   * Clear search
   */
  public clearSearch(): void {
    this.searchQuery = null;
    this.refresh();
  }

  /**
   * Get tree item representation
   */
  abstract getTreeItem(element: vscode.TreeItem): vscode.TreeItem;

  /**
   * Get children of a tree item
   */
  abstract getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]>;

  /**
   * Refresh data in the background without blocking UI
   */
  abstract refreshInBackground(): Promise<void>;

  /**
   * Filter tickets by search query (to be implemented by subclasses)
   */
  protected abstract filterTicketsBySearch(tickets: TTicket[]): TTicket[];

  /**
   * Start auto-refresh timer
   */
  protected startAutoRefresh(intervalMinutes: number): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Start new timer if interval > 0
    if (intervalMinutes > 0) {
      const intervalMs = intervalMinutes * 60 * 1000;
      this.refreshTimer = setInterval(() => {
        this.refresh();
      }, intervalMs);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Get the current issues list
   */
  getIssues(): TTicket[] {
    return this.issues;
  }
}

