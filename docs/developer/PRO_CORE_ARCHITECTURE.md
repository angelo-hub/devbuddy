# Pro/Core Architecture Guide

This document outlines the proposed directory structure and organization for implementing a pro/free license model in DevBuddy.

## Overview

DevBuddy will be organized into three main feature tiers:

1. **Core** - Free features available to all users
2. **Pro** - Premium features requiring a license
3. **Shared** - Utilities and base abstractions used by both

## Directory Structure

### Extension (src/)

```
src/
├── core/                          # Free features (always available)
│   ├── commands/                  # Core commands
│   │   ├── tickets/               # Basic ticket management
│   │   │   ├── refreshTickets.ts
│   │   │   ├── openTicket.ts
│   │   │   └── changeStatus.ts
│   │   ├── branches/              # Basic branch operations
│   │   │   ├── startBranch.ts
│   │   │   └── checkoutBranch.ts
│   │   └── setup/                 # Initial setup & onboarding
│   │       ├── firstTimeSetup.ts
│   │       └── configureToken.ts
│   ├── providers/                 # Core provider implementations
│   │   ├── linear/
│   │   │   ├── LinearClient.ts    # Basic Linear API operations
│   │   │   ├── LinearTicketsProvider.ts
│   │   │   └── types.ts
│   │   └── jira/
│   │       ├── JiraClient.ts      # Basic Jira API operations
│   │       ├── JiraIssuesProvider.ts
│   │       └── types.ts
│   ├── views/                     # Core UI components
│   │   ├── UniversalTicketsProvider.ts  # Basic tree view
│   │   └── BasicTicketPanel.ts    # Simple ticket detail view
│   └── chat/                      # Basic chat participant
│       └── basicParticipant.ts    # Limited chat features
│
├── pro/                           # Premium features (license required)
│   ├── commands/                  # Pro commands
│   │   ├── ai/                    # AI-powered features
│   │   │   ├── generatePRSummary.ts
│   │   │   ├── generateStandup.ts
│   │   │   └── aiCodeReview.ts
│   │   ├── automation/            # Advanced automation
│   │   │   ├── autoAssignTickets.ts
│   │   │   ├── smartStatusUpdates.ts
│   │   │   └── workflowAutomation.ts
│   │   ├── analytics/             # Usage analytics & insights
│   │   │   ├── branchAnalytics.ts
│   │   │   ├── velocityMetrics.ts
│   │   │   └── teamInsights.ts
│   │   ├── advanced/              # Advanced features
│   │   │   ├── convertTodoToTicket.ts
│   │   │   ├── bulkOperations.ts
│   │   │   └── customWorkflows.ts
│   │   └── integrations/          # Third-party integrations
│   │       ├── slackIntegration.ts
│   │       ├── githubAdvanced.ts
│   │       └── customWebhooks.ts
│   ├── providers/                 # Pro provider extensions
│   │   ├── linear/
│   │   │   ├── LinearProClient.ts # Advanced Linear features
│   │   │   ├── StandupBuilderPanel.ts
│   │   │   └── AdvancedTicketPanel.ts
│   │   └── jira/
│   │       ├── JiraProClient.ts   # Advanced Jira features
│   │       └── JiraAnalytics.ts
│   ├── views/                     # Pro UI components
│   │   ├── StandupBuilderPanel.ts
│   │   ├── PRSummaryPanel.ts
│   │   ├── AnalyticsPanel.ts
│   │   └── AdvancedSettingsPanel.ts
│   ├── chat/                      # Enhanced chat features
│   │   └── proParticipant.ts      # Full AI capabilities
│   └── licensing/                 # License management
│       ├── licenseValidator.ts
│       ├── licenseManager.ts
│       ├── trialManager.ts
│       └── featureGating.ts
│
├── shared/                        # Shared utilities (used by both)
│   ├── base/                      # Base abstractions
│   │   ├── BaseTicketProvider.ts
│   │   ├── BaseTreeViewProvider.ts
│   │   ├── BaseTicketPanel.ts
│   │   └── BaseStandupDataProvider.ts
│   ├── ai/                        # AI utilities
│   │   ├── aiSummarizer.ts
│   │   └── fallbackSummarizer.ts
│   ├── git/                       # Git operations
│   │   ├── gitAnalyzer.ts
│   │   ├── gitPermalinkGenerator.ts
│   │   └── branchAssociationManager.ts
│   ├── utils/                     # General utilities
│   │   ├── logger.ts
│   │   ├── platformDetector.ts
│   │   ├── linkFormatter.ts
│   │   ├── packageDetector.ts
│   │   ├── templateParser.ts
│   │   ├── telemetryManager.ts
│   │   └── devEnvLoader.ts
│   └── jira/                      # Jira-specific shared utilities
│       ├── adfBuilder.ts
│       └── adfTypes.ts
│
├── commands/                      # Legacy (will be deprecated)
│   └── ... (gradually migrate to core/ or pro/)
│
├── providers/                     # Legacy (will be deprecated)
│   └── ... (gradually migrate to core/ or pro/)
│
├── views/                         # Legacy (will be deprecated)
│   └── ... (gradually migrate to core/ or pro/)
│
├── utils/                         # Legacy (will be deprecated)
│   └── ... (gradually migrate to shared/)
│
└── extension.ts                   # Main entry point
```

