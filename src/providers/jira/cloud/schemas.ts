/**
 * Zod Schemas for Jira Cloud API Validation (Zod v4)
 * 
 * Runtime validation for API responses to catch unexpected data structures
 * and provide better error messages.
 * 
 * Compatible with Zod v4.x
 */

import { z } from "zod";

// ==================== Base Schemas ====================

export const JiraApiUserSchema = z.object({
  accountId: z.string(),
  displayName: z.string(),
  emailAddress: z.string().optional(), // Don't validate email format - Jira may have invalid/empty emails
  avatarUrls: z.object({
    "48x48": z.string().url().optional(),
  }).optional(),
  active: z.boolean().optional(),
  timeZone: z.string().optional(),
});

export const JiraApiStatusCategorySchema = z.object({
  id: z.number(),
  key: z.string(),
  colorName: z.string(),
  name: z.string(),
});

export const JiraApiStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  statusCategory: JiraApiStatusCategorySchema,
});

export const JiraApiPrioritySchema = z.object({
  id: z.string(),
  name: z.string(),
  iconUrl: z.string().url().optional(),
});

export const JiraApiIssueTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  iconUrl: z.string().url().optional(),
  subtask: z.boolean(),
});

export const JiraApiProjectSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  avatarUrls: z.object({
    "48x48": z.string().url().optional(),
  }).optional(),
  projectTypeKey: z.string(),
  lead: z.lazy(() => JiraApiUserSchema).optional(),
});

// ADF (Atlassian Document Format) - simplified validation
// Full validation would be complex, so we validate basic structure
// Using z.lazy for recursive types (Zod v4 compatible)
const JiraApiADFNodeBaseSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

export const JiraApiADFNodeSchema: z.ZodType<{
  type: string;
  text?: string;
  content?: Array<{
    type: string;
    text?: string;
    content?: any[];
    [key: string]: any;
  }>;
  [key: string]: any;
}> = JiraApiADFNodeBaseSchema.extend({
  content: z.lazy(() => z.array(JiraApiADFNodeSchema)).optional(),
}).passthrough();

export const JiraApiADFSchema = z.object({
  type: z.string(),
  version: z.number().optional(),
  content: z.array(JiraApiADFNodeSchema).optional(),
  text: z.string().optional(),
}).passthrough();

// ==================== Issue Schemas ====================

export const JiraApiSubtaskSchema = z.object({
  id: z.string(),
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    status: JiraApiStatusSchema,
    issuetype: JiraApiIssueTypeSchema,
  }),
});

// Issue Link Type schema
export const JiraApiIssueLinkTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  inward: z.string(),
  outward: z.string(),
});

// Linked Issue reference schema (simplified issue fields)
export const JiraApiLinkedIssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    status: JiraApiStatusSchema,
    issuetype: JiraApiIssueTypeSchema,
    priority: JiraApiPrioritySchema.optional().nullable(),
  }),
});

// Issue Link schema
export const JiraApiIssueLinkSchema = z.object({
  id: z.string(),
  type: JiraApiIssueLinkTypeSchema,
  inwardIssue: JiraApiLinkedIssueSchema.optional(),
  outwardIssue: JiraApiLinkedIssueSchema.optional(),
});

export const JiraApiCommentSchema = z.object({
  id: z.string(),
  body: z.union([JiraApiADFSchema, z.string()]),
  author: JiraApiUserSchema,
  created: z.string(),
  updated: z.string(),
});

export const JiraApiAttachmentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  created: z.string(),
  author: JiraApiUserSchema,
  content: z.string().url(),
  thumbnail: z.string().url().optional(),
});

export const JiraApiIssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    description: z.union([JiraApiADFSchema, z.string(), z.null()]).optional(),
    issuetype: JiraApiIssueTypeSchema,
    status: JiraApiStatusSchema,
    priority: JiraApiPrioritySchema.optional().nullable(),
    assignee: JiraApiUserSchema.optional().nullable(),
    reporter: JiraApiUserSchema,
    project: JiraApiProjectSchema,
    labels: z.array(z.string()),
    created: z.string(),
    updated: z.string(),
    duedate: z.string().optional().nullable(),
    comment: z.object({
      comments: z.array(JiraApiCommentSchema),
    }).optional(),
    attachment: z.array(JiraApiAttachmentSchema).optional(),
    subtasks: z.array(JiraApiSubtaskSchema).optional(),
    issuelinks: z.array(JiraApiIssueLinkSchema).optional(),
    parent: z.object({
      id: z.string(),
      key: z.string(),
      fields: z.object({
        summary: z.string(),
        status: JiraApiStatusSchema,
        issuetype: JiraApiIssueTypeSchema,
      }),
    }).optional(),
  }),
});

