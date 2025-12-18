# VS Code Extension Telemetry: Automatic Properties Guide

## ✅ What You Get For Free

When using `@vscode/extension-telemetry`, VS Code **automatically** includes these properties with **every event**:

### Core Properties (Always Included)

| Property | Description | Example Value |
|----------|-------------|---------------|
| `common.extname` | Extension name | `dev-buddy` |
| `common.extversion` | Extension version | `0.5.0` |
| `common.vscodemachineid` | Unique machine ID (anonymous) | `abc123def456...` |
| `common.vscodesessionid` | Unique session ID | `xyz789abc123...` |
| `common.vscodeversion` | VS Code version | `1.90.0` |

### Platform Properties

| Property | Description | Example Value |
|----------|-------------|---------------|
| `common.os` | Operating system | `darwin`, `win32`, `linux` |
| `common.platformversion` | OS version | `25.0.0` (macOS Sequoia) |
| `common.nodeArch` | CPU architecture | `x64`, `arm`, `arm64` |

### Environment Properties

| Property | Description | Example Value |
|----------|-------------|---------------|
| `common.product` | Host environment | `desktop`, `github.dev`, `codespaces` |
| `common.uikind` | UI mode | `desktop`, `web` |
| `common.remotename` | Remote type (if any) | `ssh`, `wsl`, `dev-container`, `codespaces` |

---

## 🎯 What This Means for Your Analytics

### 1. **User Segmentation** (Automatic)
```kusto
// Users by OS
customEvents
| summarize users = dcount(tostring(customDimensions.["common.vscodemachineid"])) 
  by tostring(customDimensions.["common.os"])

// Result:
// darwin: 450 users
// win32: 320 users  
// linux: 130 users
```

### 2. **Version Adoption** (Automatic)
```kusto
// Users per extension version
customEvents
| where timestamp > ago(7d)
| summarize users = dcount(tostring(customDimensions.["common.vscodemachineid"])) 
  by tostring(customDimensions.["common.extversion"])
| order by users desc

// Result:
// 0.5.0: 650 users
// 0.4.0: 180 users
// 0.3.0: 70 users
```

### 3. **Session Analysis** (Automatic)
```kusto
// Average events per session
customEvents
| where timestamp > ago(24h)
| summarize events = count() by tostring(customDimensions.["common.vscodesessionid"])
| summarize avg(events)

// Result: 12.3 events/session
```

### 4. **Platform Distribution** (Automatic)
```kusto
// M1/M2 Mac adoption
customEvents
| where tostring(customDimensions.["common.os"]) == "darwin"
| summarize users = dcount(tostring(customDimensions.["common.vscodemachineid"])) 
  by tostring(customDimensions.["common.nodeArch"])

// Result:
// arm64: 320 users (M1/M2/M3)
// x64: 130 users (Intel)
```

### 5. **Remote Development** (Automatic)
```kusto
// Remote usage breakdown
customEvents
| where isnotempty(tostring(customDimensions.["common.remotename"]))
| summarize sessions = dcount(tostring(customDimensions.["common.vscodesessionid"])) 
  by tostring(customDimensions.["common.remotename"])

// Result:
// ssh: 45 sessions
// wsl: 23 sessions
// dev-container: 12 sessions
```

---

## 🛠️ What YOU Need to Add

While VS Code provides great baseline properties, you should add **application-specific** properties:

### ✅ Recommended Custom Properties

#### 1. **User Configuration** (Added in our update)
```typescript
stringProperties.provider = config.get("provider"); // "linear" or "jira"
stringProperties.aiEnabled = String(!config.get("ai.disabled"));
```

**Why?** Understand feature adoption and configuration patterns.

#### 2. **License/Trial Status** (Recommended)
```typescript
stringProperties.licenseType = "free" | "trial" | "pro";
stringProperties.trialDaysRemaining = String(daysRemaining);
```

**Why?** Track conversion funnel and trial effectiveness.

#### 3. **Workspace Context** (Optional)
```typescript
stringProperties.workspaceType = "single" | "monorepo" | "multi-root";
stringProperties.packageCount = String(detectedPackages.length);
```

**Why?** Understand how users work (monorepo vs. single-repo).

#### 4. **Integration Status** (Recommended)
```typescript
// When tracking ticket operations
stringProperties.hasLinearAccess = String(!!linearClient);
stringProperties.hasJiraAccess = String(!!jiraClient);
stringProperties.hasCopilot = String(!!copilotAvailable);
```

**Why?** Understand integration setup success rates.

---

## 📊 Automatic Properties You Were Duplicating

### ❌ Remove These (Already Automatic)

In your `telemetryManager.ts`, you were adding:

