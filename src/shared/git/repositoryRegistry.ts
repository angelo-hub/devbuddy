import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import simpleGit from "simple-git";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

/**
 * Information about a registered repository
 */
export interface RepositoryInfo {
  /** Unique identifier for the repository */
  id: string;
  /** Display name for the repository */
  name: string;
  /** Absolute path to the repository */
  path: string;
  /** Git remote URL (optional) */
  remote?: string;
  /** Ticket prefixes associated with this repository (e.g., ["FE", "FRONT"]) */
  ticketPrefixes: string[];
  /** Last time this repository was accessed */
  lastAccessed?: string;
  /** Whether this was auto-discovered */
  isAutoDiscovered?: boolean;
}

/**
 * Configuration for the repository registry
 */
export interface RepositoryRegistryConfig {
  /** Map of repository ID to repository info */
  repositories: Record<string, RepositoryInfo>;
  /** Whether to auto-discover repositories */
  autoDiscover: boolean;
  /** Parent directory for auto-discovery */
  parentDir?: string;
}

/**
 * Config file format for .devbuddy/repos.json
 */
interface ParentDirConfig {
  repositories: Record<string, {
    path: string;
    name?: string;
    ticketPrefixes?: string[];
    remote?: string;
  }>;
}

const CONFIG_FILE_NAME = "repos.json";
const CONFIG_DIR_NAME = ".devbuddy";
const STORAGE_KEY = "devBuddy.repositoryRegistry";

/**
 * Repository Registry - manages mappings between ticket prefixes and repositories
 * 
 * Storage hierarchy (higher priority overrides lower):
 * 1. Parent Directory Config (.devbuddy/repos.json)
 * 2. Global State (persisted across sessions)
 * 3. VS Code Settings (devBuddy.repositories)
 */
export class RepositoryRegistry {
  private context: vscode.ExtensionContext;
  private cachedConfig: RepositoryRegistryConfig | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Get the current workspace folder path
   */
  private getCurrentWorkspacePath(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  /**
   * Find parent directory config file
   */
  private async findParentDirConfig(): Promise<string | null> {
    const workspacePath = this.getCurrentWorkspacePath();
    if (!workspacePath) {
      return null;
    }

    // Search up to 3 levels up for .devbuddy/repos.json
    let currentDir = workspacePath;
    for (let i = 0; i < 4; i++) {
      const configPath = path.join(currentDir, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
      
      try {
        await fs.promises.access(configPath, fs.constants.R_OK);
        logger.debug(`Found parent directory config at: ${configPath}`);
        return configPath;
      } catch {
        // Not found, go up one level
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
          break; // Reached root
        }
        currentDir = parentDir;
      }
    }

    return null;
  }

  /**
   * Load config from parent directory file
   */
  private async loadParentDirConfig(configPath: string): Promise<Record<string, RepositoryInfo>> {
    try {
      const content = await fs.promises.readFile(configPath, "utf-8");
      const config: ParentDirConfig = JSON.parse(content);
      const baseDir = path.dirname(path.dirname(configPath)); // Go up from .devbuddy/repos.json
      
      const repositories: Record<string, RepositoryInfo> = {};
      
      for (const [id, repo] of Object.entries(config.repositories)) {
        // Resolve relative paths
        const repoPath = path.isAbsolute(repo.path) 
          ? repo.path 
          : path.resolve(baseDir, repo.path);
        
        repositories[id] = {
          id,
          name: repo.name || id,
          path: repoPath,
          remote: repo.remote,
          ticketPrefixes: repo.ticketPrefixes || [],
          isAutoDiscovered: false,
        };
      }
      
      return repositories;
    } catch (error) {
      logger.error(`Failed to load parent directory config: ${error}`);
      return {};
    }
  }

  /**
   * Load config from global state
   */
  private loadGlobalStateConfig(): Record<string, RepositoryInfo> {
    const stored = this.context.globalState.get<RepositoryRegistryConfig>(STORAGE_KEY);
    return stored?.repositories || {};
  }

  /**
   * Load config from VS Code settings
   */
  private loadSettingsConfig(): Record<string, RepositoryInfo> {
    const config = vscode.workspace.getConfiguration("devBuddy");
    const repositories = config.get<Record<string, Partial<RepositoryInfo>>>("repositories", {});
    
    const result: Record<string, RepositoryInfo> = {};
    
    for (const [id, repo] of Object.entries(repositories)) {
      if (repo.path) {
        result[id] = {
          id,
          name: repo.name || id,
          path: repo.path,
          remote: repo.remote,
          ticketPrefixes: repo.ticketPrefixes || [],
          isAutoDiscovered: false,
        };
      }
    }
    
    return result;
  }

  /**
   * Get merged configuration from all sources
   */
  async getConfig(): Promise<RepositoryRegistryConfig> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    const config = vscode.workspace.getConfiguration("devBuddy");
    const autoDiscover = config.get<boolean>("multiRepo.autoDiscover", true);
    const parentDir = config.get<string>("multiRepo.parentDir");

    // Load from all sources (lower priority first)
    const settingsRepos = this.loadSettingsConfig();
    const globalStateRepos = this.loadGlobalStateConfig();
    
    // Find and load parent directory config
    const parentConfigPath = await this.findParentDirConfig();
    const parentDirRepos = parentConfigPath 
      ? await this.loadParentDirConfig(parentConfigPath) 
      : {};

    // Merge (higher priority overrides lower)
    const repositories: Record<string, RepositoryInfo> = {
      ...settingsRepos,
      ...globalStateRepos,
      ...parentDirRepos,
    };

    this.cachedConfig = {
      repositories,
      autoDiscover,
      parentDir,
    };

    return this.cachedConfig;
  }

