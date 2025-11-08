# Personal Analytics Implementation Plan

## Vision

Build a **Personal Performance Coach** into Linear Buddy that helps engineers:
- Identify productivity patterns before they become problems
- Make informed decisions about capacity and commitments
- Improve estimation skills through feedback loops
- Advocate for themselves with data, not feelings
- Track professional growth over time

**Core Principle:** All data is private, local, and owned by the engineer.

---

## Architecture Overview

### Data Flow

```
Linear API + Git History
    ↓
Data Collection Layer (Background)
    ↓
Storage Layer (VS Code GlobalState)
    ↓
Analytics Engine (Calculation/Analysis)
    ↓
Presentation Layer (Commands, Webviews, Tree View)
```

### Storage Strategy

**VS Code Global State** (persists across sessions, syncs with Settings Sync):
```typescript
{
  "linearBuddy.analytics.snapshots": TicketSnapshot[],
  "linearBuddy.analytics.stateTransitions": StateTransition[],
  "linearBuddy.analytics.completions": CompletionRecord[],
  "linearBuddy.analytics.workSessions": WorkSession[],
  "linearBuddy.analytics.metadata": {
    lastSnapshot: timestamp,
    dataVersion: "1.0.0",
    retentionDays: 90
  }
}
```

**Privacy First:**
- All data stored locally in VS Code
- No external servers or databases
- Syncs only if user has Settings Sync enabled
- Can be cleared anytime
- Export/import for portability

---

## Data Models

### Core Data Structures

```typescript
// Daily snapshot of ticket state
interface TicketSnapshot {
  timestamp: number;
  tickets: {
    total: number;
    inProgress: number;
    todo: number;
    backlog: number;
    completed: number;
    byPriority: Record<Priority, number>;
    byState: Record<string, number>;
  };
}

// When tickets change state
interface StateTransition {
  ticketId: string;
  ticketIdentifier: string;
  ticketTitle: string;
  fromState: string;
  toState: string;
  timestamp: number;
  timeInPreviousState?: number; // milliseconds
}

// When tickets are completed
interface CompletionRecord {
  ticketId: string;
  ticketIdentifier: string;
  ticketTitle: string;
  estimate?: number;
  priority: number;
  completedAt: number;
  createdAt: number;
  startedAt?: number; // when moved to "In Progress"
  totalCycleTime: number; // createdAt → completedAt
  activeTime?: number; // startedAt → completedAt
  commits?: number;
  filesChanged?: number;
}

// Work session tracking
interface WorkSession {
  date: string; // YYYY-MM-DD
  ticketIds: string[];
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  packagesAffected: string[];
}

// Calculated analytics (cached)
interface AnalyticsCache {
  velocity: {
    daily: number;
    weekly: number;
    monthly: number;
    trend: 'up' | 'down' | 'stable';
  };
  cycleTime: {
    average: number;
    median: number;
    p95: number;
    trend: 'improving' | 'degrading' | 'stable';
  };
  capacity: {
    sustainableInProgress: number;
    currentInProgress: number;
    status: 'healthy' | 'warning' | 'overloaded';
  };
  estimation: {
    accuracyPercent: number;
    typicalMultiplier: number;
    improvementTrend: 'improving' | 'stable' | 'degrading';
  };
  lastCalculated: number;
}
```

---

## Phase 1: Foundation (Week 1-2)

**Goal:** Set up data collection and storage infrastructure

### Tasks

#### 1.1 Create Analytics Manager
**File:** `src/utils/analyticsManager.ts`

```typescript
export class AnalyticsManager {
  constructor(private context: vscode.ExtensionContext) {}
  
  // Data collection
  async captureSnapshot(tickets: LinearTicket[]): Promise<void>
  async recordStateTransition(ticket: LinearTicket, oldState: string, newState: string): Promise<void>
  async recordCompletion(ticket: LinearTicket): Promise<void>
  async captureWorkSession(): Promise<void>
  
  // Data retrieval
  async getSnapshots(days?: number): Promise<TicketSnapshot[]>
  async getStateTransitions(ticketId?: string): Promise<StateTransition[]>
  async getCompletions(days?: number): Promise<CompletionRecord[]>
  async getWorkSessions(days?: number): Promise<WorkSession[]>
  
  // Maintenance
  async pruneOldData(retentionDays: number): Promise<void>
  async clearAllData(): Promise<void>
  async exportData(): Promise<string> // JSON export
  async importData(json: string): Promise<void>
}
```

#### 1.2 Integrate Data Collection

**Locations to add data capture:**

1. **Tree View Refresh** (`linearTicketsProvider.ts`)
   - Capture snapshot after fetching tickets
   - Compare with previous state to detect transitions
   
2. **Status Updates** (when user changes ticket status)
   - Record state transition
   - If moved to "Done", record completion
   
3. **Daily Timer** (background job)
   - Capture work session from git history
   - Run every 24 hours or on workspace open

#### 1.3 Add Configuration

**In `package.json`:**

```json
{
  "linearBuddy.analytics.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable personal analytics tracking (all data stored locally)"
  },
  "linearBuddy.analytics.retentionDays": {
    "type": "number",
    "default": 90,
    "description": "How many days of analytics data to keep"
  },
  "linearBuddy.analytics.captureWorkSessions": {
    "type": "boolean",
    "default": true,
    "description": "Track git commits for work session analysis"
  }
}
```

