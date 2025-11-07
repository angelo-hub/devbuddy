# Multi-Platform Ticket Manager: Sprint Plan & Roadmap

**Based on:** Strategic conversation about expanding Linear Buddy to support multiple ticket management platforms

**Goal:** Transform Linear Buddy into a universal ticket manager for VS Code, supporting Linear, Jira, GitHub Issues, and more.

---

## Executive Summary

### Current State
- ✅ **Linear integration** - Full featured, production ready
- ✅ **Unique features** - Permalinks, TODO converter with "Add More TODOs" workflow
- ✅ **AI capabilities** - Standup generation, PR summaries
- ✅ **Strong foundation** - Clean architecture, TypeScript, React webviews

### Strategic Goal
Expand to **multiple ticket platforms** while maintaining quality and competitive advantage.

### Why This Matters
- **Market size**: Linear (~50k-100k users) → Jira (~10M+ users) = **100x expansion**
- **Revenue potential**: $5-20k ARR (Linear only) → $50-200k ARR (Multi-platform)
- **Competitive moat**: No other tool does AI-powered TODO conversion with permalinks across platforms

---

## Phase 1: Linear Perfection (Months 1-3)

**Status:** ✅ COMPLETE

### Objectives
- [x] Prove product-market fit with Linear
- [x] Perfect the unique features (TODO converter, permalinks)
- [x] Build user base and gather feedback
- [x] Establish revenue model

### Deliverables
- [x] TODO → Ticket with GitHub/GitLab/Bitbucket permalinks
- [x] "Add More TODOs" workflow (guided navigation & paste)
- [x] "Link Existing TODOs" (bulk linking)
- [x] Comprehensive walkthrough with media placeholders
- [x] Documentation for all features

### Validation Metrics
- Target: 50-200 users
- Target: $5-15k ARR
- Target: NPS > 40

### Key Learnings
- ✅ TODO converter is **killer feature** (10x faster than manual)
- ✅ Permalink feature is **unique differentiator** (zero context loss)
- ✅ "Add More TODOs" matches **real developer workflow**
- ✅ Users want multi-platform support

---

## Phase 2: Architecture Refactor (Month 4)

**Status:** 🔄 NEXT

### Objectives
Create abstraction layer to support multiple ticket providers without code duplication.

### Technical Design

#### 2.1 Create Provider Interface
```typescript
// src/utils/ticketProvider.ts
interface TicketProvider {
  // Authentication
  configure(): Promise<boolean>;
  isConfigured(): boolean;
  
  // Core operations
  fetchTickets(filter?: TicketFilter): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | null>;
  createTicket(data: CreateTicketInput): Promise<Ticket | null>;
  updateTicket(id: string, updates: Partial<Ticket>): Promise<boolean>;
  
  // Status management
  getWorkflowStates(): Promise<WorkflowState[]>;
  updateStatus(ticketId: string, stateId: string): Promise<boolean>;
  
  // Advanced features
  addComment(ticketId: string, body: string): Promise<boolean>;
  getComments(ticketId: string): Promise<Comment[]>;
  
  // Provider metadata
  getProviderInfo(): ProviderInfo;
}

interface ProviderInfo {
  id: 'linear' | 'jira' | 'github' | 'azure-devops';
  name: string;
  icon: string;
  supportsFeatures: {
    comments: boolean;
    attachments: boolean;
    subIssues: boolean;
    customFields: boolean;
  };
}
```

#### 2.2 Implement Provider Factory
```typescript
// src/utils/providerFactory.ts
class ProviderFactory {
  static create(type: 'linear' | 'jira'): TicketProvider {
    switch (type) {
      case 'linear':
        return new LinearProvider();
      case 'jira':
        return new JiraProvider();
      default:
        throw new Error(`Unknown provider: ${type}`);
    }
  }
}
```

#### 2.3 Normalize Ticket Model
```typescript
// src/types/ticket.ts
interface Ticket {
  id: string;
  identifier: string; // ENG-123, PROJ-456, #789
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee?: User;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Provider-specific data
  providerData?: Record<string, any>;
  
  // Metadata
  provider: 'linear' | 'jira' | 'github';
}
```

### Deliverables
- [ ] `TicketProvider` interface
- [ ] `LinearProvider` implementation (refactor existing `LinearClient`)
- [ ] `ProviderFactory` for provider instantiation
- [ ] Normalized `Ticket` type
- [ ] Unit tests for provider abstraction

