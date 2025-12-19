"use strict";
/**
 * NotificationPage - Page Object for VS Code Notification interactions
 *
 * Provides methods for handling notifications, alerts, and messages
 * displayed by the extension.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPage = void 0;
const vscode_extension_tester_1 = require("vscode-extension-tester");
const testConfig_1 = require("../utils/testConfig");
const helpers_1 = require("../utils/helpers");
class NotificationPage {
    constructor() {
        this.workbench = new vscode_extension_tester_1.Workbench();
    }
    /**
     * Get all visible notifications
     */
    async getNotifications() {
        return this.workbench.getNotifications();
    }
    /**
     * Wait for a notification containing specific text
     */
    async waitForNotification(textContains, timeout = testConfig_1.TestConfig.timeouts.ui) {
        await (0, helpers_1.waitFor)(async () => {
            const notifications = await this.getNotifications();
            for (const notification of notifications) {
                const message = await notification.getMessage();
                if (message.includes(textContains)) {
                    return true;
                }
            }
            return false;
        }, timeout);
        const notifications = await this.getNotifications();
        for (const notification of notifications) {
            const message = await notification.getMessage();
            if (message.includes(textContains)) {
                return notification;
            }
        }
        return undefined;
    }
    /**
     * Find a notification by exact message
     */
    async findByMessage(message) {
        const notifications = await this.getNotifications();
        for (const notification of notifications) {
            const notifMessage = await notification.getMessage();
            if (notifMessage === message) {
                return notification;
            }
        }
        return undefined;
    }
    /**
     * Find a notification by type
     */
    async findByType(type) {
        const notifications = await this.getNotifications();
        const matching = [];
        for (const notification of notifications) {
            const notifType = await notification.getType();
            if (notifType === type) {
                matching.push(notification);
            }
        }
        return matching;
    }
    /**
     * Get notification information
     */
    async getNotificationInfo(notification) {
        const message = await notification.getMessage();
        const type = await notification.getType();
        const source = await notification.getSource();
        const actions = await notification.getActions();
        const actionLabels = [];
        for (const action of actions) {
            const title = await action.getTitle();
            actionLabels.push(title);
        }
        return {
            message,
            type,
            source,
            actions: actionLabels,
        };
    }
    /**
     * Dismiss a notification
     */
    async dismissNotification(notification) {
        await notification.dismiss();
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Dismiss all notifications
     */
    async dismissAll() {
        const notifications = await this.getNotifications();
        for (const notification of notifications) {
            try {
                await notification.dismiss();
            }
            catch {
                // Ignore if notification was already dismissed
            }
        }
        await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
    }
    /**
     * Click an action button on a notification
     */
    async clickAction(notification, actionTitle) {
        const actions = await notification.getActions();
        for (const action of actions) {
            const title = await action.getTitle();
            if (title.includes(actionTitle)) {
                await action.click();
                await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
                return;
            }
        }
        throw new Error(`Action "${actionTitle}" not found on notification`);
    }
    /**
     * Click the first action on a notification
     */
    async clickPrimaryAction(notification) {
        const actions = await notification.getActions();
        if (actions.length > 0) {
            await actions[0].click();
            await (0, helpers_1.sleep)(testConfig_1.TestConfig.timeouts.animation);
        }
        else {
            throw new Error("No actions available on notification");
        }
    }
    /**
     * Wait for a notification and click an action
     */
    async waitAndClickAction(textContains, actionTitle, timeout = testConfig_1.TestConfig.timeouts.ui) {
        const notification = await this.waitForNotification(textContains, timeout);
        if (!notification) {
            throw new Error(`Notification containing "${textContains}" not found`);
        }
        await this.clickAction(notification, actionTitle);
    }
    /**
     * Check if any error notifications are present
     */
    async hasErrors() {
        const errors = await this.findByType(vscode_extension_tester_1.NotificationType.Error);
        return errors.length > 0;
    }
    /**
     * Get all error messages
     */
    async getErrorMessages() {
        const errors = await this.findByType(vscode_extension_tester_1.NotificationType.Error);
        const messages = [];
        for (const error of errors) {
            const message = await error.getMessage();
            messages.push(message);
        }
        return messages;
    }
    /**
     * Wait for notification center to be empty
     */
    async waitForEmpty(timeout = testConfig_1.TestConfig.timeouts.ui) {
        await (0, helpers_1.waitFor)(async () => {
            const notifications = await this.getNotifications();
            return notifications.length === 0;
        }, timeout);
    }
    /**
     * Check if a specific notification type is present
     */
    async hasNotificationType(type) {
        const notifications = await this.findByType(type);
        return notifications.length > 0;
    }
    /**
     * Get count of notifications
     */
    async getNotificationCount() {
        const notifications = await this.getNotifications();
        return notifications.length;
    }
    /**
     * Wait for notification to appear and then dismiss it
     */
    async waitAndDismiss(textContains, timeout = testConfig_1.TestConfig.timeouts.ui) {
        const notification = await this.waitForNotification(textContains, timeout);
        if (notification) {
            await this.dismissNotification(notification);
        }
    }
    /**
     * Assert that no error notifications are present
     */
    async assertNoErrors() {
        const hasErrors = await this.hasErrors();
        if (hasErrors) {
            const errorMessages = await this.getErrorMessages();
            throw new Error(`Unexpected error notifications present: ${errorMessages.join(", ")}`);
        }
    }
    /**
     * Wait for a success notification
     */
    async waitForSuccess(textContains, timeout = testConfig_1.TestConfig.timeouts.ui) {
        await (0, helpers_1.waitFor)(async () => {
            const notifications = await this.getNotifications();
            for (const notification of notifications) {
                const message = await notification.getMessage();
                const type = await notification.getType();
                if (message.includes(textContains) &&
                    type === vscode_extension_tester_1.NotificationType.Info) {
                    return true;
                }
            }
            return false;
        }, timeout);
        const notifications = await this.getNotifications();
        for (const notification of notifications) {
            const message = await notification.getMessage();
            if (message.includes(textContains)) {
                return notification;
            }
        }
        return undefined;
    }
}
exports.NotificationPage = NotificationPage;
exports.default = NotificationPage;
//# sourceMappingURL=NotificationPage.js.map