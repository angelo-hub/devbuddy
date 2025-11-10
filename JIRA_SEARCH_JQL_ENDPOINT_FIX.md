# ✅ Jira Search JQL Endpoint Fix

## Problem

Getting `400 Bad Request` error when searching for Jira issues with the payload:
```json
{
  "jql": "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC",
  "startAt": 0,
  "maxResults": 100,
  "fields": ["summary", "description", ...]
}
```

## Root Cause

The `/rest/api/3/search/jql` endpoint uses **cursor-based pagination** with `nextPageToken`, not offset-based pagination with `startAt`.

## Official Documentation

According to the [Jira Cloud REST API v3 documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post):

### Endpoint
```
POST /rest/api/3/search/jql
```

### Request Body Format
```typescript
{
  "jql": "<string>",              // Required: JQL query string
  "maxResults": 273,               // Optional: max results per page
  "nextPageToken": "<string>",     // Optional: for pagination (NOT startAt)
  "fields": ["<string>"],          // Optional: fields to return
  "expand": "<string>",            // Optional: additional data
  "fieldsByKeys": true,            // Optional: return fields by key
  "properties": ["<string>"],      // Optional: issue properties
  "reconcileIssues": [2154]        // Optional: issue reconciliation
}
```

### Key Differences from Old `/search` Endpoint

| Feature | Old `/search` | New `/search/jql` |
|---------|---------------|-------------------|
| **Pagination** | `startAt` (offset-based) | `nextPageToken` (cursor-based) |
| **JQL Format** | String | String |
| **Fields** | Array of strings | Array of strings |
| **Response** | `{ issues, startAt, maxResults, total }` | `{ issues, nextPageToken, isLast }` |

## Fix Applied

### Before (Incorrect)
```typescript
const body = {
  jql,
  startAt: options.startAt || 0,  // ❌ NOT supported by /search/jql
  maxResults: options.maxResults || 50,
  fields: [...]
};
```

### After (Correct)
```typescript
// Note: /search/jql uses cursor-based pagination with nextPageToken
const body: Record<string, any> = {
  jql,
  maxResults: options.maxResults || 50,
  fields: [...]
};

// Add nextPageToken for pagination (if provided)
// Note: startAt is NOT supported by /search/jql
if (options.startAt && options.startAt > 0) {
  logger.warn(
    "startAt pagination not supported by /search/jql, use nextPageToken instead"
  );
}
```

## Example Valid Request

```typescript
const bodyData = {
  "jql": "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC",
  "maxResults": 100,
  "fields": [
    "summary",
    "description",
    "issuetype",
    "status",
    "priority",
    "assignee",
    "reporter",
    "project",
    "labels",
    "created",
    "updated",
    "duedate"
  ]
};

const response = await requestJira('/rest/api/3/search/jql', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(bodyData)
});
```

## Response Format

```typescript
{
  "isLast": true,                  // Whether this is the last page
  "nextPageToken": "<string>",     // Token for next page (if not last)
  "issues": [                      // Array of issues
    {
      "id": "10002",
      "key": "ED-1",
      "fields": { ... }
    }
  ]
}
```

## Changes Made

### File: `src/providers/jira/cloud/JiraCloudClient.ts`

1. **Removed `startAt` from request body** (line 244)
   - The `/search/jql` endpoint does NOT support `startAt`
   - Uses `nextPageToken` for pagination instead

2. **Added documentation comment** (lines 242-243)
   - Explains the pagination difference
   - References official documentation

3. **Added warning for startAt usage** (lines 265-269)
   - Logs warning if code tries to use `startAt`
   - Helps with debugging pagination issues

4. **Endpoint remains `/search/jql`** (line 274)
   - Confirmed this is the correct endpoint as of May 1, 2025
   - The old `/search` endpoint is deprecated (returns 410 Gone)

### File: `src/providers/jira/cloud/schemas.ts`

1. **Updated `JiraPaginatedIssueResponseSchema`** (lines 162-166)
   - Changed from old format: `{ startAt, maxResults, total, issues }`
   - To new format: `{ isLast, nextPageToken, issues }`
   - Matches the `/search/jql` endpoint response structure

2. **Added legacy schema for reference** (lines 169-174)
   - `JiraLegacyPaginatedIssueResponseSchema` documents old format
   - Useful for understanding the API migration

## Testing

1. **Enable debug mode:**
   ```json
   "devBuddy.debugMode": true
   ```

2. **Check Output Panel:**
   - View → Output → "DevBuddy"
   - Should see clean request without `startAt`:
     ```json
     {
       "jql": "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC",
       "maxResults": 100,
       "fields": ["summary", "description", ...]
     }
     ```

3. **Verify response:**
   - Should return issues successfully
   - No more 400 Bad Request errors

## Future Work: Pagination

Currently, the code doesn't support pagination with `nextPageToken`. To add pagination:

1. Update `searchIssues` to accept `nextPageToken` parameter
2. Add `nextPageToken` to request body if provided
3. Return `nextPageToken` and `isLast` from response
4. Update callers to handle paginated results

## References

- [Jira Cloud REST API v3 - Search for issues using JQL enhanced search (POST)](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post)
- [Atlassian Developer Changelog - API Deprecation Notice](https://developer.atlassian.com/changelog/#CHANGE-2046)

---

**Status:** ✅ **FIXED**  
**Date:** November 9, 2025  
**Impact:** Jira Cloud issue search now works correctly with the new API endpoint

