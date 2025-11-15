import * as vscode from "vscode";

/**
 * Parse Linear organization from a Linear URL
 * Supports formats like:
 * - https://linear.app/org/...
 * - linear.app/org/...
 */
function parseLinearOrg(url: string): string | null {
  try {
    // Remove protocol and www if present
    const cleaned = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    
    // Check if it's a linear.app URL
    if (!cleaned.startsWith("linear.app/")) {
      return null;
    }
    
    // Extract organization (first path segment after domain)
    const match = cleaned.match(/^linear\.app\/([^/]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

export async function showFirstTimeSetup(onTokenSet?: () => void): Promise<void> {
  const config = vscode.workspace.getConfiguration("devBuddy");
  const setupComplete = config.get<boolean>("firstTimeSetupComplete", false);

  if (setupComplete) {
    return; // Already set up
  }

  // Welcome message - Platform-aware
  const setupChoice = await vscode.window.showInformationMessage(
    "👋 Welcome to DevBuddy! Choose your platform to get started.",
    "Setup Linear",
    "Setup Jira",
    "Skip for now"
  );

  if (setupChoice === "Skip for now" || !setupChoice) {
    return;
  }

  if (setupChoice === "Setup Jira") {
    // Redirect to Jira setup
    await vscode.commands.executeCommand("devBuddy.jira.setup");
    return;
  }

  // Continue with Linear setup if "Setup Linear" was chosen
  // 1. Linear Organization Setup
  const linearUrl = await vscode.window.showInputBox({
    prompt: "Enter any URL from your Linear workspace (e.g., a ticket or project URL)",
    placeHolder: "https://linear.app/yourorg/issue/...",
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value) {
        return "Please enter a URL from your Linear workspace";
      }
      const org = parseLinearOrg(value);
      if (!org) {
        return "Please enter a valid Linear URL (e.g., https://linear.app/yourorg/...)";
      }
      return null;
    },
  });

  if (linearUrl) {
    const org = parseLinearOrg(linearUrl);
    if (org) {
      // Store the organization for later use
      await config.update(
        "linearOrganization",
        org,
        vscode.ConfigurationTarget.Global
      );

      // Provide direct link to API key settings
      const apiKeyUrl = `https://linear.app/${org}/settings/account/security`;
      const openSettings = await vscode.window.showInformationMessage(
        `Great! Now you need to get your Linear API key.`,
        "Open API Key Settings",
        "I already have my key"
      );

      if (openSettings === "Open API Key Settings") {
        await vscode.env.openExternal(vscode.Uri.parse(apiKeyUrl));
        await vscode.window.showInformationMessage(
          "Copy your Personal API Key from the security settings page, then click Continue",
          "Continue"
        );
      }

      // Ask for API token
      const token = await vscode.window.showInputBox({
        prompt: "Enter your Linear Personal API Key",
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
        // Import LinearClient to store the token
        const { LinearClient } = await import("./linearClient");
        await LinearClient.setApiToken(token);
        
        vscode.window.showInformationMessage(
          "✅ Linear API token configured securely!"
        );

        // Trigger refresh callback if provided
        if (onTokenSet) {
          onTokenSet();
        }
      }
    }
  }

  // 2. Writing Tone
  const tone = await vscode.window.showQuickPick(
    [
      {
        label: "Professional",
        description: "Clear, informative, suitable for most teams",
        value: "professional",
      },
      {
        label: "Casual",
        description: "Friendly, conversational, relaxed",
        value: "casual",
      },
      {
        label: "Technical",
        description: "Precise, detailed, implementation-focused",
        value: "technical",
      },
      {
        label: "Concise",
        description: "Brief, to-the-point, minimal words",
        value: "concise",
      },
    ],
    {
      placeHolder: "Choose your preferred writing tone for AI summaries",
    }
  );

  if (tone) {
    await config.update(
      "writingTone",
      tone.value,
      vscode.ConfigurationTarget.Global
    );
  }

  // 3. AI Model
  const modelChoice = await vscode.window.showQuickPick(
    [
      {
        label: "Auto (Recommended)",
        description: "Automatically select the best available model",
        value: "auto",
      },
      {
        label: "GPT-4o",
        description: "OpenAI's latest, most capable",
        value: "copilot:gpt-4o",
      },
      {
        label: "GPT-4.1",
        description: "OpenAI's proven model, reliable",
        value: "copilot:gpt-4.1",
      },
      {
        label: "GPT-4 Turbo",
        description: "Fast and powerful, great balance",
        value: "copilot:gpt-4-turbo",
      },
      {
        label: "GPT-4",
        description: "Classic GPT-4, reliable quality",
        value: "copilot:gpt-4",
      },
      {
        label: "GPT-4o Mini",
        description: "Faster, efficient for quick tasks",
        value: "copilot:gpt-4o-mini",
      },
      {
        label: "GPT-3.5 Turbo",
        description: "Fast and cost-effective",
        value: "copilot:gpt-3.5-turbo",
      },
      {
        label: "Gemini 2.0 Flash",
        description: "Google's fast multimodal model",
        value: "copilot:gemini-2.0-flash",
      },
    ],
    {
      placeHolder: "Choose AI model (Auto recommended)",
    }
  );

  if (modelChoice) {
    // Set new setting
    await config.update(
      "ai.model",
      modelChoice.value,
      vscode.ConfigurationTarget.Global
    );
    
    // Also update legacy setting for backward compatibility (if not auto)
    if (modelChoice.value !== "auto") {
      const legacyValue = modelChoice.value.replace(/^copilot:/, "");
      await config.update(
        "aiModel",
        legacyValue,
        vscode.ConfigurationTarget.Global
      );
    }
  }

  // 4. Package paths (if custom monorepo structure)
  const customPaths = await vscode.window.showQuickPick(
    ["Yes, customize", "No, use defaults (packages/, apps/)"],
    {
      placeHolder: "Does your monorepo use custom directory names?",
    }
  );

  if (customPaths === "Yes, customize") {
    const paths = await vscode.window.showInputBox({
      prompt: "Enter comma-separated package paths",
      value: "packages/, apps/",
      placeHolder: "e.g., packages/, apps/, libs/, services/",
    });

    if (paths) {
      const pathArray = paths
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
      await config.update(
        "packagesPaths",
        pathArray,
        vscode.ConfigurationTarget.Global
      );
    }
  }

  // 5. Base branch
  const baseBranch = await vscode.window.showInputBox({
    prompt: "What's your main/base branch name?",
    value: "main",
    placeHolder: "main, master, or develop",
  });

  if (baseBranch) {
    await config.update(
      "baseBranch",
      baseBranch,
      vscode.ConfigurationTarget.Global
    );
  }

  // 6. Desktop app preference
  const desktopAppChoice = await vscode.window.showQuickPick(
    [
      {
        label: "Open in Web Browser",
        description: "Opens Linear issues in your default web browser (recommended)",
        value: false,
      },
      {
        label: "Open in Desktop App",
        description: "Opens Linear issues in the Linear desktop app (if installed)",
        value: true,
      },
    ],
    {
      placeHolder: "How would you like to open Linear issues?",
    }
  );

  if (desktopAppChoice !== undefined) {
    await config.update(
      "preferDesktopApp",
      desktopAppChoice.value,
      vscode.ConfigurationTarget.Global
    );
  }

  // 7. Link Format Preference
  const linkFormatChoice = await vscode.window.showQuickPick(
    [
      {
        label: "Slack",
        description: "Format: <url|TICKET-123> - for Slack messages",
        value: "slack",
      },
      {
        label: "Teams / Markdown",
        description: "Format: [TICKET-123](url) - for Teams, GitHub, Discord, etc.",
        value: "markdown",
      },
      {
        label: "Plain Text",
        description: "Just the ticket ID (TICKET-123)",
        value: "plain",
      },
    ],
    {
      placeHolder: "How do you share ticket links? (for standup updates & copying)",
    }
  );

  if (linkFormatChoice) {
    await config.update(
      "linkFormat",
      linkFormatChoice.value,
      vscode.ConfigurationTarget.Global
    );
  }

  // Mark setup as complete
  await config.update(
    "firstTimeSetupComplete",
    true,
    vscode.ConfigurationTarget.Global
  );

  // Show summary and offer walkthrough
  const action = await vscode.window.showInformationMessage(
    "✅ Setup Complete! Would you like a quick tour of Linear Buddy's features?",
    "Yes, show me around",
    "Maybe later"
  );

  if (action === "Yes, show me around") {
    await vscode.commands.executeCommand(
      "workbench.action.openWalkthrough",
      "angelogirardi.dev-buddy#devBuddy.gettingStarted",
      false
    );
  }
}

