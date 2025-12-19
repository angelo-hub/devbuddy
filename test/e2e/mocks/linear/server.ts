/**
 * Linear GraphQL Mock Server
 *
 * Uses MSW (Mock Service Worker) to intercept Linear GraphQL API requests
 * and return test fixture data.
 */

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  mockIssues,
  mockTeams,
  mockProjects,
  mockLabels,
  mockWorkflowStates,
  mockViewer,
  mockOrganization,
  getIssueById,
  searchIssues,
  MockLinearIssue,
} from "./fixtures";

// Linear API endpoint
const LINEAR_API_URL = "https://api.linear.app/graphql";

/**
 * Handle Linear GraphQL request
 */
function handleLinearGraphQL(queryString: string, variables: Record<string, unknown> = {}) {
  // Handle viewer query (current user)
  if (queryString.includes("viewer")) {
    return {
      data: {
        viewer: {
          id: mockViewer.id,
          name: mockViewer.name,
          email: mockViewer.email,
          displayName: mockViewer.displayName,
          avatarUrl: mockViewer.avatarUrl,
        },
      },
    };
  }

  // Handle issues query (assigned issues)
  if (queryString.includes("issues") && !queryString.includes("issue(")) {
    const assignedIssues = mockIssues.filter(
      (issue) => issue.assignee?.id === mockViewer.id
    );

    return {
      data: {
        issues: {
          nodes: assignedIssues.map(formatIssueForResponse),
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
        },
      },
    };
  }

  // Handle single issue query by ID
  if (queryString.includes("issue(") && variables?.id) {
    const issue = getIssueById(variables.id as string);

    if (issue) {
      return {
        data: {
          issue: formatIssueForResponse(issue),
        },
      };
    }

    return {
      errors: [{ message: "Issue not found" }],
    };
  }

  // Handle teams query
  if (queryString.includes("teams")) {
    return {
      data: {
        teams: {
          nodes: mockTeams.map((team) => ({
            id: team.id,
            name: team.name,
            key: team.key,
            description: team.description,
          })),
        },
      },
    };
  }

  // Handle projects query
  if (queryString.includes("projects")) {
    return {
      data: {
        projects: {
          nodes: mockProjects.map((project) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            state: project.state,
            slugId: project.slugId,
          })),
        },
      },
    };
  }

  // Handle workflow states query
  if (queryString.includes("workflowStates")) {
    return {
      data: {
        workflowStates: {
          nodes: mockWorkflowStates.map((state) => ({
            id: state.id,
            name: state.name,
            type: state.type,
            position: state.position,
            color: state.color,
          })),
        },
      },
    };
  }

  // Handle labels query
  if (queryString.includes("issueLabels")) {
    return {
      data: {
        issueLabels: {
          nodes: mockLabels.map((label) => ({
            id: label.id,
            name: label.name,
            color: label.color,
          })),
        },
      },
    };
  }

  // Handle organization query
  if (queryString.includes("organization")) {
    return {
      data: {
        organization: {
          id: mockOrganization.id,
          name: mockOrganization.name,
          urlKey: mockOrganization.urlKey,
        },
      },
    };
  }

  // Handle issue search
  if (queryString.includes("searchIssues") || queryString.includes("issueSearch")) {
    const searchQuery = (variables?.query as string) || "";
    const results = searchIssues(searchQuery);

    return {
      data: {
        issueSearch: {
          nodes: results.map(formatIssueForResponse),
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
        },
      },
    };
  }

  // Handle issue create mutation
  if (queryString.includes("issueCreate")) {
    const input = variables?.input as Record<string, unknown>;
    const newIssue: MockLinearIssue = {
      id: `issue-${Date.now()}`,
      identifier: `ENG-${100 + mockIssues.length + 1}`,
      title: (input?.title as string) || "New Issue",
      description: input?.description as string,
      priority: (input?.priority as number) || 0,
      priorityLabel: "No priority",
      state: mockWorkflowStates[0],
      assignee: mockViewer,
      team: mockTeams[0],
      labels: { nodes: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      url: `https://linear.app/test-org/issue/ENG-${100 + mockIssues.length + 1}`,
      attachments: { nodes: [] },
      comments: { nodes: [] },
    };

    return {
      data: {
        issueCreate: {
          success: true,
          issue: formatIssueForResponse(newIssue),
        },
      },
    };
  }

  // Handle issue update mutation
  if (queryString.includes("issueUpdate")) {
    const issueId = variables?.id as string;
    const input = variables?.input as Record<string, unknown>;
    const issue = getIssueById(issueId);

    if (issue) {
      const updatedIssue = {
        ...issue,
        title: (input?.title as string) || issue.title,
        description: (input?.description as string) || issue.description,
        updatedAt: new Date().toISOString(),
      };

      return {
        data: {
          issueUpdate: {
            success: true,
            issue: formatIssueForResponse(updatedIssue),
          },
        },
      };
    }

    return {
      errors: [{ message: "Issue not found" }],
    };
  }

  // Handle comment create mutation
  if (queryString.includes("commentCreate")) {
    const input = variables?.input as Record<string, unknown>;
    return {
      data: {
        commentCreate: {
          success: true,
          comment: {
            id: `comment-${Date.now()}`,
            body: (input?.body as string) || "",
            createdAt: new Date().toISOString(),
            user: mockViewer,
          },
        },
      },
    };
  }

  // Default: return empty data
  console.warn("Unhandled GraphQL query:", queryString);
  return { data: {} };
}

// HTTP handlers for Linear API
const handlers = [
  // Linear GraphQL endpoint
  http.post(LINEAR_API_URL, async ({ request }) => {
    const body = await request.json() as { query?: string; variables?: Record<string, unknown> };
    const queryString = body?.query || "";
    const variables = body?.variables || {};

    const response = handleLinearGraphQL(queryString, variables);
    return HttpResponse.json(response);
  }),
];

/**
 * Format issue for GraphQL response
 */
function formatIssueForResponse(issue: MockLinearIssue) {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    priorityLabel: issue.priorityLabel,
    estimate: issue.estimate,
    state: {
      id: issue.state.id,
      name: issue.state.name,
      type: issue.state.type,
      color: issue.state.color,
    },
    assignee: issue.assignee
      ? {
          id: issue.assignee.id,
          name: issue.assignee.name,
          email: issue.assignee.email,
          displayName: issue.assignee.displayName,
          avatarUrl: issue.assignee.avatarUrl,
        }
      : null,
    team: {
      id: issue.team.id,
      name: issue.team.name,
      key: issue.team.key,
    },
    project: issue.project
      ? {
          id: issue.project.id,
          name: issue.project.name,
          slugId: issue.project.slugId,
        }
      : null,
    labels: {
      nodes: issue.labels.nodes.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
      })),
    },
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    url: issue.url,
    branchName: issue.branchName,
    attachments: issue.attachments,
    comments: issue.comments,
  };
}

// Create and export the server
export const linearMockServer = setupServer(...handlers);

// Helper functions for test setup
export function startLinearMockServer(): void {
  linearMockServer.listen({
    onUnhandledRequest: "warn",
  });
}

export function stopLinearMockServer(): void {
  linearMockServer.close();
}

export function resetLinearMockServer(): void {
  linearMockServer.resetHandlers();
}

// Add a custom handler for specific tests
export function addLinearMockHandler(
  handler: ReturnType<typeof http.post>
): void {
  linearMockServer.use(handler);
}

export default {
  linearMockServer,
  startLinearMockServer,
  stopLinearMockServer,
  resetLinearMockServer,
  addLinearMockHandler,
};
