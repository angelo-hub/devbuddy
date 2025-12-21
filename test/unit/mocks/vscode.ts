/**
 * VS Code API Mock for Unit Tests
 *
 * This module provides a mock implementation of the VS Code API
 * for use in Vitest unit tests. It allows testing code that depends
 * on VS Code without running in the Extension Development Host.
 */

// ============================================================================
// Mock Configuration Store
// ============================================================================

/**
 * In-memory configuration store for tests
 * Use `setMockConfig()` to set values before tests
 */
const mockConfigStore: Map<string, Map<string, unknown>> = new Map();

/**
 * Set a mock configuration value for testing
 *
 * @example
 * setMockConfig("devBuddy", "linkFormat", "slack");
 */
export function setMockConfig(
  section: string,
  key: string,
  value: unknown
): void {
  let sectionMap = mockConfigStore.get(section);
  if (!sectionMap) {
    sectionMap = new Map();
    mockConfigStore.set(section, sectionMap);
  }
  sectionMap.set(key, value);
}

/**
 * Clear all mock configuration values
 */
export function clearMockConfig(): void {
  mockConfigStore.clear();
}

/**
 * Reset mock config to defaults
 */
export function resetMockConfig(): void {
  clearMockConfig();
  // Set default values matching package.json defaults
  setMockConfig("devBuddy", "linkFormat", "markdown");
  setMockConfig("devBuddy", "provider", "linear");
  setMockConfig("devBuddy", "debugMode", false);
  setMockConfig("devBuddy", "ai.disabled", false);
}

// ============================================================================
// Mock WorkspaceConfiguration
// ============================================================================

function createMockWorkspaceConfiguration(section: string) {
  return {
    get: <T>(key: string, defaultValue?: T): T | undefined => {
      const sectionConfig = mockConfigStore.get(section);
      if (sectionConfig?.has(key)) {
        return sectionConfig.get(key) as T;
      }
      return defaultValue;
    },
    has: (key: string): boolean => {
      const sectionConfig = mockConfigStore.get(section);
      return sectionConfig?.has(key) ?? false;
    },
    inspect: () => undefined,
    update: () => Promise.resolve(),
  };
}

// ============================================================================
// Mock VS Code Namespace
// ============================================================================

export const workspace = {
  getConfiguration: (section?: string) => {
    return createMockWorkspaceConfiguration(section || "");
  },
  workspaceFolders: undefined as { uri: { fsPath: string } }[] | undefined,
  fs: {
    readFile: () => Promise.resolve(Buffer.from("")),
    writeFile: () => Promise.resolve(),
    stat: () => Promise.resolve({ type: 1, ctime: 0, mtime: 0, size: 0 }),
  },
  onDidChangeConfiguration: () => ({ dispose: () => {} }),
};

export const window = {
  showInformationMessage: () => Promise.resolve(undefined),
  showWarningMessage: () => Promise.resolve(undefined),
  showErrorMessage: () => Promise.resolve(undefined),
  showQuickPick: () => Promise.resolve(undefined),
  showInputBox: () => Promise.resolve(undefined),
  createOutputChannel: () => ({
    appendLine: () => {},
    append: () => {},
    clear: () => {},
    show: () => {},
    hide: () => {},
    dispose: () => {},
  }),
  createTreeView: () => ({
    reveal: () => {},
    dispose: () => {},
  }),
  activeTextEditor: undefined,
  visibleTextEditors: [],
  onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
};

export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
  executeCommand: () => Promise.resolve(),
  getCommands: () => Promise.resolve([]),
};

export const Uri = {
  file: (path: string) => ({
    fsPath: path,
    path,
    scheme: "file",
    toString: () => `file://${path}`,
  }),
  parse: (uri: string) => ({
    fsPath: uri.replace("file://", ""),
    path: uri.replace("file://", ""),
    scheme: "file",
    toString: () => uri,
  }),
  joinPath: (base: { fsPath: string }, ...pathSegments: string[]) => {
    const joined = [base.fsPath, ...pathSegments].join("/");
    return {
      fsPath: joined,
      path: joined,
      scheme: "file",
      toString: () => `file://${joined}`,
    };
  },
};

export class EventEmitter<T> {
  private listeners: ((e: T) => void)[] = [];
  event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return { dispose: () => {} };
  };
  fire = (e: T) => this.listeners.forEach((l) => l(e));
  dispose = () => { this.listeners = []; };
}

export class TreeItem {
  label: string;
  collapsibleState?: number;
  constructor(label: string, collapsibleState?: number) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

export class ThemeIcon {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export class ThemeColor {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export enum ExtensionMode {
  Production = 1,
  Development = 2,
  Test = 3,
}

export const extensions = {
  getExtension: () => undefined,
  all: [],
};

export const env = {
  machineId: "test-machine-id",
  sessionId: "test-session-id",
  language: "en",
  appName: "Visual Studio Code",
  appRoot: "/mock/app/root",
  uriScheme: "vscode",
  clipboard: {
    readText: () => Promise.resolve(""),
    writeText: () => Promise.resolve(),
  },
  openExternal: () => Promise.resolve(true),
};

// ============================================================================
// Mock TextDocument
// ============================================================================

export interface MockTextDocument {
  fileName: string;
  lineCount: number;
  languageId: string;
  uri: ReturnType<typeof Uri.file>;
  getText: () => string;
  lineAt: (line: number) => { text: string; lineNumber: number };
}

export function createMockTextDocument(
  content: string,
  fileName: string = "/mock/file.ts",
  languageId: string = "typescript"
): MockTextDocument {
  const lines = content.split("\n");
  return {
    fileName,
    lineCount: lines.length,
    languageId,
    uri: Uri.file(fileName),
    getText: () => content,
    lineAt: (line: number) => ({
      text: lines[line] || "",
      lineNumber: line,
    }),
  };
}

// ============================================================================
// Default Export (matches vscode module structure)
// ============================================================================

export default {
  workspace,
  window,
  commands,
  Uri,
  EventEmitter,
  TreeItem,
  TreeItemCollapsibleState,
  ThemeIcon,
  ThemeColor,
  ExtensionMode,
  extensions,
  env,
};

