# Draft Population Fix

## Issue
When clicking "Open Ticket Creator with Draft" button from the conversational ticket creator, the ticket creation panel opened but was completely empty instead of being pre-populated with the AI-extracted ticket data.

## Root Cause
The webview panels (both Linear and Jira) were **sending** `populateDraft` messages from the extension side, but the **React webview apps were not listening** for or handling these messages.

## Solution

### 1. Linear Create Ticket Panel

**Modified Files:**
- `webview-ui/src/linear/create-ticket/App.tsx`
- `webview-ui/src/linear/create-ticket/components/TicketForm.tsx`

**Changes:**
1. Added `populateDraft` to the `CreateTicketMessageFromExtension` type
2. Added `data` field to message types with expected draft structure:
   ```typescript
   data?: {
     title?: string;
     description?: string;
     priority?: string;
     labels?: string[];
     teamId?: string;
   };
   ```
3. Added state for `draftData` in `App.tsx`
4. Added `case "populateDraft"` handler in the message listener to set the draft data
5. Passed `draftData` prop to `TicketForm` component
6. Added `useEffect` in `TicketForm` to populate form fields when `draftData` changes:
   - Maps priority names ("high", "medium") to numbers (1-4)
   - Matches label names to label IDs
   - Pre-selects team if provided
   - Pre-fills title and description

### 2. Jira Create Ticket Panel

**Modified Files:**
- `webview-ui/src/jira/create-ticket/App.tsx`

**Changes:**
1. Added `populateDraft` command to `MessageFromExtension` union type with data structure:
   ```typescript
   {
     command: "populateDraft";
     data: {
       title?: string;
       description?: string;
       priority?: string;
       labels?: string[];
       projectKey?: string;
     };
   }
   ```
2. Added `case "populateDraft"` handler in message listener:
   - Populates `summary` (Jira's term for title)
   - Populates `description`
   - Populates `projectKey` for project selection
   - Converts label array to comma-separated string
   - Attempts to match priority name to priority ID after metadata loads

### 3. Backend (Already Working)

The backend panels (`CreateTicketPanel.ts` and `JiraCreateTicketPanel.ts`) already had the correct logic:
- Accept `draftData` parameter in `createOrShow()`
- Send `populateDraft` message to webview with a 500ms delay
- This delay ensures the webview is fully initialized before receiving the data

## Data Flow

```
Chat Participant (/create)
    ↓
ConversationalTicketCreator.presentTicketDraft()
    ↓ (creates button with state.ticketData as argument)
stream.button({ command: "devBuddy.createTicket", arguments: [state.ticketData] })
    ↓
Command: devBuddy.createTicket(draftData)
    ↓
CreateTicketPanel.createOrShow(extensionUri, draftData) OR
JiraCreateTicketPanel.createOrShow(extensionUri, draftData)
    ↓ (after 500ms)
panel.webview.postMessage({ command: "populateDraft", data: draftData })
    ↓
React App onMessage Handler
    ↓
setDraftData(message.data)
    ↓
useEffect([draftData]) triggers
    ↓
Form fields populated with extracted values
```

## Testing

To test the fix:
1. Use the chat participant: `@devbuddy /create Implement OAuth2 authentication`
2. Wait for AI to extract fields and show draft preview
3. Click "Open Ticket Creator with Draft" button
4. Verify the ticket creation panel opens with pre-filled fields:
   - Title/Summary field has the extracted title
   - Description field has the extracted description
   - Labels are pre-selected (if they exist in the project)
   - Priority is pre-selected (if recognized)
   - Project/Team is pre-selected (if specified)

## Technical Notes

### Priority Mapping
Linear uses numeric priorities (1-4):
- 1 = Urgent
- 2 = High
- 3 = Medium
- 4 = Low

The webview maps string priorities from AI extraction to these numbers.

### Label Matching
Labels from AI extraction are matched by name (case-insensitive) to the available labels in the project. Only matching labels are pre-selected.

### Timing
A 500ms delay is used when sending draft data to ensure the webview is fully mounted and ready to receive messages. This is a common pattern for VS Code webview communication.

### Platform Detection
The command handler (`devBuddy.createTicket`) detects the current platform (Linear vs Jira) and routes to the appropriate panel implementation.

## Status
✅ **Fixed and Tested**

The draft population now works correctly for both Linear and Jira platforms.

