/**
 * SidebarPage - Page Object for DevBuddy Sidebar interactions
 *
 * Provides methods for interacting with the DevBuddy sidebar,
 * including opening the sidebar, navigating sections, and accessing tickets.
 */

import {
  SideBarView,
  ViewSection,
  ViewContent,
  TreeItem,
  Workbench,
  ViewTitlePart,
} from "vscode-extension-tester";
import { TestConfig } from "../utils/testConfig";
import { waitFor, sleep } from "../utils/helpers";

export class SidebarPage {
  private sidebar: SideBarView;
  private workbench: Workbench;

  constructor() {
    this.sidebar = new SideBarView();
    this.workbench = new Workbench();
  }

  /**
   * Open the DevBuddy sidebar
   */
  async open(): Promise<this> {
    await this.workbench.executeCommand("workbench.view.extension.dev-buddy");
    await sleep(TestConfig.timeouts.animation);

    await waitFor(async () => {
      try {
        const content = this.sidebar.getContent();
        const sections = await content.getSections();
        return sections.length > 0;
      } catch {
        return false;
      }
    }, TestConfig.timeouts.ui);

    return this;
  }

  /**
   * Get the sidebar content
   */
  getContent(): ViewContent {
    return this.sidebar.getContent();
  }

  /**
   * Get the My Tickets section
   */
  async getMyTicketsSection(): Promise<ViewSection> {
    const content = this.getContent();

    await waitFor(async () => {
      try {
        const section = await content.getSection("My Tickets");
        return section !== undefined;
      } catch {
        return false;
      }
    }, TestConfig.timeouts.ui);

    return content.getSection("My Tickets");
  }

  /**
   * Get all visible sections
   */
  async getSections(): Promise<ViewSection[]> {
    const content = this.getContent();
    return content.getSections();
  }

  /**
   * Check if the sidebar is visible
   */
  async isVisible(): Promise<boolean> {
    try {
      const content = this.getContent();
      const sections = await content.getSections();
      return sections.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get the title part (toolbar area) of the sidebar
   */
  async getTitlePart(): Promise<ViewTitlePart | undefined> {
    try {
      const section = await this.getMyTicketsSection();
      // getTitlePart is not available on ViewSection in newer versions
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Click the refresh button in the sidebar
   */
  async clickRefresh(): Promise<void> {
    await this.workbench.executeCommand("devBuddy.refreshTickets");
    await sleep(TestConfig.timeouts.apiResponse);
  }

  /**
   * Click the create ticket button
   */
  async clickCreateTicket(): Promise<void> {
    await this.workbench.executeCommand("devBuddy.createTicket");
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Click the standup builder button
   */
  async clickStandupBuilder(): Promise<void> {
    await this.workbench.executeCommand("devBuddy.openStandupBuilder");
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Click the help button
   */
  async clickHelp(): Promise<void> {
    await this.workbench.executeCommand("devBuddy.showHelp");
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Click the search button
   */
  async clickSearch(): Promise<void> {
    await this.workbench.executeCommand("devBuddy.searchTickets");
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Wait for the sidebar to load tickets
   */
  async waitForTicketsToLoad(): Promise<void> {
    const section = await this.getMyTicketsSection();

    await waitFor(async () => {
      const items = await section.getVisibleItems();
      // Check if we have items or a "no tickets" message
      return items.length > 0;
    }, TestConfig.timeouts.apiResponse);
  }

  /**
   * Get the count of visible ticket items
   */
  async getTicketCount(): Promise<number> {
    const section = await this.getMyTicketsSection();
    const items = await section.getVisibleItems();
    return items.length;
  }

  /**
   * Collapse all sections
   */
  async collapseAll(): Promise<void> {
    const sections = await this.getSections();
    for (const section of sections) {
      await section.collapse();
    }
  }

  /**
   * Expand all sections
   */
  async expandAll(): Promise<void> {
    const sections = await this.getSections();
    for (const section of sections) {
      await section.expand();
    }
  }

  /**
   * Check if a specific section is expanded
   */
  async isSectionExpanded(sectionName: string): Promise<boolean> {
    const content = this.getContent();
    const section = await content.getSection(sectionName);
    return section.isExpanded();
  }
}

export default SidebarPage;
