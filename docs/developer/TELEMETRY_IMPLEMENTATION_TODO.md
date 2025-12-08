# Telemetry Implementation TODO

## Current Status: ⚠️ Minimal Tracking

Currently only tracking:
- ✅ `extension_activated`

Missing 90%+ of valuable metrics!

---

## Priority 1: Command Tracking (High Impact) 🎯

### Files to Modify

#### `src/extension.ts` - Add to each command registration

```typescript
// Example for generatePRSummary
vscode.commands.registerCommand("devBuddy.generatePRSummary", async () => {
  const telemetry = getTelemetryManager();
  const startTime = Date.now();
  
  try {
    await generatePRSummaryCommand();
    
    // Track success
    await telemetry.trackCommand("generatePRSummary", true);
    await telemetry.trackPerformance("generatePRSummary", Date.now() - startTime);
  } catch (error) {
    // Track failure
    await telemetry.trackCommand("generatePRSummary", false);
    await telemetry.trackError("command_error", error.message, "generatePRSummary");
    throw error;
  }
});
```

**Commands to track:**
- [ ] `devBuddy.generatePRSummary`
- [ ] `devBuddy.generateStandup`
- [ ] `devBuddy.openStandupBuilder`
- [ ] `devBuddy.convertTodoToTicket`
- [ ] `devBuddy.refreshTickets`
- [ ] `devBuddy.createTicket`
- [ ] `devBuddy.updateTicketStatus`
- [ ] `devBuddy.viewTicket`
- [ ] `devBuddy.openTicketInBrowser`
- [ ] `devBuddy.copyTicketLink`
- [ ] `devBuddy.linear.setup` (or `devBuddy.jira.setup`)
- [ ] `devBuddy.manageBranches`

**Time estimate:** 30 minutes

---

## Priority 2: Platform Selection & Setup (Critical Business Metrics) 📊

### Files to Modify

#### `src/providers/linear/firstTimeSetup.ts`

```typescript
// At the end of successful setup
telemetry.trackFeatureUsage("setup_completed", {
  platform: "linear",
  hasApiToken: true,
  hasOrganization: !!organizationSlug
});
```

#### `src/providers/jira/firstTimeSetup.ts`

```typescript
// At the end of successful setup
telemetry.trackFeatureUsage("setup_completed", {
  platform: "jira",
  type: "cloud" | "server",
  hasCredentials: true
});
```

#### `src/extension.ts` - Track platform switching

```typescript
// When provider setting changes
const config = vscode.workspace.getConfiguration("devBuddy");
config.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration("devBuddy.provider")) {
    const newProvider = config.get<string>("provider");
    telemetry.trackFeatureUsage("platform_switched", {
      platform: newProvider
    });
  }
});
```

**Time estimate:** 15 minutes

---

## Priority 3: AI Feature Usage (Key Differentiator) 🤖

### Files to Modify

#### `src/shared/ai/aiSummarizer.ts`

```typescript
// In generatePRSummary method
public async generatePRSummary(...) {
  const telemetry = getTelemetryManager();
  const startTime = Date.now();
  
  try {
    // Get AI model
    const model = await this.getLanguageModel();
    const modelId = model?.id || "none";
    
    // Generate summary
    const result = await model.sendRequest(...);
    
    // Track success
    await telemetry.trackFeatureUsage("ai_summary_generated", {
      model: modelId,
      context: "pr",
      success: true,
      fallbackUsed: false
    });
    
    await telemetry.trackPerformance("ai_summary_generation", Date.now() - startTime, {
      model: modelId,
      context: "pr"
    });
    
    return result;
  } catch (error) {
    // Track failure
    await telemetry.trackFeatureUsage("ai_summary_generated", {
      model: "unknown",
      context: "pr",
      success: false,
      fallbackUsed: false
    });
    
    await telemetry.trackError("ai_error", error.message, "pr_summary");
    throw error;
  }
}
```

#### `src/shared/ai/fallbackSummarizer.ts`

```typescript
// When fallback is used
public async generateSummary(...) {
  const telemetry = getTelemetryManager();
  
  await telemetry.trackFeatureUsage("ai_summary_generated", {
    model: "fallback",
    context: "pr",
    success: true,
    fallbackUsed: true
  });
  
  // ... rest of implementation
}
```

**Time estimate:** 20 minutes

---

## Priority 4: Error Tracking (Critical for Debugging) ❌

### Files to Modify

#### `src/providers/linear/LinearClient.ts`

```typescript
// In catch blocks
catch (error) {
  const telemetry = getTelemetryManager();
  await telemetry.trackError("api_error", error.message, "linear_api");
  throw error;
}
```

#### `src/providers/jira/JiraClient.ts`

```typescript
// In catch blocks
catch (error) {
  const telemetry = getTelemetryManager();
  await telemetry.trackError("api_error", error.message, "jira_api");
  throw error;
}
```

#### `src/shared/git/gitAnalyzer.ts`

```typescript
// In catch blocks
catch (error) {
  const telemetry = getTelemetryManager();
  await telemetry.trackError("git_error", error.message, "git_analyzer");
  throw error;
}
```