### Success Criteria
- All existing Linear features work through new abstraction
- Zero regression in functionality
- Clean separation of concerns
- Easy to add new providers

**Estimated Effort:** 1-2 weeks

---

## Phase 3: Jira Integration (Months 5-6)

**Status:** 📋 PLANNED

### Objectives
Add Jira support as second platform, proving multi-platform architecture works.

### 3.1 Jira Provider Implementation

#### Week 1-2: Basic Integration
```typescript
// src/utils/providers/jiraProvider.ts
class JiraProvider implements TicketProvider {
  private baseUrl: string;
  private apiToken: string;
  
  async fetchTickets(filter?: TicketFilter): Promise<Ticket[]> {
    // JQL query
    const jql = this.buildJQL(filter);
    const response = await this.request('/rest/api/3/search', { jql });
    return this.normalizeJiraIssues(response.issues);
  }
  
  async createTicket(data: CreateTicketInput): Promise<Ticket | null> {
    // Jira REST API
    const response = await this.request('/rest/api/3/issue', {
      method: 'POST',
      body: this.toJiraFormat(data)
    });
    return this.normalizeJiraIssue(response);
  }
  
  // ... implement all TicketProvider methods
}
```

**Features:**
- [ ] Jira Cloud authentication (OAuth 2.0 + API token)
- [ ] Fetch assigned issues (JQL: `assignee = currentUser()`)
- [ ] View issue details
- [ ] Update issue status
- [ ] Add comments
- [ ] Basic custom fields support

#### Week 3-4: Advanced Features
- [ ] Jira Server/Data Center support
- [ ] Sprint integration
- [ ] Epic/parent issue support
- [ ] Advanced JQL filtering
- [ ] Attachment handling

### 3.2 UI Enhancements

#### Provider Selector
```typescript
// User can choose active provider
[Linear] [Jira] [GitHub]
```

#### Settings
```json
{
  "linearBuddy.activeProvider": "jira",
  "linearBuddy.jira.instanceUrl": "https://yourcompany.atlassian.net",
  "linearBuddy.jira.email": "user@company.com",
  "linearBuddy.jira.apiToken": "..."
}
```

### 3.3 Feature Parity

| Feature | Linear | Jira | Notes |
|---------|--------|------|-------|
| View tickets | ✅ | 🔄 | Basic JQL |
| Create tickets | ✅ | 🔄 | Include permalink |
| Update status | ✅ | 🔄 | Workflow transitions |
| TODO converter | ✅ | 🔄 | **Keep unique!** |
| Permalinks | ✅ | 🔄 | GitHub/GitLab links |
| "Add More TODOs" | ✅ | 🔄 | Provider-agnostic |
| AI Standups | ✅ | 🔄 | Works with any provider |
| Branch management | ✅ | 🔄 | Naming conventions |

### Deliverables
- [ ] `JiraProvider` implementation
- [ ] Jira authentication flow
- [ ] Provider switcher UI
- [ ] Jira-specific documentation
- [ ] Migration guide (Linear → Jira)

### Success Criteria
- All core features work with Jira
- TODO converter creates Jira tickets with permalinks
- Users can switch between Linear and Jira seamlessly
- Performance: < 2s to fetch 50 issues

**Estimated Effort:** 4-6 weeks

---

## Phase 4: Rebranding & Marketing (Month 7)

**Status:** 📋 PLANNED

### Objectives
Rebrand as multi-platform tool and launch to Jira community.

### 4.1 Rebranding Options

#### Option A: Keep "Linear Buddy" Name
- "Linear Buddy - Now with Jira support"
- Pro: Keep brand equity
- Con: Name implies Linear-only

#### Option B: Rename to "Ticket Buddy"
- "Ticket Buddy - Linear, Jira, and more"
- Pro: Platform-agnostic
- Con: Generic, less memorable

#### Option C: New Brand
- "DevFlow", "CodeLink", "TicketFlow"
- Pro: Fresh start, broader positioning
- Con: Lose existing awareness

**Recommendation:** Start with Option A, evaluate Option B if Jira users > Linear users

### 4.2 Marketing Strategy

#### 4.2.1 Product Hunt Re-launch
**Title:** "Linear Buddy 2.0 - Now supports Jira"

**Tagline:** "Turn TODOs into fully-linked tickets in one click. Works with Linear, Jira, and more."

