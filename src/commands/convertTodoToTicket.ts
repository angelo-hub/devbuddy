import * as vscode from "vscode";
import { LinearClient } from "@providers/linear/LinearClient";
import { LinearTeam } from "@providers/linear/types";
import { BaseJiraClient } from "@providers/jira/common/BaseJiraClient";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";
import { JiraServerClient } from "@providers/jira/server/JiraServerClient";
import { JiraProject, CreateJiraIssueInput } from "@providers/jira/common/types";
import { GitPermalinkGenerator, CodeContext, CodePermalink } from "@shared/git/gitPermalinkGenerator";
import { getCurrentPlatform, getJiraDeploymentType } from "@shared/utils/platformDetector";
import { ADFDocument } from "@shared/jira/adfTypes";
import { ADFBuilder, adf, getADFLanguageFromExtension } from "@shared/jira/adfBuilder";
import { MarkdownBuilder, md } from "@shared/markdown/markdownBuilder";
import { convertMarkdownToWiki, formatDescriptionWithPermalinkWiki } from "@shared/utils/wikiMarkupConverter";

/**
 * Helper to convert TODO information to Linear Markdown format
 * Creates a rich, formatted description with code context and permalinks
 */
function convertToLinearMarkdown(
  description: string,
  permalinkInfo: CodePermalink | null,
  codeContext: CodeContext | null,
  fileName: string,
  lineNumber: number,
  language?: string
): string {
  const builder = new MarkdownBuilder();

  if (permalinkInfo && codeContext) {
    // Location section
    builder.heading('📍 Location', 2);
    builder.paragraph();
    builder.paragraph(`**File:** \`${fileName}\``);
    builder.paragraph(`**Line:** ${lineNumber}`);
    builder.paragraph();

    // Links section
    builder.heading('🔗 Links', 2);
    builder.paragraph();
    const providerName = permalinkInfo.provider === "github" 
      ? "GitHub" 
      : permalinkInfo.provider.charAt(0).toUpperCase() + permalinkInfo.provider.slice(1);
    builder.paragraph(md.link(`View in ${providerName}`, permalinkInfo.url));
    builder.paragraph();
    builder.paragraph(`**Branch:** \`${permalinkInfo.branch}\``);
    builder.paragraph(`**Commit:** \`${permalinkInfo.commitSha.substring(0, 7)}\``);

    // Code context section
    builder.heading('📝 Code Context', 2);
    builder.paragraph();

    // Build code block
    const codeLines = [
      ...codeContext.contextBefore,
      codeContext.lineContent,
      ...codeContext.contextAfter,
    ];
    const codeText = codeLines.join("\n");
    builder.codeBlock(codeText, language || "text");

    // Add user's additional description if provided
    if (description && description.trim()) {
      builder.paragraph();
      builder.heading('📋 Additional Notes', 2);
      builder.paragraph();
      builder.paragraph(description.trim());
    }

    // Footer
    builder.paragraph();
    builder.horizontalRule();
    builder.paragraph(`*Created by **DevBuddy** for VS Code*`);
  } else {
    // Simple fallback without permalink/code context
    builder.paragraph(`**Found in:** \`${fileName}:${lineNumber}\``);
    builder.paragraph();
    
    if (description && description.trim()) {
      builder.paragraph(description);
    }

    // Footer
    builder.paragraph();
    builder.horizontalRule();
    builder.paragraph(`*Created by **DevBuddy** for VS Code*`);
  }

  return builder.build();
}

/**
 * Helper to convert TODO information to Jira Wiki Markup format
 * Used for Jira Server instances that use Wiki Markup instead of ADF
 */
