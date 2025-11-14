import * as vscode from "vscode";

/**
 * Code Action Provider for TODO comments
 * Shows lightbulb suggestions when cursor is on a TODO
 */
export class TodoToTicketCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    // Check if cursor is on a TODO line
    const line = document.lineAt(range.start.line);
    const todoMatch = line.text.match(
      /(?:\/\/|\/\*|#|\*|<!--|;)\s*TODO:?\s*(.+?)(?:\*\/|-->)?$/i
    );

    if (!todoMatch) {
      return [];
    }

    // Create code action
    const action = new vscode.CodeAction(
      "💡 Convert TODO to Ticket",
      vscode.CodeActionKind.QuickFix
    );
    action.command = {
      command: "devBuddy.convertTodoToTicket",
      title: "Convert TODO to Ticket",
    };
    action.isPreferred = true; // Makes this the default action

    return [action];
  }
}

/**
 * Check if current editor position has a TODO that can be converted
 */
export function hasTodoAtCursor(editor?: vscode.TextEditor): boolean {
  if (!editor) {
    return false;
  }

  const document = editor.document;
  const selection = editor.selection;

  // Check if selection has text
  if (!selection.isEmpty) {
    return true;
  }

  // Check current line and nearby lines for TODO
  for (let offset = -2; offset <= 2; offset++) {
    const lineNum = selection.active.line + offset;
    if (lineNum < 0 || lineNum >= document.lineCount) continue;

    const line = document.lineAt(lineNum);
    const todoMatch = line.text.match(
      /(?:\/\/|\/\*|#|\*|<!--|;)\s*TODO:?\s*(.+?)(?:\*\/|-->)?$/i
    );

    if (todoMatch) {
      return true;
    }
  }

  return false;
}

