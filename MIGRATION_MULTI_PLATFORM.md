# Multi-Platform Architecture Refactor Plan

## Overview

Transform Linear Buddy into **DevBuddy** - a multi-platform ticket management extension supporting Linear, Jira, Monday, and ClickUp. The architecture uses a hybrid approach: shared core infrastructure with platform-specific UI pages and commands.

## Architecture Strategy

### What Gets Shared (Core Infrastructure)

- **Shared utilities**: Git operations (GitAnalyzer, GitPermalinkGenerator), AI summarization, logging, configuration management
- **Shared UI components**: Button, Input, Select, TextArea, Badge, and other atomic components
- **Shared business logic**: Standup/PR generation (abstracted to work with any ticket data), TODO converter core logic
- **Base abstractions**: Abstract classes for ticket providers, tree view providers, and ticket panels

### What Stays Platform-Specific (1:1 Implementation)

- **Webview UI pages**: Each platform gets its own React pages (e.g., `linear/TicketPanel.tsx` vs `jira/TicketPanel.tsx`)
- **Commands**: Platform-specific commands (e.g., `devBuddy.createLinearTicket` vs `devBuddy.createJiraTicket`)
- **Provider implementations**: LinearClient, JiraClient, MondayClient, ClickUpClient
- **Platform features**: Linear cycles, Jira sprints, Monday boards, ClickUp spaces

### Feature Preservation Strategy

- **Templates**: Abstract to `BaseTicketProvider.getTemplates()` - each platform implements its own
- **Tags/Labels**: Map Linear tags → Jira labels, Monday tags, ClickUp tags
- **Hide unsupported features**: If a platform doesn't support a feature, it won't appear in the UI
- **Platform detection utility**: `getCurrentPlatform()` helper to determine active provider

## Implementation Phases

### Phase 1: Refactor Linear Code (Foundation)

**Goal**: Clean up existing Linear code to establish patterns for multi-platform support

1. **Create base abstractions** (`src/shared/base/`)

   - `BaseTicketProvider.ts` - Abstract class defining ticket operations interface
   - `BaseTreeViewProvider.ts` - Abstract tree view pattern
   - `BaseTicketPanel.ts` - Abstract webview panel pattern

2. **Move Linear to new structure** (`src/providers/linear/`)

   - Refactor `LinearClient` to extend `BaseTicketProvider`
   - Move Linear-specific types to `src/providers/linear/types.ts`
   - Preserve all Linear features (templates, tags, cycles, etc.)

3. **Extract shared utilities** (`src/shared/`)

   - Move git utilities to `src/shared/git/`
   - Move AI utilities to `src/shared/ai/`
   - Move logging, config to `src/shared/utils/`

4. **Refactor webview structure** (`webview-ui/src/`)

   - Move Linear pages to `webview-ui/src/linear/`
   - Extract shared components to `webview-ui/src/shared/components/`
   - Create base message protocol types in `webview-ui/src/shared/types/`

### Phase 2: Add Jira Support

**Goal**: Implement Jira as the first additional platform to validate architecture

**Note**: Jira has two deployment models - Cloud (SaaS) and Server/Data Center (self-hosted). See `JIRA_CLOUD_VS_SERVER.md` for detailed comparison. Recommendation: Start with Jira Cloud (Phase 2A), then add Server support (Phase 2B).

#### Phase 2A: Jira Cloud Support

1. **Create Jira Cloud provider** (`src/providers/jira/cloud/`)

   - `JiraCloudClient.ts` extends `BaseTicketProvider`
   - Jira Cloud REST API v3 integration
   - Email + API token authentication
   - Map Jira concepts: Issues, Projects, Sprints, Labels, Custom Fields

2. **Jira-specific UI** (`webview-ui/src/jira/`)

   - `TicketPanel.tsx` - Jira issue details (different fields than Linear)
   - `CreateTicket.tsx` - Jira issue creation form
   - Use shared components for inputs, buttons, etc.

3. **Jira commands** (`src/commands/jira/`)

   - `createJiraTicket.ts`
   - `updateJiraStatus.ts`
   - Register with `devBuddy.jira.*` namespace