function convertToJiraWiki(
  description: string,
  permalinkInfo: CodePermalink | null,
  codeContext: CodeContext | null,
  fileName: string,
  lineNumber: number,
  language?: string
): string {
  const parts: string[] = [];

  if (permalinkInfo && codeContext) {
    // Location section
    parts.push(`*📍 Location:* {{${fileName}:${lineNumber}}}`);
    parts.push('');

    // View in code link
    const providerName = permalinkInfo.provider === "github" 
      ? "GitHub" 
      : permalinkInfo.provider.charAt(0).toUpperCase() + permalinkInfo.provider.slice(1);
    parts.push(`*🔗 View in code:* [${providerName}|${permalinkInfo.url}]`);
    parts.push('');

    // Branch and commit
    parts.push(`*🌿 Branch:* {{${permalinkInfo.branch}}}`);
    parts.push(`*📝 Commit:* {{${permalinkInfo.commitSha.substring(0, 7)}}}`);
    parts.push('');

    // Code context header
    parts.push('*Code context:*');
    parts.push('');

    // Code block - use raw Wiki markup syntax directly
    const codeLines = [
      ...codeContext.contextBefore,
      codeContext.lineContent,
      ...codeContext.contextAfter,
    ];
    const codeText = codeLines.join("\n");

    // Use {code:language} syntax - don't let jira2md convert this
    if (language) {
      parts.push(`{code:${language}}`);
      parts.push(codeText);
      parts.push('{code}');
    } else {
      parts.push('{code}');
      parts.push(codeText);
      parts.push('{code}');
    }

    // Add user's additional description if provided
    if (description && description.trim()) {
      parts.push('');
      parts.push('*Additional notes:*');
      parts.push('');
      
      // Convert markdown description to wiki markup
      // This will handle headers, bold, italic, links, etc.
      const wikiDescription = convertMarkdownToWiki(description.trim());
      parts.push(wikiDescription);
    }

    // Footer
    parts.push('');
    parts.push('----');
    parts.push('_Created by *DevBuddy* for VS Code_');
  } else {
    // Simple fallback without permalink/code context
    parts.push(`*Found in:* {{${fileName}:${lineNumber}}}`);
    parts.push('');
    
    if (description && description.trim()) {
      const wikiDescription = convertMarkdownToWiki(description);
      parts.push(wikiDescription);
    }

    // Footer
    parts.push('');
    parts.push('----');
    parts.push('_Created by *DevBuddy* for VS Code_');
  }

  return parts.join('\n');
}

/**
 * Detect if Jira instance uses Wiki Markup or ADF
 * Simple rule: Server = Wiki, Cloud = ADF
 */
async function shouldUseWikiMarkup(
  jiraClient: BaseJiraClient,
  projectKey?: string
): Promise<boolean> {
  const jiraType = getJiraDeploymentType();
  
  // Jira Cloud always uses ADF
  if (jiraType === "cloud") {
    return false;
  }
  
  // Jira Server: always use Wiki Markup (standard format)
  // This is simpler and more reliable than runtime detection
  return true;
}

/**
 * Helper to convert TODO information to Jira ADF format
 * Creates a rich, formatted description with code context and permalinks
 */
function convertToJiraADF(
  description: string,
  permalinkInfo: CodePermalink | null,
  codeContext: CodeContext | null,
  fileName: string,
  lineNumber: number,
  language?: string
): ADFDocument {
  const builder = new ADFBuilder();

  if (permalinkInfo && codeContext) {
    // Location line
    builder.richParagraph([
      adf.strong("📍 Location: "),
      adf.code(`${fileName}:${lineNumber}`),
    ]);

    // View in code link
    builder.richParagraph([
      adf.text("🔗 View in code: "),
      adf.link(permalinkInfo.url, permalinkInfo.url),
    ]);

    // Branch
    builder.richParagraph([
      adf.text("🌿 Branch: "),
      adf.code(permalinkInfo.branch),
    ]);

    // Commit
    builder.richParagraph([
      adf.text("📝 Commit: "),
      adf.code(permalinkInfo.commitSha.substring(0, 7)),
    ]);

    // Code context header
    builder.paragraph();
    builder.richParagraph([adf.strong("Code context:")]);

    // Code block with syntax highlighting
    const codeLines = [
      ...codeContext.contextBefore,
      codeContext.lineContent,
      ...codeContext.contextAfter,
    ];
    const codeText = codeLines.join("\n");

    const adfLanguage = language ? getADFLanguageFromExtension(language) : "text";
    builder.codeBlock(codeText, adfLanguage);

    // Add user's additional description if provided
    if (description && description.trim()) {
      builder.paragraph();
      builder.richParagraph([adf.strong("Additional notes:")]);
      
      // Split description by newlines and create paragraphs
      const lines = description.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          builder.paragraph(line.trim());
        } else {
          // Empty line - add empty paragraph for spacing
          builder.paragraph();
        }
      }
    }

    // Add footer
    builder.paragraph();
    builder.rule();
    builder.richParagraph([
      adf.em("Created by "),
      adf.strong("DevBuddy"),
      adf.em(" for VS Code"),
    ]);
  } else {
    // Simple fallback without permalink/code context
    builder.paragraph(description || `Found in: ${fileName}:${lineNumber}`);
    
    // Add footer
    builder.paragraph();
    builder.rule();
    builder.richParagraph([
      adf.em("Created by "),
      adf.strong("DevBuddy"),
      adf.em(" for VS Code"),
    ]);
  }

  return builder.build();
}

/**
 * Command to convert a TODO comment in code to a ticket (Linear or Jira)
 * Beta Feature
 */
