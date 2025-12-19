/**
 * WebviewPage - Page Object for Webview Panel interactions
 *
 * Provides methods for interacting with DevBuddy webview panels
 * including ticket detail, create ticket, and standup builder.
 */

import {
  WebView,
  EditorView,
  Workbench,
  WebElement,
  By,
} from "vscode-extension-tester";
import { TestConfig } from "../utils/testConfig";
import { waitFor, sleep } from "../utils/helpers";

export class WebviewPage {
  private webview: WebView | null = null;
  private workbench: Workbench;
  private editorView: EditorView;

  constructor() {
    this.workbench = new Workbench();
    this.editorView = new EditorView();
  }

  /**
   * Wait for webview to be available
   */
  async waitForWebview(): Promise<WebView> {
    await waitFor(async () => {
      try {
        this.webview = new WebView();
        await this.webview.wait();
        return true;
      } catch {
        return false;
      }
    }, TestConfig.timeouts.ui);

    if (!this.webview) {
      throw new Error("Webview not available");
    }

    return this.webview;
  }

  /**
   * Switch to webview context for DOM interactions
   */
  async switchToFrame(): Promise<void> {
    const webview = await this.waitForWebview();
    await webview.switchToFrame();
  }

  /**
   * Switch back to main VS Code context
   */
  async switchBack(): Promise<void> {
    if (this.webview) {
      await this.webview.switchBack();
    }
  }

