/**
 * E2E Test Helpers
 *
 * Common utility functions for E2E tests including wait helpers,
 * element finders, and assertion utilities.
 */

import {
  Workbench,
  SideBarView,
  ViewSection,
  TreeItem,
  InputBox,
  Notification,
  NotificationType,
  WebView,
  EditorView,
  VSBrowser,
} from "vscode-extension-tester";
import { TestConfig } from "./testConfig";

/**
 * Wait for a condition to be true with configurable timeout
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout: number = TestConfig.timeouts.default,
  pollInterval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await sleep(pollInterval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for the DevBuddy sidebar to be visible
 */
export async function waitForDevBuddySidebar(): Promise<SideBarView> {
  const workbench = new Workbench();

  // Open the sidebar via command
  await workbench.executeCommand("workbench.view.extension.dev-buddy");
  await sleep(TestConfig.timeouts.animation);

  const sidebarView = new SideBarView();
  await waitFor(async () => {
    try {
      const content = sidebarView.getContent();
      const sections = await content.getSections();
      return sections.length > 0;
    } catch {
      return false;
    }
  }, TestConfig.timeouts.ui);

  return sidebarView;
}

/**
 * Get the My Tickets view section
 */
export async function getMyTicketsSection(): Promise<ViewSection> {
  const sidebar = await waitForDevBuddySidebar();
  const content = sidebar.getContent();

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
 * Get all ticket items from the tree view
 */
export async function getTicketItems(): Promise<TreeItem[]> {
  const section = await getMyTicketsSection();

  await waitFor(async () => {
    try {
      const items = await section.getVisibleItems();
      return items.length > 0;
    } catch {
      return false;
    }
  }, TestConfig.timeouts.ui);

  const items = await section.getVisibleItems();
  // ViewItem[] can be cast to TreeItem[] for our purposes
  return items as unknown as TreeItem[];
}

/**
 * Find a ticket by its identifier (e.g., "ENG-123")
 */
export async function findTicketByIdentifier(
  identifier: string
): Promise<TreeItem | undefined> {
  const items = await getTicketItems();

  for (const item of items) {
    const label = await item.getLabel();
    if (label.includes(identifier)) {
      return item;
    }
  }

  return undefined;
}

/**
 * Execute a DevBuddy command via the command palette
 */
export async function executeCommand(command: string): Promise<void> {
  const workbench = new Workbench();
  await workbench.executeCommand(command);
  await sleep(TestConfig.timeouts.animation);
}

/**
 * Get the current input box (command palette, quick pick, etc.)
 */
export async function getInputBox(): Promise<InputBox> {
  return new InputBox();
}

/**
 * Wait for and get a notification by text content
 */
export async function waitForNotification(
  textContains: string,
  type?: NotificationType
): Promise<Notification | undefined> {
  const workbench = new Workbench();

  await waitFor(async () => {
    const notifications = await workbench.getNotifications();
    for (const notification of notifications) {
      const message = await notification.getMessage();
      if (message.includes(textContains)) {
        if (type) {
          const notifType = await notification.getType();
          return notifType === type;
        }
        return true;
      }
    }
    return false;
  }, TestConfig.timeouts.ui);

  const notifications = await workbench.getNotifications();
  for (const notification of notifications) {
    const message = await notification.getMessage();
    if (message.includes(textContains)) {
      return notification;
    }
  }

  return undefined;
}

/**
 * Dismiss all notifications
 */
export async function dismissAllNotifications(): Promise<void> {
  const workbench = new Workbench();
  const notifications = await workbench.getNotifications();

  for (const notification of notifications) {
    await notification.dismiss();
  }
}

/**
 * Open a webview panel by command
 */
export async function openWebviewPanel(command: string): Promise<WebView> {
  await executeCommand(command);

  const workbench = new Workbench();
  const editorView = new EditorView();

  await waitFor(async () => {
    try {
      const webview = new WebView();
      await webview.wait();
      return true;
    } catch {
      return false;
    }
  }, TestConfig.timeouts.ui);

  return new WebView();
}

/**
 * Refresh the extension (useful after mock data changes)
 */
export async function refreshExtension(): Promise<void> {
  await executeCommand("devBuddy.refreshTickets");
  await sleep(TestConfig.timeouts.apiResponse);
}

/**
 * Clear all extension state (reset to clean state)
 */
export async function resetExtensionState(): Promise<void> {
  await executeCommand("devBuddy.resetExtension");
  await sleep(TestConfig.timeouts.animation);
}

/**
 * Get the VS Code browser driver
 */
export function getBrowser(): VSBrowser {
  return VSBrowser.instance;
}

/**
 * Take a screenshot (useful for debugging failed tests)
 */
export async function takeScreenshot(name: string): Promise<string> {
  const browser = getBrowser();
  const driver = browser.driver;
  const screenshot = await driver.takeScreenshot();

  // Save to test-results folder
  const fs = await import("fs");
  const path = await import("path");
  const resultsDir = path.join(__dirname, "../../../test-results");

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const filePath = path.join(resultsDir, `${name}-${Date.now()}.png`);
  fs.writeFileSync(filePath, screenshot, "base64");

  return filePath;
}

/**
 * Assert element is visible
 */
export async function assertVisible(
  element: { isDisplayed: () => Promise<boolean> },
  message?: string
): Promise<void> {
  const isDisplayed = await element.isDisplayed();
  if (!isDisplayed) {
    throw new Error(message || "Element is not visible");
  }
}

/**
 * Assert element contains text
 */
export async function assertContainsText(
  element: { getText: () => Promise<string> },
  expectedText: string,
  message?: string
): Promise<void> {
  const text = await element.getText();
  if (!text.includes(expectedText)) {
    throw new Error(
      message || `Expected "${expectedText}" to be in "${text}"`
    );
  }
}
