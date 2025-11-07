# Quick Start: Create Ticket Feature

## Visual Guide

### 1. Sidebar Button
```
┌─────────────────────────────┐
│  Linear Buddy               │
│  My Tickets                 │
│                             │
│  [+] [↻] [📔]              │  ← Click the + icon
│                             │
│  ├─ My Issues              │
│  ├─ Recently Completed     │
│  ├─ Your Teams             │
│  └─ Projects               │
└─────────────────────────────┘
```

### 2. Create Ticket Panel Opens
```
┌─────────────────────────────────────┐
│  Create New Ticket                  │
├─────────────────────────────────────┤
│                                     │
│  Team *                             │
│  [Select a team... ▼]              │
│                                     │
│  Template (Optional)                │
│  [No template ▼]                   │
│                                     │
│  Title *                            │
│  [Enter ticket title...]           │
│                                     │
│  Description                        │
│  [Add a description...]            │
│  │                                  │
│  │                                  │
│                                     │
│  Priority                           │
│  [No Priority ▼]                   │
│  • 🔴 Urgent                       │
│  • 🟠 High                         │
│  • 🟡 Medium                       │
│  • 🟢 Low                          │
│                                     │
│  Status                             │
│  [Default status ▼]                │
│                                     │
│  Assignee                           │
│  [Unassigned ▼]                    │
│                                     │
│  Project                            │
│  [No project ▼]                    │
│                                     │
│  Labels                             │
│  ● bug   ● feature   ● docs       │
│  (click to select)                  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [Create Ticket]                   │
│                                     │
└─────────────────────────────────────┘
```

### 3. With Template Selected
```
┌─────────────────────────────────────┐
│  Create New Ticket                  │
├─────────────────────────────────────┤
│                                     │
│  Team *                             │
│  [Engineering ▼]                   │
│                                     │
│  Template (Optional)                │
│  [Bug Report ▼]                    │
│                                     │
│  ℹ️ Use this template for bug      │
│     reports with reproduction steps │
│                                     │
│  Title *                            │
│  [🐛 Bug: ]                        │
│  ↑ Pre-filled from template         │
│                                     │
│  Description                        │
│  ### Steps to Reproduce            │
│  1. ...                             │
│  ↑ Pre-filled from template         │
│                                     │
│  Priority                           │
│  [🟠 High ▼]                       │
│  ↑ Pre-filled from template         │
│                                     │
│  Labels                             │
│  ● bug ✓  ● needs-triage ✓        │
│  ↑ Pre-selected from template       │
│                                     │
│  [Create Ticket]                   │
│                                     │
└─────────────────────────────────────┘
```

### 4. Success Flow
```
After clicking "Create Ticket":

1. Loading state:
   [Creating...]

2. Success notification:
   ✓ Ticket ENG-123 created successfully!
   [Open Ticket] [Close]

3. If you click "Open Ticket":
   - Opens the ticket detail panel
   - Shows full ticket information

4. Sidebar automatically refreshes:
   - New ticket appears in "My Issues"
   - Under appropriate status section
```

## Common Workflows

### Quick Ticket Creation
1. Click `+` in sidebar
2. Select team
3. Enter title
4. Click "Create Ticket"

### Using Templates
1. Click `+` in sidebar
2. Select team
3. Choose template from dropdown
4. Review/modify pre-filled values
5. Click "Create Ticket"

### Full Ticket with Metadata
1. Click `+` in sidebar
2. Select team
3. Enter title and description
4. Set priority
5. Choose assignee
6. Link to project
7. Add labels
8. Click "Create Ticket"

## Keyboard Navigation

- `Tab` / `Shift+Tab`: Navigate between fields
- `Enter`: Submit form (when title is filled)
- `Escape`: Close panel
- `Space`: Toggle label selection

## Tips

### Templates
- Templates are team-specific
- Template values can be overridden
- Templates are optional - create from scratch anytime

### Labels
- Click labels to toggle selection
- Multiple labels can be selected
- Color indicates label type

### Priorities
- 🔴 Urgent: Critical issues requiring immediate attention
- 🟠 High: Important issues to address soon
- 🟡 Medium: Standard priority
- 🟢 Low: Nice to have
- No Priority: Default

### Status
- Defaults to team's initial workflow state
- Can set different initial status if needed
- Useful for creating tickets in specific states

## Troubleshooting

### "No teams found"
- Ensure Linear API token is configured
- Check that you're a member of at least one team

### "No templates found"
- Team may not have templates configured
- Templates are optional - create tickets without them

### Template not applying
- Ensure you've selected a team first
- Try selecting the template again

### Ticket creation fails
- Verify all required fields are filled
- Check Linear API connection
- Review error message in notification

## Related Features

- **TODO to Ticket**: Convert code TODOs to tickets
- **Open Ticket**: View/edit existing tickets
- **Standup Builder**: Generate standup updates
- **Branch Manager**: Link tickets to git branches