  /**
   * Find an element within the webview
   */
  async findElement(selector: string): Promise<WebElement | undefined> {
    await this.switchToFrame();

    try {
      const element = await this.webview?.findWebElement(By.css(selector));
      return element;
    } catch {
      return undefined;
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Find multiple elements within the webview
   */
  async findElements(selector: string): Promise<WebElement[]> {
    await this.switchToFrame();

    try {
      const elements =
        (await this.webview?.findWebElements(By.css(selector))) || [];
      return elements;
    } catch {
      return [];
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Click an element in the webview
   */
  async clickElement(selector: string): Promise<void> {
    await this.switchToFrame();

    try {
      const element = await this.webview?.findWebElement(By.css(selector));
      if (element) {
        await element.click();
        await sleep(TestConfig.timeouts.animation);
      } else {
        throw new Error(`Element "${selector}" not found`);
      }
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Type text into an input element
   */
  async typeIntoInput(selector: string, text: string): Promise<void> {
    await this.switchToFrame();

    try {
      const element = await this.webview?.findWebElement(By.css(selector));
      if (element) {
        await element.clear();
        await element.sendKeys(text);
        await sleep(TestConfig.timeouts.animation);
      } else {
        throw new Error(`Input "${selector}" not found`);
      }
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Get text content of an element
   */
  async getElementText(selector: string): Promise<string> {
    await this.switchToFrame();

    try {
      const element = await this.webview?.findWebElement(By.css(selector));
      if (element) {
        return element.getText();
      }
      return "";
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Check if an element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    const element = await this.findElement(selector);
    return element !== undefined;
  }

  /**
   * Wait for an element to appear
   */
  async waitForElement(
    selector: string,
    timeout: number = TestConfig.timeouts.ui
  ): Promise<WebElement> {
    await waitFor(async () => {
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
  async getInputValue(selector: string): Promise<string> {
    await this.switchToFrame();

    try {
      const element = await this.webview?.findWebElement(By.css(selector));
      if (element) {
        return element.getAttribute("value");
      }
      return "";
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Select an option from a dropdown
   */
  async selectOption(selectSelector: string, optionValue: string): Promise<void> {
    await this.switchToFrame();

    try {
      // Click the select element
      const select = await this.webview?.findWebElement(
        By.css(selectSelector)
      );
      if (select) {
        await select.click();
        await sleep(100);

        // Find and click the option
        const option = await this.webview?.findWebElement(
          By.css(`${selectSelector} option[value="${optionValue}"]`)
        );
        if (option) {
          await option.click();
        }
        await sleep(TestConfig.timeouts.animation);
      }
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Check if a checkbox is checked
   */
  async isChecked(selector: string): Promise<boolean> {
    await this.switchToFrame();

    try {
      const element = await this.webview?.findWebElement(By.css(selector));
      if (element) {
        const checked = await element.getAttribute("checked");
        return checked === "true";
      }
      return false;
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Close the webview panel
   */
  async close(): Promise<void> {
    await this.editorView.closeEditor(await this.editorView.getActiveTab() as any);
    this.webview = null;
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Get all visible buttons in the webview
   */
  async getButtons(): Promise<string[]> {
    await this.switchToFrame();

    try {
      const buttons =
        (await this.webview?.findWebElements(By.css("button"))) || [];
      const labels: string[] = [];

      for (const button of buttons) {
        const text = await button.getText();
        if (text) {
          labels.push(text);
        }
      }

      return labels;
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Submit a form in the webview
   */
  async submitForm(formSelector: string = "form"): Promise<void> {
    await this.switchToFrame();

    try {
      const submitButton = await this.webview?.findWebElement(
        By.css(`${formSelector} button[type="submit"]`)
      );
      if (submitButton) {
        await submitButton.click();
        await sleep(TestConfig.timeouts.animation);
      }
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Get validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    await this.switchToFrame();

    try {
      const errorElements =
        (await this.webview?.findWebElements(
          By.css(".error, .validation-error, [class*='error']")
        )) || [];
      const errors: string[] = [];

      for (const element of errorElements) {
        const text = await element.getText();
        if (text) {
          errors.push(text);
        }
      }

      return errors;
    } finally {
      await this.switchBack();
    }
  }

  /**
   * Check if webview is currently displayed
   */
  async isDisplayed(): Promise<boolean> {
    try {
      const webview = await this.waitForWebview();
      return true;
    } catch {
      return false;
    }
  }
}

// Specific page objects for different webview panels

export class TicketPanelPage extends WebviewPage {
  /**
   * Get the ticket title
   */
  async getTicketTitle(): Promise<string> {
    return this.getElementText('[class*="title"], h1, .ticket-title');
  }

  /**
   * Get the ticket identifier
   */
  async getTicketIdentifier(): Promise<string> {
    return this.getElementText(
      '[class*="identifier"], .ticket-id, [class*="key"]'
    );
  }

  /**
   * Get the ticket description
   */
  async getTicketDescription(): Promise<string> {
    return this.getElementText(
      '[class*="description"], .description, [class*="content"]'
    );
  }

  /**
   * Change ticket status
   */
  async changeStatus(newStatus: string): Promise<void> {
    await this.selectOption('[class*="status"] select, select[name="status"]', newStatus);
  }

  /**
   * Add a comment
   */
  async addComment(commentText: string): Promise<void> {
    await this.typeIntoInput(
      'textarea[name="comment"], [class*="comment"] textarea',
      commentText
    );
    await this.clickElement('[class*="comment"] button, button[type="submit"]');
  }

  /**
   * Click the open in browser button
   */
  async openInBrowser(): Promise<void> {
    await this.clickElement('[class*="external"], button[title*="browser"]');
  }
}

export class CreateTicketPage extends WebviewPage {
  /**
   * Fill the ticket title
   */
  async setTitle(title: string): Promise<void> {
    await this.typeIntoInput('input[name="title"], #title', title);
  }

  /**
   * Fill the ticket description
   */
  async setDescription(description: string): Promise<void> {
    await this.typeIntoInput(
      'textarea[name="description"], #description, [class*="editor"]',
      description
    );
  }

  /**
   * Select priority
   */
  async setPriority(priority: string): Promise<void> {
    await this.selectOption(
      'select[name="priority"], #priority',
      priority
    );
  }

  /**
   * Select team (Linear)
   */
  async setTeam(teamId: string): Promise<void> {
    await this.selectOption('select[name="team"], #team', teamId);
  }

  /**
   * Select project
   */
  async setProject(projectId: string): Promise<void> {
    await this.selectOption('select[name="project"], #project', projectId);
  }

  /**
   * Submit the create ticket form
   */
  async submit(): Promise<void> {
    await this.clickElement(
      'button[type="submit"], button:contains("Create"), [class*="submit"]'
    );
    await sleep(TestConfig.timeouts.apiResponse);
  }

  /**
   * Cancel ticket creation
   */
  async cancel(): Promise<void> {
    await this.clickElement(
      'button:contains("Cancel"), [class*="cancel"]'
    );
  }
}

export class StandupBuilderPage extends WebviewPage {
  /**
   * Select standup mode
   */
  async selectMode(mode: "single" | "multi" | "custom"): Promise<void> {
    await this.clickElement(`[data-mode="${mode}"], button:contains("${mode}")`);
  }

  /**
   * Select a ticket for standup
   */
  async selectTicket(ticketId: string): Promise<void> {
    await this.clickElement(
      `[data-ticket="${ticketId}"], [class*="ticket"]:contains("${ticketId}")`
    );
  }

  /**
   * Generate the standup update
   */
  async generate(): Promise<void> {
    await this.clickElement(
      'button:contains("Generate"), [class*="generate"]'
    );
    await sleep(TestConfig.timeouts.apiResponse);
  }

  /**
   * Get the generated standup text
   */
  async getGeneratedStandup(): Promise<string> {
    return this.getElementText('[class*="result"], [class*="output"], textarea');
  }

  /**
   * Copy the standup to clipboard
   */
  async copyToClipboard(): Promise<void> {
    await this.clickElement('button:contains("Copy"), [class*="copy"]');
  }
}

export default WebviewPage;
