/**
 * Types for Linear Create Ticket Store
 */

// ============================================================================
// Data Types
// ============================================================================

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearTemplate {
  id: string;
  name: string;
  description?: string;
  templateData: {
    title?: string;
    description?: string;
    priority?: number;
    labelIds?: string[];
    projectId?: string;
    stateId?: string;
  };
}

export interface LinearWorkflowState {
  id: string;
  name: string;
  type: string;
  position?: number;
}

export interface LinearLabel {
  id: string;
  name: string;
  color: string;
}

export interface LinearProject {
  id: string;
  name: string;
  url?: string;
  state: string;
}

export interface LinearUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface DraftData {
  title?: string;
  description?: string;
  priority?: string;
  labels?: string[];
  teamId?: string;
}

export interface CreateIssueInput {
  teamId: string;
  title: string;
  description?: string;
  priority?: number;
  assigneeId?: string;
  projectId?: string;
  labelIds?: string[];
  stateId?: string;
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageFromExtension =
  | { command: "teamsLoaded"; teams?: LinearTeam[] }
  | { command: "templatesLoaded"; templates?: LinearTemplate[] }
  | {
      command: "teamDataLoaded";
      workflowStates?: LinearWorkflowState[];
      labels?: LinearLabel[];
      projects?: LinearProject[];
    }
  | { command: "usersLoaded"; users?: LinearUser[] }
  | { command: "issueCreated"; issue?: unknown }
  | { command: "issueCreationFailed"; error?: string }
  | { command: "populateDraft"; data?: DraftData };

export type MessageFromWebview =
  | { command: "loadTeams" }
  | { command: "loadTemplates"; teamId?: string }
  | { command: "loadTeamData"; teamId?: string }
  | { command: "loadUsers"; teamId?: string }
  | { command: "createIssue"; input?: CreateIssueInput };

