# Linear Buddy - Future Ideas

## Tighter Linear Integration

### Implemented
- [x] Auto-Fill from Linear Tickets
- [x] Pull Ticket Context  
- [x] Ticket Selector

### Not Yet Implemented

#### 2. Post Standup as Linear Comment
**Description:** Add a "Post to Linear" button that automatically posts the generated standup as a comment to the selected ticket.

**Benefits:**
- Standup saved in Linear for reference
- Team can see your progress on the ticket
- Links work context to Linear ticket

**Implementation:**
- Use `linearClient.addComment()`
- Format standup nicely for Linear
- Show success notification

---

#### 5. Update Ticket Status from Standup Builder
**Description:** After completing standup, quick actions to update ticket status inline.

**Benefits:**
- One-click status updates
- Integrated workflow
- No context switching

**Implementation:**
- Buttons: "Mark In Progress", "Mark Done"
- Use `linearClient.updateIssueStatus()`
- Refresh sidebar after update

---

#### 6. Multi-Ticket Support with Linear Data
**Description:** Show all tickets you worked on today with full Linear context.

**Benefits:**
- Perfect for context-switching days
- Rich ticket data in standup
- Auto-detect from branches + Linear API

**Implementation:**
- Scan all branches for ticket IDs
- Fetch full ticket data from Linear
- Group commits by ticket
- Show ticket status, priority, labels

---

#### 7. Time Tracking Integration
**Description:** Pull time estimates from Linear and show progress.

**Benefits:**
- See time spent vs estimated
- Better planning
- Track velocity

**Implementation:**
- Linear GraphQL: estimate, progress
- Calculate time from commits
- Show progress bar
- Add time entries to Linear

---

#### 8. Team Standup View
**Description:** Integrated team standup view showing who's working on what.

**Benefits:**
- Team coordination
- See related work
- Avoid conflicts

**Implementation:**
- Fetch team members from Linear
- Get their assigned tickets
- Show in sidebar or separate view
- Filter by project/cycle

---

## Chat Improvements

### 9. Rich Ticket Cards in Chat
**Description:** When showing tickets in chat, display rich cards with full details.

**Benefits:**
- Better visualization
- Quick actions from chat
- More context

**Implementation:**
- Use VS Code chat markdown
- Show priority, status, assignee
- Inline buttons for actions

---

### 10. Natural Language Commands
**Description:** Understand more natural queries like "what did I work on yesterday?"

**Benefits:**
- More intuitive
- Less typing
- Better UX

**Implementation:**
- Parse date ranges
- Map to Linear filters
- Smart intent detection

---

## Webview Enhancements

### 11. Inline Ticket Editing
**Description:** Edit ticket title, description, labels directly in webview.

**Benefits:**
- No need to open Linear
- Quick updates
- Streamlined workflow

**Implementation:**
- Editable fields in webview
- Save button
- Linear API updates

---

### 12. Sub-tasks Support
**Description:** Show and manage sub-tasks within parent ticket.

**Benefits:**
- Better task breakdown
- Track progress
- Nested standup generation

**Implementation:**
- Linear GraphQL: children relation
- Tree view in webview
- Create/complete sub-tasks

---

### 13. Comment Threads
**Description:** Show full comment history with replies.

**Benefits:**
- Context from discussions
- See team feedback
- Reply inline

**Implementation:**
- Fetch comments with Linear API
- Thread view in webview
- Reply functionality

---

### 14. Attachments & Images
**Description:** View and add attachments to tickets.

**Benefits:**
- Complete ticket view
- Add screenshots
- Reference materials

**Implementation:**
- Linear attachments API
- File picker in webview
- Image preview

---

## AI Enhancements

### 15. Smart Next Steps from Linear Context
**Description:** Use Linear ticket description, comments, and linked tickets for better AI suggestions.

**Benefits:**
- More relevant suggestions
- Context-aware planning
- Better standup quality

**Implementation:**
- Pass full Linear context to AI
- Include related tickets
- Use labels/project info

---

### 16. Blocker Detection from Linear
**Description:** Detect blockers by analyzing Linear ticket state, blocked-by relations, and comments.

**Benefits:**
- Automatic blocker identification
- Surface dependencies
- Better planning

**Implementation:**
- Linear GraphQL: blockedBy relation
- Parse comments for keywords
- AI analysis of context

---

### 17. Standup Personalization
**Description:** Learn from your past standups to match your writing style.

**Benefits:**
- More authentic standups
- Consistent tone
- Less editing needed