  /**
   * Clear cached config
   */
  clearCache(): void {
    this.cachedConfig = null;
  }

  /**
   * Get all registered repositories
   */
  async getAllRepositories(): Promise<RepositoryInfo[]> {
    const config = await this.getConfig();
    return Object.values(config.repositories);
  }

  /**
   * Get repository by ID
   */
  async getRepository(id: string): Promise<RepositoryInfo | undefined> {
    const config = await this.getConfig();
    return config.repositories[id];
  }

  /**
   * Get repository by ticket prefix
   */
  async getRepositoryByPrefix(prefix: string): Promise<RepositoryInfo | undefined> {
    const config = await this.getConfig();
    const upperPrefix = prefix.toUpperCase();
    
    for (const repo of Object.values(config.repositories)) {
      if (repo.ticketPrefixes.some(p => p.toUpperCase() === upperPrefix)) {
        return repo;
      }
    }
    
    return undefined;
  }

  /**
   * Get repository for a ticket ID
   */
  async getRepositoryForTicket(ticketId: string): Promise<RepositoryInfo | undefined> {
    // Extract prefix from ticket ID (e.g., "FE-123" -> "FE")
    const match = ticketId.match(/^([A-Z]+)-\d+$/i);
    if (!match) {
      return undefined;
    }
    
    const prefix = match[1];
    return this.getRepositoryByPrefix(prefix);
  }

  /**
   * Get repository by path
   */
  async getRepositoryByPath(repoPath: string): Promise<RepositoryInfo | undefined> {
    const config = await this.getConfig();
    const resolvedPath = path.resolve(repoPath);
    
    for (const repo of Object.values(config.repositories)) {
      if (path.resolve(repo.path) === resolvedPath) {
        return repo;
      }
    }
    
    return undefined;
  }

  /**
   * Get repository for current workspace
   */
  async getCurrentRepository(): Promise<RepositoryInfo | undefined> {
    const workspacePath = this.getCurrentWorkspacePath();
    if (!workspacePath) {
      return undefined;
    }
    
    return this.getRepositoryByPath(workspacePath);
  }

