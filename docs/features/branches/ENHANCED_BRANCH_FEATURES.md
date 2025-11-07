# Enhanced Branch Association Features

## Overview

We've significantly enhanced the branch association feature with intelligent auto-detection, branch history tracking, analytics, and cleanup suggestions. These features help you manage your branch-ticket associations more effectively.

## 🚨 New: Uncommitted Changes Warning

When checking out a branch, you'll now see a warning if you have uncommitted changes (similar to VS Code's native behavior):

- **Options Provided:**
  - **Stash & Checkout**: Automatically stash your changes before switching
  - **Checkout Anyway**: Switch branches without stashing (may cause conflicts)
  - **Cancel**: Stay on current branch

The warning shows you which files have uncommitted changes, helping you make an informed decision.

## 🔍 Auto-Detection

### Command: `Linear Buddy: Auto-Detect Branch Associations`

Automatically finds branches that match ticket patterns and suggests associations.

**How it works:**
1. Scans all local branches
2. Extracts ticket IDs using pattern matching (e.g., `OB-1234` from `feat/OB-1234-feature`)
3. Filters out already associated branches
4. Presents findings for review

**Usage:**
```
Command Palette → "Linear Buddy: Auto-Detect Branch Associations"
```

**Options:**
- **Associate All**: Automatically associate all detected branches
- **Review Each**: Go through each suggestion one by one
- **Cancel**: Do nothing

**Use Cases:**
- Initial setup when adopting the extension
- After cloning a repository with existing branches
- Periodic maintenance to catch unassociated branches

## 📜 Branch History

Every ticket now maintains a complete history of all branches that have been associated with it:

### Features:
- **Multi-Branch Tracking**: Track multiple branches per ticket
- **Timeline**: See when each branch was associated and last used
- **Active Status**: Know which branch is currently active
- **Persistent History**: Branches remain in history even after disassociation

### Data Tracked:
```typescript
{
  ticketId: "OB-123",
  branches: [
    {
      branchName: "feat/OB-123-feature-v2",
      associatedAt: "2025-01-15T10:00:00Z",
      lastUsed: "2025-01-20T15:30:00Z",
      isActive: true
    },
    {
      branchName: "feat/OB-123-feature-v1",
      associatedAt: "2025-01-10T09:00:00Z",
      lastUsed: "2025-01-14T16:45:00Z",
      isActive: false
    }
  ]
}
```

### Benefits:
- **Context Preservation**: See which branches you've worked on for a ticket
- **Easy Switch**: Quickly identify and switch to previous branches
- **Audit Trail**: Understand your work history on a ticket

## 📊 Analytics

### Command: `Linear Buddy: Show Branch Analytics`

Get insights into your branch usage patterns.

**Metrics Provided:**
1. **Overview**
   - Total associations
   - Active associations
   - Stale branches (deleted but still associated)

2. **Oldest Associations**
   - Associations not updated in > 30 days
   - Sorted by age (oldest first)
   - Limited to top 10

3. **Most Used Branches**
   - Branches with highest usage frequency
   - Based on history tracking
   - Limited to top 10

**Usage:**
```
Command Palette → "Linear Buddy: Show Branch Analytics"
```

**Example Output:**
```
Overview
├─ Total Associations: 15
├─ Active: 12
└─ Stale Branches: 3

Oldest Associations
├─ OB-456 → feat/OB-456-old-feature (45 days old)
├─ OB-789 → fix/OB-789-bug (32 days old)
└─ OB-321 → feat/OB-321-feature (31 days old)

Most Used Branches
├─ OB-123 → feat/OB-123-main (5 times)
├─ OB-456 → feat/OB-456-feature (3 times)
└─ OB-789 → fix/OB-789-bug (2 times)
```

## 🧹 Cleanup Suggestions

### Command: `Linear Buddy: Cleanup Branch Associations`

Intelligent cleanup suggestions to keep your associations healthy.

**What It Detects:**
1. **Stale Branches**: Branches that no longer exist in the repository
2. **Old Associations**: Associations not updated in > 30 days
3. **Duplicate Branches**: Same branch associated with multiple tickets

**Usage:**
```
Command Palette → "Linear Buddy: Cleanup Branch Associations"
```

**Options:**
- **Clean Up Stale**: Automatically remove associations for deleted branches
- **View Details**: See all suggestions before taking action
- **Cancel**: Do nothing

**Example Output:**
```
⚠️ 3 Stale Branch(es)
├─ OB-123 → feat/OB-123-deleted (Branch deleted)
├─ OB-456 → fix/OB-456-removed (Branch deleted)
└─ OB-789 → feat/OB-789-old (Branch deleted)

🕒 2 Old Association(s)
├─ OB-234 → feat/OB-234-feature (45 days old)
└─ OB-567 → fix/OB-567-bug (32 days old)

🌿 1 Duplicate Branch(es)
└─ feat/shared-branch (Used by: OB-111, OB-222)
```

### Cleanup Strategy:
1. **Run Regularly**: Weekly or after completing major work
2. **Review Before Delete**: Check old associations before removing
3. **Fix Duplicates**: Ensure each branch is associated with the correct ticket

## 🎯 Suggested Associations

When associating a branch manually, the system can suggest branches that might be related to the ticket:

**How it works:**
- Searches for branches containing the ticket ID
- Returns all matching branches
- Useful when you can't remember the exact branch name