#### 1.4 Testing

- Test data persistence across VS Code restarts
- Test data pruning (retention)
- Test with large datasets (1000+ tickets)
- Test export/import

**Deliverables:**
- ✅ AnalyticsManager class
- ✅ Data collection integrated
- ✅ Configuration options
- ✅ Unit tests for core functions

---

## Phase 2: Analytics Engine (Week 3-4)

**Goal:** Calculate meaningful insights from collected data

### Tasks

#### 2.1 Create Analytics Calculator
**File:** `src/utils/analyticsCalculator.ts`

```typescript
export class AnalyticsCalculator {
  constructor(private analyticsManager: AnalyticsManager) {}
  
  // Velocity calculations
  async calculateVelocity(days: number): Promise<VelocityMetrics>
  async calculateVelocityTrend(days: number): Promise<TrendData>
  
  // Cycle time analysis
  async calculateCycleTime(days: number): Promise<CycleTimeMetrics>
  async analyzeCycleTimeByPriority(): Promise<Map<Priority, number>>
  async identifySlowestTickets(): Promise<CompletionRecord[]>
  
  // Capacity analysis
  async calculateSustainableCapacity(): Promise<CapacityMetrics>
  async detectOvercommitment(): Promise<OvercommitmentWarning | null>
  async analyzeContextSwitching(days: number): Promise<ContextSwitchMetrics>
  
  // Estimation analysis
  async calculateEstimationAccuracy(): Promise<EstimationMetrics>
  async calculateEstimationMultiplier(): Promise<number>
  async trackEstimationImprovement(): Promise<ImprovementTrend>
  
  // Work patterns
  async analyzeWorkPatterns(days: number): Promise<WorkPatternMetrics>
  async identifyPeakProductivity(): Promise<ProductivityPattern>
  async analyzeFocusAreas(days: number): Promise<FocusAreaBreakdown>
  
  // Warnings and insights
  async generateWarnings(): Promise<Warning[]>
  async generateInsights(days: number): Promise<Insight[]>
  async generateRecommendations(): Promise<Recommendation[]>
}
```

#### 2.2 Key Calculations

**Velocity:**
```typescript
- Tickets completed per day/week/month
- Trend over time (improving/stable/degrading)
- By priority (how many P0 vs P3)
- Moving average (7-day, 30-day)
```

**Cycle Time:**
```typescript
- Average time from creation to completion
- Average time from "In Progress" to "Done" (active time)
- Median, P50, P95 percentiles
- By priority and estimate
- Trend over time
```

**Capacity:**
```typescript
- Sustainable concurrent tickets (sweet spot)
- Current in-progress count
- Health status (healthy/warning/overloaded)
- Context switch frequency
```

**Estimation:**
```typescript
- Estimated vs actual time (where actual = cycle time)
- Accuracy percentage
- Multiplier to apply to future estimates
- Improvement trend over time
```

**Work Patterns:**
```typescript
- Commits by day of week
- Commits by time of day (if git timestamps available)
- Most productive day/time
- Focus areas (which packages/files)
- Sprint velocity (if using sprints)
```

#### 2.3 Warning System

**Warnings to detect:**

```typescript
interface Warning {
  type: 'overcommitment' | 'stuck_ticket' | 'context_switching' | 'estimation_drift' | 'velocity_drop';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data: any;
  recommendation: string;
}
```

**Examples:**
- ⚠️ **Overcommitment:** 7 tickets in progress (your sustainable: 3)
- ⚠️ **Stuck Ticket:** "API refactor" in progress for 8 days (your avg: 3)
- ⚠️ **Context Switching:** Touched 8 tickets this week (completed: 1)
- ⚠️ **Estimation Drift:** Last 5 tickets took 3x longer than estimated
- ⚠️ **Velocity Drop:** Completed 2 tickets this week (your avg: 5)

#### 2.4 Insight Generator

**Insights to surface:**

```typescript
interface Insight {
  category: 'celebration' | 'pattern' | 'learning' | 'trend';
  title: string;
  description: string;
  data?: any;
}
```

**Examples:**
- 🎉 **Celebration:** You completed 12 tickets this week - your best week!
- 📊 **Pattern:** Your Tuesday velocity is 2x higher than Monday
- 💡 **Learning:** Your estimation accuracy improved from 45% → 78%
- 📈 **Trend:** Velocity up 35% over last quarter

**Deliverables:**
- ✅ AnalyticsCalculator class
- ✅ All core calculations implemented
- ✅ Warning detection system
- ✅ Insight generation
- ✅ Unit tests with mock data

---

## Phase 3: UI - Commands & Quick View (Week 5)

**Goal:** Make analytics accessible via simple commands

### Tasks

#### 3.1 Quick Insights Command

**Command:** `linearBuddy.showQuickInsights`

**UI:** Show pick with top insights, open detailed view on selection

```typescript
// Quick pick items
📊 Velocity: 3.2 tickets/week (↑ 15% vs last month)
⏱️ Cycle Time: 4.2 days average (↓ improving)
🎯 In Progress: 3 tickets (✓ healthy)
⚠️ Warning: 1 ticket stuck for 8 days
💡 Insight: Your Tuesday velocity is 2x Monday

// Select one to see details
```

