import * as vscode from "vscode";

/**
 * Show keyboard shortcuts and commands
 */
export async function showKeyboardShortcuts(): Promise<void> {
  const shortcuts: vscode.QuickPickItem[] = [
    {
      label: "$(keyboard) Command Palette Commands",
      kind: vscode.QuickPickItemKind.Separator,
    },
    {
      label: "DevBuddy: Generate PR Summary",
      description: "Cmd/Ctrl+Shift+P → type 'PR Summary'",
    },
    {
      label: "DevBuddy: Generate Standup",
      description: "Cmd/Ctrl+Shift+P → type 'Standup'",
    },
    {
      label: "DevBuddy: Create New Ticket",
      description: "Cmd/Ctrl+Shift+P → type 'Create Ticket'",
    },
    {
      label: "DevBuddy: Convert TODO to Ticket",
      description: "Select TODO → Right-click or Lightbulb",
    },
    {
      label: "",
      kind: vscode.QuickPickItemKind.Separator,
    },
    {
      label: "$(comment) Chat Commands",
      kind: vscode.QuickPickItemKind.Separator,
    },
    {
      label: "@linear /tickets",
      description: "Show your Linear tickets",
    },
    {
      label: "@linear /standup",
      description: "Generate standup update",
    },
    {
      label: "@linear /pr",
      description: "Generate PR summary",
    },
    {
      label: "@linear /status",
      description: "Update ticket status",
    },
    {
      label: "",
      kind: vscode.QuickPickItemKind.Separator,
    },
    {
      label: "$(info) Tip",
      description:
        "You can create custom keybindings in: Preferences → Keyboard Shortcuts",
    },
  ];

  await vscode.window.showQuickPick(shortcuts, {
    placeHolder: "Available Commands & Shortcuts",
  });
}

/**
 * Show frequently asked questions
 */
export async function showFAQ(): Promise<void> {
  const faqs: vscode.QuickPickItem[] = [
    {
      label: "$(question) How do I get a Linear API key?",
      description: "Click to see answer",
      detail:
        "Run 'DevBuddy: Configure Linear Token' from the command palette. We'll guide you through getting your API key from Linear's settings.",
    },
    {
      label: "$(question) Why aren't my tickets showing up?",
      description: "Click to see answer",
      detail:
        "1. Make sure your API key is configured correctly\n2. Check that tickets are assigned to you\n3. Try clicking the refresh button in the sidebar\n4. Check your team filter in settings",
    },
    {
      label: "$(question) Can I use this with multiple Linear workspaces?",
      description: "Click to see answer",
      detail:
        "Currently, DevBuddy supports one workspace at a time. You can switch workspaces by updating your API key in settings.",
    },
    {
      label: "$(question) How do I customize branch naming?",
      description: "Click to see answer",
      detail:
        "Go to Settings → DevBuddy → Branch Naming Convention. Choose from:\n- Conventional (feat/eng-123-title)\n- Simple (eng-123-title)\n- Custom (define your own template)",
    },
    {
      label: "$(question) Is my API key secure?",
      description: "Click to see answer",
      detail:
        "Yes! Your API key is stored using VS Code's Secret Storage API, which uses your OS's secure credential storage (Keychain on macOS, Credential Vault on Windows, etc.). It's never transmitted anywhere except to Linear's official API.",
    },
    {
      label: "$(question) Can I change the AI model used for summaries?",
      description: "Click to see answer",
      detail:
        "Yes! Go to Settings → DevBuddy → AI Model. You can choose from various GitHub Copilot models including GPT-4, GPT-4 Turbo, and more. The 'auto' setting automatically uses the best available model.",
    },
    {
      label: "$(question) How do I report a bug or request a feature?",
      description: "Click to see answer",
      detail:
        "We'd love to hear from you! Open an issue on the GitHub repository or reach out through the marketplace page.",
    },
  ];

  const selected = await vscode.window.showQuickPick(faqs, {
    placeHolder: "Frequently Asked Questions",
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (selected && selected.detail) {
    await vscode.window.showInformationMessage(selected.label, {
      modal: true,
      detail: selected.detail,
    });
  }
}





