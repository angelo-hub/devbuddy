"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const path_1 = __importDefault(require("path"));
exports.default = (0, config_1.defineConfig)({
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
            "@shared": path_1.default.resolve(__dirname, "./src/shared"),
            "@providers": path_1.default.resolve(__dirname, "./src/providers"),
            "@commands": path_1.default.resolve(__dirname, "./src/commands"),
            "@chat": path_1.default.resolve(__dirname, "./src/chat"),
            "@utils": path_1.default.resolve(__dirname, "./src/utils"),
            "@views": path_1.default.resolve(__dirname, "./src/views"),
            "@core": path_1.default.resolve(__dirname, "./src/core"),
            "@pro": path_1.default.resolve(__dirname, "./src/pro"),
            // Mock vscode module
            vscode: path_1.default.resolve(__dirname, "./test/unit/mocks/vscode.ts"),
        },
    },
});
//# sourceMappingURL=vitest.config.js.map