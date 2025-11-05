import * as vscode from "vscode";
import { LinearClient, LinearTeam } from "../utils/linearClient";

/**
 * Command to convert a TODO comment in code to a Linear ticket
 * Beta Feature
 */
export async function convertTodoToTicket() {
  // Check if Linear is configured
  const linearClient = new LinearClient();
  if (!linearClient.isConfigured()) {
    const configure = await vscode.window.showErrorMessage(
      "Linear API not configured. Configure now?",
      "Configure",
      "Cancel"
    );
    if (configure === "Configure") {
      vscode.commands.executeCommand("monorepoTools.configureLinear");
    }
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found");
    return;
  }

  // Extract TODO from selection or current line
  const todoInfo = extractTodoFromEditor(editor);
  if (!todoInfo) {
    vscode.window.showWarningMessage(
      "No TODO found. Please select a TODO comment or place cursor on a TODO line."
    );
    return;
  }

  try {
    // Start the interactive flow
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Creating Linear ticket from TODO...",
        cancellable: true,
      },
      async (progress, token) => {
        // Step 1: Get ticket title
        progress.report({ message: "Enter ticket title..." });
        const title = await vscode.window.showInputBox({
          prompt: "Ticket Title",
          value: todoInfo.text,
          placeHolder: "Enter a descriptive title for the ticket",
          validateInput: (value) => {
            return value.trim() ? null : "Title cannot be empty";
          },
        });

        if (!title || token.isCancellationRequested) {
          return;
        }

        // Step 2: Get description
        progress.report({ message: "Enter description..." });
        const description = await vscode.window.showInputBox({
          prompt: "Ticket Description (optional)",
          value: `Found in: ${todoInfo.fileName}:${todoInfo.lineNumber}\n\n${todoInfo.context}`,
          placeHolder: "Add additional context or details",
          // Upgrade to multiline after updating vscode engine
          // multiline: true,
        });

        if (token.isCancellationRequested) {
          return;
        }

        // Step 3: Get teams
        progress.report({ message: "Loading teams..." });
        const teams = await linearClient.getTeams();

        if (teams.length === 0) {
          vscode.window.showErrorMessage(
            "No teams found in your Linear workspace"
          );
          return;
        }

        // Check for saved team preference
        const config = vscode.workspace.getConfiguration("monorepoTools");
        let savedTeamId = config.get<string>("linearDefaultTeamId");
        let selectedTeam: LinearTeam | undefined;

        // If saved team exists, use it as default
        if (savedTeamId) {
          selectedTeam = teams.find((t) => t.id === savedTeamId);
        }

        // If no saved team or it doesn't exist, prompt user
        if (!selectedTeam) {
          // Default to first team if only one exists
          if (teams.length === 1) {
            selectedTeam = teams[0];
          } else {
            progress.report({ message: "Select team..." });
            const teamPick = await vscode.window.showQuickPick(
              teams.map((team) => ({
                label: team.name,
                description: team.key,
                team: team,
              })),
              {
                placeHolder: "Select the team for this ticket",
              }
            );

            if (!teamPick || token.isCancellationRequested) {
              return;
            }

            selectedTeam = teamPick.team;
          }

          // Ask if they want to save this as default
          const saveDefault = await vscode.window.showQuickPick(["Yes", "No"], {
            placeHolder: `Save "${selectedTeam.name}" as default team?`,
          });

          if (saveDefault === "Yes") {
            await config.update(
              "linearDefaultTeamId",
              selectedTeam.id,
              vscode.ConfigurationTarget.Global
            );
          }
        }

        if (!selectedTeam || token.isCancellationRequested) {
          return;
        }

        // Step 4: Get priority (optional)
        progress.report({ message: "Select priority..." });
        const priorityPick = await vscode.window.showQuickPick(
          [
            { label: "No Priority", description: "Default", priority: 0 },
            {
              label: "🔴 Urgent",
              description: "Highest priority",
              priority: 1,
            },
            { label: "🟠 High", description: "High priority", priority: 2 },
            { label: "🔵 Medium", description: "Medium priority", priority: 3 },
            { label: "⚪ Low", description: "Low priority", priority: 4 },
          ],
          {
            placeHolder: "Select priority (optional, press Escape to skip)",
          }
        );

        if (token.isCancellationRequested) {
          return;
        }

        const priority = priorityPick?.priority;

        // Step 5: Create the ticket
        progress.report({ message: "Creating ticket..." });
        const issue = await linearClient.createIssue({
          teamId: selectedTeam.id,
          title: title,
          description: description || undefined,
          priority: priority,
        });

        if (!issue) {
          vscode.window.showErrorMessage("Failed to create ticket");
          return;
        }

        // Step 6: Show success and offer to replace TODO
        progress.report({ message: "Ticket created!" });

        const action = await vscode.window.showInformationMessage(
          `✅ Created ticket ${issue.identifier}: ${issue.title}`,
          "Replace TODO",
          "Open Ticket",
          "Copy URL"
        );

        if (action === "Replace TODO") {
          replaceTodoWithTicketReference(
            editor,
            todoInfo,
            issue.identifier,
            issue.url
          );
        } else if (action === "Open Ticket") {
          vscode.commands.executeCommand("monorepoTools.openTicket", issue);
        } else if (action === "Copy URL") {
          vscode.env.clipboard.writeText(issue.url);
          vscode.window.showInformationMessage(
            "Ticket URL copied to clipboard"
          );
        }

        // Refresh the tickets sidebar
        vscode.commands.executeCommand("monorepoTools.refreshTickets");
      }
    );
  } catch (error) {
    console.error("[Linear Buddy] Failed to convert TODO:", error);
    vscode.window.showErrorMessage(
      `Failed to convert TODO: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Extract TODO information from the editor
 */
function extractTodoFromEditor(editor: vscode.TextEditor): {
  text: string;
  lineNumber: number;
  fileName: string;
  context: string;
  range: vscode.Range;
} | null {
  const selection = editor.selection;
  const document = editor.document;

  // If there's a selection, use that
  if (!selection.isEmpty) {
    const text = document.getText(selection).trim();
    if (text) {
      return {
        text: cleanTodoText(text),
        lineNumber: selection.start.line + 1,
        fileName: getRelativeFileName(document.fileName),
        context: text,
        range: selection,
      };
    }
  }

  // Otherwise, check current line for TODO pattern
  const line = document.lineAt(selection.active.line);
  const todoMatch = line.text.match(
    /(?:\/\/|\/\*|#|\*|<!--|;)\s*TODO:?\s*(.+?)(?:\*\/|-->)?$/i
  );

  if (todoMatch) {
    const todoText = todoMatch[1].trim();
    return {
      text: cleanTodoText(todoText),
      lineNumber: line.lineNumber + 1,
      fileName: getRelativeFileName(document.fileName),
      context: line.text.trim(),
      range: line.range,
    };
  }

  // Check a few lines above and below
  for (let offset = -2; offset <= 2; offset++) {
    if (offset === 0) continue;
    const lineNum = selection.active.line + offset;
    if (lineNum < 0 || lineNum >= document.lineCount) continue;

    const nearbyLine = document.lineAt(lineNum);
    const nearbyMatch = nearbyLine.text.match(
      /(?:\/\/|\/\*|#|\*|<!--|;)\s*TODO:?\s*(.+?)(?:\*\/|-->)?$/i
    );

    if (nearbyMatch) {
      const todoText = nearbyMatch[1].trim();
      return {
        text: cleanTodoText(todoText),
        lineNumber: nearbyLine.lineNumber + 1,
        fileName: getRelativeFileName(document.fileName),
        context: nearbyLine.text.trim(),
        range: nearbyLine.range,
      };
    }
  }

  return null;
}

/**
 * Clean TODO text by removing common prefixes
 */
function cleanTodoText(text: string): string {
  // Remove parentheses with usernames, dates, etc.
  text = text.replace(/\([^)]*\)/g, "").trim();
  // Remove leading dashes or asterisks
  text = text.replace(/^[-*]\s*/, "");
  return text;
}

/**
 * Get relative file name from workspace
 */
function getRelativeFileName(filePath: string): string {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    if (filePath.startsWith(workspaceRoot)) {
      return filePath.substring(workspaceRoot.length + 1);
    }
  }
  return filePath;
}

/**
 * Replace TODO comment with ticket reference
 */
function replaceTodoWithTicketReference(
  editor: vscode.TextEditor,
  todoInfo: { range: vscode.Range; context: string },
  ticketId: string,
  ticketUrl: string
): void {
  const document = editor.document;
  const line = document.lineAt(todoInfo.range.start.line);

  // Determine comment style from original line
  let commentPrefix = "//";
  if (line.text.includes("/*")) {
    commentPrefix = "/*";
  } else if (line.text.includes("#")) {
    commentPrefix = "#";
  } else if (line.text.includes("<!--")) {
    commentPrefix = "<!--";
  }

  // Create the replacement text
  let replacement = `${commentPrefix} ${ticketId}: Track at ${ticketUrl}`;
  if (commentPrefix === "/*") {
    replacement += " */";
  } else if (commentPrefix === "<!--") {
    replacement += " -->";
  }

  // Get the indentation from the original line
  const indentMatch = line.text.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : "";

  editor.edit((editBuilder) => {
    editBuilder.replace(line.range, indent + replacement);
  });
}