4. **Feature mapping**

   - Linear templates → Jira issue templates
   - Linear tags → Jira labels
   - Linear cycles → Jira sprints
   - Hide Linear-only features when Jira is active

#### Phase 2B: Jira Server/Data Center Support (Optional)

1. **Create Jira Server provider** (`src/providers/jira/server/`)

   - `JiraServerClient.ts` extends `BaseTicketProvider`
   - Jira REST API v2 integration
   - Personal Access Token or Basic Auth
   - Handle custom fields and workflows
   - SSL certificate handling

2. **Unified Jira Interface**

   - Factory pattern to select Cloud vs Server client
   - Shared UI components work with both
   - Configuration allows deployment type selection

### Phase 3: Rebranding to DevBuddy

**Goal**: Rebrand extension and add provider selection

1. **Update package.json**

   - Change name from `linear-buddy` to `dev-buddy`
   - Update display name to "DevBuddy"
   - Add provider selection setting

2. **Add provider selection**

   - New setting: `devBuddy.provider` (enum: linear, jira, monday, clickup)
   - Provider switcher UI in sidebar
   - Migrate Linear API token to new namespace

3. **Update documentation**

   - README with multi-platform support info
   - Feature matrix table (see below)
   - Platform-specific setup guides

### Phase 4: Monday & ClickUp

**Goal**: Add remaining platforms

1. **Monday.com provider**

   - Monday GraphQL API integration
   - Map: Items → Tickets, Boards → Projects, Groups → Categories

2. **ClickUp provider**

   - ClickUp REST API v2
   - Map: Tasks → Tickets, Spaces → Projects, Lists → Containers

3. **Platform-specific features**

   - Each platform gets its own UI pages
   - Shared standup/PR generation works across all platforms

## Feature Matrix

Add to README.md:

```markdown
## Feature Support Matrix

| Feature | Linear | Jira | Monday | ClickUp |
|---------|--------|------|--------|---------|
| **Core Features** |
| View tickets | ✅ | ✅ | ✅ | ✅ |
| Create tickets | ✅ | ✅ | ✅ | ✅ |
| Update status | ✅ | ✅ | ✅ | ✅ |
| Assign tickets | ✅ | ✅ | ✅ | ✅ |
| Comments | ✅ | ✅ | ✅ | ✅ |
| Attachments | ✅ | ✅ | ✅ | ✅ |
| **Advanced Features** |
| Templates | ✅ | ✅ | ⚠️ Limited | ❌ |
| Tags/Labels | ✅ | ✅ | ✅ | ✅ |
| Custom fields | ✅ | ✅ | ✅ | ✅ |
| Sub-issues | ✅ | ✅ | ✅ | ✅ |
| Time tracking | ❌ | ✅ | ✅ | ✅ |
| **Workflows** |
| AI standup | ✅ | ✅ | ✅ | ✅ |
| AI PR summary | ✅ | ✅ | ✅ | ✅ |
| TODO converter | ✅ | ✅ | ✅ | ✅ |
| Branch management | ✅ | ✅ | ✅ | ✅ |
| **Platform-Specific** |
| Cycles | ✅ Linear-only | - | - | - |
| Sprints | - | ✅ Jira-only | - | - |
| Boards | - | - | ✅ Monday-only | - |
| Spaces | - | - | - | ✅ ClickUp-only |

✅ = Fully supported | ⚠️ = Partially supported | ❌ = Not supported
```

## Tiered Feature Organization

### Tier Strategy

**Free Tier:**

- View tickets in sidebar
- Basic ticket creation
- Update ticket status
- Single platform support (Linear only initially)
- Basic git integration (branch detection)

**Pro Tier ($10/year or $30 one-time):**

- Multi-platform support (Jira, Monday, ClickUp)
- AI-powered standup generation
- AI-powered PR summaries
- TODO to ticket converter with permalinks
- Advanced branch management & analytics
- Ticket templates

**Enterprise Tier (Future):**

- Team analytics
- Custom integrations
- Priority support

