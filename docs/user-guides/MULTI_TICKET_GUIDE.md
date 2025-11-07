# Multi-Ticket Support - Feature Guide

## Overview

The extension now supports working on **multiple tickets/branches in a single day**, perfect for developers who context-switch or work on reviews alongside feature work.

## How It Works

### Single Ticket Mode (Original)
- Tracks commits and changes on your current branch
- Auto-detects ticket ID from branch name
- Simple workflow for focused work

### Multiple Tickets Mode (New!)
- Scans commits across **ALL local branches** in the last 24 hours
- Auto-detects ticket IDs from commit messages and branch names
- Groups commits by ticket in the standup output
- Shows branch information for each commit

## Using Multiple Tickets

### Step-by-Step

1. **Run the Standup Command:**
   ```
   Cmd+Shift+P → "Monorepo Tools: Generate Standup Update"
   ```

2. **Choose Mode:**
   - Select **"Multiple tickets"** when prompted
   - Or select "Single ticket" for the original behavior

3. **Review Auto-Detected Tickets:**
   - The extension scans your commits from the last 24 hours
   - It shows detected ticket IDs (e.g., "OB-123, OB-456")
   - Edit the list or add more tickets

4. **Provide Descriptions:**
   - For each ticket, describe what you worked on
   - Example: "Fixed auth bug", "Added tests for feature X"

5. **Answer Standup Questions:**
   - What did you do? (overall summary)
   - What will you do?
   - Any blockers?

6. **View Grouped Output:**
   - Commits are grouped by ticket
   - Each commit shows its branch: `abc1234 Fix bug [feature/OB-123-fix]`
   - Easy to copy/paste into Slack/Geekbot

## Example Output

### Multiple Tickets Mode

```markdown
**Daily Standup Update**
==================================================

**Tickets worked on:**
- **OB-123** – Fixed authentication bug
- **OB-456** – Added unit tests for payment flow
- **OB-789** – Code review fixes

**Packages modified:** auth, payments
**Scope verdict:** ✅ Within scope

### What did you do since previous update?
Fixed critical auth bug, added test coverage, addressed PR feedback

### What are you going to do today?
Deploy auth fix, continue payment feature work

### Blockers / Risks
None

---

**Commits (since 24 hours ago):**

_OB-123:_
- abc1234 Fix token refresh logic [feature/OB-123-auth-fix]
- def5678 Add error handling [feature/OB-123-auth-fix]

_OB-456:_
- 890abcd Add payment flow tests [feature/OB-456-tests]
- 123cdef Update test coverage [feature/OB-456-tests]

_OB-789:_
- 456efgh Address review comments [feature/OB-789-review]

**Changed files:**
- packages/auth/src/token.ts
- packages/payments/src/flow.test.ts
- ...
```

## Ticket Detection

The extension automatically detects tickets from:

1. **Branch names:** `feature/OB-123-description`
2. **Commit messages:** `[OB-123] Fix bug` or `OB-123: Add feature`

### Pattern Matching
- Matches: `[A-Z]+-\d+` (e.g., OB-123, JIRA-456, PROJ-789)
- Case-sensitive capital letters followed by dash and numbers

## When to Use Multiple Tickets Mode

### ✅ Use Multiple Tickets When:
- You worked on 2+ tickets yesterday
- You did code reviews on different branches
- You context-switched between features
- You fixed bugs on separate branches
- You worked on hotfixes + regular features

### ✅ Use Single Ticket When:
- You focused on one feature/ticket
- Simple, straightforward standup
- All work was on one branch

## Configuration

Same configuration applies to both modes:

```json
{
  "monorepoTools.standupTimeWindow": "24 hours ago"  // Adjust as needed
}
```

**Examples:**
- `"24 hours ago"` - Standard daily standup
- `"48 hours ago"` - After a long weekend
- `"3 days ago"` - After vacation
- `"1 week ago"` - Weekly summary

## Tips

💡 **Let the extension detect tickets:**
- It scans all your recent commits automatically
- Just verify the list is correct

💡 **Edit the detected list:**
- Add tickets that weren't auto-detected
- Remove tickets you don't want to include
- Format: comma-separated (e.g., `OB-123, OB-456, OB-789`)

💡 **Branch naming convention:**
- Use ticket IDs in branch names for automatic detection
- Format: `feature/TICKET-123-description`

💡 **Commit message convention:**
- Include ticket ID in commits: `[OB-123] Add feature`
- Helps with automatic grouping

## Technical Details

### How Cross-Branch Scanning Works

1. **Git log with `--all` flag:**
   - Scans commits from all local branches
   - Filters by time window (default: 24 hours)

2. **Ticket ID extraction:**
   - Parses commit messages for patterns like `OB-123`
   - Parses branch names from git refs

3. **Commit grouping:**
   - Groups commits by ticket ID
   - Preserves commit hash, message, and branch info

4. **Deduplication:**
   - Ensures no duplicate commits in output
   - Hash-based deduplication

### Fallback Behavior

If something goes wrong:
- Falls back to single ticket mode
- Shows warning message
- Uses current branch context only

## Comparison: Single vs. Multiple Tickets

| Feature | Single Ticket | Multiple Tickets |
|---------|--------------|------------------|
| Branches scanned | Current only | All local branches |
| Ticket input | One ticket | Comma-separated list |
| Ticket descriptions | One description | Description per ticket |
| Commit grouping | Flat list | Grouped by ticket |
| Branch info | Not shown | Shown per commit |
| Auto-detection | From current branch | From all commits |
| Use case | Focused work | Context switching |

## Upgrading from Previous Version

If you're upgrading from the original version:

1. **No breaking changes** - Single ticket mode works exactly as before
2. **New prompt** - You'll see "Single ticket / Multiple tickets" choice
3. **Same configuration** - All settings remain the same
4. **Reinstall extension** - Install the new VSIX file

## Troubleshooting

### "No tickets detected"
- Make sure your commits/branches include ticket IDs
- Manually enter ticket IDs in the prompt
- Check your time window setting

### "Commits not showing"
- Verify commits exist: `git log --all --since="24 hours ago"`
- Check if you committed on different branches
- Adjust time window if needed

### "Wrong tickets detected"
- Edit the auto-detected list when prompted
- Remove unwanted tickets
- Add missing tickets manually

## Future Enhancements

Potential future features:
- Filter commits by author (for team repos)
- Support for GitHub PR numbers
- Custom ticket patterns via config
- Export to different formats (JSON, CSV)

---

**Version:** 0.0.1+multi-ticket
**Status:** ✅ Ready to use
**Package:** cursor-monorepo-tools-0.0.1.vsix (128 KB)

