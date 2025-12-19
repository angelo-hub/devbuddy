/**
 * NotificationPage - Page Object for VS Code Notification interactions
 *
 * Provides methods for handling notifications, alerts, and messages
 * displayed by the extension.
 */

import {
  Workbench,
  Notification,
  NotificationType,
} from "vscode-extension-tester";
import { TestConfig } from "../utils/testConfig";
import { waitFor, sleep } from "../utils/helpers";

export interface NotificationInfo {
  message: string;
  type: NotificationType;
  source?: string;
  actions: string[];
}

export class NotificationPage {
  private workbench: Workbench;

  constructor() {
    this.workbench = new Workbench();
  }

  /**
   * Get all visible notifications
   */
  async getNotifications(): Promise<Notification[]> {
    return this.workbench.getNotifications();
  }

  /**
   * Wait for a notification containing specific text
   */
  async waitForNotification(
    textContains: string,
    timeout: number = TestConfig.timeouts.ui
  ): Promise<Notification | undefined> {
    await waitFor(async () => {
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
  async findByMessage(message: string): Promise<Notification | undefined> {
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
  async findByType(type: NotificationType): Promise<Notification[]> {
    const notifications = await this.getNotifications();
    const matching: Notification[] = [];

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
  async getNotificationInfo(
    notification: Notification
  ): Promise<NotificationInfo> {
    const message = await notification.getMessage();
    const type = await notification.getType();
    const source = await notification.getSource();
    const actions = await notification.getActions();

    const actionLabels: string[] = [];
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
  async dismissNotification(notification: Notification): Promise<void> {
    await notification.dismiss();
    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Dismiss all notifications
   */
  async dismissAll(): Promise<void> {
    const notifications = await this.getNotifications();

    for (const notification of notifications) {
      try {
        await notification.dismiss();
      } catch {
        // Ignore if notification was already dismissed
      }
    }

    await sleep(TestConfig.timeouts.animation);
  }

  /**
   * Click an action button on a notification
   */
  async clickAction(
    notification: Notification,
    actionTitle: string
  ): Promise<void> {
    const actions = await notification.getActions();

    for (const action of actions) {
      const title = await action.getTitle();
      if (title.includes(actionTitle)) {
        await action.click();
        await sleep(TestConfig.timeouts.animation);
        return;
      }
    }

    throw new Error(`Action "${actionTitle}" not found on notification`);
  }

  /**
   * Click the first action on a notification
   */
  async clickPrimaryAction(notification: Notification): Promise<void> {
    const actions = await notification.getActions();

    if (actions.length > 0) {
      await actions[0].click();
      await sleep(TestConfig.timeouts.animation);
    } else {
      throw new Error("No actions available on notification");
    }
  }

  /**
   * Wait for a notification and click an action
   */
  async waitAndClickAction(
    textContains: string,
    actionTitle: string,
    timeout: number = TestConfig.timeouts.ui
  ): Promise<void> {
    const notification = await this.waitForNotification(textContains, timeout);

    if (!notification) {
      throw new Error(
        `Notification containing "${textContains}" not found`
      );
    }

    await this.clickAction(notification, actionTitle);
  }

  /**
   * Check if any error notifications are present
   */
  async hasErrors(): Promise<boolean> {
    const errors = await this.findByType(NotificationType.Error);
    return errors.length > 0;
  }

  /**
   * Get all error messages
   */
  async getErrorMessages(): Promise<string[]> {
    const errors = await this.findByType(NotificationType.Error);
    const messages: string[] = [];

    for (const error of errors) {
      const message = await error.getMessage();
      messages.push(message);
    }

    return messages;
  }

  /**
   * Wait for notification center to be empty
   */
  async waitForEmpty(timeout: number = TestConfig.timeouts.ui): Promise<void> {
    await waitFor(async () => {
      const notifications = await this.getNotifications();
      return notifications.length === 0;
    }, timeout);
  }

  /**
   * Check if a specific notification type is present
   */
  async hasNotificationType(type: NotificationType): Promise<boolean> {
    const notifications = await this.findByType(type);
    return notifications.length > 0;
  }

  /**
   * Get count of notifications
   */
  async getNotificationCount(): Promise<number> {
    const notifications = await this.getNotifications();
    return notifications.length;
  }

  /**
   * Wait for notification to appear and then dismiss it
   */
  async waitAndDismiss(
    textContains: string,
    timeout: number = TestConfig.timeouts.ui
  ): Promise<void> {
    const notification = await this.waitForNotification(textContains, timeout);

    if (notification) {
      await this.dismissNotification(notification);
    }
  }

  /**
   * Assert that no error notifications are present
   */
  async assertNoErrors(): Promise<void> {
    const hasErrors = await this.hasErrors();

    if (hasErrors) {
      const errorMessages = await this.getErrorMessages();
      throw new Error(
        `Unexpected error notifications present: ${errorMessages.join(", ")}`
      );
    }
  }

  /**
   * Wait for a success notification
   */
  async waitForSuccess(
    textContains: string,
    timeout: number = TestConfig.timeouts.ui
  ): Promise<Notification | undefined> {
    await waitFor(async () => {
      const notifications = await this.getNotifications();
      for (const notification of notifications) {
        const message = await notification.getMessage();
        const type = await notification.getType();
        if (
          message.includes(textContains) &&
          type === NotificationType.Info
        ) {
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

export default NotificationPage;