// ==================== Search Response Schema ====================

// New /search/jql endpoint response format (cursor-based pagination)
// See: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post
export const JiraPaginatedIssueResponseSchema = z.object({
  isLast: z.boolean(),
  nextPageToken: z.string().optional(),
  issues: z.array(JiraApiIssueSchema).optional(),
});

// Legacy /search endpoint response format (deprecated, for reference)
export const JiraLegacyPaginatedIssueResponseSchema = z.object({
  startAt: z.number(),
  maxResults: z.number(),
  total: z.number(),
  issues: z.array(JiraApiIssueSchema).optional(),
});

// ==================== Transition Schema ====================

export const JiraApiTransitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  to: JiraApiStatusSchema,
  hasScreen: z.boolean(),
});

export const JiraTransitionsResponseSchema = z.object({
  transitions: z.array(JiraApiTransitionSchema),
});

// ==================== Project Schema ====================

// Project search API returns paginated response
export const JiraProjectsResponseSchema = z.object({
  values: z.array(JiraApiProjectSchema),
  maxResults: z.number().optional(),
  startAt: z.number().optional(),
  total: z.number().optional(),
  isLast: z.boolean().optional(),
});

// ==================== User Schema ====================

export const JiraUsersResponseSchema = z.array(JiraApiUserSchema);

// ==================== Metadata Schemas ====================

export const JiraIssueTypesResponseSchema = z.array(JiraApiIssueTypeSchema);

export const JiraPrioritiesResponseSchema = z.array(JiraApiPrioritySchema);

export const JiraStatusesResponseSchema = z.array(
  z.object({
    statuses: z.array(JiraApiStatusSchema),
  })
);

// ==================== Agile Schemas ====================

export const JiraApiBoardSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  location: z.object({
    projectId: z.number(), // Jira API returns number, not string
    projectKey: z.string(),
    projectName: z.string(),
  }).optional(),
});

export const JiraBoardsResponseSchema = z.object({
  values: z.array(JiraApiBoardSchema),
  maxResults: z.number().optional(),
  startAt: z.number().optional(),
  total: z.number().optional(),
  isLast: z.boolean().optional(),
});

export const JiraApiSprintSchema = z.object({
  id: z.number(),
  name: z.string(),
  state: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  completeDate: z.string().optional(),
  goal: z.string().optional(),
});

export const JiraSprintsResponseSchema = z.object({
  values: z.array(JiraApiSprintSchema),
});

// ==================== Create Response Schema ====================

export const JiraApiCreateResponseSchema = z.object({
  id: z.string(),
  key: z.string(),
  self: z.string().url(),
});

// ==================== Type Exports (inferred from schemas) ====================

export type JiraApiUser = z.infer<typeof JiraApiUserSchema>;
export type JiraApiStatus = z.infer<typeof JiraApiStatusSchema>;
export type JiraApiPriority = z.infer<typeof JiraApiPrioritySchema>;
export type JiraApiIssueType = z.infer<typeof JiraApiIssueTypeSchema>;
export type JiraApiProject = z.infer<typeof JiraApiProjectSchema>;
export type JiraApiIssue = z.infer<typeof JiraApiIssueSchema>;
export type JiraApiTransition = z.infer<typeof JiraApiTransitionSchema>;
export type JiraApiComment = z.infer<typeof JiraApiCommentSchema>;
export type JiraApiAttachment = z.infer<typeof JiraApiAttachmentSchema>;
export type JiraApiIssueLink = z.infer<typeof JiraApiIssueLinkSchema>;
export type JiraApiIssueLinkType = z.infer<typeof JiraApiIssueLinkTypeSchema>;
export type JiraApiLinkedIssue = z.infer<typeof JiraApiLinkedIssueSchema>;
export type JiraApiBoard = z.infer<typeof JiraApiBoardSchema>;
export type JiraApiSprint = z.infer<typeof JiraApiSprintSchema>;
export type JiraApiCreateResponse = z.infer<typeof JiraApiCreateResponseSchema>;
export type JiraApiADF = z.infer<typeof JiraApiADFSchema>;
export type JiraApiADFNode = z.infer<typeof JiraApiADFNodeSchema>;