**Description:**
```markdown
Stop losing context between code and tickets.

Linear Buddy brings your ticket management into VS Code with AI-powered 
features that save hours every week:

🔗 **Automatic Permalinks** - Every ticket links to exact line of code
📝 **TODO Converter** - Right-click TODO → Instant ticket with context
🤖 **AI Standups** - Generate standup updates from your commits
🌿 **Branch Management** - Create branches directly from tickets
⚡ **Multi-platform** - Works with Linear, Jira, GitHub (more coming)

**NEW in 2.0:**
• Full Jira support (Cloud, Server, Data Center)
• "Add More TODOs" workflow (navigate & paste)
• "Link Existing TODOs" (bulk link scattered TODOs)
• Enhanced permalinks (GitHub, GitLab, Bitbucket)

Built for developers who hate context switching.
```

#### 4.2.2 Launch Channels
- [ ] Product Hunt (target #1-3 product of the day)
- [ ] Reddit: r/vscode, r/jira, r/programming, r/devtools
- [ ] Hacker News (Show HN)
- [ ] Dev.to article
- [ ] LinkedIn post
- [ ] Twitter thread
- [ ] Atlassian Marketplace
- [ ] VS Code Marketplace (featured request)

#### 4.2.3 Demo Videos
Record high-quality demos:
- [ ] 30-second hero demo (TODO → ticket with Jira)
- [ ] 2-minute feature overview
- [ ] Side-by-side: Linear vs Jira
- [ ] "Add More TODOs" workflow showcase

### 4.3 Pricing Adjustment

**Current:**
- Free: Basic features
- Pro: $49/year (AI features)

**With Jira:**
- Free: Basic Linear OR Jira (single platform)
- Pro: $49/year (AI + multi-platform + advanced features)
- Team: $199/year (5 seats, team analytics)

**Rationale:** Jira users have bigger budgets, can sustain higher pricing.

### Deliverables
- [ ] Rebrand decision
- [ ] Updated marketing materials
- [ ] Product Hunt launch
- [ ] Community outreach
- [ ] Demo videos
- [ ] Launch announcement blog post

**Estimated Effort:** 2-3 weeks

---

## Phase 5: GitHub Issues Integration (Month 8-9)

**Status:** 📋 PLANNED

### Objectives
Add GitHub Issues as third platform, reinforcing multi-platform strategy.

### Why GitHub Issues?
- **Massive user base** (100M+ developers use GitHub)
- **Already integrated** (GitHub authentication built into VS Code)
- **Complementary** (Linear for features, GitHub for bugs/tasks)
- **Easy auth** (GitHub token, no complex OAuth)

### Implementation

#### 5.1 GitHub Provider
```typescript
class GitHubProvider implements TicketProvider {
  async fetchTickets(): Promise<Ticket[]> {
    // Use GitHub REST API
    const response = await octokit.issues.listForAuthenticatedUser({
      filter: 'assigned',
      state: 'open',
      per_page: 50
    });
    return this.normalizeGitHubIssues(response.data);
  }
  
  async createTicket(data: CreateTicketInput): Promise<Ticket | null> {
    // Use octokit to create issue
    const response = await octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: data.title,
      body: data.description,
      labels: data.labels
    });
    return this.normalizeGitHubIssue(response.data);
  }
}
```

#### 5.2 Features
- [ ] List issues across repos
- [ ] Create issues with permalinks
- [ ] Update status (close/reopen)
- [ ] Add comments
- [ ] Labels support
- [ ] Milestone support
- [ ] Project boards integration

#### 5.3 GitHub-Specific Advantages
- **Native integration** - VS Code already has GitHub auth
- **Markdown support** - GitHub and Linear both use markdown
- **Already has permalinks** - GitHub URLs are already permalinks
- **Cross-repo support** - View issues across multiple repos

### Deliverables
- [ ] `GitHubProvider` implementation
- [ ] Repository selector UI
- [ ] Cross-repo issue view
- [ ] GitHub-specific features

**Estimated Effort:** 3-4 weeks

---

## Phase 6: Advanced Features (Month 10-12)

**Status:** 📋 FUTURE

### 6.1 Multi-Provider Workflows

#### Feature: Cross-Platform Ticket Linking
```typescript
// Link a Jira ticket to a GitHub issue
// ENG-456 (Jira) ↔ myrepo#123 (GitHub)
```

Use case: Jira for planning, GitHub for implementation tracking

#### Feature: Sync Status Across Providers
```typescript
// When GitHub issue closes, update Jira ticket
Settings: "linearBuddy.syncStatus": true
```

### 6.2 Team Features

#### Analytics Dashboard
- TODOs converted by team member
- Average time from TODO → ticket → completion
- Most active repos/projects
- Technical debt tracking

#### Shared Configurations
- Team-wide TODO conversion settings
- Shared templates
- Naming conventions

### 6.3 AI Enhancements

#### Smart TODO Suggestions
```typescript
// AI suggests priority, assignee, labels based on:
- Code context
- File history
- Related tickets
- Team patterns
```

#### Duplicate Detection
```typescript
// "This looks similar to ENG-456. Link instead?"
```

#### Auto-tagging
```typescript
// TODO in auth code → Automatically tag as "security"
// TODO in test file → Automatically tag as "testing"
```

---

## Phase 7: Enterprise Features (Month 12+)

**Status:** 📋 FUTURE

### 7.1 Azure DevOps Integration
- Enterprise market (Microsoft ecosystem)
- Work items, boards, sprints
- Target: Fortune 500 companies

### 7.2 Additional Platforms
- [ ] Asana (project management)
- [ ] Monday.com (workflow management)
- [ ] ClickUp (all-in-one)
- [ ] Shortcut (Linear competitor)

### 7.3 Enterprise Features
- SSO/SAML authentication
- Admin console
- Usage analytics
- Compliance (SOC 2, GDPR)
- On-premise deployment

### 7.4 Pricing
- **Enterprise:** $999-2,999/year (unlimited seats)
- **Custom:** Contact sales for large orgs

---

## Revenue Projections

### Conservative Scenario (Bootstrap)

| Year | Users | Paying | ARR | Notes |
|------|-------|--------|-----|-------|
| **Year 1** (Linear only) | 500 | 50 | $5k | Validation |
| **Year 2** (+ Jira) | 5,000 | 300 | $30k | Launch boost |
| **Year 3** (+ GitHub) | 15,000 | 1,000 | $80k | Established |
| **Year 4** | 30,000 | 2,500 | $150k | Steady growth |
| **Year 5** | 60,000 | 5,000 | $300k | Category leader |

### Moderate Scenario (Active Marketing)

| Year | Individual | Team | Enterprise | Total ARR | Notes |
|------|-----------|------|------------|-----------|-------|
| **Year 1** | 100 ($49) | 5 ($199) | 0 | $6k | Linear launch |
| **Year 2** | 500 ($49) | 30 ($399) | 2 ($999) | $38k | Jira launch |
| **Year 3** | 2,000 ($49) | 100 ($399) | 10 ($999) | $148k | GitHub added |
| **Year 4** | 5,000 ($49) | 300 ($399) | 30 ($1,999) | $425k | Enterprise focus |
| **Year 5** | 10,000 ($49) | 800 ($399) | 100 ($2,999) | $1.1M | Exit opportunity |

### Aggressive Scenario (VC-Backed)

Would require:
- Raise $1-3M seed round
- Hire 5-10 people (dev, marketing, sales)
- Paid acquisition channels
- Target: $5M+ ARR by year 5

**Recommendation:** Start with Conservative → Moderate, evaluate VC after Year 2 if hitting targets

---

## Technical Architecture Evolution

### Current (Phase 1)
```
LinearBuddy
├── LinearClient (direct implementation)
├── Commands (tightly coupled to Linear)
└── Views (Linear-specific)
```

### Target (Phase 3+)
```
TicketBuddy
├── Providers (abstraction)
│   ├── TicketProvider (interface)
│   ├── LinearProvider
│   ├── JiraProvider
│   └── GitHubProvider
├── Core (provider-agnostic)
│   ├── Commands
│   ├── Views
│   └── Services
└── Features (work with any provider)
    ├── TODO Converter
    ├── Permalink Generator
    ├── AI Standup
    └── Branch Manager
```

---

## Risk Mitigation

### Risk 1: Jira Complexity
**Risk:** Jira API is complex, custom fields vary by org  
**Mitigation:**
- Start with Jira Cloud (simpler than Server)
- Focus on core fields first
- Custom fields as "advanced" feature
- Comprehensive error handling

### Risk 2: Maintenance Burden
**Risk:** Multiple APIs to maintain, breaking changes  
**Mitigation:**
- Solid abstraction layer
- Automated tests for each provider
- Version pinning for dependencies
- Community contributions (open source parts)

### Risk 3: Feature Parity
**Risk:** Trying to support every feature of every platform  
**Mitigation:**
- Focus on core 80% features
- Provider-specific features marked as "beta"
- Clear documentation of limitations
- Let users choose: Linear for features, Jira for enterprise

### Risk 4: Market Competition
**Risk:** Official integrations improve, competitors emerge  
**Mitigation:**
- **Keep unique features ahead** (TODO converter with permalinks)
- **AI capabilities** (standups, smart suggestions)
- **Multi-platform** (official integrations are single-platform)
- **Developer UX** (optimized for coding workflow)

---

## Success Metrics

### Phase 2 (Architecture)
- ✅ Zero regression in Linear functionality
- ✅ All tests passing
- ✅ Clean abstractions (code review approval)

### Phase 3 (Jira Launch)
- 🎯 500 Jira users in first month
- 🎯 50 paying Jira users in first 3 months
- 🎯 NPS > 40 from Jira users
- 🎯 < 5% bug rate

### Phase 4 (Marketing)
- 🎯 Product Hunt: Top 5 product of the day
- 🎯 1,000+ upvotes on Product Hunt
- 🎯 50+ reviews on VS Code Marketplace
- 🎯 Featured on VS Code Marketplace

### Phase 5 (GitHub)
- 🎯 1,000 GitHub users in first month
- 🎯 Mentioned in GitHub newsletter/blog
- 🎯 Cross-provider usage: 20% use 2+ platforms

### Long-term (Year 3)
- 🎯 $100k+ ARR
- 🎯 10,000+ active users
- 🎯 Top 10 "Developer Tools" on VS Code Marketplace
- 🎯 Category leader: "AI-powered ticket management"

---

## Decision Points

### Month 6: Jira Launch Results
**If successful (>500 users, >$20k ARR):**
→ Continue to GitHub Issues (Phase 5)

**If moderate (200-500 users, $10-20k ARR):**
→ Double down on marketing, improve Jira before GitHub

**If unsuccessful (<200 users, <$10k ARR):**
→ Pivot or return to Linear focus

### Month 12: Enterprise Opportunity?
**If seeing enterprise demand (10+ companies >$1k/year):**
→ Build enterprise features (Azure DevOps, SSO, admin panel)

**If mostly individual/small team:**
→ Focus on indie developer market, keep it simple

### Year 2: VC or Bootstrap?
**If growing >100% YoY and hitting $50k+ ARR:**
→ Consider raising seed round to accelerate

**If growing steadily at 50-100% YoY:**
→ Stay bootstrapped, optimize for profitability

---

## Next Actions (Week 1)

### Immediate (This Week)
- [x] Document sprint plan ← **YOU ARE HERE**
- [ ] Test Phase 1 features (TODO converter, permalinks)
- [ ] Record demo videos for walkthrough
- [ ] Soft launch to Linear community (get feedback)

### This Month
- [ ] Gather user feedback (survey, interviews)
- [ ] Plan Phase 2 architecture refactor
- [ ] Research Jira API (try basic integration)
- [ ] Set up analytics (track usage, conversions)

### This Quarter
- [ ] Complete Phase 2 (architecture refactor)
- [ ] Begin Phase 3 (Jira implementation)
- [ ] Launch marketing campaign
- [ ] Reach $10k ARR

---

## Appendix: Key Insights from Discussion

### Market Validation
- ✅ **No one does this well** - TODO converter with permalinks is unique
- ✅ **Real pain point** - Context switching costs 5-15 min per ticket
- ✅ **Timing is perfect** - AI tools are hot, developers expect AI features
- ✅ **Jira market is massive** - 10M+ users vs. Linear's 100k

### Product Insights
- ✅ **TODO converter is killer** - Matches real developer workflow
- ✅ **"Add More TODOs" workflow** - Solves "I haven't written them yet" problem
- ✅ **Permalinks are gold** - Zero context loss, huge time saver
- ✅ **Multi-platform is differentiator** - Official tools are single-platform

### Pricing Insights
- ✅ **$20k/year is achievable** (60-80% probability)
- ✅ **$50k/year is realistic** with Jira (30-40% probability)
- ✅ **$100k/year is possible** with execution (20-30% probability)
- ✅ **$500k/year is unlikely** as solo dev (5-10% probability)

### Strategic Decisions
- ✅ **Start with Linear** - Prove concept, build audience
- ✅ **Add Jira at Month 6** - After validation, before burnout
- ✅ **Keep unique features** - Don't just replicate official integrations
- ✅ **Focus on developers** - Not PMs, not enterprise (at first)

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Owner:** Solo Developer  
**Status:** Phase 1 Complete, Phase 2 Next


