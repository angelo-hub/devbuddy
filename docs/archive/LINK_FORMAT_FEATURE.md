# Link Format Feature for Standup Summaries

## Overview
This feature allows users to configure how ticket links (e.g., `TICKET-123`) are formatted when copying standup summaries to platforms like Slack or Microsoft Teams.

## Implementation Summary

### 1. Configuration Setting
**File:** `package.json`

Added a new configuration option `linearBuddy.linkFormat` with three options:
- **slack**: Format as `<url|TICKET-123>` (Slack's link format)
- **markdown**: Format as `[TICKET-123](url)` (standard markdown, works in Teams, GitHub, Discord, etc.)
- **plain**: Just the ticket ID with no link formatting

Default: `markdown`

### 2. Onboarding Flow
**File:** `src/utils/firstTimeSetup.ts`

Added step 7 in the first-time setup wizard that asks users:
> "How do you share ticket links? (for standup updates & copying)"

Options presented:
- **Slack** - Format: `<url|TICKET-123>` - for Slack messages
- **Teams / Markdown** - Format: `[TICKET-123](url)` - for Teams, GitHub, Discord, etc.
- **Plain Text** - Just the ticket ID (TICKET-123)

The user's choice is saved to their global VS Code settings.

### 3. Link Formatter Utility
**File:** `src/utils/linkFormatter.ts`

Created two utility functions:

#### `formatTicketLink(ticketId, ticketUrl, format?)`
Formats a single ticket link based on the specified format or user preference.

#### `formatTicketReferencesInText(text, ticketUrlTemplate, format?)`
Scans text for ticket references matching the pattern `[A-Z]{2,}-\d+` (e.g., `TICKET-123`, `ENG-456`) and replaces them with formatted links.

### 4. Standup Builder Integration
**File:** `src/views/standupBuilderPanel.ts`

Updated the `handleCopy` method to:
1. Get the user's Linear organization from settings
2. Format all ticket references in the standup text using the user's preferred format
3. Copy the formatted text to clipboard

The formatting automatically detects ticket patterns like:
- `TICKET-123`
- `ENG-456`
- `PROJ-789`

And converts them based on the user's preference:
- **Slack**: `<https://linear.app/yourorg/issue/TICKET-123|TICKET-123>`
- **Markdown**: `[TICKET-123](https://linear.app/yourorg/issue/TICKET-123)`
- **Plain**: `TICKET-123`

## How It Works

### For New Users
1. During onboarding, users are asked which platform they use for sharing updates
2. Their preference is saved automatically
3. All future standup copies will use their preferred format

### For Existing Users
Users can change their preference at any time:
1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for "Linear Buddy"
3. Find "Link Format" setting
4. Choose: Slack, Markdown, or Plain

### When Copying Standup Updates
When a user clicks "Copy All" or "Copy Answers Only" in the Standup Builder:
1. The extension detects all ticket references in the text
2. Each ticket ID is converted to the appropriate format
3. The formatted text is copied to clipboard
4. Ready to paste directly into Slack, Teams, or other platforms!

## Platform Compatibility

### Slack
- Uses: `<url|text>` format
- When pasted: Displays as a clickable link with the ticket ID as link text

### Microsoft Teams
- Uses: Standard markdown `[text](url)` format
- When pasted: Automatically renders as a clickable link

### Other Platforms
- GitHub: Supports markdown format
- Discord: Supports markdown format
- Notion: Supports markdown format
- Plain text tools: Use plain format for just the ticket ID

## Technical Details

### Ticket Pattern Matching
The regex pattern `/\b([A-Z]{2,}-\d+)\b/g` matches:
- 2 or more uppercase letters
- Followed by a hyphen
- Followed by one or more digits
- With word boundaries to avoid false matches

Examples matched:
- `TICKET-123`
- `ENG-456`
- `PROJ-7890`
- `AB-1`

Examples NOT matched:
- `A-123` (only one letter)
- `ticket-123` (lowercase)
- `TICKET123` (no hyphen)

### URL Generation
URLs are generated using the Linear organization from settings:
```
https://linear.app/{organization}/issue/{ticketId}
```

If no organization is configured, falls back to just the ticket ID.

## Files Modified

1. `package.json` - Added configuration schema
2. `src/utils/firstTimeSetup.ts` - Added onboarding step
3. `src/utils/linkFormatter.ts` - NEW: Utility functions for formatting
4. `src/views/standupBuilderPanel.ts` - Integrated formatting on copy

## Benefits

✅ **One-time setup** - Users configure once during onboarding
✅ **Automatic formatting** - No manual work needed when copying
✅ **Platform-specific** - Correct format for each platform automatically
✅ **Configurable** - Easy to change in settings if needs change
✅ **Zero breaking changes** - Existing functionality remains unchanged

## Future Enhancements (Not Implemented)

Potential future additions could include:
- Format dropdown in the standup UI for per-copy overrides
- Support for custom link templates
- Format previews in the standup builder
- Per-team format preferences

