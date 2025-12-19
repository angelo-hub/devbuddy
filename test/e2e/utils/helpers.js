"use strict";
/**
 * E2E Test Helpers
 *
 * Common utility functions for E2E tests including wait helpers,
 * element finders, and assertion utilities.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitFor = waitFor;
exports.sleep = sleep;
exports.waitForDevBuddySidebar = waitForDevBuddySidebar;
exports.getMyTicketsSection = getMyTicketsSection;
exports.getTicketItems = getTicketItems;
exports.findTicketByIdentifier = findTicketByIdentifier;
exports.executeCommand = executeCommand;
exports.getInputBox = getInputBox;
exports.waitForNotification = waitForNotification;
exports.dismissAllNotifications = dismissAllNotifications;
exports.openWebviewPanel = openWebviewPanel;
exports.refreshExtension = refreshExtension;
exports.resetExtensionState = resetExtensionState;
exports.getBrowser = getBrowser;
exports.takeScreenshot = takeScreenshot;
exports.assertVisible = assertVisible;
exports.assertContainsText = assertContainsText;
const vscode_extension_tester_1 = require("vscode-extension-tester");
const testConfig_1 = require("./testConfig");
/**
 * Wait for a condition to be true with configurable timeout
 */
async function waitFor(condition, timeout = testConfig_1.TestConfig.timeouts.default, pollInterval = 100) {
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
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Wait for the DevBuddy sidebar to be visible
 */
async function waitForDevBuddySidebar() {
    const workbench = new vscode_extension_tester_1.Workbench();
    // Open the sidebar via command
    await workbench.executeCommand("workbench.view.extension.dev-buddy");
    await sleep(testConfig_1.TestConfig.timeouts.animation);
    const sidebarView = new vscode_extension_tester_1.SideBarView();
    await waitFor(async () => {
        try {
            const content = sidebarView.getContent();
            const sections = await content.getSections();
            return sections.length > 0;
        }
        catch {
            return false;
        }
    }, testConfig_1.TestConfig.timeouts.ui);
    return sidebarView;
}
/**
 * Get the My Tickets view section
 */
async function getMyTicketsSection() {
    const sidebar = await waitForDevBuddySidebar();
    const content = sidebar.getContent();
    await waitFor(async () => {
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
 * Get all ticket items from the tree view
 */
async function getTicketItems() {
    const section = await getMyTicketsSection();
    await waitFor(async () => {
        try {
            const items = await section.getVisibleItems();
            return items.length > 0;
        }
        catch {
            return false;
        }
    }, testConfig_1.TestConfig.timeouts.ui);
    return section.getVisibleItems();
}
/**
 * Find a ticket by its identifier (e.g., "ENG-123")
 */
async function findTicketByIdentifier(identifier) {
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
async function executeCommand(command) {
    const workbench = new vscode_extension_tester_1.Workbench();
    await workbench.executeCommand(command);
    await sleep(testConfig_1.TestConfig.timeouts.animation);
}
/**
 * Get the current input box (command palette, quick pick, etc.)
 */
async function getInputBox() {
    return new vscode_extension_tester_1.InputBox();
}
/**
 * Wait for and get a notification by text content
 */
async function waitForNotification(textContains, type) {
    const workbench = new vscode_extension_tester_1.Workbench();
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
    }, testConfig_1.TestConfig.timeouts.ui);
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
async function dismissAllNotifications() {
    const workbench = new vscode_extension_tester_1.Workbench();
    const notifications = await workbench.getNotifications();
    for (const notification of notifications) {
        await notification.dismiss();
    }
}
/**
 * Open a webview panel by command
 */
async function openWebviewPanel(command) {
    await executeCommand(command);
    const workbench = new vscode_extension_tester_1.Workbench();
    const editorView = new vscode_extension_tester_1.EditorView();
    await waitFor(async () => {
        try {
            const webview = new vscode_extension_tester_1.WebView();
            await webview.wait();
            return true;
        }
        catch {
            return false;
        }
    }, testConfig_1.TestConfig.timeouts.ui);
    return new vscode_extension_tester_1.WebView();
}
/**
 * Refresh the extension (useful after mock data changes)
 */
async function refreshExtension() {
    await executeCommand("devBuddy.refreshTickets");
    await sleep(testConfig_1.TestConfig.timeouts.apiResponse);
}
/**
 * Clear all extension state (reset to clean state)
 */
async function resetExtensionState() {
    await executeCommand("devBuddy.resetExtension");
    await sleep(testConfig_1.TestConfig.timeouts.animation);
}
/**
 * Get the VS Code browser driver
 */
function getBrowser() {
    return vscode_extension_tester_1.VSBrowser.instance;
}
/**
 * Take a screenshot (useful for debugging failed tests)
 */
async function takeScreenshot(name) {
    const browser = getBrowser();
    const driver = browser.driver;
    const screenshot = await driver.takeScreenshot();
    // Save to test-results folder
    const fs = await Promise.resolve().then(() => __importStar(require("fs")));
    const path = await Promise.resolve().then(() => __importStar(require("path")));
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
async function assertVisible(element, message) {
    const isDisplayed = await element.isDisplayed();
    if (!isDisplayed) {
        throw new Error(message || "Element is not visible");
    }
}
/**
 * Assert element contains text
 */
async function assertContainsText(element, expectedText, message) {
    const text = await element.getText();
    if (!text.includes(expectedText)) {
        throw new Error(message || `Expected "${expectedText}" to be in "${text}"`);
    }
}
//# sourceMappingURL=helpers.js.map