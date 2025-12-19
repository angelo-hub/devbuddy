/**
 * Jira Mock Fixtures
 *
 * Test data for Jira REST API mock server.
 * Includes issues, projects, users, statuses, and priorities.
 */

export interface MockJiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  avatarUrls: {
    "48x48": string;
    "24x24": string;
    "16x16": string;
    "32x32": string;
  };
  active: boolean;
}

export interface MockJiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  lead: MockJiraUser;
  projectTypeKey: string;
}

export interface MockJiraStatus {
  id: string;
  name: string;
  description?: string;
  statusCategory: {
    id: number;
    key: string;
    colorName: string;
    name: string;
  };
}

export interface MockJiraPriority {
  id: string;
  name: string;
  description?: string;
  iconUrl: string;
}

export interface MockJiraIssueType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  subtask: boolean;
}

export interface MockJiraTransition {
  id: string;
  name: string;
  to: MockJiraStatus;
}

export interface MockJiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description: string | null;
    status: MockJiraStatus;
    priority: MockJiraPriority;
    issuetype: MockJiraIssueType;
    assignee: MockJiraUser | null;
    reporter: MockJiraUser;
    project: MockJiraProject;
    created: string;
    updated: string;
    labels: string[];
    comment?: {
      comments: Array<{
        id: string;
        body: string;
        author: MockJiraUser;
        created: string;
        updated: string;
      }>;
      total: number;
    };
  };
}

// Mock Users
export const mockJiraUsers: MockJiraUser[] = [
  {
    accountId: "user-jira-1",
    displayName: "Test User",
    emailAddress: "test@example.com",
    avatarUrls: {
      "48x48": "https://example.com/avatar1-48.png",
      "24x24": "https://example.com/avatar1-24.png",
      "16x16": "https://example.com/avatar1-16.png",
      "32x32": "https://example.com/avatar1-32.png",
    },
    active: true,
  },
  {
    accountId: "user-jira-2",
    displayName: "Jane Developer",
    emailAddress: "jane@example.com",
    avatarUrls: {
      "48x48": "https://example.com/avatar2-48.png",
      "24x24": "https://example.com/avatar2-24.png",
      "16x16": "https://example.com/avatar2-16.png",
      "32x32": "https://example.com/avatar2-32.png",
    },
    active: true,
  },
];

// Mock Projects
export const mockJiraProjects: MockJiraProject[] = [
  {
    id: "10001",
    key: "TEST",
    name: "Test Project",
    description: "A test project for E2E testing",
    lead: mockJiraUsers[0],
    projectTypeKey: "software",
  },
  {
    id: "10002",
    key: "DEV",
    name: "Development Project",
    description: "Development project",
    lead: mockJiraUsers[1],
    projectTypeKey: "software",
  },
];

// Mock Statuses
export const mockJiraStatuses: MockJiraStatus[] = [
  {
    id: "1",
    name: "Open",
    description: "Issue is open and unassigned",
    statusCategory: {
      id: 2,
      key: "new",
      colorName: "blue-gray",
      name: "To Do",
    },
  },
  {
    id: "3",
    name: "In Progress",
    description: "Work is in progress",
    statusCategory: {
      id: 4,
      key: "indeterminate",
      colorName: "yellow",
      name: "In Progress",
    },
  },
  {
    id: "4",
    name: "In Review",
    description: "Awaiting code review",
    statusCategory: {
      id: 4,
      key: "indeterminate",
      colorName: "yellow",
      name: "In Progress",
    },
  },
  {
    id: "5",
    name: "Done",
    description: "Work is complete",
    statusCategory: {
      id: 3,
      key: "done",
      colorName: "green",
      name: "Done",
    },
  },
];

// Mock Priorities
export const mockJiraPriorities: MockJiraPriority[] = [
  {
    id: "1",
    name: "Highest",
    description: "This problem will block progress",
    iconUrl: "https://example.com/icons/priority-highest.svg",
  },
  {
    id: "2",
    name: "High",
    description: "Serious problem that could block progress",
    iconUrl: "https://example.com/icons/priority-high.svg",
  },
  {
    id: "3",
    name: "Medium",
    description: "Has the potential to affect progress",
    iconUrl: "https://example.com/icons/priority-medium.svg",
  },
  {
    id: "4",
    name: "Low",
    description: "Minor problem or easily worked around",
    iconUrl: "https://example.com/icons/priority-low.svg",
  },
  {
    id: "5",
    name: "Lowest",
    description: "Trivial problem with little or no impact",
    iconUrl: "https://example.com/icons/priority-lowest.svg",
  },
];

// Mock Issue Types
export const mockJiraIssueTypes: MockJiraIssueType[] = [
  {
    id: "10001",
    name: "Story",
    description: "A user story",
    iconUrl: "https://example.com/icons/story.svg",
    subtask: false,
  },
  {
    id: "10002",
    name: "Bug",
    description: "A bug or defect",
    iconUrl: "https://example.com/icons/bug.svg",
    subtask: false,
  },
  {
    id: "10003",
    name: "Task",
    description: "A task",
    iconUrl: "https://example.com/icons/task.svg",
    subtask: false,
  },
  {
    id: "10004",
    name: "Sub-task",
    description: "A sub-task",
    iconUrl: "https://example.com/icons/subtask.svg",
    subtask: true,
  },
];

// Mock Transitions
export const mockJiraTransitions: MockJiraTransition[] = [
  { id: "11", name: "To Do", to: mockJiraStatuses[0] },
  { id: "21", name: "In Progress", to: mockJiraStatuses[1] },
  { id: "31", name: "In Review", to: mockJiraStatuses[2] },
  { id: "41", name: "Done", to: mockJiraStatuses[3] },
];

