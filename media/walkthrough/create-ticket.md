# Create New Tickets

Create Linear tickets directly from VS Code with a beautiful, full-featured editor. No need to switch to your browser!

## How to Create a Ticket

### From Command Palette
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "Linear Buddy: Create New Ticket"
3. Or use the **$(add)** button in the sidebar

### From Sidebar
Click the **$(add)** icon at the top of the Linear Buddy sidebar

## Full-Featured Editor

The ticket creation panel includes everything you need:

### Required Fields
- **Title** - A clear, concise ticket title
- **Description** - Full markdown support with preview

### Optional Fields
- **Team** - Select from your Linear teams
- **Project** - Assign to a specific project
- **Labels** - Add categorization labels
- **Priority** - None, Low, Medium, High, Urgent
- **Assignee** - Assign to yourself or team members
- **Estimate** - Story points or time estimate
- **Due Date** - Set a deadline
- **Parent Issue** - Link to a parent ticket for sub-issues

## Smart Defaults

Linear Buddy remembers your preferences:
- Last-used team
- Default assignee (usually you)
- Common labels
- Default estimate

This makes creating multiple tickets fast and consistent!

## Markdown Support

The description field supports full markdown:
```markdown
## Overview
Add user authentication to the app

## Requirements
- [ ] Login form
- [ ] Signup flow
- [ ] Password reset

## Technical Notes
Uses JWT tokens with refresh mechanism
```

## After Creation

Once you create a ticket:
- It appears in your sidebar immediately
- You can create a branch for it right away
- The ticket opens automatically for you to review
- You get the ticket identifier to use in commits

Pro tip: Create tickets as you think of them during development, then organize and prioritize them in Linear later!

