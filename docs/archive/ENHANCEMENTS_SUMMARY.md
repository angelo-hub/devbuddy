# Enhancement Tracking - Key Updates

**Date:** November 7, 2025  
**Action:** Created comprehensive enhancement roadmap

## 📋 What We Created

A complete enhancement tracking document at `docs/planning/ENHANCEMENTS.md` with:

### Key Insights Added

1. **Repository Architecture Agnostic**
   - Clarified that Linear Buddy works with ANY repository structure
   - Monorepo features are ADDITIVE, not core
   - Don't over-position as "monorepo tool"

2. **Critical New Feature: Cross-Repository Workflow Support (P0)**
   - **Problem:** Developers work across multiple repos (microservices, frontend/backend, etc.)
   - **Solution:** 
     - Detect ticket repository from Linear metadata
     - "Open in New Workspace" button for tickets in other repos
     - Automatic branch checkout when switching repos
     - Repository registry for mapping tickets to local paths
   - **Use Cases:**
     - Microservices architectures (multiple repos)
     - Full-stack developers (frontend + backend)
     - Multi-project teams

### Priority Breakdown

**P0 - Critical (5 features)**
1. Cross-Repository Workflow Support
2. Sharpen Positioning & Marketing  
3. Repository Context Awareness
4. Distribution & Discovery
5. First-Time User Experience

**P1 - Team Features (4 features)**
6. Team Ticket Visibility
7. Shared Branch Naming Conventions
8. Team Standup Aggregation
9. Shared TODO Templates

**P2 - Secondary (8 features)**
10. Personal Analytics Dashboard
11. Advanced Team Analytics (Pro)
12. Slack Integration
13. GitHub PR Auto-Comments
14. Custom AI Prompts
15. Ticket Time Tracking
16. Offline Mode Improvements
17. Multi-Linear-Workspace Support (Pro)

**P3 - Future (5 features)**
18. Custom Themes (Pro)
19. Keyboard-First Navigation
20. Mobile Companion App
21. SSO Integration (Pro)
22. Admin Dashboard (Pro)

## 🎯 Positioning Strategy

### ❌ Don't Say:
- "Monorepo tool with Linear integration"
- "Built for monorepos"
- "Designed for monorepo workflows"

### ✅ Do Say:
- "Linear workflow automation for VS Code"
- "Works everywhere (including monorepos)"
- "Repository-agnostic Linear integration"
- "Manage Linear tickets across multiple repositories"

## 💡 Key Cross-Repository Feature

### The Workflow
```
User clicks ticket ENG-123 in sidebar
  ↓
Linear Buddy detects: ticket is in "backend-api" repo
  ↓
Show prompt: "This ticket is in backend-api"
[Open in New Workspace] [Stay Here]
  ↓
User clicks "Open in New Workspace"
  ↓
- Check if ~/projects/backend-api exists locally
- Open new VS Code window with backend-api workspace
- Checkout associated branch (feature/eng-123-add-auth)
- Show ticket details in new workspace's sidebar
```

### Configuration
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

### Detection Methods
1. **Linear custom field**: `Repository: backend-api`
2. **Labels**: `repo:backend-api`
3. **Ticket description metadata**: Parse from description
4. **Branch name patterns**: Infer from naming conventions

## 📊 Success Metrics Tracked

### Acquisition
- Weekly installs by repo type (single/mono/multi)
- Marketplace search ranking
- Referral sources

### Activation
- % users who complete setup
- % users who convert first TODO within 24h
- Feature discovery rate

### Engagement
- Cross-workspace switches per day
- TODOs converted per user per week
- Daily active users (DAU)

### Repository Diversity
- % single-repo users
- % monorepo users
- % multi-repo users

## 🗓️ Next Quarter Goals (Q1 2025)

### Goal 1: Increase Discovery
- Ship to VS Code Marketplace
- Create demo videos (TODO workflow + cross-repo workflow)
- Write 3 blog posts
- **Target:** 500+ installs

### Goal 2: Improve Activation
- Ship first-time user experience improvements
- Add onboarding tips
- **Target:** 50% of users convert first TODO

### Goal 3: Add Team Value
- Ship team ticket visibility
- Ship shared branch conventions
- **Target:** 10% increase in daily usage

### Goal 4: Enable Cross-Repository Workflows
- Ship cross-repository support
- **Target:** 20% of users working across multiple repos

## 📝 Technical Debt to Address

- [ ] Add comprehensive error handling for API failures
- [ ] Implement retry logic for network requests
- [ ] Add telemetry for feature usage (privacy-respecting)
- [ ] Improve test coverage (currently manual testing only)
- [ ] Refactor webview communication protocol (typed messages)

## 🔗 Related Documents

- **Main Enhancements:** `docs/planning/ENHANCEMENTS.md`
- **Sprint Plan:** `docs/planning/SPRINT_PLAN_MULTI_PLATFORM.md`
- **Ideas:** `docs/planning/IDEAS.md`
- **Agents Guide:** `AGENTS.md`

---

**Next Steps:**
1. Prioritize cross-repository workflow support (P0)
2. Update marketing to de-emphasize monorepo positioning
3. Begin implementation of repository detection
4. Design UI for cross-workspace switching

**Review:** Weekly updates on in-progress items, monthly priority reviews

