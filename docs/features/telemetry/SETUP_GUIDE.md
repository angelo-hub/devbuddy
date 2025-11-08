# Telemetry Setup Guide for Developers

This guide explains how to set up telemetry for Linear Buddy during development and for production builds.

## Overview

Linear Buddy uses **VSCode's native telemetry** via the `@vscode/extension-telemetry` package, which sends data to **Azure Application Insights**.

## Benefits of VSCode Native Telemetry

- ✅ **Automatic privacy respect** - Honors VSCode's global telemetry settings
- ✅ **No manual batching** - Handles queuing and sending automatically
- ✅ **Built-in error tracking** - Dedicated error event types
- ✅ **Free tier** - 5GB/month is plenty for extensions
- ✅ **Rich analytics** - Azure portal with powerful dashboards

## Quick Start (3 steps)

### 1. Install the Package

```bash
npm install @vscode/extension-telemetry
```

### 2. Get Azure Application Insights Connection String

#### Option A: Use Existing (Recommended for Production)

If you already have Application Insights set up, get the connection string from:
- Azure Portal → Your Application Insights resource → Overview → Connection String

#### Option B: Create New (5 minutes)

1. **Create Azure Account** (free): https://azure.microsoft.com/free/
2. **Go to Azure Portal**: https://portal.azure.com
3. **Create Application Insights**:
   - Click "Create a resource"
   - Search for "Application Insights"
   - Click "Create"
   - Fill in details:
     - Name: `linear-buddy-telemetry`
     - Region: Choose closest to you
     - Resource Group: Create new
4. **Get Connection String**:
   - Once created, go to your resource
   - Copy the "Connection String" from Overview tab

### 3. Configure the Extension

#### For Development (Local Testing)

Create a `.env` file in the project root (copy from `.env.example`):

```bash
VSCODE_TELEMETRY_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://region.in.applicationinsights.azure.com/
```

**Note:** The extension code will automatically read from `process.env.VSCODE_TELEMETRY_CONNECTION_STRING`

#### For Production (Published Extension)

Add to `package.json`:

```json
{
  "name": "linear-buddy",
  "telemetryConnectionString": "InstrumentationKey=xxx;IngestionEndpoint=https://region.in.applicationinsights.azure.com/"
}
```