export async function convertTodoToTicket() {
  const currentPlatform = getCurrentPlatform();
  
  if (currentPlatform === "linear") {
    return await convertTodoToLinearTicket();
  } else if (currentPlatform === "jira") {
    return await convertTodoToJiraTicket();
  } else {
    vscode.window.showErrorMessage("No ticket provider configured. Please configure Linear or Jira first.");
    return;
  }
}

/**
 * Convert TODO to Jira issue
 */
async function convertTodoToJiraTicket() {
  // Get the appropriate Jira client based on deployment type
  const jiraType = getJiraDeploymentType();
  console.log(`[TODO Converter] Detected Jira type: ${jiraType}`);
  
  const jiraClient: BaseJiraClient = jiraType === "cloud" 
    ? await JiraCloudClient.create()
    : await JiraServerClient.create();
  
  console.log(`[TODO Converter] Created client: ${jiraClient.constructor.name}`);
    
  if (!jiraClient.isConfigured()) {
    const configure = await vscode.window.showErrorMessage(
      "Jira API not configured. Configure now?",
      "Configure",
      "Cancel"
    );
    if (configure === "Configure") {
      vscode.commands.executeCommand("devBuddy.jira.setup");
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
        todoInfo.lineNumber - 1
      );

      // Get code context
      codeContext = await permalinkGenerator.getCodeContext(
        editor.document,
        todoInfo.lineNumber - 1,
        5
      );
    } catch (error) {
      console.warn("[DevBuddy] Could not generate permalink:", error);
    }
  }

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Creating Jira issue from TODO...",
        cancellable: true,
      },
      async (progress, token) => {
        // Step 1: Get issue title
        progress.report({ message: "Enter issue title..." });
        const title = await vscode.window.showInputBox({
          prompt: "Issue Title",
          value: todoInfo.text,
          placeHolder: "Enter a descriptive title for the issue",
          validateInput: (value) => {
            return value.trim() ? null : "Title cannot be empty";
          },
        });

        if (!title || token.isCancellationRequested) {
          return;
        }

        // Step 2: Get description
        progress.report({ message: "Enter description..." });

        // Ask user for their own description (simple input)
        const userDescription = await vscode.window.showInputBox({
          prompt: "Additional Notes (optional)",
          placeHolder: "Add any additional context or notes about this issue...",
        });

        if (token.isCancellationRequested) {
          return;
        }

        // Step 3: Get projects
        progress.report({ message: "Loading projects..." });
        console.log(`[TODO Converter] Fetching projects using: ${jiraClient.constructor.name}`);
        const projects = await jiraClient.getProjects();
        console.log(`[TODO Converter] Found ${projects.length} projects`);

        if (projects.length === 0) {
          vscode.window.showErrorMessage("No projects found in your Jira workspace");
          return;
        }

        // Check for saved project preference
        const config = vscode.workspace.getConfiguration("devBuddy");
        const savedProjectKey = config.get<string>("jira.defaultProject");
        let selectedProject: JiraProject | undefined;

        // If saved project exists, use it as default
        if (savedProjectKey) {
          selectedProject = projects.find((p) => p.key === savedProjectKey);
        }

        // If no saved project or it doesn't exist, prompt user
        if (!selectedProject) {
          if (projects.length === 1) {
            selectedProject = projects[0];
          } else {
            progress.report({ message: "Select project..." });
            const projectPick = await vscode.window.showQuickPick(
              projects.map((project) => ({
                label: project.name,
                description: project.key,
                project: project,
              })),
              {
                placeHolder: "Select the project for this issue",
              }
            );

            if (!projectPick || token.isCancellationRequested) {
              return;
            }

            selectedProject = projectPick.project;
          }

          // Ask if they want to save this as default
          const saveDefault = await vscode.window.showQuickPick(["Yes", "No"], {
            placeHolder: `Save "${selectedProject.name}" as default project?`,
          });

          if (saveDefault === "Yes") {
            await config.update(
              "jira.defaultProject",
              selectedProject.key,
              vscode.ConfigurationTarget.Global
            );
          }
        }

        if (!selectedProject || token.isCancellationRequested) {
          return;
        }

        // Step 4: Get issue types
        progress.report({ message: "Loading issue types..." });
        const issueTypes = await jiraClient.getIssueTypes(selectedProject.id);

        if (issueTypes.length === 0) {
          vscode.window.showErrorMessage(
            `No issue types found for project ${selectedProject.name}`
          );
          return;
        }

        // Default to "Task" if available
        let selectedIssueType = issueTypes.find((t) => t.name === "Task") || issueTypes[0];

        if (issueTypes.length > 1) {
          progress.report({ message: "Select issue type..." });
          const issueTypePick = await vscode.window.showQuickPick(
            issueTypes.map((type) => ({
              label: type.name,
              description: type.description,
              issueType: type,
            })),
            {
              placeHolder: "Select the issue type",
            }
          );

          if (!issueTypePick || token.isCancellationRequested) {
            return;
          }

          selectedIssueType = issueTypePick.issueType;
        }

        // Step 5: Create issue
        progress.report({ message: "Creating issue..." });

        // Determine language for code block
        const language = permalinkGenerator?.getLanguageFromExtension(
          todoInfo.fileName.split(".").pop() || ""
        );

        // Detect if we should use Wiki Markup or ADF
        // Server = Wiki, Cloud = ADF
        const useWiki = await shouldUseWikiMarkup(jiraClient);

        const createInput: CreateJiraIssueInput = {
          projectKey: selectedProject.key,
          summary: title,
          issueTypeId: selectedIssueType.id,
        };

        if (useWiki) {
          // Use Wiki Markup for Jira Server
          const descriptionWiki = convertToJiraWiki(
            userDescription || "",
            permalinkInfo,
            codeContext,
            todoInfo.fileName,
            todoInfo.lineNumber,
            language
          );
          createInput.description = descriptionWiki;
        } else {
          // Use ADF for Jira Cloud
          const descriptionADF = convertToJiraADF(
            userDescription || "",
            permalinkInfo,
            codeContext,
            todoInfo.fileName,
            todoInfo.lineNumber,
            language
          );
          createInput.descriptionADF = descriptionADF;
        }

        const issue = await jiraClient.createIssue(createInput);

        if (!issue) {
          throw new Error("Failed to create Jira issue");
        }

        vscode.window.showInformationMessage(
          `✅ Jira issue ${issue.key} created successfully!`
        );

        // Open the ticket in the webview
        await vscode.commands.executeCommand("devBuddy.openTicket", issue);

        // Ask if user wants to replace TODO with ticket reference
        const replaceChoice = await vscode.window.showQuickPick(
          ["Replace", "Keep TODO", "Open in Browser"],
          {
            placeHolder: `Replace TODO comment with ${issue.key} reference?`,
          }
        );

        if (replaceChoice === "Replace") {
          replaceTodoWithTicketReference(editor, todoInfo, issue.key, issue.url);
        } else if (replaceChoice === "Open in Browser") {
          await vscode.env.openExternal(vscode.Uri.parse(issue.url));
        }

        // Refresh tree view
        vscode.commands.executeCommand("devBuddy.refreshTickets");
      }
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to create Jira issue: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    console.error("[DevBuddy] TODO to Jira conversion error:", error);
  }
}

