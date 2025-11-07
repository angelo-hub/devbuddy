import * as vscode from "vscode";
import { LinearClient, LinearTeam } from "../utils/linearClient";
import { GitPermalinkGenerator } from "../utils/gitPermalinkGenerator";

/**
 * Command to convert a TODO comment in code to a Linear ticket
 * Beta Feature
 */
export async function convertTodoToTicket() {
  // Check if Linear is configured
  const linearClient = await LinearClient.create();
  if (!linearClient.isConfigured()) {
    const configure = await vscode.window.showErrorMessage(
      "Linear API not configured. Configure now?",
      "Configure",
      "Cancel"
    );
    if (configure === "Configure") {
      vscode.commands.executeCommand("linearBuddy.configureLinear");
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

  // Generate permalink and code context
  const workspaceFolders = vscode.workspace.workspaceFolders;
  let permalinkInfo = null;
  let codeContext = null;
  let permalinkGenerator: GitPermalinkGenerator | null = null;

  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    permalinkGenerator = new GitPermalinkGenerator(workspaceRoot);

    try {
      // Generate permalink
      permalinkInfo = await permalinkGenerator.generatePermalink(
        editor.document.fileName,
        todoInfo.lineNumber - 1 // Convert to 0-based
      );

      // Get code context
      codeContext = await permalinkGenerator.getCodeContext(
        editor.document,
        todoInfo.lineNumber - 1, // Convert to 0-based
        5 // 5 lines of context
      );
    } catch (error) {
      console.warn("[Linear Buddy] Could not generate permalink:", error);
      // Continue without permalink - it's optional
    }
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

        // Build description with permalink and code context
        let defaultDescription = "";

        if (permalinkInfo && codeContext && permalinkGenerator) {
          const language = permalinkGenerator.getLanguageFromExtension(
            todoInfo.fileName.split(".").pop() || ""
          );

          defaultDescription = `📍 **Location:** \`${todoInfo.fileName}:${todoInfo.lineNumber}\`\n`;
          defaultDescription += `🔗 **View in code:** [${
            permalinkInfo.provider === "github"
              ? "GitHub"
              : permalinkInfo.provider
          }](${permalinkInfo.url})\n`;
          defaultDescription += `🌿 **Branch:** \`${permalinkInfo.branch}\`\n`;
          defaultDescription += `📝 **Commit:** \`${permalinkInfo.commitSha.substring(
            0,
            7
          )}\`\n\n`;
          defaultDescription += `**Code context:**\n\n`;
          defaultDescription += permalinkGenerator.formatCodeContextForMarkdown(
            codeContext,
            language
          );
        } else {
          // Fallback if no permalink available
          defaultDescription = `Found in: ${todoInfo.fileName}:${todoInfo.lineNumber}\n\n${todoInfo.context}`;
        }

        const description = await vscode.window.showInputBox({
          prompt: "Ticket Description (optional)",
          value: defaultDescription,
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
        const config = vscode.workspace.getConfiguration("linearBuddy");
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
          "Add More TODOs",
          "Link Existing TODOs",
          "Open Ticket"
        );

        if (action === "Replace TODO") {
          replaceTodoWithTicketReference(
            editor,
            todoInfo,
            issue.identifier,
            issue.url
          );
        } else if (action === "Add More TODOs") {
          // Replace current TODO first
          replaceTodoWithTicketReference(
            editor,
            todoInfo,
            issue.identifier,
            issue.url
          );
          // Then help user add new TODOs
          await addMoreTodosWorkflow(issue.identifier, issue.url, issue.title);
        } else if (action === "Link Existing TODOs") {
          // Replace current TODO first
          replaceTodoWithTicketReference(
            editor,
            todoInfo,
            issue.identifier,
            issue.url
          );
          // Then offer to link additional TODOs
          await linkAdditionalTodos(issue.identifier, issue.url, issue.title);
        } else if (action === "Open Ticket") {
          vscode.commands.executeCommand("linearBuddy.openTicket", issue);
        } else if (action === "Copy URL") {
          vscode.env.clipboard.writeText(issue.url);
          vscode.window.showInformationMessage(
            "Ticket URL copied to clipboard"
          );
        }

        // Refresh the tickets sidebar
        vscode.commands.executeCommand("linearBuddy.refreshTickets");
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

/**
 * Interactive workflow to add new TODOs in other locations
 */
async function addMoreTodosWorkflow(
  ticketId: string,
  ticketUrl: string,
  ticketTitle: string
): Promise<void> {
  const ticketReference = `${ticketId}: Track at ${ticketUrl}`;

  // Copy the ticket reference to clipboard for easy pasting
  await vscode.env.clipboard.writeText(`// ${ticketReference}`);

  const guide = await vscode.window.showInformationMessage(
    `📋 Ticket reference copied to clipboard!\n\nWorkflow:\n1. Navigate to where you need another TODO\n2. Paste the comment (Cmd/Ctrl+V)\n3. Click "Ready" when done, or "Add Another" to continue`,
    { modal: true },
    "Add Another Location",
    "Open File...",
    "Done"
  );

  if (guide === "Add Another Location") {
    // Recursive: keep going until they're done
    await continueAddingTodos(ticketId, ticketUrl, ticketTitle);
  } else if (guide === "Open File...") {
    // Let them quick-open a file
    await vscode.commands.executeCommand("workbench.action.quickOpen");
    // Then continue the workflow
    await continueAddingTodos(ticketId, ticketUrl, ticketTitle);
  } else if (guide === "Done") {
    vscode.window.showInformationMessage(
      `✅ Finished adding TODOs to ${ticketId}`
    );
  }
}

/**
 * Continue the workflow of adding more TODOs
 */
async function continueAddingTodos(
  ticketId: string,
  ticketUrl: string,
  ticketTitle: string
): Promise<void> {
  const ticketReference = `${ticketId}: Track at ${ticketUrl}`;

  // Refresh clipboard
  await vscode.env.clipboard.writeText(`// ${ticketReference}`);

  const action = await vscode.window.showInformationMessage(
    `📋 Ticket reference in clipboard: ${ticketId}\n\nNavigate to the next location and paste, or use Quick Open to find a file.`,
    "Add Another",
    "Open File...",
    "Search Files...",
    "Done"
  );

  if (action === "Add Another") {
    await continueAddingTodos(ticketId, ticketUrl, ticketTitle);
  } else if (action === "Open File...") {
    await vscode.commands.executeCommand("workbench.action.quickOpen");
    await continueAddingTodos(ticketId, ticketUrl, ticketTitle);
  } else if (action === "Search Files...") {
    await vscode.commands.executeCommand("workbench.action.findInFiles");
    await continueAddingTodos(ticketId, ticketUrl, ticketTitle);
  } else if (action === "Done") {
    vscode.window.showInformationMessage(
      `✅ Finished adding TODOs to ${ticketId}`
    );
  }
}

/**
 * Find and link additional TODOs to the same ticket
 */
async function linkAdditionalTodos(
  ticketId: string,
  ticketUrl: string,
  ticketTitle: string
): Promise<void> {
  try {
    // Search for all TODO comments in the workspace
    const todos = await findAllTodosInWorkspace();

    if (todos.length === 0) {
      vscode.window.showInformationMessage("No other TODOs found in workspace");
      return;
    }

    // Let user select which TODOs to link
    const selectedTodos = await vscode.window.showQuickPick(
      todos.map((todo) => ({
        label: todo.preview,
        description: `${todo.file}:${todo.line}`,
        detail: todo.context,
        todo: todo,
      })),
      {
        canPickMany: true,
        placeHolder: `Select TODOs to link to ${ticketId}: ${ticketTitle}`,
        title: "Link Additional TODOs",
      }
    );

    if (!selectedTodos || selectedTodos.length === 0) {
      return;
    }

    // Replace selected TODOs with ticket references
    let linkedCount = 0;
    for (const selected of selectedTodos) {
      const success = await replaceTodoInFile(
        selected.todo,
        ticketId,
        ticketUrl
      );
      if (success) {
        linkedCount++;
      }
    }

    vscode.window.showInformationMessage(
      `✅ Linked ${linkedCount} additional TODO${
        linkedCount !== 1 ? "s" : ""
      } to ${ticketId}`
    );
  } catch (error) {
    console.error("[Linear Buddy] Failed to link additional TODOs:", error);
    vscode.window.showWarningMessage(
      `Could not link additional TODOs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Find all TODO comments in the workspace
 */
async function findAllTodosInWorkspace(): Promise<
  Array<{
    file: string;
    line: number;
    preview: string;
    context: string;
    uri: vscode.Uri;
  }>
> {
  const todos: Array<{
    file: string;
    line: number;
    preview: string;
    context: string;
    uri: vscode.Uri;
  }> = [];

  // Use VS Code's search API to find TODOs
  const todoPattern =
    /(?:\/\/|\/\*|#|\*|<!--|;)\s*TODO:?\s*(.+?)(?:\*\/|-->)?$/i;

  // Get all files in workspace
  const files = await vscode.workspace.findFiles(
    "**/*.{ts,tsx,js,jsx,py,rb,go,rs,java,c,cpp,cs,php,swift,kt,scala,sh,yml,yaml}",
    "**/node_modules/**",
    1000 // Limit to 1000 files for performance
  );

  for (const file of files) {
    try {
      const document = await vscode.workspace.openTextDocument(file);
      const text = document.getText();
      const lines = text.split("\n");

      lines.forEach((line, index) => {
        const match = line.match(todoPattern);
        if (match) {
          const todoText = match[1].trim();
          const relativePath = vscode.workspace.asRelativePath(file);

          todos.push({
            file: relativePath,
            line: index + 1,
            preview:
              todoText.substring(0, 60) + (todoText.length > 60 ? "..." : ""),
            context: line.trim(),
            uri: file,
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return todos;
}

/**
 * Replace a TODO in a specific file with ticket reference
 */
async function replaceTodoInFile(
  todo: {
    file: string;
    line: number;
    preview: string;
    context: string;
    uri: vscode.Uri;
  },
  ticketId: string,
  ticketUrl: string
): Promise<boolean> {
  try {
    const document = await vscode.workspace.openTextDocument(todo.uri);
    const lineIndex = todo.line - 1;

    if (lineIndex >= document.lineCount) {
      return false;
    }

    const line = document.lineAt(lineIndex);

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

    // Open the document in an editor and make the edit
    const editor = await vscode.window.showTextDocument(document, {
      preview: false,
      preserveFocus: true,
    });

    const success = await editor.edit((editBuilder) => {
      editBuilder.replace(line.range, indent + replacement);
    });

    return success;
  } catch (error) {
    console.error(
      `[Linear Buddy] Failed to replace TODO in ${todo.file}:`,
      error
    );
    return false;
  }
}
