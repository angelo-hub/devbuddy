# DevBuddy 1.0.0 Roadmap

**Created:** December 19, 2025  
**Target:** Q1 2025  
**Current Version:** 0.8.0

---

## Overview

This document tracks the path to DevBuddy 1.0.0, focusing on:
1. **Sidebar Parity** - Bring Jira sidebar to Linear's level
2. **Multi-Repo Support** - Branch associations across repositories
3. **Web UI Feature Parity** - Essential features from Linear/Jira web apps
4. **Polish & Stability** - Documentation, UX refinements

**Pro Features remain in Beta** until fully polished post-1.0.

---

## Priority Legend

- 🔴 **P0 - Blocking 1.0** - Must ship
- 🟡 **P1 - Important** - Should ship if time permits
- 🟢 **P2 - Nice to Have** - Post-1.0 or if easy wins
- 💎 **Pro Feature** - Gated behind Pro license (stays Beta)

**Effort:** 🟢 Small (1-3 days) | 🟡 Medium (1-2 weeks) | 🔴 Large (2+ weeks)

---

## 1. Sidebar Parity

### Current State

| Feature | Linear | Jira Cloud |
|---------|--------|------------|
| My Issues | ✅ Grouped by status | ✅ Grouped by status |
| Recently Completed | ✅ | ❌ |
| Team Unassigned | ✅ (per team) | ❌ |
| Projects View | ✅ (with unassigned) | ❌ |
| Sprint Context | N/A | ❌ |
| Board View | N/A | ❌ |

### Tasks

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| **Jira: Add "Recently Completed" section** | 🔴 P0 | 🟢 | ✅ Done |
| **Jira: Add "Project Unassigned" section** | 🔴 P0 | 🟢 | ✅ Done |
| **Jira: Add "Current Sprint" section** | 🔴 P0 | 🟡 | ✅ Done |
| **Jira: Show Sprint name in tree view** | 🟡 P1 | 🟢 | ✅ Done |
| **Jira: Board quick-view (collapsible)** | 🟢 P2 | 🟡 | ⬜ Not Started |
| **Linear: Add "Current Cycle" indicator** | 🟢 P2 | 🟢 | ⬜ Not Started |

### Target Jira Sidebar Structure

```
MY ISSUES (12)
├─ In Progress (3)
│   └─ PROJ-123: Issue title
├─ To Do (5)
├─ Done (4)

RECENTLY COMPLETED (10)
├─ PROJ-456: Recently finished issue

CURRENT SPRINT: Sprint 42 ⚡
├─ My Sprint Tasks (3)
├─ Unassigned (8)

PROJECTS
├─ Project Alpha
│   └─ Unassigned (5)
├─ Project Beta
    └─ Unassigned (12)
```

---

## 2. Multi-Repository Support

### Problem

Developers work across multiple repositories (microservices, monorepos, frontend/backend). Currently:
- Branch associations are stored per-workspace
- No way to track which ticket belongs to which repo
- Cross-repo workflow requires manual context switching

### Tasks

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| **Repository registry** - Map ticket prefixes to repos | 🔴 P0 | 🟡 | ✅ Done |
| **Cross-workspace branch associations** | 🔴 P0 | 🟡 | ✅ Done |
| **"Open in Workspace" action** for tickets in other repos | 🟡 P1 | 🟡 | ✅ Done |
| **Auto-detect related repositories** in parent directory | 🟡 P1 | 🟢 | ✅ Done |
| **IDE Fork Detection** (VS Code, Cursor, VSCodium, etc.) | 🟡 P1 | 🟢 | ✅ Done |
| **Multi-workspace ticket search** | 🟢 P2 | 🟡 | ⬜ Not Started |
| **Repository indicator in sidebar** | 🟢 P2 | 🟢 | ✅ Done |

### Configuration Design

```json
{
  "devBuddy.repositories": {
    "frontend-app": {
      "path": "~/projects/frontend",
      "remote": "git@github.com:org/frontend.git",
      "ticketPrefix": "FE"
    },
    "backend-api": {
      "path": "~/projects/backend",
      "remote": "git@github.com:org/backend.git",
      "ticketPrefix": "BE"
    }
  },
  "devBuddy.multiRepo.enabled": true,
  "devBuddy.multiRepo.autoDiscover": true,
  "devBuddy.multiRepo.parentDir": "~/projects"
}
```

