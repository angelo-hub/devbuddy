import * as vscode from "vscode";
import { BaseTicketProvider } from "@shared/base/BaseTicketProvider";
import { LinearClient } from "@providers/linear/LinearClient";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";
import { BaseJiraClient } from "@providers/jira/common/BaseJiraClient";

/**
 * Supported platform types
 */
export type PlatformType = "linear" | "jira" | "monday" | "clickup";

/**
 * Jira deployment types
 */
export type JiraDeploymentType = "cloud" | "server";

/**
 * Get the currently configured platform provider
 */
export function getCurrentPlatform(): PlatformType {
  const config = vscode.workspace.getConfiguration("devBuddy");
  return config.get<string>("provider", "linear") as PlatformType;
}

/**
 * Get Jira deployment type (Cloud or Server)
 */
export function getJiraDeploymentType(): JiraDeploymentType {
  const config = vscode.workspace.getConfiguration("devBuddy.jira");
  return config.get<string>("deploymentType", "cloud") as JiraDeploymentType;
}

/**
 * Get an instance of the platform client based on current configuration
 * Returns either LinearClient (BaseTicketProvider) or JiraClient (BaseJiraClient)
 */
export async function getPlatformClient(): Promise<BaseTicketProvider | BaseJiraClient> {
  const platform = getCurrentPlatform();

  switch (platform) {
    case "linear":
      return await LinearClient.create();
    
    case "jira": {
      const jiraType = getJiraDeploymentType();
      if (jiraType === "cloud") {
        return await JiraCloudClient.create();
      } else {
        // TODO: Implement Jira Server support in Phase 2B
        throw new Error("Jira Server support not yet implemented. Please select 'cloud' deployment type.");
      }
    }
    case "monday":
      // TODO: Implement Monday support in Phase 3
      throw new Error("Monday.com support not yet implemented");
    
    case "clickup":
      // TODO: Implement ClickUp support in Phase 4
      throw new Error("ClickUp support not yet implemented");
    
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Check if a specific platform is currently active
 */
export function isPlatformActive(platform: PlatformType): boolean {
  return getCurrentPlatform() === platform;
}

/**
 * Get display name for a platform
 */
export function getPlatformDisplayName(platform: PlatformType): string {
  switch (platform) {
    case "linear":
      return "Linear";
    case "jira":
      return "Jira";
    case "monday":
      return "Monday.com";
    case "clickup":
      return "ClickUp";
    default:
      return platform;
  }
}

/**
 * Check if a platform is configured and ready to use
 */
export async function isPlatformConfigured(platform?: PlatformType): Promise<boolean> {
  try {
    const targetPlatform = platform || getCurrentPlatform();
    
    // Get client for specific platform
    if (targetPlatform === "linear") {
      const client = await LinearClient.create();
      return client.isConfigured();
    } else if (targetPlatform === "jira") {
      const client = await JiraCloudClient.create();
      return client.isConfigured();
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

