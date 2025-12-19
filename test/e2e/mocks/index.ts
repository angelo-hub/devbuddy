/**
 * Mocks Index
 *
 * Export all mock server functionality for easy importing in tests.
 */

// Mock Manager
export {
  MockManager,
  mockManager,
  startMockServers,
  stopMockServers,
  resetMockServers,
  setupMockServerHooks,
  withMocks,
  MockPlatform,
} from "./mockManager";

// Linear Mocks
export {
  linearMockServer,
  startLinearMockServer,
  stopLinearMockServer,
  resetLinearMockServer,
  addLinearMockHandler,
} from "./linear/server";

export {
  mockUsers as linearMockUsers,
  mockTeams as linearMockTeams,
  mockProjects as linearMockProjects,
  mockLabels as linearMockLabels,
  mockWorkflowStates as linearMockWorkflowStates,
  mockIssues as linearMockIssues,
  mockViewer as linearMockViewer,
  mockOrganization as linearMockOrganization,
  getIssuesByState as getLinearIssuesByState,
  getIssueByIdentifier as getLinearIssueByIdentifier,
  getIssueById as getLinearIssueById,
  searchIssues as searchLinearIssues,
} from "./linear/fixtures";

// Jira Mocks
export {
  jiraMockServer,
  startJiraMockServer,
  stopJiraMockServer,
  resetJiraMockServer,
  addJiraMockHandler,
} from "./jira/server";

export {
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
  getIssuesByStatus as getJiraIssuesByStatus,
} from "./jira/fixtures";
