# Branch Creation & PR Management Feature Guide

## Overview

The **Linear Buddy** extension provides two powerful features for managing your workflow:
1. **Start Branch** - Create Git branches for todo-based Linear tickets
2. **Open PR** - Quick access to Pull Requests linked to Linear tickets

These features streamline your workflow by automatically generating branch names following conventional commit standards and providing direct access to associated PRs.

## Start Branch Feature

### How to Use

#### 1. Find Your Ticket

Navigate to the **Linear Buddy** sidebar in VS Code and find a ticket with "Todo" or "Unstarted" status.

#### 2. Click the Start Button

Click the **git branch icon** (🔀) next to the ticket. This button only appears for todo/unstarted tickets.

#### 3. Review and Edit Branch Name

A dialog will appear with a suggested branch name following your configured naming convention. You can:
- Accept the suggested name by pressing Enter
- Edit the name as needed
- Cancel by pressing Escape

#### 4. Branch Creation

Once confirmed, the extension will:
1. Create the new branch
2. Check out the branch automatically
3. Ask if you want to update the ticket status to "In Progress"

### Branch Naming Conventions

The feature supports three naming conventions (configurable in settings):

#### Conventional (Default)

Format: `{type}/{identifier}-{slug}`

Example: `feat/eng-123-add-user-authentication`

Types are automatically determined from ticket labels:
- `feat` - Feature (default)
- `fix` - Bug fixes
- `chore` - Maintenance tasks
- `docs` - Documentation
- `test` - Testing
- `refactor` - Code refactoring

#### Simple

Format: `{identifier}-{slug}`

Example: `eng-123-add-user-authentication`

#### Custom

Format: User-defined template

Example: `{username}/{type}/{identifier}-{slug}`

Available placeholders:
- `{type}` - Conventional commit type
- `{identifier}` - Linear ticket identifier (e.g., ENG-123)
- `{slug}` - Slugified ticket title
- `{username}` - Git username

## Open PR Feature

### How to Use

#### 1. Identify Tickets with PRs

Tickets that have linked Pull Requests will display a **git pull request icon** (📥) in the sidebar.

#### 2. Click to Open

