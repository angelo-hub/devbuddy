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

// Ticket activity for non-code work (spikes, investigations, description updates)
export interface TicketActivityItem {
  ticketId: string;
  type: "status_change" | "description_update" | "comment_added" | "title_change" | "assignee_change" | "priority_change" | "label_change" | "estimate_change" | "attachment_added" | "other";
  description: string;
  timestamp: string;
  commentPreview?: string;
}

// Auto-detected context for smart standup generation
export interface AutoDetectedContext {
  currentBranch: string;
  currentTicketId: string | null;
  recentCommits: Array<{ hash: string; message: string; ticketId?: string }>;
  detectedTicketIds: string[];
  associatedTickets: Array<{ ticketId: string; branchName: string; source: string }>;
  recentTicketActivity?: TicketActivityItem[];
  timeWindow: string;
  isGitRepo: boolean;
}

// Standup Builder Messages
export type StandupBuilderMessageFromWebview =
  | { command: "loadTickets" }
  | { command: "loadAutoContext" }
  | { command: "quickGenerate" }
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
      platform?: string;
    }
  | {
      command: "autoContextLoaded";
      context: AutoDetectedContext | null;
      error?: string;
    }
  | { command: "generationStarted" }
  | { command: "generationFailed"; error: string }
  | { command: "dataLoaded"; commits: any[]; fileChanges: string[]; ticketActivity?: TicketActivityItem[] }
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
        ticketActivity?: TicketActivityItem[];
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
  | { command: "updateCycle"; cycleId: string | null };

export type TicketPanelMessageFromExtension =
  | { command: "updateIssue"; issue: LinearIssue }
  | { command: "workflowStates"; states: WorkflowState[] }
  | { command: "usersLoaded"; users: LinearUser[] }
  | { command: "branchInfo"; branchName: string | null; exists: boolean; isInDifferentRepo?: boolean; repositoryName?: string; repositoryPath?: string }
  | { command: "allBranchesLoaded"; branches: string[]; currentBranch: string | null; suggestions: string[] }
  | { command: "labelsLoaded"; labels: LinearLabel[] }
  | { command: "cyclesLoaded"; cycles: LinearCycle[] };