**Implementation:**
- Store past standups
- Fine-tune prompts
- Style learning

---

## Workflow Automation

### 18. Auto-Branch Creation
**Description:** Create git branch from Linear ticket with proper naming.

**Benefits:**
- Consistent branch names
- Ticket ID in branch
- One-click setup

**Implementation:**
- Button in ticket detail
- Template: `feature/ENG-123-ticket-title`
- Checkout branch
- Update ticket status

---

### 19. PR Template Auto-Fill
**Description:** When creating PR, auto-fill from Linear ticket and standup.

**Benefits:**
- Faster PR creation
- Consistent format
- Links to Linear

**Implementation:**
- Detect PR creation
- Fetch Linear context
- Pre-fill description
- Add Linear link

---

### 20. Cycle/Sprint View
**Description:** Show current cycle/sprint with all tickets.

**Benefits:**
- Sprint planning
- Track cycle progress
- See team capacity

**Implementation:**
- Linear cycles API
- Sidebar view
- Progress indicators
- Burndown chart

---

## Notifications & Reminders

### 21. Standup Reminders
**Description:** Remind user to do standup at configured time.

**Benefits:**
- Don't forget standup
- Consistent timing
- Better habit

**Implementation:**
- Configurable time
- VS Code notification
- One-click open builder

---

### 22. Ticket Updates
**Description:** Notify when tickets are updated (comments, status changes).

**Benefits:**
- Stay informed
- Quick responses
- Team awareness

**Implementation:**
- Linear webhooks (if available)
- Polling fallback
- Toast notifications

---

## Reporting & Analytics

### 23. Weekly Summary
**Description:** Generate weekly summary of all work done.

**Benefits:**
- Performance reviews
- Progress tracking
- Team updates

**Implementation:**
- Aggregate week's commits
- Fetch all tickets worked on
- AI summary
- Export options

---

### 24. Velocity Tracking
**Description:** Track story points completed over time.

**Benefits:**
- Capacity planning
- Performance metrics
- Sprint planning

**Implementation:**
- Pull estimate data
- Track completion
- Charts/graphs
- Trends

---

## Quality of Life

### 25. Keyboard Shortcuts
**Description:** Add keyboard shortcuts for common actions.

**Benefits:**
- Faster workflow
- Power user features
- Less mouse usage

**Shortcuts:**
- `Cmd+Shift+S` - Open Standup Builder
- `Cmd+Shift+L` - Open Linear ticket under cursor
- `Cmd+Shift+R` - Refresh tickets

---

### 26. Dark/Light Theme Optimization
**Description:** Ensure perfect theme matching for all webviews.

**Benefits:**
- Better aesthetics
- Eye comfort
- Professional look

**Implementation:**
- Test both themes
- Use CSS variables
- Dynamic colors

---

### 27. Offline Mode
**Description:** Cache Linear data for offline access.

**Benefits:**
- Work without internet
- Faster loading
- Sync when online

**Implementation:**
- Local cache
- IndexedDB
- Sync on reconnect

---

### 28. Export Standups
**Description:** Export standups to various formats (Markdown, PDF, Slack).

**Benefits:**
- Share with team
- Archive standups
- Multiple platforms

**Implementation:**
- Format converters
- Copy buttons
- Direct post to Slack

---

## Integration Ideas

### 29. GitHub Integration
**Description:** Link PRs to Linear tickets automatically.

**Benefits:**
- Connected workflow
- PR context in Linear
- Better tracking

**Implementation:**
- GitHub API
- Auto-detect ticket from branch
- Add Linear link to PR

---

### 30. Slack Integration
**Description:** Post standups directly to Slack channel.

**Benefits:**
- Team visibility
- Automated posting
- Format for Slack

**Implementation:**
- Slack webhook
- Channel configuration
- Format converter

---

## Priority Ranking

**High Priority:**
- #2 - Post to Linear
- #5 - Update Status
- #6 - Multi-ticket
- #18 - Auto-branch
- #21 - Reminders

**Medium Priority:**
- #7 - Time tracking
- #8 - Team view
- #15 - Smart AI
- #19 - PR auto-fill
- #23 - Weekly summary

**Low Priority:**
- #11-14 - Webview enhancements
- #24 - Velocity tracking
- #26-28 - QoL improvements
- #29-30 - External integrations

---

## Contributing Ideas

Have more ideas? Add them here!

**Template:**
```markdown
### X. Feature Name
**Description:** What it does

**Benefits:**
- Why it's useful

**Implementation:**
- How to build it
```



