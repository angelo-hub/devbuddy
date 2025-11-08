# Telemetry Implementation Guide

## Overview

This guide explains how telemetry is implemented in Linear Buddy and how to use it in your code.

## Architecture

### TelemetryManager (Singleton)

The `TelemetryManager` class handles all telemetry operations:

```typescript
import { getTelemetryManager } from "./utils/telemetryManager";

const telemetry = getTelemetryManager();
```

### Key Features

1. **Opt-in Only**: Disabled by default, requires explicit user consent
2. **Trial Extension**: Grants 14 extra days of Pro trial when enabled
3. **Privacy-First**: Sanitizes all data, no PII collection
4. **GDPR Compliant**: Export and deletion capabilities
5. **Batched Sending**: Events queued and sent in batches
6. **Offline Support**: Events stored locally when offline

## Usage Examples

### Tracking Commands

#### Method 1: Manual Tracking

```typescript
import { getTelemetryManager } from "./utils/telemetryManager";

async function myCommand() {
  const telemetry = getTelemetryManager();
  
  try {
    // Your command logic
    await doSomething();
    
    // Track success
    await telemetry.trackCommand("myCommand", true);
  } catch (error) {
    // Track failure
    await telemetry.trackCommand("myCommand", false);
    await telemetry.trackError(
      "command_error",
      error.message,
      "myCommand"
    );
    throw error;
  }
}
```

#### Method 2: Using Decorator

```typescript
import { trackCommand } from "./utils/telemetryManager";

class MyService {
  @trackCommand("myCommand")
  async myCommand() {
    // Your command logic
    // Telemetry automatically tracked on success/failure
  }
}
```

### Tracking Feature Usage

```typescript
import { getTelemetryManager } from "./utils/telemetryManager";

async function useFeature() {
  const telemetry = getTelemetryManager();
  
  await telemetry.trackFeatureUsage("branch_creation", {
    convention: "conventional",
    hasCustomTemplate: false,
  });
}
```

### Tracking Errors

```typescript
import { getTelemetryManager } from "./utils/telemetryManager";

try {
  await riskyOperation();
} catch (error) {
  const telemetry = getTelemetryManager();
  
  await telemetry.trackError(
    "api_error",
    error.message, // Automatically sanitized
    "linearClient.fetchIssues"
  );
}
```

### Tracking Performance

```typescript
import { getTelemetryManager } from "./utils/telemetryManager";

async function expensiveOperation() {
  const telemetry = getTelemetryManager();
  const startTime = Date.now();
  
  try {
    await doExpensiveWork();
    
    const duration = Date.now() - startTime;
    await telemetry.trackPerformance("expensive_operation", duration, {
      itemCount: 100,
      cached: false,
    });
  } catch (error) {
    // Handle error
  }
}
```

### Custom Events

```typescript
import { getTelemetryManager } from "./utils/telemetryManager";

async function customEvent() {
  const telemetry = getTelemetryManager();
  
  await telemetry.trackEvent("custom_event", {
    action: "button_clicked",
    location: "sidebar",
    value: 42,
  });
}
```

## Best Practices

### DO

✅ **Track user actions**: Commands, features, workflows  
✅ **Track errors**: Types and frequencies, not details  
✅ **Track performance**: Operation durations, bottlenecks  
✅ **Use descriptive names**: Clear event names and properties  
✅ **Check if enabled**: Telemetry manager handles this automatically  
✅ **Sanitize data**: Use the built-in sanitization

### DON'T

❌ **Track PII**: Names, emails, tokens, credentials  
❌ **Track code**: File contents, code snippets, diffs  
❌ **Track file paths**: Use generic identifiers instead  
❌ **Track user data**: Ticket content, comments, descriptions  
❌ **Track frequently**: Batch similar events  
❌ **Block operations**: Telemetry runs asynchronously

## Event Naming Convention

Use descriptive, hierarchical names:

```typescript
// Good
"command_executed"
"feature_used"
"error_occurred"
"performance_metric"

// Bad
"cmd"
"feature"
"err"
"perf"
```

## Property Guidelines

### Required Properties

Automatically added by TelemetryManager:
- `userId`: Anonymous UUID
- `version`: Extension version
- `platform`: OS platform
- `vsCodeVersion`: VS Code version
- `timestamp`: ISO 8601 timestamp

### Custom Properties

Keep properties:
- **Relevant**: Only include meaningful data
- **Anonymous**: No PII or identifying info
- **Typed**: Use proper types (string, number, boolean)
- **Limited**: Max 10 custom properties per event

Example:

```typescript
{
  feature: "pr_summary",
  packageCount: 3,
  aiEnabled: true,
  writingTone: "professional",
  durationMs: 1234
}
```

## Testing Telemetry

### Debug Mode

Enable debug mode to see telemetry events:

```typescript
// In VS Code settings
{
  "linearBuddy.debugMode": true
}
```

Then check the Output panel → "Linear Buddy" channel.

### Unit Tests

Mock the telemetry manager:

```typescript
import { getTelemetryManager } from "./utils/telemetryManager";

jest.mock("./utils/telemetryManager", () => ({
  getTelemetryManager: jest.fn(() => ({
    isEnabled: jest.fn(() => false),
    trackCommand: jest.fn(),
    trackEvent: jest.fn(),
    trackError: jest.fn(),
    trackFeatureUsage: jest.fn(),
    trackPerformance: jest.fn(),
  })),
}));
```

### Integration Tests

Test the full flow:

```typescript
describe("Telemetry", () => {
  it("should track command execution", async () => {
    const telemetry = getTelemetryManager();
    await telemetry.initialize(mockContext);
    await telemetry.enableTelemetry();
    
    await telemetry.trackCommand("test_command", true);
    
    // Verify event was queued
    const stats = await telemetry.getTelemetryStats();
    expect(stats.eventsSent).toBeGreaterThan(0);
  });
});
```

