/**
 * CommandPalettePage - Page Object for Command Palette interactions
 *
 * Provides methods for executing commands, selecting quick pick items,
 * and handling input boxes.
 */

import {
  Workbench,
  InputBox,
  QuickOpenBox,
} from "vscode-extension-tester";
import { TestConfig } from "../utils/testConfig";
import { waitFor, sleep } from "../utils/helpers";

export class CommandPalettePage {
  private workbench: Workbench;

  constructor() {
    this.workbench = new Workbench();
  }

  /**
   * Open the command palette
   */
  async open(): Promise<InputBox> {
    await this.workbench.openCommandPrompt();
    await sleep(TestConfig.timeouts.animation);
    return new InputBox();
  }

  /**
   * Execute a command by name
   */
  async executeCommand(commandName: string): Promise<void> {
    await this.workbench.executeCommand(commandName);
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Execute a DevBuddy command
   */
  async executeDevBuddyCommand(command: string): Promise<void> {
    const fullCommand = command.startsWith("devBuddy.")
      ? command
      : `devBuddy.${command}`;
    await this.executeCommand(fullCommand);
  }

  /**
   * Type text into the command palette
   */
  async type(text: string): Promise<void> {
    const inputBox = await this.open();
    await inputBox.setText(text);
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Select a quick pick item by text
   */
  async selectQuickPickItem(itemText: string): Promise<void> {
    const inputBox = new InputBox();

    await waitFor(async () => {
      try {
        const picks = await inputBox.getQuickPicks();
        return picks.length > 0;
      } catch {
        return false;
      }
    }, TestConfig.timeouts.ui);

    const picks = await inputBox.getQuickPicks();

    for (const pick of picks) {
      const label = await pick.getLabel();
      if (label.includes(itemText)) {
        await pick.select();
        await sleep(TestConfig.timeouts.animation);
        return;
      }
    }

    throw new Error(`Quick pick item "${itemText}" not found`);
  }

  /**
   * Get all available quick pick items
   */
  async getQuickPickItems(): Promise<string[]> {
    const inputBox = new InputBox();

    await waitFor(async () => {
      try {
        const picks = await inputBox.getQuickPicks();
        return picks.length > 0;
      } catch {
        return false;
      }
    }, TestConfig.timeouts.ui);

    const picks = await inputBox.getQuickPicks();
    const labels: string[] = [];

    for (const pick of picks) {
      const label = await pick.getLabel();
      labels.push(label);
    }

    return labels;
  }

  /**
   * Confirm the current input (press Enter)
   */
  async confirm(): Promise<void> {
    const inputBox = new InputBox();
    await inputBox.confirm();
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Cancel the current input (press Escape)
   */
  async cancel(): Promise<void> {
    const inputBox = new InputBox();
    await inputBox.cancel();
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Check if the command palette is open
   */
  async isOpen(): Promise<boolean> {
    try {
      const inputBox = new InputBox();
      return await inputBox.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Get the current text in the input box
   */
  async getText(): Promise<string> {
    const inputBox = new InputBox();
    return inputBox.getText();
  }

  /**
   * Clear the input box
   */
  async clear(): Promise<void> {
    const inputBox = new InputBox();
    await inputBox.clear();
  }

  /**
   * Wait for a specific quick pick item to appear
   */
  async waitForQuickPickItem(
    itemText: string,
    timeout: number = TestConfig.timeouts.ui
  ): Promise<void> {
    await waitFor(async () => {
      const items = await this.getQuickPickItems();
      return items.some((item) => item.includes(itemText));
    }, timeout);
  }

  /**
   * Execute a command and wait for the result
   */
  async executeAndWait(
    commandName: string,
    waitCondition: () => Promise<boolean>,
    timeout: number = TestConfig.timeouts.default
  ): Promise<void> {
    await this.executeCommand(commandName);
    await waitFor(waitCondition, timeout);
  }

  /**
   * Open quick pick for provider selection
   */
  async selectProvider(provider: "linear" | "jira"): Promise<void> {
    await this.executeDevBuddyCommand("selectProvider");

    await waitFor(async () => {
      try {
        const picks = await this.getQuickPickItems();
        return picks.length > 0;
      } catch {
        return false;
      }
    }, TestConfig.timeouts.ui);

    const providerLabel = provider === "linear" ? "Linear" : "Jira";
    await this.selectQuickPickItem(providerLabel);
  }

  /**
   * Open ticket by ID
   */
  async openTicketById(ticketId: string): Promise<void> {
    await this.executeDevBuddyCommand("openTicketById");

    const inputBox = new InputBox();
    await inputBox.setText(ticketId);
    await inputBox.confirm();
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Search for tickets
   */
  async searchTickets(query: string): Promise<void> {
    await this.executeDevBuddyCommand("searchTickets");

    const inputBox = new InputBox();
    await inputBox.setText(query);
    await inputBox.confirm();
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Quick open a ticket
   */
  async quickOpenTicket(identifier: string): Promise<void> {
    await this.executeDevBuddyCommand("quickOpenTicket");

    await waitFor(async () => {
      try {
        const picks = await this.getQuickPickItems();
        return picks.length > 0;
      } catch {
        return false;
      }
    }, TestConfig.timeouts.ui);

    await this.selectQuickPickItem(identifier);
  }
}

export default CommandPalettePage;
