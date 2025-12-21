/**
 * VS Code Integration Test Runner
 *
 * This script launches VS Code with the extension loaded and runs the integration tests.
 * It uses @vscode/test-electron to download and run a fresh VS Code instance.
 */

import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // The path to the extension test script
    const extensionTestsPath = path.resolve(__dirname, "./index");

    // Download VS Code, unzip it, and run the integration tests
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      // Use the insiders version for latest API compatibility
      // version: "insiders",
      launchArgs: [
        // Disable all other extensions to isolate our tests
        "--disable-extensions",
        // Don't show the welcome page
        "--skip-welcome",
        // Disable GPU acceleration (helps in CI)
        "--disable-gpu",
      ],
    });
  } catch (err) {
    console.error("Failed to run integration tests:", err);
    process.exit(1);
  }
}

main();

