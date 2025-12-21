/**
 * Types for Standup Builder Store
 */

// ============================================================================
// Data Types
// ============================================================================

export interface LinearTicket {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
}

export interface ResultsData {
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
}

export interface GenerateData {
  timeWindow: string;
  targetBranch: string;
  tickets: string;
  mode: string;
  selectedTicket?: string;
  ticketContext?: LinearTicket;
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageFromExtension =
  | { command: "ticketsLoaded"; tickets: LinearTicket[]; error?: string }
  | { command: "progress"; message: string }
  | { command: "error"; message: string }
  | { command: "results"; data: ResultsData };

export type MessageFromWebview =
  | { command: "loadTickets" }
  | { command: "generate"; data: GenerateData }
  | { command: "copy"; text: string }
  | { command: "openSettings" };

