import * as vscode from "vscode";
import { UniversalTicketsProvider } from "@shared/views/UniversalTicketsProvider";
import { getLogger } from "@shared/utils/logger";
import { LinearClient } from "@providers/linear/LinearClient";
import { LinearIssue } from "@providers/linear/types";
import { LinearTicketPanel } from "@providers/linear/LinearTicketPanel";

/**
 * Register Linear-specific commands
 * These commands are only relevant when using Linear as the provider
 */
export function registerLinearCommands(
  context: vscode.ExtensionContext,
  ticketsProvider: UniversalTicketsProvider | undefined
): void {
  const logger = getLogger();

  context.subscriptions.push(
    // ==================== LINEAR TICKET OPERATIONS ====================
    
    // Open ticket in webview panel
    vscode.commands.registerCommand(
      "devBuddy.openTicket",
      async (issue: LinearIssue) => {
        if (issue && issue.id) {
          // Open in webview panel instead of browser
          await LinearTicketPanel.createOrShow(
            context.extensionUri,
            issue,
            context
          );
        }
      }
    ),

    // Start work on a ticket (update status to "In Progress")
    vscode.commands.registerCommand(
      "devBuddy.startWork",
      async (item: { issue?: LinearIssue }) => {
        const issue = item.issue;
        if (!issue) return;

        const linearClient = await LinearClient.create();
        const states = await linearClient.getWorkflowStates();
        const inProgressState = states.find(
          (s) =>
            s.type === "started" || s.name.toLowerCase().includes("progress")
        );

        if (inProgressState) {
          const success = await linearClient.updateIssueStatus(
            issue.id,
            inProgressState.id
          );
          if (success) {
            vscode.window.showInformationMessage(
              `Started work on ${issue.identifier}`
            );
            ticketsProvider?.refresh();
          }
        } else {
          vscode.window.showWarningMessage(
            "Could not find 'In Progress' state"
          );
        }
      }
    ),

    // Complete a ticket (update status to "Done")
    vscode.commands.registerCommand(
      "devBuddy.completeTicket",
      async (item: { issue?: LinearIssue }) => {
        const issue = item.issue;
        if (!issue) return;

        const linearClient = await LinearClient.create();
        const states = await linearClient.getWorkflowStates();
        const completedState = states.find(
          (s) => s.type === "completed" || s.name.toLowerCase().includes("done")
        );

        if (completedState) {
          const success = await linearClient.updateIssueStatus(
            issue.id,
            completedState.id
          );
          if (success) {
            vscode.window.showInformationMessage(
              `Completed ${issue.identifier}! 🎉`
            );
            ticketsProvider?.refresh();
          }
        } else {
          vscode.window.showWarningMessage("Could not find 'Completed' state");
        }
      }
    ),

    // ==================== LINEAR CONFIGURATION ====================
    
    // Configure Linear API token
    vscode.commands.registerCommand(
      "devBuddy.configureLinearToken",
      async () => {
        const config = vscode.workspace.getConfiguration("devBuddy");
        let org = config.get<string>("linearOrganization");

        // If no organization stored, ask for a Linear URL first
        if (!org) {
          const linearUrl = await vscode.window.showInputBox({
            prompt:
              "Enter any URL from your Linear workspace (e.g., a ticket or project URL)",
            placeHolder: "https://linear.app/yourorg/issue/...",
            ignoreFocusOut: true,
            validateInput: (value) => {
              if (!value) {
                return "Please enter a URL from your Linear workspace";
              }
              // Basic validation
              if (!value.includes("linear.app/")) {
                return "Please enter a valid Linear URL";
              }
              return null;
            },
          });

          if (linearUrl) {
            // Parse organization from URL
            const match = linearUrl
              .replace(/^https?:\/\//, "")
              .replace(/^www\./, "")
              .match(/^linear\.app\/([^/]+)/);
            if (match) {
              org = match[1];
              await config.update(
                "linearOrganization",
                org,
                vscode.ConfigurationTarget.Global
              );
            }
          } else {
            return; // User cancelled
          }
        }

        // Provide direct link to API key settings
        if (org) {
          const apiKeyUrl = `https://linear.app/${org}/settings/account/security`;
          const openSettings = await vscode.window.showInformationMessage(
            `Get your Linear API key from your security settings`,
            "Open API Key Settings",
            "I already have my key"
          );

          if (openSettings === "Open API Key Settings") {
            await vscode.env.openExternal(vscode.Uri.parse(apiKeyUrl));
            await vscode.window.showInformationMessage(
              "Copy your Personal API Key from the security settings page, then click Continue",
              "Continue"
            );
          } else if (openSettings !== "I already have my key") {
            return; // User cancelled
          }
        }

        const token = await vscode.window.showInputBox({
          prompt: "Enter your Linear API token",
          placeHolder: "lin_api_...",
          password: true,
          ignoreFocusOut: true,
          validateInput: (value) => {
            if (!value || value.length < 10) {
              return "Please enter a valid Linear API token";
            }
            return null;
          },
        });

        if (token) {
          // Store in secure storage
          await LinearClient.setApiToken(token);

          vscode.window.showInformationMessage(
            "Linear API token configured securely! 🎉"
          );
          ticketsProvider?.refresh();
        }
      }
    ),

    // Change ticket status (show all workflow states)
    vscode.commands.registerCommand(
      "devBuddy.changeTicketStatus",
      async (item: { issue?: LinearIssue }) => {
        const issue = item.issue;
        if (!issue) return;

        try {
          // Fetch the full issue details
          const linearClient = await LinearClient.create();
          const fullIssue = await linearClient.getIssue(issue.id);

          if (!fullIssue) {
            vscode.window.showErrorMessage("Could not fetch ticket details");
            return;
          }

          // Get workflow states filtered by team
          const availableStates = await linearClient.getWorkflowStates(
            fullIssue.team?.id
          );

          if (!availableStates || availableStates.length === 0) {
            vscode.window.showErrorMessage("No workflow states available");
            return;
          }

          logger.debug(
            `Showing ${availableStates.length} workflow states for ${
              fullIssue.identifier
            } (team: ${fullIssue.team?.name || "default"})`
          );

          // Create QuickPick items with icons based on state type
          const stateItems = availableStates.map((state) => {
            let icon = "$(circle)";
            let description = "";

            switch (state.type) {
              case "backlog":
                icon = "$(layers)";
                description = "Backlog";
                break;
              case "unstarted":
                icon = "$(circle-outline)";
                description = "Todo";
                break;
              case "started":
                icon = "$(play-circle)";
                description = "In Progress";
                break;
              case "completed":
                icon = "$(check-all)";
                description = "Done";
                break;
              case "canceled":
                icon = "$(circle-slash)";
                description = "Canceled";
                break;
              case "triage":
                icon = "$(milestone)";
                description = "Triage";
                break;
            }

            return {
              label: `${icon} ${state.name}`,
              description:
                state.name === fullIssue.state.name
                  ? "$(check) Current"
                  : description,
              state: state,
            };
          });

          // Show QuickPick
          const selected = await vscode.window.showQuickPick(stateItems, {
            placeHolder: `Change status for ${issue.identifier}`,
            ignoreFocusOut: true,
          });

          if (!selected) {
            return; // User cancelled
          }

          // Update status
          const success = await linearClient.updateIssueStatus(
            issue.id,
            selected.state.id
          );

          if (success) {
            vscode.window.showInformationMessage(
              `${issue.identifier} status updated to ${selected.state.name} ✓`
            );
            ticketsProvider?.refresh();
          } else {
            vscode.window.showErrorMessage(
              "Failed to update status. This transition may not be allowed by your workflow."
            );
          }
        } catch (error) {
          logger.error("[Linear] Failed to change status:", error);
          vscode.window.showErrorMessage(
            `Failed to change status: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    // ==================== LINEAR PR COMMANDS ====================
    
    // Open PR from Linear issue
    vscode.commands.registerCommand("devBuddy.openPR", async (item: { issue?: LinearIssue }) => {
      const issue = item.issue;
      if (!issue) return;

      try {
        // Find PR attachments (GitHub, GitLab, etc.)
        const attachmentNodes = issue.attachments?.nodes || [];
        const prAttachments = attachmentNodes.filter(
          (att) =>
            att.sourceType &&
            (att.sourceType.toLowerCase().includes("github") ||
              att.sourceType.toLowerCase().includes("gitlab") ||
              att.sourceType.toLowerCase().includes("bitbucket"))
        );

        if (!prAttachments || prAttachments.length === 0) {
          vscode.window.showInformationMessage(
            `No pull requests found for ${issue.identifier}`
          );
          return;
        }

        // If there's only one PR, open it directly
        if (prAttachments.length === 1) {
          const prUrl = prAttachments[0].url;
          await vscode.env.openExternal(vscode.Uri.parse(prUrl));
          vscode.window.showInformationMessage(
            `Opening PR for ${issue.identifier}`
          );
          return;
        }

        // If there are multiple PRs, let user choose
        const prOptions = prAttachments.map((pr) => ({
          label: pr.title || "Pull Request",
          description: pr.subtitle || pr.url,
          url: pr.url,
        }));

        const selected = await vscode.window.showQuickPick(prOptions, {
          placeHolder: `Select a pull request for ${issue.identifier}`,
          ignoreFocusOut: true,
        });

        if (selected) {
          await vscode.env.openExternal(vscode.Uri.parse(selected.url));
          vscode.window.showInformationMessage("Opening pull request");
        }
      } catch (error) {
        logger.error("[Linear] Failed to open PR:", error);
        vscode.window.showErrorMessage(
          `Failed to open PR: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    })
  );

  logger.debug("Linear commands registered");
}