### Branch Association Storage

```typescript
interface GlobalBranchAssociation {
  ticketId: string;
  branchName: string;
  repository: string;      // NEW: repo identifier
  repositoryPath: string;  // NEW: local path
  lastUpdated: string;
}

// Storage: globalState (not workspaceState)
// Key: devBuddy.globalBranchAssociations
```

### UI Flow

```
User clicks ticket ENG-123 (associated with backend-api repo)
  ↓
Current workspace is frontend-app
  ↓
Show notification:
  "ENG-123 is in backend-api repository"
  [Open in New Window] [Stay Here]
  ↓
If "Open in New Window":
  - Open VS Code window for ~/projects/backend
  - Checkout branch feat/eng-123-auth
  - Show ticket details
```

---

## 3. Web UI Feature Parity

Features from Linear/Jira web UIs that would add significant value.

### 3.1 Issue Relations & Links

| Task | Priority | Effort | Platforms |
|------|----------|--------|-----------|
| **Show related/blocked issues** in ticket panel | 🔴 P0 | 🟢 | Linear ✅, Jira ✅ |
| **Render ticket links in descriptions/comments** | 🟡 P1 | 🟢 | Linear ✅ (basic), Jira ⬜ |
| **Enrich ticket links with status/title** (fetch metadata) | 🔴 P0 | 🟡 | Both ⬜ (URL slug is static, shows stale titles) |
| **Create issue links** (blocks, relates to) | 🟡 P1 | 🟡 | Linear ✅, Jira ✅ |
| **Dependency visualization** (mini graph) | 🟢 P2 | 🔴 | Both |

### 3.2 Activity & History

| Task | Priority | Effort | Platforms |
|------|----------|--------|-----------|
| **Activity feed** in ticket panel | 🟡 P1 | 🟡 | Both |
| **Show who changed what** | 🟡 P1 | 🟢 | Both |
| **Comment edit history** | 🟢 P2 | 🟢 | Both |

### 3.3 Time & Estimates

| Task | Priority | Effort | Platforms |
|------|----------|--------|-----------|
| **Story points / estimates display** | ✅ Done | - | Both |
| **Set/update estimates** in ticket panel | 🟡 P1 | 🟢 | Both |
| **Time tracking display** (Jira) | 🟡 P1 | 🟢 | Jira |
| **Log work** (Jira) | 🟢 P2 | 🟡 | Jira |

### 3.4 Sprint & Cycle Management

| Task | Priority | Effort | Platforms |
|------|----------|--------|-----------|
| **Show current sprint/cycle** in sidebar | 🔴 P0 | 🟢 | Both |
| **Sprint selector** when creating tickets | 🟡 P1 | 🟢 | Jira |
| **Cycle selector** when creating tickets | 🟡 P1 | 🟢 | Linear |
| **Move to sprint** action | 🟢 P2 | 🟢 | Jira |

### 3.5 Labels & Components

| Task | Priority | Effort | Platforms |
|------|----------|--------|-----------|
| **Add/remove labels** in ticket panel | ✅ Done | 🟢 | Linear ✅, Jira ⬜ |
| **Jira components** support | 🟢 P2 | 🟡 | Jira |
| **Label color coding** in sidebar | 🟢 P2 | 🟢 | Both |

### 3.6 Attachments

| Task | Priority | Effort | Platforms |
|------|----------|--------|-----------|
| **View attachments list** | 🟡 P1 | 🟢 | Both (Linear done) |
| **Open attachment in browser** | 🟡 P1 | 🟢 | Both |
| **Upload attachments** | 🟢 P2 | 🟡 | Both |

### 3.7 Watchers & Notifications

| Task | Priority | Effort | Platforms |
|------|----------|--------|-----------|
| **Show watchers** on ticket | 🟢 P2 | 🟢 | Jira |
| **Watch/unwatch ticket** | 🟢 P2 | 🟢 | Jira |

---

## 4. Ticket Panel Enhancements

