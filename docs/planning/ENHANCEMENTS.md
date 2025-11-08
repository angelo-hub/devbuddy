# Linear Buddy Enhancement Roadmap

**Last Updated:** November 7, 2025  
**Status:** Active Planning

This document tracks planned enhancements based on user feedback, competitive analysis, and strategic priorities.

---

## 🎯 Priority Framework

- **P0 - Critical**: Must have for market competitiveness
- **P1 - High**: Significantly increases value/retention
- **P2 - Medium**: Nice to have, improves experience
- **P3 - Low**: Future considerations

**Effort Scale:** 🟢 Small (1-3 days) | 🟡 Medium (1-2 weeks) | 🔴 Large (2+ weeks)

---

## 📝 Important Context

### Repository Architecture Agnostic

**Linear Buddy works with ANY repository structure:**
- ✅ Single repository (traditional)
- ✅ Monorepo (Nx, Turborepo, Lerna, etc.)
- ✅ Multi-repo/Microservices
- ✅ Polyrepo architectures

**Monorepo features are ADDITIVE**, not core:
- Package detection is one feature among many
- PR scope validation is optional
- All other features (TODO converter, standups, tickets, branches) work everywhere

**Don't over-position as "monorepo tool"** - it's a Linear workflow tool that happens to have monorepo support.

---

## 🚀 Critical Priorities (P0)

### 1. Cross-Repository Workflow Support
**Priority:** P0 | **Effort:** 🟡 Medium | **Status:** 📋 Planned

**Problem:** Developers work across multiple repositories (microservices, frontend/backend, etc.), but Linear Buddy only works in the current workspace.

**User Workflow:**
1. User has multiple repos: `frontend-app`, `backend-api`, `mobile-app`
2. Linear tickets might be associated with different repos
3. Need to switch context between repos seamlessly

**Solution:**
- [ ] **Detect ticket repository association**
  - Read from Linear ticket custom fields
  - Parse from ticket labels (e.g., `repo:backend-api`)
  - Infer from branch name patterns
  - Store repository URL in ticket metadata

- [ ] **Cross-workspace actions**
  - "Open in New Workspace" button for tickets in other repos
  - Automatically clone repo if not local
  - Prompt for local path if repo already exists
  - Open new VS Code window with that workspace

- [ ] **Automatic branch checkout**
  - When opening external repo workspace, checkout associated branch
  - If branch doesn't exist locally, offer to create/pull it
  - Show notification: "Switched to ENG-123 in backend-api"

- [ ] **Repository registry**
  - Map Linear ticket repos to local paths
  - Store in workspace/user settings
  - Auto-discover repos in common parent directories

**Configuration:**
```json
{
  "linearBuddy.repositories": {
    "frontend-app": {
      "path": "~/projects/frontend-app",
      "remote": "git@github.com:org/frontend-app.git"
    },
    "backend-api": {
      "path": "~/projects/backend-api",
      "remote": "git@github.com:org/backend-api.git"
    }
  },
  "linearBuddy.autoDiscoverRepos": true,
  "linearBuddy.reposParentDir": "~/projects"
}
```

**UI Flow:**
```
Sidebar: Click ticket ENG-123
  ↓
Ticket is in "backend-api" repo (not current workspace)
  ↓
Show notification: "This ticket is in backend-api"
[Open in New Workspace] [Stay Here]
  ↓
User clicks "Open in New Workspace"
  ↓
- Check if ~/projects/backend-api exists
- Open new VS Code window with backend-api
- Checkout branch feature/eng-123-add-auth
- Show ticket details in sidebar
```

**API Design:**
```typescript
interface TicketRepository {
  name: string;
  localPath?: string;
  remoteUrl?: string;
  branch?: string;
}

interface RepositoryManager {
  // Detect which repo a ticket belongs to
  detectTicketRepository(ticket: LinearTicket): TicketRepository | null;
  
  // Open repo in new workspace
  openRepositoryWorkspace(repo: TicketRepository, branch?: string): Promise<void>;
  
  // Register local repository paths
  registerRepository(name: string, path: string, remote?: string): void;
  
  // Auto-discover repos in parent directory
  discoverRepositories(parentDir: string): Promise<TicketRepository[]>;
}
```

**Linear Integration:**
- Support custom field: `Repository` (text or select)
- Support label pattern: `repo:backend-api`
- Support ticket description metadata: `Repository: backend-api`

