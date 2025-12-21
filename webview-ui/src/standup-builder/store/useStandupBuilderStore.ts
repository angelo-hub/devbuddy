/**
 * Standup Builder Store
 *
 * Centralized state management for the standup builder panel.
 */

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { postMessage, createMessageSubscription } from "@shared/stores";
import {
  LinearTicket,
  ResultsData,
  MessageFromExtension,
  MessageFromWebview,
} from "./types";

// ============================================================================
// Store State Interface
// ============================================================================

interface StandupBuilderState {
  // Form state
  mode: "single" | "multi";
  timeWindow: string;
  targetBranch: string;
  tickets: string;
  selectedTicket: string;

  // Tickets data
  linearTickets: LinearTicket[];
  ticketsLoading: boolean;

  // Generation state
  isGenerating: boolean;
  progressMessage: string;
  error: string;

  // Results
  results: ResultsData | null;
}

// ============================================================================
// Store Actions Interface
// ============================================================================

interface StandupBuilderActions {
  // Initialization
  init: () => () => void;

  // Form actions
  setMode: (mode: "single" | "multi") => void;
  setTimeWindow: (timeWindow: string) => void;
  setTargetBranch: (targetBranch: string) => void;
  setTickets: (tickets: string) => void;
  setSelectedTicket: (selectedTicket: string) => void;

  // Generation
  generate: () => void;

  // Copy actions
  copyAll: () => void;
  copyAnswers: () => void;

  // Settings
  openSettings: () => void;
}

// ============================================================================
// Store Type
// ============================================================================

export type StandupBuilderStore = StandupBuilderState & StandupBuilderActions;

// ============================================================================
// Initial State
// ============================================================================

const getInitialState = (): StandupBuilderState => ({
  mode: "single",
  timeWindow: "24 hours ago",
  targetBranch: "main",
  tickets: "",
  selectedTicket: "",
  linearTickets: [],
  ticketsLoading: true,
  isGenerating: false,
  progressMessage: "",
  error: "",
  results: null,
});

// ============================================================================
// Store Implementation
// ============================================================================

export const useStandupBuilderStore = create<StandupBuilderStore>()(
  (set, get) => ({
    ...getInitialState(),

    // --------------------------------------------------------------------------
    // Initialization
    // --------------------------------------------------------------------------
    init: () => {
      const unsubscribe = createMessageSubscription<MessageFromExtension>(
        (message) => {
          switch (message.command) {
            case "ticketsLoaded":
              set({
                linearTickets: message.tickets,
                ticketsLoading: false,
              });
              if (message.error) {
                console.log("Failed to load tickets:", message.error);
              }
              break;

            case "progress":
              set({ progressMessage: message.message });
              break;

            case "error":
              set({
                error: message.message,
                isGenerating: false,
                progressMessage: "",
              });
              break;

            case "results":
              set({
                results: message.data,
                isGenerating: false,
                progressMessage: "",
              });
              break;
          }
        }
      );

      // Load tickets on init
      postMessage<MessageFromWebview>({ command: "loadTickets" });

      return unsubscribe;
    },

    // --------------------------------------------------------------------------
    // Form Actions
    // --------------------------------------------------------------------------
    setMode: (mode) => set({ mode }),
    setTimeWindow: (timeWindow) => set({ timeWindow }),
    setTargetBranch: (targetBranch) => set({ targetBranch }),
    setTickets: (tickets) => set({ tickets }),
    setSelectedTicket: (selectedTicket) => set({ selectedTicket }),

    // --------------------------------------------------------------------------
    // Generation
    // --------------------------------------------------------------------------
    generate: () => {
      const state = get();
      set({ isGenerating: true, error: "", results: null });

      const selectedTicketData = state.linearTickets.find(
        (t) => t.id === state.selectedTicket
      );

      postMessage<MessageFromWebview>({
        command: "generate",
        data: {
          timeWindow: state.timeWindow,
          targetBranch: state.targetBranch,
          tickets: state.tickets,
          mode: state.mode,
          selectedTicket: state.selectedTicket,
          ticketContext: selectedTicketData,
        },
      });
    },

    // --------------------------------------------------------------------------
    // Copy Actions
    // --------------------------------------------------------------------------
    copyAll: () => {
      const { results } = get();
      if (!results) return;

      const text = `**Daily Standup Update**\n${"=".repeat(50)}\n\nWhat did you do since the previous update?\n${results.whatDidYouDo}\n\nWhat are you going to do today?\n${results.whatWillYouDo}\n\nAre you reaching any blockers?\n${results.blockers}`;

      postMessage<MessageFromWebview>({ command: "copy", text });
    },

    copyAnswers: () => {
      const { results } = get();
      if (!results) return;

      const text = `What did you do?\n${results.whatDidYouDo}\n\nWhat will you do?\n${results.whatWillYouDo}\n\nBlockers?\n${results.blockers}`;

      postMessage<MessageFromWebview>({ command: "copy", text });
    },

    // --------------------------------------------------------------------------
    // Settings
    // --------------------------------------------------------------------------
    openSettings: () => {
      postMessage<MessageFromWebview>({ command: "openSettings" });
    },
  })
);

// ============================================================================
// Selector Hooks
// ============================================================================

// Form state selectors
export const useMode = () => useStandupBuilderStore((state) => state.mode);
export const useTimeWindow = () =>
  useStandupBuilderStore((state) => state.timeWindow);
export const useTargetBranch = () =>
  useStandupBuilderStore((state) => state.targetBranch);
export const useTickets = () =>
  useStandupBuilderStore((state) => state.tickets);
export const useSelectedTicket = () =>
  useStandupBuilderStore((state) => state.selectedTicket);

// Tickets data selectors
export const useLinearTickets = () =>
  useStandupBuilderStore((state) => state.linearTickets);
export const useTicketsLoading = () =>
  useStandupBuilderStore((state) => state.ticketsLoading);

// Generation state selectors
export const useIsGenerating = () =>
  useStandupBuilderStore((state) => state.isGenerating);
export const useProgressMessage = () =>
  useStandupBuilderStore((state) => state.progressMessage);
export const useError = () => useStandupBuilderStore((state) => state.error);

// Results selector
export const useResults = () =>
  useStandupBuilderStore((state) => state.results);

// Action hooks (use shallow comparison to prevent infinite re-renders)
export const useStandupBuilderActions = () =>
  useStandupBuilderStore(
    useShallow((state) => ({
      init: state.init,
      setMode: state.setMode,
      setTimeWindow: state.setTimeWindow,
      setTargetBranch: state.setTargetBranch,
      setTickets: state.setTickets,
      setSelectedTicket: state.setSelectedTicket,
      generate: state.generate,
      copyAll: state.copyAll,
      copyAnswers: state.copyAnswers,
      openSettings: state.openSettings,
    }))
  );