### Current vs Target Feature Matrix

| Feature | Linear Panel | Jira Panel | Target 1.0 |
|---------|--------------|------------|------------|
| Edit Title | ✅ | ✅ | ✅ |
| Edit Description | ✅ (Markdown) | ✅ (Rich text) | ✅ |
| Status Selector | ✅ | ✅ | ✅ |
| Assignee Selector | ✅ | ✅ | ✅ |
| Comments | ✅ | ✅ | ✅ |
| Add Comment | ✅ | ✅ | ✅ |
| Labels Display | ✅ | ⬜ | 🟡 |
| Labels Edit | ✅ | ⬜ | 🟡 |
| Priority Display | ✅ | ✅ | ✅ |
| Priority Edit | ⬜ | ⬜ | 🟡 |
| Due Date Display | ✅ | ✅ | ✅ |
| Due Date Edit | ⬜ | ⬜ | 🟢 |
| Sub-issues | ✅ | ✅ | ✅ |
| Create Sub-issue | ⬜ | ⬜ | 🟡 |
| Linked PRs | ✅ | ⬜ | 🟡 |
| Branch Manager | ✅ | ✅ | ✅ |
| Issue Links | ✅ | ✅ | ✅ |
| Activity Feed | ⬜ | ⬜ | 🟢 |
| Estimates | ✅ (display) | ✅ (display) | 🟡 edit |
| Sprint/Cycle | ✅ | ⬜ | 🟡 |

### Priority Tasks for Ticket Panels

| Task | Priority | Effort | Platform | Status |
|------|----------|--------|----------|--------|
| **Jira: Add Branch Manager component** | 🔴 P0 | 🟡 | Jira | ✅ Done |
| **Jira: Show labels** | 🟡 P1 | 🟢 | Jira | ⬜ |
| **Both: Edit priority** | 🟡 P1 | 🟢 | Both | ⬜ |
| **Both: Edit estimates** | 🟡 P1 | 🟢 | Both | ⬜ |
| **Both: Create sub-issue** | 🟡 P1 | 🟡 | Both | ⬜ |
| **Jira: Show linked PRs** | 🟡 P1 | 🟡 | Jira | ⬜ |
| **Jira: Show issue links** | 🟡 P1 | 🟢 | Jira | ✅ Done |
| **Both: Edit labels** | 🟢 P2 | 🟡 | Both | ⬜ |
| **Both: Activity feed** | 🟢 P2 | 🟡 | Both | ⬜ |

---

## 5. Chat Participant Parity

### Current State

| Feature | Linear | Jira |
|---------|--------|------|
| `/tickets` - List tickets | ✅ | ✅ |
| `/standup` - Generate standup | ✅ | 🟡 Partial |
| `/pr` - Generate PR summary | ✅ | 🟡 Partial |
| `/status` - Update status | ✅ | ⬜ |
| `/create` - Create ticket | 💎 Pro | ⬜ |
| `/plan` - Implementation plan | ✅ | ⬜ |
| `/suggest` - What to work on | ✅ | ⬜ |

### Tasks

| Task | Priority | Effort |
|------|----------|--------|
| **Jira: `/status` command** | 🟡 P1 | 🟢 |
| **Jira: Full `/standup` support** | 🟡 P1 | 🟡 |
| **Jira: Full `/pr` support** | 🟡 P1 | 🟡 |
| **Jira: `/plan` command** | 🟢 P2 | 🟢 |
| **Jira: `/suggest` command** | 🟢 P2 | 🟢 |

---

## 6. Documentation & Polish

### Tasks

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| **Update README.md** for 1.0 | 🔴 P0 | 🟢 | ⬜ Not Started |
| **Update FEATURE_COMPATIBILITY_MATRIX.md** | 🔴 P0 | 🟢 | ⬜ Not Started |
| **Update Quick Start guide** | 🔴 P0 | 🟢 | ⬜ Not Started |
| **Add 1.0 release notes template** | 🔴 P0 | 🟢 | ⬜ Not Started |
| **Update walkthrough for Jira** | 🟡 P1 | 🟢 | ⬜ Not Started |
| **Add troubleshooting guide** | 🟡 P1 | 🟡 | ⬜ Not Started |
| **Create demo GIFs for Jira features** | 🟡 P1 | 🟡 | ⬜ Not Started |
| **API documentation** | 🟢 P2 | 🟡 | ⬜ Not Started |

