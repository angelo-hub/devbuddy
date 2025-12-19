/**
 * Linear Mock Fixtures
 *
 * Test data for Linear GraphQL API mock server.
 * Includes issues, teams, projects, users, labels, and workflow states.
 */

export interface MockLinearUser {
  id: string;
  name: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface MockLinearTeam {
  id: string;
  name: string;
  key: string;
  description?: string;
}

export interface MockLinearProject {
  id: string;
  name: string;
  description?: string;
  state: string;
  slugId: string;
}

export interface MockLinearLabel {
  id: string;
  name: string;
  color: string;
}

export interface MockLinearWorkflowState {
  id: string;
  name: string;
  type: "backlog" | "unstarted" | "started" | "completed" | "canceled";
  position: number;
  color: string;
}

export interface MockLinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  priorityLabel: string;
  estimate?: number;
  state: MockLinearWorkflowState;
  assignee?: MockLinearUser;
  team: MockLinearTeam;
  project?: MockLinearProject;
  labels: { nodes: MockLinearLabel[] };
  createdAt: string;
  updatedAt: string;
  url: string;
  branchName?: string;
  attachments?: {
    nodes: Array<{
      id: string;
      title: string;
      url: string;
      metadata?: Record<string, unknown>;
    }>;
  };
  comments?: {
    nodes: Array<{
      id: string;
      body: string;
      createdAt: string;
      user: MockLinearUser;
    }>;
  };
}

// Mock Users
export const mockUsers: MockLinearUser[] = [
  {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    displayName: "Test User",
    avatarUrl: "https://example.com/avatar1.png",
  },
  {
    id: "user-2",
    name: "Jane Developer",
    email: "jane@example.com",
    displayName: "Jane Developer",
    avatarUrl: "https://example.com/avatar2.png",
  },
];

// Mock Teams
export const mockTeams: MockLinearTeam[] = [
  {
    id: "team-1",
    name: "Engineering",
    key: "ENG",
    description: "Engineering team",
  },
  {
    id: "team-2",
    name: "Product",
    key: "PROD",
    description: "Product team",
  },
];

// Mock Projects
export const mockProjects: MockLinearProject[] = [
  {
    id: "project-1",
    name: "Q1 Sprint",
    description: "Q1 development sprint",
    state: "started",
    slugId: "q1-sprint",
  },
  {
    id: "project-2",
    name: "Bug Fixes",
    description: "Bug fix backlog",
    state: "started",
    slugId: "bug-fixes",
  },
];

// Mock Labels
export const mockLabels: MockLinearLabel[] = [
  { id: "label-1", name: "bug", color: "#FF0000" },
  { id: "label-2", name: "feature", color: "#00FF00" },
  { id: "label-3", name: "enhancement", color: "#0000FF" },
  { id: "label-4", name: "documentation", color: "#FFFF00" },
];

// Mock Workflow States
export const mockWorkflowStates: MockLinearWorkflowState[] = [
  { id: "state-1", name: "Backlog", type: "backlog", position: 0, color: "#95A2B3" },
  { id: "state-2", name: "Todo", type: "unstarted", position: 1, color: "#E2E2E2" },
  { id: "state-3", name: "In Progress", type: "started", position: 2, color: "#F2C94C" },
  { id: "state-4", name: "In Review", type: "started", position: 3, color: "#BB87FC" },
  { id: "state-5", name: "Done", type: "completed", position: 4, color: "#5E6AD2" },
  { id: "state-6", name: "Canceled", type: "canceled", position: 5, color: "#95A2B3" },
];

