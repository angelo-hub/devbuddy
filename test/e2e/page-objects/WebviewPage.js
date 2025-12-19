"use strict";
/**
 * WebviewPage - Page Object for Webview Panel interactions
 *
 * Provides methods for interacting with DevBuddy webview panels
 * including ticket detail, create ticket, and standup builder.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandupBuilderPage = exports.CreateTicketPage = exports.TicketPanelPage = exports.WebviewPage = void 0;
const vscode_extension_tester_1 = require("vscode-extension-tester");
const testConfig_1 = require("../utils/testConfig");
const helpers_1 = require("../utils/helpers");
class WebviewPage {
    constructor() {
        this.webview = null;
        this.workbench = new vscode_extension_tester_1.Workbench();
        this.editorView = new vscode_extension_tester_1.EditorView();
    }
    /**
     * Wait for webview to be available
     */
    async waitForWebview() {
        await (0, helpers_1.waitFor)(async () => {
            try {
                this.webview = new vscode_extension_tester_1.WebView();
                await this.webview.wait();
                return true;
            }
            catch {
                return false;
            }
        }, testConfig_1.TestConfig.timeouts.ui);
        if (!this.webview) {
            throw new Error("Webview not available");
        }
        return this.webview;
    }
    /**
     * Switch to webview context for DOM interactions
     */
    async switchToFrame() {
        const webview = await this.waitForWebview();
        await webview.switchToFrame();
    }
    /**
     * Switch back to main VS Code context
     */
    async switchBack() {
        if (this.webview) {
            await this.webview.switchBack();
        }
    }
    /**
     * Find an element within the webview
     */
    async findElement(selector) {
        await this.switchToFrame();
        try {
            const element = await this.webview?.findWebElement(vscode_extension_tester_1.By.css(selector));
            return element;
        }
        catch {
            return undefined;
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Find multiple elements within the webview
     */
    async findElements(selector) {
        await this.switchToFrame();
        try {
            const elements = (await this.webview?.findWebElements(vscode_extension_tester_1.By.css(selector))) || [];
            return elements;
        }
        catch {
            return [];
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Click an element in the webview
     */
    async clickElement(selector) {
        await this.switchToFrame();
        try {
            const element = await this.webview?.findWebElement(vscode_extension_tester_1.By.css(selector));
            if (element) {
                await element.click();
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            }
            else {
                throw new Error(`Element "${selector}" not found`);
            }
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Type text into an input element
     */
    async typeIntoInput(selector, text) {
        await this.switchToFrame();
        try {
            const element = await this.webview?.findWebElement(vscode_extension_tester_1.By.css(selector));
            if (element) {
                await element.clear();
                await element.sendKeys(text);
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            }
            else {
                throw new Error(`Input "${selector}" not found`);
            }
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Get text content of an element
     */
    async getElementText(selector) {
        await this.switchToFrame();
        try {
            const element = await this.webview?.findWebElement(vscode_extension_tester_1.By.css(selector));
            if (element) {
                return element.getText();
            }
            return "";
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Check if an element exists
     */
    async elementExists(selector) {
        const element = await this.findElement(selector);
        return element !== undefined;
    }
    /**
     * Wait for an element to appear
     */
    async waitForElement(selector, timeout = testConfig_1.TestConfig.timeouts.ui) {
        await (0, helpers_1.waitFor)(async () => {
            const element = await this.findElement(selector);
            return element !== undefined;
        }, timeout);
        const element = await this.findElement(selector);
        if (!element) {
            throw new Error(`Element "${selector}" did not appear within timeout`);
        }
        return element;
    }
    /**
     * Get the value of an input field
     */
    async getInputValue(selector) {
        await this.switchToFrame();
        try {
            const element = await this.webview?.findWebElement(vscode_extension_tester_1.By.css(selector));
            if (element) {
                return element.getAttribute("value");
            }
            return "";
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Select an option from a dropdown
     */
    async selectOption(selectSelector, optionValue) {
        await this.switchToFrame();
        try {
            // Click the select element
            const select = await this.webview?.findWebElement(vscode_extension_tester_1.By.css(selectSelector));
            if (select) {
                await select.click();
                await (0, helpers_1.sleep)(100);
                // Find and click the option
                const option = await this.webview?.findWebElement(vscode_extension_tester_1.By.css(`${selectSelector} option[value="${optionValue}"]`));
                if (option) {
                    await option.click();
                }
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            }
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Check if a checkbox is checked
     */
    async isChecked(selector) {
        await this.switchToFrame();
        try {
            const element = await this.webview?.findWebElement(vscode_extension_tester_1.By.css(selector));
            if (element) {
                const checked = await element.getAttribute("checked");
                return checked === "true";
            }
            return false;
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Close the webview panel
     */
    async close() {
        await this.editorView.closeEditor(await this.editorView.getActiveTab());
        this.webview = null;
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Get all visible buttons in the webview
     */
    async getButtons() {
        await this.switchToFrame();
        try {
            const buttons = (await this.webview?.findWebElements(vscode_extension_tester_1.By.css("button"))) || [];
            const labels = [];
            for (const button of buttons) {
                const text = await button.getText();
                if (text) {
                    labels.push(text);
                }
            }
            return labels;
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Submit a form in the webview
     */
    async submitForm(formSelector = "form") {
        await this.switchToFrame();
        try {
            const submitButton = await this.webview?.findWebElement(vscode_extension_tester_1.By.css(`${formSelector} button[type="submit"]`));
            if (submitButton) {
                await submitButton.click();
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
            }
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Get validation error messages
     */
    async getValidationErrors() {
        await this.switchToFrame();
        try {
            const errorElements = (await this.webview?.findWebElements(vscode_extension_tester_1.By.css(".error, .validation-error, [class*='error']"))) || [];
            const errors = [];
            for (const element of errorElements) {
                const text = await element.getText();
                if (text) {
                    errors.push(text);
                }
            }
            return errors;
        }
        finally {
            await this.switchBack();
        }
    }
    /**
     * Check if webview is currently displayed
     */
    async isDisplayed() {
        try {
            const webview = await this.waitForWebview();
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.WebviewPage = WebviewPage;
// Specific page objects for different webview panels
class TicketPanelPage extends WebviewPage {
    /**
     * Get the ticket title
     */
    async getTicketTitle() {
        return this.getElementText('[class*="title"], h1, .ticket-title');
    }
    /**
     * Get the ticket identifier
     */
    async getTicketIdentifier() {
        return this.getElementText('[class*="identifier"], .ticket-id, [class*="key"]');
    }
    /**
     * Get the ticket description
     */
    async getTicketDescription() {
        return this.getElementText('[class*="description"], .description, [class*="content"]');
    }
    /**
     * Change ticket status
     */
    async changeStatus(newStatus) {
        await this.selectOption('[class*="status"] select, select[name="status"]', newStatus);
    }
    /**
     * Add a comment
     */
    async addComment(commentText) {
        await this.typeIntoInput('textarea[name="comment"], [class*="comment"] textarea', commentText);
        await this.clickElement('[class*="comment"] button, button[type="submit"]');
    }
    /**
     * Click the open in browser button
     */
    async openInBrowser() {
        await this.clickElement('[class*="external"], button[title*="browser"]');
    }
}
exports.TicketPanelPage = TicketPanelPage;
class CreateTicketPage extends WebviewPage {
    /**
     * Fill the ticket title
     */
    async setTitle(title) {
        await this.typeIntoInput('input[name="title"], #title', title);
    }
    /**
     * Fill the ticket description
     */
    async setDescription(description) {
        await this.typeIntoInput('textarea[name="description"], #description, [class*="editor"]', description);
    }
    /**
     * Select priority
     */
    async setPriority(priority) {
        await this.selectOption('select[name="priority"], #priority', priority);
    }
    /**
     * Select team (Linear)
     */
    async setTeam(teamId) {
        await this.selectOption('select[name="team"], #team', teamId);
    }
    /**
     * Select project
     */
    async setProject(projectId) {
        await this.selectOption('select[name="project"], #project', projectId);
    }
    /**
     * Submit the create ticket form
     */
    async submit() {
        await this.clickElement('button[type="submit"], button:contains("Create"), [class*="submit"]');
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
    }
    /**
     * Cancel ticket creation
     */
    async cancel() {
        await this.clickElement('button:contains("Cancel"), [class*="cancel"]');
    }
}
exports.CreateTicketPage = CreateTicketPage;
class StandupBuilderPage extends WebviewPage {
    /**
     * Select standup mode
     */
    async selectMode(mode) {
        await this.clickElement(`[data-mode="${mode}"], button:contains("${mode}")`);
    }
    /**
     * Select a ticket for standup
     */
    async selectTicket(ticketId) {
        await this.clickElement(`[data-ticket="${ticketId}"], [class*="ticket"]:contains("${ticketId}")`);
    }
    /**
     * Generate the standup update
     */
    async generate() {
        await this.clickElement('button:contains("Generate"), [class*="generate"]');
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.apiResponse);
    }
    /**
     * Get the generated standup text
     */
    async getGeneratedStandup() {
        return this.getElementText('[class*="result"], [class*="output"], textarea');
    }
    /**
     * Copy the standup to clipboard
     */
    async copyToClipboard() {
        await this.clickElement('button:contains("Copy"), [class*="copy"]');
    }
}
exports.StandupBuilderPage = StandupBuilderPage;
exports.default = WebviewPage;
//# sourceMappingURL=WebviewPage.js.map