#### 3.2 Weekly Summary Command

**Command:** `linearBuddy.showWeeklySummary`

**UI:** Markdown preview with formatted summary

```markdown
# Your Week in Review (Nov 1-7)

## 📊 Productivity
- **Completed:** 5 tickets
- **Velocity:** 5 tickets/week (your avg: 3.2)
- **Trend:** ↑ 56% above your average - great week!

## ✅ Completed Tickets
- [ENG-123] Auth refactor (3 days) ⚡ Fast
- [ENG-125] Add video player (5 days)
- [ENG-127] Fix login bug (1 day) ⚡ Fast
- [ENG-129] Update docs (2 days)
- [ENG-131] API endpoint (4 days)

## ⏱️ Cycle Time
- **Average:** 3.0 days (↓ improved)
- **Fastest:** ENG-127 (1 day)
- **Slowest:** ENG-125 (5 days)

## 🎯 Current Work
- **In Progress:** 2 tickets
- **Status:** ✓ Healthy capacity

## 💡 Insights
- Your velocity this week was exceptional!
- You're getting faster - cycle time down 30%
- All tickets completed within your normal range

## 🎉 Wins
- 5 tickets completed (personal best!)
- No stuck tickets
- Healthy work-life balance (no weekend commits)
```

#### 3.3 Monthly Report Command

**Command:** `linearBuddy.showMonthlyReport`

Similar to weekly but with:
- Month-over-month trends
- Velocity graph (ASCII or simple)
- Top achievements
- Areas for improvement

#### 3.4 Capacity Check Command

**Command:** `linearBuddy.checkCapacity`

**UI:** Quick info notification + pick for details

```typescript
// Notification
✅ Healthy: 3 tickets in progress (your sustainable: 2-4)

// Or warning
⚠️ Overloaded: 7 tickets in progress (your sustainable: 2-4)
Recommendation: Focus on finishing before starting new work
```

#### 3.5 Tree View Integration

**Add analytics section to sidebar:**

```
LINEAR TICKETS
├─ 📊 Personal Analytics
│  ├─ Velocity: 3.2/week (↑ 15%)
│  ├─ Cycle Time: 4.2 days (↓ improving)
│  ├─ In Progress: 3 (✓ healthy)
│  └─ ⚠️ 1 Warning
├─ In Progress (3)
├─ Todo (5)
└─ Backlog (12)
```

**Click to expand warnings/insights inline**

**Deliverables:**
- ✅ 5 new commands
- ✅ Tree view analytics section
- ✅ Markdown formatting helpers
- ✅ ASCII graph generator (optional)

---

## Phase 4: UI - Analytics Dashboard Webview (Week 6-7)

**Goal:** Rich visual analytics dashboard

### Tasks

#### 4.1 Create Analytics Webview

**File:** `src/views/analyticsPanel.ts`

```typescript
export class AnalyticsPanel {
  public static currentPanel: AnalyticsPanel | undefined;
  
  public static createOrShow(extensionUri: vscode.Uri) {
    // Singleton webview panel
  }
  
  private async _update() {
    // Fetch all analytics data
    // Send to webview
  }
}
```

#### 4.2 Create React Dashboard

**File:** `webview-ui/src/analytics-dashboard/App.tsx`

**Sections:**

1. **Overview (Top)**
   - Key metrics cards (velocity, cycle time, capacity)
   - Status indicators (healthy/warning)
   - Warnings (if any)

2. **Velocity Tab**
   - Tickets completed over time (line chart)
   - Moving average overlay
   - Breakdown by priority
   - Trend indicator

3. **Cycle Time Tab**
   - Average cycle time over time
   - Distribution histogram
   - By priority comparison
   - Fastest/slowest tickets list

4. **Capacity Tab**
   - Current in-progress count vs sustainable
   - Context switching analysis
   - Work session patterns
   - Recommendations

5. **Estimation Tab**
   - Accuracy over time
   - Estimated vs actual scatter plot
   - Multiplier recommendation
   - Recent estimation performance

6. **Insights Tab**
   - All insights and warnings
   - Recommendations
   - Celebrations
   - Action items

#### 4.3 Charts & Visualizations

**Options:**
1. **CSS-only charts** (simplest, matches VS Code theme)
2. **Chart.js** (full-featured, medium weight)
3. **Recharts** (React-friendly, heavier)

**Recommendation:** Start with CSS-only, add Chart.js if needed

**CSS Chart Examples:**
```css
/* Simple bar chart */
.bar {
  height: 20px;
  background: var(--vscode-button-background);
  width: calc(var(--value) * 1%);
}

/* Line chart with CSS grid */
.line-chart {
  display: grid;
  grid-template-columns: repeat(30, 1fr);
  height: 100px;
  align-items: end;
}
```

#### 4.4 Time Range Selector

**Options:** 7 days, 30 days, 90 days, All time

Update all charts/metrics based on selection

#### 4.5 Export Functionality

**Features:**
- Export as JSON (for backup)
- Export as Markdown (for sharing/reports)
- Copy specific insights to clipboard
- Generate performance review summary

