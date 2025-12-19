"use strict";
/**
 * Linear GraphQL Mock Server
 *
 * Uses MSW (Mock Service Worker) to intercept Linear GraphQL API requests
 * and return test fixture data.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.linearMockServer = void 0;
exports.startLinearMockServer = startLinearMockServer;
exports.stopLinearMockServer = stopLinearMockServer;
exports.resetLinearMockServer = resetLinearMockServer;
exports.addLinearMockHandler = addLinearMockHandler;
const msw_1 = require("msw");
const node_1 = require("msw/node");
const fixtures_1 = require("./fixtures");
// Linear API endpoint
const LINEAR_API_URL = "https://api.linear.app/graphql";
// GraphQL handlers
const handlers = [
    // Main GraphQL endpoint handler
    msw_1.graphql.operation(async ({ query, variables }) => {
        // Parse the query to determine what data is requested
        const queryString = query?.toString() || "";
        // Handle viewer query (current user)
        if (queryString.includes("viewer")) {
            return msw_1.HttpResponse.json({
                data: {
                    viewer: {
                        id: fixtures_1.mockViewer.id,
                        name: fixtures_1.mockViewer.name,
                        email: fixtures_1.mockViewer.email,
                        displayName: fixtures_1.mockViewer.displayName,
                        avatarUrl: fixtures_1.mockViewer.avatarUrl,
                    },
                },
            });
        }
        // Handle issues query (assigned issues)
        if (queryString.includes("issues") && !queryString.includes("issue(")) {
            const assignedIssues = fixtures_1.mockIssues.filter((issue) => issue.assignee?.id === fixtures_1.mockViewer.id);
            return msw_1.HttpResponse.json({
                data: {
                    issues: {
                        nodes: assignedIssues.map(formatIssueForResponse),
                        pageInfo: {
                            hasNextPage: false,
                            endCursor: null,
                        },
                    },
                },
            });
        }
        // Handle single issue query by ID
        if (queryString.includes("issue(") && variables?.id) {
            const issue = (0, fixtures_1.getIssueById)(variables.id);
            if (issue) {
                return msw_1.HttpResponse.json({
                    data: {
                        issue: formatIssueForResponse(issue),
                    },
                });
            }
            return msw_1.HttpResponse.json({
                errors: [{ message: "Issue not found" }],
            });
        }
        // Handle teams query
        if (queryString.includes("teams")) {
            return msw_1.HttpResponse.json({
                data: {
                    teams: {
                        nodes: fixtures_1.mockTeams.map((team) => ({
                            id: team.id,
                            name: team.name,
                            key: team.key,
                            description: team.description,
                        })),
                    },
                },
            });
        }
        // Handle projects query
        if (queryString.includes("projects")) {
            return msw_1.HttpResponse.json({
                data: {
                    projects: {
                        nodes: fixtures_1.mockProjects.map((project) => ({
                            id: project.id,
                            name: project.name,
                            description: project.description,
                            state: project.state,
                            slugId: project.slugId,
                        })),
                    },
                },
            });
        }
        // Handle workflow states query
        if (queryString.includes("workflowStates")) {
            return msw_1.HttpResponse.json({
                data: {
                    workflowStates: {
                        nodes: fixtures_1.mockWorkflowStates.map((state) => ({
                            id: state.id,
                            name: state.name,
                            type: state.type,
                            position: state.position,
                            color: state.color,
                        })),
                    },
                },
            });
        }
        // Handle labels query
        if (queryString.includes("issueLabels")) {
            return msw_1.HttpResponse.json({
                data: {
                    issueLabels: {
                        nodes: fixtures_1.mockLabels.map((label) => ({
                            id: label.id,
                            name: label.name,
                            color: label.color,
                        })),
                    },
                },
            });
        }
        // Handle organization query
        if (queryString.includes("organization")) {
            return msw_1.HttpResponse.json({
                data: {
                    organization: {
                        id: fixtures_1.mockOrganization.id,
                        name: fixtures_1.mockOrganization.name,
                        urlKey: fixtures_1.mockOrganization.urlKey,
                    },
                },
            });
        }
        // Handle issue search
        if (queryString.includes("searchIssues") || queryString.includes("issueSearch")) {
            const searchQuery = variables?.query || "";
            const results = (0, fixtures_1.searchIssues)(searchQuery);
            return msw_1.HttpResponse.json({
                data: {
                    issueSearch: {
                        nodes: results.map(formatIssueForResponse),
                        pageInfo: {
                            hasNextPage: false,
                            endCursor: null,
                        },
                    },
                },
            });
        }
        // Handle issue create mutation
        if (queryString.includes("issueCreate")) {
            const input = variables?.input;
            const newIssue = {
                id: `issue-${Date.now()}`,
                identifier: `ENG-${100 + fixtures_1.mockIssues.length + 1}`,
                title: input?.title || "New Issue",
                description: input?.description,
                priority: input?.priority || 0,
                priorityLabel: "No priority",
                state: fixtures_1.mockWorkflowStates[0],
                assignee: fixtures_1.mockViewer,
                team: fixtures_1.mockTeams[0],
                labels: { nodes: [] },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                url: `https://linear.app/test-org/issue/ENG-${100 + fixtures_1.mockIssues.length + 1}`,
                attachments: { nodes: [] },
                comments: { nodes: [] },
            };
            return msw_1.HttpResponse.json({
                data: {
                    issueCreate: {
                        success: true,
                        issue: formatIssueForResponse(newIssue),
                    },
                },
            });
        }
        // Handle issue update mutation
        if (queryString.includes("issueUpdate")) {
            const issueId = variables?.id;
            const input = variables?.input;
            const issue = (0, fixtures_1.getIssueById)(issueId);
            if (issue) {
                // Update the issue (in a real test, we'd modify the fixture)
                return msw_1.HttpResponse.json({
                    data: {
                        issueUpdate: {
                            success: true,
                            issue: formatIssueForResponse({
                                ...issue,
                                ...(input?.title && { title: input.title }),
                                ...(input?.description && { description: input.description }),
                                updatedAt: new Date().toISOString(),
                            }),
                        },
                    },
                });
            }
            return msw_1.HttpResponse.json({
                errors: [{ message: "Issue not found" }],
            });
        }
        // Handle comment create mutation
        if (queryString.includes("commentCreate")) {
            return msw_1.HttpResponse.json({
                data: {
                    commentCreate: {
                        success: true,
                        comment: {
                            id: `comment-${Date.now()}`,
                            body: variables?.input?.body || "",
                            createdAt: new Date().toISOString(),
                            user: fixtures_1.mockViewer,
                        },
                    },
                },
            });
        }
        // Default: return empty data
        console.warn("Unhandled GraphQL query:", queryString);
        return msw_1.HttpResponse.json({
            data: {},
        });
    }),
    // Fallback HTTP handler for any Linear API requests
    msw_1.http.post(LINEAR_API_URL, async ({ request }) => {
        const body = await request.json();
        // This shouldn't be reached if graphql handler works, but just in case
        console.warn("HTTP fallback for Linear API:", body?.query);
        return msw_1.HttpResponse.json({
            data: {},
        });
    }),
];
/**
 * Format issue for GraphQL response
 */
function formatIssueForResponse(issue) {
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
exports.linearMockServer = (0, node_1.setupServer)(...handlers);
// Helper functions for test setup
function startLinearMockServer() {
    exports.linearMockServer.listen({
        onUnhandledRequest: "warn",
    });
}
function stopLinearMockServer() {
    exports.linearMockServer.close();
}
function resetLinearMockServer() {
    exports.linearMockServer.resetHandlers();
}
// Add a custom handler for specific tests
function addLinearMockHandler(handler) {
    exports.linearMockServer.use(handler);
}
exports.default = {
    linearMockServer: exports.linearMockServer,
    startLinearMockServer,
    stopLinearMockServer,
    resetLinearMockServer,
    addLinearMockHandler,
};
//# sourceMappingURL=server.js.map