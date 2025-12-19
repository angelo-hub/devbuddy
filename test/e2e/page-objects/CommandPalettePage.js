"use strict";
/**
 * CommandPalettePage - Page Object for Command Palette interactions
 *
 * Provides methods for executing commands, selecting quick pick items,
 * and handling input boxes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandPalettePage = void 0;
const vscode_extension_tester_1 = require("vscode-extension-tester");
const testConfig_1 = require("../utils/testConfig");
const helpers_1 = require("../utils/helpers");
class CommandPalettePage {
    constructor() {
        this.workbench = new vscode_extension_tester_1.Workbench();
    }
    /**
     * Open the command palette
     */
    async open() {
        await this.workbench.openCommandPrompt();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
        return new vscode_extension_tester_1.InputBox();
    }
    /**
     * Execute a command by name
     */
    async executeCommand(commandName) {
        await this.workbench.executeCommand(commandName);
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Execute a DevBuddy command
     */
    async executeDevBuddyCommand(command) {
        const fullCommand = command.startsWith("devBuddy.")
            ? command
            : `devBuddy.${command}`;
        await this.executeCommand(fullCommand);
    }
    /**
     * Type text into the command palette
     */
    async type(text) {
        const inputBox = await this.open();
        await inputBox.setText(text);
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Select a quick pick item by text
     */
    async selectQuickPickItem(itemText) {
        const inputBox = new vscode_extension_tester_1.InputBox();
        await (0, helpers_1.waitFor)(async () => {
            try {
                const picks = await inputBox.getQuickPicks();
                return picks.length > 0;
            }
            catch {
                return false;
            }
        }, testConfig_1.TestConfig.timeouts.ui);
        const picks = await inputBox.getQuickPicks();
        for (const pick of picks) {
            const label = await pick.getLabel();
            if (label.includes(itemText)) {
                await pick.select();
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
                return;
            }
        }
        throw new Error(`Quick pick item "${itemText}" not found`);
    }
    /**
     * Get all available quick pick items
     */
    async getQuickPickItems() {
        const inputBox = new vscode_extension_tester_1.InputBox();
        await (0, helpers_1.waitFor)(async () => {
            try {
                const picks = await inputBox.getQuickPicks();
                return picks.length > 0;
            }
            catch {
                return false;
            }
        }, testConfig_1.TestConfig.timeouts.ui);
        const picks = await inputBox.getQuickPicks();
        const labels = [];
        for (const pick of picks) {
            const label = await pick.getLabel();
            labels.push(label);
        }
        return labels;
    }
    /**
     * Confirm the current input (press Enter)
     */
    async confirm() {
        const inputBox = new vscode_extension_tester_1.InputBox();
        await inputBox.confirm();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Cancel the current input (press Escape)
     */
    async cancel() {
        const inputBox = new vscode_extension_tester_1.InputBox();
        await inputBox.cancel();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Check if the command palette is open
     */
    async isOpen() {
        try {
            const inputBox = new vscode_extension_tester_1.InputBox();
            return await inputBox.isDisplayed();
        }
        catch {
            return false;
        }
    }
    /**
     * Get the current text in the input box
     */
    async getText() {
        const inputBox = new vscode_extension_tester_1.InputBox();
        return inputBox.getText();
    }
    /**
     * Clear the input box
     */
    async clear() {
        const inputBox = new vscode_extension_tester_1.InputBox();
        await inputBox.clear();
    }
    /**
     * Wait for a specific quick pick item to appear
     */
    async waitForQuickPickItem(itemText, timeout = testConfig_1.TestConfig.timeouts.ui) {
        await (0, helpers_1.waitFor)(async () => {
            const items = await this.getQuickPickItems();
            return items.some((item) => item.includes(itemText));
        }, timeout);
    }
    /**
     * Execute a command and wait for the result
     */
    async executeAndWait(commandName, waitCondition, timeout = testConfig_1.TestConfig.timeouts.default) {
        await this.executeCommand(commandName);
        await (0, helpers_1.waitFor)(waitCondition, timeout);
    }
    /**
     * Open quick pick for provider selection
     */
    async selectProvider(provider) {
        await this.executeDevBuddyCommand("selectProvider");
        await (0, helpers_1.waitFor)(async () => {
            try {
                const picks = await this.getQuickPickItems();
                return picks.length > 0;
            }
            catch {
                return false;
            }
        }, testConfig_1.TestConfig.timeouts.ui);
        const providerLabel = provider === "linear" ? "Linear" : "Jira";
        await this.selectQuickPickItem(providerLabel);
    }
    /**
     * Open ticket by ID
     */
    async openTicketById(ticketId) {
        await this.executeDevBuddyCommand("openTicketById");
        const inputBox = new vscode_extension_tester_1.InputBox();
        await inputBox.setText(ticketId);
        await inputBox.confirm();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Search for tickets
     */
    async searchTickets(query) {
        await this.executeDevBuddyCommand("searchTickets");
        const inputBox = new vscode_extension_tester_1.InputBox();
        await inputBox.setText(query);
        await inputBox.confirm();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Quick open a ticket
     */
    async quickOpenTicket(identifier) {
        await this.executeDevBuddyCommand("quickOpenTicket");
        await (0, helpers_1.waitFor)(async () => {
            try {
                const picks = await this.getQuickPickItems();
                return picks.length > 0;
            }
            catch {
                return false;
            }
        }, testConfig_1.TestConfig.timeouts.ui);
        await this.selectQuickPickItem(identifier);
    }
}
exports.CommandPalettePage = CommandPalettePage;
exports.default = CommandPalettePage;
//# sourceMappingURL=CommandPalettePage.js.map