### Webviews (webview-ui/src/)

```
webview-ui/src/
├── core/                          # Free webview apps
│   ├── basic-ticket-panel/        # Simple ticket detail view
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── TicketHeader.tsx
│   │   │   ├── TicketDescription.tsx
│   │   │   └── TicketMetadata.tsx
│   │   └── index.tsx
│   └── settings/                  # Basic settings panel
│       ├── App.tsx
│       └── index.tsx
│
├── pro/                           # Premium webview apps
│   ├── standup-builder/           # AI-powered standup builder
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ModeSelector.tsx
│   │   │   ├── TicketSelector.tsx
│   │   │   ├── StandupForm.tsx
│   │   │   ├── CommitsAndFiles.tsx
│   │   │   ├── ProgressIndicator.tsx
│   │   │   └── ResultsDisplay.tsx
│   │   └── index.tsx
│   ├── pr-summary/                # PR summary generator
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── PRAnalysis.tsx
│   │   │   ├── PackageDetector.tsx
│   │   │   └── SummaryEditor.tsx
│   │   └── index.tsx
│   ├── analytics/                 # Analytics dashboard
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── VelocityChart.tsx
│   │   │   ├── BranchMetrics.tsx
│   │   │   └── TeamInsights.tsx
│   │   └── index.tsx
│   └── advanced-ticket-panel/     # Enhanced ticket details
│       ├── App.tsx
│       ├── components/
│       │   ├── ... (all current ticket-panel components)
│       │   ├── AIAssistant.tsx
│       │   └── WorkflowAutomation.tsx
│       └── index.tsx
│
├── shared/                        # Shared React components
│   ├── components/                # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── TextArea.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── ProBadge.tsx           # NEW: Pro feature indicator
│   ├── hooks/
│   │   ├── useVSCode.ts
│   │   ├── useLicense.ts          # NEW: License status hook
│   │   └── useFeatureGate.ts      # NEW: Feature gating hook
│   └── types/
│       ├── messages.ts
│       └── license.ts             # NEW: License types
│
├── linear/                        # Linear-specific webviews
│   └── ... (platform-specific if needed)
│
└── jira/                          # Jira-specific webviews
    └── ... (platform-specific if needed)
```

## Path Aliases

### Extension (tsconfig.json)

```json
{
  "baseUrl": "./src",
  "paths": {
    "@core/*": ["core/*"],
    "@pro/*": ["pro/*"],
    "@shared/*": ["shared/*"],
    "@providers/*": ["providers/*"],
    "@commands/*": ["commands/*"],
    "@chat/*": ["chat/*"],
    "@utils/*": ["utils/*"],
    "@views/*": ["views/*"]
  }
}
```

### Webviews (webview-ui/tsconfig.json)

```json
{
  "baseUrl": "./src",
  "paths": {
    "@shared/*": ["shared/*"],
    "@core/*": ["core/*"],
    "@pro/*": ["pro/*"],
    "@linear/*": ["linear/*"],
    "@jira/*": ["jira/*"]
  }
}
```

## Feature Gating

### Implementation Pattern

