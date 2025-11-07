# AI-Powered PR Summaries

Generate comprehensive, well-structured pull request descriptions automatically. Perfect for monorepos with multiple packages!

## How It Works

### Generate a PR Summary
Use the command:
**"Linear Buddy: Generate PR Summary"**

Or ask in chat:
```
@linear /pr
```

### Monorepo Intelligence
Linear Buddy is built for monorepos and automatically:
- 📦 **Detects affected packages** (apps/, packages/, libs/)
- 🔍 **Analyzes changes per package** separately
- 📊 **Shows scope** of your changes
- ⚠️ **Warns** if too many packages are modified

### AI Analysis
The AI examines:
- Git diff across all changed files
- Commit messages and history
- File structure and dependencies
- Code patterns and intent

### PR Template Integration
If you have a PR template (`.github/pull_request_template.md`), Linear Buddy:
- **Reads your template** automatically
- **Fills in sections** based on the template structure
- **Preserves formatting** and checkboxes
- **Keeps custom fields** and instructions

## Example Output

```markdown
## Overview
This PR adds user authentication to the mobile app using JWT tokens.

## Changes
### packages/mobile-app
- Added Login and Signup screens
- Implemented JWT token storage with secure storage
- Added authentication context provider

### packages/api-client
- Created authentication API endpoints
- Added token refresh logic
- Updated TypeScript types for auth

## Testing
- [ ] Manual testing on iOS
- [ ] Manual testing on Android
- [ ] Unit tests passing
- [ ] E2E tests updated

## Related Tickets
- Closes ENG-123
- Related to ENG-120

## Screenshots
(Add screenshots here)
```

## Customization

### Writing Tone
Control how the PR description sounds:
- **Professional** - Clear, formal (default)
- **Casual** - Friendly, approachable
- **Technical** - Detailed, implementation-focused
- **Concise** - Brief, essential info only

**Settings** → **Linear Buddy** → **Writing Tone**

### Package Paths
Tell Linear Buddy where your packages live:
```json
{
  "linearBuddy.packagesPaths": [
    "packages/",
    "apps/",
    "libs/",
    "domains/"
  ]
}
```

**Settings** → **Linear Buddy** → **Packages Paths**

### Base Branch
Set your default base branch:
```json
{
  "linearBuddy.baseBranch": "main"  // or "master", "develop"
}
```

**Settings** → **Linear Buddy** → **Base Branch**

### Max Package Scope
Get warnings if your PR is too large:
```json
{
  "linearBuddy.maxPackageScope": 2  // Warn if > 2 packages modified
}
```

**Settings** → **Linear Buddy** → **Max Package Scope**

## What Gets Included

The generated PR summary includes:

### Automatic Sections
- 📋 **Overview** - High-level description
- 📦 **Package Changes** - Per-package breakdown
- 🧪 **Testing Notes** - How to test
- 🎫 **Related Tickets** - Linked Linear issues
- ⚠️ **Breaking Changes** - If any
- 📝 **Migration Notes** - If needed

### Smart Detection
- Detects if changes are breaking
- Identifies new dependencies
- Highlights security concerns
- Notes database migrations
- Spots configuration changes

## Best Practices

1. **Commit frequently** - Better commit history = better PR summaries
2. **Use descriptive commits** - AI understands context better
3. **Keep PRs focused** - Smaller, single-purpose PRs are easier to describe
4. **Reference tickets** - Include ticket IDs in branch names and commits
5. **Review and edit** - AI generates a draft, you add the final touches

## Integration with GitHub/GitLab

After generating the summary:
1. Copy the generated markdown
2. Create your PR on GitHub/GitLab
3. Paste the summary into the description
4. Add screenshots or additional context
5. Submit!

Linear Buddy makes writing thorough PR descriptions effortless, even for large monorepo changes!

