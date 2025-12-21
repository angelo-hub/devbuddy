/**
 * Types for Jira Create Ticket Store
 */

// ============================================================================
// Data Types
// ============================================================================

export interface JiraProject {
  key: string;
  name: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  subtask: boolean;
}

export interface JiraPriority {
  id: string;
  name: string;
}

export interface JiraUser {
  accountId: string;
  displayName: string;
}

export interface DraftData {
  title?: string;
  description?: string;
  priority?: string;
  labels?: string[];
  projectKey?: string;
}

export interface CreateIssueInput {
  projectKey: string;
  summary: string;
  description: string;
  issueTypeId: string;
  priorityId?: string;
  assigneeId?: string;
  labels?: string[];
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageFromExtension =
  | { command: "projectsLoaded"; projects: JiraProject[] }
  | {
      command: "projectMetaLoaded";
      issueTypes: JiraIssueType[];
      priorities: JiraPriority[];
    }
  | { command: "usersLoaded"; users: JiraUser[] }
  | { command: "populateDraft"; data: DraftData };

export type MessageFromWebview =
  | { command: "loadProjects" }
  | { command: "loadProjectMeta"; projectKey: string }
  | { command: "loadUsers" }
  | { command: "createIssue"; input: CreateIssueInput };