**Success Metrics:**
- % of users working across multiple repos
- Cross-workspace switches per day
- Reduction in context-switching friction

---

### 2. Sharpen Positioning & Marketing
**Priority:** P0 | **Effort:** 🟢 Small | **Status:** 📋 Planned

**Problem:** Generic positioning as "yet another Linear integration" doesn't highlight unique value. Also over-emphasizes monorepo when features work everywhere.

**Solution:**
- [ ] **Primary messaging**: "Linear workflow automation for VS Code"
  - Lead with TODO converter + permalinks
  - Emphasize cross-repository support
  - Show it works for any project structure
  
- [ ] **Update positioning**:
  - ❌ Don't say: "Monorepo tool with Linear integration"
  - ✅ Do say: "Linear integration that works everywhere (including monorepos)"
  - Feature monorepo as "bonus capability", not core identity

- [ ] **Marketing materials**:
  - Create comparison page: "Linear Buddy vs [Competitors]"
  - Update README with clearer value proposition
  - Add "Why Linear Buddy?" section to walkthrough
  - Create 30-second demo video of TODO workflow
  - Create demo video of cross-repo workflow

- [ ] **Use cases to highlight**:
  - Solo developer (any repo type)
  - Microservices team (multiple repos)
  - Full-stack developer (frontend + backend repos)
  - Monorepo team (as ONE use case, not the only one)

**Success Metrics:**
- Conversion rate from install → first TODO converted
- Time to first "aha moment"
- Diversity of repository types using the tool

---

### 3. Repository Context Awareness
**Priority:** P0 | **Effort:** 🟢 Small | **Status:** 📋 Planned

**Problem:** Users don't realize the tool works for all repo types.

**Solution:**
- [ ] **Smart feature detection**:
  - Auto-detect if workspace is monorepo → show package features
  - Auto-detect multiple repos in parent dir → offer cross-repo features
  - Single repo → hide monorepo-specific features

- [ ] **Adaptive UI**:
  - Don't show "Package Scope" if not a monorepo
  - Show "Switch Repository" if multiple repos detected
  - Show "Monorepo Features Available" badge when detected

- [ ] **Feature discovery**:
  - "This workspace appears to be a monorepo" notification
  - "We detected 3 related repositories" notification
  - Contextual help based on detected structure

**Configuration (auto-detected):**
```json
{
  "linearBuddy.workspace.type": "monorepo" | "single" | "multi-repo",
  "linearBuddy.workspace.relatedRepos": ["../frontend", "../backend"],
  "linearBuddy.showMonorepoFeatures": true // auto-enabled for monorepos
}
```

---

### 4. Distribution & Discovery
**Priority:** P0 | **Effort:** 🟡 Medium | **Status:** 📋 Planned

**Problem:** Best features don't matter if no one finds them.

**Solution:**
- [ ] **Publishing**:
  - Publish to VS Code Marketplace (if not already)
  - Publish to Open VSX (for Cursor, other editors)
  - Create showcase GIFs for marketplace listing

- [ ] **Content marketing**:
  - Blog post: "Stop Losing TODO Comments"
  - Blog post: "Managing Linear Tickets Across Multiple Repositories"
  - Blog post: "Why We Built Linear Buddy (And Why It's Not Just for Monorepos)"
  - Share on r/vscode, dev.to, Twitter/X, Hacker News

- [ ] **Demo repositories**:
  - Single repo example (most common use case)
  - Multi-repo microservices example
  - Monorepo example (show all features)

**Success Metrics:**
- Weekly installs by repo type (track diversity)
- Marketplace search ranking
- Referral sources

---

### 5. First-Time User Experience
**Priority:** P0 | **Effort:** 🟢 Small | **Status:** 📋 Planned

**Problem:** Users may not discover killer features (TODO converter).

**Solution:**
- [ ] Add onboarding tips after first install
- [ ] Show "Try Converting a TODO" notification after setup
- [ ] Interactive walkthrough with actual TODO example
- [ ] Add "What's New" notifications for major features
- [ ] Tooltip hints on first sidebar visit

**Success Metrics:**
- % users who convert first TODO within 24 hours
- Feature discovery rate

---

## 👥 Light Team Features (P1)

### 6. Team Ticket Visibility
**Priority:** P1 | **Effort:** 🟡 Medium | **Status:** 📋 Planned

**Problem:** Tool is single-player, but Linear is collaborative.

**Current State:** Only shows "My Tickets"

