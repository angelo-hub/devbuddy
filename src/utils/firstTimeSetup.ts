import * as vscode from "vscode";

export async function showFirstTimeSetup(): Promise<void> {
  const config = vscode.workspace.getConfiguration("monorepoTools");
  const setupComplete = config.get<boolean>("firstTimeSetupComplete", false);

  if (setupComplete) {
    return; // Already set up
  }

  // Welcome message
  const setupChoice = await vscode.window.showInformationMessage(
    "👋 Welcome to Cursor Monorepo Tools! Would you like to configure your preferences?",
    "Yes, configure",
    "Skip for now"
  );

  if (setupChoice !== "Yes, configure") {
    return;
  }

  // 1. Writing Tone
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

  // 2. AI Model (verified working models only)
  const modelChoice = await vscode.window.showQuickPick(
    [
      {
        label: "GPT-4o",
        description: "OpenAI's latest, most capable (recommended)",
        value: "gpt-4o",
      },
      {
        label: "GPT-4.1",
        description: "OpenAI's proven model, reliable",
        value: "gpt-4.1",
      },
      {
        label: "GPT-4 Turbo",
        description: "Fast and powerful, great balance",
        value: "gpt-4-turbo",
      },
      {
        label: "GPT-4",
        description: "Classic GPT-4, reliable quality",
        value: "gpt-4",
      },
      {
        label: "GPT-4o Mini",
        description: "Faster, efficient for quick tasks",
        value: "gpt-4o-mini",
      },
      {
        label: "GPT-3.5 Turbo",
        description: "Fast and cost-effective",
        value: "gpt-3.5-turbo",
      },
      {
        label: "Gemini 2.0 Flash",
        description: "Google's fast multimodal model",
        value: "gemini-2.0-flash",
      },
    ],
    {
      placeHolder: "Choose AI model (GPT-4o recommended)",
    }
  );

  if (modelChoice) {
    await config.update(
      "aiModel",
      modelChoice.value,
      vscode.ConfigurationTarget.Global
    );
  }

  // 3. Package paths (if custom monorepo structure)
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

  // 4. Base branch
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

  // Mark setup as complete
  await config.update(
    "firstTimeSetupComplete",
    true,
    vscode.ConfigurationTarget.Global
  );

  // Show summary
  const summary = `
✅ Setup Complete!

Writing Tone: ${tone?.label || "Professional"}
AI Model: ${modelChoice?.label || "GPT-4"}
Package Paths: ${config.get("packagesPaths", ["packages/", "apps/"]).join(", ")}
Base Branch: ${baseBranch || "main"}

You can change these anytime in Settings (Cmd+,) → search "monorepo"
`.trim();

  vscode.window.showInformationMessage(summary, "Got it!");
}