**Deliverables:**
- ✅ Analytics webview panel
- ✅ React dashboard app
- ✅ 6 tabs with visualizations
- ✅ Export functionality
- ✅ Responsive design

---

## Phase 5: Smart Features (Week 8)

**Goal:** Proactive intelligence and automation

### Tasks

#### 5.1 Automatic Warning Notifications

**Show VS Code notifications for:**
- ⚠️ Ticket stuck for > 2x average cycle time
- ⚠️ In-progress count > sustainable capacity
- ⚠️ High context switching detected
- ⚠️ Velocity drop > 50% from average

**Settings:**
```json
{
  "linearBuddy.analytics.notifications": {
    "enabled": true,
    "warningThreshold": "warning" // info | warning | critical
  }
}
```

#### 5.2 Inline Ticket Warnings

**In tree view, show icons on tickets:**
- 🐌 Slow ticket (> 2x avg cycle time)
- 🔄 Context switch risk (touched but not progressed)
- ⏰ Approaching estimate (if estimated)

**In ticket detail panel:**
```
⚠️ This ticket has been in progress for 8 days
📊 Your average cycle time: 3 days
💡 Consider: Break into smaller tasks? Ask for help?
```

#### 5.3 Smart Commit Message

**When committing, suggest including cycle time:**

```
feat: add video player (ENG-125)

Completed in 5 days (your avg: 4 days)
```

#### 5.4 Capacity-Aware Commands

**When user tries to start a new ticket:**

```typescript
// Before starting
if (inProgressCount >= sustainableCapacity) {
  const result = await vscode.window.showWarningMessage(
    `You have ${inProgressCount} tickets in progress (your sustainable: ${sustainableCapacity}). ` +
    `Consider finishing one before starting this ticket.`,
    'Start Anyway',
    'Pick Different Ticket',
    'View Analytics'
  );
}
```

#### 5.5 Sprint Planning Helper

**Command:** `linearBuddy.planSprint`

```typescript
// Based on historical velocity
Your typical velocity: 3.2 tickets/week
Sprint length: 2 weeks
Recommended capacity: 6-7 tickets

Current sprint backlog: 12 tickets ⚠️
Recommendation: Remove 5-6 tickets to match capacity
```

**Deliverables:**
- ✅ Notification system
- ✅ Inline warnings
- ✅ Smart commit suggestions
- ✅ Capacity-aware commands
- ✅ Sprint planning helper

---

## Phase 6: Polish & Documentation (Week 9)

**Goal:** Production-ready feature

### Tasks

#### 6.1 Onboarding

**Add to walkthrough:**
- Explain analytics feature
- Show how to view insights
- Explain privacy (all local)
- How to disable if not wanted

**First-time setup:**
```
🎉 Welcome to Personal Analytics!

Linear Buddy will now track your productivity patterns to help you:
✓ Identify when you're overcommitted
✓ Learn to estimate accurately
✓ Track your improvement over time

All data is stored locally on your machine.
You can disable this anytime in settings.

[View Sample Dashboard] [Enable Analytics] [No Thanks]
```

#### 6.2 Privacy & Data Management

**Add commands:**
- `linearBuddy.viewAnalyticsData` - Show what's stored
- `linearBuddy.exportAnalytics` - Export JSON
- `linearBuddy.clearAnalytics` - Delete all data
- `linearBuddy.analyticsSettings` - Quick access to settings

**Add to README:**
- Privacy policy section
- What data is collected
- Where it's stored
- How to disable/delete

#### 6.3 Settings UI

**Use VS Code's settings UI categories:**

```json
{
  "linearBuddy.analytics": {
    "enabled": true,
    "retentionDays": 90,
    "captureWorkSessions": true,
    "notifications": {
      "enabled": true,
      "threshold": "warning"
    },
    "dashboard": {
      "defaultTimeRange": "30d",
      "showInsightsOnOpen": true
    }
  }
}
```

#### 6.4 Testing & Edge Cases

**Test scenarios:**
- ✅ New user (no historical data)
- ✅ User with 1 week of data
- ✅ User with 90 days of data
- ✅ User with 1000+ tickets
- ✅ User who disables then re-enables
- ✅ Data migration (if schema changes)
- ✅ Settings sync across machines

#### 6.5 Documentation

**Create files:**
- `docs/features/analytics/OVERVIEW.md`
- `docs/features/analytics/METRICS.md`
- `docs/features/analytics/PRIVACY.md`
- `docs/user-guides/ANALYTICS_GUIDE.md`

**Update existing:**
- README.md (add Analytics section)
- AGENTS.md (architecture details)

#### 6.6 Performance Optimization