**Use in Ticket Panel:**
- Type partial branch name
- System suggests matches
- Select from dropdown

## 📈 Usage Patterns

### Recommended Workflow:

1. **Initial Setup**
   ```
   1. Run "Auto-Detect Branch Associations"
   2. Review and associate suggested branches
   3. Create new branches using "Start Branch" (auto-associates)
   ```

2. **Daily Work**
   ```
   1. Check out in-progress tickets with one click
   2. System tracks branch usage automatically
   3. Uncommitted changes warning keeps work safe
   ```

3. **Periodic Maintenance**
   ```
   1. Check analytics weekly
   2. Run cleanup monthly
   3. Review old associations quarterly
   ```

### Best Practices:

1. **Naming Conventions**
   - Use consistent patterns: `type/TICKET-ID-description`
   - Include ticket ID in branch name
   - Enables auto-detection to work better

2. **Regular Cleanup**
   - Remove stale associations
   - Archive completed tickets
   - Keep active associations clean

3. **Review Analytics**
   - Identify patterns in your work
   - Find forgotten branches
   - Optimize your workflow

## 🔧 Technical Details

### Storage:
- **Associations**: `linearBuddy.branchAssociations`
- **History**: `linearBuddy.branchHistory`
- **Location**: VS Code Workspace State

### Data Structure:
```typescript
// Association
{
  ticketId: string;
  branchName: string;
  lastUpdated: string;
  isAutoDetected?: boolean;
}

// History
{
  ticketId: string;
  branches: Array<{
    branchName: string;
    associatedAt: string;
    lastUsed: string;
    isActive: boolean;
  }>;
}
```

### Auto-Detection Algorithm:
```
1. Get all local branches
2. For each branch:
   a. Extract ticket ID using regex: /([A-Z]+-\d+)/
   b. Check if not already associated
   c. Add to suggestions
3. Present suggestions to user
```

### Cleanup Logic:
```
Stale Branches:
- Check if branch exists in git repository
- If not, mark as stale
- Option to bulk remove

Old Associations:
- Calculate days since last update
- If > 30 days, mark as old
- Show for review

Duplicates:
- Group associations by branch name
- If > 1 ticket per branch, mark as duplicate
- Let user resolve conflicts
```

## 🚀 Future Enhancements

While we're holding off on Linear attachments for now, here are potential future improvements:

1. **Smart Suggestions**
   - ML-based branch recommendations
   - Pattern learning from user behavior
   - Context-aware suggestions

2. **Team Features**
   - Shared branch patterns
   - Team-wide analytics
   - Collaborative cleanup

3. **Git Integration**
   - Auto-detect from git commit messages
   - Integration with git workflows
   - Branch lifecycle tracking

4. **Reporting**
   - Export analytics
   - Generate reports
   - Visualizations and charts

## 🎓 Tips & Tricks

### Tip 1: Batch Association
When setting up a new project:
```
1. Create all necessary branches
2. Run auto-detect
3. Review and associate all at once
```

### Tip 2: Quick Cleanup
Before starting new work:
```
1. Run cleanup
2. Remove all stale branches
3. Start fresh
```

### Tip 3: Historical Context
When revisiting old tickets:
```
1. Open ticket panel
2. View branch history
3. See all previous branches
4. Choose appropriate branch
```

### Tip 4: Pattern Consistency
Adopt a team convention:
```
feat/TICKET-123-description  ✅
fix/TICKET-456-bug-name      ✅
TICKET-789-feature           ❌ (no type prefix)
feature-implementation        ❌ (no ticket ID)
```

## 📝 Command Reference

| Command | Description | Shortcut |
|---------|-------------|----------|
| `Auto-Detect Branch Associations` | Find and associate branches automatically | - |
| `Show Branch Analytics` | View usage statistics and insights | - |
| `Cleanup Branch Associations` | Remove stale and fix duplicate associations | - |
| `Checkout Branch` | Checkout branch with uncommitted changes warning | Click icon in sidebar |

## ⚙️ Configuration

No additional configuration needed! All features work out of the box with your existing settings.

The extension respects your:
- Branch naming convention settings
- Team ID configuration
- Base branch configuration

## 🐛 Troubleshooting

### Auto-Detect Not Finding Branches
**Solution**: Ensure branches follow naming pattern with ticket ID (e.g., `ABC-123`)

### Stale Branches Not Cleaning Up
**Solution**: Run cleanup command manually or refresh git repository

### Analytics Not Showing Data
**Solution**: Use branches for a few days to build up history

### Uncommitted Changes Warning Not Appearing
**Solution**: Ensure you're in a git repository with actual changes

## 📚 Related Documentation

- [Branch Association Feature](./BRANCH_ASSOCIATION_FEATURE.md) - Original feature overview
- [Branch Association Implementation](./BRANCH_ASSOCIATION_IMPLEMENTATION.md) - Technical details
- [Usage Guide](./USAGE.md) - General extension usage

## 🙋 Need Help?

If you encounter issues or have suggestions:
1. Check existing associations: `Show Branch Analytics`
2. Run cleanup: `Cleanup Branch Associations`
3. Try auto-detect: `Auto-Detect Branch Associations`
4. Review this guide for best practices

---

**Last Updated**: January 2025
**Version**: 0.2.0