// Mock Issues
export const mockIssues: MockLinearIssue[] = [
  {
    id: "issue-1",
    identifier: "ENG-101",
    title: "Implement user authentication",
    description: "Add OAuth2 authentication support with Google and GitHub providers",
    priority: 1,
    priorityLabel: "Urgent",
    estimate: 5,
    state: mockWorkflowStates[2], // In Progress
    assignee: mockUsers[0],
    team: mockTeams[0],
    project: mockProjects[0],
    labels: { nodes: [mockLabels[1]] },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://linear.app/test-org/issue/ENG-101",
    branchName: "feat/eng-101-user-auth",
    attachments: { nodes: [] },
    comments: {
      nodes: [
        {
          id: "comment-1",
          body: "Started working on this",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          user: mockUsers[0],
        },
      ],
    },
  },
  {
    id: "issue-2",
    identifier: "ENG-102",
    title: "Fix database connection timeout",
    description: "Connection pool is not properly releasing connections",
    priority: 2,
    priorityLabel: "High",
    estimate: 3,
    state: mockWorkflowStates[1], // Todo
    assignee: mockUsers[0],
    team: mockTeams[0],
    project: mockProjects[1],
    labels: { nodes: [mockLabels[0]] },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://linear.app/test-org/issue/ENG-102",
    attachments: { nodes: [] },
    comments: { nodes: [] },
  },
  {
    id: "issue-3",
    identifier: "ENG-103",
    title: "Add unit tests for payment module",
    description: "Increase test coverage for payment processing",
    priority: 3,
    priorityLabel: "Medium",
    estimate: 8,
    state: mockWorkflowStates[0], // Backlog
    assignee: mockUsers[0],
    team: mockTeams[0],
    labels: { nodes: [mockLabels[2]] },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://linear.app/test-org/issue/ENG-103",
    attachments: { nodes: [] },
    comments: { nodes: [] },
  },
  {
    id: "issue-4",
    identifier: "ENG-104",
    title: "Update documentation for API v2",
    description: "Document all new endpoints and deprecations",
    priority: 4,
    priorityLabel: "Low",
    estimate: 2,
    state: mockWorkflowStates[3], // In Review
    assignee: mockUsers[0],
    team: mockTeams[0],
    project: mockProjects[0],
    labels: { nodes: [mockLabels[3]] },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://linear.app/test-org/issue/ENG-104",
    branchName: "docs/eng-104-api-v2",
    attachments: {
      nodes: [
        {
          id: "pr-1",
          title: "PR: Update API documentation",
          url: "https://github.com/test-org/repo/pull/123",
          metadata: { type: "github-pull-request" },
        },
      ],
    },
    comments: { nodes: [] },
  },
  {
    id: "issue-5",
    identifier: "ENG-105",
    title: "Completed: Setup CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing and deployment",
    priority: 2,
    priorityLabel: "High",
    estimate: 5,
    state: mockWorkflowStates[4], // Done
    assignee: mockUsers[0],
    team: mockTeams[0],
    labels: { nodes: [mockLabels[2]] },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    url: "https://linear.app/test-org/issue/ENG-105",
    attachments: { nodes: [] },
    comments: { nodes: [] },
  },
];

// Current user (for viewer query)
export const mockViewer = mockUsers[0];

// Organization data
export const mockOrganization = {
  id: "org-1",
  name: "Test Organization",
  urlKey: "test-org",
};

// Helper functions for filtering and searching
export function getIssuesByState(
  stateType: MockLinearWorkflowState["type"]
): MockLinearIssue[] {
  return mockIssues.filter((issue) => issue.state.type === stateType);
}

export function getIssueByIdentifier(
  identifier: string
): MockLinearIssue | undefined {
  return mockIssues.find((issue) => issue.identifier === identifier);
}

export function getIssueById(id: string): MockLinearIssue | undefined {
  return mockIssues.find((issue) => issue.id === id);
}

export function searchIssues(query: string): MockLinearIssue[] {
  const lowerQuery = query.toLowerCase();
  return mockIssues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(lowerQuery) ||
      issue.identifier.toLowerCase().includes(lowerQuery) ||
      issue.description?.toLowerCase().includes(lowerQuery)
  );
}

export default {
  mockUsers,
  mockTeams,
  mockProjects,
  mockLabels,
  mockWorkflowStates,
  mockIssues,
  mockViewer,
  mockOrganization,
  getIssuesByState,
  getIssueByIdentifier,
  getIssueById,
  searchIssues,
};
