# Your Ticket Sidebar

![DevBuddy Sidebar Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/start_ticket_branch.gif)

The DevBuddy sidebar is your command center for multi-platform ticket management. It shows all your assigned tickets organized by workflow status.

## Universal Sidebar

DevBuddy provides a single unified sidebar that works across all platforms:
- **Linear** - Full feature support with branch integration
- **Jira** - Core features with workflow transitions
- **Seamless switching** - Change platforms via settings

## Sidebar Features

### Organized by Status
Tickets are automatically grouped by their workflow state:
- **Backlog** - Not yet prioritized
- **Todo** - Ready to start
- **In Progress** - Currently working on
- **Done** - Completed tickets
- **Canceled** - Discontinued work

*Note: Exact status names depend on your platform's workflow configuration*

### Visual Indicators
- **Color-coded icons** based on status
- **Priority indicators** (urgent, high, medium, low)
- **Branch badges** showing associated branches (Linear)
- **PR indicators** when pull requests are linked (Linear)
- **Platform badges** showing which system the ticket is from

### Quick Actions

Each ticket has inline action buttons:

**Linear Tickets:**
- **Start Branch** - Create a new feature branch
- **Change Status** - Update ticket workflow state
- **Associate Branch** - Link existing git branches
- **Open PR** - View pull requests
- **Checkout Branch** - Switch to associated branch

**Jira Issues:**
- **Update Status** - Update workflow transition
- **Assign to Me** - Take ownership
- **Add Comment** - Add a comment
- **Open Issue** - View in browser
- **Copy** - Copy issue key or URL

### Click to View Details

Click any ticket to open a detailed panel showing:
- Full description with markdown rendering
- Comments and activity history
- Project and team information
- Labels, priority, and estimate
- Related tickets and sub-issues (Linear)
- Quick action buttons

**Linear**: Opens rich webview panel with full ticket management  
**Jira**: Opens in browser (webview panels coming soon!)

## Platform Selection

Switch platforms at any time:
1. Open Settings (Cmd/Ctrl + ,)
2. Search for "devBuddy.provider"
3. Select "linear" or "jira"
4. Sidebar updates automatically!

Try opening the sidebar and exploring a ticket!