**Time estimate:** 30 minutes

---

## Priority 5: Ticket Operations (Business Metrics) 🎫

### Files to Modify

#### `src/providers/linear/LinearClient.ts`

```typescript
// In createIssue
async createIssue(data: CreateIssueInput) {
  const telemetry = getTelemetryManager();
  const startTime = Date.now();
  
  try {
    const issue = await this.request(...);
    
    await telemetry.trackFeatureUsage("ticket_created", {
      platform: "linear",
      hasDescription: !!data.description,
      hasPriority: data.priority !== undefined
    });
    
    await telemetry.trackPerformance("ticket_create", Date.now() - startTime);
    
    return issue;
  } catch (error) {
    await telemetry.trackError("ticket_create_failed", error.message, "linear");
    throw error;
  }
}

// In updateIssue
async updateIssue(id: string, data: UpdateIssueInput) {
  const telemetry = getTelemetryManager();
  
  try {
    const issue = await this.request(...);
    
    await telemetry.trackFeatureUsage("ticket_updated", {
      platform: "linear",
      fieldsUpdated: Object.keys(data).join(",")
    });
    
    return issue;
  } catch (error) {
    await telemetry.trackError("ticket_update_failed", error.message, "linear");
    throw error;
  }
}
```

**Repeat for Jira client**

**Time estimate:** 25 minutes

---

## Priority 6: Chat Participant Usage 💬

### Files to Modify

#### `src/chat/devBuddyParticipant.ts`

```typescript
// In handleRequest method
async handleRequest(request, context, stream, token) {
  const telemetry = getTelemetryManager();
  
  await telemetry.trackFeatureUsage("chat_participant_used", {
    participant: "@devbuddy",
    prompt: request.prompt.substring(0, 50), // Sanitized
    hasLinearAccess: !!linearClient
  });
  
  // ... rest of implementation
}
```

**Time estimate:** 10 minutes

---

## Priority 7: Performance Metrics ⚡

### Key Operations to Track

```typescript
// API calls
telemetry.trackPerformance("linear_fetch_issues", duration, {
  issueCount: issues.length
});

// Git operations
telemetry.trackPerformance("git_get_commits", duration, {
  commitCount: commits.length,
  timeWindow: "24h"
});

// Webview load times
telemetry.trackPerformance("webview_open", duration, {
  view: "ticket_panel" | "standup_builder"
});
```

**Time estimate:** 40 minutes

---

## Priority 8: User Engagement 👥

### Files to Modify

#### `src/extension.ts`

```typescript
// Track activation time
export async function activate(context: vscode.ExtensionContext) {
  const activationStart = Date.now();
  
  // ... existing code ...
  
  telemetry.trackPerformance("extension_activation", Date.now() - activationStart);
  
  // Track session
  telemetry.trackEvent("session_start", {
    provider: config.get("provider"),
    aiEnabled: !config.get("ai.disabled")
  });
}

// Track deactivation
export function deactivate() {
  telemetry?.trackEvent("session_end");
}
```

#### `src/views/LinearTicketsProvider.ts`

```typescript
// When tree view is refreshed
async refresh() {
  const telemetry = getTelemetryManager();
  const startTime = Date.now();
  
  const tickets = await this.fetchTickets();
  
  await telemetry.trackFeatureUsage("tree_view_refreshed", {
    platform: "linear",
    ticketCount: tickets.length
  });
  
  await telemetry.trackPerformance("tree_view_refresh", Date.now() - startTime);
}
```

**Time estimate:** 30 minutes

---

## Summary

**Total Implementation Time:** ~3.5 hours

**Impact:**
- 📊 Understand which features users actually use
- 🐛 Catch errors early
- ⚡ Identify performance bottlenecks
- 🎯 Make data-driven product decisions
- 💰 Track business metrics (platform adoption, AI usage)

---

## Quick Win (15 minutes)

Just add command tracking to your top 5 commands:

1. `generatePRSummary`
2. `generateStandup`
3. `convertTodoToTicket`
4. `refreshTickets`
5. Platform setup commands

This alone will give you 80% of the value!

---

## Azure Queries to Run After Implementation

```kusto
// Most used commands
customEvents
| where name == "command_executed"
| summarize count() by tostring(customDimensions.command)
| order by count_ desc

// Platform distribution
customEvents
| where name == "setup_completed"
| summarize count() by tostring(customDimensions.platform)

// AI adoption
customEvents
| where name == "ai_summary_generated"
| summarize 
    total = count(),
    fallback = countif(tostring(customDimensions.fallbackUsed) == "true"),
    success = countif(tostring(customDimensions.success) == "true")
| extend fallback_rate = (fallback * 100.0 / total)

// Error rate
customEvents
| where name == "command_executed"
| summarize 
    total = count(),
    failures = countif(tostring(customDimensions.success) == "false")
| extend error_rate = (failures * 100.0 / total)

// Performance (P95)
customEvents
| where name == "performance_metric"
| summarize percentile(todouble(customMeasurements.durationMs), 95) 
    by tostring(customDimensions.operation)
```

---

**Start with Priority 1 (Command Tracking) - it's the quickest win!**