**Optimize:**
- Lazy load analytics data (only when dashboard opened)
- Cache calculations (invalidate on data change)
- Debounce snapshot captures
- Async/background data processing
- Efficient data queries (don't load everything)

**Deliverables:**
- ✅ Onboarding flow
- ✅ Privacy controls
- ✅ Complete documentation
- ✅ Performance optimizations
- ✅ Edge case handling

---

## Phase 7: AI-Powered Scope Analysis (Week 10)

**Goal:** Prevent scope creep before it happens

### The Problem

Engineers frequently underestimate tickets because they don't realize the full scope:

```
Ticket: "Fix: user service should return string instead of object"

Developer thinks: "Easy, change one function, 30 minutes"

Reality: 
- Change user service return type ✓
- Update 8 callers across 3 packages
- Fix type errors in auth middleware
- Update API contract
- Change frontend expectations
- Update tests
- Update documentation
Result: 3 days, not 30 minutes
```

**This causes:**
- ❌ Tickets getting stuck (exceeds expected time)
- ❌ Poor estimation accuracy
- ❌ Frustration and stress
- ❌ Missed deadlines

### Solution: AI Scope Analyzer

Use VS Code Language Model API to analyze potential scope before starting work.

### Tasks

#### 7.1 Create Scope Analyzer

**File:** `src/utils/scopeAnalyzer.ts`

```typescript
export class ScopeAnalyzer {
  constructor(
    private gitAnalyzer: GitAnalyzer,
    private analyticsManager: AnalyticsManager
  ) {}
  
  /**
   * Analyze the potential scope of a ticket before starting
   */
  async analyzeTicketScope(ticket: LinearTicket): Promise<ScopeAnalysis> {
    // 1. Get codebase context
    const context = await this.getRelevantContext(ticket);
    
    // 2. Use AI to predict scope
    const aiPrediction = await this.predictScope(ticket, context);
    
    // 3. Compare with historical patterns
    const historicalPattern = await this.getHistoricalPattern(ticket);
    
    // 4. Generate warnings
    const warnings = this.generateScopeWarnings(aiPrediction, historicalPattern);
    
    return {
      estimatedFiles: aiPrediction.files,
      estimatedPackages: aiPrediction.packages,
      estimatedComplexity: aiPrediction.complexity,
      risks: aiPrediction.risks,
      warnings,
      recommendation: this.generateRecommendation(aiPrediction, historicalPattern)
    };
  }
  
  /**
   * Monitor ongoing work for scope creep
   */
  async detectScopeCreep(ticket: LinearTicket): Promise<ScopeCreepAlert | null> {
    // Get initial prediction (if we made one)
    const initialPrediction = await this.getInitialPrediction(ticket.id);
    if (!initialPrediction) return null;
    
    // Get actual changes so far
    const actualChanges = await this.getActualChanges(ticket);
    
    // Compare
    if (actualChanges.filesChanged > initialPrediction.estimatedFiles * 1.5) {
      return {
        type: 'scope_creep',
        severity: 'warning',
        message: `Scope expanding: ${actualChanges.filesChanged} files changed (predicted: ${initialPrediction.estimatedFiles})`,
        recommendation: 'Consider breaking this into multiple tickets'
      };
    }
    
    return null;
  }
  
  /**
   * Get relevant codebase context for AI analysis
   */
  private async getRelevantContext(ticket: LinearTicket): Promise<CodebaseContext> {
    // Extract key terms from ticket title/description
    const keywords = this.extractKeywords(ticket.title, ticket.description);
    
    // Find relevant files (use grep/codebase_search)
    const relevantFiles = await this.findRelevantFiles(keywords);
    
    // Get dependency graph
    const dependencies = await this.analyzeDependencies(relevantFiles);
    
    // Get package structure
    const packages = await this.getAffectedPackages(relevantFiles);
    
    return {
      keywords,
      relevantFiles: relevantFiles.slice(0, 10), // Top 10 most relevant
      dependencies,
      packages,
      monorepoStructure: await this.getMonorepoStructure()
    };
  }
  
  /**
   * Use AI to predict scope
   */
  private async predictScope(
    ticket: LinearTicket,
    context: CodebaseContext
  ): Promise<AIScopePrediction> {
    const model = await vscode.lm.selectChatModels({ family: 'gpt-4o' })[0];
    if (!model) {
      return this.fallbackPrediction(context);
    }
    
    const prompt = this.buildScopeAnalysisPrompt(ticket, context);
    const messages = [vscode.LanguageModelChatMessage.User(prompt)];
    
    const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
    
    // Parse AI response
    return this.parseAIResponse(response);
  }
  
  /**
   * Build prompt for AI scope analysis
   */
  private buildScopeAnalysisPrompt(ticket: LinearTicket, context: CodebaseContext): string {
    return `
You are analyzing the scope of a software change in a ${context.monorepoStructure ? 'monorepo' : 'single repo'} codebase.

# Ticket
Title: ${ticket.title}
Description: ${ticket.description || 'No description'}
Estimate: ${ticket.estimate ? ticket.estimate + ' points' : 'Not estimated'}

# Codebase Context
${context.monorepoStructure ? `Packages: ${context.packages.join(', ')}` : ''}
Relevant files found:
${context.relevantFiles.map(f => `- ${f.path} (${f.relevance})`).join('\n')}

Dependencies:
${JSON.stringify(context.dependencies, null, 2)}

# Your Task
Analyze this ticket and predict:

1. **Files Likely to Change**: How many files will need modification?
2. **Packages Affected**: Which packages/modules will be impacted?
3. **Complexity Level**: Low/Medium/High - consider:
   - Type system changes (ripple effects)
   - Breaking changes to interfaces/APIs
   - Cross-package dependencies
   - Test updates required
   - Documentation needs

4. **Hidden Risks**: What might be overlooked?
   - Database migrations
   - API contract changes
   - Authentication/authorization impacts
   - Performance implications
   - Breaking changes for consumers

5. **Scope Creep Risk**: Rate 1-10, what's the risk this "simple" change becomes complex?

Respond in JSON format:
{
  "files": <number>,
  "packages": ["package names"],
  "complexity": "low|medium|high",
  "risks": ["list of risks"],
  "scopeCreepRisk": <1-10>,
  "reasoning": "brief explanation",
  "recommendation": "Should this be broken into subtasks? Any prep work needed?"
}
`;
  }
  
  /**
   * Get historical pattern for similar tickets
   */
  private async getHistoricalPattern(ticket: LinearTicket): Promise<HistoricalPattern | null> {
    const completions = await this.analyticsManager.getCompletions(90);
    
    // Find similar tickets (by title similarity, same labels, etc.)
    const similar = completions.filter(c => 
      this.isSimilar(c.ticketTitle, ticket.title) ||
      this.hasCommonLabels(c, ticket)
    );
    
    if (similar.length === 0) return null;
    
    // Calculate averages
    return {
      avgFilesChanged: this.average(similar.map(s => s.filesChanged || 0)),
      avgCycleTime: this.average(similar.map(s => s.totalCycleTime)),
      avgCommits: this.average(similar.map(s => s.commits || 0)),
      sampleSize: similar.length
    };
  }
}
```

#### 7.2 Integration Points

**A. When Starting a Ticket**

```typescript
// Command: linearBuddy.startTicket
async function startTicket(ticket: LinearTicket) {
  // Show loading
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Analyzing ticket scope..."
  }, async () => {
    const scopeAnalysis = await scopeAnalyzer.analyzeTicketScope(ticket);
    
    // Show scope prediction
    if (scopeAnalysis.scopeCreepRisk > 7) {
      const result = await vscode.window.showWarningMessage(
        `⚠️ High Scope Creep Risk Detected\n\n` +
        `This ticket may be more complex than it appears:\n` +
        `- Estimated files: ${scopeAnalysis.estimatedFiles}\n` +
        `- Complexity: ${scopeAnalysis.complexity}\n` +
        `- Key risks: ${scopeAnalysis.risks.slice(0, 2).join(', ')}\n\n` +
        `${scopeAnalysis.recommendation}`,
        'Start Anyway',
        'View Details',
        'Pick Different Ticket'
      );
      
      if (result === 'View Details') {
        await showScopeAnalysisPanel(scopeAnalysis);
      }
    } else {
      // Show quick info
      vscode.window.showInformationMessage(
        `✓ Scope looks reasonable: ~${scopeAnalysis.estimatedFiles} files, ` +
        `${scopeAnalysis.complexity} complexity`
      );
    }
    
    // Store prediction for later comparison
    await scopeAnalyzer.storePrediction(ticket.id, scopeAnalysis);
    
    // Update ticket status
    await linearClient.updateIssueStatus(ticket.id, 'in_progress');
  });
}
```

**B. During Work (Periodic Check)**

```typescript
// Run every hour or after every 5 commits
async function checkForScopeCreep(ticket: LinearTicket) {
  const alert = await scopeAnalyzer.detectScopeCreep(ticket);
  
  if (alert) {
    vscode.window.showWarningMessage(
      `${alert.message}\n\n${alert.recommendation}`,
      'View Analysis',
      'Break Into Subtasks',
      'Continue'
    );
  }
}
```

**C. In Ticket Detail Panel**

Add scope analysis section:

```typescript
// Show in webview
<div className="scope-analysis">
  <h3>Scope Analysis</h3>
  
  {prediction && (
    <div className="prediction">
      <div className="metric">
        <label>Estimated Files:</label>
        <span>{prediction.estimatedFiles}</span>
      </div>
      <div className="metric">
        <label>Complexity:</label>
        <Badge color={complexityColor}>{prediction.complexity}</Badge>
      </div>
      <div className="metric">
        <label>Scope Creep Risk:</label>
        <ProgressBar value={prediction.scopeCreepRisk} max={10} />
      </div>
    </div>
  )}
  
  {actualChanges && (
    <div className="actual">
      <h4>Actual Progress</h4>
      <div className="comparison">
        <span>Files Changed: {actualChanges.files} 
          {actualChanges.files > prediction.estimatedFiles * 1.5 && 
            <Badge color="warning">Expanding</Badge>
          }
        </span>
      </div>
    </div>
  )}
  
  {risks.length > 0 && (
    <div className="risks">
      <h4>Identified Risks</h4>
      <ul>
        {risks.map(risk => <li key={risk}>⚠️ {risk}</li>)}
      </ul>
    </div>
  )}
</div>
```

#### 7.3 Analytics Integration

**Track scope analysis accuracy:**

```typescript
interface ScopePredictionAccuracy {
  ticketId: string;
  predicted: {
    files: number;
    complexity: string;
    scopeCreepRisk: number;
  };
  actual: {
    files: number;
    complexity: string; // inferred from cycle time
    hadScopeCreep: boolean;
  };
  accuracy: number; // 0-100%
}
```

**Show in analytics dashboard:**

```
📊 Scope Prediction Accuracy

Last 30 Days:
- Predictions made: 15
- High risk warnings: 4
- Actual scope creep: 3 (75% accuracy)
- Prediction accuracy: 82%

💡 Insight: AI warnings helped you avoid 3 tickets with scope creep
```

#### 7.4 Learning System

**Improve predictions over time:**

```typescript
// After ticket completion
async function recordScopePredictionOutcome(ticket: LinearTicket) {
  const prediction = await scopeAnalyzer.getInitialPrediction(ticket.id);
  const actual = await scopeAnalyzer.getActualChanges(ticket);
  
  // Store for analytics
  await analyticsManager.recordScopePrediction({
    ticketId: ticket.id,
    predicted: prediction,
    actual: actual,
    accuracy: this.calculateAccuracy(prediction, actual)
  });
  
  // Adjust future predictions based on user's patterns
  // Example: If user consistently has scope creep on "refactor" tickets,
  // increase risk score for future refactor tickets
}
```

#### 7.5 Fallback Mode

**If AI not available:**

```typescript
// Rule-based scope estimation
private fallbackPrediction(context: CodebaseContext): AIScopePrediction {
  // Count files that mention keywords
  const potentialFiles = context.relevantFiles.length;
  
  // Guess complexity based on dependencies
  const complexity = context.dependencies.length > 5 ? 'high' : 
                     context.dependencies.length > 2 ? 'medium' : 'low';
  
  // Estimate scope creep risk based on title keywords
  const highRiskKeywords = ['refactor', 'migrate', 'rewrite', 'architecture'];
  const scopeCreepRisk = highRiskKeywords.some(k => 
    ticket.title.toLowerCase().includes(k)
  ) ? 8 : 5;
  
  return {
    files: potentialFiles * 2, // Conservative estimate
    packages: context.packages,
    complexity,
    risks: ['Scope analysis unavailable - AI model not found'],
    scopeCreepRisk,
    reasoning: 'Fallback estimation based on keyword analysis',
    recommendation: 'Break into smaller tasks if estimate > 3 points'
  };
}
```

### User Experience Examples

#### Example 1: Simple Fix (Low Risk)

```
User clicks "Start Ticket" on: "Fix: typo in error message"

Notification:
✓ Scope looks reasonable: ~2 files, low complexity
AI confidence: 95%
```

#### Example 2: Hidden Complexity (High Risk)

```
User clicks "Start Ticket" on: "Fix: user service should return string"

Warning Dialog:
⚠️ High Scope Creep Risk Detected

This ticket may be more complex than it appears:
- Estimated files: 12-15
- Packages affected: user-service, auth-middleware, api-gateway
- Complexity: High
- Key risks:
  • Type changes will ripple through 8 dependent services
  • API contract change (breaking change)
  • Authentication middleware needs updates

Recommendation: Consider breaking into:
1. Update user service return type
2. Update internal consumers
3. Update API contract + docs
4. Update auth middleware

[Start Anyway] [View Details] [Pick Different Ticket]
```

#### Example 3: Scope Creep Detection

```
After 6 hours of work:

Notification:
⚠️ Scope Expanding: 12 files changed (predicted: 5)

You've touched:
- user-service (planned ✓)
- auth-middleware (planned ✓)
- billing-service (unplanned ⚠️)
- notifications (unplanned ⚠️)
- admin-dashboard (unplanned ⚠️)

Consider: Break remaining work into a follow-up ticket?

[View Analysis] [Break Into Subtasks] [Continue]
```

### Settings

```json
{
  "linearBuddy.scopeAnalysis.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Analyze ticket scope before starting (requires AI)"
  },
  "linearBuddy.scopeAnalysis.autoCheck": {
    "type": "boolean",
    "default": true,
    "description": "Automatically check for scope creep during work"
  },
  "linearBuddy.scopeAnalysis.checkInterval": {
    "type": "number",
    "default": 60,
    "description": "Minutes between scope creep checks (0 = manual only)"
  },
  "linearBuddy.scopeAnalysis.riskThreshold": {
    "type": "number",
    "default": 7,
    "description": "Scope creep risk score to trigger warnings (1-10)"
  }
}
```

### Benefits

**For Engineers:**
- ✅ Avoid "easy" tickets that turn into week-long sagas
- ✅ Better estimation (know true scope upfront)
- ✅ Break down tickets proactively (not reactively)
- ✅ Reduce frustration and stress

**For Analytics:**
- ✅ New metric: Scope prediction accuracy
- ✅ Identify ticket types that often have scope creep
- ✅ Learn patterns: "You underestimate refactor tickets by 3x"
- ✅ Improve over time with feedback

**For Teams:**
- ✅ Better sprint planning (accurate scope)
- ✅ Fewer blocked/stuck tickets
- ✅ More realistic commitments
- ✅ Less mid-sprint scope changes

### Deliverables
- ✅ ScopeAnalyzer utility class
- ✅ AI prompting for scope prediction
- ✅ Fallback rule-based analysis
- ✅ Integration with ticket start flow
- ✅ Periodic scope creep detection
- ✅ Scope analysis UI in ticket panel
- ✅ Analytics tracking and learning
- ✅ Documentation

---

## Phase 8: Advanced Features (Future)

**Nice-to-haves for later versions:**

### Team Comparisons (Opt-in)
- Compare your velocity to team anonymous average
- Team capacity visualization
- Collaboration patterns

### Predictive Features
- Sprint burndown projections
- Capacity forecasting
- Risk detection (likely to miss sprint)

### Integrations
- Export to CSV for spreadsheets
- Generate performance review summaries
- Slack standup with stats

### AI-Powered Insights
- "You usually complete auth tickets in 3 days, but this one is at 7 days. Need help?"
- "Your velocity drops 40% on Mondays. Consider blocking focus time."
- "You're most productive on backend work. Consider specializing?"

---

## Technical Decisions

### Storage: VS Code Global State
**Pros:**
- ✅ Built-in, no setup
- ✅ Persists across sessions
- ✅ Syncs with Settings Sync (if enabled)
- ✅ No external dependencies

**Cons:**
- ❌ Limited to ~10MB (plenty for this use case)
- ❌ JSON only (no queries)
- ❌ Must handle schema migrations manually

**Alternative considered:** SQLite
- More powerful queries
- More complex setup
- Overkill for this use case

### Charts: CSS-First
**Start with CSS-only charts:**
- Matches VS Code theme perfectly
- Lightweight (no dependencies)
- Fast rendering

**Add Chart.js only if needed:**
- More complex visualizations
- Interactive tooltips
- Zoom/pan features

### Privacy: Local-Only
**No external services:**
- All processing local
- No API calls for analytics
- No telemetry
- User owns their data

### Performance: Lazy + Cached
**Lazy load:**
- Only calculate analytics when dashboard opened
- Don't block main thread

**Cache aggressively:**
- Cache calculations for 5 minutes
- Invalidate on data changes
- Background refresh

---

## Success Metrics

**User Success:**
- Engineers identify overcommitment before burnout
- Estimation accuracy improves over time
- Engineers advocate for themselves with data
- Cycle time improves through awareness

**Feature Success:**
- Analytics enabled by >80% of users
- Dashboard opened regularly (weekly+)
- Warnings acted upon (not dismissed)
- Export used for performance reviews

**Technical Success:**
- No performance impact on extension
- Data storage < 1MB for 90 days
- UI renders in < 500ms
- Background processing < 100ms

---

## Open Questions

### 1. Estimation Tracking
**How to track estimates vs actuals?**

Options:
- A) Use Linear's estimate field (if set)
- B) Ask user to estimate when starting ticket
- C) Infer from historical similar tickets
- D) Don't track estimates initially

