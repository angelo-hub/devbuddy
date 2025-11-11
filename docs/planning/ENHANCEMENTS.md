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

## 💎 Pro Features Strategy

DevBuddy follows a **freemium model** where core workflow features remain free, while advanced automation and multi-workspace capabilities are premium.

### Free Tier (Always Free)
- ✅ Core ticket management (Linear/Jira integration)
- ✅ TODO to ticket converter with code permalinks
- ✅ Branch management and associations
- ✅ Sidebar ticket viewing and navigation
- ✅ Manual ticket status updates
- ✅ Single workspace/profile
- ✅ Basic git integration (branch associations)
- ✅ Cross-repository support (utility feature)
- ✅ Integrations (Slack, GitHub) - drives adoption

### Pro Tier (Premium) - $3-5/month
**AI-Powered Features (Core Value):**
- 💎 **PR Summary Generation** - AI-generated PR descriptions from git changes
- 💎 **Standup Generation** - AI-powered standup updates from commits and tickets
- 💎 **Conversational Chat Participant** (@devbuddy) - Natural language ticket queries and actions
- 💎 **Custom AI Prompts** (#14) - Advanced prompt engineering and customization
- 💎 **Enhanced AI Models** - Priority model selection, extended context windows

**Multi-Workspace & Organization:**
- 💎 **Workspace-Based Environment Profiles** (#5) - Multiple isolated workspaces with separate credentials
- 💎 **Multi-Linear-Workspace Support** (#17) - Switch between multiple Linear organizations

**Team Collaboration Features (Engagement Multipliers):**
- 💎 **Team Ticket Visibility** (#6) - View and track team members' tickets
- 💎 **Team Standup Aggregation** (#8) - Generate team-wide standup summaries
- 💎 **Shared Branch Naming Conventions** (#7) - Team-wide branch naming standards
- 💎 **Shared TODO Templates** (#9) - Team templates for consistent ticket creation

**Productivity & Analytics (Value Proof):**
- 💎 **Personal Analytics Dashboard** (#10) - Track productivity, time saved, usage stats
- 💎 **Ticket Time Tracking** (#15) - Automatic time tracking per ticket with reports
- 💎 **Advanced Team Analytics** (#11) - Team velocity, bottleneck detection, cycle time

**Quality of Life:**
- 💎 **Offline Mode** (#16) - Work offline with sync queue
- 💎 **Custom Themes** (#18) - Personalized UI themes and branding
- 💎 **Advanced Keyboard Shortcuts** (#19) - Vim-style navigation, quick ticket switching
- 💎 **Priority Support** - Faster response times and direct support channel

**Optional: Usage-Based Free Tier**
Consider offering limited free usage to let users experience AI features:
- 🎁 5 PR summaries per month (free trial)
- 🎁 10 standup generations per month (free trial)
- 🎁 Basic chat queries (view-only, no actions)

**Philosophy:** Free tier provides solid ticket management workflow. Pro tier unlocks AI-powered automation and advanced multi-workspace capabilities that save hours every week.

### Pro Tier Value Analysis

At **$10-15/month**, Pro tier becomes a "no-brainer" when packed with features:

**Time Savings Breakdown (per week):**
- AI Standup Generation: ~30 mins saved (10 standups × 3 mins each)
- PR Summary Generation: ~45 mins saved (5 PRs × 9 mins each)  
- Chat Participant Queries: ~30 mins saved (quick ticket lookups)
- Team Standup Aggregation: ~20 mins saved (team leads)
- Time Tracking Reports: ~15 mins saved (manual time tracking)
- Slack Auto-posting: ~10 mins saved (copy/paste elimination)
- **Total: 2.5-3 hours/week = 10-12 hours/month**

**Value Proposition:**
- **$5/month** ÷ 10 hours saved = **$0.50/hour** 
- If your time is worth $50-150/hour → **100x-300x ROI**
- Annual savings: **120+ hours of repetitive work eliminated**
- **Critical**: Must be cheaper than primary platform (Linear/Jira) since we're supplementary

**Why Include So Many Features in Pro:**
1. **Competitive Positioning**: Can't compete on price alone at $3-5/month
2. **Maximize Value**: Pack in features to justify even a small subscription
3. **Reduce Churn**: More features = more reasons to keep subscribing
4. **Word of Mouth**: "DevBuddy Pro is ridiculously cheap for what you get"
5. **Volume Play**: Low price × high conversion rate = sustainable revenue

**Alternative: Usage-Based Pricing Model**
Instead of flat subscription, consider pay-per-use:
- $0.10 per AI standup generation
- $0.15 per PR summary generation
- $0.05 per chat query
- Monthly cap: $5 (unlimited after cap hit)
- **Advantage**: Users only pay for what they use
- **Advantage**: Lower barrier to entry than subscription
- **Disadvantage**: Unpredictable revenue

**Features That MUST Stay Free (Critical for Viral Growth):**
- ✅ TODO to ticket converter (THE killer feature)
- ✅ Basic ticket viewing and management
- ✅ Branch associations
- ✅ Single workspace support

**Features That Should Be Pro (Professional Use Cases):**
- 💎 Anything AI-powered (costs + value)
- 💎 Team collaboration features (target: teams, not solo hobbyists)
- 💎 Multi-workspace (target: freelancers, consultants)
- 💎 Integrations (Slack, GitHub) - require maintenance
- 💎 Analytics & reporting - professional insights
- 💎 Offline mode - complex feature, pro UX

### Competitive Analysis: Supplementary Tool Positioning

**The Challenge:**
Users already pay for their primary platform. DevBuddy must be positioned as an **enhancement**, not a replacement.

**Primary Platforms (Users Already Pay For):**
- **Linear (Standard)**: $8/user/month
- **Jira (Standard)**: $7.75/user/month
- **GitHub Copilot**: $10/month (AI assistance)

**Supplementary Tools (What We Compete With):**
- **VS Code extensions**: Usually free or $1-3/month
- **Productivity add-ons**: $3-5/month range
- **Browser extensions**: Often free with optional Pro

**DevBuddy Pro Positioning: $3-5/month**
- "Makes your Linear/Jira faster without leaving VS Code"
- "AI-powered automation for your existing workflow"
- **Must be significantly cheaper than the platform it enhances**
- Alternative: Free for most users, pay-per-AI-use for heavy users

**Better Value Comparison:**
- Linear: $8/month (primary platform)
- DevBuddy: $5/month (makes Linear 10x better in VS Code)
- **Combined**: $13/month for dramatically improved workflow
- **User thinking**: "Already paying $8 for Linear, $5 more for AI automation is worth it"

**Reality Check:**
- ❌ Can't charge $15/month when Linear is $8/month
- ❌ Can't be same price as primary platform
- ✅ Should be 30-60% of primary platform cost
- ✅ Should feel like "enhances my investment" not "another subscription"

**Recommended Tiers:**
1. **Free Forever**: TODO converter, ticket viewing, basic workflow
2. **Pro ($3-5/month)**: All AI features, unlimited usage
3. **Optional: Usage-based**: Pay $0.10-0.15 per AI generation, $5 cap

### Should We Reconsider the Pro Feature List?

**At $3-5/month, maybe we should be MORE selective:**

**Core Pro Features (Justify $3-5/month):**
- ✅ AI Standup Generation (clear value, saves time)
- ✅ AI PR Summary Generation (clear value, saves time)
- ✅ Chat Participant (AI-powered, ongoing cost)
- ✅ Workspace Profiles (advanced users, freelancers)
- ⚠️ **Everything else**: Consider keeping FREE to maximize adoption

**Features That Could Stay Free:**
- ~~Team features (#6-9): Encourages team-wide adoption → more paid users~~
- ~~Analytics (#10): Proves value → drives upgrades~~
- ~~Time tracking (#15): Proves value → drives upgrades~~
- Keyboard shortcuts (#19): Low-cost feature, high UX value
- Cross-repo support (#1): Utility feature, not AI
- Integrations (Slack, GitHub): Drives adoption, low maintenance cost

**Why Analytics & Team Features Should Be Pro:**
1. **Analytics = Value Proof**: Users see "You saved 12 hours this month" → realize tool's worth → less likely to cancel
2. **Team Visibility = Engagement**: Seeing team's work creates desire for team features (aggregation, shared conventions)
3. **Stickiness Factor**: Once users check analytics daily, they're hooked
4. **Upgrade Driver**: Free users think "I wish I could see my stats" → upgrade trigger
5. **Network Effect**: Team lead gets Pro → sees team activity → wants team to upgrade too

**Rationale for What Stays Free:**
1. **Low price = need high volume**: $3-5/month needs lots of users to be sustainable
2. **TODO converter stays free**: The viral feature that drives installs
3. **Basic integrations free**: Slack/GitHub posting drives word-of-mouth
4. **Cross-repo support free**: Utility feature that makes tool more useful

**Simplified Pro Strategy:**
```
FREE: Core ticket management, TODO converter, integrations
PRO ($3-5/month): 
  - All AI features (standup, PR, chat)
  - Workspace profiles
  - Team features (visibility, aggregation, shared conventions)
  - Analytics & time tracking (value proof)
  - Quality of life (offline, themes, shortcuts)

Result: Clear value proposition
- "Want AI automation? → Upgrade"
- "Want to see your productivity stats? → Upgrade"  
- "Want team features? → Upgrade"
- Core workflow stays free → massive adoption
```

**Alternative: Freemium with AI Credits**
```
FREE: 5 AI generations/month (trial), all non-AI features unlimited
PRO: Unlimited AI, workspace profiles, priority support

Result: Users try AI for free, convert when they run out
```

### The Psychology of Analytics & Team Features as Pro

**Why This Works:**

**Analytics as Conversion Driver:**
1. Free user: "I wonder how much time I'm saving..."
2. Sees analytics is Pro → "Let me try Pro for a month"
3. After upgrade: "Wow, I saved 12 hours last month!"
4. Renewal time: Sees cumulative stats → "No way I'm canceling"

**Team Features as Stickiness:**
1. Free user works solo, happy with basics
2. Upgrades for AI → Gets team visibility as bonus
3. Sees colleague working on related ticket → Slacks them
4. Checks team stats → Feels more connected
5. Now relies on both AI AND team features → Double lock-in

**Value Ladder:**
```
Day 1: Install DevBuddy → Love TODO converter (free)
Week 1: Daily sidebar usage → Core workflow established (free)
Week 2: "I should try AI standup" → Upgrade to Pro ($5/month)
Week 3: Sees analytics → "I saved 8 hours!" → Justified
Week 4: Sees team working on tickets → Collaboration unlocked
Month 2: Renewal → No hesitation, too valuable
```

**Conversion Trigger Stack:**
- Want AI automation? → Upgrade
- Curious about productivity stats? → Upgrade  
- Need team visibility? → Upgrade
- Working across multiple clients? → Upgrade (workspace profiles)
- Want offline mode? → Upgrade
- **Result**: Multiple reasons to upgrade, not just one

---

## 🔐 Implementation: AI Feature Gating

### Commands to Gate Behind Pro License

**1. PR Summary Generation (`devBuddy.generatePRSummary`)**
```typescript
// Before: Available to all users
// After: Require Pro license

async function generatePRSummary() {
  const licenseManager = LicenseManager.getInstance();
  
  if (!licenseManager.hasProLicense()) {
    const choice = await vscode.window.showInformationMessage(
      "PR Summary Generation is a Pro feature. Upgrade to automatically generate PR descriptions from your commits.",
      "Upgrade to Pro", "Learn More", "Cancel"
    );
    
    if (choice === "Upgrade to Pro") {
      vscode.commands.executeCommand('devBuddy.upgradeToPro');
    }
    return;
  }
  
  // Existing PR summary logic
}
```

**2. Standup Generation (`devBuddy.generateStandup`, `devBuddy.openStandupBuilder`)**
```typescript
async function openStandupBuilder() {
  const licenseManager = LicenseManager.getInstance();
  
  if (!licenseManager.hasProLicense()) {
    // Optional: Check usage quota for free tier
    const quota = await licenseManager.getFreeUsageQuota('standup');
    
    if (quota.remaining > 0) {
      vscode.window.showInformationMessage(
        `Standup generation (${quota.remaining}/${quota.limit} free uses remaining this month). Upgrade to Pro for unlimited usage.`,
        "Continue", "Upgrade to Pro"
      );
      // Allow usage but decrement quota
    } else {
      vscode.window.showInformationMessage(
        "You've used all free standup generations this month. Upgrade to Pro for unlimited AI-powered standups.",
        "Upgrade to Pro", "Learn More"
      );
      return;
    }
  }
  
  // Existing standup builder logic
}
```

**3. Chat Participant (`@devbuddy`)**
```typescript
// In chat/devBuddyParticipant.ts
async function handleChatRequest(request, context, stream, token) {
  const licenseManager = LicenseManager.getInstance();
  
  if (!licenseManager.hasProLicense()) {
    stream.markdown("### 💎 Pro Feature Required\n\n");
    stream.markdown("The @devbuddy chat participant is available in **DevBuddy Pro**.\n\n");
    stream.markdown("**Pro features include:**\n");
    stream.markdown("- Natural language ticket queries\n");
    stream.markdown("- AI-powered PR summaries\n");
    stream.markdown("- Automated standup generation\n");
    stream.markdown("- Multi-workspace profiles\n\n");
    stream.button({
      command: 'devBuddy.upgradeToPro',
      title: 'Upgrade to Pro'
    });
    return;
  }
  
  // Existing chat participant logic
}
```

**4. Update UI Elements**
- Add 💎 icon next to Pro features in command palette
- Show "Pro" badge in sidebar for gated features
- Update walkthrough to mention Pro features
- Add pricing/upgrade button to sidebar header

**5. Free Tier Usage Quotas (Optional)**
```typescript
interface UsageQuota {
  standup: { limit: 10, remaining: 10 },  // 10 per month
  prSummary: { limit: 5, remaining: 5 },   // 5 per month
  chat: { limit: 0, remaining: 0 }         // View-only, or 0 for fully gated
}
```

### User Experience Flow

**New User (Free Tier):**
1. Install DevBuddy
2. Connect Linear/Jira (free)
3. Use TODO converter (free, unlimited)
4. View and manage tickets (free, unlimited)
5. Try to generate standup → Prompted to upgrade or use free quota
6. Experience value → Convert to Pro for unlimited AI

**Pro User:**
1. All features unlocked
2. No usage limits
3. Priority support
4. Early access to new AI features

### Strategic Considerations

**Why This Model Works:**
- ✅ **TODO Converter stays free** - This is the viral "wow" feature that drives installs
- ✅ **Free tier is genuinely useful** - Not a crippled trial, but a solid ticket manager
- ✅ **Clear upgrade path** - Users experience value, then want AI automation
- ✅ **Natural conversion points** - "Generate standup" button → upgrade prompt
- ✅ **Usage quotas reduce friction** - Free users can try AI features before committing

**Pricing Strategy Implications:**
- **Reality Check**: Users already pay Linear ($8/user/month) or Jira ($7.75/user/month)
- **DevBuddy is a HELPER, not a platform** - Must be priced accordingly
- **Target price point**: $3-5/month (supplementary tool pricing)
- **Value proposition**: "Enhances your existing Linear/Jira investment with AI automation"
- **Annual discount**: $30-50/year (save 20-30%)
- **Alternative model**: Usage-based AI credits (pay per AI generation)

**Conversion Funnel:**
1. **Discovery**: User finds DevBuddy via search for "Linear VS Code" or "TODO tracker"
2. **Activation**: Converts first TODO → Sees immediate value (free)
3. **Engagement**: Uses ticket sidebar daily (free)
4. **Upgrade moment**: Tries to generate standup → "💎 Pro feature"
5. **Conversion**: User sees time savings value → Upgrades
6. **Retention**: Relies on AI features daily → Sticky subscription

**Free Tier Value Preservation:**
- Can manage all tickets without paying
- Can convert unlimited TODOs to tickets with permalinks
- Can associate branches with tickets
- Can view ticket details and update status
- **Not crippled** - Just focused on manual workflow vs AI automation

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
**Priority:** P0 | **Effort:** 🟡 Medium | **Status:** 💎 Pro Feature | **Tier:** Premium

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

### 5. Workspace-Based Environment Profiles
**Priority:** P0 | **Effort:** 🟡 Medium | **Status:** 💎 Pro Feature | **Tier:** Premium

**Problem:** Developers work on personal projects, open-source contributions, and work projects in the same VS Code setup. Currently, DevBuddy uses the same Linear/Jira credentials and settings across all workspaces, causing context bleeding.

**User Scenario:**
1. Developer works at Company A (uses Linear workspace "company-a")
2. Developer has personal side projects (uses Linear workspace "personal")
3. Developer contributes to open-source (no Linear/Jira needed)
4. Switching between projects requires manual credential changes or shows wrong tickets

**Solution:**
- [ ] **Workspace-specific profiles** (opt-in, disabled by default)
  - Detect workspace directory and auto-select profile (when enabled)
  - Store credentials per workspace profile (encrypted in VS Code secrets)
  - Separate settings for each profile
  - Profile switcher in sidebar header

- [ ] **Profile configuration**
  - Create profiles: "Work", "Personal", "Open Source", etc.
  - **Option 1**: Map workspace paths to profiles (for organized users)
  - **Option 2**: Remember profile per workspace folder (fallback)
  - **Option 3**: Always prompt on workspace open (manual mode)
  - Default profile for unmapped workspaces

- [ ] **Smart workspace detection with fallback**
  - Try path pattern matching first (if configured)
  - If no match, check workspace folder memory
  - If still no match, prompt user: "Which profile for this workspace?"
  - Remember choice for next time
  - Option to "Always use [Profile] for workspaces in ~/projects/work"

- [ ] **Credential isolation**
  - Separate Linear API tokens per profile
  - Separate Jira credentials per profile
  - Separate provider selection per profile
  - No credential leakage between profiles

- [ ] **Settings inheritance**
  - Profile-specific settings override global settings
  - Share common settings (e.g., writing tone, debug mode)
  - Per-profile: API credentials, organization, team ID, branch naming
  - Global: AI model, theme preferences, UI settings

- [ ] **Walkthrough education**
  - Suggest directory organization best practices
  - Show examples: ~/work/*, ~/personal/*, ~/clients/*
  - Explain benefits but emphasize it's optional
  - Offer quick setup wizard for organized workflows

**Configuration:**
```json
{
  // Pro Feature - Requires DevBuddy Pro license
  "devBuddy.profiles.enabled": false,
  "devBuddy.profiles.autoSwitch": false,  // Auto-switch based on paths
  "devBuddy.profiles.promptOnNewWorkspace": true,  // Ask which profile
  
  "devBuddy.profiles": [
    {
      "name": "Work - Company A",
      "id": "work-company-a",
      // Optional: Only for users with organized directory structure
      "workspacePaths": [
        "~/work/company-a/*",
        "~/projects/work/**"
      ],
      "provider": "linear",
      "linearOrganization": "company-a",
      "linearTeamId": "team_abc123",
      "icon": "briefcase"
    },
    {
      "name": "Personal Projects",
      "id": "personal",
      // Can leave workspacePaths empty - rely on prompts/memory
      "workspacePaths": [],
      "provider": "linear",
      "linearOrganization": "personal-workspace",
      "icon": "home"
    },
    {
      "name": "Open Source",
      "id": "opensource",
      "workspacePaths": [],  // No patterns - user selects manually
      "provider": null,
      "disableTicketing": true,
      "icon": "git-branch"
    }
  ],
  "devBuddy.defaultProfile": "personal",
  "devBuddy.showProfileSwitcher": true,
  
  // Workspace folder → profile memory (auto-populated)
  "devBuddy.workspaceFolderProfiles": {
    "/Users/alice/random-project": "work-company-a",
    "/Users/alice/my-side-project": "personal",
    "/Users/alice/Documents/client-work": "work-company-a"
  }
}
```

**Credential Storage (VS Code Secrets):**
```typescript
// Stored separately per profile
await context.secrets.store("devBuddy.profile.work-company-a.linearApiToken", token);
await context.secrets.store("devBuddy.profile.personal.linearApiToken", token);
await context.secrets.store("devBuddy.profile.client-b.jiraApiToken", token);
```

**UI Flow (Prompt-Based Fallback):**
```
Scenario A: User with organized directories + auto-switch enabled
─────────────────────────────────────────────────────────────────
1. Open workspace: ~/work/company-a/backend-api
   ↓
2. DevBuddy detects path matches "Work - Company A" profile
   ↓
3. Auto-loads credentials and settings silently
   ↓
4. Sidebar shows: "DevBuddy - Work - Company A 💼"

Scenario B: User with random directories (MOST COMMON)
─────────────────────────────────────────────────────────
1. Open workspace: ~/Documents/random-project-123
   ↓
2. DevBuddy checks: No path pattern match
   ↓
3. DevBuddy checks: No workspace folder memory
   ↓
4. Show notification (first time only):
   
   ┌──────────────────────────────────────────────────┐
   │ DevBuddy: Which profile for this workspace?     │
   │                                                  │
   │ [💼 Work - Company A]  [🏠 Personal Projects]   │
   │ [🌐 Open Source]                                 │
   │                                                  │
   │ ☑ Remember this choice                          │
   │ ☐ Always use [selected] for ~/Documents/**      │
   └──────────────────────────────────────────────────┘
   
   ↓
5. User selects "Work - Company A"
   ↓
6. DevBuddy saves to workspaceFolderProfiles:
   "/Users/alice/Documents/random-project-123": "work-company-a"
   ↓
7. Next time: Opens directly with Work profile (no prompt)

Scenario C: Profiles disabled (DEFAULT for new users)
───────────────────────────────────────────────────────
1. Open any workspace
   ↓
2. DevBuddy uses default/single credential set
   ↓  
3. Sidebar shows: "DevBuddy" (no profile indicator)
   ↓
4. (Optional) Show one-time tip:
   "💡 Working on multiple projects? Try Profiles to separate work and personal credentials."
   [Learn More] [Enable Profiles] [Don't Show Again]
```

**Profile Switcher UI (Sidebar Header):**
```
┌─────────────────────────────────────┐
│ DevBuddy - Work - Company A 💼 ▼   │
├─────────────────────────────────────┤
│ MY TICKETS (5)                      │
│ ├─ In Progress (2)                  │
│ └─ Todo (3)                         │
└─────────────────────────────────────┘
```

**API Design:**
```typescript
interface WorkspaceProfile {
  id: string;
  name: string;
  workspacePaths: string[];  // Glob patterns (optional - can be empty)
  provider: 'linear' | 'jira' | null;
  icon?: string;
  
  // Provider-specific settings
  linearOrganization?: string;
  linearTeamId?: string;
  jiraType?: 'cloud' | 'server';
  jiraSiteUrl?: string;
  jiraEmail?: string;
  
  // Feature toggles
  disableTicketing?: boolean;
  disableAI?: boolean;
  
  // Override settings
  branchNamingConvention?: string;
  writingTone?: string;
}

interface ProfileManager {
  // Detect active profile based on current workspace
  // Returns null if no match and prompting is needed
  detectActiveProfile(workspacePath: string): WorkspaceProfile | null;
  
  // Prompt user to select profile for workspace
  promptForProfile(workspacePath: string): Promise<WorkspaceProfile | null>;
  
  // Remember workspace → profile association
  rememberWorkspaceProfile(workspacePath: string, profileId: string): Promise<void>;
  
  // Check if workspace has remembered profile
  getRememberedProfile(workspacePath: string): WorkspaceProfile | null;
  
  // Switch to different profile manually
  switchProfile(profileId: string): Promise<void>;
  
  // Get credentials for active profile
  getProfileCredentials(profileId: string): Promise<ProfileCredentials>;
  
  // Create new profile
  createProfile(profile: WorkspaceProfile): Promise<void>;
  
  // List all profiles
  listProfiles(): WorkspaceProfile[];
  
  // Determine profile using waterfall strategy
  async resolveProfileForWorkspace(workspacePath: string): Promise<WorkspaceProfile> {
    // 1. Try path pattern matching (if autoSwitch enabled)
    if (config.get('profiles.autoSwitch')) {
      const matched = this.detectActiveProfile(workspacePath);
      if (matched) return matched;
    }
    
    // 2. Check workspace memory
    const remembered = this.getRememberedProfile(workspacePath);
    if (remembered) return remembered;
    
    // 3. Prompt user (if enabled)
    if (config.get('profiles.promptOnNewWorkspace')) {
      const selected = await this.promptForProfile(workspacePath);
      if (selected) {
        await this.rememberWorkspaceProfile(workspacePath, selected.id);
        return selected;
      }
    }
    
    // 4. Fall back to default profile
    return this.getDefaultProfile();
  }
}
```

**First-Time Setup Flow:**
```
New User (Profiles Disabled by Default)
────────────────────────────────────────
1. User installs DevBuddy
   ↓
2. Standard single-profile setup flow
   - "Connect to Linear" or "Connect to Jira"
   - Enter credentials
   - Start using DevBuddy
   ↓
3. User opens different workspace (e.g., personal project)
   ↓
4. User notices wrong tickets showing up
   ↓
5. User discovers Profiles feature in settings or walkthrough

Existing User Enables Profiles
───────────────────────────────
1. User enables "devBuddy.profiles.enabled": true
   ↓
2. Welcome notification:
   "Profiles enabled! Let's set up your first profile."
   [Set Up Now] [Later]
   ↓
3. Profile creation wizard:
   - Profile name: "Work"
   - Provider: [Linear] [Jira] [None]
   - (Optional) Workspace paths for auto-detection
   ↓
4. Migrate existing credentials:
   "Your existing setup will become your 'Work' profile."
   [Continue] [Cancel]
   ↓
5. Prompt to create second profile:
   "Add another profile? (e.g., Personal, Client projects)"
   [Add Profile] [I'm Done]

Walkthrough Section (Education - Optional)
───────────────────────────────────────────
Title: "📁 Organize Projects with Profiles (Optional)"

Description:
"Working on multiple projects with different credentials? 
Profiles keep work and personal projects separate.

💡 Best Practice (Optional):
Organize your directories like this for automatic switching:
  ~/work/          → Work profile
  ~/personal/      → Personal profile  
  ~/clients/       → Client profiles
  
Don't organize this way? No problem! DevBuddy will ask 
which profile to use when you open a new workspace."

[Enable Profiles] [Skip - I only work on one type of project]
```

**Migration Strategy:**
```typescript
// Profiles feature is completely opt-in and backwards compatible
// Existing users continue working exactly as before unless they enable profiles

async function handleProfilesMigration(context: vscode.ExtensionContext) {
  const profilesEnabled = config.get<boolean>('devBuddy.profiles.enabled', false);
  
  if (!profilesEnabled) {
    // User hasn't enabled profiles - do nothing
    // Extension works exactly as before
    return;
  }
  
  // User enabled profiles for the first time
  const hasExistingConfig = await context.secrets.get("linearApiToken") || 
                            await context.secrets.get("jiraApiToken");
  
  if (hasExistingConfig) {
    // Show welcome notification
    const choice = await vscode.window.showInformationMessage(
      "Profiles enabled! Let's migrate your existing setup to a profile.",
      "Set Up Now", "Later"
    );
    
    if (choice === "Set Up Now") {
      // Prompt for profile name
      const profileName = await vscode.window.showInputBox({
        prompt: "Name for your existing profile",
        value: "Work",
        placeHolder: "e.g., Work, Personal, Client Name"
      });
      
      if (!profileName) return;
      
      // Create profile from existing settings
      const migrationProfile: WorkspaceProfile = {
        id: profileName.toLowerCase().replace(/\s+/g, '-'),
        name: profileName,
        workspacePaths: [],  // No auto-detection by default
        provider: config.get("devBuddy.provider"),
        linearOrganization: config.get("devBuddy.linearOrganization"),
        linearTeamId: config.get("devBuddy.linearTeamId"),
        jiraType: config.get("devBuddy.jira.type"),
        jiraSiteUrl: config.get("devBuddy.jira.cloud.siteUrl"),
        jiraEmail: config.get("devBuddy.jira.cloud.email"),
      };
      
      // Move credentials to profile-specific keys
      const linearToken = await context.secrets.get("linearApiToken");
      const jiraToken = await context.secrets.get("jiraApiToken");
      
      if (linearToken) {
        await context.secrets.store(
          `devBuddy.profile.${migrationProfile.id}.linearApiToken`, 
          linearToken
        );
      }
      if (jiraToken) {
        await context.secrets.store(
          `devBuddy.profile.${migrationProfile.id}.jiraApiToken`, 
          jiraToken
        );
      }
      
      // Save profile
      const profiles = config.get<WorkspaceProfile[]>('devBuddy.profiles', []);
      profiles.push(migrationProfile);
      await config.update('devBuddy.profiles', profiles, vscode.ConfigurationTarget.Global);
      
      // Set as default
      await config.update('devBuddy.defaultProfile', migrationProfile.id, vscode.ConfigurationTarget.Global);
      
      // Offer to add another profile
      const addAnother = await vscode.window.showInformationMessage(
        `Profile "${profileName}" created! Add another profile?`,
        "Add Profile", "I'm Done"
      );
      
      if (addAnother === "Add Profile") {
        vscode.commands.executeCommand('devBuddy.createProfile');
      }
    }
  }
}
```

**Success Metrics:**
- % of users with multiple profiles configured
- Profile switches per week
- Reduction in credential management issues
- User feedback on context separation

**Benefits:**
- ✅ Complete isolation between work and personal projects
- ✅ No manual credential switching
- ✅ Different Linear/Jira workspaces per project type
- ✅ Freelancers can manage multiple client workspaces
- ✅ Open-source contributors can disable ticketing features
- ✅ One VS Code setup, multiple contexts

**Why Pro?**
This is a premium feature designed for:
- **Freelancers & Consultants**: Managing multiple client workspaces with separate credentials
- **Multi-Company Developers**: Working across different organizations
- **Advanced Users**: Complex workflow automation with automatic profile switching
- Free tier users can still use DevBuddy with a single profile/workspace

**Related Features:**
- Complements #1 (Cross-Repository Support) - profiles manage which credentials to use, cross-repo manages multiple repos within same profile
- Enables use case: Work profile with multiple work repos, Personal profile with multiple personal repos

---

## 👥 Light Team Features (P1)

### 6. Team Ticket Visibility
**Priority:** P1 | **Effort:** 🟡 Medium | **Status:** 💎 Pro Feature | **Tier:** Premium

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
**Priority:** P1 | **Effort:** 🟢 Small | **Status:** 💎 Pro Feature | **Tier:** Premium

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
**Priority:** P1 | **Effort:** 🟡 Medium | **Status:** 💎 Pro Feature | **Tier:** Premium

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
**Priority:** P1 | **Effort:** 🟢 Small | **Status:** 💎 Pro Feature | **Tier:** Premium

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
**Priority:** P2 | **Effort:** 🟡 Medium | **Status:** 💎 Pro Feature | **Tier:** Premium

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
**Priority:** P2 | **Effort:** 🟡 Medium | **Status:** 💎 Pro Feature | **Tier:** Premium

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
**Priority:** P2 | **Effort:** 🟡 Medium | **Status:** 💎 Pro Feature | **Tier:** Premium

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
**Priority:** P2 | **Effort:** 🟢 Small | **Status:** 💎 Pro Feature | **Tier:** Premium

**Value:** Let power users customize AI behavior.

**Why Pro?**
Advanced AI customization is a premium feature for power users who want fine-grained control over AI behavior and prompt engineering.

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
**Priority:** P2 | **Effort:** 🟡 Medium | **Status:** 💎 Pro Feature | **Tier:** Premium

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
**Priority:** P2 | **Effort:** 🟡 Medium | **Status:** 💎 Pro Feature | **Tier:** Premium

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
**Priority:** P3 | **Effort:** 🟢 Small | **Status:** 💎 Pro Feature | **Tier:** Premium

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

### Freemium Model Strategy
- Free tier is a **solid ticket management tool** (not a limited trial)
- All AI-powered features are Pro (standup, PR summaries, chat)
- Core workflow features remain free forever
- Pro tier targets developers who want AI-powered automation
- Consider usage limits (5-10 free uses/month) to let users experience AI value

### Growth & Retention
- Focus on word-of-mouth growth (viral features)
- **TODO converter remains free** - This is the viral "wow" feature
- Free tier demonstrates value → users upgrade for AI automation
- Prioritize features that increase daily usage
- Balance solo developer needs with team collaboration
- Maintain privacy-first approach (no intrusive telemetry)

### Pro Feature Philosophy
- **Free tier**: Manual ticket management, TODO converter, basic git integration
- **Pro tier**: All AI features, multi-workspace, custom prompts, team analytics
- **Value proposition**: "Save 2-3 hours per week on standups, PR descriptions, and context switching"
- Gradual value ladder: Free (basic) → Pro (AI + multi-workspace) → Enterprise (team features + SSO)

---

**Document Owner:** Angelo Girardi  
**Contact:** angelo@cooked.mx  
**Repository:** [Linear Buddy](https://github.com/yourusername/linear-buddy)

