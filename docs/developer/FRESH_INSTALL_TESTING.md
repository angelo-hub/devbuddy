# Fresh Install Testing Guide

## Overview

DevBuddy now has comprehensive tools for testing the new user experience (fresh install simulation).

## Testing Methods

### Method 1: Fresh Install Test Launch Configuration (Recommended)

**Launch Config:** `Run Extension (Fresh Install Test)`

**What it does:**
- Sets `DEVBUDDY_TEST_FRESH_INSTALL=true`
- Sets `DEVBUDDY_OPEN_WALKTHROUGH=true`
- Automatically clears all credentials and settings on activation
- Opens the walkthrough automatically

**How to use:**
1. Open Run & Debug panel (Cmd/Ctrl+Shift+D)
2. Select "Run Extension (Fresh Install Test)" from dropdown
3. Press F5 or click Start Debugging
4. Extension launches in fresh install state
5. Walkthrough opens automatically

### Method 2: Manual Reset Command

**Command:** `DevBuddy: Reset Extension (Test Mode)`

**What it does:**
- Shows confirmation dialog (safety check)
- Deletes all secrets (API tokens)
- Resets all DevBuddy settings
- Clears global state (branch associations, etc.)
- Offers to reload window or open walkthrough

**How to use:**
1. Open Command Palette (Cmd/Ctrl+Shift+P)
2. Type: "DevBuddy: Reset Extension"
3. Confirm the action
4. Choose "Reload Window" or "Open Walkthrough"

### Method 3: Completely Fresh VS Code Instance

**Launch Config:** `Run Extension (Fresh Install)`

**What it does:**
- Uses `--user-data-dir=.vscode-test-fresh`
- Completely isolated VS Code instance
- No settings, no extensions, nothing
- True fresh install experience

**How to use:**
1. Open Run & Debug panel
2. Select "Run Extension (Fresh Install)"
3. Press F5
4. Completely clean VS Code opens

## What Gets Reset

### Secrets (VS Code Secret Storage)
- `linearApiToken`
- `jiraCloudApiToken`
- `jiraServerPassword`

### Settings (VS Code Configuration)
- `devBuddy.provider`
- `devBuddy.linearOrganization`
- `devBuddy.linearTeamId`
- `devBuddy.jira.cloud.siteUrl`
- `devBuddy.jira.cloud.email`
- `devBuddy.jira.defaultProject`
- Plus optional settings (AI model, writing tone, etc.)

### Global State
- All keys starting with `devBuddy` or `linearBuddy`
- Branch associations
- First-time setup flags
- Any cached data

## Testing the Fresh Install Experience

### Expected Behavior for New Users

1. **Sidebar Shows Setup Instructions**
   - Two buttons appear:
     - "🚀 Get Started with DevBuddy" → Opens walkthrough
     - "⚙️ Or Choose Platform Manually" → Opens settings

2. **No Toolbar Buttons Show** (until provider is configured)
   - Create Ticket button hidden
   - Refresh button hidden
   - Standup Builder button hidden
   - Context key: `devBuddy.hasProvider` = false

3. **Walkthrough Steps**
   - Step 1: Welcome
   - Step 2: Choose Platform (button to select)
   - Step 3a: Connect Linear (if Linear selected, with guided setup)
   - Step 3b: Connect Jira (if Jira selected, with guided setup)
   - Steps 4-14: Feature tour

### Testing Checklist

- [ ] Sidebar shows setup instructions (not tickets)
- [ ] "Get Started" button opens walkthrough
- [ ] Toolbar buttons are hidden
- [ ] Platform selection works (Quick Pick)
- [ ] After selecting platform, correct setup step shows
- [ ] Guided setup works (Linear or Jira)
- [ ] "Already configured" detection works
- [ ] Walkthrough completes properly
- [ ] Sidebar loads tickets after setup
- [ ] Toolbar buttons appear after configuration

## Environment Variables

### Available Test Variables

```bash
# Simulate fresh install (clears everything on activation)
DEVBUDDY_TEST_FRESH_INSTALL=true

# Auto-open walkthrough on activation
DEVBUDDY_OPEN_WALKTHROUGH=true

# Auto-open help menu on activation
DEVBUDDY_OPEN_HELP=true

# Enable debug logging
DEVBUDDY_DEBUG_MODE=true
```

### Combining Variables

You can combine these in launch.json:

```json
{
  "env": {
    "DEVBUDDY_TEST_FRESH_INSTALL": "true",
    "DEVBUDDY_OPEN_WALKTHROUGH": "true",
    "DEVBUDDY_DEBUG_MODE": "true"
  }
}
```

## Quick Test Scenarios

### Scenario 1: Complete Fresh Install Flow
1. Launch "Run Extension (Fresh Install Test)"
2. Verify sidebar shows setup buttons
3. Click "Get Started" or wait for auto-open
4. Follow walkthrough completely
5. Verify everything works after setup

### Scenario 2: Returning User (Already Configured)
1. Have credentials already configured
2. Open walkthrough manually
3. Click "Start Linear Setup" or "Start Jira Setup"
4. Verify "Already configured" message shows
5. Test "View Tickets", "Reconfigure", and "Continue" options

### Scenario 3: Partial Configuration
1. Set provider but no credentials
2. Verify setup step shows
3. Complete setup
4. Verify step auto-completes

## Troubleshooting

### Reset Doesn't Work
- Check DevBuddy output panel for errors
- Try Method 3 (completely fresh instance)
- Manually delete:
  - VS Code settings for DevBuddy
  - Keychain entries (macOS) or Windows Credential Manager

### Walkthrough Doesn't Open
- Check if media files are missing
- Verify package.json walkthroughs section
- Try opening via Command Palette: "Help: Welcome"
- Look for "Getting Started with DevBuddy"

### Credentials Persist
- Secrets are stored in OS keychain/credential manager
- Reset command should clear them
- If not, use completely fresh instance (Method 3)

## Notes

- The reset is **permanent** - you'll need to reconfigure
- Use fresh install testing before releasing new versions
- Test on both macOS and Windows if possible
- Verify both Linear and Jira flows work

---

**Pro Tip:** Use "Fresh Install Test" frequently during development to ensure the onboarding experience is smooth for new users!

