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
| **Jira: Add "Current Sprint" section** | 🔴 P0 | 🟡 | ⬜ Not Started |
| **Jira: Show Sprint name in tree view** | 🟡 P1 | 🟢 | ⬜ Not Started |
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
| **Repository registry** - Map ticket prefixes to repos | 🔴 P0 | 🟡 | ⬜ Not Started |
| **Cross-workspace branch associations** | 🔴 P0 | 🟡 | ⬜ Not Started |
| **"Open in Workspace" action** for tickets in other repos | 🟡 P1 | 🟡 | ⬜ Not Started |
| **Auto-detect related repositories** in parent directory | 🟡 P1 | 🟢 | ⬜ Not Started |
| **Multi-workspace ticket search** | 🟢 P2 | 🟡 | ⬜ Not Started |
| **Repository indicator in sidebar** | 🟢 P2 | 🟢 | ⬜ Not Started |

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
| **Show related/blocked issues** in ticket panel | 🔴 P0 | 🟢 | Linear ✅, Jira ⬜ |
| **Create issue links** (blocks, relates to) | 🟡 P1 | 🟡 | Both |
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
| **Add/remove labels** in ticket panel | 🟡 P1 | 🟢 | Linear ✅, Jira ⬜ |
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
| Labels Edit | ⬜ | ⬜ | 🟡 |
| Priority Display | ✅ | ✅ | ✅ |
| Priority Edit | ⬜ | ⬜ | 🟡 |
| Due Date Display | ✅ | ✅ | ✅ |
| Due Date Edit | ⬜ | ⬜ | 🟢 |
| Sub-issues | ✅ | ✅ | ✅ |
| Create Sub-issue | ⬜ | ⬜ | 🟡 |
| Linked PRs | ✅ | ⬜ | 🟡 |
| Branch Manager | ✅ | ⬜ | 🔴 P0 |
| Issue Links | ✅ | ⬜ | 🟡 |
| Activity Feed | ⬜ | ⬜ | 🟢 |
| Estimates | ✅ (display) | ✅ (display) | 🟡 edit |
| Sprint/Cycle | ⬜ | ⬜ | 🟡 |

### Priority Tasks for Ticket Panels

| Task | Priority | Effort | Platform |
|------|----------|--------|----------|
| **Jira: Add Branch Manager component** | 🔴 P0 | 🟡 | Jira |
| **Jira: Show labels** | 🟡 P1 | 🟢 | Jira |
| **Both: Edit priority** | 🟡 P1 | 🟢 | Both |
| **Both: Edit estimates** | 🟡 P1 | 🟢 | Both |
| **Both: Create sub-issue** | 🟡 P1 | 🟡 | Both |
| **Jira: Show linked PRs** | 🟡 P1 | 🟡 | Jira |
| **Jira: Show issue links** | 🟡 P1 | 🟢 | Jira |
| **Both: Edit labels** | 🟢 P2 | 🟡 | Both |
| **Both: Activity feed** | 🟢 P2 | 🟡 | Both |

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
| **Jira rate limiting** | 🟡 P1 | 🟢 | ⬜ Not Started |
| **Error handling audit** | 🟡 P1 | 🟡 | ⬜ Not Started |
| **Loading states consistency** | 🟡 P1 | 🟢 | ⬜ Not Started |
| **Keyboard navigation** | 🟢 P2 | 🟡 | ⬜ Not Started |
| **Accessibility audit** | 🟢 P2 | 🟡 | ⬜ Not Started |
| **Performance audit** (large ticket lists) | 🟢 P2 | 🟡 | ⬜ Not Started |

---

## 8. Pro Features (Stay Beta)

These features will ship with 1.0 but remain marked as "Beta 💎":

| Feature | Status | Notes |
|---------|--------|-------|
| **AI Ticket Creation** | 🚧 In Progress | Via chat `/create` |
| **Workspace Profiles** | ⬜ Planned | Multi-account support |
| **Team Analytics** | ⬜ Planned | Post-1.0 |
| **Advanced AI Prompts** | ⬜ Planned | Custom prompt templates |
| **Standup Builder** | ✅ Done | Keep Beta label |
| **PR Summary** | ✅ Done | Keep Beta label |

---

## 9. Release Milestones

### Milestone 1: Sidebar Parity (Week 1-2)
- [x] Jira: Recently Completed section
- [x] Jira: Project Unassigned section
- [ ] Jira: Current Sprint section
- [ ] Jira: Sprint name display

### Milestone 2: Ticket Panel Parity (Week 2-3)
- [ ] Jira: Branch Manager component
- [ ] Jira: Labels display
- [ ] Jira: Issue links display
- [ ] Both: Priority editing
- [ ] Both: Estimate editing

### Milestone 3: Multi-Repo Foundation (Week 3-4)
- [ ] Repository registry configuration
- [ ] Global branch association storage
- [ ] Cross-workspace ticket detection
- [ ] "Open in Workspace" action

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
- [ ] **Jira sidebar parity** (unassigned, recently completed, sprint)
- [ ] **Jira branch manager** in ticket panel
- [ ] **Multi-repo branch associations** (basic)
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

---

## Tracking

| Week | Focus | Status |
|------|-------|--------|
| Week 1 | Sidebar Parity (Jira) | ⬜ Not Started |
| Week 2 | Sidebar + Ticket Panel | ⬜ Not Started |
| Week 3 | Multi-Repo Foundation | ⬜ Not Started |
| Week 4 | Chat/AI Parity | ⬜ Not Started |
| Week 5 | Polish & Docs | ⬜ Not Started |
| Week 6 | Testing & Release | ⬜ Not Started |

---

**Last Updated:** December 19, 2025  
**Owner:** Angelo Girardi

