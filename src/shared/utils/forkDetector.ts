import * as vscode from "vscode";
import { getLogger } from "./logger";

const logger = getLogger();

/**
 * Supported IDE forks
 */
export type IDEFork = "vscode" | "cursor" | "vscodium" | "windsurf" | "positron" | "unknown";

/**
 * Information about the detected IDE fork
 */
export interface ForkInfo {
  fork: IDEFork;
  appName: string;
  appHost: string;
  cliCommand: string;
  isRemote: boolean;
  version: string;
}

/**
 * Mapping of app names to IDE forks
 */
const APP_NAME_MAP: Record<string, IDEFork> = {
  "Visual Studio Code": "vscode",
  "Visual Studio Code - Insiders": "vscode",
  "Code - OSS": "vscode",
  "Cursor": "cursor",
  "VSCodium": "vscodium",
  "Windsurf": "windsurf",
  "Positron": "positron",
};

/**
 * CLI commands for each fork
 */
const CLI_COMMANDS: Record<IDEFork, string> = {
  vscode: "code",
  cursor: "cursor",
  vscodium: "codium",
  windsurf: "windsurf",
  positron: "positron",
  unknown: "code", // fallback to code
};

/**
 * Cached fork info to avoid repeated detection
 */
let cachedForkInfo: ForkInfo | null = null;

/**
 * Detect which VS Code fork is currently running
 * Uses vscode.env.appName and appHost to determine the fork
 */
export function detectFork(): ForkInfo {
  // Return cached result if available
  if (cachedForkInfo) {
    return cachedForkInfo;
  }

  const appName = vscode.env.appName;
  const appHost = vscode.env.appHost;
  const isRemote = vscode.env.remoteName !== undefined;
  const version = vscode.version;

  // Detect fork from app name
  let fork: IDEFork = "unknown";
  
  // Check exact match first
  if (APP_NAME_MAP[appName]) {
    fork = APP_NAME_MAP[appName];
  } else {
    // Check partial matches for edge cases
    const lowerAppName = appName.toLowerCase();
    if (lowerAppName.includes("cursor")) {
      fork = "cursor";
    } else if (lowerAppName.includes("codium")) {
      fork = "vscodium";
    } else if (lowerAppName.includes("windsurf")) {
      fork = "windsurf";
    } else if (lowerAppName.includes("positron")) {
      fork = "positron";
    } else if (lowerAppName.includes("code") || lowerAppName.includes("visual studio")) {
      fork = "vscode";
    }
  }

  const cliCommand = CLI_COMMANDS[fork];

  cachedForkInfo = {
    fork,
    appName,
    appHost,
    cliCommand,
    isRemote,
    version,
  };

  logger.debug(`Detected IDE fork: ${fork} (appName: ${appName}, CLI: ${cliCommand})`);

  return cachedForkInfo;
}

/**
 * Get the CLI command for the current IDE fork
 */
export function getCliCommand(): string {
  return detectFork().cliCommand;
}

/**
 * Check if we're running in a specific fork
 */
export function isRunningIn(fork: IDEFork): boolean {
  return detectFork().fork === fork;
}

/**
 * Check if we're running in a remote environment (SSH, WSL, containers)
 */
export function isRemoteEnvironment(): boolean {
  return detectFork().isRemote;
}

/**
 * Get display name for the current fork
 */
export function getForkDisplayName(): string {
  const forkInfo = detectFork();
  
  switch (forkInfo.fork) {
    case "vscode":
      return "VS Code";
    case "cursor":
      return "Cursor";
    case "vscodium":
      return "VSCodium";
    case "windsurf":
      return "Windsurf";
    case "positron":
      return "Positron";
    default:
      return forkInfo.appName || "Unknown IDE";
  }
}

/**
 * Clear the cached fork info (useful for testing)
 */
export function clearForkCache(): void {
  cachedForkInfo = null;
}