## Backend Integration

### Telemetry Endpoint

Events are sent to your backend endpoint. Implement in `telemetryManager.ts`:

```typescript
private async sendToBackend(events: TelemetryEvent[]): Promise<void> {
  const response = await fetch("https://your-api.com/telemetry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "your-api-key",
    },
    body: JSON.stringify({ events }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send: ${response.statusText}`);
  }
}
```

### Backend Requirements

Your backend should:

1. **Authenticate**: Verify API key
2. **Validate**: Check event structure
3. **Store**: Save events to database
4. **Rate Limit**: Prevent abuse
5. **Expire**: Delete old data (90 days)

### Example Backend (Express)

```typescript
app.post("/api/telemetry", async (req, res) => {
  // 1. Verify API key
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.TELEMETRY_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Validate payload
  const { events } = req.body;
  if (!Array.isArray(events)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  // 3. Store events
  await db.telemetry.insertMany(events);

  // 4. Return success
  res.json({ success: true, count: events.length });
});
```

## Data Privacy

### Sanitization

The `sanitizeString` method removes:
- File paths: `/path/to/file` → `[PATH]`
- URLs: `https://example.com` → `[URL]`
- Emails: `user@example.com` → `[EMAIL]`
- Long strings: Truncated to 200 chars

### Example

```typescript
Before: "Error in /Users/john/project/src/index.ts at line 42: Failed to fetch https://api.example.com/data for user@example.com"

After: "Error in [PATH] at line 42: Failed to fetch [URL] for [EMAIL]"
```

## Trial Extension Integration

### How It Works

1. User enables telemetry
2. `enableTelemetry(true)` called with grant flag
3. Trial extension stored in global state
4. License manager reads extension days
5. Pro features unlocked for 44 days (30 + 14)

### Implementation

In your license manager:

```typescript
import { getTelemetryManager } from "./utils/telemetryManager";

class LicenseManager {
  async getTrialEndDate(): Promise<Date> {
    const telemetry = getTelemetryManager();
    const trialDays = 30 + telemetry.getTrialExtensionDays();
    
    const installDate = await this.getInstallDate();
    return new Date(installDate.getTime() + trialDays * 24 * 60 * 60 * 1000);
  }
}
```

## Metrics Dashboard

### Recommended Metrics

Track these on your backend:

1. **Adoption Metrics**
   - Total users
   - Active users (DAU/WAU/MAU)
   - Telemetry opt-in rate
   - Trial extension redemption rate

2. **Feature Metrics**
   - Most used commands
   - Feature adoption over time
   - Feature abandonment
   - User journey flows

3. **Error Metrics**
   - Error rate
   - Error types distribution
   - Errors by version
   - Errors by platform

4. **Performance Metrics**
   - P50/P95/P99 operation duration
   - Slow operations
   - Performance regressions
   - Resource usage

### Example Queries

```sql
-- Most used commands
SELECT 
  properties->>'command' as command,
  COUNT(*) as uses
FROM telemetry_events
WHERE event = 'command_executed'
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY properties->>'command'
ORDER BY uses DESC
LIMIT 10;

-- Error rate by version
SELECT 
  properties->>'version' as version,
  COUNT(*) FILTER (WHERE event = 'error_occurred') as errors,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE event = 'error_occurred') / COUNT(*), 2) as error_rate_pct
FROM telemetry_events
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY properties->>'version'
ORDER BY error_rate_pct DESC;

-- Performance trends
SELECT 
  DATE(timestamp) as date,
  properties->>'operation' as operation,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (properties->>'durationMs')::int) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (properties->>'durationMs')::int) as p95
FROM telemetry_events
WHERE event = 'performance_metric'
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), properties->>'operation'
ORDER BY date DESC;
```

## GDPR Compliance

### User Rights

The implementation supports:

1. **Right to Access**: `exportUserData()`
2. **Right to Deletion**: `deleteUserData()`
3. **Right to Opt-Out**: `disableTelemetry()`
4. **Right to Information**: Transparent documentation

### Data Processing Agreement

Ensure your privacy policy covers:
- What data is collected
- How data is used
- How long data is retained
- User rights and how to exercise them
- Contact information for privacy questions

## Troubleshooting

### Events Not Sending

Check:
1. Is telemetry enabled? `telemetry.isEnabled()`
2. Is network available?
3. Is backend endpoint accessible?
4. Check debug logs
5. Verify API key

### Performance Issues

If telemetry impacts performance:
1. Increase flush interval (default: 60s)
2. Increase batch size (default: 50)
3. Reduce event frequency
4. Optimize backend response time

### Data Quality Issues

If data looks wrong:
1. Verify event structure
2. Check sanitization logic
3. Validate property types
4. Review backend storage

## Migration Guide

### From No Telemetry

1. Add telemetry manager to extension
2. Initialize on activation
3. Add tracking calls to commands
4. Test with debug mode
5. Deploy backend endpoint
6. Release new version

### From Other Telemetry

1. Map existing events to new format
2. Migrate user consent preferences
3. Update privacy policy
4. Migrate historical data (if needed)
5. Test migration thoroughly

## Future Enhancements

Potential improvements:

1. **A/B Testing**: Track experiment variants
2. **User Segmentation**: Cohort analysis
3. **Funnel Tracking**: Multi-step workflows
4. **Session Tracking**: User session duration
5. **Crash Reporting**: Automatic error collection
6. **Feature Flags**: Remote feature toggle

---

**For Questions**: angelo.girardi@onebrief.com  
**Last Updated**: November 7, 2025

