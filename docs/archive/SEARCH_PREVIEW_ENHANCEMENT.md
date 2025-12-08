# Search Preview Enhancement Summary

## Overview

Enhanced the ticket search preview (QuickPick) to include:
1. **Relative timestamps** - Shows "2 days ago", "5 minutes ago", etc. for last updated time
2. **Assignee information** - Shows who's assigned to each ticket
3. **Avatar images** - Displays assignee profile pictures in the search results

## Changes Made

### 1. New Time Formatter Utility (`src/shared/utils/timeFormatter.ts`)

Created a new utility module with two functions:

- **`formatRelativeTime(date)`** - Converts dates to human-readable relative time
  - Examples: "2 days ago", "5 minutes ago", "3 weeks ago", "1 year ago"
  - Automatically selects the most appropriate unit (seconds, minutes, hours, days, weeks, months, years)
  
- **`formatShortRelativeTime(date)`** - Converts dates to short relative time format
  - Examples: "2d", "5m", "3w", "1y"
  - Useful for more compact displays

### 2. Enhanced Search Preview (`src/extension.ts`)

Updated the `devBuddy.searchTickets` command to show more information:

**Before:**
```
$(issue-opened) ENG-123
Description: Fix the login bug
Detail: In Progress • High priority
```

**After:**
```
[Avatar] $(issue-opened) ENG-123
Description: Fix the login bug
Detail: In Progress • High priority • Updated 2 days ago • Assignee: John Doe
```

**Key Features:**
- ✅ **Avatar Images** - VS Code's QuickPick supports `iconPath` with HTTP/HTTPS URLs
- ✅ **Platform Agnostic** - Works for both Linear and Jira tickets
- ✅ **Graceful Fallback** - Shows "Unassigned" if no assignee, "Unknown" if no update time
- ✅ **Type Safe** - Properly handles different assignee structures (Linear vs Jira)

### 3. Avatar Rendering

**Yes, we CAN render assignee images in the search modal!** 

VS Code's QuickPick API supports the `iconPath` property, which can accept:
- Local file URIs (`vscode.Uri.file()`)
- HTTP/HTTPS URLs (`vscode.Uri.parse()`)
- ThemeIcons (`new vscode.ThemeIcon()`)

We're using `vscode.Uri.parse(avatarUrl)` to load the assignee's avatar from the remote URL.

## Technical Details

### Platform Compatibility

The implementation is fully platform-agnostic:

**Linear:**
```typescript
interface LinearIssue {
  updatedAt: string;
  assignee?: {
    name: string;
    avatarUrl?: string;
  };
}
```

**Jira:**
```typescript
interface JiraIssue {
  updated: string;
  assignee: JiraUser | null;
}

interface JiraUser {
  displayName: string;
  avatarUrl?: string;
}
```

### Avatar Handling

```typescript
// Get assignee with platform detection
const assignee = (ticket as LinearIssue).assignee || (ticket as JiraIssue).assignee;

// Extract name (different property names)
const assigneeName = assignee 
  ? ('name' in assignee ? assignee.name : 'displayName' in assignee ? assignee.displayName : "Unknown")
  : "Unassigned";

// Add avatar if available
const avatarUrl = assignee?.avatarUrl;
if (avatarUrl) {
  item.iconPath = vscode.Uri.parse(avatarUrl);
}
```

### Time Formatting Examples

| Time Difference | Output |
|----------------|--------|
| 30 seconds | "30 seconds ago" |
| 1 minute | "1 minute ago" |
| 45 minutes | "45 minutes ago" |
| 2 hours | "2 hours ago" |
| 1 day | "1 day ago" |
| 5 days | "5 days ago" |
| 2 weeks | "2 weeks ago" |
| 3 months | "3 months ago" |
| 1 year | "1 year ago" |

## User Experience

### Search Flow

1. User invokes search with `Cmd+Shift+P` → "DevBuddy: Search Tickets"
2. Types search query (min 3 characters)
3. Sees rich preview with:
   - **Avatar image** (if assignee has one)
   - **Ticket identifier** (ENG-123, PROJ-456)
   - **Title/Summary** as description
   - **Detailed info**: Status, Priority, Last Updated, Assignee
4. Selects ticket to open full detail panel

### Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Search tickets...                                           │
├─────────────────────────────────────────────────────────────┤
│ [👤] $(issue-opened) ENG-123                                │
│      Fix authentication timeout issue                       │
│      In Progress • High priority • Updated 2 days ago •     │
│      Assignee: Sarah Chen                                   │
├─────────────────────────────────────────────────────────────┤
│ [👤] $(issue-opened) ENG-124                                │
│      Add dark mode support                                  │
│      Todo • Medium priority • Updated 5 hours ago •         │
│      Assignee: Mike Johnson                                 │
└─────────────────────────────────────────────────────────────┘
```

## Testing

To test the changes:

1. **Compile the extension:**
   ```bash
   npm run compile
   ```

2. **Launch Extension Development Host:**
   - Press F5 in VS Code
   - Or Debug → Start Debugging

3. **Test search:**
   - Open Command Palette (`Cmd+Shift+P`)
   - Run "DevBuddy: Search Tickets"
   - Type a search query (min 3 characters)
   - Verify you see:
     - Avatar images (if assignees have them)
     - Relative time (e.g., "2 days ago")
     - Assignee names
     - All info in detail line

4. **Test edge cases:**
   - Unassigned tickets (should show "Unassigned")
   - Tickets without avatars (should show default icon)
   - Recently updated tickets (should show "X minutes ago")
   - Old tickets (should show "X years ago")

## Future Enhancements

Possible improvements:
- Add color coding for priority in the detail line
- Show status emoji/icon alongside text
- Add keyboard shortcuts to filter by assignee
- Cache avatars locally for faster loading
- Add assignee filter in search (e.g., `@me` to show only your tickets)

## Files Modified

1. ✅ `src/shared/utils/timeFormatter.ts` (NEW)
   - Relative time formatting utilities
   
2. ✅ `src/extension.ts` (MODIFIED)
   - Enhanced search preview with assignee and time
   - Added avatar image support

## No Breaking Changes

- All changes are backward compatible
- Gracefully handles missing data (assignee, avatar, timestamps)
- Works with both Linear and Jira platforms
- No configuration changes required

---

**Status:** ✅ Complete and ready for testing


