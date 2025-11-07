# Linear Desktop App Support

## Overview

The extension now supports opening Linear issues in the Linear desktop app instead of the web browser. This feature is configurable and asks users for their preference during first-time setup.

## Features

### 1. First-Time Setup Integration

During the onboarding process, users are now asked how they want to open Linear issues:

- **Open in Web Browser** (default, recommended)
  - Opens Linear issues in your default web browser
  - Guaranteed to work for all users
  
- **Open in Desktop App**
  - Opens Linear issues in the Linear desktop app (if installed)
  - Provides a faster, more native experience
  - Requires the Linear desktop app to be installed

### 2. URL Conversion

When desktop app preference is enabled, the extension automatically converts Linear URLs:
- Web URL: `https://linear.app/org/issue/ENG-123`
- Desktop URL: `linear://org/issue/ENG-123`

### 3. Where It Works

The desktop app preference is applied in the following locations:

1. **Ticket Panel** - "Open in Linear" button
2. **Chat Participant** - Links in chat responses when listing tickets or showing ticket details
3. **All Linear URL Links** - Any clickable Linear URL throughout the extension

## Configuration

### Setting

- **Name**: `linearBuddy.preferDesktopApp`
- **Type**: Boolean
- **Default**: `false` (web browser)
- **Description**: Open Linear issues in the desktop app instead of the web browser

### How to Change

You can change this setting at any time:

1. Open VS Code Settings (`Cmd+,` on Mac, `Ctrl+,` on Windows/Linux)
2. Search for "linear buddy desktop"
3. Toggle the "Prefer Desktop App" checkbox

Or update directly in `settings.json`:
```json
{
  "linearBuddy.preferDesktopApp": true
}
```

## Implementation Details

### Helper Function

A helper function `getLinearUrl()` is used throughout the codebase to convert URLs based on the user's preference:

```typescript
function getLinearUrl(webUrl: string): string {
  const config = vscode.workspace.getConfiguration("linearBuddy");
  const preferDesktop = config.get<boolean>("preferDesktopApp", false);
  
  if (preferDesktop) {
    return webUrl.replace("https://linear.app/", "linear://");
  }
  
  return webUrl;
}
```

### Modified Files

1. **package.json** - Added configuration setting
2. **src/utils/firstTimeSetup.ts** - Added onboarding question
3. **src/views/linearTicketPanel.ts** - Updated "Open in Linear" button
4. **src/chat/linearBuddyParticipant.ts** - Updated chat response links

## User Experience

### For Users Without Desktop App

If a user enables the desktop app preference but doesn't have the app installed:
- The OS will handle the `linear://` protocol
- Behavior varies by OS:
  - macOS: May show a dialog or fail silently
  - Windows: May show a dialog asking to select an app
  - Linux: Varies by distribution
- Users can simply toggle the setting back to web browser

### For Users With Desktop App

- Clicking any Linear link opens directly in the desktop app
- Faster than opening in browser
- Native app experience with keyboard shortcuts, notifications, etc.

## Testing

To test this feature:

1. **Enable desktop app preference**
   - During first-time setup, or
   - In VS Code settings

2. **Test these scenarios**:
   - Click "Open in Linear" button in ticket panel
   - Click Linear links in chat responses
   - Verify URLs are `linear://` format

3. **Verify fallback**:
   - Disable preference
   - Verify URLs are `https://linear.app/` format

## Future Enhancements

Potential improvements for future versions:

1. **Auto-detect Desktop App**
   - Check if Linear desktop app is installed
   - Automatically set preference based on detection
   - Show warning if enabled but app not found

2. **Per-Action Override**
   - Allow users to open in web/desktop via context menu
   - "Open in Linear (Web)" vs "Open in Linear (Desktop)"

3. **Fallback Handling**
   - Detect if desktop app open failed
   - Automatically fall back to web browser
   - Show notification with option to change preference

## Related Documentation

- [First-Time Setup Guide](./LINEAR_ONBOARDING_IMPROVEMENT.md)
- [Linear Integration Status](./LINEAR_INTEGRATION_STATUS.md)
- [Linear Buddy Guide](./LINEAR_BUDDY_GUIDE.md)