**Recommendation:** Start with (A), add (B) as enhancement

### 2. Team Features
**Should we build team comparisons?**

Concerns:
- Privacy implications
- Requires sharing data
- Can feel competitive
- Needs opt-in

**Recommendation:** Skip for v1, consider for v2 with strong opt-in

### 3. Work Session Tracking
**How detailed should work session tracking be?**

Options:
- A) Daily summaries only (commits, files)
- B) Track active VS Code hours (privacy concern)
- C) Infer from git timestamps
- D) Let user manually log

**Recommendation:** Start with (A), git-based only

### 4. Historical Depth
**How much history to keep?**

Options:
- 30 days (minimal)
- 90 days (recommended)
- 180 days (extended)
- Forever (storage concerns)

**Recommendation:** 90 days default, configurable, with export for archival

---

## Migration Path

### For Existing Users

**On first run with analytics:**
```
🆕 New Feature: Personal Analytics

Linear Buddy can now track your productivity patterns
to help you identify issues early and improve over time.

Note: No historical data available yet. Analytics will
begin collecting data now.

[Learn More] [Enable] [No Thanks]
```

**Backfill historical data:**
- Query Linear API for last 90 days of completions
- Build initial dataset
- Note: Won't have state transition timing

### Schema Versioning

**Version data structure:**
```typescript
interface AnalyticsMetadata {
  dataVersion: "1.0.0";
  migrationsApplied: string[];
}
```