**Solution:**
- [ ] Add "Team Tickets" section in sidebar
  - Show tickets assigned to team members
  - Filter by team (from settings)
  - Group by assignee
- [ ] Add team member avatars/indicators
- [ ] Click to see who's working on what
- [ ] Optional: Show ticket activity (recent comments, status changes)

**UI Mock:**
```
LINEAR BUDDY
├─ My Tickets (3)
│   ├─ In Progress (2)
│   └─ Backlog (1)
└─ Team Tickets (12)
    ├─ 👤 Alice (3)
    ├─ 👤 Bob (2)
    └─ 👤 Charlie (1)
```

**Configuration:**
```json
{
  "linearBuddy.showTeamTickets": true,
  "linearBuddy.teamTicketsLimit": 20
}
```

---

### 7. Shared Branch Naming Conventions
**Priority:** P1 | **Effort:** 🟢 Small | **Status:** 📋 Planned

**Problem:** Each developer has their own branch naming style.

**Current State:** User sets their own convention in settings.

**Solution:**
- [ ] Add "Team Settings" sync option
- [ ] Store team conventions in workspace settings (`.vscode/settings.json`)
- [ ] Prompt to use team convention when detected
- [ ] Show "Team uses: `conventional`" hint in branch creation

**Configuration:**
```json
{
  // Workspace settings (shared via git)
  "linearBuddy.team.branchNamingConvention": "conventional",
  "linearBuddy.team.branchTemplate": "{type}/{identifier}-{slug}",
  
  // Personal override (user settings)
  "linearBuddy.branchNamingConvention": "custom" // overrides team
}
```

---

### 8. Team Standup Aggregation
**Priority:** P1 | **Effort:** 🟡 Medium | **Status:** 📋 Planned

**Problem:** Hard to see what the team accomplished.

**Solution:**
- [ ] Add "Generate Team Standup" command
- [ ] Select team members (multi-select)
- [ ] Aggregate commits from all selected members
- [ ] Group by person with individual summaries
- [ ] Include team-level summary

**Output Format:**
```markdown
## Team Standup - November 7, 2025

### Team Summary
Shipped authentication system, made progress on user profiles, 
and fixed critical bugs in payment flow.

### Alice
**Tickets:** ENG-123, ENG-124
- Completed JWT authentication with refresh tokens
- Added comprehensive test coverage
**Next:** Deploy to staging

### Bob
**Tickets:** ENG-125
- Implemented user profile page
- Fixed avatar upload bug
**Next:** Add profile editing

### Charlie
**Tickets:** ENG-126
- Fixed payment processing edge case
- Updated documentation
**Blockers:** Waiting on Stripe API update
```

---

### 9. Shared TODO Templates
**Priority:** P1 | **Effort:** 🟢 Small | **Status:** 📋 Planned

**Problem:** Team members create tickets differently.

**Solution:**
- [ ] Add TODO template definitions
- [ ] Store in workspace settings
- [ ] Apply template when converting TODO
- [ ] Include common labels, estimates, projects

**Configuration:**
```json
{
  "linearBuddy.todoTemplates": {
    "bug": {
      "labels": ["bug", "needs-triage"],
      "priority": 1,
      "projectId": "proj_123"
    },
    "tech-debt": {
      "labels": ["tech-debt"],
      "priority": 3,
      "estimate": 2
    },
    "feature": {
      "labels": ["feature"],
      "projectId": "proj_456"
    }
  }
}
```

**Usage:**
```typescript
// TODO(bug): Fix memory leak in upload handler
// TODO(tech-debt): Refactor auth service
// TODO(feature): Add dark mode support
```

---

## 📊 Secondary Enhancements (P2)

### 10. Personal Analytics Dashboard
**Priority:** P2 | **Effort:** 🟡 Medium | **Status:** 📋 Planned

**Value:** Quantifies productivity and justifies tool's value.

**Features:**
- [ ] Webview panel showing personal stats
- [ ] Metrics:
  - TODOs converted → tickets this week/month
  - Time saved (estimated: 3 min/ticket × count)
  - Tickets completed
  - Average ticket completion time
  - Standup generation usage
  - PR summaries generated
- [ ] Trend charts (last 30 days)
- [ ] Milestones and achievements

**UI Components:**
- Weekly summary card
- Time saved counter
- Activity heatmap
- Feature usage breakdown

---

