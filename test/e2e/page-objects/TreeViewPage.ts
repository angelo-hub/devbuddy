/**
 * TreeViewPage - Page Object for TreeView (ticket list) interactions
 *
 * Provides methods for interacting with individual tree items,
 * including clicking, expanding, and context menu operations.
 */

import {
  TreeItem,
  ViewSection,
  ContextMenu,
  ViewItem,
} from "vscode-extension-tester";
import { TestConfig } from "../utils/testConfig";
import { waitFor, sleep } from "../utils/helpers";
import { SidebarPage } from "./SidebarPage";

export interface TicketInfo {
  label: string;
  identifier: string;
  status?: string;
  hasContextValue: boolean;
}

export class TreeViewPage {
  private sidebarPage: SidebarPage;

  constructor() {
    this.sidebarPage = new SidebarPage();
  }

  /**
   * Get all visible tree items
   */
  async getVisibleItems(): Promise<TreeItem[]> {
    const section = await this.sidebarPage.getMyTicketsSection();
    const items = await section.getVisibleItems();
    // ViewItem[] can be cast to TreeItem[] for our purposes
    return items as unknown as TreeItem[];
  }

  /**
   * Find a ticket item by its identifier (e.g., "ENG-123", "PROJ-456")
   */
  async findByIdentifier(identifier: string): Promise<TreeItem | undefined> {
    const items = await this.getVisibleItems();

    for (const item of items) {
      const label = await item.getLabel();
      if (label.includes(identifier)) {
        return item;
      }
    }

    return undefined;
  }

  /**
   * Find a ticket item by label text
   */
  async findByLabel(labelText: string): Promise<TreeItem | undefined> {
    const items = await this.getVisibleItems();

    for (const item of items) {
      const label = await item.getLabel();
      if (label.includes(labelText)) {
        return item;
      }
    }

    return undefined;
  }

  /**
   * Find all items within a specific status group
   */
  async findItemsByStatus(status: string): Promise<TreeItem[]> {
    const items = await this.getVisibleItems();
    const matchingItems: TreeItem[] = [];

    let inStatusGroup = false;

    for (const item of items) {
      const label = await item.getLabel();

      // Check if this is a status group header
      if (label.toLowerCase().includes(status.toLowerCase())) {
        inStatusGroup = true;
        continue;
      }

      // Check if we've entered a new status group
      if (
        inStatusGroup &&
        (label.toLowerCase().includes("backlog") ||
          label.toLowerCase().includes("todo") ||
          label.toLowerCase().includes("in progress") ||
          label.toLowerCase().includes("done") ||
          label.toLowerCase().includes("completed"))
      ) {
        break;
      }

      if (inStatusGroup) {
        matchingItems.push(item);
      }
    }

    return matchingItems;
  }