**Migration strategy:**
- Detect old version on load
- Apply migrations sequentially
- Backup before migration
- Graceful fallback if migration fails

---

## Timeline

**Total: 10 weeks (part-time) or 6 weeks (full-time)**

- **Week 1-2:** Foundation (data collection, storage)
- **Week 3-4:** Analytics engine (calculations, insights)
- **Week 5:** Commands & quick view UI
- **Week 6-7:** Dashboard webview
- **Week 8:** Smart features (notifications, warnings)
- **Week 9:** Polish, docs, testing
- **Week 10:** AI-powered scope analysis

**Phased rollout:**
1. **Beta (v0.9):** Basic analytics commands (after Week 5)
   - Velocity, cycle time, capacity tracking
   - Weekly/monthly summaries
   - Sidebar integration
   
2. **v1.0:** Full analytics dashboard (after Week 7)
   - Visual analytics webview
   - Charts and trends
   - Export functionality
   
3. **v1.1:** Smart features (after Week 8)
   - Proactive notifications
   - Inline warnings
   - Capacity-aware commands
   
4. **v1.2:** Scope analysis (after Week 10)
   - AI-powered scope prediction
   - Scope creep detection
   - Historical learning

---

## Next Steps

1. ✅ Review and approve this plan
2. Create detailed tasks in Linear
3. Set up development branch
4. Begin Phase 1 implementation
5. Daily/weekly progress check-ins

**Ready to start building?** 🚀

