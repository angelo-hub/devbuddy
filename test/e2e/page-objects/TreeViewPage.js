"use strict";
/**
 * TreeViewPage - Page Object for TreeView (ticket list) interactions
 *
 * Provides methods for interacting with individual tree items,
 * including clicking, expanding, and context menu operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeViewPage = void 0;
const testConfig_1 = require("../utils/testConfig");
const helpers_1 = require("../utils/helpers");
const SidebarPage_1 = require("./SidebarPage");
class TreeViewPage {
    constructor() {
        this.sidebarPage = new SidebarPage_1.SidebarPage();
    }
    /**
     * Get all visible tree items
     */
    async getVisibleItems() {
        const section = await this.sidebarPage.getMyTicketsSection();
        return section.getVisibleItems();
    }
    /**
     * Find a ticket item by its identifier (e.g., "ENG-123", "PROJ-456")
     */
    async findByIdentifier(identifier) {
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
    async findByLabel(labelText) {
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
    async findItemsByStatus(status) {
        const items = await this.getVisibleItems();
        const matchingItems = [];
        let inStatusGroup = false;
        for (const item of items) {
            const label = await item.getLabel();
            // Check if this is a status group header
            if (label.toLowerCase().includes(status.toLowerCase())) {
                inStatusGroup = true;
                continue;
            }
            // Check if we've entered a new status group
            if (inStatusGroup &&
                (label.toLowerCase().includes("backlog") ||
                    label.toLowerCase().includes("todo") ||
                    label.toLowerCase().includes("in progress") ||
                    label.toLowerCase().includes("done") ||
                    label.toLowerCase().includes("completed"))) {
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
    async clickTicket(identifier) {
        const ticket = await this.findByIdentifier(identifier);
        if (!ticket) {
            throw new Error(`Ticket with identifier "${identifier}" not found`);
        }
        await ticket.click();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Double-click on a ticket item (usually opens detail view)
     */
    async doubleClickTicket(identifier) {
        const ticket = await this.findByIdentifier(identifier);
        if (!ticket) {
            throw new Error(`Ticket with identifier "${identifier}" not found`);
        }
        await ticket.select();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Open the context menu for a ticket
     */
    async openContextMenu(identifier) {
        const ticket = await this.findByIdentifier(identifier);
        if (!ticket) {
            throw new Error(`Ticket with identifier "${identifier}" not found`);
        }
        return ticket.openContextMenu();
    }
    /**
     * Select a context menu item for a ticket
     */
    async selectContextMenuItem(identifier, menuItemLabel) {
        const contextMenu = await this.openContextMenu(identifier);
        const menuItem = await contextMenu.getItem(menuItemLabel);
        if (!menuItem) {
            await contextMenu.close();
            throw new Error(`Menu item "${menuItemLabel}" not found`);
        }
        await menuItem.select();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Get context menu items for a ticket
     */
    async getContextMenuItems(identifier) {
        const contextMenu = await this.openContextMenu(identifier);
        const items = await contextMenu.getItems();
        const labels = [];
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
    async expandItem(identifier) {
        const item = await this.findByIdentifier(identifier);
        if (!item) {
            throw new Error(`Item with identifier "${identifier}" not found`);
        }
        const isExpandable = await item.isExpandable();
        if (isExpandable) {
            await item.expand();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
        }
    }
    /**
     * Collapse a tree item (if collapsible)
     */
    async collapseItem(identifier) {
        const item = await this.findByIdentifier(identifier);
        if (!item) {
            throw new Error(`Item with identifier "${identifier}" not found`);
        }
        const isExpandable = await item.isExpandable();
        if (isExpandable) {
            await item.collapse();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
        }
    }
    /**
     * Check if a ticket exists
     */
    async ticketExists(identifier) {
        const ticket = await this.findByIdentifier(identifier);
        return ticket !== undefined;
    }
    /**
     * Get ticket information
     */
    async getTicketInfo(identifier) {
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
    async getTicketTooltip(identifier) {
        const ticket = await this.findByIdentifier(identifier);
        if (!ticket) {
            return undefined;
        }
        return ticket.getTooltip();
    }
    /**
     * Check if ticket has an associated branch (via context value)
     */
    async hasAssociatedBranch(identifier) {
        try {
            const menuItems = await this.getContextMenuItems(identifier);
            // If "Checkout Branch" is available, there's an associated branch
            return menuItems.some((item) => item.includes("Checkout Branch") ||
                item.includes("Associate Branch"));
        }
        catch {
            return false;
        }
    }
    /**
     * Wait for a specific ticket to appear
     */
    async waitForTicket(identifier, timeout = testConfig_1.TestConfig.timeouts.ui) {
        await (0, helpers_1.waitFor)(async () => {
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
    async getTotalTicketCount() {
        const items = await this.getVisibleItems();
        let count = 0;
        for (const item of items) {
            const label = await item.getLabel();
            // Exclude status group headers
            if (!label.toLowerCase().includes("backlog") &&
                !label.toLowerCase().includes("todo") &&
                !label.toLowerCase().includes("in progress") &&
                !label.toLowerCase().includes("done") &&
                !label.toLowerCase().includes("completed") &&
                !label.toLowerCase().includes("cancelled")) {
                count++;
            }
        }
        return count;
    }
}
exports.TreeViewPage = TreeViewPage;
exports.default = TreeViewPage;
//# sourceMappingURL=TreeViewPage.js.map