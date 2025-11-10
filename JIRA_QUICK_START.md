# DevBuddy Jira Cloud Quick Start Guide

## Overview

DevBuddy now supports Jira Cloud! This guide will help you get started with managing your Jira issues directly from VS Code.

## Prerequisites

- VS Code 1.90.0 or higher
- DevBuddy extension installed
- Jira Cloud account (e.g., `yourcompany.atlassian.net`)
- Admin access to create API tokens

## Setup (5 minutes)

### Step 1: Generate Jira API Token

1. Go to [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **"Create API token"**
3. Give it a name: "DevBuddy VS Code"
4. Click **"Create"**
5. **Copy the token** (you won't see it again!)

### Step 2: Run DevBuddy Setup

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Type: `DevBuddy: Setup Jira Cloud`
3. **Paste any URL from your Jira workspace:**
   - You can paste a ticket URL: `https://yourcompany.atlassian.net/browse/ENG-123`
   - Or a board URL: `https://yourcompany.atlassian.net/jira/software/projects/ENG/boards/1`
   - DevBuddy will automatically extract your site URL!
4. Enter your email address:
   ```
   you@yourcompany.com
   ```
5. Paste your API token (from Step 1)

### Step 3: Test Connection

The setup will automatically test your connection. You should see:
```
✅ Successfully connected to Jira Cloud!
```

If you see an error, check:
- Jira URL contains `atlassian.net`
- Email matches your Jira account
- API token is valid and copied correctly

### Step 4: Set Default Project (Optional)

Open Settings (`Cmd+,` or `Ctrl+,`) and search for "DevBuddy":

```json
{
  "devBuddy.provider": "jira",
  "devBuddy.jira.defaultProject": "ENG"  // Your project key
}
```

## Using DevBuddy with Jira

### View Your Issues

1. Click the **DevBuddy icon** (☑️) in the Activity Bar (left sidebar)
2. Your Jira issues will appear grouped by status:
   - 📋 Backlog
   - 🔵 To Do
   - 🟡 In Progress
   - ✅ Done

### Quick Actions

**Right-click on any issue:**
- 🔗 **Open Issue** - Open in browser
- ✏️ **Update Status** - Change workflow status
- 👤 **Assign to Me** - Assign yourself
- 💬 **Add Comment** - Add a comment
- 📋 **Copy Issue Key** - Copy KEY-123
- 🔗 **Copy Issue URL** - Copy full URL

### Create New Issue

**Method 1: Sidebar**
1. Click the **+ icon** in the Jira Issues view title
2. Fill in the form (coming soon - use Method 2 for now)

**Method 2: Command Palette**
1. `Cmd+Shift+P` → `DevBuddy: Create Jira Issue`
2. Follow the prompts

### Search Issues (JQL)

```typescript
// Open Command Palette
DevBuddy: Refresh Jira Issues

// Issues are automatically filtered to:
// - Assigned to you
// - Ordered by updated date
```

**Custom JQL** (coming soon):
```
project = ENG AND assignee = currentUser() AND status != Done
```

### Update Issue Status

1. Right-click issue → **Update Status**
2. Select new status from workflow
3. Issue moves to new status group

### Add Comments

1. Right-click issue → **Add Comment**
2. Type your comment
3. Comment is added to Jira

## Configuration Options

### Basic Settings

```json
{
  // Platform selection
  "devBuddy.provider": "jira",
  
  // Jira Cloud settings
  "devBuddy.jira.cloud.siteUrl": "yourcompany.atlassian.net",
  "devBuddy.jira.cloud.email": "you@yourcompany.com",
  "devBuddy.jira.defaultProject": "ENG",
  
  // Behavior
  "devBuddy.jira.maxResults": 50,
  "devBuddy.jira.autoRefreshInterval": 5,  // minutes
  "devBuddy.jira.openInBrowser": true
}
```

### Advanced Settings

```json
{
  // Debug mode (for troubleshooting)
  "devBuddy.debugMode": true,
  
  // AI features (works with Jira)
  "devBuddy.ai.model": "auto",
  "devBuddy.writingTone": "professional"
}
```

## Commands

### Setup & Configuration
- `DevBuddy: Setup Jira Cloud` - Initial setup wizard
- `DevBuddy: Test Jira Connection` - Verify connection
- `DevBuddy: Update Jira API Token` - Update your token
- `DevBuddy: Reset Jira Configuration` - Start over

### Issue Management
- `DevBuddy: Refresh Jira Issues` - Reload issues
- `DevBuddy: Create Jira Issue` - Create new issue
- `DevBuddy: Open Jira Issue` - Open in browser
- `DevBuddy: Update Jira Issue Status` - Change status
- `DevBuddy: Assign Issue to Me` - Assign to yourself
- `DevBuddy: Add Comment to Issue` - Add comment
- `DevBuddy: Copy Issue Key` - Copy KEY-123
- `DevBuddy: Copy Issue URL` - Copy full URL

## Keyboard Shortcuts

No default shortcuts yet, but you can add your own!

**Settings → Keyboard Shortcuts**

```json
{
  "key": "cmd+shift+j",
  "command": "devBuddy.jira.refreshIssues"
},
{
  "key": "cmd+shift+n",
  "command": "devBuddy.jira.createIssue"
}
```

## Troubleshooting

### "Failed to connect to Jira"

**Check:**
1. Site URL format: `company.atlassian.net` (no https://)
2. Email is correct
3. API token is valid
4. You have network access to Jira

**Enable debug mode:**
```json
{
  "devBuddy.debugMode": true
}
```
Then check: **View → Output → DevBuddy**

### "No issues found"

**Possible reasons:**
1. No issues assigned to you
2. Project filter is too restrictive
3. Issues are in states not synced

**Try:**
- Remove project filter
- Check Jira web to confirm you have issues

### API token expired

1. Generate new token at [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Run: `DevBuddy: Update Jira API Token`
3. Paste new token

### "Invalid issue response"

This means Jira's response structure changed. Please:
1. Enable debug mode
2. Check Output panel
3. Report issue with logs

## Feature Comparison

### ✅ Available Now
- View issues
- Create issues
- Update status
- Assign issues
- Add comments
- JQL search
- Sprints & boards
- Workflow transitions

### ⏳ Coming Soon
- Webview detail panel (like Linear)
- Create issue form (rich UI)
- Branch creation from issues
- AI standup with Jira context
- AI PR summaries with Jira links
- TODO → Jira issue converter
- Custom fields UI

See **`FEATURE_COMPATIBILITY_MATRIX.md`** for complete details.

## Switching Between Linear and Jira

You can switch platforms anytime:

```json
{
  "devBuddy.provider": "linear"  // or "jira"
}
```

- Settings are preserved for both platforms
- Just change the provider and reload
- Each platform has its own view

## Security & Privacy

### API Token Storage
- Stored securely in VS Code's Secret Storage
- Never sent anywhere except your Jira instance
- Can be deleted anytime with reset command

### Data Privacy
- All API calls go directly to your Jira instance
- No data sent to third parties
- AI features use GitHub Copilot (respects Copilot privacy settings)
- Can disable AI completely: `devBuddy.ai.disabled: true`

### Network
- Only communicates with:
  - Your Jira Cloud instance
  - GitHub Copilot (if AI enabled)
- No telemetry by default

## Getting Help

### Documentation
- **README.md** - Main documentation
- **FEATURE_COMPATIBILITY_MATRIX.md** - Feature comparison
- **JIRA_CLOUD_IMPLEMENTATION_SUMMARY.md** - Technical details

### Debug Mode
Enable to see detailed logs:
```json
{
  "devBuddy.debugMode": true
}
```

View logs: **View → Output → DevBuddy**

### Common Issues
1. **Connection fails**: Check site URL format
2. **No issues**: Check Jira assignments
3. **Status update fails**: Check workflow permissions
4. **API errors**: Check token hasn't expired

## Tips & Tricks

### Faster Workflow
1. Pin DevBuddy sidebar for quick access
2. Use keyboard shortcuts
3. Right-click for quick actions

### JQL Power Users
Currently limited to assigned issues, but full JQL coming soon!

### Multiple Projects
Set default project, but can still access all projects you have permission to.

### Offline Work
Not supported yet - requires connection to Jira.

## Next Steps

### Explore Features
- Try all the context menu actions
- Create a test issue
- Update statuses
- Add comments

### Customize
- Set your default project
- Adjust auto-refresh interval
- Configure AI settings

### Provide Feedback
- What features do you need most?
- Any bugs or issues?
- Suggestions for improvement?

---

**Happy Jira management from VS Code!** 🎉

For more help, see the main [README.md](README.md) or open an issue.

