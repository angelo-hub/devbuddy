# 🔍 Jira API Endpoint Investigation Summary

## Current Situation

We're in a confusing state with conflicting information about the correct Jira Cloud search endpoint.

## What We Know

### Our Current Code
- **Endpoint:** `POST /rest/api/3/search`
- **Body:**
```json
{
  "jql": "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC",
  "startAt": 0,
  "maxResults": 100,
  "fields": ["summary", "description", "issuetype", "status", ...]
}
```
- **Headers:**
  - `Accept: application/json`
  - `Content-Type: application/json`
  - `Authorization: Basic {credentials}`

### Conflicting Information

1. **Initial Error Message (410 Gone):**
   ```
   "The requested API has been removed. Please migrate to the /rest/api/3/search/jql API"
   ```

2. **Web Search Results:**
   - Says `/rest/api/3/search/jql` is NOT valid for POST requests
   - Says the correct endpoint is `/rest/api/3/search`
   - Confirms format: `{ "jql": "...", "startAt": 0, "maxResults": 50, "fields": [...] }`

3. **Your User Example:**
   ```javascript
   await requestJira(`/rest/api/3/search/jql`, {
     method: 'POST',
     body: { jql, maxResults, fields, ... }
   });
   ```
   - Shows `/rest/api/3/search/jql` being used successfully

4. **Atlassian GitHub Issue:**
   - States that as of May 1, 2025, `/rest/api/3/search` was deprecated
   - New endpoint is `/rest/api/3/search/jql`

## The Problem

**You're getting 400 Bad Request with:**
```json
{
  "jql":"assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC",
  "startAt":0,
  "maxResults":100,
  "fields":["summary","description",...]}
}
```

## Possibilities

### Option 1: The `/search/jql` endpoint requires different parameters
- Maybe `startAt` is not supported?
- Maybe field names need to be different?

### Option 2: Your Jira instance hasn't migrated yet
- Maybe your Jira is still on the old API?
- Try `/rest/api/3/search` first

### Option 3: The JQL syntax is invalid
- Double ORDER BY was fixed
- But maybe there's another issue?

## Next Steps to Debug

1. **Check which endpoint works:**
   - Current code uses: `/search`
   - Try it and see if you get 410 or 400

2. **If 410, switch to `/search/jql`:**
   - The error message explicitly says this is the new endpoint

3. **If 400 with `/search/jql`, try removing `startAt`:**
   - New API might use cursor-based pagination only

4. **Enable debug mode:**
   - Set `devBuddy.debugMode: true`
   - Check Output Panel → "DevBuddy"
   - See exactly what request is being sent

## Current State

- ✅ Code compiles
- ✅ Headers include Accept and Content-Type
- ✅ JQL has single ORDER BY
- ✅ Using POST method
- ❓ Endpoint: Currently `/search` (maps to `/rest/api/3/search`)
- ❓ Getting 410 or 400? (need confirmation)

---

**Action Required:** Please try the extension now and tell me:
1. What error do you get? (410 Gone or 400 Bad Request?)
2. Enable debug mode and share the full request being logged
3. What is your Jira site URL? (to verify it's Cloud not Server)

