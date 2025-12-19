/**
 * Jira REST API Mock Server
 *
 * Uses MSW (Mock Service Worker) to intercept Jira REST API requests
 * and return test fixture data.
 */

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  mockJiraIssues,
  mockJiraProjects,
  mockJiraStatuses,
  mockJiraPriorities,
  mockJiraIssueTypes,
  mockJiraTransitions,
  mockJiraCurrentUser,
  mockJiraUsers,
  getJiraIssueByKey,
  getJiraIssueById,
  searchJiraIssues,
  MockJiraIssue,
} from "./fixtures";

// Jira API base URLs (both Cloud and Server patterns)
const JIRA_CLOUD_BASE = "https://*.atlassian.net";
const JIRA_API_PATH = "/rest/api";

// Create handlers for both API versions (2 and 3)
function createJiraHandlers(baseUrl: string) {
  return [
    // Get myself (current user)
    http.get(`${baseUrl}/rest/api/*/myself`, () => {
      return HttpResponse.json(mockJiraCurrentUser);
    }),

    // Search issues (JQL)
    http.get(`${baseUrl}/rest/api/*/search`, ({ request }) => {
      const url = new URL(request.url);
      const jql = url.searchParams.get("jql") || "";
      const startAt = parseInt(url.searchParams.get("startAt") || "0");
      const maxResults = parseInt(url.searchParams.get("maxResults") || "50");

      const allIssues = searchJiraIssues(jql);
      const paginatedIssues = allIssues.slice(startAt, startAt + maxResults);

      return HttpResponse.json({
        startAt,
        maxResults,
        total: allIssues.length,
        issues: paginatedIssues,
      });
    }),

    // POST search (alternative endpoint)
    http.post(`${baseUrl}/rest/api/*/search`, async ({ request }) => {
      const body = await request.json() as { jql?: string; startAt?: number; maxResults?: number };
      const jql = body?.jql || "";
      const startAt = body?.startAt || 0;
      const maxResults = body?.maxResults || 50;

      const allIssues = searchJiraIssues(jql);
      const paginatedIssues = allIssues.slice(startAt, startAt + maxResults);

      return HttpResponse.json({
        startAt,
        maxResults,
        total: allIssues.length,
        issues: paginatedIssues,
      });
    }),

    // Get single issue by key
    http.get(`${baseUrl}/rest/api/*/issue/:issueKey`, ({ params }) => {
      const { issueKey } = params;
      const issue = getJiraIssueByKey(issueKey as string);

      if (issue) {
        return HttpResponse.json(issue);
      }

      return HttpResponse.json(
        {
          errorMessages: [`Issue does not exist or you do not have permission to see it.`],
          errors: {},
        },
        { status: 404 }
      );
    }),

    // Create issue
    http.post(`${baseUrl}/rest/api/*/issue`, async ({ request }) => {
      const body = await request.json() as { fields?: Record<string, unknown> };
      const fields = body?.fields || {};

      const newIssue: MockJiraIssue = {
        id: `${Date.now()}`,
        key: `TEST-${100 + mockJiraIssues.length + 1}`,
        self: `${baseUrl}/rest/api/3/issue/${Date.now()}`,
        fields: {
          summary: (fields.summary as string) || "New Issue",
          description: (fields.description as string) || null,
          status: mockJiraStatuses[0],
          priority: mockJiraPriorities[2],
          issuetype: mockJiraIssueTypes[0],
          assignee: null,
          reporter: mockJiraCurrentUser,
          project: mockJiraProjects[0],
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          labels: [],
          comment: { comments: [], total: 0 },
        },
      };

      return HttpResponse.json({
        id: newIssue.id,
        key: newIssue.key,
        self: newIssue.self,
      });
    }),

    // Update issue
    http.put(`${baseUrl}/rest/api/*/issue/:issueKey`, async ({ params, request }) => {
      const { issueKey } = params;
      const issue = getJiraIssueByKey(issueKey as string);

      if (!issue) {
        return HttpResponse.json(
          {
            errorMessages: ["Issue does not exist"],
            errors: {},
          },
          { status: 404 }
        );
      }

      // In a real test, we'd update the fixture
      return new HttpResponse(null, { status: 204 });
    }),

    // Get transitions for an issue
    http.get(`${baseUrl}/rest/api/*/issue/:issueKey/transitions`, ({ params }) => {
      const { issueKey } = params;
      const issue = getJiraIssueByKey(issueKey as string);

      if (!issue) {
        return HttpResponse.json(
          {
            errorMessages: ["Issue does not exist"],
            errors: {},
          },
          { status: 404 }
        );
      }

      return HttpResponse.json({
        transitions: mockJiraTransitions,
      });
    }),

    // Perform transition
    http.post(`${baseUrl}/rest/api/*/issue/:issueKey/transitions`, async ({ params, request }) => {
      const { issueKey } = params;
      const issue = getJiraIssueByKey(issueKey as string);

      if (!issue) {
        return HttpResponse.json(
          {
            errorMessages: ["Issue does not exist"],
            errors: {},
          },
          { status: 404 }
        );
      }

      return new HttpResponse(null, { status: 204 });
    }),

    // Add comment
    http.post(`${baseUrl}/rest/api/*/issue/:issueKey/comment`, async ({ params, request }) => {
      const { issueKey } = params;
      const body = await request.json() as { body?: string };

      const newComment = {
        id: `comment-${Date.now()}`,
        body: body?.body || "",
        author: mockJiraCurrentUser,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      return HttpResponse.json(newComment, { status: 201 });
    }),

    // Get all projects
    http.get(`${baseUrl}/rest/api/*/project`, () => {
      return HttpResponse.json(mockJiraProjects);
    }),

    // Get single project
    http.get(`${baseUrl}/rest/api/*/project/:projectKey`, ({ params }) => {
      const { projectKey } = params;
      const project = mockJiraProjects.find(
        (p) => p.key === projectKey || p.id === projectKey
      );

      if (project) {
        return HttpResponse.json(project);
      }

      return HttpResponse.json(
        {
          errorMessages: ["Project not found"],
          errors: {},
        },
        { status: 404 }
      );
    }),

    // Get project statuses
    http.get(`${baseUrl}/rest/api/*/project/:projectKey/statuses`, () => {
      return HttpResponse.json([
        {
          id: mockJiraIssueTypes[0].id,
          name: mockJiraIssueTypes[0].name,
          statuses: mockJiraStatuses,
        },
      ]);
    }),

    // Get all priorities
    http.get(`${baseUrl}/rest/api/*/priority`, () => {
      return HttpResponse.json(mockJiraPriorities);
    }),

    // Get all statuses
    http.get(`${baseUrl}/rest/api/*/status`, () => {
      return HttpResponse.json(mockJiraStatuses);
    }),

    // Get issue types
    http.get(`${baseUrl}/rest/api/*/issuetype`, () => {
      return HttpResponse.json(mockJiraIssueTypes);
    }),

    // Get issue types for project
    http.get(`${baseUrl}/rest/api/*/project/:projectKey/issuetypes`, () => {
      return HttpResponse.json(mockJiraIssueTypes.filter((t) => !t.subtask));
    }),

    // User search
    http.get(`${baseUrl}/rest/api/*/user/search`, ({ request }) => {
      const url = new URL(request.url);
      const query = url.searchParams.get("query") || "";

      const matchedUsers = mockJiraUsers.filter(
        (user) =>
          user.displayName.toLowerCase().includes(query.toLowerCase()) ||
          user.emailAddress.toLowerCase().includes(query.toLowerCase())
      );

      return HttpResponse.json(matchedUsers);
    }),

    // User picker (assignable users)
    http.get(`${baseUrl}/rest/api/*/user/assignable/search`, () => {
      return HttpResponse.json(mockJiraUsers);
    }),

    // Server info
    http.get(`${baseUrl}/rest/api/*/serverInfo`, () => {
      return HttpResponse.json({
        baseUrl: baseUrl,
        version: "9.0.0",
        versionNumbers: [9, 0, 0],
        deploymentType: "Cloud",
        buildNumber: 100000,
        buildDate: new Date().toISOString(),
        serverTime: new Date().toISOString(),
        scmInfo: "test",
        serverTitle: "Test Jira Server",
      });
    }),

    // Fields (for custom fields)
    http.get(`${baseUrl}/rest/api/*/field`, () => {
      return HttpResponse.json([
        { id: "summary", name: "Summary", custom: false },
        { id: "description", name: "Description", custom: false },
        { id: "status", name: "Status", custom: false },
        { id: "priority", name: "Priority", custom: false },
        { id: "assignee", name: "Assignee", custom: false },
        { id: "reporter", name: "Reporter", custom: false },
      ]);
    }),
  ];
}

// Create handlers for the standard test URL
const handlers = [
  ...createJiraHandlers("https://test.atlassian.net"),
  // Also handle any *.atlassian.net requests
  ...createJiraHandlers("https://*"),
];

// Create and export the server
export const jiraMockServer = setupServer(...handlers);

// Helper functions for test setup
export function startJiraMockServer(): void {
  jiraMockServer.listen({
    onUnhandledRequest: "warn",
  });
}

export function stopJiraMockServer(): void {
  jiraMockServer.close();
}

export function resetJiraMockServer(): void {
  jiraMockServer.resetHandlers();
}

// Add a custom handler for specific tests
export function addJiraMockHandler(
  handler: ReturnType<typeof http.get> | ReturnType<typeof http.post>
): void {
  jiraMockServer.use(handler);
}

export default {
  jiraMockServer,
  startJiraMockServer,
  stopJiraMockServer,
  resetJiraMockServer,
  addJiraMockHandler,
};