  /**
   * Register a new repository
   */
  async registerRepository(repo: Omit<RepositoryInfo, "lastAccessed">): Promise<void> {
    const config = await this.getConfig();
    
    const newRepo: RepositoryInfo = {
      ...repo,
      lastAccessed: new Date().toISOString(),
    };
    
    config.repositories[repo.id] = newRepo;
    
    // Save to global state
    await this.context.globalState.update(STORAGE_KEY, config);
    this.clearCache();
    
    logger.info(`Registered repository: ${repo.id} (${repo.path})`);
  }

  /**
   * Update repository info
   */
  async updateRepository(id: string, updates: Partial<RepositoryInfo>): Promise<void> {
    const config = await this.getConfig();
    
    if (!config.repositories[id]) {
      throw new Error(`Repository not found: ${id}`);
    }
    
    config.repositories[id] = {
      ...config.repositories[id],
      ...updates,
      lastAccessed: new Date().toISOString(),
    };
    
    await this.context.globalState.update(STORAGE_KEY, config);
    this.clearCache();
  }

  /**
   * Remove a repository from the registry
   */
  async removeRepository(id: string): Promise<void> {
    const config = await this.getConfig();
    
    if (config.repositories[id]) {
      delete config.repositories[id];
      await this.context.globalState.update(STORAGE_KEY, config);
      this.clearCache();
      logger.info(`Removed repository: ${id}`);
    }
  }

  /**
   * Check if a ticket is in a different repository than the current workspace
   */
  async isTicketInDifferentRepo(ticketId: string): Promise<{
    isDifferent: boolean;
    currentRepo?: RepositoryInfo;
    ticketRepo?: RepositoryInfo;
  }> {
    const currentRepo = await this.getCurrentRepository();
    const ticketRepo = await this.getRepositoryForTicket(ticketId);
    
    if (!currentRepo || !ticketRepo) {
      return { isDifferent: false, currentRepo, ticketRepo };
    }
    
    const isDifferent = path.resolve(currentRepo.path) !== path.resolve(ticketRepo.path);
    
    return { isDifferent, currentRepo, ticketRepo };
  }

  /**
   * Auto-discover repositories in a parent directory
   */
  async discoverRepositories(parentDir: string): Promise<RepositoryInfo[]> {
    const discovered: RepositoryInfo[] = [];
    const resolvedParentDir = path.resolve(parentDir);
    
    logger.info(`Discovering repositories in: ${resolvedParentDir}`);
    
    try {
      const entries = await fs.promises.readdir(resolvedParentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) {
          continue;
        }
        
        const repoPath = path.join(resolvedParentDir, entry.name);
        const gitDir = path.join(repoPath, ".git");
        
        try {
          await fs.promises.access(gitDir, fs.constants.R_OK);
          
          // It's a git repository
          const git = simpleGit(repoPath);
          
          // Get remote URL
          let remote: string | undefined;
          try {
            const remotes = await git.getRemotes(true);
            const origin = remotes.find(r => r.name === "origin");
            remote = origin?.refs?.fetch || origin?.refs?.push;
          } catch {
            // No remotes
          }
          
          // Extract ticket prefixes from branches
          const prefixes = await this.extractPrefixesFromBranches(git);
          
          const repo: RepositoryInfo = {
            id: entry.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            name: entry.name,
            path: repoPath,
            remote,
            ticketPrefixes: prefixes,
            isAutoDiscovered: true,
          };
          
          discovered.push(repo);
          logger.debug(`Discovered repository: ${repo.name} (prefixes: ${prefixes.join(", ") || "none"})`);
        } catch {
          // Not a git repository
        }
      }
    } catch (error) {
      logger.error(`Failed to discover repositories: ${error}`);
    }
    
