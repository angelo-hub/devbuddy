# Smart Branch Creation

Linear Buddy makes it easy to create well-named, conventional branches directly from your tickets.

## How It Works

1. **Click the $(git-branch) icon** next to any unstarted ticket in the sidebar
2. **Select source branch** - Choose which branch to branch from (defaults to current)
3. **Review generated name** - Linear Buddy creates a smart branch name
4. **Customize if needed** - Edit the name or use the suggestion
5. **Done!** - Your branch is created and checked out automatically

## Branch Naming Styles

Linear Buddy supports multiple naming conventions:

### Conventional Commits (Default)
Best for teams following conventional commit standards:
```
feat/eng-123-add-user-authentication
fix/eng-124-button-alignment-issue
chore/eng-125-update-dependencies
```

### Simple
Clean and straightforward:
```
eng-123-add-user-authentication
eng-124-button-alignment-issue
```

### Custom Template
Define your own with placeholders:
- `{type}` - Commit type (feat, fix, chore, etc.)
- `{identifier}` - Ticket ID (e.g., ENG-123)
- `{slug}` - Auto-generated from title
- `{username}` - Your git username

Example: `{username}/{type}/{identifier}-{slug}`
Results in: `john/feat/eng-123-add-authentication`

## Smart Type Detection

Linear Buddy automatically determines the commit type from your ticket labels:
- **Bug/Bugfix** → `fix/`
- **Feature** → `feat/`
- **Documentation** → `docs/`
- **Chore** → `chore/`
- **Test** → `test/`
- **Refactor** → `refactor/`

## Configuration

Change your branch naming preference:
1. Open Settings (Cmd/Ctrl + ,)
2. Search for **"Linear Buddy Branch Naming"**
3. Choose your preferred convention
4. Set custom template if using "custom" mode

## Bonus: Auto Status Update

After creating a branch, Linear Buddy asks if you want to automatically update the ticket status to **"In Progress"**. This keeps your Linear board in sync with your actual work!