```typescript
// src/pro/licensing/featureGating.ts
import * as vscode from 'vscode';
import { LicenseManager } from './licenseManager';

export enum Feature {
  // Pro Features
  AI_PR_SUMMARY = 'ai.prSummary',
  AI_STANDUP = 'ai.standup',
  AI_CODE_REVIEW = 'ai.codeReview',
  TODO_CONVERTER = 'advanced.todoConverter',
  BRANCH_ANALYTICS = 'analytics.branches',
  BULK_OPERATIONS = 'advanced.bulkOps',
  CUSTOM_WORKFLOWS = 'automation.customWorkflows',
  SLACK_INTEGRATION = 'integrations.slack',
  
  // Core Features (always enabled)
  BASIC_TICKETS = 'core.tickets',
  BASIC_BRANCHES = 'core.branches',
  BASIC_CHAT = 'core.chat',
}

export class FeatureGate {
  private static licenseManager: LicenseManager;

  static initialize(context: vscode.ExtensionContext) {
    this.licenseManager = new LicenseManager(context);
  }

  /**
   * Check if a feature is available to the user
   */
  static async isFeatureAvailable(feature: Feature): Promise<boolean> {
    // Core features are always available
    if (feature.startsWith('core.')) {
      return true;
    }

    // Pro features require license
    const license = await this.licenseManager.getLicense();
    return license.isValid && !license.isExpired;
  }

  /**
   * Execute a command with feature gating
   */
  static async executeIfAvailable(
    feature: Feature,
    action: () => Promise<void>,
    onBlocked?: () => void
  ): Promise<void> {
    const available = await this.isFeatureAvailable(feature);
    
    if (available) {
      await action();
    } else {
      // Show upgrade prompt
      const choice = await vscode.window.showInformationMessage(
        `${this.getFeatureName(feature)} is a Pro feature. Upgrade to DevBuddy Pro to unlock it!`,
        'Learn More',
        'Start Trial',
        'Cancel'
      );

      if (choice === 'Learn More') {
        vscode.env.openExternal(vscode.Uri.parse('https://devbuddy.dev/pro'));
      } else if (choice === 'Start Trial') {
        await vscode.commands.executeCommand('devBuddy.startProTrial');
      }

      if (onBlocked) {
        onBlocked();
      }
    }
  }

  private static getFeatureName(feature: Feature): string {
    const names: Record<Feature, string> = {
      [Feature.AI_PR_SUMMARY]: 'AI PR Summary',
      [Feature.AI_STANDUP]: 'AI Standup Generator',
      [Feature.AI_CODE_REVIEW]: 'AI Code Review',
      [Feature.TODO_CONVERTER]: 'TODO to Ticket Converter',
      [Feature.BRANCH_ANALYTICS]: 'Branch Analytics',
      [Feature.BULK_OPERATIONS]: 'Bulk Operations',
      [Feature.CUSTOM_WORKFLOWS]: 'Custom Workflows',
      [Feature.SLACK_INTEGRATION]: 'Slack Integration',
      [Feature.BASIC_TICKETS]: 'Basic Tickets',
      [Feature.BASIC_BRANCHES]: 'Basic Branches',
      [Feature.BASIC_CHAT]: 'Basic Chat',
    };
    return names[feature] || feature;
  }
}
```

### Usage Example

```typescript
// In a command file (e.g., src/pro/commands/ai/generatePRSummary.ts)
import { FeatureGate, Feature } from '@pro/licensing/featureGating';

export async function generatePRSummaryCommand() {
  await FeatureGate.executeIfAvailable(
    Feature.AI_PR_SUMMARY,
    async () => {
      // Execute the actual PR summary logic
      const summary = await generatePRSummary();
      // ... show results
    }
  );
}
```

### Webview Feature Gating

```typescript
// webview-ui/src/shared/hooks/useLicense.ts
import { useEffect, useState } from 'react';
import { useVSCode } from './useVSCode';

export interface License {
  type: 'free' | 'pro' | 'trial';
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: Date;
  features: string[];
}

export function useLicense() {
  const vscode = useVSCode();
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Request license status from extension
    vscode.postMessage({ command: 'getLicense' });

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'licenseStatus') {
        setLicense(message.license);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { license, loading, isPro: license?.type === 'pro' };
}

// webview-ui/src/shared/hooks/useFeatureGate.ts
import { useLicense } from './useLicense';

export function useFeatureGate(feature: string): [boolean, () => void] {
  const { license, isPro } = useLicense();
  const vscode = useVSCode();

  const isAvailable = isPro || feature.startsWith('core.');

  const showUpgrade = () => {
    vscode.postMessage({
      command: 'showUpgradePrompt',
      feature,
    });
  };

  return [isAvailable, showUpgrade];
}
```

### Using Feature Gate in React

```typescript
// Example: Pro feature button
import { useFeatureGate } from '@shared/hooks/useFeatureGate';
import { ProBadge } from '@shared/components/ProBadge';

function StandupBuilder() {
  const [canUseStandup, showUpgrade] = useFeatureGate('ai.standup');

  const handleGenerateStandup = () => {
    if (canUseStandup) {
      // Generate standup
    } else {
      showUpgrade();
    }
  };

  return (
    <div>
      <button onClick={handleGenerateStandup}>
        Generate Standup
        {!canUseStandup && <ProBadge />}
      </button>
    </div>
  );
}
```

