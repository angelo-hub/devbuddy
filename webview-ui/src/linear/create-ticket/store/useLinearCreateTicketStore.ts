/**
 * Linear Create Ticket Store
 *
 * Centralized state management for the Linear create ticket panel.
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { postMessage, createMessageSubscription } from "@shared/stores";
import {
  LinearTeam,
  LinearTemplate,
  LinearWorkflowState,
  LinearLabel,
  LinearProject,
  LinearUser,
  DraftData,
  CreateIssueInput,
  MessageFromExtension,
  MessageFromWebview,
} from "./types";

// ============================================================================
// Store State Interface
// ============================================================================

interface LinearCreateTicketState {
  // Data
  teams: LinearTeam[];
  templates: LinearTemplate[];
  workflowStates: LinearWorkflowState[];
  labels: LinearLabel[];
  projects: LinearProject[];
  users: LinearUser[];

  // UI State
  isCreating: boolean;
  draftData: DraftData | undefined;
}

// ============================================================================
// Store Actions Interface
// ============================================================================

interface LinearCreateTicketActions {
  // Initialization
  init: () => () => void;

  // Data loading
  loadTeams: () => void;
  loadTeamData: (teamId: string) => void;

  // Issue creation
  createIssue: (input: CreateIssueInput) => void;
}

// ============================================================================
// Store Type
// ============================================================================

export type LinearCreateTicketStore = LinearCreateTicketState &
  LinearCreateTicketActions;

// ============================================================================
// Initial State
// ============================================================================

const getInitialState = (): LinearCreateTicketState => ({
  teams: [],
  templates: [],
  workflowStates: [],
  labels: [],
  projects: [],
  users: [],
  isCreating: false,
  draftData: undefined,
});

// ============================================================================
// Store Implementation
// ============================================================================

export const useLinearCreateTicketStore = create<LinearCreateTicketStore>()(
  (set) => ({
    ...getInitialState(),

    // --------------------------------------------------------------------------
    // Initialization
    // --------------------------------------------------------------------------
    init: () => {
      const unsubscribe = createMessageSubscription<MessageFromExtension>(
        (message) => {
          switch (message.command) {
            case "teamsLoaded":
              set({ teams: message.teams || [] });
              break;

            case "templatesLoaded":
              set({ templates: message.templates || [] });
              break;

            case "teamDataLoaded":
              set({
                workflowStates: message.workflowStates || [],
                labels: message.labels || [],
                projects: message.projects || [],
              });
              break;

            case "usersLoaded":
              set({ users: message.users || [] });
              break;

            case "issueCreated":
              set({ isCreating: false });
              // Panel will be closed by extension
              break;

            case "issueCreationFailed":
              set({ isCreating: false });
              break;

            case "populateDraft":
              if (message.data) {
                set({ draftData: message.data });
              }
              break;
          }
        }
      );

      // Load teams on init
      postMessage<MessageFromWebview>({ command: "loadTeams" });

      return unsubscribe;
    },

    // --------------------------------------------------------------------------
    // Data Loading
    // --------------------------------------------------------------------------
    loadTeams: () => {
      postMessage<MessageFromWebview>({ command: "loadTeams" });
    },

    loadTeamData: (teamId) => {
      postMessage<MessageFromWebview>({ command: "loadTemplates", teamId });
      postMessage<MessageFromWebview>({ command: "loadTeamData", teamId });
      postMessage<MessageFromWebview>({ command: "loadUsers", teamId });
    },

    // --------------------------------------------------------------------------
    // Issue Creation
    // --------------------------------------------------------------------------
    createIssue: (input) => {
      set({ isCreating: true });
      postMessage<MessageFromWebview>({ command: "createIssue", input });
    },
  })
);

// ============================================================================
// Selector Hooks
// ============================================================================

export const useLinearTeams = () =>
  useLinearCreateTicketStore((state) => state.teams);
export const useLinearTemplates = () =>
  useLinearCreateTicketStore((state) => state.templates);
export const useLinearWorkflowStates = () =>
  useLinearCreateTicketStore((state) => state.workflowStates);
export const useLinearLabels = () =>
  useLinearCreateTicketStore((state) => state.labels);
export const useLinearProjects = () =>
  useLinearCreateTicketStore((state) => state.projects);
export const useLinearUsers = () =>
  useLinearCreateTicketStore((state) => state.users);
export const useIsCreating = () =>
  useLinearCreateTicketStore((state) => state.isCreating);
export const useDraftData = () =>
  useLinearCreateTicketStore((state) => state.draftData);

// Action hooks (use shallow comparison to prevent infinite re-renders)
export const useLinearCreateTicketActions = () =>
  useLinearCreateTicketStore(
    useShallow((state) => ({
      init: state.init,
      loadTeams: state.loadTeams,
      loadTeamData: state.loadTeamData,
      createIssue: state.createIssue,
    }))
  );