  /**
   * Click on a ticket item
   */
  async clickTicket(identifier: string): Promise<void> {
    const ticket = await this.findByIdentifier(identifier);

    if (!ticket) {
      throw new Error(`Ticket with identifier "${identifier}" not found`);
    }

    await ticket.click();
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Double-click on a ticket item (usually opens detail view)
   */
  async doubleClickTicket(identifier: string): Promise<void> {
    const ticket = await this.findByIdentifier(identifier);

    if (!ticket) {
      throw new Error(`Ticket with identifier "${identifier}" not found`);
    }

    await ticket.select();
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Open the context menu for a ticket
   */
  async openContextMenu(identifier: string): Promise<ContextMenu> {
    const ticket = await this.findByIdentifier(identifier);

    if (!ticket) {
      throw new Error(`Ticket with identifier "${identifier}" not found`);
    }

    return ticket.openContextMenu();
  }

  /**
   * Select a context menu item for a ticket
   */
  async selectContextMenuItem(
    identifier: string,
    menuItemLabel: string
  ): Promise<void> {
    const contextMenu = await this.openContextMenu(identifier);
    const menuItem = await contextMenu.getItem(menuItemLabel);

    if (!menuItem) {
      await contextMenu.close();
      throw new Error(`Menu item "${menuItemLabel}" not found`);
    }

    await menuItem.select();
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Get context menu items for a ticket
   */
  async getContextMenuItems(identifier: string): Promise<string[]> {
    const contextMenu = await this.openContextMenu(identifier);
    const items = await contextMenu.getItems();
    const labels: string[] = [];

    for (const item of items) {
      const label = await item.getLabel();
      labels.push(label);
    }

    await contextMenu.close();
    return labels;
  }

  /**
   * Expand a tree item (if collapsible)
   */
  async expandItem(identifier: string): Promise<void> {
    const item = await this.findByIdentifier(identifier);

    if (!item) {
      throw new Error(`Item with identifier "${identifier}" not found`);
    }

    const isExpandable = await item.isExpandable();
    if (isExpandable) {
      await item.expand();
      await sleep(TestConfig.timeouts.animation);
    }
  }

  /**
   * Collapse a tree item (if collapsible)
   */
  async collapseItem(identifier: string): Promise<void> {
    const item = await this.findByIdentifier(identifier);

    if (!item) {
      throw new Error(`Item with identifier "${identifier}" not found`);
    }

    const isExpandable = await item.isExpandable();
    if (isExpandable) {
      await item.collapse();
      await sleep(TestConfig.timeouts.animation);
    }
  }

  /**
   * Check if a ticket exists
   */
  async ticketExists(identifier: string): Promise<boolean> {
    const ticket = await this.findByIdentifier(identifier);
    return ticket !== undefined;
  }

  /**
   * Get ticket information
   */
  async getTicketInfo(identifier: string): Promise<TicketInfo | undefined> {
    const ticket = await this.findByIdentifier(identifier);

    if (!ticket) {
      return undefined;
    }

    const label = await ticket.getLabel();

    return {
      label,
      identifier,
      hasContextValue: true,
    };
  }

  /**
   * Get the tooltip text for a ticket
   */
  async getTicketTooltip(identifier: string): Promise<string | undefined> {
    const ticket = await this.findByIdentifier(identifier);

    if (!ticket) {
      return undefined;
    }

    return ticket.getTooltip();
  }

  /**
   * Check if ticket has an associated branch (via context value)
   */
  async hasAssociatedBranch(identifier: string): Promise<boolean> {
    try {
      const menuItems = await this.getContextMenuItems(identifier);
      // If "Checkout Branch" is available, there's an associated branch
      return menuItems.some(
        (item) =>
          item.includes("Checkout Branch") ||
          item.includes("Associate Branch")
      );
    } catch {
      return false;
    }
  }

  /**
   * Wait for a specific ticket to appear
   */
  async waitForTicket(
    identifier: string,
    timeout: number = TestConfig.timeouts.ui
  ): Promise<TreeItem> {
    await waitFor(async () => {
      const ticket = await this.findByIdentifier(identifier);
      return ticket !== undefined;
    }, timeout);

    const ticket = await this.findByIdentifier(identifier);
    if (!ticket) {
      throw new Error(`Ticket "${identifier}" did not appear within timeout`);
    }

    return ticket;
  }

  /**
   * Get count of all tickets (excluding group headers)
   */
  async getTotalTicketCount(): Promise<number> {
    const items = await this.getVisibleItems();
    let count = 0;

    for (const item of items) {
      const label = await item.getLabel();
      // Exclude status group headers
      if (
        !label.toLowerCase().includes("backlog") &&
        !label.toLowerCase().includes("todo") &&
        !label.toLowerCase().includes("in progress") &&
        !label.toLowerCase().includes("done") &&
        !label.toLowerCase().includes("completed") &&
        !label.toLowerCase().includes("cancelled")
      ) {
        count++;
      }
    }

    return count;
  }
}

export default TreeViewPage;
