"use strict";
/**
 * E2E Test Runner Entry Point
 *
 * Handles VS Code download, extension installation, and test execution
 * using vscode-extension-tester.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const vscode_extension_tester_1 = require("vscode-extension-tester");
async function main() {
    // Determine test patterns based on command line args
    const args = process.argv.slice(2);
    let testPattern = "./out/test/e2e/suite/*.test.js";
    if (args.includes("--linear")) {
        testPattern = "./out/test/e2e/suite/linear/*.test.js";
    }
    else if (args.includes("--jira")) {
        testPattern = "./out/test/e2e/suite/jira/*.test.js";
    }
    // Configure the test runner
    const tester = new vscode_extension_tester_1.ExTester();
    try {
        // Download VS Code if not already present
        console.log("Setting up VS Code...");
        await tester.downloadCode(vscode_extension_tester_1.ReleaseQuality.Stable);
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
    }
    catch (error) {
        console.error("Test execution failed:", error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=runTests.js.map