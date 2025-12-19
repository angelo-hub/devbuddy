/**
 * Jira Client Factory
 * 
 * Creates the appropriate Jira client based on user configuration.
 * Supports both Jira Cloud and Jira Server/Data Center.
 */

import * as vscode from "vscode";
import { JiraCloudClient } from "../cloud/JiraCloudClient";
import { JiraServerClient } from "../server/JiraServerClient";
import { BaseJiraClient } from "./BaseJiraClient";
import { JiraIssue, JiraProject, JiraSprint, JiraBoard } from "./types";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

/**
 * Extended Jira Client interface with all methods used by the sidebar
 */
export interface IJiraClient extends BaseJiraClient {
  // Additional methods not in BaseJiraClient
  getRecentlyCompletedIssues(daysAgo?: number): Promise<JiraIssue[]>;
  getProjectUnassignedIssues(projectKey: string, maxResults?: number): Promise<JiraIssue[]>;
  getSprintIssues(sprintId: number): Promise<JiraIssue[]>;
  getMySprintIssues(sprintId: number): Promise<JiraIssue[]>;
  getSprintUnassignedIssues(sprintId: number): Promise<JiraIssue[]>;
}

/**
 * Get the configured Jira deployment type
 */
export function getJiraDeploymentType(): "cloud" | "server" {
  const config = vscode.workspace.getConfiguration("devBuddy");
  return config.get<"cloud" | "server">("jira.type", "cloud");
}

/**
 * Check if Jira is the active provider
 */
export function isJiraProvider(): boolean {
  const config = vscode.workspace.getConfiguration("devBuddy");
  return config.get<string>("provider", "linear") === "jira";
}

/**
 * Create the appropriate Jira client based on configuration
 */
export async function createJiraClient(): Promise<IJiraClient | null> {
  const deploymentType = getJiraDeploymentType();
  
  logger.debug(`Creating Jira client for deployment type: ${deploymentType}`);
  
  try {
    if (deploymentType === "server") {
      const client = await JiraServerClient.create();
      if (client.isConfigured()) {
        logger.info("Using Jira Server client");
        return client as unknown as IJiraClient;
      }
      logger.warn("Jira Server not configured");
      return null;
    } else {
      const client = await JiraCloudClient.create();
      if (client.isConfigured()) {
        logger.info("Using Jira Cloud client");
        return client as unknown as IJiraClient;
      }
      logger.warn("Jira Cloud not configured");
      return null;
    }
  } catch (error) {
    logger.error(`Failed to create Jira client (${deploymentType}):`, error);
    return null;
  }
}

/**
 * Reset the Jira client singleton (call when configuration changes)
 */
export function resetJiraClient(): void {
  const deploymentType = getJiraDeploymentType();
  
  if (deploymentType === "server") {
    JiraServerClient.reset();
  } else {
    JiraCloudClient.reset();
  }
  
  logger.debug(`Reset Jira client (${deploymentType})`);
}

