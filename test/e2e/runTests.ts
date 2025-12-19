/**
 * E2E Test Runner Entry Point
 *
 * Handles VS Code download, extension installation, and test execution
 * using vscode-extension-tester.
 */

import * as path from "path";
import { ExTester, ReleaseQuality } from "vscode-extension-tester";

async function main(): Promise<void> {
  // Determine test patterns based on command line args
  const args = process.argv.slice(2);
  let testPattern = "./out/test/e2e/suite/*.test.js";

  if (args.includes("--linear")) {
    testPattern = "./out/test/e2e/suite/linear/*.test.js";
  } else if (args.includes("--jira")) {
    testPattern = "./out/test/e2e/suite/jira/*.test.js";
  }

  // Configure the test runner
  const tester = new ExTester();

  try {
    // Download VS Code if not already present
    console.log("Setting up VS Code...");
    await tester.downloadCode(ReleaseQuality.Stable);

    // Download ChromeDriver
    console.log("Setting up ChromeDriver...");
    await tester.downloadChromeDriver();

    // Install the extension
    console.log("Installing extension...");
    const vsixPath = path.resolve(__dirname, "../../*.vsix");
    await tester.installVsix();

    // Run the tests
    console.log(`Running tests: ${testPattern}`);
    const exitCode = await tester.runTests(testPattern, {
      settings: path.resolve(__dirname, "../fixtures/settings.json"),
      resources: [
        path.resolve(__dirname, "../fixtures/workspaces/test-monorepo"),
      ],
    });

    process.exit(exitCode);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

main();