/**
 * Convert TODO to Linear ticket (original implementation)
 */
async function convertTodoToLinearTicket() {
  // Check if Linear is configured
  const linearClient = await LinearClient.create();
  if (!linearClient.isConfigured()) {
    const configure = await vscode.window.showErrorMessage(
      "Linear API not configured. Configure now?",
      "Configure",
      "Cancel"
    );
    if (configure === "Configure") {
      vscode.commands.executeCommand("devBuddy.configureLinear");
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

        // Ask user for their own description (simple input)
        const userDescription = await vscode.window.showInputBox({
          prompt: "Additional Notes (optional)",
          placeHolder: "Add any additional context or notes about this ticket...",
        });

        if (token.isCancellationRequested) {
          return;
        }

        // Build the full description with generated context + user notes
        let fullDescription = "";

        if (permalinkInfo && codeContext && permalinkGenerator) {
          const language = permalinkGenerator.getLanguageFromExtension(
            todoInfo.fileName.split(".").pop() || ""
          );

          // Generate the structured context (location, links, code)
          fullDescription = convertToLinearMarkdown(
            "", // Empty - we'll add user description separately
            permalinkInfo,
            codeContext,
            todoInfo.fileName,
            todoInfo.lineNumber,
            language
          );

          // Prepend user's description if they provided one
          if (userDescription && userDescription.trim()) {
            fullDescription = `${userDescription.trim()}\n\n${fullDescription}`;
          }
        } else {
          // Fallback if no permalink available
          if (userDescription && userDescription.trim()) {
            fullDescription = userDescription.trim() + "\n\n";
          }
          fullDescription += convertToLinearMarkdown(
            todoInfo.context,
            null,
            null,
            todoInfo.fileName,
            todoInfo.lineNumber
          );
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
        const config = vscode.workspace.getConfiguration("devBuddy");
        const savedTeamId = config.get<string>("linearDefaultTeamId");
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
          description: fullDescription || undefined,
          priority: priority,
        });

        if (!issue) {
          vscode.window.showErrorMessage("Failed to create ticket");
          return;
        }

        // Step 6: Show success and offer to replace TODO
        progress.report({ message: "Ticket created!" });

        const action = await vscode.window.showInformationMessage(
          `✅ Created ticket ${issue.identifier}`,
          "Replace TODO",
          "Link Existing",
          "Copy Reference",
          "Open Ticket"
        );

        if (action === "Replace TODO") {
          replaceTodoWithTicketReference(
            editor,
            todoInfo,
            issue.identifier,
            issue.url
          );
        } else if (action === "Copy Reference") {
          // Simple: just copy ticket reference to clipboard
          await vscode.env.clipboard.writeText(`// ${issue.identifier}: Track at ${issue.url}`);
          vscode.window.showInformationMessage("📋 Ticket reference copied to clipboard");
        } else if (action === "Link Existing") {
          // Replace current TODO first
          replaceTodoWithTicketReference(
            editor,
            todoInfo,
            issue.identifier,
            issue.url
          );
          // Then offer to link additional TODOs and add permalinks to ticket
          const linearClient = await LinearClient.create();
          await linkAdditionalTodos(issue.identifier, issue.url, issue.title, linearClient, permalinkGenerator);
        } else if (action === "Open Ticket") {
          vscode.commands.executeCommand("devBuddy.openTicket", issue);
        }

        // Refresh the tickets sidebar
        vscode.commands.executeCommand("devBuddy.refreshTickets");
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
    if (offset === 0) {
      continue;
    }
    const lineNum = selection.active.line + offset;
    if (lineNum < 0 || lineNum >= document.lineCount) {
      continue;
    }

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
 * Build markdown comment body with linked TODO locations
 */
function buildLinkedTodosComment(
  permalinks: Array<{ file: string; line: number; url: string | null }>
): string {
  const builder = new MarkdownBuilder();
  
  builder.heading("📍 Additional TODO Locations", 2);
  builder.paragraph();
  
  for (const item of permalinks) {
    if (item.url) {
      // With permalink
      builder.paragraph(
        md.link(`${item.file}:${item.line}`, item.url)
      );
    } else {
      // Without permalink (fallback)
      builder.paragraph(`\`${item.file}:${item.line}\``);
    }
  }
  
  builder.paragraph();
  builder.horizontalRule();
  builder.paragraph("*Linked via **DevBuddy***");
  
  return builder.build();
}

/**
 * Find and link additional TODOs to the same ticket
 * Now also adds permalinks to the ticket as a comment
 */
async function linkAdditionalTodos(
  ticketId: string,
  ticketUrl: string,
  ticketTitle: string,
  linearClient?: LinearClient,
  permalinkGenerator?: GitPermalinkGenerator | null
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
    const permalinks: Array<{ file: string; line: number; url: string | null }> = [];

    for (const selected of selectedTodos) {
      const success = await replaceTodoInFile(
        selected.todo,
        ticketId,
        ticketUrl
      );
      if (success) {
        linkedCount++;
        
        // Generate permalink for this TODO location
        let permalink: string | null = null;
        if (permalinkGenerator) {
          try {
            const document = await vscode.workspace.openTextDocument(selected.todo.uri);
            const permalinkInfo = await permalinkGenerator.generatePermalink(
              document.fileName,
              selected.todo.line - 1
            );
            permalink = permalinkInfo?.url || null;
          } catch (error) {
            console.warn(`[DevBuddy] Could not generate permalink for ${selected.todo.file}:`, error);
          }
        }
        
        permalinks.push({
          file: selected.todo.file,
          line: selected.todo.line,
          url: permalink,
        });
      }
    }

    // Add comment to ticket with all linked TODO locations
    if (linkedCount > 0 && linearClient) {
      try {
        const issue = await linearClient.getIssue(ticketId);
        if (issue) {
          const commentBody = buildLinkedTodosComment(permalinks);
          await linearClient.addComment(issue.id, commentBody);
        }
      } catch (error) {
        console.warn("[DevBuddy] Could not add comment to ticket:", error);
        // Don't fail the whole operation if comment fails
      }
    }

    vscode.window.showInformationMessage(
      `✅ Linked ${linkedCount} additional TODO${
        linkedCount !== 1 ? "s" : ""
      } to ${ticketId}${linearClient ? " and added permalinks to ticket" : ""}`
    );
  } catch (error) {
    console.error("[DevBuddy] Failed to link additional TODOs:", error);
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
    } catch (_error) {
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
