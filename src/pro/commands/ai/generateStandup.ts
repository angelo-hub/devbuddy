import * as vscode from "vscode";
import { GitAnalyzer } from "@shared/git/gitAnalyzer";
import { PackageDetector } from "@shared/utils/packageDetector";
import { AISummarizer } from "@shared/ai/aiSummarizer";
import { LicenseManager } from "@pro/utils/licenseManager";

/**
 * Generate Standup Command - PRO FEATURE
 * 
 * AI-powered standup generation from commits and ticket activity.
 * Requires valid DevBuddy Pro license or active trial.
 * 
 * @license Commercial - See LICENSE.pro
 */
export async function generateStandupCommand(context?: vscode.ExtensionContext) {
  // Feature gate: Check Pro license
  if (context) {
    const licenseManager = LicenseManager.getInstance(context);
    
    if (!licenseManager.hasProAccess()) {
      await licenseManager.promptUpgrade('AI Standup Generation');
      return;
    }
  }

  try {
    // Get workspace root
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage("No workspace folder open");
      return;
    }

    const workspaceRoot = workspaceFolder.uri.fsPath;

    // Initialize utilities
    const gitAnalyzer = new GitAnalyzer(workspaceRoot);
    const packageDetector = new PackageDetector();
    const aiSummarizer = new AISummarizer();

    // Check if we're in a git repository
    const isGitRepo = await gitAnalyzer.isGitRepository();
    if (!isGitRepo) {
      vscode.window.showErrorMessage(
        "Current workspace is not a git repository"
      );
      return;
    }

    // Get config
    const config = vscode.workspace.getConfiguration("devBuddy");
    const standupTimeWindow = config.get<string>(
      "standupTimeWindow",
      "24 hours ago"
    );

    // Get base branch for better context
    const baseBranch = await gitAnalyzer.getBaseBranch();

    // Ask for target branch (defaults to base branch)
    const targetBranch = await vscode.window.showInputBox({
      prompt: "Target branch for comparison (leave empty for default)",
      value: baseBranch,
      placeHolder: `Default: ${baseBranch}`,
    });

    // Use provided branch or fall back to base branch
    const comparisonBranch = targetBranch?.trim() || baseBranch;

    // Ask if user worked on multiple tickets
    const multipleTickets = await vscode.window.showQuickPick(
      ["Single ticket", "Multiple tickets"],
      {
        placeHolder: "Did you work on one ticket or multiple tickets?",
      }
    );

    let tickets: Array<{ id: string; description: string }> = [];
    let allCommits: Array<{
      hash: string;
      message: string;
      branch?: string;
      ticketId?: string | null;
    }> = [];
    let allChangedFiles: string[] = [];

    if (multipleTickets === "Multiple tickets") {
      // Get commits across all branches
      const recentTickets = await gitAnalyzer.getRecentTickets(
        standupTimeWindow
      );
      const commitsByTicket = await gitAnalyzer.getCommitsByTicket(
        standupTimeWindow
      );

      // Show detected tickets and allow user to add more
      const ticketList = recentTickets.join(", ") || "None detected";
      const ticketInput = await vscode.window.showInputBox({
        prompt: "Enter ticket IDs (comma-separated, e.g., ENG-123, PROJ-456)",
        value: ticketList,
        placeHolder: "ENG-123, PROJ-456",
      });

      if (!ticketInput) {
        vscode.window.showWarningMessage(
          "No tickets provided, using current branch only"
        );
        // Fall back to single ticket mode
        const gitContext = await gitAnalyzer.getGitContext(standupTimeWindow);
        tickets = gitContext.ticketId
          ? [{ id: gitContext.ticketId, description: "" }]
          : [];
        allCommits = gitContext.commits;
        allChangedFiles = gitContext.changedFiles;
      } else {
        // Parse ticket IDs
        const ticketIds = ticketInput
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);

        // Prompt for descriptions for each ticket
        for (const ticketId of ticketIds) {
          const description = await vscode.window.showInputBox({
            prompt: `Brief description for ${ticketId}`,
            placeHolder: "What did you work on for this ticket?",
          });

          tickets.push({
            id: ticketId,
            description: description || "",
          });
        }

        // Collect all commits from detected tickets
        const allCommitsSet = new Set<string>(); // To avoid duplicates
        const commitsArray: Array<{
          hash: string;
          message: string;
          branch?: string;
          ticketId?: string | null;
        }> = [];

        commitsByTicket.forEach((commits, ticketId) => {
          commits.forEach((commit) => {
            if (!allCommitsSet.has(commit.hash)) {
              allCommitsSet.add(commit.hash);
              commitsArray.push({
                ...commit,
                ticketId: ticketId === "no-ticket" ? null : ticketId,
              });
            }
          });
        });

        allCommits = commitsArray;

        // Get changed files compared to target branch
        allChangedFiles = await gitAnalyzer.getChangedFiles(comparisonBranch);
      }
    } else {
      // Single ticket mode (original behavior)
      const gitContext = await gitAnalyzer.getGitContext(standupTimeWindow);

      const ticketId = await vscode.window.showInputBox({
        prompt: "Ticket ID (e.g., OB-1234)",
        value: gitContext.ticketId || "",
        placeHolder: "Leave empty if no ticket",
      });

      const ticketDescription = await vscode.window.showInputBox({
        prompt: "Brief ticket description",
        placeHolder: "What are you working on?",
      });

      if (ticketId) {
        tickets = [{ id: ticketId, description: ticketDescription || "" }];
      }

      allCommits = gitContext.commits;
      // Get changed files compared to target branch
      allChangedFiles = await gitAnalyzer.getChangedFiles(comparisonBranch);
    }

    // Analyze packages
    const packageAnalysis =
      packageDetector.analyzeChangedFiles(allChangedFiles);

    // Check if AI is available
    const aiAvailable = await aiSummarizer.isAvailable();

    let whatDidYouDo: string | undefined;
    let whatWillYouDo: string | undefined;
    let blockers: string | undefined;

    if (aiAvailable) {
      // Show progress while AI generates summaries
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Generating standup with AI...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Analyzing commits..." });

          // Get actual git diffs for better context
          progress.report({ message: "Fetching code changes..." });
          const fileDiffs = await gitAnalyzer.getFileDiffs(
            comparisonBranch,
            200
          );

          // Generate "what did you do" from commits
          const didSummary = await aiSummarizer.summarizeCommitsForStandup({
            commits: allCommits,
            changedFiles: allChangedFiles,
            fileDiffs: fileDiffs, // Pass actual diffs
            ticketId: tickets.length > 0 ? tickets[0].id : null,
            context: tickets.map((t) => `${t.id}: ${t.description}`).join("; "),
          });

          progress.report({ message: "Suggesting next steps..." });

          // Generate "what will you do" suggestions
          const nextSteps = await aiSummarizer.suggestNextSteps({
            commits: allCommits,
            changedFiles: allChangedFiles,
            ticketId: tickets.length > 0 ? tickets[0].id : null,
          });

          progress.report({ message: "Detecting blockers..." });

          // Detect potential blockers
          const detectedBlockers = await aiSummarizer.detectBlockersFromCommits(
            allCommits
          );

          // Allow user to review and edit AI-generated content
          whatDidYouDo = await vscode.window.showInputBox({
            prompt:
              "What did you do since the previous update? (AI-generated, edit if needed)",
            value: didSummary || "(see commits below)",
            placeHolder: "Describe what you accomplished...",
          });

          whatWillYouDo = await vscode.window.showInputBox({
            prompt:
              "What are you going to do today? (AI-suggested, edit if needed)",
            value: nextSteps || "Continue current work",
            placeHolder: "Describe your plan...",
          });

          blockers = await vscode.window.showInputBox({
            prompt: "Are you reaching any blockers or is anything in jeopardy?",
            value: detectedBlockers || "None",
            placeHolder: "Leave empty if none",
          });
        }
      );
    } else {
      // Fallback to manual input if AI not available
      vscode.window.showInformationMessage(
        "AI summarization not available. Using manual input."
      );

      whatDidYouDo = await vscode.window.showInputBox({
        prompt: "What did you do since the previous update?",
        placeHolder: "Describe what you accomplished...",
      });

      whatWillYouDo = await vscode.window.showInputBox({
        prompt: "What are you going to do today?",
        placeHolder: "Describe your plan...",
      });

      blockers = await vscode.window.showInputBox({
        prompt: "Are you reaching any blockers or is anything in jeopardy?",
        placeHolder: "Leave empty if none",
        value: "None",
      });
    }

    // Build standup output
    let output = "";
    output += `**Daily Standup Update**\n`;
    output += `${"=".repeat(50)}\n\n`;

    // Branch comparison info
    if (comparisonBranch !== baseBranch) {
      output += `**Comparing against:** ${comparisonBranch}\n\n`;
    }

    // Ticket info
    if (tickets.length > 0) {
      output += `**Tickets worked on:**\n`;
      tickets.forEach((ticket) => {
        output += `- **${ticket.id}**`;
        if (ticket.description) {
          output += ` – ${ticket.description}`;
        }
        output += `\n`;
      });
      output += `\n`;
    }

    // Packages modified
    if (packageAnalysis.count > 0) {
      const packageNames = packageDetector.getPackageNames(packageAnalysis);
      output += `**Packages modified:** ${packageNames.join(", ")}\n`;
      output += `**Scope verdict:** ${packageAnalysis.scopeVerdict}\n\n`;
    }

    // Standup answers
    output += `### What did you do since previous update?\n`;
    output += `${whatDidYouDo || "(see commits below)"}\n\n`;

    output += `### What are you going to do today?\n`;
    output += `${whatWillYouDo || "(continuing)"}\n\n`;

    output += `### Blockers / Risks\n`;
    output += `${blockers || "None"}\n\n`;

    // Git context
    output += `---\n\n`;
    output += `**Commits (since ${standupTimeWindow}):**\n`;
    if (allCommits.length > 0) {
      // Group commits by ticket if multiple tickets
      if (tickets.length > 1) {
        const commitsByTicket = new Map<string, typeof allCommits>();
        allCommits.forEach((commit) => {
          const ticketId = (commit as any).ticketId || "Other";
          if (!commitsByTicket.has(ticketId)) {
            commitsByTicket.set(ticketId, []);
          }
          commitsByTicket.get(ticketId)!.push(commit);
        });

        commitsByTicket.forEach((commits, ticketId) => {
          output += `\n_${ticketId}:_\n`;
          commits.forEach((commit) => {
            const branchInfo = (commit as any).branch
              ? ` [${(commit as any).branch}]`
              : "";
            output += `- ${commit.hash} ${commit.message}${branchInfo}\n`;
          });
        });
      } else {
        allCommits.forEach((commit) => {
          const branchInfo = (commit as any).branch
            ? ` [${(commit as any).branch}]`
            : "";
          output += `- ${commit.hash} ${commit.message}${branchInfo}\n`;
        });
      }
    } else {
      output += `- (no new commits in the last ${standupTimeWindow})\n`;
    }
    output += `\n`;

    output += `**Changed files (${comparisonBranch}...HEAD):**\n`;
    if (allChangedFiles.length > 0) {
      const displayFiles = allChangedFiles.slice(0, 20);
      displayFiles.forEach((file) => {
        output += `- ${file}\n`;
      });
      if (allChangedFiles.length > 20) {
        output += `- ... and ${allChangedFiles.length - 20} more files\n`;
      }
    } else {
      output += `- (no changed files)\n`;
    }
    output += `\n`;

    output += `---\n`;
    output += `_Copy/paste into your standup tool_\n`;

    // Show output in a new document
    const doc = await vscode.workspace.openTextDocument({
      content: output,
      language: "markdown",
    });
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(
      "Standup update generated! Copy and paste into your standup tool."
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Error generating standup: ${error}`);
    console.error("Standup generation error:", error);
  }
}