Click the PR icon to:
- Open the PR directly in your browser (if there's only one PR)
- Choose from multiple PRs (if the ticket has multiple linked PRs)

#### 3. Browser Opens

The PR will open in your default browser, taking you directly to GitHub, GitLab, or Bitbucket.

### Supported Platforms

The extension automatically detects PRs from:
- **GitHub** - Pull Requests
- **GitLab** - Merge Requests
- **Bitbucket** - Pull Requests

### Multiple PRs

If a ticket has multiple linked PRs, you'll see a quick pick menu with:
- PR title
- PR URL or description
- Select the PR you want to open

## Configuration

### Settings

Access settings via VS Code preferences (`Cmd/Ctrl + ,`) and search for "monorepoTools":

#### Branch Naming Convention
```json
"monorepoTools.branchNamingConvention": "conventional"
```

Options:
- `"conventional"` - Type-prefixed branches (recommended)
- `"simple"` - Identifier and slug only
- `"custom"` - Use custom template

#### Custom Branch Template
```json
"monorepoTools.customBranchTemplate": "{type}/{identifier}-{slug}"
```

Define your own template using available placeholders.

## Features

### Branch Name Validation

The feature validates branch names to ensure they:
- Are not empty
- Don't contain invalid Git characters (spaces, ~, ^, :, ?, *, [, ], \)

### Duplicate Branch Detection

If a branch with the same name already exists, you'll be prompted to:
- Check out the existing branch
- Cancel the operation

### Optional Status Update

After creating a branch, you can optionally update the ticket status to "In Progress" with a single click.

### PR Detection

The extension automatically:
- Fetches PR attachments from Linear
- Detects GitHub, GitLab, and Bitbucket PRs
- Shows a PR button only when PRs are available

## Examples

### Example 1: Feature Ticket

**Ticket:** ENG-456: "Add dark mode support"

**Generated Branch Names:**
- Conventional: `feat/eng-456-add-dark-mode-support`
- Simple: `eng-456-add-dark-mode-support`
- Custom (username/type): `john-doe/feat/eng-456-add-dark-mode-support`

### Example 2: Bug Fix

**Ticket:** BUG-789: "Fix login button not responding"

**Label:** "bug"

**Generated Branch Names:**
- Conventional: `fix/bug-789-fix-login-button-not-responding`
- Simple: `bug-789-fix-login-button-not-responding`

### Example 3: Ticket with PR

**Ticket:** ENG-101: "Implement user authentication"

**Status:** "In Progress"

**Linked PR:** GitHub PR #42

**Action:** Click the PR icon (📥) → Opens PR #42 in browser

## Keyboard Shortcuts

While there's no default keyboard shortcut, you can add one in VS Code:

1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type "Preferences: Open Keyboard Shortcuts"
3. Search for "Linear Buddy: Start Branch for Ticket" or "Linear Buddy: Open Pull Request"
4. Add your preferred shortcut

## Tips

1. **Label Your Tickets**: Add labels like "bug", "feature", "chore" to automatically set the correct commit type
2. **Keep Titles Clear**: Clear ticket titles generate better branch names
3. **Edit Before Creating**: Review and edit the suggested branch name to match your team's conventions
4. **Stay Organized**: The feature automatically converts titles to lowercase and replaces special characters with hyphens
5. **Link PRs in Linear**: When you create a PR, link it to your Linear ticket for quick access
6. **Use PR Descriptions**: Good PR titles show up in the quick pick menu when you have multiple PRs

## Troubleshooting

### Start Branch Issues

#### "No workspace folder open"
Make sure you have a folder or workspace open in VS Code.

#### "Current workspace is not a git repository"
Initialize a Git repository first: `git init`

#### Branch name validation errors
Remove any invalid characters. Valid characters: a-z, A-Z, 0-9, -, /, _

#### Button not visible
The start branch button only appears for tickets with "unstarted" status. Check if your ticket is in todo/unstarted state.

### Open PR Issues

#### "No pull requests found"
This means:
- The ticket doesn't have any linked PRs in Linear
- The attachments aren't from GitHub, GitLab, or Bitbucket
- Solution: Link your PR to the ticket in Linear

#### PR button not showing
The PR button only appears when:
- The ticket has attachments
- The attachments are from supported platforms (GitHub, GitLab, Bitbucket)
- Check the ticket in Linear to verify PR links

## Integration with Git

The feature uses `simple-git` under the hood and:
- Creates a new local branch from your current branch
- Automatically checks out the new branch
- Does not push to remote (you control when to push)

## Integration with Linear

The extension:
- Fetches ticket attachments via Linear API
- Detects PR links automatically
- Updates ticket status when requested
- Refreshes the sidebar after status changes

## Workflow Example

### Complete Development Workflow

1. **Start Work**
   - Find unstarted ticket in sidebar
   - Click branch icon (🔀)
   - Accept or edit branch name
   - Optionally mark ticket as "In Progress"

2. **Develop**
   - Write code on your new branch
   - Make commits following conventional commit standards
   - Push branch to remote

3. **Create PR**
   - Create PR on GitHub/GitLab
   - Link PR to Linear ticket (use ticket URL or identifier)
   - Linear automatically detects the PR

4. **Access PR**
   - PR icon (📥) appears on ticket in sidebar
   - Click to open PR for review
   - Quick access during code review

5. **Complete**
   - Mark ticket as "Done" using complete button
   - Archive branch when PR is merged

## Next Steps

After creating a branch:
1. Start working on your code
2. Make commits following conventional commit standards
3. Use the Linear Buddy PR Summary feature when ready to create a PR
4. Link your PR to the Linear ticket
5. Use the Open PR button for quick access during review
6. Update ticket status as you progress

## Related Features

- **Start Work**: Update ticket status to "In Progress"
- **Complete Ticket**: Mark ticket as done
- **PR Summary**: Generate PR descriptions from your changes
- **Standup Builder**: Include branch work in standups
- **Linear Chat**: Ask questions about tickets and PRs