## Migration Strategy

### Phase 1: Infrastructure Setup ✅ (Current)
- [x] Set up path aliases in tsconfig.json (extension & webviews)
- [x] Configure ESLint for the project
- [x] Update build scripts
- [x] Document proposed structure

### Phase 2: Create Directory Structure
- [ ] Create `src/core/`, `src/pro/`, directory structure
- [ ] Create `webview-ui/src/core/`, `webview-ui/src/pro/` structure
- [ ] Implement license management system in `src/pro/licensing/`
- [ ] Add feature gating infrastructure

### Phase 3: Migrate Core Features
- [ ] Move basic ticket management to `src/core/commands/tickets/`
- [ ] Move basic branch operations to `src/core/commands/branches/`
- [ ] Move Linear/Jira basic clients to `src/core/providers/`
- [ ] Update imports to use path aliases

### Phase 4: Migrate Pro Features
- [ ] Move AI features to `src/pro/commands/ai/`
- [ ] Move standup builder to `src/pro/commands/ai/`
- [ ] Move TODO converter to `src/pro/commands/advanced/`
- [ ] Move analytics to `src/pro/commands/analytics/`
- [ ] Add feature gates to all pro commands

### Phase 5: Update Webviews
- [ ] Split ticket panel into core and pro versions
- [ ] Move standup builder to `webview-ui/src/pro/`
- [ ] Add license status indicators to UI
- [ ] Implement feature gating in React components

### Phase 6: Testing & Documentation
- [ ] Test all core features without license
- [ ] Test all pro features with valid license
- [ ] Test trial functionality
- [ ] Update user documentation
- [ ] Update AGENTS.md with new architecture

### Phase 7: Cleanup
- [ ] Remove legacy directories (`src/commands/`, `src/providers/`, etc.)
- [ ] Update all imports project-wide
- [ ] Remove deprecated code
- [ ] Run full validation (`npm run validate`)

## Benefits of This Architecture

1. **Clear Separation**: Core vs Pro features are organizationally distinct
2. **Easy Maintenance**: Features grouped by license tier
3. **Scalable**: Easy to add new pro features
4. **Clean Imports**: Path aliases make code more readable
5. **Feature Gating**: Centralized control over pro features
6. **Better UX**: Clear indicators of what's free vs pro
7. **Future-Proof**: Easy to add more license tiers (e.g., Team, Enterprise)

## Example: Converting Existing Feature to Pro

Let's say we want to make the "Generate PR Summary" feature Pro-only:

### Before (Current Structure)

```typescript
// src/commands/generatePRSummary.ts
export async function generatePRSummaryCommand() {
  // Implementation
}

// src/extension.ts
context.subscriptions.push(
  vscode.commands.registerCommand(
    'devBuddy.generatePRSummary',
    generatePRSummaryCommand
  )
);
```

### After (Pro Structure)

```typescript
// src/pro/commands/ai/generatePRSummary.ts
import { FeatureGate, Feature } from '@pro/licensing/featureGating';

export async function generatePRSummaryCommand() {
  await FeatureGate.executeIfAvailable(
    Feature.AI_PR_SUMMARY,
    async () => {
      // Existing implementation
    }
  );
}

// src/extension.ts
import { generatePRSummaryCommand } from '@pro/commands/ai/generatePRSummary';

context.subscriptions.push(
  vscode.commands.registerCommand(
    'devBuddy.generatePRSummary',
    generatePRSummaryCommand
  )
);
```

That's it! The feature is now gated and will show an upgrade prompt to free users.

## Testing Strategy

### Manual Testing
1. Test with no license (free tier)
   - Core features should work
   - Pro features should show upgrade prompt
2. Test with valid pro license
   - All features should work
3. Test with expired license
   - Should revert to free tier behavior

### Automated Testing (Future)
- Unit tests for license validation
- Integration tests for feature gating
- E2E tests for upgrade flows

---

## Notes

- **Backward Compatibility**: During migration, keep legacy imports working until full migration is complete
- **Incremental Migration**: Migrate one feature at a time, test thoroughly
- **Documentation**: Update all docs as features move
- **User Communication**: Announce pro tier in advance, offer trial period
- **Telemetry**: Track feature usage to understand what users value most

