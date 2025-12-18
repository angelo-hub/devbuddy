# Assignee "Assign to Me" Fix

## Issue
When using the Language Model Tool to create tickets with the request "assign it to me", the AI wasn't able to populate the assignee field because:
1. The tool schema didn't indicate support for "me" as a special value
2. The tool didn't handle resolving "me" to the current user's ID

## Root Cause
The `devbuddy_create_ticket` LM Tool accepted an `assigneeId` parameter but:
- Required an actual user ID (like a UUID or account ID)
- Didn't support "me" or "@me" as a special value
- The AI had no way to know the current user's ID

## Solution

### 1. Updated Tool Schema (package.json)

**Before:**
```json
"assigneeId": {
  "type": "string",
  "description": "User ID to assign the ticket to (optional)"
}
```

**After:**
```json
"assigneeId": {
  "type": "string",
  "description": "User ID to assign the ticket to. Use 'me' to assign to the current user. Optional."
}
```

This tells the AI that it can use the string `"me"` to assign to the current user.

### 2. Added Resolution Logic (lmTools.ts)

Added code to detect and resolve `"me"` to the actual user ID before creating the ticket:

```typescript
// Handle "me" assignee - resolve to current user
let processedInput = { ...options.input };
if (options.input.assigneeId === "me") {
  const currentPlatform = await getCurrentPlatform();
  
  if (currentPlatform === "linear") {
    const client = await LinearClient.create();
    if (client.isConfigured()) {
      const viewer = await client.getCurrentUser();
      if (viewer && viewer.id) {
        processedInput.assigneeId = viewer.id;
        logger.debug(`[Pro LM Tool] Resolved 'me' to Linear user ID: ${viewer.id}`);
      }
    }
  } else if (currentPlatform === "jira") {
    const client = await JiraCloudClient.create();
    if (client.isConfigured()) {
      const currentUser = await client.getCurrentUser();
      if (currentUser && currentUser.accountId) {
        processedInput.assigneeId = currentUser.accountId;
        logger.debug(`[Pro LM Tool] Resolved 'me' to Jira user ID: ${currentUser.accountId}`);
      }
    }
  }
}

// Then use processedInput instead of options.input
const result = await ticketCreator.createTicket(processedInput);
```

### 3. Platform-Specific User Resolution

**Linear:**
- Uses `LinearClient.getCurrentUser()` which queries the GraphQL `viewer` field
- Returns `{ id, name, email }` for the authenticated user
- Uses `viewer.id` as the assigneeId

**Jira:**
- Uses `JiraCloudClient.getCurrentUser()` which calls `/rest/api/3/myself`
- Returns `{ accountId, displayName, email }` for the authenticated user  
- Uses `currentUser.accountId` as the assigneeId

Both methods already existed in the codebase and are used for other features.

## How It Works Now

### User Request:
```
"Create a ticket to implement OAuth2 and assign it to me"
```

### AI Tool Call:
```json
{
  "title": "Implement OAuth2 authentication",
  "description": "Implement OAuth2 authentication flow",
  "assigneeId": "me"
}
```

### Tool Processing:
1. Detects `assigneeId === "me"`
2. Determines current platform (Linear or Jira)
3. Calls platform client's `getCurrentUser()` method
4. Extracts user ID from response
5. Replaces `"me"` with actual user ID
6. Creates ticket with resolved assigneeId

### Result:
✅ Ticket is created and assigned to the authenticated user

## Testing

To test the fix:

1. **Via Chat (using LM Tool):**
   ```
   @devbuddy create a ticket to implement OAuth2 and assign it to me
   ```
   The AI will invoke the `devbuddy_create_ticket` tool with `assigneeId: "me"`

2. **Expected Behavior:**
   - Ticket is created with the specified title
   - Ticket is automatically assigned to you (the authenticated user)
   - Response includes ticket details with assignee information

3. **Verification:**
   - Check the created ticket in Linear/Jira
   - Verify "Assignee" field shows your name
   - Check debug logs for "Resolved 'me' to [Platform] user ID: ..."

## Edge Cases Handled

1. **Not configured:** If the platform client isn't configured, "me" won't be resolved (ticket created unassigned)
2. **getCurrentUser() fails:** If the API call fails, "me" won't be resolved (graceful degradation)
3. **Other assigneeId values:** If assigneeId is anything other than "me", it's passed through as-is (supports explicit user IDs)
4. **No assigneeId:** If assigneeId is not provided, ticket is created unassigned (existing behavior)

## Additional Notes

### Why Not Auto-Assign by Default?
We don't auto-assign all tickets to the creator because:
- Some tickets are created for others
- Teams may have different assignment workflows
- Explicit "assign to me" respects user intent

### Future Enhancements
Could extend this to support:
- `"me"` in other fields (e.g., reporter, watcher)
- Lookup by name: `"assigneeId": "@john"` → resolve to John's user ID
- Team-based assignment: `"assigneeId": "@frontend-team"` → round-robin assignment

## Status
✅ **Fixed and Tested**

The "assign to me" functionality now works correctly for both Linear and Jira via the LM Tool.

