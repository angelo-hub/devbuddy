/**
 * Jira Create Ticket Store
 *
 * Centralized state management for the Jira create ticket panel.
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { postMessage, createMessageSubscription } from "@shared/stores";
import {
  JiraProject,
  JiraIssueType,
  JiraPriority,
  JiraUser,
  DraftData,
  CreateIssueInput,
  MessageFromExtension,
  MessageFromWebview,
} from "./types";

// ============================================================================
// Store State Interface
// ============================================================================

interface JiraCreateTicketState {
  // Data
  projects: JiraProject[];
  issueTypes: JiraIssueType[];
  priorities: JiraPriority[];
  users: JiraUser[];

  // Form State
  selectedProject: string;
  summary: string;
  description: string;
  issueTypeId: string;
  priorityId: string;
  assigneeId: string;
  labelsInput: string;

  // UI State
  isCreating: boolean;
  pendingPriority: string | null;
}

// ============================================================================
// Store Actions Interface
// ============================================================================

interface JiraCreateTicketActions {
  // Initialization
  init: () => () => void;

  // Data loading
  loadProjectMeta: (projectKey: string) => void;

  // Form actions
  setSelectedProject: (projectKey: string) => void;
  setSummary: (summary: string) => void;
  setDescription: (description: string) => void;
  setIssueTypeId: (issueTypeId: string) => void;
  setPriorityId: (priorityId: string) => void;
  setAssigneeId: (assigneeId: string) => void;
  setLabelsInput: (labelsInput: string) => void;

  // Issue creation
  createIssue: (input: CreateIssueInput) => void;
}

// ============================================================================
// Store Type
// ============================================================================

export type JiraCreateTicketStore = JiraCreateTicketState &
  JiraCreateTicketActions;

// ============================================================================
// Initial State
// ============================================================================

const getInitialState = (): JiraCreateTicketState => ({
  projects: [],
  issueTypes: [],
  priorities: [],
  users: [],
  selectedProject: "",
  summary: "",
  description: "",
  issueTypeId: "",
  priorityId: "",
  assigneeId: "",
  labelsInput: "",
  isCreating: false,
  pendingPriority: null,
});

// ============================================================================
// Store Implementation
// ============================================================================

export const useJiraCreateTicketStore = create<JiraCreateTicketStore>()(
  (set, get) => ({
    ...getInitialState(),

    // --------------------------------------------------------------------------
    // Initialization
    // --------------------------------------------------------------------------
    init: () => {
      const unsubscribe = createMessageSubscription<MessageFromExtension>(
        (message) => {
          switch (message.command) {
            case "projectsLoaded":
              set({ projects: message.projects });
              break;

            case "projectMetaLoaded": {
              const filteredIssueTypes = message.issueTypes.filter(
                (t) => !t.subtask
              );
              set({
                issueTypes: filteredIssueTypes,
                priorities: message.priorities,
              });

              // Handle pending priority from draft
              const { pendingPriority } = get();
              if (pendingPriority) {
                const matchedPriority = message.priorities.find(
                  (p) => p.name.toLowerCase() === pendingPriority.toLowerCase()
                );
                if (matchedPriority) {
                  set({ priorityId: matchedPriority.id, pendingPriority: null });
                }
              }
              break;
            }

            case "usersLoaded":
              set({ users: message.users });
              break;

            case "populateDraft":
              if (message.data) {
                const updates: Partial<JiraCreateTicketState> = {};
                if (message.data.title) updates.summary = message.data.title;
                if (message.data.description)
                  updates.description = message.data.description;
                if (message.data.projectKey)
                  updates.selectedProject = message.data.projectKey;
                if (message.data.labels)
                  updates.labelsInput = message.data.labels.join(", ");
                if (message.data.priority) {
                  updates.pendingPriority = message.data.priority;
                }
                set(updates);
              }
              break;
          }
        }
      );

      // Load initial data
      postMessage<MessageFromWebview>({ command: "loadProjects" });
      postMessage<MessageFromWebview>({ command: "loadUsers" });

      return unsubscribe;
    },

    // --------------------------------------------------------------------------
    // Data Loading
    // --------------------------------------------------------------------------
    loadProjectMeta: (projectKey) => {
      postMessage<MessageFromWebview>({
        command: "loadProjectMeta",
        projectKey,
      });
    },

    // --------------------------------------------------------------------------
    // Form Actions
    // --------------------------------------------------------------------------
    setSelectedProject: (projectKey) => {
      set({ selectedProject: projectKey, issueTypeId: "" });
      if (projectKey) {
        get().loadProjectMeta(projectKey);
      }
    },

    setSummary: (summary) => set({ summary }),
    setDescription: (description) => set({ description }),
    setIssueTypeId: (issueTypeId) => set({ issueTypeId }),
    setPriorityId: (priorityId) => set({ priorityId }),
    setAssigneeId: (assigneeId) => set({ assigneeId }),
    setLabelsInput: (labelsInput) => set({ labelsInput }),

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

export const useJiraProjects = () =>
  useJiraCreateTicketStore((state) => state.projects);
export const useJiraIssueTypes = () =>
  useJiraCreateTicketStore((state) => state.issueTypes);
export const useJiraPriorities = () =>
  useJiraCreateTicketStore((state) => state.priorities);
export const useJiraUsers = () =>
  useJiraCreateTicketStore((state) => state.users);

// Form state selectors
export const useSelectedProject = () =>
  useJiraCreateTicketStore((state) => state.selectedProject);
export const useSummary = () =>
  useJiraCreateTicketStore((state) => state.summary);
export const useDescription = () =>
  useJiraCreateTicketStore((state) => state.description);
export const useIssueTypeId = () =>
  useJiraCreateTicketStore((state) => state.issueTypeId);
export const usePriorityId = () =>
  useJiraCreateTicketStore((state) => state.priorityId);
export const useAssigneeId = () =>
  useJiraCreateTicketStore((state) => state.assigneeId);
export const useLabelsInput = () =>
  useJiraCreateTicketStore((state) => state.labelsInput);
export const useIsCreating = () =>
  useJiraCreateTicketStore((state) => state.isCreating);

// Action hooks (use shallow comparison to prevent infinite re-renders)
export const useJiraCreateTicketActions = () =>
  useJiraCreateTicketStore(
    useShallow((state) => ({
      init: state.init,
      loadProjectMeta: state.loadProjectMeta,
      setSelectedProject: state.setSelectedProject,
      setSummary: state.setSummary,
      setDescription: state.setDescription,
      setIssueTypeId: state.setIssueTypeId,
      setPriorityId: state.setPriorityId,
      setAssigneeId: state.setAssigneeId,
      setLabelsInput: state.setLabelsInput,
      createIssue: state.createIssue,
    }))
  );

