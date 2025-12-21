/**
 * Linear-specific type definitions
 */

export interface LinearIssue {
  id: string;
  identifier: string; // e.g., "ENG-123"
  title: string;
  description?: string;
  state: {
    id: string;
    name: string;
    type: string; // "backlog", "unstarted", "started", "completed", "canceled"
    position?: number;
    workflow?: {
      id: string;
      name?: string;
    };
  };
  creator?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  priority: number; // 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low
  url: string;
  createdAt: string;
  updatedAt: string;
  labels?: Array<{ id: string; name: string; color: string }>;
  project?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
  cycle?: {
    id: string;
    name: string;
    number: number;
    startsAt?: string;
    endsAt?: string;
  };
  attachments?: {
    nodes: Array<{
      id: string;
      url: string;
      title?: string;
      subtitle?: string;
      sourceType?: string; // "github", "gitlab", etc.
    }>;
  };
  children?: {
    nodes: Array<{
      id: string;
      identifier: string;
      title: string;
      url: string;
      state: {
        id: string;
        name: string;
        type: string;
      };
      assignee?: {
        id: string;
        name: string;
        avatarUrl?: string;
      };
      priority: number;
    }>;
  };
  parent?: {
    id: string;
    identifier: string;
    title: string;
    url: string;
  };
  comments?: {
    nodes: Array<{
      id: string;
      body: string;
      createdAt: string;
      user?: {
        id: string;
        name: string;
        avatarUrl?: string;
      };
    }>;
  };
  branchName?: string;
  gitBranchName?: string;
}

export interface LinearUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface LinearProject {
  id: string;
  name: string;
  url?: string;
  state: string;
}

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

/**
 * Represents an activity/history entry for a Linear issue
 * Used for tracking non-code work in standups
 */
export type LinearActivityType =
  | "status_change"
  | "description_update"
  | "comment_added"
  | "title_change"
  | "assignee_change"
  | "priority_change"
  | "label_change"
  | "estimate_change"
  | "attachment_added"
  | "other";

export interface LinearIssueActivity {
  id: string;
  issueId: string;
  issueIdentifier: string;
  issueTitle: string;
  issueUrl: string;
  activityType: LinearActivityType;
  description: string;
  timestamp: string; // ISO date string
  actor?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  // For status changes
  fromStatus?: string;
  toStatus?: string;
  // For field changes
  oldValue?: string;
  newValue?: string;
  // For comments
  commentBody?: string;
}

