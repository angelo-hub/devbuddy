# Sub-Issues Feature

## Overview

The ticket panel now displays sub-issues (child issues) and parent issues directly in the webview, showing the hierarchical relationship between Linear issues.

## Features

### Parent Issue Display
If a ticket is a sub-issue, it shows its parent issue at the top:
- **⬆️ Parent Issue** section
- Clickable card with identifier and title
- Opens parent in new tab when clicked

### Sub-Issues Display
If a ticket has sub-issues, it shows them in an organized list:
- **⬇️ Sub-issues (count)** section
- Each sub-issue card shows:
  - Issue identifier (e.g., `ENG-123`)
  - Status badge (color-coded by state type)
  - Priority badge (Urgent/High/Medium/Low)
  - Issue title
  - Assignee name and avatar

### Visual Design

#### Status Colors
- ✅ **Completed** - Green
- 🔄 **Started** - Yellow/Amber
- ⏸️ **Unstarted** - Gray
- 📋 **Backlog** - Light gray
- ❌ **Canceled** - Red

#### Priority Indicators
- 🔴 **Urgent** - Red badge
- 🟠 **High** - Orange badge
- 🔵 **Medium** - Blue badge
- ⚪ **Low** - Gray badge
- No badge for "None" priority

#### Interaction
- All cards are clickable and open in Linear
- Hover effects with smooth animations
- Left border accent on sub-issues
- Arrow indicator (→) that slides on hover

## Data Source

The sub-issues data comes from **Linear's GraphQL API** using the following fields:

```graphql
children {
  nodes {
    id
    identifier
    title
    url
    priority
    state {
      id
      name
      type
    }
    assignee {
      id
      name
      avatarUrl
    }
  }
}

parent {
  id
  identifier
  title
  url
}
```

## Code Changes

### Backend (Linear API)

1. **`src/utils/linearClient.ts`**
   - Added `children` and `parent` fields to `LinearIssue` interface
   - Updated all GraphQL queries in:
     - `getMyIssues()` - Fetch issues with sub-issues
     - `getIssue()` - Fetch single issue with sub-issues
     - `getIssuesByProject()` - Fetch project issues with sub-issues

### Frontend (Webview)

1. **`webview-ui/src/shared/types/messages.ts`**
   - Added `children` and `parent` to `LinearIssue` interface

2. **`webview-ui/src/ticket-panel/components/SubIssues.tsx`** (NEW)
   - React component to display parent and sub-issues
   - Status color mapping
   - Priority badge logic
   - Assignee display with avatars

3. **`webview-ui/src/ticket-panel/components/SubIssues.module.css`** (NEW)
   - Styling for parent/sub-issue cards
   - Color-coded status badges
   - Priority badges
   - Hover effects and animations
   - Dark theme adjustments

4. **`webview-ui/src/ticket-panel/App.tsx`**
   - Imported and integrated `SubIssues` component
   - Positioned between PRs and description
   - Conditional divider rendering

## Usage

### Viewing Parent Issues
1. Open a sub-issue in the ticket panel
2. See the **⬆️ Parent Issue** section at the top
3. Click to navigate to the parent issue

### Viewing Sub-Issues
1. Open a parent issue in the ticket panel
2. See the **⬇️ Sub-issues (N)** section
3. View all sub-issues with their current status and assignee
4. Click any sub-issue to open it

### Visual Hierarchy

```
┌─────────────────────────────────────┐
│ Ticket Header                       │
│ Status & Assignee Selectors         │
│ Metadata                            │
│ Labels                              │
├─────────────────────────────────────┤
│ 🔗 Pull Requests                    │  ← New PRs section
├─────────────────────────────────────┤
│ ⬆️ Parent Issue                     │  ← New parent section
│ ⬇️ Sub-issues (3)                   │  ← New sub-issues section
│   ├─ ENG-124 [Started] [High]      │
│   ├─ ENG-125 [Unstarted]           │
│   └─ ENG-126 [Completed]           │
├─────────────────────────────────────┤
│ Description                         │
│ Comments                            │
└─────────────────────────────────────┘
```

## Benefits

1. **Better Context** - See the full issue hierarchy at a glance
2. **Quick Navigation** - Jump between parent and child issues
3. **Status Tracking** - Monitor sub-issue progress visually
4. **Priority Awareness** - See which sub-issues are most important
5. **Team Visibility** - Know who's working on each sub-issue

## Examples

### Epic with Sub-Issues
```
Main Issue: ENG-100 "Implement User Authentication"
Sub-issues:
  - ENG-101 [Started] [Urgent] Login Form UI - @alice
  - ENG-102 [Unstarted] [High] Password Reset - @bob
  - ENG-103 [Completed] [Medium] OAuth Integration - @charlie
```

### Sub-Issue with Parent
```
Current Issue: ENG-101 "Login Form UI"
Parent: ⬆️ ENG-100 "Implement User Authentication"
```

## Testing

To test this feature:

1. **Reload the extension**
   ```
   Cmd+Shift+P → "Developer: Reload Window"
   ```

2. **Create test issues in Linear**
   - Create a parent issue
   - Add 2-3 sub-issues to it
   - Assign different statuses and priorities

3. **Open in extension**
   - Open the parent issue - should show sub-issues
   - Open a sub-issue - should show parent
   - Click cards to navigate

4. **Verify display**
   - Status colors match issue states
   - Priority badges show correctly
   - Assignee avatars load
   - Hover effects work smoothly

## Notes

- Works with Linear's native parent-child issue relationships
- No limit on number of sub-issues displayed
- All links open in new browser tabs
- Avatar images are loaded from Linear's CDN
- Falls back gracefully if no sub-issues or parent exist

