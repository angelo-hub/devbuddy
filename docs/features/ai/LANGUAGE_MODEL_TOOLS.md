# Language Model Tools - Full Implementation ✅

Based on the [official VS Code Language Model Tools API documentation](https://code.visualstudio.com/api/extension-guides/ai/tools), I've updated DevBuddy's tool declarations to be fully compliant and visible in the VS Code UI.

## What Changed

### Added Required Properties for UI Visibility

According to the [VS Code docs](https://code.visualstudio.com/api/extension-guides/ai/tools#1-static-configuration-in-packagejson), to make tools **visible and referenceable in agent mode**, we need these properties:

| Property | Purpose | Example |
|----------|---------|---------|
| `canBeReferencedInPrompt` | Enables tool in agent mode and chat prompts with `#` | `true` |
| `toolReferenceName` | Name users type to reference the tool (e.g., `#getTicket`) | `"getTicket"` |
| `icon` | Icon displayed in the UI | `"$(file-text)"` |
| `userDescription` | User-facing description in the UI | `"Fetches ticket details..."` |
| `tags` | Categories for organizing tools | `["tickets", "devbuddy"]` |

### Before vs After

**Before:**
```json
{
  "name": "devbuddy_get_ticket",
  "displayName": "Get Ticket Details",
  "description": "...",  // ❌ Should be "userDescription"
  "modelDescription": "...",
  "inputSchema": { ... }
}
```

**After:**
```json
{
  "name": "devbuddy_get_ticket",
  "displayName": "Get Ticket Details",
  "userDescription": "...",  // ✅ Changed from "description"
  "modelDescription": "...",
  "icon": "$(file-text)",  // ✅ Added icon
  "tags": ["tickets", "devbuddy"],  // ✅ Added tags
  "canBeReferencedInPrompt": true,  // ✅ Enable in agent mode
  "toolReferenceName": "getTicket",  // ✅ Reference name for users
  "inputSchema": { ... }
}
```

## Updated Tool Declarations

### Tool 1: Get Ticket Details
```json
{
  "name": "devbuddy_get_ticket",
  "displayName": "Get Ticket Details",
  "userDescription": "Fetches detailed information about a specific ticket from Linear or Jira",
  "modelDescription": "Use this tool when you need details about a specific ticket...",
  "icon": "$(file-text)",
  "tags": ["tickets", "devbuddy"],
  "canBeReferencedInPrompt": true,
  "toolReferenceName": "getTicket",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": {
        "type": "string",
        "description": "The ticket identifier (e.g., 'ENG-123', 'PROJ-456')"
      }
    },
    "required": ["ticketId"]
  }
}
```

**User can now use:** `#getTicket` in chat prompts!

### Tool 2: List My Tickets
```json
{
  "name": "devbuddy_list_my_tickets",
  "displayName": "List My Tickets",
  "userDescription": "Lists all active tickets assigned to the current user",
  "modelDescription": "Use this tool to get a list of all tickets...",
  "icon": "$(checklist)",
  "tags": ["tickets", "devbuddy"],
  "canBeReferencedInPrompt": true,
  "toolReferenceName": "listMyTickets",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

**User can now use:** `#listMyTickets` in chat prompts!

### Tool 3: Get Current Branch Ticket (Smart Detection)
```json
{
  "name": "devbuddy_get_current_ticket",
  "displayName": "Get Current Branch Ticket",
  "userDescription": "Retrieves the ticket associated with the current Git branch",
  "modelDescription": "Use this tool to find out which ticket is associated...",
  "icon": "$(git-branch)",
  "tags": ["git", "tickets", "devbuddy"],
  "canBeReferencedInPrompt": true,
  "toolReferenceName": "getCurrentTicket",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

**User can now use:** `#getCurrentTicket` in chat prompts!

**🧠 Smart Detection Strategy:**
This tool uses a **multi-layered approach** to find what you're working on:

1. **Branch Name Detection (Primary)** - Checks if branch contains ticket ID
   - Example: `feat/ENG-123-oauth` → Returns ENG-123
   - Most reliable method

2. **In Progress Tickets (Fallback)** - If on `main` or branch without ticket ID
   - ✅ **One In Progress ticket** → Returns that ticket with note
   - ✅ **Multiple In Progress tickets** → Lists all with suggestion to create branch
   - ✅ **No In Progress tickets** → Helpful message with next steps

**Example Scenarios:**
```
# Scenario 1: On feature branch
Branch: feat/eng-125-oauth
Result: ENG-125 (detected from branch name)

# Scenario 2: On main with 1 In Progress ticket  
Branch: main
Result: ENG-126 (inferred from ticket status)

# Scenario 3: On main with multiple In Progress tickets
Branch: main
Result: List of 3 In Progress tickets with suggestion to create branch

# Scenario 4: Code review
Branch: feat/jane-456-payment (reviewing someone else's code)
Result: PROJ-456 (detected from branch name)
```

### Tool 4: Create Ticket 💎 (Pro)
```json
{
  "name": "devbuddy_create_ticket",
  "displayName": "💎 Create Ticket (Pro)",
  "userDescription": "AI-powered ticket creation with template support for Linear and Jira (Pro feature)",
  "modelDescription": "Use this tool to create a new ticket/issue on Linear or Jira...",
  "icon": "$(add)",
  "tags": ["tickets", "devbuddy", "pro", "creation"],
  "canBeReferencedInPrompt": true,
  "toolReferenceName": "createTicket",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string", "description": "The ticket title/summary (required)" },
      "description": { "type": "string", "description": "Detailed description (optional)" },
      "priority": { "type": "string", "description": "Priority: '1' (urgent) to '4' (low)" },
      "assigneeId": { "type": "string", "description": "User ID to assign (optional)" },
      "projectId": { "type": "string", "description": "Project ID or key (optional)" },
      "teamId": { "type": "string", "description": "Team ID for Linear (optional)" },
      "labels": { "type": "array", "items": { "type": "string" }, "description": "Label names" }
    },
    "required": ["title"]
  }
}
```

**User can now use:** `#createTicket` in chat prompts!

**💎 Pro Feature Highlights:**
- Creates tickets on Linear or Jira automatically
- Template support for both platforms
- Smart defaults for project/team/issue type
- Returns clickable link to open in DevBuddy
- Requires DevBuddy Pro license

**Example Usage:**
```
@workspace #createTicket title="Add OAuth2 support" description="Implement OAuth2 authentication flow" priority="2" labels=["security", "auth"]
```

**Response includes:**
```json
{
  "success": true,
  "ticket": {
    "id": "ENG-789",
    "title": "Add OAuth2 support",
    "url": "https://linear.app/...",
    "platform": "Linear",
    "openInDevBuddy": "[Open in DevBuddy](vscode://command/devBuddy.openTicketById?...)"
  }
}
```

## How to Test

### 1. Reload VS Code
Press **F5** (Extension Development Host) or reload your window.

### 2. Check Tool Registration
Open **Output** → **DevBuddy** channel. You should see:
```
🚀 DevBuddy v0.7.4 (Development Build)
✅ Registered tool: devbuddy_get_ticket
✅ Registered tool: devbuddy_list_my_tickets
✅ Registered tool: devbuddy_get_current_ticket
✅ Registered Pro tool: devbuddy_create_ticket 💎
✨ Language Model Tools registered successfully
```

### 3. Find Tools in Settings UI

According to the [VS Code documentation](https://code.visualstudio.com/api/extension-guides/ai/tools#why-implement-a-language-model-tool-in-your-extension), tools should appear in:

**Settings → Chat → Language Models → Tools**

Or search for:
- `language model tools` in settings
- Look for a "Tools" section in GitHub Copilot Chat settings

You should see your DevBuddy tools listed with:
- ✅ **Icon** (file-text, checklist, git-branch)
- ✅ **Display Name** (Get Ticket Details, List My Tickets, etc.)
- ✅ **User Description**
- ✅ **Checkboxes to enable/disable** each tool

### 4. Use Tools in Chat

#### Option A: Let Agent Mode Auto-Invoke
```
@workspace what ticket am I working on?
```
Agent mode will automatically invoke `devbuddy_get_current_ticket`.

#### Option B: Reference Tools Explicitly with `#`
```
@workspace #getCurrentTicket

@workspace #getTicket ENG-123

@workspace #listMyTickets
```

#### Option C: Create Tickets (Pro) 💎
```
@workspace #createTicket title="Fix login bug" priority="1" labels=["bug", "critical"]
```

### 5. Watch Debug Logs

Enable `devBuddy.debugMode` in settings, then check the DevBuddy Output panel:

```
🌿 [LM Tool] devbuddy_get_current_ticket invoked
[LM Tool] Workspace: /Users/you/project
[LM Tool] Current branch: feat/eng-125-oauth
[LM Tool] Detected ticket ID: ENG-125
✅ [LM Tool] Returned ticket details (300 chars)
```

## Tool-Calling Flow

Per the [VS Code documentation](https://code.visualstudio.com/api/extension-guides/ai/tools#tool-calling-flow):

```
User Prompt
    ↓
Copilot determines available tools (based on user config)
    ↓
LLM analyzes prompt + tool definitions
    ↓
LLM requests tool invocation(s)
    ↓
Copilot invokes tool(s) via vscode.lm.registerTool
    ↓
Extension returns LanguageModelToolResult
    ↓
Copilot sends results back to LLM
    ↓
Final response to user
```

## Key Features Now Enabled

✅ **Tools appear in Settings UI** - Users can enable/disable them  
✅ **Tools work in Agent Mode** - Automatically invoked when relevant  
✅ **Tools can be referenced with `#`** - Explicit invocation in chat  
✅ **Icons in UI** - Visual identification of tools  
✅ **User-friendly descriptions** - Clear purpose in UI  
✅ **Organized by tags** - Easy to find related tools  
✅ **Clickable Results** - Ticket responses include VS Code command URIs to open in DevBuddy webviews
✅ **Pro Features Available** - Create tickets with AI (requires Pro license)

## Clickable Command URIs 🔗

All tool responses now include **clickable command URIs** that allow AI agents to create interactive responses.

### How It Works

Each ticket result includes:
```json
{
  "ticketId": "ENG-123",
  "title": "Implement OAuth2",
  "status": "In Progress",
  "url": "https://linear.app/...",
  "devbuddyAction": "vscode://command/devBuddy.openTicketById?%5B%22ENG-123%22%5D",
  "devbuddyActionLabel": "Open in DevBuddy"
}
```

### What Agents Can Do

AI agents like `@workspace` or GitHub Copilot Chat can:
1. Parse the `devbuddyAction` URI from the tool result
2. Format it as a clickable link in their response
3. Users click the link → DevBuddy webview panel opens immediately
4. No need to manually search for the ticket in the sidebar

### Example Interaction

```
User: @workspace what ticket am I working on?

Copilot: Based on your branch (feat/eng-125-oauth), you're working on:

**ENG-125: Implement OAuth2 Authentication**
- Status: In Progress
- Priority: High

[Open in DevBuddy](vscode://command/devBuddy.openTicketById?%5B%22ENG-125%22%5D)
```

When the user clicks "Open in DevBuddy", the ticket panel opens instantly.

### Implementation Details

**Command:** `devBuddy.openTicketById`
- **Parameters:** `[ticketId: string]`
- **Behavior:**
  - Detects platform (Linear or Jira)
  - Fetches full ticket details
  - Opens appropriate webview panel (LinearTicketPanel or JiraIssuePanel)
  - Shows error notification if ticket not found

**URI Format:**
```typescript
`vscode://command/devBuddy.openTicketById?${encodeURIComponent(JSON.stringify([ticketId]))}`
```

**Supported By:**
- ✅ `devbuddy_get_ticket` - Single ticket details
- ✅ `devbuddy_list_my_tickets` - Each ticket in the list
- ✅ `devbuddy_get_current_ticket` - Current/In Progress tickets
- ✅ `devbuddy_create_ticket` - Newly created tickets (Pro)

### Benefits

1. **Seamless UX** - One click from AI chat to full ticket details
2. **Cross-Agent Compatible** - Any AI agent can create clickable links
3. **Platform Agnostic** - Works for both Linear and Jira
4. **Context Preserved** - Opens the exact ticket the user asked about
5. **Consistent Experience** - Same webview panels used throughout DevBuddy


## Guidelines Followed

From the [VS Code guidelines](https://code.visualstudio.com/api/extension-guides/ai/tools#guidelines-and-conventions):

✅ **Naming Convention:** `{verb}_{noun}` format  
- `devbuddy_get_ticket` ✓
- `devbuddy_list_my_tickets` ✓
- `devbuddy_get_current_ticket` ✓
- `devbuddy_create_ticket` ✓ (Pro)

✅ **Clear Descriptions:** Both user-facing and model-facing descriptions  
✅ **Input Schema:** Detailed parameter descriptions  
✅ **Error Handling:** Meaningful error messages in tool implementation  
✅ **User Confirmation:** Implemented via `prepareInvocation` in extension code

## Files Changed

1. **`package.json`** - Updated `languageModelTools` contribution:
   - Changed `description` → `userDescription`
   - Added `icon` for each tool
   - Added `tags` for categorization
   - Added `canBeReferencedInPrompt: true`
   - Added `toolReferenceName` for `#` references
   - Kept `inputSchema` (was `parametersSchema`, already fixed)

2. **`src/extension.ts`** - Already correct:
   - Tool registration with `vscode.lm.registerTool`
   - Tool implementation with debug logging

## What Users Will See

### In Settings UI
```
Chat → Language Model Tools

☑ DevBuddy Tools
  ☑ 📄 Get Ticket Details
     Fetches detailed information about a specific ticket...
  
  ☑ ✓ List My Tickets
     Lists all active tickets assigned to the current user...
  
  ☑ 🌿 Get Current Branch Ticket
     Retrieves the ticket associated with the current Git branch...
  
  ☑ 💎 Create Ticket (Pro)
     AI-powered ticket creation with template support...
```

### In Chat
```
User: @workspace what ticket am I working on?

Copilot: Let me check your current branch...
[Invoking devbuddy_get_current_ticket]

Based on your branch (feat/eng-125-oauth), you're working on:

**ENG-125: Implement OAuth2 Authentication**
- Status: In Progress
- Priority: High
- Assignee: You
```

## References

- [VS Code Language Model Tools API](https://code.visualstudio.com/api/extension-guides/ai/tools)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [VS Code Extension Samples - Chat Tools](https://github.com/microsoft/vscode-extension-samples/tree/main/chat-sample)

## Next Steps

1. ✅ Reload VS Code
2. ✅ Check Settings UI for DevBuddy tools
3. ✅ Test with `@workspace` and `#toolName` references
4. ✅ Monitor debug logs for tool invocations
5. ✅ Test Pro features (create ticket) with valid license
6. 🎯 Consider adding more tools (e.g., `update_ticket_status`, `add_comment`)

---

**Status:** FULLY IMPLEMENTED ✅  
**Date:** 2025-11-26  
**Version:** 0.8.0  
**Spec:** VS Code Language Model Tools API v1.93+
**Pro Features:** ✅ Ticket creation with AI

