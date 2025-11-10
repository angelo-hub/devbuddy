/**
 * Jira Common Types
 * 
 * Shared type definitions for both Jira Cloud and Jira Server/Data Center.
 * These types represent the normalized structure used internally by DevBuddy.
 */

/**
 * Jira Issue (normalized structure)
 */
export interface JiraIssue {
  id: string;
  key: string; // e.g., "PROJ-123"
  summary: string;
  description: string | null;
  issueType: JiraIssueType;
  status: JiraStatus;
  priority: JiraPriority;
  assignee: JiraUser | null;
  reporter: JiraUser;
  project: JiraProject;
  labels: string[];
  created: string;
  updated: string;
  dueDate: string | null;
  url: string;
  
  // Optional fields
  sprint?: JiraSprint | null;
  storyPoints?: number | null;
  epic?: JiraEpic | null;
  parentIssue?: JiraIssueReference | null;
  subtasks?: JiraIssueReference[];
  comments?: JiraComment[];
  attachments?: JiraAttachment[];
  customFields?: Record<string, any>;
}

/**
 * Jira Issue Type
 */
export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  subtask: boolean;
}

/**
 * Jira Status
 */
export interface JiraStatus {
  id: string;
  name: string;
  description?: string;
  statusCategory: JiraStatusCategory;
}

/**
 * Jira Status Category
 */
export interface JiraStatusCategory {
  id: number;
  key: string; // "new", "indeterminate", "done"
  colorName: string;
  name: string;
}

/**
 * Jira Priority
 */
export interface JiraPriority {
  id: string;
  name: string; // "Highest", "High", "Medium", "Low", "Lowest"
  iconUrl?: string;
}

/**
 * Jira User
 */
export interface JiraUser {
  accountId: string; // Cloud: account ID, Server: username
  displayName: string;
  emailAddress?: string;
  avatarUrl?: string;
  active: boolean;
  timeZone?: string;
}

/**
 * Jira Project
 */
export interface JiraProject {
  id: string;
  key: string; // e.g., "PROJ"
  name: string;
  description?: string;
  avatarUrl?: string;
  projectTypeKey: string; // "software", "business", etc.
  lead?: JiraUser;
}

/**
 * Jira Sprint (Agile/Scrum)
 */
export interface JiraSprint {
  id: number;
  name: string;
  state: "future" | "active" | "closed";
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
}

/**
 * Jira Epic
 */
export interface JiraEpic {
  id: string;
  key: string;
  summary: string;
  status: JiraStatus;
  color?: string;
}

/**
 * Jira Issue Reference (for parent/subtasks)
 */
export interface JiraIssueReference {
  id: string;
  key: string;
  summary: string;
  status: JiraStatus;
  issueType: JiraIssueType;
}

/**
 * Jira Comment
 */
export interface JiraComment {
  id: string;
  body: string;
  author: JiraUser;
  created: string;
  updated: string;
}

/**
 * Jira Attachment
 */
export interface JiraAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  created: string;
  author: JiraUser;
  content: string; // URL to download
  thumbnail?: string;
}

/**
 * Jira Transition (for status updates)
 */
export interface JiraTransition {
  id: string;
  name: string;
  to: JiraStatus;
  hasScreen: boolean;
}

/**
 * Jira Board (Agile)
 */
export interface JiraBoard {
  id: number;
  name: string;
  type: "scrum" | "kanban";
  location?: {
    projectId: string | number; // Jira API returns number but we accept both
    projectKey: string;
    projectName: string;
  };
}

/**
 * Input for creating a Jira issue
 */
export interface CreateJiraIssueInput {
  projectKey: string;
  summary: string;
  description?: string;
  issueTypeId: string;
  priorityId?: string;
  assigneeId?: string;
  labels?: string[];
  parentKey?: string; // For subtasks
  epicKey?: string;
  sprintId?: number;
  dueDate?: string;
  customFields?: Record<string, any>;
}

/**
 * Input for updating a Jira issue
 */
export interface UpdateJiraIssueInput {
  summary?: string;
  description?: string;
  priorityId?: string;
  assigneeId?: string;
  labels?: string[];
  sprintId?: number;
  dueDate?: string;
  customFields?: Record<string, any>;
}

/**
 * Jira Search/Filter Options
 */
export interface JiraSearchOptions {
  jql?: string; // Jira Query Language
  projectKeys?: string[];
  issueTypes?: string[];
  statuses?: string[];
  assigneeIds?: string[];
  labels?: string[];
  maxResults?: number;
  startAt?: number;
}

/**
 * Jira API Response (paginated)
 */
export interface JiraPaginatedResponse<T> {
  startAt: number;
  maxResults: number;
  total: number;
  issues?: T[];
  values?: T[]; // Some endpoints use 'values' instead of 'issues'
}

/**
 * Jira Configuration
 */
export interface JiraConfig {
  deploymentType: "cloud" | "server";
  
  // Cloud-specific
  cloudSiteUrl?: string; // e.g., "mycompany.atlassian.net"
  cloudEmail?: string;
  
  // Server-specific
  serverBaseUrl?: string; // e.g., "https://jira.company.com"
  serverAuthMethod?: "token" | "basic";
  
  // Common
  defaultProject?: string;
  defaultBoard?: number;
}

/**
 * Jira Authentication
 */
export interface JiraAuth {
  type: "cloud" | "server";
  token: string; // API token (Cloud) or Personal Access Token (Server)
  email?: string; // Required for Cloud
  username?: string; // Optional for Server Basic Auth
}