**Security Note:** For open-source projects, the connection string is public (it's in the published extension). This is OK because:
- Application Insights ingestion keys are meant to be public
- Rate limiting protects against abuse
- Only you can view the data in Azure portal

## Testing Telemetry Locally

### 1. Enable Debug Mode

In VS Code settings (`.vscode/settings.json`):

```json
{
  "linearBuddy.debugMode": true
}
```

### 2. Load Environment Variables

The extension automatically reads from `process.env.VSCODE_TELEMETRY_CONNECTION_STRING`.

To set this in your development environment:

**Option A: VSCode Launch Configuration**

Edit `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "${defaultBuildTask}",
      "env": {
        "VSCODE_TELEMETRY_CONNECTION_STRING": "${env:VSCODE_TELEMETRY_CONNECTION_STRING}"
      }
    }
  ]
}
```

Then export the variable in your shell before running VS Code:

```bash
export VSCODE_TELEMETRY_CONNECTION_STRING="your-connection-string"
code .
```

**Option B: Use dotenv Package (Simpler)**

Install dotenv for development:

```bash
npm install -D dotenv
```

Load it in your extension entry point (for development only):

```typescript
// At the very top of src/extension.ts
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}
```

### 3. Run the Extension

Press **F5** to launch the Extension Development Host.

### 4. Trigger Events

Use the extension features to generate telemetry events:
- Run commands
- Use features
- Trigger errors (for testing)

### 5. Check Output

With debug mode enabled, check:
- **Output Panel** → "Linear Buddy" → See telemetry events logged
- **Azure Portal** → Application Insights → Live Metrics → See events in real-time

## Viewing Telemetry Data

### Azure Portal

1. Go to https://portal.azure.com
2. Navigate to your Application Insights resource
3. Explore:
   - **Live Metrics**: Real-time event stream
   - **Logs**: Query events with KQL
   - **Application Map**: Visualize dependencies
   - **Failures**: See errors and exceptions
   - **Performance**: View operation durations

### Sample Queries (KQL)

**Most Used Commands:**
```kql
customEvents
| where timestamp > ago(30d)
| where name == "command_executed"
| summarize Count = count() by tostring(customDimensions.command)
| order by Count desc
| take 10
```

**Error Rate:**
```kql
customEvents
| where timestamp > ago(7d)
| summarize 
    Total = count(),
    Errors = countif(name == "error_occurred"),
    ErrorRate = 100.0 * countif(name == "error_occurred") / count()
| project ErrorRate, Total, Errors
```

**User Activity Over Time:**
```kql
customEvents
| where timestamp > ago(30d)
| summarize Users = dcount(tostring(customDimensions.userId)) by bin(timestamp, 1d)
| render timechart
```

## Production Deployment

### Option 1: Embed in package.json (Simplest)

Add the connection string directly:

```json
{
  "name": "linear-buddy",
  "version": "0.1.0",
  "telemetryConnectionString": "InstrumentationKey=xxx;IngestionEndpoint=xxx"
}
```

**Pros:**
- Simple, no build process changes needed
- Works immediately

**Cons:**
- Connection string is public in published extension
- Must republish to change

### Option 2: Build-Time Injection (More Secure)

Use environment variables during build:

1. **Create build script** (`scripts/inject-telemetry.js`):

```javascript
const fs = require('fs');
const packageJson = require('../package.json');

if (process.env.VSCODE_TELEMETRY_CONNECTION_STRING) {
  packageJson.telemetryConnectionString = process.env.VSCODE_TELEMETRY_CONNECTION_STRING;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✓ Telemetry connection string injected');
} else {
  console.log('⚠ No telemetry connection string found');
}
```

2. **Update package.json scripts**:

```json
{
  "scripts": {
    "vscode:prepublish": "node scripts/inject-telemetry.js && npm run compile && npm run compile:webview"
  }
}
```

3. **Set in CI/CD**:

```bash
export VSCODE_TELEMETRY_CONNECTION_STRING="your-connection-string"
vsce package
```

### Option 3: Separate Keys for Dev/Prod

Create different Application Insights resources:

- `linear-buddy-dev` - For development
- `linear-buddy-prod` - For published extension

Use environment variables to switch between them.

## Privacy & Compliance

### What VSCode Native Telemetry Respects

The `@vscode/extension-telemetry` package automatically:
- ✅ Checks `telemetry.telemetryLevel` setting
- ✅ Respects "off" setting (no data sent)
- ✅ Honors "error" setting (only errors sent)
- ✅ Follows "all" setting (full telemetry)

### Your Extension's Opt-In

Linear Buddy adds an **additional** opt-in layer:
- Users must explicitly enable telemetry in your extension
- This is on top of VSCode's global setting
- Double opt-in for maximum privacy

### Transparency

Always inform users:
1. What data you collect (see our telemetry guide)
2. How it's used (improve the extension)
3. How to opt-out (toggle setting)
4. How to view/delete data (GDPR compliance)

## Troubleshooting

### Events Not Showing Up

**Check:**
1. Connection string is valid
2. Extension telemetry is enabled (`linearBuddy.telemetry.enabled`)
3. VSCode telemetry is enabled (`telemetry.telemetryLevel` != "off")
4. Debug mode is on to see logs
5. Network isn't blocking Azure endpoints

**Test:**
```typescript
// In extension.ts
console.log('Connection string:', process.env.VSCODE_TELEMETRY_CONNECTION_STRING);
```

### "No connection string found" Warning

**Cause:** Neither environment variable nor package.json has the connection string.

**Fix:** Add it to `.env` or `package.json`

### Data Delayed in Azure Portal

**Normal:** Live Metrics shows data immediately, but Logs/Analytics can take 1-5 minutes to update.

**Check:** Use Live Metrics for real-time verification.

### "Operation not permitted" Error

**Cause:** File permissions issue (usually during npm install).

**Fix:** Run with elevated permissions or outside sandbox:
```bash
npm install @vscode/extension-telemetry
```

## Cost Management

### Free Tier Limits

Azure Application Insights free tier includes:
- **5 GB/month** ingestion
- **90 days** retention
- **Unlimited** Application Insights SDK calls

### Typical Usage for Extensions

Average VSCode extension with 10k active users:
- ~100-200 MB/month (well within free tier)
- Cost: **$0** (free tier)

### If You Exceed Free Tier

Paid tier pricing (as of 2024):
- **$2.30 per GB** ingested
- Still very affordable for most extensions

### Optimization Tips

1. **Sample high-volume events**:
```typescript
if (Math.random() < 0.1) { // 10% sampling
  telemetry.trackEvent('frequent_event');
}
```

2. **Reduce property size**: Keep strings short
3. **Avoid duplicate properties**: Don't repeat same data
4. **Use measurements for numbers**: Numeric values are more efficient

## Additional Resources

- [VSCode Extension Telemetry Guide](https://code.visualstudio.com/api/extension-guides/telemetry)
- [@vscode/extension-telemetry GitHub](https://github.com/microsoft/vscode-extension-telemetry)
- [Azure Application Insights Docs](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [KQL Query Language](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)

## Support

Questions? Issues? Contact:
- Email: angelo.girardi@onebrief.com
- GitHub: Open an issue

---

**Last Updated**: November 7, 2025

