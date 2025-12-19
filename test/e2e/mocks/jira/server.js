"use strict";
/**
 * Jira REST API Mock Server
 *
 * Uses MSW (Mock Service Worker) to intercept Jira REST API requests
 * and return test fixture data.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jiraMockServer = void 0;
exports.startJiraMockServer = startJiraMockServer;
exports.stopJiraMockServer = stopJiraMockServer;
exports.resetJiraMockServer = resetJiraMockServer;
exports.addJiraMockHandler = addJiraMockHandler;
const msw_1 = require("msw");
const node_1 = require("msw/node");
const fixtures_1 = require("./fixtures");
// Jira API base URLs (both Cloud and Server patterns)
const JIRA_CLOUD_BASE = "https://*.atlassian.net";
const JIRA_API_PATH = "/rest/api";
// Create handlers for both API versions (2 and 3)
function createJiraHandlers(baseUrl) {
    return [
        // Get myself (current user)
        msw_1.http.get(`${baseUrl}/rest/api/*/myself`, () => {
            return msw_1.HttpResponse.json(fixtures_1.mockJiraCurrentUser);
        }),
        // Search issues (JQL)
        msw_1.http.get(`${baseUrl}/rest/api/*/search`, ({ request }) => {
            const url = new URL(request.url);
            const jql = url.searchParams.get("jql") || "";
            const startAt = parseInt(url.searchParams.get("startAt") || "0");
            const maxResults = parseInt(url.searchParams.get("maxResults") || "50");
            const allIssues = (0, fixtures_1.searchJiraIssues)(jql);
            const paginatedIssues = allIssues.slice(startAt, startAt + maxResults);
            return msw_1.HttpResponse.json({
                startAt,
                maxResults,
                total: allIssues.length,
                issues: paginatedIssues,
            });
        }),
        // POST search (alternative endpoint)
        msw_1.http.post(`${baseUrl}/rest/api/*/search`, async ({ request }) => {
            const body = await request.json();
            const jql = body?.jql || "";
            const startAt = body?.startAt || 0;
            const maxResults = body?.maxResults || 50;
            const allIssues = (0, fixtures_1.searchJiraIssues)(jql);
            const paginatedIssues = allIssues.slice(startAt, startAt + maxResults);
            return msw_1.HttpResponse.json({
                startAt,
                maxResults,
                total: allIssues.length,
                issues: paginatedIssues,
            });
        }),
        // Get single issue by key
        msw_1.http.get(`${baseUrl}/rest/api/*/issue/:issueKey`, ({ params }) => {
            const { issueKey } = params;
            const issue = (0, fixtures_1.getJiraIssueByKey)(issueKey);
            if (issue) {
                return msw_1.HttpResponse.json(issue);
            }
            return msw_1.HttpResponse.json({
                errorMessages: [`Issue does not exist or you do not have permission to see it.`],
                errors: {},
            }, { status: 404 });
        }),
        // Create issue
        msw_1.http.post(`${baseUrl}/rest/api/*/issue`, async ({ request }) => {
            const body = await request.json();
            const fields = body?.fields || {};
            const newIssue = {
                id: `${Date.now()}`,
                key: `TEST-${100 + fixtures_1.mockJiraIssues.length + 1}`,
                self: `${baseUrl}/rest/api/3/issue/${Date.now()}`,
                fields: {
                    summary: fields.summary || "New Issue",
                    description: fields.description || null,
                    status: fixtures_1.mockJiraStatuses[0],
                    priority: fixtures_1.mockJiraPriorities[2],
                    issuetype: fixtures_1.mockJiraIssueTypes[0],
                    assignee: null,
                    reporter: fixtures_1.mockJiraCurrentUser,
                    project: fixtures_1.mockJiraProjects[0],
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    labels: [],
                    comment: { comments: [], total: 0 },
                },
            };
            return msw_1.HttpResponse.json({
                id: newIssue.id,
                key: newIssue.key,
                self: newIssue.self,
            });
        }),
        // Update issue
        msw_1.http.put(`${baseUrl}/rest/api/*/issue/:issueKey`, async ({ params, request }) => {
            const { issueKey } = params;
            const issue = (0, fixtures_1.getJiraIssueByKey)(issueKey);
            if (!issue) {
                return msw_1.HttpResponse.json({
                    errorMessages: ["Issue does not exist"],
                    errors: {},
                }, { status: 404 });
            }
            // In a real test, we'd update the fixture
            return new msw_1.HttpResponse(null, { status: 204 });
        }),
        // Get transitions for an issue
        msw_1.http.get(`${baseUrl}/rest/api/*/issue/:issueKey/transitions`, ({ params }) => {
            const { issueKey } = params;
            const issue = (0, fixtures_1.getJiraIssueByKey)(issueKey);
            if (!issue) {
                return msw_1.HttpResponse.json({
                    errorMessages: ["Issue does not exist"],
                    errors: {},
                }, { status: 404 });
            }
            return msw_1.HttpResponse.json({
                transitions: fixtures_1.mockJiraTransitions,
            });
        }),
        // Perform transition
        msw_1.http.post(`${baseUrl}/rest/api/*/issue/:issueKey/transitions`, async ({ params, request }) => {
            const { issueKey } = params;
            const issue = (0, fixtures_1.getJiraIssueByKey)(issueKey);
            if (!issue) {
                return msw_1.HttpResponse.json({
                    errorMessages: ["Issue does not exist"],
                    errors: {},
                }, { status: 404 });
            }
            return new msw_1.HttpResponse(null, { status: 204 });
        }),
        // Add comment
        msw_1.http.post(`${baseUrl}/rest/api/*/issue/:issueKey/comment`, async ({ params, request }) => {
            const { issueKey } = params;
            const body = await request.json();
            const newComment = {
                id: `comment-${Date.now()}`,
                body: body?.body || "",
                author: fixtures_1.mockJiraCurrentUser,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
            };
            return msw_1.HttpResponse.json(newComment, { status: 201 });
        }),
        // Get all projects
        msw_1.http.get(`${baseUrl}/rest/api/*/project`, () => {
            return msw_1.HttpResponse.json(fixtures_1.mockJiraProjects);
        }),
        // Get single project
        msw_1.http.get(`${baseUrl}/rest/api/*/project/:projectKey`, ({ params }) => {
            const { projectKey } = params;
            const project = fixtures_1.mockJiraProjects.find((p) => p.key === projectKey || p.id === projectKey);
            if (project) {
                return msw_1.HttpResponse.json(project);
            }
            return msw_1.HttpResponse.json({
                errorMessages: ["Project not found"],
                errors: {},
            }, { status: 404 });
        }),
        // Get project statuses
        msw_1.http.get(`${baseUrl}/rest/api/*/project/:projectKey/statuses`, () => {
            return msw_1.HttpResponse.json([
                {
                    id: fixtures_1.mockJiraIssueTypes[0].id,
                    name: fixtures_1.mockJiraIssueTypes[0].name,
                    statuses: fixtures_1.mockJiraStatuses,
                },
            ]);
        }),
        // Get all priorities
        msw_1.http.get(`${baseUrl}/rest/api/*/priority`, () => {
            return msw_1.HttpResponse.json(fixtures_1.mockJiraPriorities);
        }),
        // Get all statuses
        msw_1.http.get(`${baseUrl}/rest/api/*/status`, () => {
            return msw_1.HttpResponse.json(fixtures_1.mockJiraStatuses);
        }),
        // Get issue types
        msw_1.http.get(`${baseUrl}/rest/api/*/issuetype`, () => {
            return msw_1.HttpResponse.json(fixtures_1.mockJiraIssueTypes);
        }),
        // Get issue types for project
        msw_1.http.get(`${baseUrl}/rest/api/*/project/:projectKey/issuetypes`, () => {
            return msw_1.HttpResponse.json(fixtures_1.mockJiraIssueTypes.filter((t) => !t.subtask));
        }),
        // User search
        msw_1.http.get(`${baseUrl}/rest/api/*/user/search`, ({ request }) => {
            const url = new URL(request.url);
            const query = url.searchParams.get("query") || "";
            const matchedUsers = fixtures_1.mockJiraUsers.filter((user) => user.displayName.toLowerCase().includes(query.toLowerCase()) ||
                user.emailAddress.toLowerCase().includes(query.toLowerCase()));
            return msw_1.HttpResponse.json(matchedUsers);
        }),
        // User picker (assignable users)
        msw_1.http.get(`${baseUrl}/rest/api/*/user/assignable/search`, () => {
            return msw_1.HttpResponse.json(fixtures_1.mockJiraUsers);
        }),
        // Server info
        msw_1.http.get(`${baseUrl}/rest/api/*/serverInfo`, () => {
            return msw_1.HttpResponse.json({
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
        msw_1.http.get(`${baseUrl}/rest/api/*/field`, () => {
            return msw_1.HttpResponse.json([
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
exports.jiraMockServer = (0, node_1.setupServer)(...handlers);
// Helper functions for test setup
function startJiraMockServer() {
    exports.jiraMockServer.listen({
        onUnhandledRequest: "warn",
    });
}
function stopJiraMockServer() {
    exports.jiraMockServer.close();
}
function resetJiraMockServer() {
    exports.jiraMockServer.resetHandlers();
}
// Add a custom handler for specific tests
function addJiraMockHandler(handler) {
    exports.jiraMockServer.use(handler);
}
exports.default = {
    jiraMockServer: exports.jiraMockServer,
    startJiraMockServer,
    stopJiraMockServer,
    resetJiraMockServer,
    addJiraMockHandler,
};
//# sourceMappingURL=server.js.map