# Linear Tickets Color Code Quick Reference

## 🎨 Status Colors

| Status | Color | Icon | Description |
|--------|-------|------|-------------|
| 🔵 **Started** | Blue | ▶️ play-circle | Work in progress |
| 🟢 **Completed** | Green | ✓✓ check-all | Task finished |
| 🟣 **Backlog** | Purple | ○ circle-outline | In backlog |
| 🟠 **Unstarted** | Orange | ○ circle-large-outline | Not started |
| ⚫ **Canceled** | Gray | ⊘ circle-slash | Canceled |

## 🎯 Priority Colors (Unstarted Tickets)

| Priority | Color | Icon | Level |
|----------|-------|------|-------|
| 🔴 **P1** | Red | ⚠️ alert | Urgent |
| 🟠 **P2** | Orange | ↑ arrow-up | High |
| 🟡 **P3** | Yellow | ○ circle-outline | Medium |
| ⚪ **P4** | Gray | ↓ arrow-down | Low |
| ⚪ **P0** | Gray | — dash | None |

## 📋 Side Panel Structure

```
📚 My Assigned Tickets (count)
  🔵 Started (count)
    ▶️ [TICKET-1] Title
  🟠 Todo (count)
    ⚠️ [TICKET-2] Title

───────────────────

🔍 Find Unassigned Tickets (count)
  📦 Project Name ⏷
    ⚠️ [TICKET-3] Unassigned urgent
    ○ [TICKET-4] Unassigned normal
```

## 🔧 Quick Actions

- **Refresh Tickets**: `Cmd+Shift+P` → "Refresh Tickets"
- **Open Ticket**: Click on any ticket
- **View Unassigned**: Click project to expand
- **Configure**: Click "Configure Linear API Token"

## 💡 Visual Quick Tips

- 🔵 Blue = Someone's working on it
- ⚠️ Red Alert = Urgent, needs attention now
- 📦 Projects = Click to see unassigned work
- ✓ Green = Done and dusted
- 🟣 Purple = In the backlog

## 🎯 Workflow

1. **Start Day**: Check blue (started) tickets
2. **Need Work**: Expand projects for unassigned
3. **Prioritize**: Look for red (urgent) icons
4. **Track Progress**: Watch tickets go orange → blue → green

---
For detailed information, see [LINEAR_VISUAL_GUIDE.md](LINEAR_VISUAL_GUIDE.md)


