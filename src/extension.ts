import * as vscode from "vscode";
import { generatePRSummaryCommand } from "./commands/generatePRSummary";
import { generateStandupCommand } from "./commands/generateStandup";
import { showFirstTimeSetup } from "./utils/firstTimeSetup";
import { LinearTicketsProvider } from "./views/linearTicketsProvider";
import { LinearBuddyChatParticipant } from "./chat/linearBuddyParticipant";
import { LinearClient, LinearIssue } from "./utils/linearClient";
import { LinearTicketPanel } from "./views/linearTicketPanel";
import { StandupBuilderPanel } from "./views/standupBuilderPanel";

export function activate(context: vscode.ExtensionContext) {
  console.log("[Linear Buddy] Extension is now active");

  // Show first-time setup if needed
  showFirstTimeSetup();

  // Initialize Linear Tickets Tree View
  const ticketsProvider = new LinearTicketsProvider();
  const treeView = vscode.window.createTreeView("linearTickets", {
    treeDataProvider: ticketsProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(treeView);

  // Ensure provider is disposed
  context.subscriptions.push({
    dispose: () => {
      ticketsProvider.dispose();
    },
  });

  // Initialize Chat Participant
  const chatParticipant = new LinearBuddyChatParticipant();
  context.subscriptions.push(chatParticipant.register(context));

  // Register existing commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "monorepoTools.generatePRSummary",
      generatePRSummaryCommand
    ),
    vscode.commands.registerCommand(
      "monorepoTools.generateStandup",
      generateStandupCommand
    ),
    vscode.commands.registerCommand("monorepoTools.openStandupBuilder", () => {
      StandupBuilderPanel.createOrShow(context.extensionUri);
    })
  );

  // Register new Linear commands
  context.subscriptions.push(
    vscode.commands.registerCommand("monorepoTools.refreshTickets", () => {
      ticketsProvider.refresh();
    }),

    vscode.commands.registerCommand(
      "monorepoTools.openTicket",
      async (issue: LinearIssue) => {
        if (issue && issue.id) {
          // Open in webview panel instead of browser
          await LinearTicketPanel.createOrShow(context.extensionUri, issue);
        }
      }
    ),

    vscode.commands.registerCommand(
      "monorepoTools.startWork",
      async (item: any) => {
        const issue = item.issue as LinearIssue;
        if (!issue) return;

        const linearClient = new LinearClient();
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
            ticketsProvider.refresh();
          }
        } else {
          vscode.window.showWarningMessage(
            "Could not find 'In Progress' state"
          );
        }
      }
    ),

    vscode.commands.registerCommand(
      "monorepoTools.completeTicket",
      async (item: any) => {
        const issue = item.issue as LinearIssue;
        if (!issue) return;

        const linearClient = new LinearClient();
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
            ticketsProvider.refresh();
          }
        } else {
          vscode.window.showWarningMessage("Could not find 'Completed' state");
        }
      }
    ),

    vscode.commands.registerCommand(
      "monorepoTools.configureLinearToken",
      async () => {
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
          await vscode.workspace
            .getConfiguration("monorepoTools")
            .update("linearApiToken", token, vscode.ConfigurationTarget.Global);

          vscode.window.showInformationMessage(
            "Linear API token configured! 🎉"
          );
          ticketsProvider.refresh();
        }
      }
    )
  );

  console.log("[Linear Buddy] All features registered successfully");
}

export function deactivate() {
  console.log("[Linear Buddy] Extension is now deactivated");
}
