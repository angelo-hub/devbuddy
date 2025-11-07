# Comments and Navigation Improvements

## Overview

The ticket panel now includes two major improvements:
1. **Comments display** - Shows all comments with count, even if empty
2. **In-extension navigation** - Clicking parent/child issues opens them in the Linear Buddy tab

## New Features

### 1. Comments Section

#### Always Visible
- Shows **"Comments (N)"** header with count
- Empty state message when no comments exist
- Encourages users to add the first comment

#### Comment Display
Each comment shows:
- **User avatar** and name
- **Relative timestamp** (e.g., "2h ago", "just now")
- **Comment body** with full text
- Left border accent for visual hierarchy
- Hover effects

#### Data from Linear API
Fetches comments using Linear's GraphQL API:
```graphql
comments {
  nodes {
    id
    body
    createdAt
    user {
      id
      name
      avatarUrl
    }
  }
}
```

### 2. In-Extension Navigation

#### Seamless Issue Browsing
When clicking parent or child issues:
- ✅ Opens in the **same Linear Buddy webview panel**
- ✅ Updates panel title with new issue
- ✅ No new tabs or browser windows
- ✅ Smooth transition with all issue data

#### How It Works
1. User clicks parent or child issue link
2. Webview sends `openIssue` message with issue ID
3. Extension fetches full issue data from Linear API
4. Panel updates with new issue content
5. Panel title updates to show new issue identifier

## Code Changes

### Backend (Extension)

**`src/utils/linearClient.ts`**
- Added `comments` field to `LinearIssue` interface
- Updated `getIssue()` GraphQL query to fetch comments

**`src/views/linearTicketPanel.ts`**
- Added `handleOpenIssue(issueId)` method
- Fetches issue by ID and updates panel
- Updates panel title to match new issue
- Added `openIssue` message handler

### Frontend (Webview)

**`webview-ui/src/shared/types/messages.ts`**
- Added `comments` to `LinearIssue` interface
- Added `openIssue` command to message types

**`webview-ui/src/ticket-panel/components/Comments.tsx`** (NEW)
- React component to display comments list
- Empty state when no comments
- Relative time formatting
- User info with avatars

**`webview-ui/src/ticket-panel/components/Comments.module.css`** (NEW)
- Comment card styling
- Empty state design
- User info layout
- Hover effects

**`webview-ui/src/ticket-panel/components/SubIssues.tsx`**
- Added `onOpenIssue` prop
- Changed links from `href={url}` to `href="#"` with click handler
- Prevents default navigation, sends message to extension

**`webview-ui/src/ticket-panel/App.tsx`**
- Added `handleOpenIssue` function
- Passes handler to `SubIssues` component
- Integrated `Comments` component
- Positioned comments before comment form

## Visual Layout

```
┌─────────────────────────────────────┐
│ Ticket Header                       │
│ Status & Assignee Selectors         │
│ Metadata                            │
│ Labels                              │
├─────────────────────────────────────┤
│ 🔗 Pull Requests                    │
├─────────────────────────────────────┤
│ ⬆️ Parent Issue                     │  ← Clickable, opens in panel
│ ⬇️ Sub-issues                       │  ← Clickable, opens in panel
├─────────────────────────────────────┤
│ Description                         │
├─────────────────────────────────────┤
│ 💬 Comments (3)                     │  ← NEW!
│   ├─ @alice - 2h ago                │
│   │  "Looking good!"                │
│   ├─ @bob - 1d ago                  │
│   │  "Please review..."             │
│   └─ @charlie - 2d ago              │
│      "Started working on this"      │
├─────────────────────────────────────┤
│ Add Comment Form                    │
└─────────────────────────────────────┘
```

## Usage

### Viewing Comments

1. **Open any Linear ticket** in the panel
2. **Scroll to Comments section** (below description)
3. See all comments with:
   - User who posted
   - When they posted (relative time)
   - Comment text

### Empty State

If no comments exist:
- Shows dashed border box
- Message: "No comments yet"
- Subtext: "Use the comment form below to add the first comment"

### Navigating Between Issues

#### From Parent to Child
1. Open a parent issue with sub-issues
2. Click any sub-issue card
3. Panel updates to show that sub-issue
4. Click parent link to go back

#### From Child to Parent
1. Open a sub-issue
2. See parent issue at top
3. Click parent card
4. Panel updates to show parent issue

## Time Formatting

Comments show relative timestamps:
- `just now` - Less than 1 minute
- `5m ago` - Minutes (up to 59m)
- `2h ago` - Hours (up to 23h)
- `3d ago` - Days (up to 6d)
- `2w ago` - Weeks (up to 3w)
- Full date - Older than 1 month

## Benefits

### Comments
1. **Always visible** - Users know comment count at a glance
2. **Context** - See full discussion without leaving extension
3. **Timeline** - Relative timestamps show activity recency
4. **Contributors** - Avatars show who's involved

### Navigation
1. **Faster workflow** - No context switching
2. **Extension-native** - Everything in one place
3. **No browser tabs** - Cleaner workspace
4. **History** - Easy to navigate up and down hierarchy

## Testing

1. **Reload the extension**
   ```
   Cmd+Shift+P → "Developer: Reload Window"
   ```

2. **Test Comments Display**
   - Open a ticket with comments
   - Verify comments show correctly
   - Open a ticket without comments
   - Verify empty state displays

3. **Test Navigation**
   - Open a parent issue with sub-issues
   - Click a sub-issue → Should open in same panel
   - Click parent link → Should go back
   - Verify panel title updates each time

4. **Test Comment Addition**
   - Add a new comment using the form
   - Verify it appears in the comments section
   - Check timestamp shows "just now"

## Notes

- All data comes from Linear's API (no external services)
- Comments are read-only in display (add via form)
- Navigation preserves webview state
- Panel title always matches current issue
- No browser windows opened during navigation

