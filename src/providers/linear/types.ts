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
  /** Relations where this issue is the source (e.g., "blocks", "related") */
  relations?: {
    nodes: Array<{
      id: string;
      type: LinearIssueRelationType;
      relatedIssue: {
        id: string;
        identifier: string;
        title: string;
        state: {
          name: string;
          type: string;
        };
      };
    }>;
  };
  /** Inverse relations where this issue is the target (e.g., "is blocked by") */
  inverseRelations?: {
    nodes: Array<{
      id: string;
      type: LinearIssueRelationType;
      relatedIssue: {
        id: string;
        identifier: string;
        title: string;
        state: {
          name: string;
          type: string;
        };
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
 * Issue relation types supported by Linear
 */
export type LinearIssueRelationType =
  | "blocks"      // This issue blocks another
  | "blocked_by"  // This issue is blocked by another (inverse of blocks)
  | "related"     // Issues are related
  | "duplicate"   // This issue is a duplicate of another
  | "duplicate_of"; // This issue has a duplicate (inverse of duplicate)

/**
 * Issue relation (link between two issues)
 */
export interface LinearIssueRelation {
  id: string;
  type: LinearIssueRelationType;
  issue: {
    id: string;
    identifier: string;
    title: string;
    url: string;
    state: {
      id: string;
      name: string;
      type: string;
    };
  };
  relatedIssue: {
    id: string;
    identifier: string;
    title: string;
    url: string;
    state: {
      id: string;
      name: string;
      type: string;
    };
  };
}

