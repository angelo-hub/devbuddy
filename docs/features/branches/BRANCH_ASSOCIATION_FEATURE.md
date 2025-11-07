# Branch Association Feature

## Overview

The Branch Association feature allows you to link Linear tickets with git branches, making it easy to checkout the correct branch when working on in-progress tickets. This is particularly useful for managing multiple tickets across different branches.

## Features

### 1. **Automatic Branch Association**
When you create a new branch using the "Start Branch" command, the branch is automatically associated with the ticket.

### 2. **Manual Branch Association**
For in-progress tickets, you can manually associate a branch through the ticket detail panel:
- Open any in-progress ticket
- Look for the "Branch" section
- Click "Associate Branch" and enter the branch name
- The branch association is stored locally in workspace state

### 3. **Checkout Associated Branches**
Once a branch is associated with a ticket, you can quickly checkout that branch:

#### From the Sidebar:
- In-progress tickets with associated branches show a checkout icon (⎇)
- Click the icon to instantly checkout the branch

#### From the Ticket Detail Panel:
- Open the ticket to see the associated branch
- Click "Checkout Branch" to switch to that branch

### 4. **Branch Validation**
The extension automatically verifies that associated branches still exist:
- If a branch no longer exists, you'll see a warning
- You can remove stale associations

### 5. **Remove Associations**
You can remove branch associations at any time:
- Open the ticket detail panel
- Click the "Remove" button in the Branch section

## Storage

Branch associations are currently stored locally in **VS Code workspace state**. This means:
- ✅ Associations are preserved across VS Code restarts
- ✅ Works immediately without any external dependencies
- ⚠️ Associations are workspace-specific
- 🔮 **Future Enhancement**: Support for storing associations as Linear attachments

## Usage Examples

### Starting Work on a New Ticket

1. Find an unstarted ticket in the sidebar
2. Click the "Start Branch" icon (⎇)
3. Select the source branch (default: current branch)
4. Enter or confirm the branch name
5. The branch is created, checked out, and **automatically associated** with the ticket

### Switching to an In-Progress Ticket

1. Find the in-progress ticket in the sidebar
2. If it has an associated branch, you'll see a checkout icon (⎇)
3. Click the icon to instantly checkout the branch

### Associating an Existing Branch

1. Open the ticket detail panel
2. Look for the "Branch" section (only visible for in-progress tickets)
3. Click "Associate Branch"
4. Enter the existing branch name
5. Click "Associate"

### Removing an Association

1. Open the ticket detail panel
2. In the "Branch" section, you'll see the current association
3. Click "Remove" to unlink the branch

## Commands

The following commands are available:

- `Linear Buddy: Checkout Branch` - Checkout the branch associated with a ticket
- All existing branch commands (Start Branch, etc.) now automatically create associations

## Context Menu

The checkout button appears in the sidebar when:
- The ticket status is "In Progress" (`started`)
- The ticket has an associated branch
- The branch exists in the repository

## Technical Details

### Storage Location
- Branch associations are stored in VS Code's workspace state
- Key: `linearBuddy.branchAssociations`
- Format: Array of `{ ticketId, branchName, lastUpdated }`

### Branch Manager API
The `BranchAssociationManager` class provides:
- `getBranchForTicket(ticketId)` - Get the associated branch
- `getTicketForBranch(branchName)` - Get the associated ticket
- `associateBranch(ticketId, branchName)` - Create an association
- `removeAssociation(ticketId)` - Remove an association
- `checkoutBranch(ticketId)` - Checkout the associated branch
- `verifyBranchExists(branchName)` - Check if a branch exists
- `cleanupStaleAssociations()` - Remove associations for deleted branches

## Future Enhancements

1. **Linear Attachment Integration**: Store associations as Linear attachments so they're accessible across machines
2. **Auto-detection**: Automatically detect and suggest associations based on branch naming conventions
3. **Branch History**: Track which branches were used for a ticket over time
4. **Multi-branch Support**: Associate multiple branches with a single ticket

## Troubleshooting

### Branch Not Showing Up
- Make sure the ticket status is "In Progress"
- Verify the branch exists in your repository
- Try refreshing the ticket list

### Association Not Saved
- Ensure you're in a git repository
- Check that the branch name is valid
- Try associating again

### Stale Associations
- If a branch was deleted, you'll see a warning
- Click "Remove" to clean up the stale association
- The extension can automatically clean up stale associations

## Integration with Existing Features

This feature integrates seamlessly with:
- **Start Branch Command**: Automatically creates associations
- **Ticket Detail Panel**: Shows branch info and provides management UI
- **Sidebar**: Displays checkout buttons for associated branches
- **Status Updates**: Works with ticket status changes

## Tips

1. **Naming Convention**: Use descriptive branch names that include the ticket identifier (e.g., `feat/OB-123-description`)
2. **Regular Cleanup**: Periodically remove associations for completed or abandoned tickets
3. **Branch Hygiene**: Delete merged branches to keep your branch list clean

## Notes

- This feature only works within git repositories
- Branch associations are workspace-specific (for now)
- The feature is designed to be non-intrusive and only appears for in-progress tickets

