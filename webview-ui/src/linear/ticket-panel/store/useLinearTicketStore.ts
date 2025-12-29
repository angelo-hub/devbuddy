/**
 * Linear Ticket Panel Store
 *
 * Centralized state management for the Linear ticket detail panel.
 * Uses Zustand for clean, performant state management with VS Code webview messaging.
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { postMessage, createMessageSubscription } from "@shared/stores";
import {
  LinearIssue,
  WorkflowState,
  LinearUser,
  LinearLabel,
  LinearCycle,
  LinearIssueSearchResult,
  LinearIssueRelationType,
  TicketPanelMessageFromExtension,
  TicketPanelMessageFromWebview,
} from "../../../shared/types/messages";

// ============================================================================
// Store State Interface
// ============================================================================

interface BranchInfo {
  branchName: string | null;
  exists: boolean;
  isInDifferentRepo?: boolean;
  repositoryName?: string;
  repositoryPath?: string;
}

interface AllBranchesInfo {
  branches: string[];
  currentBranch: string | null;
  suggestions: string[];
}

interface LinearTicketState {
  // Core issue data
  issue: LinearIssue | null;

  // Navigation history
  navigationHistory: LinearIssue[];

  // Workflow data
  workflowStates: WorkflowState[];

  // User data
  users: LinearUser[];

  // Labels & Cycles
  availableLabels: LinearLabel[];
  availableCycles: LinearCycle[];

  // Branch management
  branchInfo: BranchInfo | null;
  allBranches: AllBranchesInfo | null;

  // Issue relations
  issueSearchResults: LinearIssueSearchResult[];
}

// ============================================================================
// Store Actions Interface
// ============================================================================

interface LinearTicketActions {
  // Initialization
  init: () => () => void;

  // Status actions
  updateStatus: (stateId: string) => void;

  // Comment actions
  addComment: (body: string) => void;

  // Issue update actions
  updateTitle: (title: string) => void;
  updateDescription: (description: string) => void;
  updateAssignee: (assigneeId: string | null) => void;
  updateLabels: (labelIds: string[]) => void;
  updateCycle: (cycleId: string | null) => void;

  // User actions
  loadUsers: (teamId?: string) => void;
  searchUsers: (searchTerm: string) => void;

  // Navigation actions
  openInLinear: () => void;
  refresh: () => void;
  openIssue: (issueId: string) => void;
  goBack: () => void;

  // Branch actions
  checkoutBranch: (ticketId: string) => void;
  associateBranch: (ticketId: string, branchName: string) => void;
  removeAssociation: (ticketId: string) => void;
  loadBranchInfo: (ticketId: string) => void;
  loadAllBranches: () => void;
  openInRepository: (ticketId: string, repositoryPath: string) => void;

  // Label & Cycle actions
  loadLabels: (teamId: string) => void;
  loadCycles: (teamId: string) => void;

  // Issue relation actions
  searchIssues: (searchTerm: string) => void;
  createRelation: (relatedIssueId: string, type: LinearIssueRelationType) => void;
  deleteRelation: (relationId: string) => void;
}

// ============================================================================
// Store Type
// ============================================================================

export type LinearTicketStore = LinearTicketState & LinearTicketActions;

// ============================================================================
// Initial State
// ============================================================================

// Get initial state from window object (passed from extension)
declare global {
  interface Window {
    __LINEAR_INITIAL_STATE__?: {
      issue: LinearIssue;
      workflowStates: WorkflowState[];
      users?: LinearUser[];
    };
  }
}

const getInitialState = (): LinearTicketState => ({
  issue: window.__LINEAR_INITIAL_STATE__?.issue || null,
  navigationHistory: [],
  workflowStates: window.__LINEAR_INITIAL_STATE__?.workflowStates || [],
  users: window.__LINEAR_INITIAL_STATE__?.users || [],
  availableLabels: [],
  availableCycles: [],
  branchInfo: null,
  allBranches: null,
  issueSearchResults: [],
});

// ============================================================================
// Store Implementation
// ============================================================================

export const useLinearTicketStore = create<LinearTicketStore>()((set, get) => ({
  ...getInitialState(),

  // --------------------------------------------------------------------------
  // Initialization - sets up message listener
  // --------------------------------------------------------------------------
  init: () => {
    const unsubscribe = createMessageSubscription<TicketPanelMessageFromExtension>(
      (message) => {
        switch (message.command) {
          case "updateIssue":
            set({ issue: message.issue });
            break;

          case "workflowStates":
            set({ workflowStates: message.states });
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

          case "labelsLoaded":
            set({ availableLabels: message.labels });
            break;

          case "cyclesLoaded":
            set({ availableCycles: message.cycles });
            break;

          case "issueSearchResults":
            set({ issueSearchResults: message.issues });
            break;

          case "relationCreated":
          case "relationDeleted":
            // Issue will be refreshed automatically by extension
            break;
        }
      }
    );

    return unsubscribe;
  },

  // --------------------------------------------------------------------------
  // Status Actions
  // --------------------------------------------------------------------------
  updateStatus: (stateId) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "updateStatus", stateId });
  },

  // --------------------------------------------------------------------------
  // Comment Actions
  // --------------------------------------------------------------------------
  addComment: (body) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "addComment", body });
  },

  // --------------------------------------------------------------------------
  // Issue Update Actions
  // --------------------------------------------------------------------------
  updateTitle: (title) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "updateTitle", title });
  },

  updateDescription: (description) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "updateDescription", description });
  },

  updateAssignee: (assigneeId) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "updateAssignee", assigneeId });
  },

  updateLabels: (labelIds) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "updateLabels", labelIds });
  },

  updateCycle: (cycleId) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "updateCycle", cycleId });
  },

  // --------------------------------------------------------------------------
  // User Actions
  // --------------------------------------------------------------------------
  loadUsers: (teamId) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "loadUsers", teamId });
  },

  searchUsers: (searchTerm) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "searchUsers", searchTerm });
  },

  // --------------------------------------------------------------------------
  // Navigation Actions
  // --------------------------------------------------------------------------
  openInLinear: () => {
    postMessage<TicketPanelMessageFromWebview>({ command: "openInLinear" });
  },

  refresh: () => {
    postMessage<TicketPanelMessageFromWebview>({ command: "refresh" });
  },

  openIssue: (issueId) => {
    const currentIssue = get().issue;
    
    // Add current issue to navigation history before navigating
    if (currentIssue) {
      set((state) => ({
        navigationHistory: [...state.navigationHistory, currentIssue],
      }));
    }
    
    // Request new issue from extension
    postMessage<TicketPanelMessageFromWebview>({ command: "openIssue", issueId });
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
  checkoutBranch: (ticketId) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "checkoutBranch", ticketId });
  },

  associateBranch: (ticketId, branchName) => {
    postMessage<TicketPanelMessageFromWebview>({
      command: "associateBranch",
      ticketId,
      branchName,
    });
    // Refresh branch info after associating
    setTimeout(() => {
      get().loadBranchInfo(ticketId);
    }, 100);
  },

  removeAssociation: (ticketId) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "removeAssociation", ticketId });
    // Refresh branch info after removing
    setTimeout(() => {
      get().loadBranchInfo(ticketId);
    }, 100);
  },

  loadBranchInfo: (ticketId) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "loadBranchInfo", ticketId });
  },

  loadAllBranches: () => {
    postMessage<TicketPanelMessageFromWebview>({ command: "loadAllBranches" });
  },

  openInRepository: (ticketId, repositoryPath) => {
    postMessage<TicketPanelMessageFromWebview>({
      command: "openInRepository",
      ticketId,
      repositoryPath,
    });
  },

  // --------------------------------------------------------------------------
  // Label & Cycle Actions
  // --------------------------------------------------------------------------
  loadLabels: (teamId) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "loadLabels", teamId });
  },

  loadCycles: (teamId) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "loadCycles", teamId });
  },

  // --------------------------------------------------------------------------
  // Issue Relation Actions
  // --------------------------------------------------------------------------
  searchIssues: (searchTerm) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "searchIssues", searchTerm });
  },

  createRelation: (relatedIssueId, type) => {
    postMessage<TicketPanelMessageFromWebview>({
      command: "createRelation",
      relatedIssueId,
      type,
    });
  },

  deleteRelation: (relationId) => {
    postMessage<TicketPanelMessageFromWebview>({ command: "deleteRelation", relationId });
  },
}));

// ============================================================================
// Selector Hooks (for optimized renders)
// ============================================================================

export const useLinearIssue = () => useLinearTicketStore((state) => state.issue);
export const useLinearWorkflowStates = () => useLinearTicketStore((state) => state.workflowStates);
export const useLinearUsers = () => useLinearTicketStore((state) => state.users);
export const useLinearAvailableLabels = () => useLinearTicketStore((state) => state.availableLabels);
export const useLinearAvailableCycles = () => useLinearTicketStore((state) => state.availableCycles);
export const useLinearBranchInfo = () => useLinearTicketStore((state) => state.branchInfo);
export const useLinearAllBranches = () => useLinearTicketStore((state) => state.allBranches);
export const useLinearIssueSearchResults = () => useLinearTicketStore((state) => state.issueSearchResults);

// Navigation selectors
export const useCanGoBack = () => 
  useLinearTicketStore((state) => state.navigationHistory.length > 0);

// Action hooks (use shallow comparison to prevent infinite re-renders)
export const useLinearTicketActions = () =>
  useLinearTicketStore(
    useShallow((state) => ({
      init: state.init,
      updateStatus: state.updateStatus,
      addComment: state.addComment,
      updateTitle: state.updateTitle,
      updateDescription: state.updateDescription,
      updateAssignee: state.updateAssignee,
      updateLabels: state.updateLabels,
      updateCycle: state.updateCycle,
      loadUsers: state.loadUsers,
      searchUsers: state.searchUsers,
      openInLinear: state.openInLinear,
      refresh: state.refresh,
      openIssue: state.openIssue,
      goBack: state.goBack,
      checkoutBranch: state.checkoutBranch,
      associateBranch: state.associateBranch,
      removeAssociation: state.removeAssociation,
      loadBranchInfo: state.loadBranchInfo,
      loadAllBranches: state.loadAllBranches,
      openInRepository: state.openInRepository,
      loadLabels: state.loadLabels,
      loadCycles: state.loadCycles,
      searchIssues: state.searchIssues,
      createRelation: state.createRelation,
      deleteRelation: state.deleteRelation,
    }))
  );