```typescript
// BEFORE (duplicates):
stringProperties.version = this.getExtensionVersion();      // ❌ = common.extversion
stringProperties.platform = process.platform;               // ❌ = common.os  
stringProperties.vsCodeVersion = vscode.version;           // ❌ = common.vscodeversion
```

### ✅ After Our Update (No Duplicates)

```typescript
// AFTER (clean):
stringProperties.userId = this.config!.userId;              // ✅ Custom user ID
stringProperties.provider = config.get("provider");         // ✅ App-specific
stringProperties.aiEnabled = String(!config.get("ai.disabled")); // ✅ App-specific
```

---

## 🎓 Best Practices

### DO ✅
- **Use automatic properties** for platform/version analysis
- **Add business-specific properties** (provider, license, features enabled)
- **Keep property names consistent** across all events
- **Use string values** for enums (VS Code requirement)

### DON'T ❌
- **Don't duplicate automatic properties** (waste of space)
- **Don't add PII** (names, emails, file paths)
- **Don't add high-cardinality values** (unique per-user strings)
- **Don't add complex objects** (flatten to key-value pairs)

---

## 🔍 Querying Automatic Properties in Azure

### Access Common Properties
```kusto
customEvents
| extend 
    extVersion = tostring(customDimensions.["common.extversion"]),
    os = tostring(customDimensions.["common.os"]),
    vscodeVersion = tostring(customDimensions.["common.vscodeversion"]),
    machineId = tostring(customDimensions.["common.vscodemachineid"]),
    sessionId = tostring(customDimensions.["common.vscodesessionid"]),
    remoteName = tostring(customDimensions.["common.remotename"]),
    architecture = tostring(customDimensions.["common.nodeArch"])
| project timestamp, name, extVersion, os, vscodeVersion, remoteName
```

### Common Analysis Patterns
```kusto
// 1. Daily Active Users (DAU)
customEvents
| where timestamp > ago(24h)
| summarize dau = dcount(tostring(customDimensions.["common.vscodemachineid"]))

// 2. Version Distribution
customEvents
| where timestamp > ago(7d)
| summarize count() by tostring(customDimensions.["common.extversion"])
| render piechart

// 3. Platform Breakdown
customEvents
| where timestamp > ago(30d)
| summarize users = dcount(tostring(customDimensions.["common.vscodemachineid"])) 
  by tostring(customDimensions.["common.os"])
| render columnchart

// 4. Remote vs Local Usage
customEvents
| where timestamp > ago(7d)
| extend isRemote = isnotempty(tostring(customDimensions.["common.remotename"]))
| summarize sessions = dcount(tostring(customDimensions.["common.vscodesessionid"])) by isRemote

// 5. Session Duration
customEvents
| summarize 
    start = min(timestamp),
    end = max(timestamp),
    eventCount = count()
  by tostring(customDimensions.["common.vscodesessionid"])
| extend durationMinutes = datetime_diff('minute', end, start)
| summarize avg(durationMinutes), percentile(durationMinutes, 50, 95)
```

---

## 💡 Key Insights from Automatic Properties

### What You Learn Without Writing Any Code

1. **Platform Distribution**
   - Which OS users prefer
   - M1/M2 Mac adoption rate
   - ARM vs x64 usage

2. **Version Adoption**
   - How quickly users update
   - Version fragmentation
   - Update success rate

3. **User Behavior**
   - Average session length
   - Events per session
   - Time between sessions

4. **Environment Patterns**
   - Remote development usage (SSH, WSL, Codespaces)
   - Web vs Desktop usage
   - Workspace configurations

5. **Reliability Metrics**
   - Crash correlation with OS/version
   - Platform-specific issues
   - Architecture-specific bugs

---

## 🚀 Summary

### You Get Automatically:
- ✅ User segmentation (machineId, sessionId)
- ✅ Version tracking (extension + VS Code)
- ✅ Platform distribution (OS, architecture)
- ✅ Environment context (remote, web/desktop)

### You Should Add:
- 🎯 Business metrics (provider, license type)
- 🎯 Feature configuration (AI enabled, settings)
- 🎯 Integration status (API connected, auth status)
- 🎯 Workspace context (monorepo, package count)

### Result:
**Rich analytics with minimal code!** 🎉

---

## 📚 References

- [VS Code Extension Telemetry Guide](https://code.visualstudio.com/api/extension-guides/telemetry)
- [@vscode/extension-telemetry GitHub](https://github.com/microsoft/vscode-extension-telemetry)
- [Azure Application Insights Docs](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)

---

**Last Updated:** November 21, 2025  
**DevBuddy Version:** 0.5.0

