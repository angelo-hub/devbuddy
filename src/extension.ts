import * as vscode from "vscode";
import { generatePRSummaryCommand } from "./commands/generatePRSummary";
import { generateStandupCommand } from "./commands/generateStandup";
import { convertTodoToTicket } from "./commands/convertTodoToTicket";
import { TodoToTicketCodeActionProvider } from "./utils/todoCodeActionProvider";
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

  // Register Code Action Provider for TODOs (lightbulb suggestions)
  const todoCodeActionProvider = vscode.languages.registerCodeActionsProvider(
    { scheme: "file" }, // All file types
    new TodoToTicketCodeActionProvider(),
    {
      providedCodeActionKinds:
        TodoToTicketCodeActionProvider.providedCodeActionKinds,
    }
  );
  context.subscriptions.push(todoCodeActionProvider);

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
    }),

    // Beta: Convert TODO to Linear Ticket
    vscode.commands.registerCommand(
      "monorepoTools.convertTodoToTicket",
      convertTodoToTicket
    )
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
    ),

    vscode.commands.registerCommand(
      "monorepoTools.changeTicketStatus",
      async (item: any) => {
        const issue = item.issue as LinearIssue;
        if (!issue) return;

        try {
          // Fetch the full issue details
          const linearClient = new LinearClient();
          const fullIssue = await linearClient.getIssue(issue.id);

          if (!fullIssue) {
            vscode.window.showErrorMessage("Could not fetch ticket details");
            return;
          }

          // Get workflow states filtered by team
          // Note: Linear API doesn't expose workflow groupings, so we show all states for the team
          const availableStates = await linearClient.getWorkflowStates(
            fullIssue.team?.id
          );

          if (!availableStates || availableStates.length === 0) {
            vscode.window.showErrorMessage("No workflow states available");
            return;
          }

          console.log(
            `[Linear Buddy] Showing ${
              availableStates.length
            } workflow states for ${fullIssue.identifier} (team: ${
              fullIssue.team?.name || "default"
            })`
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
            ticketsProvider.refresh();
          } else {
            vscode.window.showErrorMessage(
              "Failed to update status. This transition may not be allowed by your workflow."
            );
          }
        } catch (error) {
          console.error("[Linear Buddy] Failed to change status:", error);
          vscode.window.showErrorMessage(
            `Failed to change status: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    vscode.commands.registerCommand(
      "monorepoTools.startBranch",
      async (item: any) => {
        const issue = item.issue as LinearIssue;
        if (!issue) return;

        try {
          // Initialize git
          const simpleGit = require("simple-git");
          const workspaceFolders = vscode.workspace.workspaceFolders;

          if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("No workspace folder open");
            return;
          }

          const git = simpleGit(workspaceFolders[0].uri.fsPath);

          // Check if git repository exists
          const isRepo = await git.checkIsRepo();
          if (!isRepo) {
            vscode.window.showErrorMessage(
              "Current workspace is not a git repository"
            );
            return;
          }

          // Get all branches and current branch
          const branchSummary = await git.branch();
          const currentBranch = branchSummary.current;
          const allBranches = branchSummary.all;

          // Step 1: Select source branch (with dropdown + text input)
          const sourceBranch = await new Promise<string | undefined>(
            (resolve) => {
              const quickPick = vscode.window.createQuickPick();
              quickPick.title = `Select source branch for ${issue.identifier}`;
              quickPick.placeholder =
                "Type to search or enter a custom branch name";
              quickPick.value = currentBranch; // Default to current branch

              // Create items for all branches
              quickPick.items = allBranches.map((branch: string) => ({
                label: branch,
                description:
                  branch === currentBranch ? "$(check) Current branch" : "",
                alwaysShow: branch === currentBranch,
              }));

              // Highlight current branch at the top
              const currentBranchItem = quickPick.items.find(
                (item) => item.label === currentBranch
              );
              if (currentBranchItem) {
                quickPick.activeItems = [currentBranchItem];
              }

              quickPick.onDidAccept(() => {
                const selected = quickPick.selectedItems[0];
                // If user selected an item, use it; otherwise use the typed value
                resolve(selected ? selected.label : quickPick.value);
                quickPick.hide();
              });

              quickPick.onDidHide(() => {
                resolve(undefined);
                quickPick.dispose();
              });

              quickPick.show();
            }
          );

          if (!sourceBranch) {
            return; // User cancelled
          }

          // Verify source branch exists
          if (!allBranches.includes(sourceBranch)) {
            vscode.window.showErrorMessage(
              `Source branch '${sourceBranch}' does not exist`
            );
            return;
          }

          // Generate default branch name based on convention
          const config = vscode.workspace.getConfiguration("monorepoTools");
          const convention = config.get<string>(
            "branchNamingConvention",
            "conventional"
          );
          const customTemplate = config.get<string>(
            "customBranchTemplate",
            "{type}/{identifier}-{slug}"
          );

          // Determine the conventional commit type from the issue labels or default to 'feat'
          let commitType = "feat";
          if (issue.labels && issue.labels.length > 0) {
            const labelName = issue.labels[0].name.toLowerCase();
            if (["bug", "bugfix", "fix"].includes(labelName)) {
              commitType = "fix";
            } else if (["chore", "maintenance"].includes(labelName)) {
              commitType = "chore";
            } else if (["docs", "documentation"].includes(labelName)) {
              commitType = "docs";
            } else if (["test", "testing"].includes(labelName)) {
              commitType = "test";
            } else if (["refactor", "refactoring"].includes(labelName)) {
              commitType = "refactor";
            }
          }

          // Create a slug from the title
          const slug = issue.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .substring(0, 50); // Limit length

          let defaultBranchName: string;

          switch (convention) {
            case "conventional":
              defaultBranchName = `${commitType}/${issue.identifier.toLowerCase()}-${slug}`;
              break;
            case "simple":
              defaultBranchName = `${issue.identifier.toLowerCase()}-${slug}`;
              break;
            case "custom":
              // Get current username from git config
              let username = "user";
              try {
                const userName = await git.raw(["config", "user.name"]);
                username = userName
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-");
              } catch (error) {
                // Ignore errors and use default
              }

              defaultBranchName = customTemplate
                .replace("{type}", commitType)
                .replace("{identifier}", issue.identifier.toLowerCase())
                .replace("{slug}", slug)
                .replace("{username}", username);
              break;
            default:
              defaultBranchName = `${commitType}/${issue.identifier.toLowerCase()}-${slug}`;
          }

          // Step 2: Enter new branch name
          const branchName = await vscode.window.showInputBox({
            prompt: `Create a new branch for ${issue.identifier} from '${sourceBranch}'`,
            placeHolder: defaultBranchName,
            value: defaultBranchName,
            ignoreFocusOut: true,
            validateInput: (value) => {
              if (!value || value.trim().length === 0) {
                return "Branch name cannot be empty";
              }
              // Check for invalid git branch characters
              if (/[\s~^:?*\[\]\\]/.test(value)) {
                return "Branch name contains invalid characters";
              }
              return null;
            },
          });

          if (!branchName) {
            return; // User cancelled
          }

          // Check if branch already exists
          if (allBranches.includes(branchName)) {
            const shouldCheckout = await vscode.window.showWarningMessage(
              `Branch '${branchName}' already exists. Do you want to check it out?`,
              "Yes",
              "No"
            );

            if (shouldCheckout === "Yes") {
              await git.checkout(branchName);
              vscode.window.showInformationMessage(
                `Checked out existing branch: ${branchName}`
              );
            }
            return;
          }

          // Show progress notification
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Creating branch: ${branchName} from ${sourceBranch}`,
              cancellable: false,
            },
            async (progress) => {
              progress.report({ increment: 0, message: "Creating branch..." });

              // Checkout source branch first if not already on it
              if (currentBranch !== sourceBranch) {
                await git.checkout(sourceBranch);
              }

              // Create and checkout the new branch from source
              await git.checkoutLocalBranch(branchName);

              progress.report({ increment: 100 });
            }
          );

          vscode.window.showInformationMessage(
            `Branch '${branchName}' created from '${sourceBranch}' and checked out! 🚀`
          );

          // Optionally update the issue status to "In Progress"
          const shouldUpdateStatus = await vscode.window.showInformationMessage(
            `Do you want to mark ${issue.identifier} as "In Progress"?`,
            "Yes",
            "No"
          );

          if (shouldUpdateStatus === "Yes") {
            const linearClient = new LinearClient();
            const states = await linearClient.getWorkflowStates();
            const inProgressState = states.find(
              (s) =>
                s.type === "started" ||
                s.name.toLowerCase().includes("progress")
            );

            if (inProgressState) {
              const success = await linearClient.updateIssueStatus(
                issue.id,
                inProgressState.id
              );
              if (success) {
                vscode.window.showInformationMessage(
                  `${issue.identifier} status updated to In Progress`
                );
                ticketsProvider.refresh();
              }
            }
          }
        } catch (error) {
          console.error("[Linear Buddy] Failed to create branch:", error);
          vscode.window.showErrorMessage(
            `Failed to create branch: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    ),

    vscode.commands.registerCommand(
      "monorepoTools.openPR",
      async (item: any) => {
        const issue = item.issue as LinearIssue;
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
            placeHolder: "Select a pull request to open",
            ignoreFocusOut: true,
          });

          if (selected) {
            await vscode.env.openExternal(vscode.Uri.parse(selected.url));
            vscode.window.showInformationMessage(
              `Opening PR: ${selected.label}`
            );
          }
        } catch (error) {
          console.error("[Linear Buddy] Failed to open PR:", error);
          vscode.window.showErrorMessage(
            `Failed to open PR: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    )
  );

  console.log("[Linear Buddy] All features registered successfully");
}

export function deactivate() {
  console.log("[Linear Buddy] Extension is now deactivated");
}