---

## 7. Technical Debt & Stability

### Tasks

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| **API Infrastructure** (retry, cache, network monitor) | 🟡 P1 | 🟡 | ✅ Done |
| **Jira rate limiting** | 🟡 P1 | 🟢 | ✅ Done |
| **Error handling audit** | 🟡 P1 | 🟡 | ⬜ Not Started |
| **Loading states consistency** | 🟡 P1 | 🟢 | ⬜ Not Started |
| **Keyboard navigation** | 🟢 P2 | 🟡 | ⬜ Not Started |
| **Accessibility audit** | 🟢 P2 | 🟡 | ⬜ Not Started |
| **Performance audit** (large ticket lists) | 🟢 P2 | 🟡 | ⬜ Not Started |
| **Migrate webview emojis to Lucide React icons** | 🟡 P1 | 🟢 | ✅ Done |

### 7.1 Webview Architecture (Multi-Panel Support)

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| **Zustand state management** for all webviews | 🟡 P1 | 🟡 | ✅ Done |
| **Cross-panel synchronization** (sync updates between open panels) | 🟢 P2 | 🟡 | ⬜ Not Started |
| **Panel registry** in extension host | 🟢 P2 | 🟢 | ⬜ Not Started |
| **Broadcast state changes** to all panels showing same ticket | 🟢 P2 | 🟢 | ⬜ Not Started |

#### Cross-Panel Sync Architecture

When a user has multiple ticket panels open and updates one, all panels should reflect the change:

```
┌─────────────────────────────────────────────────────────────┐
│                    Extension Host                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ PanelRegistry                                          │  │
│  │  - Map<issueId, Set<WebviewPanel>>                    │  │
│  │  - broadcastUpdate(issueId, update)                   │  │
│  └───────────────────────────────────────────────────────┘  │
│           │                      │                          │
│           ▼                      ▼                          │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Panel 1 (ABC-1) │    │ Panel 2 (ABC-1) │                │
│  │ Zustand Store   │    │ Zustand Store   │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘

User updates status in Panel 1:
  → Panel 1 sends updateStatus to extension
  → Extension updates API
  → Extension broadcasts to all panels with same issueId
  → Panel 2 receives update, Zustand store updates
  → Both panels show new status
```

#### Implementation Notes

- **Store per panel** - Each webview has isolated Zustand store (already works)
- **Extension as message broker** - Route updates between panels
- **Selective sync** - Only sync to panels showing the same issue
- **Optimistic updates** - Update local store immediately, sync in background

### 7.2 Authentication Improvements (Post-1.0)

| Task | Priority | Effort | Platform | Status |
|------|----------|--------|----------|--------|
| **Linear OAuth flow** (replace PAT) | 🟢 P2 | 🟡 | Linear | ⬜ Not Started |
| **Jira OAuth 2.0 flow** | 🟢 P2 | 🟡 | Jira Cloud | ⬜ Not Started |

#### Linear OAuth Notes

Currently DevBuddy uses Personal Access Tokens (PATs) for Linear authentication. OAuth would provide:

- **Better UX**: One-click authorization instead of manual token copy/paste
- **Scoped permissions**: Request only the permissions needed
- **Token refresh**: Automatic token refresh without user intervention
- **Revocation**: Easy revocation via Linear settings

**Implementation Requirements:**
1. Register DevBuddy as an OAuth app in Linear
2. Implement OAuth 2.0 PKCE flow (required for public clients)
3. Use VS Code's `AuthenticationProvider` API for seamless integration
4. Support both OAuth and PAT (fallback for enterprise users)
5. Handle token refresh and expiration gracefully

**Linear OAuth Scopes Needed:**
- `read` - Read access to issues, projects, teams
- `write` - Create/update issues, comments
- `issues:create` - Create new issues

**Reference:** https://developers.linear.app/docs/oauth/authentication

---

## 8. Pro Features (Stay Beta)

These features will ship with 1.0 but remain marked as "Beta 💎":