### Feature Matrix by Tier

| Feature | Free | Pro | Enterprise |

|---------|------|-----|------------|

| **Basic Operations** |

| View tickets | ✅ Linear only | ✅ All platforms | ✅ |

| Create tickets | ✅ Basic | ✅ With templates | ✅ |

| Update status | ✅ | ✅ | ✅ |

| Comments | ✅ | ✅ | ✅ |

| **Advanced Features** |

| Multi-platform | ❌ | ✅ | ✅ |

| AI Standup | ❌ | ✅ | ✅ |

| AI PR Summary | ❌ | ✅ | ✅ |

| TODO Converter | ❌ | ✅ | ✅ |

| Templates | ❌ | ✅ | ✅ |

| Branch Analytics | ❌ | ✅ | ✅ |

| **Future** |

| Team Analytics | ❌ | ❌ | ✅ |

| Custom Integrations | ❌ | ❌ | ✅ |

## New Directory Structure (Tier-Organized)

```
src/
├── shared/
│   ├── base/
│   │   ├── BaseTicketProvider.ts      # Abstract ticket operations
│   │   ├── BaseTreeViewProvider.ts    # Abstract tree view
│   │   └── BaseTicketPanel.ts         # Abstract webview panel
│   ├── git/
│   │   ├── GitAnalyzer.ts             # Moved from utils/
│   │   └── GitPermalinkGenerator.ts
│   ├── ai/
│   │   ├── AISummarizer.ts
│   │   └── FallbackSummarizer.ts
│   └── utils/
│       ├── logger.ts
│       ├── config.ts
│       ├── platformDetector.ts        # NEW: Detect active provider
│       ├── licenseManager.ts          # NEW: License validation
│       └── telemetryManager.ts        # Already exists
├── features/
│   ├── free/                          # FREE TIER
│   │   ├── sidebar/                   # Basic ticket viewing
│   │   │   ├── linearTicketsProvider.ts
│   │   │   └── linearTicketPanel.ts
│   │   ├── tickets/                   # Basic ticket operations
│   │   │   ├── createTicket.ts
│   │   │   ├── updateStatus.ts
│   │   │   └── addComment.ts
│   │   └── git/                       # Basic git integration
│   │       └── branchDetection.ts
│   ├── pro/                           # PRO TIER (requires license)
│   │   ├── multi-platform/            # Multi-platform support
│   │   │   ├── jira/
│   │   │   │   ├── JiraClient.ts
│   │   │   │   ├── JiraTreeViewProvider.ts
│   │   │   │   └── types.ts
│   │   │   ├── monday/
│   │   │   │   ├── MondayClient.ts
│   │   │   │   └── types.ts
│   │   │   └── clickup/
│   │   │       ├── ClickUpClient.ts
│   │   │       └── types.ts
│   │   ├── ai/                        # AI-powered features
│   │   │   ├── generateStandup.ts
│   │   │   └── generatePRSummary.ts
│   │   ├── todo-converter/            # TODO to ticket with permalinks
│   │   │   ├── convertTodoToTicket.ts
│   │   │   └── todoCodeActionProvider.ts
│   │   ├── templates/                 # Ticket templates
│   │   │   └── templateManager.ts
│   │   └── branch-management/         # Advanced branch features
│   │       ├── branchAssociationManager.ts
│   │       └── branchAnalytics.ts
│   └── enterprise/                    # ENTERPRISE TIER (future)
│       ├── analytics/
│       └── integrations/
├── providers/
│   └── linear/                        # Linear stays in free tier
│       ├── LinearClient.ts            # Extends BaseTicketProvider
│       ├── LinearTreeViewProvider.ts
│       └── types.ts
├── views/
│   ├── free/
│   │   └── linear/                    # Basic Linear panels
│   └── pro/
│       ├── jira/                      # Pro: Jira panels
│       ├── monday/                    # Pro: Monday panels
│       └── clickup/                   # Pro: ClickUp panels
├── commands/
│   ├── free/                          # Free tier commands
│   │   ├── refreshTickets.ts
│   │   ├── openTicket.ts
│   │   └── updateStatus.ts
│   └── pro/                           # Pro tier commands
│       ├── generateStandup.ts
│       ├── generatePRSummary.ts
│       └── convertTodoToTicket.ts
└── extension.ts                       # Multi-provider + license registration

webview-ui/
├── src/
    ├── shared/
    │   ├── components/                # Reusable UI components
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── ProBadge.tsx          # NEW: "Pro" indicator
    │   │   ├── UpgradePrompt.tsx     # NEW: Upgrade UI
    │   │   └── ...
    │   ├── hooks/
    │   │   ├── useVSCode.ts
    │   │   └── useLicense.ts          # NEW: License state hook
    │   └── types/
    │       └── messages.ts            # Shared message protocol
    ├── free/
    │   └── linear/                    # Free tier Linear pages
    │       ├── TicketPanel/
    │       └── CreateTicket/
    └── pro/                           # Pro tier pages
        ├── linear/                    # Pro: Advanced Linear features
        │   └── StandupBuilder/
        ├── jira/                      # Pro: Jira pages
        │   ├── IssuePanel/
        │   └── CreateIssue/
        ├── monday/                    # Pro: Monday pages
        └── clickup/                   # Pro: ClickUp pages
```

