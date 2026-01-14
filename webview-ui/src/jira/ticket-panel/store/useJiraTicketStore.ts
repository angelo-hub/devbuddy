/**
 * Jira Ticket Panel Store
 *
 * Centralized state management for the Jira ticket detail panel.
 * Uses Zustand for clean, performant state management with VS Code webview messaging.
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { postMessage, createMessageSubscription } from "@shared/stores";
import type { EnrichedTicketMetadata } from "@shared/types/messages";
import {
  JiraIssue,
  JiraTransition,
  JiraUser,
  JiraIssueLinkType,
  JiraIssueSearchResult,
  BranchInfo,
  AllBranchesInfo,
  MessageFromExtension,
  MessageFromWebview,
} from "./types";

// ============================================================================
// Store State Interface
// ============================================================================

interface JiraTicketState {
  // Core issue data
  issue: JiraIssue | null;

  // Navigation history
  navigationHistory: JiraIssue[];

  // Workflow data
  transitions: JiraTransition[];

  // User data
  users: JiraUser[];

  // Branch management
  branchInfo: BranchInfo | null;
  allBranches: AllBranchesInfo | null;

  // Issue linking
  linkTypes: JiraIssueLinkType[];
  issueSearchResults: JiraIssueSearchResult[];

  // Enriched ticket link metadata
  enrichedMetadata: Map<string, EnrichedTicketMetadata>;
}

// ============================================================================
// Store Actions Interface
// ============================================================================

interface JiraTicketActions {
  // Initialization
  init: () => () => void;

  // Status actions
  updateStatus: (transitionId: string) => void;

  // Comment actions
  addComment: (body: string) => void;

  // Issue update actions
  updateSummary: (summary: string) => void;
  updateDescription: (description: string) => void;
  updateAssignee: (assigneeId: string | null) => void;
  updatePriority: (priorityId: string) => void;
  updateStoryPoints: (storyPoints: number | null) => void;
  updateDueDate: (dueDate: string | null) => void;
  updateLabels: (labels: string[]) => void;

  // User actions
  loadUsers: (projectKey: string) => void;
  searchUsers: (searchTerm: string) => void;

  // Navigation actions
  openInJira: () => void;
  refresh: () => void;
  copyKey: () => void;
  copyUrl: () => void;
  openLinkedIssue: (issueKey: string) => void;
  goBack: () => void;

  // Branch actions
  checkoutBranch: (ticketKey: string) => void;
  associateBranch: (ticketKey: string, branchName: string) => void;
  removeAssociation: (ticketKey: string) => void;
  loadBranchInfo: (ticketKey: string) => void;
  loadAllBranches: () => void;
  openInRepository: (ticketKey: string, repositoryPath: string) => void;

  // Issue linking actions
  loadLinkTypes: () => void;
  searchIssues: (searchTerm: string) => void;
  createLink: (
    targetIssueKey: string,
    linkTypeName: string,
    isOutward: boolean
  ) => void;
  deleteLink: (linkId: string) => void;

  // Ticket enrichment actions
  enrichTicketLinks: (ticketIds: string[]) => void;
  
  // Navigation actions
  openTicket: (ticketKey: string) => void;
}

// ============================================================================
// Store Type
// ============================================================================

export type JiraTicketStore = JiraTicketState & JiraTicketActions;

// ============================================================================
// Initial State
// ============================================================================

// Get initial state from window object (passed from extension)
declare global {
  interface Window {
    __JIRA_INITIAL_STATE__?: {
      issue: JiraIssue;
    };
  }
}

const getInitialState = (): JiraTicketState => ({
  issue: window.__JIRA_INITIAL_STATE__?.issue || null,
  navigationHistory: [],
  transitions: [],
  users: [],
  branchInfo: null,
  allBranches: null,
  linkTypes: [],
  issueSearchResults: [],
  enrichedMetadata: new Map(),
});

// ============================================================================
// Store Implementation
// ============================================================================

export const useJiraTicketStore = create<JiraTicketStore>()((set, get) => ({
  ...getInitialState(),

  // --------------------------------------------------------------------------
  // Initialization - sets up message listener and loads initial data
  // --------------------------------------------------------------------------
  init: () => {
    const unsubscribe = createMessageSubscription<MessageFromExtension>(
      (message) => {
        switch (message.command) {
          case "updateIssue":
            set({ issue: message.issue });
            break;

          case "transitionsLoaded":
            set({ transitions: message.transitions });
            break;

          case "usersLoaded":
            set({ users: message.users });
            break;

          case "branchInfo":
            set({
              branchInfo: {
                branchName: message.branchName,
                exists: message.exists,
                isInDifferentRepo: message.isInDifferentRepo,
                repositoryName: message.repositoryName,
                repositoryPath: message.repositoryPath,
              },
            });
            break;

          case "allBranchesLoaded":
            set({
              allBranches: {
                branches: message.branches,
                currentBranch: message.currentBranch,
                suggestions: message.suggestions,
              },
            });
            break;

          case "linkTypesLoaded":
            set({ linkTypes: message.linkTypes });
            break;

          case "issueSearchResults":
            set({ issueSearchResults: message.issues });
            break;

          case "linkCreated":
          case "linkDeleted":
            // Issue will be refreshed automatically by extension
            break;

          case "enrichedTicketMetadata":
            // Update enriched metadata map
            set((state) => {
              const newMetadata = new Map(state.enrichedMetadata);
              message.metadata.forEach((ticket) => {
                newMetadata.set(ticket.identifier, ticket);
              });
              return { enrichedMetadata: newMetadata };
            });
            break;
        }
      }
    );

    // Load initial transitions and users if we have an issue
    const issue = get().issue;
    if (issue) {
      postMessage<MessageFromWebview>({ command: "loadTransitions" });
      postMessage<MessageFromWebview>({
        command: "loadUsers",
        projectKey: issue.project.key,
      });
    }

    return unsubscribe;
  },

  // --------------------------------------------------------------------------
  // Status Actions
  // --------------------------------------------------------------------------
  updateStatus: (transitionId) => {
    postMessage<MessageFromWebview>({ command: "updateStatus", transitionId });
  },

  // --------------------------------------------------------------------------
  // Comment Actions
  // --------------------------------------------------------------------------
  addComment: (body) => {
    postMessage<MessageFromWebview>({ command: "addComment", body });
  },

  // --------------------------------------------------------------------------
  // Issue Update Actions
  // --------------------------------------------------------------------------
  updateSummary: (summary) => {
    postMessage<MessageFromWebview>({ command: "updateSummary", summary });
  },

  updateDescription: (description) => {
    postMessage<MessageFromWebview>({
      command: "updateDescription",
      description,
    });
  },

  updateAssignee: (assigneeId) => {
    postMessage<MessageFromWebview>({ command: "updateAssignee", assigneeId });
  },

  updatePriority: (priorityId) => {
    postMessage<MessageFromWebview>({ command: "updatePriority", priorityId });
  },

  updateStoryPoints: (storyPoints) => {
    postMessage<MessageFromWebview>({ command: "updateStoryPoints", storyPoints });
  },

  updateDueDate: (dueDate) => {
    postMessage<MessageFromWebview>({ command: "updateDueDate", dueDate });
  },

  updateLabels: (labels) => {
    postMessage<MessageFromWebview>({ command: "updateLabels", labels });
  },

  // --------------------------------------------------------------------------
  // User Actions
  // --------------------------------------------------------------------------
  loadUsers: (projectKey) => {
    postMessage<MessageFromWebview>({ command: "loadUsers", projectKey });
  },

  searchUsers: (searchTerm) => {
    const issue = get().issue;
    postMessage<MessageFromWebview>({
      command: "searchUsers",
      searchTerm,
      projectKey: issue?.project.key,
    });
  },

  // --------------------------------------------------------------------------
  // Navigation Actions
  // --------------------------------------------------------------------------
  openInJira: () => {
    postMessage<MessageFromWebview>({ command: "openInJira" });
  },

  refresh: () => {
    postMessage<MessageFromWebview>({ command: "refresh" });
  },

  copyKey: () => {
    postMessage<MessageFromWebview>({ command: "copyKey" });
  },

  copyUrl: () => {
    postMessage<MessageFromWebview>({ command: "copyUrl" });
  },

  openLinkedIssue: (issueKey) => {
    const currentIssue = get().issue;
    
    // Add current issue to navigation history before navigating
    if (currentIssue) {
      set((state) => ({
        navigationHistory: [...state.navigationHistory, currentIssue],
      }));
    }
    
    // Request new issue from extension
    postMessage<MessageFromWebview>({ command: "openLinkedIssue", issueKey });
  },

  goBack: () => {
    const history = get().navigationHistory;
    
    if (history.length === 0) {
      return;
    }
    
    // Get the previous issue
    const previousIssue = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    // Update state with previous issue (no need to fetch from extension)
    set({
      issue: previousIssue,
      navigationHistory: newHistory,
    });
  },

  // --------------------------------------------------------------------------
  // Branch Actions
  // --------------------------------------------------------------------------
  checkoutBranch: (ticketKey) => {
    postMessage<MessageFromWebview>({ command: "checkoutBranch", ticketKey });
  },

  associateBranch: (ticketKey, branchName) => {
    postMessage<MessageFromWebview>({
      command: "associateBranch",
      ticketKey,
      branchName,
    });
    // Refresh branch info after associating
    setTimeout(() => {
      get().loadBranchInfo(ticketKey);
    }, 100);
  },

  removeAssociation: (ticketKey) => {
    postMessage<MessageFromWebview>({
      command: "removeAssociation",
      ticketKey,
    });
    // Refresh branch info after removing
    setTimeout(() => {
      get().loadBranchInfo(ticketKey);
    }, 100);
  },

  loadBranchInfo: (ticketKey) => {
    postMessage<MessageFromWebview>({ command: "loadBranchInfo", ticketKey });
  },

  loadAllBranches: () => {
    postMessage<MessageFromWebview>({ command: "loadAllBranches" });
  },

  openInRepository: (ticketKey, repositoryPath) => {
    postMessage<MessageFromWebview>({
      command: "openInRepository",
      ticketKey,
      repositoryPath,
    });
  },

  // --------------------------------------------------------------------------
  // Issue Linking Actions
  // --------------------------------------------------------------------------
  loadLinkTypes: () => {
    postMessage<MessageFromWebview>({ command: "loadLinkTypes" });
  },

  searchIssues: (searchTerm) => {
    postMessage<MessageFromWebview>({ command: "searchIssues", searchTerm });
  },

  createLink: (targetIssueKey, linkTypeName, isOutward) => {
    postMessage<MessageFromWebview>({
      command: "createLink",
      targetIssueKey,
      linkTypeName,
      isOutward,
    });
  },

  deleteLink: (linkId) => {
    postMessage<MessageFromWebview>({ command: "deleteLink", linkId });
  },

  // --------------------------------------------------------------------------
  // Ticket Enrichment Actions
  // --------------------------------------------------------------------------
  enrichTicketLinks: (ticketIds) => {
    if (ticketIds.length === 0) return;
    postMessage<MessageFromWebview>({ command: "enrichTicketLinks", ticketIds });
  },
  
  // --------------------------------------------------------------------------
  // Navigation Actions
  // --------------------------------------------------------------------------
  openTicket: (ticketKey) => {
    if (!ticketKey) return;
    postMessage<MessageFromWebview>({ command: "openTicket", ticketKey });
  },
}));

// ============================================================================
// Selector Hooks (for optimized renders)
// ============================================================================

export const useJiraIssue = () => useJiraTicketStore((state) => state.issue);
export const useJiraTransitions = () =>
  useJiraTicketStore((state) => state.transitions);
export const useJiraUsers = () => useJiraTicketStore((state) => state.users);
export const useJiraBranchInfo = () =>
  useJiraTicketStore((state) => state.branchInfo);
export const useJiraAllBranches = () =>
  useJiraTicketStore((state) => state.allBranches);
export const useJiraLinkTypes = () =>
  useJiraTicketStore((state) => state.linkTypes);
export const useJiraIssueSearchResults = () =>
  useJiraTicketStore((state) => state.issueSearchResults);
export const useJiraEnrichedMetadata = () =>
  useJiraTicketStore((state) => state.enrichedMetadata);

// Navigation selectors
export const useJiraCanGoBack = () => 
  useJiraTicketStore((state) => state.navigationHistory.length > 0);

// Action hooks (use shallow comparison to prevent infinite re-renders)
export const useJiraTicketActions = () =>
  useJiraTicketStore(
    useShallow((state) => ({
      init: state.init,
      updateStatus: state.updateStatus,
      addComment: state.addComment,
      updateSummary: state.updateSummary,
      updateDescription: state.updateDescription,
      updateAssignee: state.updateAssignee,
      updatePriority: state.updatePriority,
      updateStoryPoints: state.updateStoryPoints,
      updateDueDate: state.updateDueDate,
      updateLabels: state.updateLabels,
      loadUsers: state.loadUsers,
      searchUsers: state.searchUsers,
      openInJira: state.openInJira,
      refresh: state.refresh,
      copyKey: state.copyKey,
      copyUrl: state.copyUrl,
      openLinkedIssue: state.openLinkedIssue,
      goBack: state.goBack,
      checkoutBranch: state.checkoutBranch,
      associateBranch: state.associateBranch,
      removeAssociation: state.removeAssociation,
      loadBranchInfo: state.loadBranchInfo,
      loadAllBranches: state.loadAllBranches,
      openInRepository: state.openInRepository,
      loadLinkTypes: state.loadLinkTypes,
      searchIssues: state.searchIssues,
      createLink: state.createLink,
      deleteLink: state.deleteLink,
      enrichTicketLinks: state.enrichTicketLinks,
      openTicket: state.openTicket,
    }))
  );

