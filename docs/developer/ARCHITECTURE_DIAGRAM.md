# DevBuddy Pro/Core Architecture Visualization

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEVBUDDY EXTENSION                               │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                      extension.ts                               │   │
│  │                    (Entry Point)                                │   │
│  └──────────────┬──────────────────────────────┬───────────────────┘   │
│                 │                              │                        │
│  ┌──────────────▼──────────────┐  ┌───────────▼────────────────┐      │
│  │      CORE (Free)            │  │      PRO (Premium)          │      │
│  │  ✅ Always Available        │  │  🔒 License Required        │      │
│  │                             │  │                             │      │
│  │  commands/                  │  │  commands/                  │      │
│  │  ├─ tickets/                │  │  ├─ ai/                     │      │
│  │  │  ├─ refreshTickets       │  │  │  ├─ generatePRSummary   │      │
│  │  │  ├─ openTicket           │  │  │  ├─ generateStandup     │      │
│  │  │  └─ changeStatus         │  │  │  └─ aiCodeReview        │      │
│  │  ├─ branches/               │  │  ├─ automation/             │      │
│  │  │  ├─ startBranch          │  │  │  ├─ autoAssignTickets   │      │
│  │  │  └─ checkoutBranch       │  │  │  └─ smartStatusUpdates  │      │
│  │  └─ setup/                  │  │  ├─ analytics/              │      │
│  │     └─ firstTimeSetup       │  │  │  ├─ branchAnalytics     │      │
│  │                             │  │  │  └─ velocityMetrics     │      │
│  │  providers/                 │  │  ├─ advanced/              │      │
│  │  ├─ linear/                 │  │  │  ├─ convertTodoToTicket│      │
│  │  │  ├─ LinearClient         │  │  │  └─ bulkOperations     │      │
│  │  │  └─ LinearTicketsProvider│  │  └─ integrations/          │      │
│  │  └─ jira/                   │  │     ├─ slackIntegration    │      │
│  │     ├─ JiraClient           │  │     └─ githubAdvanced      │      │
│  │     └─ JiraIssuesProvider   │  │                             │      │
│  │                             │  │  providers/                 │      │
│  │  views/                     │  │  ├─ linear/                │      │
│  │  ├─ UniversalTicketsProvider│  │  │  ├─ LinearProClient    │      │
│  │  └─ BasicTicketPanel        │  │  │  └─ StandupBuilderPanel│      │
│  │                             │  │  └─ jira/                  │      │
│  │  chat/                      │  │     └─ JiraProClient       │      │
│  │  └─ basicParticipant        │  │                             │      │
│  │                             │  │  views/                     │      │
│  │                             │  │  ├─ StandupBuilderPanel    │      │
│  │                             │  │  ├─ PRSummaryPanel         │      │
│  │                             │  │  └─ AnalyticsPanel         │      │
│  │                             │  │                             │      │
│  │                             │  │  chat/                      │      │
│  │                             │  │  └─ proParticipant          │      │
│  │                             │  │                             │      │
│  │                             │  │  licensing/                 │      │
│  │                             │  │  ├─ licenseValidator        │      │
│  │                             │  │  ├─ licenseManager          │      │
│  │                             │  │  ├─ trialManager            │      │
│  │                             │  │  └─ featureGating           │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SHARED (Used by Both)                         │   │
│  │                                                                  │   │
│  │  base/               ai/                 git/                   │   │
│  │  ├─ BaseTicketProvider  ├─ aiSummarizer     ├─ gitAnalyzer     │   │
│  │  ├─ BaseTreeViewProvider├─ fallbackSummarizer└─ gitPermalink   │   │
│  │  └─ BaseTicketPanel                                             │   │
│  │                                                                  │   │
│  │  utils/                                                          │   │
│  │  ├─ logger              ├─ platformDetector  ├─ packageDetector│   │
│  │  ├─ linkFormatter       ├─ templateParser    └─ telemetry      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         WEBVIEW APPS (React)                             │
│                                                                          │
│  ┌──────────────────────────┐  ┌────────────────────────────────────┐  │
│  │   CORE Webviews          │  │   PRO Webviews                      │  │
│  │   ✅ Always Available    │  │   🔒 License Required               │  │
│  │                          │  │                                     │  │
│  │  basic-ticket-panel/     │  │  standup-builder/                   │  │
│  │  ├─ App.tsx              │  │  ├─ App.tsx                         │  │
│  │  └─ components/          │  │  └─ components/                     │  │
│  │     ├─ TicketHeader      │  │     ├─ ModeSelector                │  │
│  │     ├─ TicketDescription │  │     ├─ TicketSelector              │  │
│  │     └─ TicketMetadata    │  │     ├─ StandupForm                 │  │
│  │                          │  │     └─ ResultsDisplay              │  │
│  │  settings/               │  │                                     │  │
│  │  └─ App.tsx              │  │  pr-summary/                        │  │
│  │                          │  │  ├─ App.tsx                         │  │
│  │                          │  │  └─ components/                     │  │
│  │                          │  │     ├─ PRAnalysis                  │  │
│  │                          │  │     └─ SummaryEditor               │  │
│  │                          │  │                                     │  │
│  │                          │  │  analytics/                         │  │
│  │                          │  │  ├─ App.tsx                         │  │
│  │                          │  │  └─ components/                     │  │
│  │                          │  │     ├─ VelocityChart               │  │
│  │                          │  │     └─ TeamInsights                │  │
│  │                          │  │                                     │  │
│  │                          │  │  advanced-ticket-panel/             │  │
│  │                          │  │  ├─ App.tsx                         │  │
│  │                          │  │  └─ components/                     │  │
│  │                          │  │     ├─ AIAssistant                 │  │
│  │                          │  │     └─ WorkflowAutomation          │  │
│  └──────────────────────────┘  └────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              SHARED React Components                             │   │
│  │                                                                  │   │
│  │  components/             hooks/                types/            │   │
│  │  ├─ Button               ├─ useVSCode         ├─ messages.ts    │   │
│  │  ├─ Input                ├─ useLicense        └─ license.ts     │   │
│  │  ├─ Select               └─ useFeatureGate                       │   │
│  │  ├─ TextArea                                                     │   │
│  │  ├─ Badge                                                        │   │
│  │  ├─ Card                                                         │   │
│  │  └─ ProBadge (NEW)                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      PATH ALIASES (TypeScript)                           │
│                                                                          │
│  Extension (src/):                                                       │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  @core/*      →  src/core/*        (Free features)             │    │
│  │  @pro/*       →  src/pro/*         (Premium features)          │    │
│  │  @shared/*    →  src/shared/*      (Shared utilities)          │    │
│  │  @providers/* →  src/providers/*   (Platform implementations)  │    │
│  │  @commands/*  →  src/commands/*    (Legacy commands)           │    │
│  │  @chat/*      →  src/chat/*        (Chat participants)         │    │
│  │  @views/*     →  src/views/*       (UI views)                  │    │
│  │  @utils/*     →  src/utils/*       (Legacy utils)              │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Webviews (webview-ui/src/):                                             │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  @shared/*  →  webview-ui/src/shared/*  (Shared components)    │    │
│  │  @core/*    →  webview-ui/src/core/*    (Free webviews)        │    │
│  │  @pro/*     →  webview-ui/src/pro/*     (Premium webviews)     │    │
│  │  @linear/*  →  webview-ui/src/linear/*  (Linear webviews)      │    │
│  │  @jira/*    →  webview-ui/src/jira/*    (Jira webviews)        │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      FEATURE GATING FLOW                                 │
│                                                                          │
│  User triggers command                                                   │
│         │                                                                │
│         ▼                                                                │
│  FeatureGate.executeIfAvailable()                                        │
│         │                                                                │
│         ├──────────────┬─────────────────┐                              │
│         │              │                 │                              │
│    Core Feature?  License Valid?   License Invalid?                     │
│         │              │                 │                              │
│         ▼              ▼                 ▼                              │
│    ✅ Execute     ✅ Execute       🔒 Show Upgrade                       │
│                                       │                                  │
│                                       ├─ Learn More                      │
│                                       ├─ Start Trial                     │
│                                       └─ Cancel                          │
│                                                                          │
│  License Check:                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  LicenseManager                                                 │    │
│  │  ├─ Check secret storage for license key                       │    │
│  │  ├─ Validate signature                                          │    │
│  │  ├─ Check expiration date                                       │    │
│  │  └─ Return { type, isValid, isExpired, features }              │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      USER EXPERIENCE FLOW                                │
│                                                                          │
│  Free User                            Pro User                           │
│  ─────────────────────────────────    ────────────────────────────────  │
│                                                                          │
│  1. Install Extension                 1. Install Extension               │
│     │                                    │                               │
│     ▼                                    ▼                               │
│  2. Setup Platform (Linear/Jira)      2. Setup Platform                 │
│     │                                    │                               │
│     ▼                                    ▼                               │
│  3. Access Core Features:             3. Enter License Key              │
│     • View tickets ✅                    │                               │
│     • Basic status updates ✅            ▼                               │
│     • Create branches ✅              4. Access All Features:            │
│     • Basic chat ✅                     • Everything from Core ✅        │
│                                        • AI PR Summary ✅                │
│  4. Try Pro Feature:                   • AI Standup ✅                   │
│     • Generate PR Summary              • TODO Converter ✅               │
│     │                                   • Branch Analytics ✅            │
│     ▼                                   • Bulk Operations ✅             │
│  5. See Upgrade Prompt 🔒              • Custom Workflows ✅            │
│     ┌─────────────────────────┐        • Slack Integration ✅          │
│     │  🎁 Pro Feature          │                                         │
│     │                         │     5. Get Updates & Support            │
│     │  [Learn More]           │        • Priority support               │
│     │  [Start 14-Day Trial]   │        • Early access to features      │
│     │  [Cancel]               │        • Influence roadmap             │
│     └─────────────────────────┘                                         │
│                                                                          │
│  6. Start Trial (Optional)                                               │
│     │                                                                    │
│     ▼                                                                    │
│  7. Access Pro Features for 14 days                                      │
│     │                                                                    │
│     ├──▶ Day 14: Trial Expires                                          │
│     │      ├─ Purchase License                                           │
│     │      └─ Revert to Free                                             │
│     │                                                                    │
│     └──▶ Purchase before expiry                                          │
│           └─ Seamless transition to Pro                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      FEATURE COMPARISON TABLE                            │
│                                                                          │
│  Feature                          │  Core (Free)  │  Pro (Premium)      │
│  ─────────────────────────────────┼───────────────┼─────────────────   │
│  View Tickets                     │      ✅       │       ✅            │
│  Update Status                    │      ✅       │       ✅            │
│  Create Tickets                   │      ✅       │       ✅            │
│  Create Branches                  │      ✅       │       ✅            │
│  Checkout Branches                │      ✅       │       ✅            │
│  Basic Chat Participant           │      ✅       │       ✅            │
│  Platform: Linear                 │      ✅       │       ✅            │
│  Platform: Jira                   │      ✅       │       ✅            │
│  ─────────────────────────────────┼───────────────┼─────────────────   │
│  AI PR Summary                    │      ❌       │       ✅            │
│  AI Standup Generator             │      ❌       │       ✅            │
│  AI Code Review                   │      ❌       │       ✅            │
│  TODO to Ticket Converter         │      ❌       │       ✅            │
│  Branch Analytics                 │      ❌       │       ✅            │
│  Bulk Operations                  │      ❌       │       ✅            │
│  Custom Workflows                 │      ❌       │       ✅            │
│  Slack Integration                │      ❌       │       ✅            │
│  GitHub Advanced Features         │      ❌       │       ✅            │
│  Enhanced Chat (Full AI)          │      ❌       │       ✅            │
│  Priority Support                 │      ❌       │       ✅            │
│  Early Access to Features         │      ❌       │       ✅            │
│  Influence Roadmap                │      ❌       │       ✅            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Import Examples

### Extension Code

```typescript
// ✅ Using path aliases (new way)
import { getLogger } from '@shared/utils/logger';
import { GitAnalyzer } from '@shared/git/gitAnalyzer';
import { LinearClient } from '@core/providers/linear/LinearClient';
import { generatePRSummary } from '@pro/commands/ai/generatePRSummary';
import { FeatureGate, Feature } from '@pro/licensing/featureGating';

// ❌ Old way (relative imports)
import { getLogger } from '../../../shared/utils/logger';
import { GitAnalyzer } from '../../../shared/git/gitAnalyzer';
```

### Webview Code

```typescript
// ✅ Using path aliases (new way)
import { Button } from '@shared/components/Button';
import { useVSCode } from '@shared/hooks/useVSCode';
import { useLicense } from '@shared/hooks/useLicense';
import { StandupApp } from '@pro/standup-builder/App';

// ❌ Old way (relative imports)
import { Button } from '../../shared/components/Button';
import { useVSCode } from '../../shared/hooks/useVSCode';
```

## Development Commands

```bash
# Install dependencies
npm install

# Compile extension
npm run compile

# Compile webviews
npm run compile:webview

# Watch mode (both)
npm run watch         # Extension
npm run watch:webview # Webviews

# Quality checks
npm run type-check    # TypeScript (extension + webviews)
npm run lint          # ESLint (extension + webviews)
npm run lint:fix      # Auto-fix linting issues
npm run validate      # type-check + lint

# Formatting
npm run format        # Format all code
npm run format:check  # Check formatting

# Package
npm run package       # Create .vsix
```

## Key Files

```
Configuration:
├─ .eslintrc.json              # ESLint rules
├─ .prettierrc                 # Prettier config
├─ .prettierignore             # Prettier ignore
├─ tsconfig.json               # TypeScript (extension)
├─ webview-ui/tsconfig.json    # TypeScript (webviews)
└─ webview-ui/build.js         # esbuild + path aliases

Documentation:
├─ docs/developer/PRO_CORE_ARCHITECTURE.md    # Full architecture
├─ docs/developer/PATH_ALIASES.md             # Alias reference
├─ docs/developer/INFRASTRUCTURE_SETUP.md     # Setup summary
└─ docs/developer/ARCHITECTURE_DIAGRAM.md     # This file
```

---

**Status:** Infrastructure ready for pro/core migration! 🚀

