"use strict";
/**
 * SidebarPage - Page Object for DevBuddy Sidebar interactions
 *
 * Provides methods for interacting with the DevBuddy sidebar,
 * including opening the sidebar, navigating sections, and accessing tickets.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarPage = void 0;
const vscode_extension_tester_1 = require("vscode-extension-tester");
const testConfig_1 = require("../utils/testConfig");
const helpers_1 = require("../utils/helpers");
class SidebarPage {
    constructor() {
        this.sidebar = new vscode_extension_tester_1.SideBarView();
        this.workbench = new vscode_extension_tester_1.Workbench();
    }
    /**
     * Open the DevBuddy sidebar
     */
    async open() {
        await this.workbench.executeCommand("workbench.view.extension.dev-buddy");
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
        await (0, helpers_1.waitFor)(async () => {
            try {
                const content = this.sidebar.getContent();
                const sections = await content.getSections();
                return sections.length > 0;
            }
            catch {
                return false;
            }
        }, testConfig_1.TestConfig.timeouts.ui);
        return this;
    }
    /**
     * Get the sidebar content
     */
    getContent() {
        return this.sidebar.getContent();
    }
    /**
     * Get the My Tickets section
     */
    async getMyTicketsSection() {
        const content = this.getContent();
        await (0, helpers_1.waitFor)(async () => {
            try {
                const section = await content.getSection("My Tickets");
                return section !== undefined;
            }
            catch {
                return false;
            }
        }, testConfig_1.TestConfig.timeouts.ui);
        return content.getSection("My Tickets");
    }
    /**
     * Get all visible sections
     */
    async getSections() {
        const content = this.getContent();
        return content.getSections();
    }
    /**
     * Check if the sidebar is visible
     */
    async isVisible() {
        try {
            const content = this.getContent();
            const sections = await content.getSections();
            return sections.length > 0;
        }
        catch {
            return false;
        }
    }
    /**
     * Get the title part (toolbar area) of the sidebar
     */
    async getTitlePart() {
        try {
            const section = await this.getMyTicketsSection();
            return section.getTitlePart?.();
        }
        catch {
            return undefined;
        }
    }
    /**
     * Click the refresh button in the sidebar
     */
    async clickRefresh() {
        await this.workbench.executeCommand("devBuddy.refreshTickets");
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
    }
    /**
     * Click the create ticket button
     */
    async clickCreateTicket() {
        await this.workbench.executeCommand("devBuddy.createTicket");
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Click the standup builder button
     */
    async clickStandupBuilder() {
        await this.workbench.executeCommand("devBuddy.openStandupBuilder");
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Click the help button
     */
    async clickHelp() {
        await this.workbench.executeCommand("devBuddy.showHelp");
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Click the search button
     */
    async clickSearch() {
        await this.workbench.executeCommand("devBuddy.searchTickets");
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Wait for the sidebar to load tickets
     */
    async waitForTicketsToLoad() {
        const section = await this.getMyTicketsSection();
        await (0, helpers_1.waitFor)(async () => {
            const items = await section.getVisibleItems();
            // Check if we have items or a "no tickets" message
            return items.length > 0;
        }, testConfig_1.TestConfig.timeouts.apiResponse);
    }
    /**
     * Get the count of visible ticket items
     */
    async getTicketCount() {
        const section = await this.getMyTicketsSection();
        const items = await section.getVisibleItems();
        return items.length;
    }
    /**
     * Collapse all sections
     */
    async collapseAll() {
        const sections = await this.getSections();
        for (const section of sections) {
            await section.collapse();
        }
    }
    /**
     * Expand all sections
     */
    async expandAll() {
        const sections = await this.getSections();
        for (const section of sections) {
            await section.expand();
        }
    }
    /**
     * Check if a specific section is expanded
     */
    async isSectionExpanded(sectionName) {
        const content = this.getContent();
        const section = await content.getSection(sectionName);
        return section.isExpanded();
    }
}
exports.SidebarPage = SidebarPage;
exports.default = SidebarPage;
//# sourceMappingURL=SidebarPage.js.map