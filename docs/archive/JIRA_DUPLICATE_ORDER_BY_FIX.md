# 🔧 Jira JQL Duplicate ORDER BY Fix

## Problem

Getting `400 Bad Request` error when searching for Jira issues:

```
[❌ ERROR] Failed to search issues: Error: Jira API error: 400 Bad Request - 
{"errorMessages":["Invalid request payload. Refer to the REST API documentation and try again."]}
```

## Root Cause

The `searchIssues()` method was unconditionally appending `ORDER BY updated DESC` to all JQL queries. When `getMyIssues()` passed a JQL string that already included an ORDER BY clause, it resulted in invalid JQL syntax:

```jql
assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC ORDER BY updated DESC
                                                       ^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^
                                                       from getMyIssues()  added by searchIssues()
```

Jira rejected this as invalid JQL, returning a 400 error.

## Solution

### Fix 1: Conditional ORDER BY ✅

Updated `searchIssues()` to only add ORDER BY if not already present:

```typescript
// Only add ORDER BY if not already present
if (!jql.toUpperCase().includes("ORDER BY")) {
  jql += " ORDER BY updated DESC";
}
```

### Fix 2: Remove Duplicate from getMyIssues() ✅

Removed the ORDER BY from the `getMyIssues()` JQL since `searchIssues()` will add it:

**Before:**
```typescript
return this.searchIssues({
  jql: `assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC`,
  maxResults: 100,
});
```

**After:**
```typescript
return this.searchIssues({
  jql: `assignee = currentUser() AND resolution = Unresolved`,
  maxResults: 100,
});
```

### Bonus: Added Debug Logging ✅

Added debug logging to help troubleshoot future issues:

```typescript
logger.debug(`Jira search request: ${JSON.stringify(body, null, 2)}`);
```

When `devBuddy.debugMode` is enabled, this will show:
```json
{
  "jql": "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC",
  "startAt": 0,
  "maxResults": 100,
  "fields": ["summary", "description", "issuetype", ...]
}
```

## How It Works Now

### Scenario 1: JQL with ORDER BY
```typescript
searchIssues({
  jql: "assignee = currentUser() ORDER BY priority"
})
```
Result: Uses the provided ORDER BY (priority), doesn't add another one ✅

### Scenario 2: JQL without ORDER BY
```typescript
searchIssues({
  jql: "assignee = currentUser()"
})
```
Result: Adds default `ORDER BY updated DESC` ✅

### Scenario 3: getMyIssues()
```typescript
getMyIssues()
  → calls searchIssues({ jql: "assignee = currentUser() AND resolution = Unresolved" })
  → searchIssues adds: ORDER BY updated DESC
  → Final JQL: "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC"
```
Result: Valid JQL, no duplicates ✅

## Files Changed

- ✅ `src/providers/jira/cloud/JiraCloudClient.ts`
  - Line 237-240: Conditional ORDER BY logic
  - Line 262: Added debug logging
  - Line 299: Removed duplicate ORDER BY from getMyIssues()

## Testing

### Enable Debug Mode
```json
// settings.json
{
  "devBuddy.debugMode": true
}
```

### Check Output Panel
1. Open Output Panel (View → Output)
2. Select "DevBuddy" from dropdown
3. Look for debug log showing JQL query

### Expected Behavior
- ✅ No 400 errors
- ✅ Jira issues load in sidebar
- ✅ Debug log shows valid JQL (no duplicate ORDER BY)

## Prevention

The fix is defensive - it checks if ORDER BY is already present before adding it. This prevents:
- Duplicate ORDER BY clauses
- Conflicts between caller's ORDER BY and automatic ORDER BY
- Future bugs if other methods pass JQL with ORDER BY

## Related Issues

This is a common pattern in JQL builders - be careful about:
1. Who owns the ORDER BY clause (caller vs method)
2. Always check before appending clauses
3. Document whether methods add ORDER BY automatically

## References

- [Jira JQL Documentation](https://support.atlassian.com/jira-service-management-cloud/docs/use-advanced-search-with-jira-query-language-jql/)
- [JQL Syntax](https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-search-in-jira-cloud/)

---

**Status:** ✅ **FIXED**

The duplicate ORDER BY clause has been removed, and Jira search now works correctly! 🚀

