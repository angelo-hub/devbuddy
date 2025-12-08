# Debugging Language Model Tools - Guide

## Problem: @workspace Giving Hallucinated Results

When asking `@workspace what ticket am i working on?`, you might get hallucinated results if the Language Model Tools aren't being called properly.

## Debug Logging Now Enabled ✅

I've added comprehensive logging throughout the Language Model Tools implementation. Here's what you'll see:

### 1. Enable Debug Mode

**Settings → DevBuddy: Debug Mode → Enable**

Or in `settings.json`:
```json
{
  "devBuddy.debugMode": true
}
```

### 2. Open Output Panel

**View → Output → Select "DevBuddy" from dropdown**

### 3. What the Logs Will Show

#### At Extension Activation:
```
🔧 Attempting to register Language Model Tools...
✅ Registered tool: devbuddy_get_ticket
✅ Registered tool: devbuddy_list_my_tickets  
✅ Registered tool: devbuddy_get_current_ticket
✨ Language Model Tools registered successfully (3 tools available for AI agents)
🔍 To enable debug mode and see tool invocations, go to Settings → DevBuddy: Debug Mode → Enable
```

**If you DON'T see this**, the tools failed to register. Check for error messages.

#### When @workspace Calls a Tool:

**For `devbuddy_get_current_ticket`:**
```
🌿 [LM Tool] devbuddy_get_current_ticket invoked
[LM Tool] Workspace: /path/to/your/workspace
[LM Tool] Current branch: feat/eng-125-oauth2
[LM Tool] Branch association found: none
[LM Tool] Auto-detected ticket ID from branch name: ENG-125
[LM Tool] Platform: linear, Ticket ID: ENG-125
✅ [LM Tool] Successfully fetched current ticket: ENG-125
[LM Tool] Result: { "branch": "feat/eng-125-oauth2", "ticketId": "ENG-125", ... }
```

**For `devbuddy_list_my_tickets`:**
```
📋 [LM Tool] devbuddy_list_my_tickets invoked
[LM Tool] Current platform: linear
[LM Tool] Fetching Linear issues...
[LM Tool] Found 5 Linear tickets
✅ [LM Tool] Successfully listed 5 Linear tickets
[LM Tool] First 3 tickets: [{"id":"ENG-123",...}]
```

**For `devbuddy_get_ticket`:**
```
🎫 [LM Tool] devbuddy_get_ticket invoked with ticketId: ENG-125
[LM Tool] Full input: {"ticketId":"ENG-125"}
[LM Tool] Current platform: linear
[LM Tool] Linear client configured: true
✅ [LM Tool] Successfully fetched ticket ENG-125 from Linear
[LM Tool] Result: {"id":"ENG-125","title":"Add OAuth2 Authentication",...}
```

## Diagnosing Issues

### Issue 1: No Tool Invocation Logs

**Symptom:** You ask @workspace a question but see NO `[LM Tool]` logs

**Diagnosis:** @workspace is not calling the DevBuddy tools

**Possible Reasons:**
1. **@workspace doesn't know about the tools**
   - Tools might not be visible to @workspace
   - VS Code version < 1.93.0
   
2. **@workspace chose not to use the tools**
   - The query might not trigger tool usage
   - @workspace's AI model decided it didn't need ticket data

**Solutions:**
- Try more explicit queries: "@workspace use devbuddy tools to tell me what ticket I'm working on"
- Check VS Code version: Help → About (should be 1.93.0+)
- Try `@devbuddy` instead: "@devbuddy what ticket am I working on?"

### Issue 2: Tool Called But Returns "No ticket found"

**Symptom:** You see logs like:
```
🌿 [LM Tool] devbuddy_get_current_ticket invoked
[LM Tool] Current branch: main
⚠️ [LM Tool] No ticket associated with branch "main"
```

**Diagnosis:** Your current branch doesn't contain a ticket ID

**Solution:**
- Make sure your branch name contains a ticket ID like: `feat/ENG-125-description`
- Or create a branch from DevBuddy sidebar for a ticket
- Supported patterns: `ENG-125`, `PROJ-456`, etc.

### Issue 3: Tool Called But Platform Not Configured

**Symptom:**
```
⚠️ [LM Tool] Linear not configured
```

**Solution:**
- Run command: `DevBuddy: Configure Linear` or `DevBuddy: Configure Jira Cloud`
- Add your API token

### Issue 4: Tool Registration Failed

**Symptom:**
```
❌ Failed to register Language Model Tools: [error message]
```

**Diagnosis:** VS Code API not available

**Solution:**
- Ensure VS Code version is 1.93.0 or higher
- Update VS Code: Code → Check for Updates

## Understanding @workspace Behavior

### Important: @workspace Decides When to Use Tools

@workspace has its own logic for when to call DevBuddy tools. It might:

✅ **Call the tools when:**
- You explicitly ask about tickets
- You mention a ticket ID
- You ask what you're working on
- Context suggests you need ticket information

❌ **NOT call the tools when:**
- The query seems unrelated to tickets
- @workspace thinks it can answer without tools
- The query is too vague

### Test Cases

**Likely to trigger tools:**
```
@workspace what ticket am I working on?
@workspace tell me about ENG-125
@workspace list my active tickets
@workspace what's the status of my current task?
```

**May not trigger tools:**
```
@workspace help me with this code
@workspace what should I do?
@workspace explain this function
```

## Manual Testing

To test if tools work at all, use `@devbuddy` directly:

```
@devbuddy what ticket am I working on?
```

This should always try to fetch ticket data (not using LM Tools, but using the same underlying code).

## Logs to Share for Debugging

If you're still having issues, share these from the Output panel:

1. **Registration logs** (look for "🔧 Attempting to register...")
2. **Any tool invocation logs** (look for "[LM Tool]")
3. **Any error messages** (look for "❌" or "⚠️")
4. **Your branch name** and **configured platform**

## Next Steps

1. **Enable debug mode** in settings
2. **Open Output panel** → DevBuddy
3. **Reload VS Code** (to register tools with new logging)
4. **Ask @workspace** your question again
5. **Check the logs** to see:
   - Did tools register? ✅
   - Did @workspace call a tool? 🌿📋🎫
   - Did the tool find your ticket? ✅
   - Any errors? ❌

The logs will tell us exactly what's happening!

