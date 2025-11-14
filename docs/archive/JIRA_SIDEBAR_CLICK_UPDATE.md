# ✅ Jira Sidebar Click Behavior Updated

## Summary

Updated the Jira sidebar to open the webview panel when clicking on an issue instead of opening Jira in the browser.

## What Changed

### File: `src/shared/views/UniversalTicketsProvider.ts`

**Before:**
```typescript
item.command = {
  command: "devBuddy.jira.openIssue",
  title: "Open Issue",
  arguments: [issue],
};
```

**After:**
```typescript
item.command = {
  command: "devBuddy.jira.viewIssueDetails",
  title: "View Issue Details",
  arguments: [{ issue }],
};
```

## Behavior

### ✅ **New Behavior** (After Fix)
1. Click on a Jira issue in the sidebar
2. Opens the **Jira Ticket Panel webview** in VS Code
3. View and edit issue details inline
4. Can still open in Jira using the "Open in Jira" button in the webview

### ❌ **Old Behavior** (Before Fix)
1. Click on a Jira issue in the sidebar
2. Opens Jira in external browser
3. No inline editing capability

## Consistency with Linear

This matches the Linear behavior:
- **Linear**: Click sidebar item → Opens Linear Ticket Panel webview
- **Jira**: Click sidebar item → Opens Jira Ticket Panel webview

Both platforms now provide:
- Inline viewing and editing
- Quick access without leaving VS Code
- Option to open in external app/web if needed

## Command Mapping

| Action | Command | Opens |
|--------|---------|-------|
| Click Jira issue in sidebar | `devBuddy.jira.viewIssueDetails` | Jira Ticket Panel (webview) |
| Click Linear issue in sidebar | `devBuddy.openTicket` | Linear Ticket Panel (webview) |
| Context menu → Open in Jira | `devBuddy.jira.openIssue` | Jira in browser |
| Context menu → Open in Linear | `devBuddy.openInLinear` | Linear in browser/app |

## Testing

1. **Launch Extension Development Host** (F5)
2. **Setup Jira** (if not already configured)
3. **Click on a Jira issue** in the sidebar
4. **Verify**: Jira Ticket Panel opens in a webview
5. **Test**: Edit summary, description, status, assignee
6. **Test**: Add comments
7. **Test**: "Open in Jira" button opens external browser

---

**Status:** ✅ **Complete**  
**Date:** November 9, 2025  
**Impact:** Improved UX - users can now view and edit Jira issues without leaving VS Code

