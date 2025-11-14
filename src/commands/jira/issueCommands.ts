/**
 * Jira-specific commands
 * 
 * Command implementations for Jira integration.
 */

import * as vscode from "vscode";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";
import { JiraIssue } from "@providers/jira/common/types";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

/**
 * Open a Jira issue in the browser or desktop app
 */
export async function openJiraIssue(issue?: JiraIssue): Promise<void> {
  try {
    let targetIssue = issue;

    // If no issue provided, prompt user to enter issue key
    if (!targetIssue) {
      const issueKey = await vscode.window.showInputBox({
        prompt: "Enter Jira issue key (e.g., PROJ-123)",
        placeHolder: "PROJ-123",
        validateInput: (value) => {
          if (!value) {
            return "Issue key is required";
          }
          if (!/^[A-Z]+-\d+$/.test(value.toUpperCase())) {
            return "Invalid issue key format (expected: PROJ-123)";
          }
          return null;
        },
      });

      if (!issueKey) {
        return;
      }

      // Fetch the issue
      const client = await JiraCloudClient.create();
      const fetchedIssue = await client.getIssue(issueKey.toUpperCase());

      if (!fetchedIssue) {
        vscode.window.showErrorMessage(`Issue ${issueKey} not found`);
        return;
      }

      targetIssue = fetchedIssue;
    }

    // Open in browser
    await vscode.env.openExternal(vscode.Uri.parse(targetIssue.url));
    logger.info(`Opened Jira issue: ${targetIssue.key}`);
  } catch (error) {
    logger.error("Failed to open Jira issue:", error);
    vscode.window.showErrorMessage("Failed to open Jira issue");
  }
}

/**
 * Refresh Jira issues in the tree view
 */
export async function refreshJiraIssues(): Promise<void> {
  try {
    // Trigger refresh via command (tree view provider will handle it)
    await vscode.commands.executeCommand("devBuddy.jira.refreshIssues");
    logger.info("Jira issues refreshed");
  } catch (error) {
    logger.error("Failed to refresh Jira issues:", error);
  }
}

/**
 * Update Jira issue status (transition)
 */
export async function updateJiraIssueStatus(issue: JiraIssue): Promise<void> {
  try {
    const client = await JiraCloudClient.create();

    // Get available transitions
    const transitions = await client.getTransitions(issue.key);

    if (transitions.length === 0) {
      vscode.window.showInformationMessage("No status transitions available for this issue");
      return;
    }

    // Show quick pick
    const selected = await vscode.window.showQuickPick(
      transitions.map((t) => ({
        label: t.name,
        description: `Move to ${t.to.name}`,
        transition: t,
      })),
      {
        placeHolder: `Select new status for ${issue.key}`,
      }
    );

    if (!selected) {
      return;
    }

    // Perform transition
    const success = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Updating ${issue.key}...`,
        cancellable: false,
      },
      async () => {
        return await client.transitionIssue(issue.key, selected.transition.id);
      }
    );

    if (success) {
      vscode.window.showInformationMessage(
        `✅ ${issue.key} moved to ${selected.transition.to.name}`
      );
      // Refresh tree view
      await refreshJiraIssues();
    } else {
      vscode.window.showErrorMessage(`Failed to update ${issue.key}`);
    }
  } catch (error) {
    logger.error("Failed to update issue status:", error);
    vscode.window.showErrorMessage("Failed to update issue status");
  }
}

/**
 * Assign Jira issue to user
 */
export async function assignJiraIssue(issue: JiraIssue): Promise<void> {
  try {
    const client = await JiraCloudClient.create();

    // Search for users
    const query = await vscode.window.showInputBox({
      prompt: `Search for assignee (${issue.key})`,
      placeHolder: "Enter name or email",
    });

    if (!query) {
      return;
    }

    const users = await client.searchUsers(query, issue.project.key);

    if (users.length === 0) {
      vscode.window.showInformationMessage("No users found");
      return;
    }

    // Show quick pick
    const selected = await vscode.window.showQuickPick(
      [
        {
          label: "$(person) Unassigned",
          description: "Remove assignee",
          user: null,
        },
        ...users.map((u) => ({
          label: `$(person) ${u.displayName}`,
          description: u.emailAddress,
          user: u,
        })),
      ],
      {
        placeHolder: `Select assignee for ${issue.key}`,
      }
    );

    if (!selected) {
      return;
    }

    // Update issue
    const success = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Updating ${issue.key}...`,
        cancellable: false,
      },
      async () => {
        return await client.updateIssue(issue.key, {
          assigneeId: selected.user?.accountId || null as any,
        });
      }
    );

    if (success) {
      const assigneeName = selected.user?.displayName || "Unassigned";
      vscode.window.showInformationMessage(`✅ ${issue.key} assigned to ${assigneeName}`);
      // Refresh tree view
      await refreshJiraIssues();
    } else {
      vscode.window.showErrorMessage(`Failed to assign ${issue.key}`);
    }
  } catch (error) {
    logger.error("Failed to assign issue:", error);
    vscode.window.showErrorMessage("Failed to assign issue");
  }
}

/**
 * Add comment to Jira issue
 */
export async function addJiraComment(issue: JiraIssue): Promise<void> {
  try {
    const comment = await vscode.window.showInputBox({
      prompt: `Add comment to ${issue.key}`,
      placeHolder: "Enter your comment",
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return "Comment cannot be empty";
        }
        return null;
      },
    });

    if (!comment) {
      return;
    }

    const client = await JiraCloudClient.create();

    const success = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Adding comment to ${issue.key}...`,
        cancellable: false,
      },
      async () => {
        const result = await client.addComment(issue.key, comment);
        return result !== null;
      }
    );

    if (success) {
      vscode.window.showInformationMessage(`✅ Comment added to ${issue.key}`);
    } else {
      vscode.window.showErrorMessage(`Failed to add comment to ${issue.key}`);
    }
  } catch (error) {
    logger.error("Failed to add comment:", error);
    vscode.window.showErrorMessage("Failed to add comment");
  }
}

/**
 * Copy Jira issue URL to clipboard
 */
export async function copyJiraIssueUrl(issue: JiraIssue): Promise<void> {
  try {
    await vscode.env.clipboard.writeText(issue.url);
    vscode.window.showInformationMessage(`Copied ${issue.key} URL to clipboard`);
    logger.info(`Copied Jira URL: ${issue.url}`);
  } catch (error) {
    logger.error("Failed to copy URL:", error);
    vscode.window.showErrorMessage("Failed to copy URL");
  }
}

/**
 * Copy Jira issue key to clipboard
 */
export async function copyJiraIssueKey(issue: JiraIssue): Promise<void> {
  try {
    await vscode.env.clipboard.writeText(issue.key);
    vscode.window.showInformationMessage(`Copied ${issue.key} to clipboard`);
    logger.info(`Copied Jira key: ${issue.key}`);
  } catch (error) {
    logger.error("Failed to copy key:", error);
    vscode.window.showErrorMessage("Failed to copy key");
  }
}

/**
 * View Jira issue details (opens webview panel)
 */
export async function viewJiraIssueDetails(issue: JiraIssue): Promise<void> {
  try {
    // TODO: Implement Jira issue panel (similar to LinearTicketPanel)
    vscode.window.showInformationMessage("Jira issue panel coming soon! Opening in browser...");
    await openJiraIssue(issue);
  } catch (error) {
    logger.error("Failed to view issue details:", error);
    vscode.window.showErrorMessage("Failed to view issue details");
  }
}

