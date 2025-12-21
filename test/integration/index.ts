/**
 * VS Code Integration Test Entry Point
 *
 * This file sets up Mocha and runs all integration tests.
 * It's called by the VS Code test runner after the extension host is ready.
 */

import * as path from "path";
import Mocha from "mocha";
import { glob } from "glob";

export async function run(): Promise<void> {
  // Create the Mocha test runner
  const mocha = new Mocha({
    ui: "bdd",
    color: true,
    timeout: 60000, // 60 second timeout for VS Code operations
    slow: 10000, // Mark tests as slow after 10 seconds
  });

  const testsRoot = path.resolve(__dirname, "./suite");

  // Find all test files
  const files = await glob("**/*.test.js", { cwd: testsRoot });

  // Add files to the test suite
  for (const file of files) {
    mocha.addFile(path.resolve(testsRoot, file));
  }

  // Run the tests
  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}