| Feature | Status | Notes |
|---------|--------|-------|
| **AI Ticket Creation** | 🚧 In Progress | Via chat `/create` |
| **Workspace Profiles** | ⬜ Planned | Multi-account support |
| **Advanced AI Prompts** | ⬜ Planned | Custom prompt templates |
| **Standup Builder** | ✅ Done | Keep Beta label |
| **PR Summary** | ✅ Done | Keep Beta label |
| **BYOT AI Providers** | 🧪 Beta | OpenAI, Anthropic, Google |

---

## 8.2 BYOT (Bring Your Own Token) AI Feature 🧪 Beta

### Overview

BYOT allows users to use their own API keys for AI-powered features instead of relying on GitHub Copilot. This gives users full control over costs and model selection.

### Supported Providers

| Provider | Status | Models |
|----------|--------|--------|
| **Copilot** | ✅ Default | GPT-4o, GPT-4.1, GPT-4-Turbo, Gemini 2.0 |
| **OpenAI** | ✅ Done | GPT-4o, GPT-4o-mini, o1-preview, o1-mini |
| **Anthropic** | ✅ Done | Claude Sonnet 4, Claude 3.5 Sonnet/Haiku |
| **Google** | ✅ Done | Gemini 2.0 Flash, Gemini 1.5 Pro/Flash |

### Configuration

```json
{
  "devBuddy.ai.provider": "openai",      // copilot, openai, anthropic, google
  "devBuddy.ai.openai.model": "gpt-4o-mini",
  "devBuddy.ai.anthropic.model": "claude-3-5-haiku-20241022",
  "devBuddy.ai.google.model": "gemini-1.5-flash"
}
```

### Commands

| Command | Description |
|---------|-------------|
| `DevBuddy: Set OpenAI API Key` | Configure OpenAI API key |
| `DevBuddy: Set Anthropic API Key` | Configure Anthropic API key |
| `DevBuddy: Set Google AI API Key` | Configure Google AI API key |
| `DevBuddy: Remove AI API Key` | Remove stored API keys |
| `DevBuddy: Show AI Provider Status` | View all provider statuses |

### Architecture

- API keys stored securely via VS Code Secret Storage
- Provider manager handles model selection and failover
- Automatic fallback to rule-based summarization if AI fails
- Each provider isolated in own module for easy extension

---

## 8.1 Pro Features Roadmap (Post-1.0)

### Developer Stats Dashboard 💎

Linear is clean but buries stats. Surface the "scoreboard" right in VS Code.

#### Core Stats (Status Bar Widget)

| Metric | Description | Priority |
|--------|-------------|----------|
| **WIP Count** | Active issues assigned to me (excluding Done) | 🔴 P0 |
| **Blocked Count** | Issues in blocked/waiting state | 🔴 P0 |
| **Done (7d)** | Issues completed in last 7 days | 🔴 P0 |
| **Cycle Progress** | Personal % of current cycle/sprint completed | 🟡 P1 |

#### Smart Insights

| Metric | Description | Priority |
|--------|-------------|----------|
| **Stale Tasks** | Assigned to me, not updated in 5+ days | 🔴 P0 |
| **Review Load** | PRs open linked to my issues | 🟡 P1 |
| **Needs Input** | Issues waiting on others (blocked by) | 🟡 P1 |
| **Lead Time** | Avg time from started → done | 🟢 P2 |

#### UI Design

```
┌─────────────────────────────────────────────────┐
│ Status Bar:  📋 WIP: 7  🚫 Blocked: 2  ✅ Done: 9 │
└─────────────────────────────────────────────────┘

Click → Opens Stats Panel:
┌─────────────────────────────────────────────────┐
│ Your Progress                          This Week │
├─────────────────────────────────────────────────┤
│ ✅ Completed        9 issues                     │
│ 🔄 In Progress      4 issues                     │
│ 📋 To Do            3 issues                     │
│ 🚫 Blocked          2 issues                     │
├─────────────────────────────────────────────────┤
│ ⚠️  Stale Work (5+ days)                         │
│    • ENG-123: Fix login bug (7 days)            │
│    • ENG-456: Update docs (12 days)             │
├─────────────────────────────────────────────────┤
│ 🔄 Cycle Progress: 60% (6/10 issues)            │
│ ████████████░░░░░░░░                            │
└─────────────────────────────────────────────────┘
```

