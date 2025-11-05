# Linear Tickets Side Panel - Visual Guide

## Overview

The Linear Tickets side panel now features **enhanced color coding** for ticket progress and **project-level navigation** to find unassigned tickets.

## Color Coding System

### Status-Based Color Coding

Each ticket's status is now visually distinguished with specific colors and icons:

#### 🔵 **Started (Blue)** - `charts.blue`
- **Icon**: Play circle ▶️
- **Meaning**: Work is actively in progress
- **Visual**: Blue play-circle icon

#### 🟢 **Completed (Green)** - `charts.green`
- **Icon**: Check-all ✓✓
- **Meaning**: Task is finished
- **Visual**: Green check icon

#### ⚫ **Canceled (Gray)** - `disabledForeground`
- **Icon**: Circle-slash ⊘
- **Meaning**: Task was canceled/abandoned
- **Visual**: Gray circle-slash icon

#### 🟣 **Backlog (Purple)** - `charts.purple`
- **Icon**: Circle-outline ○
- **Meaning**: Task is in the backlog
- **Visual**: Purple circle-outline icon

#### 🟠 **Unstarted (Orange/Priority-based)** - `charts.orange`
- **Icon**: Circle-outline ○
- **Meaning**: Task hasn't started yet
- **Visual**: Orange circle for status header, priority colors for individual tickets

### Priority-Based Color Coding (for Unstarted Tickets)

When tickets are "unstarted", they display priority-based colors:

#### 🔴 **Urgent (Priority 1)** - `errorForeground`
- **Icon**: Alert ⚠️
- **Meaning**: Highest priority - needs immediate attention

#### 🟠 **High (Priority 2)** - `editorWarning.foreground`
- **Icon**: Arrow-up ↑
- **Meaning**: High priority

#### 🟡 **Medium (Priority 3)** - `charts.yellow`
- **Icon**: Circle-outline ○
- **Meaning**: Medium priority

#### ⚪ **Low (Priority 4)** - `descriptionForeground`
- **Icon**: Arrow-down ↓
- **Meaning**: Low priority

#### ⚪ **None (Priority 0)** - Default
- **Icon**: Dash —
- **Meaning**: No priority set

## Side Panel Structure

The side panel is now organized into clear sections:

```
📚 My Assigned Tickets (3)
  🔵 In Progress (2)
    ▶️ [ENG-123] Fix login bug
    ▶️ [ENG-124] Update API docs
  🟠 Todo (1)
    ⚠️ [ENG-125] Critical security patch

───────────────────

🔍 Find Unassigned Tickets (2)
  📦 Project Alpha
    ⚠️ [ENG-130] High priority unassigned
    ○ [ENG-131] Feature request
  📦 Project Beta
    ○ [ENG-140] Bug fix needed
```

### Section Headers

- **📚 My Assigned Tickets** - Shows all tickets assigned to you, grouped by status
- **🔍 Find Unassigned Tickets** - Shows your projects with expandable lists of unassigned tickets

### Visual Elements

1. **Status Headers**: Bold headers with colored icons showing the status type and count
2. **Ticket Items**: Individual tickets with icons based on status/priority
3. **Project Items**: Collapsible project entries (click to expand and see unassigned tickets)
4. **Divider**: Visual separator between sections

## Project Navigation Features

### Finding Unassigned Tickets

1. **View Projects**: Scroll to the "Find Unassigned Tickets" section
2. **Expand Project**: Click on a project to see its unassigned tickets
3. **Claim Ticket**: Click on any unassigned ticket to view details and assign yourself

### Project List

The project list shows:
- All active projects you're a member of
- Projects in "started" state
- Recently updated projects first
- Count of unassigned tickets available

### Unassigned Ticket Filtering

When you expand a project, you'll see:
- ✅ Tickets with **no assignee** (unassigned)
- ✅ Tickets in **unstarted**, **started**, or **backlog** states
- ✅ Up to **50 most recently updated** unassigned tickets
- ❌ Completed or canceled tickets are hidden

## Visual Theme Integration

All colors use VS Code's theme-aware colors, ensuring:
- ✨ Seamless integration with your theme (dark/light)
- 🎨 Consistent with VS Code's design language
- 👁️ High contrast and accessibility-friendly

### Theme Colors Used

| Color Key | Light Theme | Dark Theme | Usage |
|-----------|------------|-----------|-------|
| `charts.blue` | Blue | Light Blue | Started status |
| `charts.green` | Green | Light Green | Completed status |
| `charts.purple` | Purple | Light Purple | Backlog status |
| `charts.orange` | Orange | Light Orange | Unstarted status |
| `charts.yellow` | Yellow | Light Yellow | Medium priority |
| `errorForeground` | Red | Light Red | Urgent priority |
| `editorWarning.foreground` | Orange | Light Orange | High priority |
| `disabledForeground` | Gray | Light Gray | Canceled status |

## Tips for Effective Use

### Quick Status Recognition
- **Blue play icon** = Someone's working on it (might be you!)
- **Orange/Priority colors** = Ready to start
- **Green check** = All done
- **Purple inbox** = In the backlog

### Finding Work
1. **Need a new ticket?** → Expand projects in "Find Unassigned Tickets"
2. **Want high priority items?** → Look for red alert icons (⚠️)
3. **Checking progress?** → Count blue play icons in your assigned tickets

### Workflow Integration
1. **Start your day**: Check "My Assigned Tickets" for your active work
2. **Need more work**: Browse "Find Unassigned Tickets" by project
3. **Prioritize**: Use color coding to identify urgent items
4. **Track progress**: Watch tickets move from orange → blue → green

## Configuration

### Auto-Refresh
The panel automatically refreshes based on your settings:
```json
{
  "monorepoTools.autoRefreshInterval": 5  // minutes (0 to disable)
}
```

### Team Filtering
Filter tickets by team:
```json
{
  "monorepoTools.linearTeamId": "your-team-id"
}
```

### Show/Hide Unassigned Section
The unassigned tickets section is enabled by default and shows active projects automatically.

## Keyboard Shortcuts

- **Refresh**: Click the refresh icon or use the command palette (`Cmd+Shift+P` → "Linear Buddy: Refresh Tickets")
- **Open in Linear**: Click ticket → "Open in Linear" button
- **Configure**: If not set up, click "Configure Linear API Token"

## Future Enhancements

Potential improvements being considered:
- 🔄 Assign unassigned tickets directly from VS Code
- 🏷️ Filter by labels
- 📊 Show ticket estimates and time tracking
- 🔔 Notifications for ticket updates
- 📈 Progress tracking across projects

---

**Pro Tip**: Hover over any ticket to see a detailed tooltip with the identifier, title, and current status!