### 11. Advanced Team Analytics (Pro Feature)
**Priority:** P2 | **Effort:** 🔴 Large | **Status:** 💎 Pro

**Value:** Team leads want visibility into team velocity.

**Features:**
- [ ] Team velocity dashboard
- [ ] Cycle time metrics
- [ ] Bottleneck detection
- [ ] Individual contributor stats
- [ ] Project progress tracking
- [ ] Export reports (CSV, PDF)

**Requires:**
- Pro license
- Team role/permissions
- Linear webhook integration (optional)

---

### 12. Slack Integration
**Priority:** P2 | **Effort:** 🟡 Medium | **Status:** 📋 Planned

**Value:** Share standups/PRs directly to Slack.

**Features:**
- [ ] "Share to Slack" button after generating standup
- [ ] Configure Slack workspace in settings
- [ ] Select channel for posting
- [ ] Include formatted message with links
- [ ] Support for Slack threads (reply to daily standup thread)

**Configuration:**
```json
{
  "linearBuddy.slack.webhookUrl": "https://hooks.slack.com/...",
  "linearBuddy.slack.defaultChannel": "#engineering-standups",
  "linearBuddy.slack.includeCodeLinks": true
}
```

---

### 13. GitHub PR Auto-Comments
**Priority:** P2 | **Effort:** 🟡 Medium | **Status:** 📋 Planned

**Value:** Surface Linear context in PRs automatically.

**Features:**
- [ ] Detect PR creation from branch
- [ ] Post comment with Linear ticket details
- [ ] Include ticket description, status, assignee
- [ ] Add permalink back to code TODOs
- [ ] Update when ticket status changes

**Example PR Comment:**
```markdown
## 📋 Linear Ticket: ENG-123

**Status:** In Progress → In Review
**Assignee:** @alice
**Priority:** High

### Description
Implement JWT authentication with RS256 signing...

### Related TODOs
- [auth.ts:45](https://github.com/org/repo/blob/abc123/src/auth.ts#L45)
- [tests/auth.test.ts:120](https://github.com/org/repo/blob/abc123/tests/auth.test.ts#L120)

[View in Linear](https://linear.app/org/issue/ENG-123)
```

---

### 14. Custom AI Prompts
**Priority:** P2 | **Effort:** 🟢 Small | **Status:** 📋 Planned

**Value:** Let power users customize AI behavior.

**Features:**
- [ ] Expose prompt templates in settings
- [ ] Custom instructions for standup generation
- [ ] Custom instructions for PR summaries
- [ ] Save and share prompt templates
- [ ] Community prompt library (future)

**Configuration:**
```json
{
  "linearBuddy.ai.customPrompts": {
    "standup": "Focus on business impact, not technical details...",
    "pr": "Use bullet points, emphasize breaking changes..."
  }
}
```

---

### 15. Ticket Time Tracking
**Priority:** P2 | **Effort:** 🟡 Medium | **Status:** 📋 Planned

**Value:** Automatic time tracking based on work sessions.

**Features:**
- [ ] Track time when branch is checked out
- [ ] Detect active work periods (VS Code focus)
- [ ] Pause tracking when switching branches
- [ ] Show elapsed time in sidebar
- [ ] Push time estimates to Linear (if API supports)
- [ ] Weekly time report

**UI:**
```
🟢 ENG-123 - Implement JWT auth [2h 34m]
   [Pause] [Stop]
```

---

### 16. Offline Mode Improvements
**Priority:** P2 | **Effort:** 🟡 Medium | **Status:** 📋 Planned

**Value:** Work without internet, sync later.

**Features:**
- [ ] Cache ticket data locally
- [ ] Queue actions (status changes, comments) when offline
- [ ] Sync queue when connection restored
- [ ] Show offline indicator in sidebar
- [ ] Conflict resolution for sync conflicts

---

### 17. Multi-Linear-Workspace Support (Pro Feature)
**Priority:** P2 | **Effort:** 🔴 Large | **Status:** 💎 Pro

**Value:** Developers working on multiple Linear organizations (contractors, consultants).

**Note:** This is different from #1 (Cross-Repository Support). This is about multiple Linear workspaces, not multiple code repositories.

**Features:**
- [ ] Switch between Linear workspaces (different organizations)
- [ ] Workspace selector in sidebar
- [ ] Separate settings per Linear workspace
- [ ] Cross-workspace ticket search
- [ ] Aggregate standup across Linear workspaces

---

## 🎨 Experience Improvements (P3)

