import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import { AIProviderManager } from "@shared/ai/aiProviderManager";
import { OpenAIProvider } from "@shared/ai/providers/OpenAIProvider";
import { AnthropicProvider } from "@shared/ai/providers/AnthropicProvider";
import { GoogleProvider } from "@shared/ai/providers/GoogleProvider";
import { AIProviderType } from "@shared/ai/providers/types";

const logger = getLogger();

/**
 * Command: Set OpenAI API Key
 */
export async function setOpenAIKeyCommand(
  context: vscode.ExtensionContext
): Promise<void> {
  const apiKey = await vscode.window.showInputBox({
    title: "Set OpenAI API Key (Beta)",
    prompt: "Enter your OpenAI API key",
    password: true,
    placeHolder: "sk-...",
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "API key cannot be empty";
      }
      if (!value.startsWith("sk-")) {
        return "OpenAI API keys typically start with 'sk-'";
      }
      return null;
    },
  });

  if (!apiKey) {
    return; // User cancelled
  }

  try {
    await OpenAIProvider.setApiKey(context, apiKey.trim());
    vscode.window.showInformationMessage(
      "OpenAI API key saved securely. You can now use OpenAI as your AI provider."
    );

    // Prompt to switch provider
    const switchProvider = await vscode.window.showInformationMessage(
      "Would you like to switch to OpenAI as your AI provider?",
      "Yes",
      "No"
    );

    if (switchProvider === "Yes") {
      await vscode.workspace
        .getConfiguration("devBuddy")
        .update("ai.provider", "openai", vscode.ConfigurationTarget.Global);
      AIProviderManager.getInstance().refresh();
      vscode.window.showInformationMessage(
        "AI provider switched to OpenAI."
      );
    }
  } catch (error) {
    logger.error("Failed to save OpenAI API key:", error);
    vscode.window.showErrorMessage(
      `Failed to save API key: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Command: Set Anthropic API Key
 */
export async function setAnthropicKeyCommand(
  context: vscode.ExtensionContext
): Promise<void> {
  const apiKey = await vscode.window.showInputBox({
    title: "Set Anthropic API Key (Beta)",
    prompt: "Enter your Anthropic API key",
    password: true,
    placeHolder: "sk-ant-...",
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "API key cannot be empty";
      }
      return null;
    },
  });

  if (!apiKey) {
    return; // User cancelled
  }

  try {
    await AnthropicProvider.setApiKey(context, apiKey.trim());
    vscode.window.showInformationMessage(
      "Anthropic API key saved securely. You can now use Anthropic as your AI provider."
    );

    // Prompt to switch provider
    const switchProvider = await vscode.window.showInformationMessage(
      "Would you like to switch to Anthropic as your AI provider?",
      "Yes",
      "No"
    );

    if (switchProvider === "Yes") {
      await vscode.workspace
        .getConfiguration("devBuddy")
        .update("ai.provider", "anthropic", vscode.ConfigurationTarget.Global);
      AIProviderManager.getInstance().refresh();
      vscode.window.showInformationMessage(
        "AI provider switched to Anthropic."
      );
    }
  } catch (error) {
    logger.error("Failed to save Anthropic API key:", error);
    vscode.window.showErrorMessage(
      `Failed to save API key: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Command: Set Google AI API Key
 */
export async function setGoogleKeyCommand(
  context: vscode.ExtensionContext
): Promise<void> {
  const apiKey = await vscode.window.showInputBox({
    title: "Set Google AI API Key (Beta)",
    prompt: "Enter your Google AI (Gemini) API key",
    password: true,
    placeHolder: "AIza...",
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return "API key cannot be empty";
      }
      return null;
    },
  });

  if (!apiKey) {
    return; // User cancelled
  }

  try {
    await GoogleProvider.setApiKey(context, apiKey.trim());
    vscode.window.showInformationMessage(
      "Google AI API key saved securely. You can now use Google AI as your AI provider."
    );

    // Prompt to switch provider
    const switchProvider = await vscode.window.showInformationMessage(
      "Would you like to switch to Google AI as your AI provider?",
      "Yes",
      "No"
    );

    if (switchProvider === "Yes") {
      await vscode.workspace
        .getConfiguration("devBuddy")
        .update("ai.provider", "google", vscode.ConfigurationTarget.Global);
      AIProviderManager.getInstance().refresh();
      vscode.window.showInformationMessage(
        "AI provider switched to Google AI."
      );
    }
  } catch (error) {
    logger.error("Failed to save Google AI API key:", error);
    vscode.window.showErrorMessage(
      `Failed to save API key: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Command: Remove AI API Key
 */
export async function removeApiKeyCommand(
  context: vscode.ExtensionContext
): Promise<void> {
  const providers: Array<{ label: string; description: string; provider: AIProviderType }> = [
    {
      label: "OpenAI",
      description: "Remove OpenAI API key",
      provider: "openai",
    },
    {
      label: "Anthropic",
      description: "Remove Anthropic API key",
      provider: "anthropic",
    },
    {
      label: "Google AI",
      description: "Remove Google AI API key",
      provider: "google",
    },
  ];

  const selected = await vscode.window.showQuickPick(providers, {
    title: "Remove AI API Key",
    placeHolder: "Select the API key to remove",
  });

  if (!selected) {
    return; // User cancelled
  }

  const confirm = await vscode.window.showWarningMessage(
    `Are you sure you want to remove the ${selected.label} API key?`,
    { modal: true },
    "Remove"
  );

  if (confirm !== "Remove") {
    return;
  }

  try {
    switch (selected.provider) {
      case "openai":
        await OpenAIProvider.removeApiKey(context);
        break;
      case "anthropic":
        await AnthropicProvider.removeApiKey(context);
        break;
      case "google":
        await GoogleProvider.removeApiKey(context);
        break;
    }

    vscode.window.showInformationMessage(
      `${selected.label} API key removed successfully.`
    );

    // Check if current provider is the one we just removed
    const config = vscode.workspace.getConfiguration("devBuddy");
    const currentProvider = config.get<string>("ai.provider");

    if (currentProvider === selected.provider) {
      const switchProvider = await vscode.window.showWarningMessage(
        "Your current AI provider's key was removed. Switch to Copilot?",
        "Yes",
        "No"
      );

      if (switchProvider === "Yes") {
        await config.update(
          "ai.provider",
          "copilot",
          vscode.ConfigurationTarget.Global
        );
        AIProviderManager.getInstance().refresh();
        vscode.window.showInformationMessage(
          "AI provider switched to Copilot."
        );
      }
    }
  } catch (error) {
    logger.error(`Failed to remove ${selected.label} API key:`, error);
    vscode.window.showErrorMessage(
      `Failed to remove API key: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Command: Show AI Provider Status
 */
export async function showProviderStatusCommand(): Promise<void> {
  const manager = AIProviderManager.getInstance();
  const statuses = await manager.getAllProviderStatuses();
  const currentProvider = manager.getProviderType();
  const aiDisabled = manager.isAIDisabled();

  const items: vscode.QuickPickItem[] = [];

  if (aiDisabled) {
    items.push({
      label: "$(warning) AI Features Disabled",
      description: "Using rule-based summarization",
      detail: "Enable AI in settings: devBuddy.ai.disabled = false",
    });
  }

  for (const status of statuses) {
    const isCurrent = status.provider === currentProvider;
    const icon = status.isAvailable
      ? "$(check)"
      : status.isConfigured
        ? "$(warning)"
        : "$(circle-slash)";
    const currentMarker = isCurrent ? " $(star-full)" : "";
    
    // Add Beta label for BYOT providers
    const betaLabel = status.provider !== "copilot" ? " (Beta)" : "";

    let description = status.model;
    if (status.provider === "copilot") {
      description += " (VS Code LM API)";
    }
    if (isCurrent) {
      description += " - Current";
    }

    let detail = "";
    if (status.provider === "copilot") {
      detail = status.isAvailable
        ? "GitHub Copilot is active"
        : "GitHub Copilot not available - check subscription";
    } else {
      detail = status.isConfigured
        ? "API key configured (Beta feature)"
        : `API key not configured - Run 'DevBuddy: Set ${status.provider.charAt(0).toUpperCase() + status.provider.slice(1)} API Key'`;
    }

    items.push({
      label: `${icon} ${status.provider.charAt(0).toUpperCase() + status.provider.slice(1)}${betaLabel}${currentMarker}`,
      description,
      detail,
    });
  }

  // Add action items
  items.push({ label: "", kind: vscode.QuickPickItemKind.Separator });
  items.push({
    label: "$(gear) Change AI Provider",
    description: "Open settings to change provider",
  });
  items.push({
    label: "$(key) Manage API Keys",
    description: "Add or remove API keys",
  });

  const selected = await vscode.window.showQuickPick(items, {
    title: "AI Provider Status",
    placeHolder: "View provider status or take action",
  });

  if (selected?.label.includes("Change AI Provider")) {
    vscode.commands.executeCommand(
      "workbench.action.openSettings",
      "devBuddy.ai.provider"
    );
  } else if (selected?.label.includes("Manage API Keys")) {
    const action = await vscode.window.showQuickPick(
      [
        { label: "$(add) Set OpenAI API Key", command: "devBuddy.ai.setOpenAIKey" },
        { label: "$(add) Set Anthropic API Key", command: "devBuddy.ai.setAnthropicKey" },
        { label: "$(add) Set Google AI API Key", command: "devBuddy.ai.setGoogleKey" },
        { label: "$(trash) Remove API Key", command: "devBuddy.ai.removeApiKey" },
      ],
      { placeHolder: "Select action" }
    );

    if (action) {
      vscode.commands.executeCommand(action.command);
    }
  }
}

