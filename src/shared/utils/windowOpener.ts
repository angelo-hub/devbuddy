import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";
import { detectFork, getCliCommand, isRemoteEnvironment, getForkDisplayName } from "./forkDetector";
import { getLogger } from "./logger";

const execAsync = promisify(exec);
const logger = getLogger();

/**
 * Options for opening a folder
 */
export interface OpenFolderOptions {
  /** Path to the folder to open */
  folderPath: string;
  /** Open in a new window (default: true) */
  newWindow?: boolean;
  /** Optional file to open after workspace loads (format: "file:line:column") */
  gotoFile?: string;
  /** Whether to reuse an existing window if one is already open for this folder */
  reuseWindow?: boolean;
  /** Show notification on success */
  showNotification?: boolean;
}

/**
 * Result of opening a folder
 */
export interface OpenFolderResult {
  success: boolean;
  method: "cli" | "vscode-api" | "none";
  error?: string;
}

/**
 * Check if a folder path exists and is a directory
 */
async function validateFolderPath(folderPath: string): Promise<boolean> {
  try {
    const resolvedPath = path.resolve(folderPath);
    const stats = await fs.promises.stat(resolvedPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Build CLI command arguments
 */
function buildCliArgs(options: OpenFolderOptions): string[] {
  const args: string[] = [];
  const resolvedPath = path.resolve(options.folderPath);

  // Add the folder path (quoted for spaces)
  args.push(`"${resolvedPath}"`);

  // New window flag
  if (options.newWindow !== false) {
    args.push("--new-window");
  } else if (options.reuseWindow) {
    args.push("--reuse-window");
  }

  // Go to specific file
  if (options.gotoFile) {
    args.push("--goto", `"${options.gotoFile}"`);
  }

  return args;
}

/**
 * Try to open folder using CLI command
 */
async function openWithCli(options: OpenFolderOptions): Promise<OpenFolderResult> {
  const cliCommand = getCliCommand();
  const args = buildCliArgs(options);
  const fullCommand = `${cliCommand} ${args.join(" ")}`;

  logger.debug(`Attempting to open folder with CLI: ${fullCommand}`);

  try {
    await execAsync(fullCommand);
    logger.info(`Successfully opened folder with ${cliCommand}: ${options.folderPath}`);
    return { success: true, method: "cli" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`CLI command failed: ${errorMessage}`);
    return { success: false, method: "cli", error: errorMessage };
  }
}

/**
 * Try to open folder using VS Code API
 */
async function openWithVSCodeApi(options: OpenFolderOptions): Promise<OpenFolderResult> {
  const resolvedPath = path.resolve(options.folderPath);
  const folderUri = vscode.Uri.file(resolvedPath);

  logger.debug(`Attempting to open folder with VS Code API: ${resolvedPath}`);

  try {
    // Use vscode.openFolder command
    const forceNewWindow = options.newWindow !== false;
    
    await vscode.commands.executeCommand(
      "vscode.openFolder",
      folderUri,
      { forceNewWindow }
    );

    logger.info(`Successfully opened folder with VS Code API: ${options.folderPath}`);
    return { success: true, method: "vscode-api" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`VS Code API failed: ${errorMessage}`);
    return { success: false, method: "vscode-api", error: errorMessage };
  }
}

/**
 * Open a folder in a new window
 * 
 * Tries CLI first (for proper fork detection), then falls back to VS Code API
 */
export async function openInNewWindow(options: OpenFolderOptions): Promise<OpenFolderResult> {
  // Validate folder exists
  const isValid = await validateFolderPath(options.folderPath);
  if (!isValid) {
    const error = `Folder does not exist: ${options.folderPath}`;
    logger.error(error);
    return { success: false, method: "none", error };
  }

  const forkInfo = detectFork();
  logger.info(`Opening folder in ${getForkDisplayName()}: ${options.folderPath}`);

  // In remote environments, CLI might not work - use VS Code API directly
  if (isRemoteEnvironment()) {
    logger.debug("Remote environment detected, using VS Code API");
    const result = await openWithVSCodeApi(options);
    
    if (result.success && options.showNotification) {
      vscode.window.showInformationMessage(`Opened ${path.basename(options.folderPath)} in new window`);
    }
    
    return result;
  }

  // Try CLI first
  const cliResult = await openWithCli(options);
  if (cliResult.success) {
    if (options.showNotification) {
      vscode.window.showInformationMessage(`Opened ${path.basename(options.folderPath)} in new window`);
    }
    return cliResult;
  }

  // Fall back to VS Code API
  logger.debug("CLI failed, falling back to VS Code API");
  const apiResult = await openWithVSCodeApi(options);
  
  if (apiResult.success && options.showNotification) {
    vscode.window.showInformationMessage(`Opened ${path.basename(options.folderPath)} in new window`);
  }
  
  return apiResult;
}

/**
 * Open a folder and optionally checkout a branch
 * 
 * This is a convenience function for the "Open in Workspace" flow
 */
export async function openRepositoryWindow(
  folderPath: string,
  options?: {
    branchName?: string;
    ticketId?: string;
    showNotification?: boolean;
  }
): Promise<OpenFolderResult> {
  const result = await openInNewWindow({
    folderPath,
    newWindow: true,
    showNotification: options?.showNotification ?? true,
  });

  if (!result.success) {
    vscode.window.showErrorMessage(
      `Failed to open repository: ${result.error || "Unknown error"}`
    );
    return result;
  }

  // Note: Branch checkout in the new window would need to be handled
  // by the extension in that window via URI handler or global state
  // For now, we just open the window

  if (options?.branchName && options?.ticketId) {
    // Store intent in global state so the new window can pick it up
    // This would be read by the extension when it activates in the new window
    logger.info(
      `Repository opened. Branch checkout for ${options.branchName} should be handled in the new window.`
    );
  }

  return result;
}

/**
 * Check if the CLI command for the current fork is available
 */
export async function isCliAvailable(): Promise<boolean> {
  const cliCommand = getCliCommand();
  
  try {
    // Try to get version - this should work if CLI is installed
    await execAsync(`${cliCommand} --version`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get instructions for installing the CLI for the current fork
 */
export function getCliInstallInstructions(): string {
  const forkInfo = detectFork();
  
  switch (forkInfo.fork) {
    case "vscode":
      return 'Install the "code" command: Open VS Code, press Cmd/Ctrl+Shift+P, type "Shell Command: Install \'code\' command in PATH"';
    case "cursor":
      return 'Install the "cursor" command: Open Cursor, press Cmd/Ctrl+Shift+P, type "Shell Command: Install \'cursor\' command in PATH"';
    case "vscodium":
      return 'Install the "codium" command: Open VSCodium, press Cmd/Ctrl+Shift+P, type "Shell Command: Install \'codium\' command in PATH"';
    case "windsurf":
      return 'Install the "windsurf" command: Open Windsurf settings and enable CLI integration';
    default:
      return 'Install the CLI command for your editor to enable opening folders in new windows';
  }
}