#### Implementation Notes

- **Platform agnostic** - Same widget for Linear + Jira
- **Configurable thresholds** - "Stale" = 5 days default, user-configurable
- **Click-through** - Each stat opens filtered view in sidebar
- **Refresh interval** - Background refresh every 5 minutes
- **Offline-friendly** - Cache last known stats

#### API Requirements

Linear:
```graphql
query MyStats {
  viewer {
    assignedIssues(filter: { state: { type: { nin: ["completed", "canceled"] } } }) {
      nodes { id updatedAt state { type } }
    }
  }
  # Cycle progress via cycle query
}
```

Jira:
```
JQL: assignee = currentUser() AND resolution = Unresolved
JQL: assignee = currentUser() AND updated < -5d AND resolution = Unresolved
```

### Team Analytics 💎 (Post-1.0)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Team velocity** | Story points/issues per sprint | 🟡 P1 |
| **Burndown chart** | Sprint progress visualization | 🟢 P2 |
| **Cycle time distribution** | How long issues take | 🟢 P2 |
| **Bottleneck detection** | States where issues get stuck | 🟢 P2 |

---

## 9. Release Milestones

### Milestone 1: Sidebar Parity (Week 1-2)
- [x] Jira: Recently Completed section
- [x] Jira: Project Unassigned section
- [x] Jira: Current Sprint section
- [x] Jira: Sprint name display

### Milestone 2: Ticket Panel Parity (Week 2-3)
- [x] Jira: Branch Manager component
- [ ] Jira: Labels display
- [ ] Jira: Issue links display
- [ ] Both: Priority editing
- [ ] Both: Estimate editing

### Milestone 3: Multi-Repo Foundation (Week 3-4) ✅
- [x] Repository registry configuration
- [x] Global branch association storage
- [x] Cross-workspace ticket detection
- [x] "Open in Workspace" action
- [x] IDE fork detection (VS Code, Cursor, VSCodium, Windsurf)
- [x] Repository indicator in sidebar

### Milestone 4: Chat & AI Parity (Week 4-5)
- [ ] Jira: Full standup support
- [ ] Jira: Full PR summary support
- [ ] Jira: Status update via chat

### Milestone 5: Polish & Documentation (Week 5-6)
- [ ] Documentation updates
- [ ] Demo GIFs
- [ ] Bug fixes
- [ ] Performance testing
- [ ] 1.0.0 release

---

## 10. Success Criteria for 1.0

### Must Have (Blocking)
- [x] Core ticket CRUD for both platforms
- [x] Sidebar with ticket grouping
- [x] **Jira sidebar parity** (unassigned, recently completed, sprint)
- [x] **Jira branch manager** in ticket panel
- [x] **Multi-repo branch associations** (basic)
- [ ] Documentation up-to-date
- [ ] No critical bugs

### Should Have (Important)
- [ ] Sprint/Cycle context in sidebar
- [ ] Issue links display
- [ ] Priority/estimate editing
- [ ] Chat parity for Jira

### Nice to Have (Can wait for 1.1)
- [ ] Activity feed
- [ ] Attachments browser
- [ ] Create sub-issues
- [ ] Label editing
- [ ] Advanced multi-repo features
- [ ] **Cross-panel synchronization** (sync ticket updates between open panels)
- [ ] **Multi-panel management** (panel registry, window coordination)

---

## Tracking

| Week | Focus | Status |
|------|-------|--------|
| Week 1 | Sidebar Parity (Jira) | ✅ Complete |
| Week 2 | Sidebar + Ticket Panel | ✅ Complete |
| Week 3 | Multi-Repo Foundation | ✅ Complete |
| Week 4 | Chat/AI Parity | ⬜ Not Started |
| Week 5 | Polish & Docs | ⬜ Not Started |
| Week 6 | Testing & Release | ⬜ Not Started |

---

**Last Updated:** December 21, 2025 (Added cross-panel sync roadmap)  
**Owner:** Angelo Girardi