    return discovered;
  }

  /**
   * Extract ticket prefixes from branch names
   */
  private async extractPrefixesFromBranches(git: ReturnType<typeof simpleGit>): Promise<string[]> {
    const prefixSet = new Set<string>();
    
    try {
      const branches = await git.branch();
      
      for (const branchName of branches.all) {
        // Skip remote branches
        if (branchName.startsWith("remotes/")) {
          continue;
        }
        
        // Extract prefix from branch name (e.g., "feat/FE-123-description" -> "FE")
        const match = branchName.match(/([A-Z]{2,})-\d+/i);
        if (match) {
          prefixSet.add(match[1].toUpperCase());
        }
      }
    } catch {
      // Ignore errors
    }
    
    return Array.from(prefixSet);
  }

  /**
   * Auto-discover and suggest repositories to register
   */
  async discoverAndSuggest(): Promise<{
    discovered: RepositoryInfo[];
    alreadyRegistered: string[];
  }> {
    const config = await this.getConfig();
    const parentDir = config.parentDir || this.getDefaultParentDir();
    
    if (!parentDir) {
      return { discovered: [], alreadyRegistered: [] };
    }
    
    const discovered = await this.discoverRepositories(parentDir);
    const alreadyRegistered: string[] = [];
    const newRepos: RepositoryInfo[] = [];
    
    for (const repo of discovered) {
      const existing = await this.getRepositoryByPath(repo.path);
      if (existing) {
        alreadyRegistered.push(existing.id);
      } else {
        newRepos.push(repo);
      }
    }
    
    return { discovered: newRepos, alreadyRegistered };
  }

  /**
   * Get default parent directory (parent of current workspace)
   */
  private getDefaultParentDir(): string | undefined {
    const workspacePath = this.getCurrentWorkspacePath();
    if (!workspacePath) {
      return undefined;
    }
    
    return path.dirname(workspacePath);
  }

  /**
   * Check if multi-repo support is enabled
   */
  isMultiRepoEnabled(): boolean {
    const config = vscode.workspace.getConfiguration("devBuddy");
    return config.get<boolean>("multiRepo.enabled", false);
  }

  /**
   * Create a parent directory config file
   */
  async createParentDirConfig(parentDir: string, repositories: Record<string, RepositoryInfo>): Promise<string> {
    const configDir = path.join(parentDir, CONFIG_DIR_NAME);
    const configPath = path.join(configDir, CONFIG_FILE_NAME);
    
    // Create .devbuddy directory
    await fs.promises.mkdir(configDir, { recursive: true });
    
    // Convert to relative paths
    const config: ParentDirConfig = {
      repositories: {},
    };
    
    for (const [id, repo] of Object.entries(repositories)) {
      const relativePath = path.relative(parentDir, repo.path);
      config.repositories[id] = {
        path: relativePath.startsWith("..") ? repo.path : `./${relativePath}`,
        name: repo.name,
        ticketPrefixes: repo.ticketPrefixes,
        remote: repo.remote,
      };
    }
    
    await fs.promises.writeFile(
      configPath,
      JSON.stringify(config, null, 2),
      "utf-8"
    );
    
    logger.info(`Created parent directory config at: ${configPath}`);
    this.clearCache();
    
    return configPath;
  }
}

// Singleton instance holder
let registryInstance: RepositoryRegistry | null = null;

/**
 * Get the repository registry instance
 */
export function getRepositoryRegistry(context?: vscode.ExtensionContext): RepositoryRegistry {
  if (!registryInstance && context) {
    registryInstance = new RepositoryRegistry(context);
  }
  
  if (!registryInstance) {
    throw new Error("RepositoryRegistry not initialized. Call with context first.");
  }
  
  return registryInstance;
}

/**
 * Initialize the repository registry
 */
export function initializeRepositoryRegistry(context: vscode.ExtensionContext): RepositoryRegistry {
  registryInstance = new RepositoryRegistry(context);
  return registryInstance;
}