## Key Implementation Details

### BaseTicketProvider Interface

```typescript
// src/shared/base/BaseTicketProvider.ts
export abstract class BaseTicketProvider {
  abstract isConfigured(): boolean;
  abstract getCurrentUser(): Promise<User | null>;
  abstract getMyTickets(filter?: TicketFilter): Promise<Ticket[]>;
  abstract getTicket(id: string): Promise<Ticket | null>;
  abstract createTicket(input: CreateTicketInput): Promise<Ticket | null>;
  abstract updateTicketStatus(id: string, statusId: string): Promise<boolean>;
  abstract getTemplates(teamId?: string): Promise<Template[]>;
  abstract getTags(teamId?: string): Promise<Tag[]>;
  // ... more methods
}
```

### Platform Detection Utility

```typescript
// src/shared/utils/platformDetector.ts
export function getCurrentPlatform(): 'linear' | 'jira' | 'monday' | 'clickup' {
  const config = vscode.workspace.getConfiguration('devBuddy');
  return config.get<string>('provider', 'linear') as any;
}

export function getPlatformClient(): BaseTicketProvider {
  const platform = getCurrentPlatform();
  switch (platform) {
    case 'linear': return new LinearClient();
    case 'jira': return new JiraClient();
    case 'monday': return new MondayClient();
    case 'clickup': return new ClickUpClient();
  }
}
```

### Configuration Changes

```json
// package.json - New settings
{
  "devBuddy.provider": {
    "type": "string",
    "enum": ["linear", "jira", "monday", "clickup"],
    "default": "linear",
    "description": "Ticket management platform to use"
  },
  "devBuddy.linear.apiToken": { ... },
  "devBuddy.jira.domain": { ... },
  "devBuddy.jira.email": { ... },
  "devBuddy.jira.apiToken": { ... },
  // ... other platform configs
}
```

## Migration for New Computer

This plan is designed to be executed on a new computer. To get started:

1. Clone the repository
2. Run `npm install`
3. Point your AI agent to this file: `MIGRATION_MULTI_PLATFORM.md`
4. Execute phases sequentially, starting with Phase 1

The agent should:

- Read the current codebase structure
- Apply refactorings according to each phase
- Preserve all existing functionality
- Test each phase before moving to the next

## Success Criteria

- [ ] Linear functionality works exactly as before (no regressions)
- [ ] Jira integration supports core ticket operations
- [ ] Shared components render correctly across platforms
- [ ] Feature matrix is accurate and documented
- [ ] Templates and tags work per platform capabilities
- [ ] Platform detection utility correctly identifies active provider
- [ ] All webviews use shared components where possible
- [ ] Extension rebranded to "DevBuddy"

---

**Next Steps**: Start with Phase 1 (Refactor Linear Code) to establish the foundation before adding new platforms.