// Mock Issues
export const mockJiraIssues: MockJiraIssue[] = [
  {
    id: "10001",
    key: "TEST-101",
    self: "https://test.atlassian.net/rest/api/3/issue/10001",
    fields: {
      summary: "Implement user authentication",
      description: "Add OAuth2 authentication support with Google and GitHub providers",
      status: mockJiraStatuses[1], // In Progress
      priority: mockJiraPriorities[1], // High
      issuetype: mockJiraIssueTypes[0], // Story
      assignee: mockJiraUsers[0],
      reporter: mockJiraUsers[0],
      project: mockJiraProjects[0],
      created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      labels: ["authentication", "oauth"],
      comment: {
        comments: [
          {
            id: "comment-1",
            body: "Started working on this",
            author: mockJiraUsers[0],
            created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        total: 1,
      },
    },
  },
  {
    id: "10002",
    key: "TEST-102",
    self: "https://test.atlassian.net/rest/api/3/issue/10002",
    fields: {
      summary: "Fix database connection timeout",
      description: "Connection pool is not properly releasing connections",
      status: mockJiraStatuses[0], // Open
      priority: mockJiraPriorities[0], // Highest
      issuetype: mockJiraIssueTypes[1], // Bug
      assignee: mockJiraUsers[0],
      reporter: mockJiraUsers[1],
      project: mockJiraProjects[0],
      created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      labels: ["bug", "database"],
      comment: { comments: [], total: 0 },
    },
  },
  {
    id: "10003",
    key: "TEST-103",
    self: "https://test.atlassian.net/rest/api/3/issue/10003",
    fields: {
      summary: "Add unit tests for payment module",
      description: "Increase test coverage for payment processing",
      status: mockJiraStatuses[0], // Open
      priority: mockJiraPriorities[2], // Medium
      issuetype: mockJiraIssueTypes[2], // Task
      assignee: mockJiraUsers[0],
      reporter: mockJiraUsers[0],
      project: mockJiraProjects[0],
      created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      labels: ["testing"],
      comment: { comments: [], total: 0 },
    },
  },
  {
    id: "10004",
    key: "TEST-104",
    self: "https://test.atlassian.net/rest/api/3/issue/10004",
    fields: {
      summary: "Update documentation for API v2",
      description: "Document all new endpoints and deprecations",
      status: mockJiraStatuses[2], // In Review
      priority: mockJiraPriorities[3], // Low
      issuetype: mockJiraIssueTypes[2], // Task
      assignee: mockJiraUsers[0],
      reporter: mockJiraUsers[1],
      project: mockJiraProjects[0],
      created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      labels: ["documentation"],
      comment: { comments: [], total: 0 },
    },
  },
  {
    id: "10005",
    key: "TEST-105",
    self: "https://test.atlassian.net/rest/api/3/issue/10005",
    fields: {
      summary: "Completed: Setup CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment",
      status: mockJiraStatuses[3], // Done
      priority: mockJiraPriorities[1], // High
      issuetype: mockJiraIssueTypes[0], // Story
      assignee: mockJiraUsers[0],
      reporter: mockJiraUsers[0],
      project: mockJiraProjects[0],
      created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      labels: ["devops", "ci-cd"],
      comment: { comments: [], total: 0 },
    },
  },
];

// Current user (for myself query)
export const mockJiraCurrentUser = mockJiraUsers[0];

// Helper functions
export function getJiraIssueByKey(key: string): MockJiraIssue | undefined {
  return mockJiraIssues.find((issue) => issue.key === key);
}

export function getJiraIssueById(id: string): MockJiraIssue | undefined {
  return mockJiraIssues.find((issue) => issue.id === id);
}

export function searchJiraIssues(jql: string): MockJiraIssue[] {
  // Simple JQL parsing for tests
  const lowerJql = jql.toLowerCase();

  // Filter by assignee
  if (lowerJql.includes("assignee = currentuser()")) {
    return mockJiraIssues.filter(
      (issue) => issue.fields.assignee?.accountId === mockJiraCurrentUser.accountId
    );
  }

  // Filter by project
  const projectMatch = jql.match(/project\s*=\s*["']?(\w+)["']?/i);
  if (projectMatch) {
    const projectKey = projectMatch[1].toUpperCase();
    return mockJiraIssues.filter(
      (issue) => issue.fields.project.key === projectKey
    );
  }

  // Filter by status
  const statusMatch = jql.match(/status\s*=\s*["']?([^"']+)["']?/i);
  if (statusMatch) {
    const statusName = statusMatch[1];
    return mockJiraIssues.filter(
      (issue) =>
        issue.fields.status.name.toLowerCase() === statusName.toLowerCase()
    );
  }

  // Default: return all issues
  return mockJiraIssues;
}

export function getIssuesByStatus(
  statusName: string
): MockJiraIssue[] {
  return mockJiraIssues.filter(
    (issue) =>
      issue.fields.status.name.toLowerCase() === statusName.toLowerCase()
  );
}

export default {
  mockJiraUsers,
  mockJiraProjects,
  mockJiraStatuses,
  mockJiraPriorities,
  mockJiraIssueTypes,
  mockJiraTransitions,
  mockJiraIssues,
  mockJiraCurrentUser,
  getJiraIssueByKey,
  getJiraIssueById,
  searchJiraIssues,
  getIssuesByStatus,
};
