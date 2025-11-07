# 🎨 Webview Ticket Detail Panel

## ✨ What's New

Click any ticket in the sidebar → Opens a beautiful **Linear-style detail panel** inside VS Code!

---

## 🖼️ Features

### Rich Ticket View
- **Full ticket details** with Linear's look & feel
- **Status dropdown** - Change status inline
- **Priority badge** with color coding
- **Metadata** - Created, updated, project, assignee
- **Labels** - Colored labels like Linear
- **Description** - Full formatted description
- **Comments** - Add comments directly

### Actions
- **Update Status** - Dropdown + button
- **Add Comment** - Text area + submit
- **Open in Linear** - Jump to Linear app
- **Refresh** - Re-fetch latest data

---

## 📊 Layout (Inspired by GitLens)

```
┌────────────────────────────────────────┐
│ ENG-456                                │
│ Implement JWT Authentication           │
│                                        │
│ ● In Progress  🟠 High  @Angelo       │
│                                        │
│ [Status ▼] [Update Status] [Open] [↻] │
├────────────────────────────────────────┤
│ Created: Nov 4, 2025                   │
│ Updated: Nov 4, 2025                   │
│ Project: Auth System                   │
├────────────────────────────────────────┤
│ Labels: [backend] [security]           │
├────────────────────────────────────────┤
│ Description                            │
│ Replace session-based authentication   │
│ with JWT tokens for better             │
│ scalability...                         │
├────────────────────────────────────────┤
│ Add Comment                            │
│ ┌────────────────────────────────────┐ │
│ │ Write a comment...                 │ │
│ └────────────────────────────────────┘ │
│ [Add Comment]                          │
└────────────────────────────────────────┘
```

---

## 🎯 Usage

### Open Ticket Detail

**From Sidebar:**
1. Click ☑️ icon in Activity Bar
2. Click any ticket
3. → Panel opens on the right!

**From Chat:**
```
@linear show me ENG-123
```
(Coming soon: Click ticket in chat response)

### Update Status

1. Open ticket detail panel
2. Select new status from dropdown
3. Click **"Update Status"**
4. ✅ Status updated in Linear!
5. Sidebar refreshes automatically

### Add Comment

1. Type in "Add Comment" box
2. Click **"Add Comment"**
3. ✅ Comment posted to Linear!

### Open in Linear

Click **"Open in Linear"** button
→ Opens ticket in your browser

---

## 🎨 Styling

### Color Scheme
- **Matches VS Code theme** (dark/light mode)
- **Status colors:**
  - 🔵 In Progress - Blue (#6366f1)
  - 🟢 Completed - Green (#10b981)
  - ⚫ Backlog - Purple (#8b5cf6)
  - ⚪ Canceled - Gray (#6b7280)

### Priority Badges
- 🔴 **Urgent** - Red
- 🟠 **High** - Orange
- 🟡 **Medium** - Yellow
- 🟢 **Low** - Green
- ⚪ **None** - White

### Layout
- Clean, spacious
- Rounded corners
- Subtle borders
- Button hover effects
- Dropdown styling

---

## 🔧 Technical Details

### Implementation
- **React with TypeScript** - Modern component architecture
- **esbuild** - Fast bundling for both webviews
- **CSS Modules** - Scoped styling for components
- **VS Code Webview API** - Extension ↔ Webview communication
- **VS Code theming** - Automatic theme inheritance via CSS variables
- **Retained context** - Panel stays when hidden

### Architecture
The webviews are built using React and are located in `webview-ui/`:
- `src/standup-builder/` - Standup Builder React app
- `src/ticket-panel/` - Ticket Panel React app
- `src/shared/` - Reusable components, hooks, and utilities
  - `components/` - Button, Input, Select, TextArea, Badge
  - `hooks/` - useVSCode (typed message passing)
  - `types/` - TypeScript interfaces for messages
  - `global.css` - Theme variables and base styles

### Build System
- **Development**: `npm run watch:webview` - Auto-rebuild on changes
- **Production**: `npm run compile:webview` - Minified bundles
- **Output**: `out/webview/standup-builder.js` and `out/webview/ticket-panel.js`

### Files
- `webview-ui/build.js` - esbuild configuration
- `webview-ui/tsconfig.json` - React TypeScript config
- `src/views/linearTicketPanel.ts` - Panel logic (extension side)
- `src/views/standupBuilderPanel.ts` - Panel logic (extension side)
- `src/extension.ts` - Command registration

### Message Flow
```
User clicks ticket
    ↓
Extension creates webview
    ↓
Generates HTML with ticket data
    ↓
User clicks "Update Status"
    ↓
Webview sends message
    ↓
Extension calls Linear API
    ↓
Success! Refresh panel + sidebar
```

---

## ⚡ Quick Actions

| Action | How | Result |
|--------|-----|--------|
| **View Ticket** | Click in sidebar | Opens detail panel |
| **Change Status** | Dropdown → Update | Updates in Linear |
| **Add Comment** | Type → Submit | Posts to Linear |
| **Open Linear** | Click button | Opens in browser |
| **Refresh** | Click ↻ | Re-fetches data |

---

## 🆚 Sidebar vs Webview

### Sidebar (☑️)
- ✅ Quick overview
- ✅ See all tickets
- ✅ Fast navigation
- ✅ Quick actions (▶️ ✓)
- ❌ Limited detail
- ❌ No input boxes

### Webview Panel
- ✅ Full ticket details
- ✅ Rich formatting
- ✅ Input boxes (comments)
- ✅ Dropdowns (status)
- ✅ Linear-style UI
- ❌ One ticket at a time

**Best of both:** Use sidebar to browse, webview to deep-dive!

---

## 🎬 Example Workflow

1. **Morning:** Open sidebar → See your tickets
2. **Click:** Click "ENG-456" → Detail panel opens
3. **Read:** Check description, labels, project
4. **Start:** Dropdown → "In Progress" → Update
5. **Work:** Code all day...
6. **Comment:** "Implemented JWT validation" → Add Comment
7. **Complete:** Dropdown → "Done" → Update → 🎉

---

## 💡 Tips

### Keep Panel Open
- Panel stays when switching files
- Click ticket again to switch
- Close with X button

### Multiple Tickets
- Click different tickets → Same panel updates
- No need to close/reopen

### Refresh Data
- Click ↻ to get latest from Linear
- Auto-refreshes after status update
- Sidebar also refreshes

### Theme Support
- Auto-matches your VS Code theme
- Dark mode → Dark panel
- Light mode → Light panel

---

## 🔮 Future Enhancements

Could add:
- 📎 Attachments
- 💬 Comment threads
- 👥 Assignee picker
- 🏷️ Label editor
- 📅 Due date picker
- ⏱️ Time tracking
- 🔗 Linked issues
- 📊 Issue history

**Want any of these?** Let me know!

---

## 🐛 Troubleshooting

### Panel not opening
- Check console for errors
- Verify ticket has valid ID
- Try refreshing sidebar

### Status not updating
- Verify Linear API token
- Check token permissions (write access)
- Try refreshing panel

### Comments not posting
- Verify token has write permissions
- Check comment isn't empty
- Try again after refresh

---

**Status:** ✅ Complete!
**Package:** cursor-monorepo-tools-0.1.0.vsix (183 KB)
**New File:** `src/views/linearTicketPanel.ts`
**Ready to use!** 🚀


