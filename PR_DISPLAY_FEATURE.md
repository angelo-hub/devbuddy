# Pull Requests Display in Ticket Panel

## Overview

The ticket panel now displays linked Pull Requests with an improved UI and larger ticket size. This feature leverages Linear's native GitHub/GitLab integration without requiring any additional API keys.

## How It Works

### Data Source: Linear API (No GitHub API Key Required!)

The PR data comes directly from **Linear's API** through their GraphQL endpoint. When users link PRs to Linear issues using:
- Linear's GitHub integration
- Linear's GitLab integration  
- The "Attach" feature in Linear
- GitHub's Linear bot

Linear stores this attachment data and makes it available through their API at `issue.attachments.nodes[]`.

### What We Get from Linear

Each attachment includes:
```typescript
{
  id: string;
  url: string;           // e.g., "https://github.com/org/repo/pull/123"
  title?: string;        // PR title
  subtitle?: string;     // PR description/status text
  sourceType?: string;   // "github", "gitlab", etc.
}
```

### What We DON'T Get

❌ **PR Status** (draft/open/merged/closed) - Not provided by Linear
❌ **Review status** - Not provided by Linear
❌ **CI/CD status** - Not provided by Linear

To see the actual PR status, users click the PR card to open it in GitHub/GitLab.

## Features

### Visual Design

1. **Larger Ticket Panel**
   - Increased max-width from 900px to 1200px
   - Added padding for better spacing

2. **PR Cards**
   - Clean, clickable cards for each PR
   - Platform icons (⚡ GitHub, 🦊 GitLab, 🪣 Bitbucket)
   - PR number and repository name
   - PR title and subtitle from Linear
   - Hover effects with smooth animations
   - Arrow indicator (→) that moves on hover

3. **Platform Support**
   - GitHub Pull Requests
   - GitLab Merge Requests
   - Bitbucket Pull Requests

### User Experience

- PRs only show when attachments exist
- Subtitle explains users need to click to see status
- No fake/inferred status badges (honest about data limitations)
- Opens in new tab when clicked
- Monospace font for PR numbers and repo names

## Code Changes

### Files Modified

1. **`webview-ui/src/shared/types/messages.ts`**
   - Added `attachments` field to `LinearIssue` interface

2. **`webview-ui/src/ticket-panel/components/AttachedPRs.tsx`** (NEW)
   - React component to display PR list
   - URL parsing for PR number and repo name
   - Platform detection

3. **`webview-ui/src/ticket-panel/components/AttachedPRs.module.css`** (NEW)
   - Styling for PR cards
   - Hover effects and animations
   - Platform-specific icon styling

4. **`webview-ui/src/ticket-panel/App.tsx`**
   - Imported and rendered `AttachedPRs` component
   - Positioned between labels and description

5. **`webview-ui/src/ticket-panel/App.module.css`**
   - Increased max-width from 900px to 1200px
   - Added padding to container

## Future Enhancements (Optional)

If you want real-time PR status in the future, you could:

1. **Add GitHub API Integration**
   - Use VS Code's GitHub authentication API
   - Fetch PR status directly from GitHub
   - Cache status to avoid rate limits

2. **Use VS Code's GitHub Extension**
   - Check if `vscode.authentication.getSession('github')` is available
   - Piggyback on user's existing GitHub auth

3. **Add Linear Webhook Support**
   - Listen for PR status changes from Linear webhooks
   - Update cached status in real-time

## Testing

To test this feature:

1. **Reload the extension**
   ```
   Cmd+Shift+P → "Developer: Reload Window"
   ```

2. **Open a Linear ticket that has linked PRs**
   - Use the Linear Tickets sidebar
   - Click on any ticket with PR attachments

3. **Verify PR display**
   - PRs should appear below labels
   - Click to open in GitHub/GitLab
   - Check hover animations

4. **Debug attachment data**
   - Open VS Code Developer Console
   - Look for logs: `[Linear Buddy] Sample issue attachments:`
   - Verify Linear is returning attachment data

## Notes

- Linear's GitHub integration must be configured in Linear for this to work
- Users must manually link PRs to Linear issues (or use GitHub's Linear bot)
- The extension only displays what Linear provides - no external API calls
- This is intentionally simple and honest about its limitations

