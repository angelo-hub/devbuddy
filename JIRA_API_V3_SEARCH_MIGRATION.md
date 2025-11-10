# 🔧 Jira Cloud API v3 Migration - Search Endpoint (May 2025)

## Problem

Getting a `410 Gone` error when searching for Jira issues:

```
Failed to search issues: Error: Jira API error: 410 Gone - 
{
  "errorMessages": [
    "The requested API has been removed. Please migrate to the /rest/api/3/search/jql API. 
     A full migration guideline is available at https://developer.atlassian.com/changelog/#CHANGE-2046"
  ]
}
```

## Root Cause

**As of May 1, 2025**, Atlassian deprecated multiple Jira Cloud search endpoints, including:
- `/rest/api/2/search` ❌
- `/rest/api/3/search` ❌ (also deprecated!)

The new endpoint is: `/rest/api/3/search/jql`

Source: [GitHub Issue](https://github.com/atlassian-api/atlassian-python-api/issues/1500)

## Solution

Updated to use the correct May 2025 endpoint:

### Code
```typescript
const response = await this.request<unknown>(
  "/search/jql",  // ✅ New endpoint (May 2025)
  {
    method: "POST",
    body: JSON.stringify(body),
  }
);
```

### Full URL
- **Base URL:** `https://{site}.atlassian.net/rest/api/3`
- **Endpoint:** `/search/jql`
- **Full URL:** `https://{site}.atlassian.net/rest/api/3/search/jql` ✅

## Migration Timeline

| Date | Endpoint | Status |
|------|----------|--------|
| **Before May 2025** | `/rest/api/2/search` | ✅ Working |
| **Before May 2025** | `/rest/api/3/search` | ✅ Working |
| **May 1, 2025** | `/rest/api/2/search` | ❌ Removed (410) |
| **May 1, 2025** | `/rest/api/3/search` | ❌ Removed (410) |
| **May 1, 2025+** | `/rest/api/3/search/jql` | ✅ Required |

## What We Tried

1. **First attempt:** Used `/search` (maps to `/rest/api/3/search`)
   - Result: `410 Gone` - endpoint removed in May 2025
   
2. **Second attempt:** Used `/search/jql`
   - Result: `400 Bad Request` - duplicate ORDER BY in JQL
   
3. **Fixed JQL issues:** Removed duplicate ORDER BY
   
4. **Final fix:** Back to `/search/jql` (now with valid JQL)
   - Result: ✅ Works!

The good news is that the request/response format remains the same, only the endpoint path changed.

## What Changed

### File Updated
- ✅ `src/providers/jira/cloud/JiraCloudClient.ts`
  - Line 260: `/search` → `/search/jql`

### Methods Affected
- `searchIssues(options: JiraSearchOptions)`
- `getMyIssues()` (calls `searchIssues` internally)

### Request Format
No changes to request body:
```typescript
{
  jql: "assignee = currentUser() ORDER BY updated DESC",
  fields: ["summary", "status", "priority", ...],
  maxResults: 100,
  startAt: 0
}
```

### Response Format
No changes - same paginated response:
```typescript
{
  issues: [...],
  total: 123,
  startAt: 0,
  maxResults: 100
}
```

## Testing

### Verify Issue Search Works
```typescript
// This should now work without 410 error
const issues = await jiraClient.getMyIssues();
```

### Expected Behavior
1. **Search executes** against `/rest/api/3/search/jql`
2. **Returns issues** with all fields
3. **No 410 error**
4. **Sidebar displays** Jira issues correctly

## Benefits

- ✅ **Future-proof** - Using latest Jira Cloud API v3
- ✅ **No breaking changes** - Same request/response format
- ✅ **Continued functionality** - Search works again
- ✅ **Standards compliant** - Following Atlassian's migration guide

## Related Endpoints

Other endpoints we use are already on v3:
- ✅ `/rest/api/3/issue/{key}` - Get issue
- ✅ `/rest/api/3/project/search` - Search projects  
- ✅ `/rest/api/3/user/search` - Search users
- ✅ `/rest/api/3/issue` - Create issue
- ✅ `/rest/api/3/issue/{key}/transitions` - Get transitions

Only `/search` needed migration to `/search/jql`.

## References

- [Atlassian Developer Changelog - CHANGE-2046](https://developer.atlassian.com/changelog/#CHANGE-2046)
- [Jira Cloud REST API v3 Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Search for issues using JQL (POST)](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post)

---

**Status:** ✅ **FIXED**

The Jira Cloud search endpoint has been migrated to the v3 API path. Issue searching now works correctly! 🚀

