// Message types for communication between extension and webviews

export interface LinearTicket {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
}

export interface LinearUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

// Standup Builder Messages
export type StandupBuilderMessageFromWebview =
  | { command: "loadTickets" }
  | {
      command: "generate";
      data: {
        timeWindow: string;
        targetBranch: string;
        tickets: string;
        mode: string;
        selectedTicket?: string;
        ticketContext?: LinearTicket;
      };
    }
  | { command: "copy"; text: string }
  | { command: "openSettings" };

export type StandupBuilderMessageFromExtension =
  | {
      command: "ticketsLoaded";
      tickets: LinearTicket[];
      error?: string;
    }
  | { command: "progress"; message: string }
  | { command: "error"; message: string }
  | {
      command: "results";
      data: {
        whatDidYouDo: string;
        whatWillYouDo: string;
        blockers: string;
        tickets: Array<{
          id: string;
          branch?: string;
          description?: string;
        }>;
        commits: Array<{
          message: string;
          branch?: string;
        }>;
        changedFiles: string[];
      };
    };

// Ticket Panel Messages
export interface WorkflowState {
  id: string;
  name: string;
  type: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  state: WorkflowState;
  priority: number;
  createdAt: string;
  updatedAt: string;
  url?: string;
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  project?: {
    id: string;
    name: string;
  };
  labels?: Array<{
    id: string;
    name: string;
    color: string;
  }> | {
    nodes: Array<{
      id: string;
      name: string;
      color: string;
    }>;
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
      sourceType?: string;
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
    nodes: LinearIssueRelation[];
  };
  /** Inverse relations where this issue is the target (e.g., "is blocked by") */
  inverseRelations?: {
    nodes: LinearIssueRelation[];
  };
}

export interface LinearLabel {
  id: string;
  name: string;
  color: string;
}

export interface LinearCycle {
  id: string;
  name: string;
  number: number;
  startsAt?: string;
  endsAt?: string;
  progress?: number;
}

/**
 * Issue relation types supported by Linear
 */
export type LinearIssueRelationType =
  | "blocks"
  | "blocked_by"
  | "related"
  | "duplicate"
  | "duplicate_of";

/**
 * A relation between two Linear issues
 */
export interface LinearIssueRelation {
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
}

export type TicketPanelMessageFromWebview =
  | { command: "updateStatus"; stateId: string }
  | { command: "addComment"; body: string }
  | { command: "openInLinear" }
  | { command: "refresh" }
  | { command: "updateTitle"; title: string }
  | { command: "updateDescription"; description: string }
  | { command: "updateAssignee"; assigneeId: string | null }
  | { command: "loadUsers"; teamId?: string }
  | { command: "searchUsers"; searchTerm: string }
  | { command: "openIssue"; issueId: string }
  | { command: "checkoutBranch"; ticketId: string }
  | { command: "associateBranch"; ticketId: string; branchName: string }
  | { command: "removeAssociation"; ticketId: string }
  | { command: "loadBranchInfo"; ticketId: string }
  | { command: "loadAllBranches" }
  | { command: "openInRepository"; ticketId: string; repositoryPath: string }
  | { command: "loadLabels"; teamId: string }
  | { command: "updateLabels"; labelIds: string[] }
  | { command: "loadCycles"; teamId: string }
  | { command: "updateCycle"; cycleId: string | null }
  | { command: "searchIssues"; searchTerm: string }
  | { command: "createRelation"; relatedIssueId: string; type: LinearIssueRelationType }
  | { command: "deleteRelation"; relationId: string };

/** Search result for issues (used when creating relations) */
export interface LinearIssueSearchResult {
  id: string;
  identifier: string;
  title: string;
  state: {
    name: string;
    type: string;
  };
}

export type TicketPanelMessageFromExtension =
  | { command: "updateIssue"; issue: LinearIssue }
  | { command: "workflowStates"; states: WorkflowState[] }
  | { command: "usersLoaded"; users: LinearUser[] }
  | { command: "branchInfo"; branchName: string | null; exists: boolean; isInDifferentRepo?: boolean; repositoryName?: string; repositoryPath?: string }
  | { command: "allBranchesLoaded"; branches: string[]; currentBranch: string | null; suggestions: string[] }
  | { command: "labelsLoaded"; labels: LinearLabel[] }
  | { command: "cyclesLoaded"; cycles: LinearCycle[] }
  | { command: "issueSearchResults"; issues: LinearIssueSearchResult[] }
  | { command: "relationCreated"; success: boolean }
  | { command: "relationDeleted"; success: boolean };
