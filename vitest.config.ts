import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Test file patterns
    include: ["test/unit/**/*.test.ts"],
    exclude: ["node_modules", "out", "webview-ui"],

    // Environment
    environment: "node",

    // Global test utilities
    globals: true,

    // Root directory
    root: ".",

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      reportsDirectory: "./coverage/unit",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/extension.ts", // Integration tested
        "src/activation/**", // Integration tested
        "src/test/**",
        "src/**/*.backup",
      ],
    },

    // Mock configuration
    deps: {
      // Inline vscode mock
      inline: [/vscode/],
    },

    // Timeout for tests
    testTimeout: 10000,

    // Setup files
    setupFiles: ["./test/unit/setup.ts"],
  },

  // Path aliases matching tsconfig.json
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@providers": path.resolve(__dirname, "./src/providers"),
      "@commands": path.resolve(__dirname, "./src/commands"),
      "@chat": path.resolve(__dirname, "./src/chat"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@views": path.resolve(__dirname, "./src/views"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@pro": path.resolve(__dirname, "./src/pro"),
      // Mock vscode module
      vscode: path.resolve(__dirname, "./test/unit/mocks/vscode.ts"),
    },
  },
});