### 18. Custom Themes
**Priority:** P3 | **Effort:** 🟡 Medium | **Status:** 💎 Pro

**Features:**
- [ ] Custom sidebar colors
- [ ] Priority indicator colors
- [ ] Custom icons
- [ ] Dark/light theme variations
- [ ] Theme marketplace

---

### 19. Keyboard-First Navigation
**Priority:** P3 | **Effort:** 🟢 Small | **Status:** 📋 Planned

**Features:**
- [ ] Quick open ticket by ID (Cmd+K → type "ENG-123")
- [ ] Keyboard shortcuts for all actions
- [ ] Vim-style navigation in sidebar
- [ ] Command palette integration

---

### 20. Mobile Companion App
**Priority:** P3 | **Effort:** 🔴 Large | **Status:** 🔮 Future

**Value:** Review tickets on mobile.

**Features:**
- [ ] iOS/Android app
- [ ] Sync with desktop extension
- [ ] Push notifications for ticket updates
- [ ] Quick status updates
- [ ] View permalinks on mobile

---

## 🏢 Enterprise Features (P3)

### 21. SSO Integration
**Priority:** P3 | **Effort:** 🔴 Large | **Status:** 💎 Pro

**Features:**
- [ ] SAML 2.0 support
- [ ] OAuth integration
- [ ] LDAP sync
- [ ] Automatic provisioning

---

### 22. Admin Dashboard
**Priority:** P3 | **Effort:** 🔴 Large | **Status:** 💎 Pro

**Features:**
- [ ] Centralized license management
- [ ] Usage analytics
- [ ] Policy enforcement
- [ ] Audit logs

---

## 🐛 Known Issues & Technical Debt

### High Priority Bugs
- [ ] None currently tracked

### Technical Debt
- [ ] Refactor webview communication protocol (typed messages)
- [ ] Add comprehensive error handling for API failures
- [ ] Implement retry logic for network requests
- [ ] Add telemetry for feature usage (privacy-respecting)
- [ ] Improve test coverage (currently manual testing only)

---

## 📈 Success Metrics

### Acquisition
- [ ] Weekly active installations
- [ ] Marketplace listing views
- [ ] Website → install conversion rate

### Activation
- [ ] % users who complete setup (Linear API token)
- [ ] % users who convert first TODO within 24h
- [ ] Time to first value

### Engagement
- [ ] Daily active users (DAU)
- [ ] TODOs converted per user per week
- [ ] Standups generated per user per week
- [ ] Feature adoption rates

### Retention
- [ ] 7-day retention
- [ ] 30-day retention
- [ ] Churn rate

### Revenue (Future)
- [ ] Free → Pro conversion rate
- [ ] Monthly recurring revenue (MRR)
- [ ] Average revenue per user (ARPU)
- [ ] Lifetime value (LTV)

---

## 🎯 Next Quarter Goals (Q1 2025)

### Goal 1: Increase Discovery
- [ ] Ship to VS Code Marketplace
- [ ] Create demo video
- [ ] Write 3 blog posts
- **Target:** 500+ installs

### Goal 2: Improve Activation
- [ ] Ship first-time user experience improvements
- [ ] Add onboarding tips
- **Target:** 50% of users convert first TODO

### Goal 3: Add Team Value
- [ ] Ship team ticket visibility
- [ ] Ship shared branch conventions
- **Target:** 10% increase in daily usage

---

## 💬 Community Feedback

### Most Requested Features
1. Team visibility (multiple requests)
2. Time tracking
3. Slack integration
4. GitHub PR comments
5. Custom keyboard shortcuts

### Pain Points
1. Discovery of TODO converter feature
2. Setup complexity (Linear API token)
3. Lack of team features
4. No mobile access

---

## 🔄 Review Schedule

- **Weekly:** Update status on in-progress items
- **Monthly:** Review priorities based on usage data
- **Quarterly:** Major roadmap adjustments

**Next Review:** December 1, 2025

---

## 📝 Notes

- Keep free tier valuable (don't paywall basic features)
- Focus on word-of-mouth growth (viral features)
- Prioritize features that increase daily usage
- Balance solo developer needs with team collaboration
- Maintain privacy-first approach (no intrusive telemetry)

---

**Document Owner:** Angelo Girardi  
**Contact:** angelo@cooked.mx  
**Repository:** [Linear Buddy](https://github.com/yourusername/linear-buddy)

