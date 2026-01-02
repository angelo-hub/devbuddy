/**
 * Types for Jira Ticket Panel Store
 */

// ============================================================================
// Issue Types
// ============================================================================

export interface JiraIssue {
  key: string;
  summary: string;
  description: string;
  status: {
    id: string;
    name: string;
    statusCategory: {
      key: string;
      name: string;
      colorName: string;
    };
  };
  issueType: {
    id: string;
    name: string;
    subtask: boolean;
    iconUrl?: string;
  };
  priority: {
    id: string;
    name: string;
    iconUrl?: string;
  } | null;
  assignee: {
    accountId: string;
    displayName: string;
    avatarUrls?: {
      "48x48"?: string;
    };
  } | null;
  reporter: {
    accountId: string;
    displayName: string;
    avatarUrls?: {
      "48x48"?: string;
    };
  };
  project: {
    key: string;
    name: string;
  };
  labels: string[];
  created: string;
  updated: string;
  dueDate: string | null;
  storyPoints?: number | null;
  url: string;
  comments?: JiraComment[];
  subtasks?: JiraSubtask[];
  attachments?: JiraAttachment[];
  issueLinks?: JiraIssueLink[];
}

export interface JiraComment {
  id: string;
  body: string;
  author: {
    accountId: string;
    displayName: string;
    avatarUrls?: {
      "48x48"?: string;
    };
  };
  created: string;
  updated: string;
}

export interface JiraSubtask {
  id: string;
  key: string;
  summary: string;
  status: {
    id: string;
    name: string;
  };
  issueType: {
    id: string;
    name: string;
  };
}

export interface JiraAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  content: string;
  thumbnail?: string;
}

export interface JiraIssueLink {
  id: string;
  type: {
    id: string;
    name: string;
    inward: string;
    outward: string;
  };
  direction: "inward" | "outward";
  linkedIssue: {
    id: string;
    key: string;
    summary: string;
    status: {
      id: string;
      name: string;
      statusCategory?: {
        key: string;
        colorName: string;
      };
    };
    issueType: {
      id: string;
      name: string;
      iconUrl?: string;
    };
  };
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface JiraTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
  };
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: {
    "48x48"?: string;
  };
}

export interface JiraIssueLinkType {
  id: string;
  name: string;
  inward: string;
  outward: string;
}

export interface JiraIssueSearchResult {
  id: string;
  key: string;
  summary: string;
  status: {
    name: string;
    statusCategory?: {
      key: string;
    };
  };
}

export interface BranchInfo {
  branchName: string | null;
  exists: boolean;
  isInDifferentRepo?: boolean;
  repositoryName?: string;
  repositoryPath?: string;
}

export interface AllBranchesInfo {
  branches: string[];
  currentBranch: string | null;
  suggestions: string[];
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageFromExtension =
  | { command: "updateIssue"; issue: JiraIssue }
  | { command: "transitionsLoaded"; transitions: JiraTransition[] }
  | { command: "usersLoaded"; users: JiraUser[] }
  | {
      command: "branchInfo";
      branchName: string | null;
      exists: boolean;
      isInDifferentRepo?: boolean;
      repositoryName?: string;
      repositoryPath?: string;
    }
  | {
      command: "allBranchesLoaded";
      branches: string[];
      currentBranch: string | null;
      suggestions: string[];
    }
  | { command: "linkTypesLoaded"; linkTypes: JiraIssueLinkType[] }
  | { command: "issueSearchResults"; issues: JiraIssueSearchResult[] }
  | { command: "linkCreated"; success: boolean }
  | { command: "linkDeleted"; success: boolean };

export type MessageFromWebview =
  | { command: "updateStatus"; transitionId: string }
  | { command: "addComment"; body: string }
  | { command: "updateSummary"; summary: string }
  | { command: "updateDescription"; description: string }
  | { command: "updateAssignee"; assigneeId: string | null }
  | { command: "updatePriority"; priorityId: string }
  | { command: "updateStoryPoints"; storyPoints: number | null }
  | { command: "updateDueDate"; dueDate: string | null }
  | { command: "updateLabels"; labels: string[] }
  | { command: "loadTransitions" }
  | { command: "loadUsers"; projectKey: string }
  | { command: "searchUsers"; searchTerm: string; projectKey?: string }
  | { command: "openInJira" }
  | { command: "refresh" }
  | { command: "copyKey" }
  | { command: "copyUrl" }
  | { command: "checkoutBranch"; ticketKey: string }
  | { command: "associateBranch"; ticketKey: string; branchName: string }
  | { command: "removeAssociation"; ticketKey: string }
  | { command: "loadBranchInfo"; ticketKey: string }
  | { command: "loadAllBranches" }
  | { command: "openInRepository"; ticketKey: string; repositoryPath: string }
  | { command: "openLinkedIssue"; issueKey: string }
  | { command: "loadLinkTypes" }
  | { command: "searchIssues"; searchTerm: string }
  | {
      command: "createLink";
      targetIssueKey: string;
      linkTypeName: string;
      isOutward: boolean;
    }
  | { command: "deleteLink"; linkId: string };

