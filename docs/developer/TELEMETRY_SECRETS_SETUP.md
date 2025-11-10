# Telemetry Secrets Setup Guide

This guide explains how to set up telemetry with Azure Application Insights for local development and production builds.

## Overview

DevBuddy uses Azure Application Insights for telemetry via the VS Code native telemetry system. The connection string must be kept secret and never committed to the repository.

## Architecture

```
Development Build (Local)
  ↓
  .env file (not committed)
  ↓
  process.env.VSCODE_TELEMETRY_CONNECTION_STRING
  ↓
  TelemetryReporter

Production Build (GitHub Actions)
  ↓
  GitHub Secrets
  ↓
  Environment variable in workflow
  ↓
  Injected at build time
  ↓
  TelemetryReporter
```

## Local Development Setup

### 1. Create Azure Application Insights Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new Application Insights resource:
   - **Resource Type**: Application Insights
   - **Name**: `devbuddy-telemetry` (or your choice)
   - **Region**: Choose closest to your users
   - **Workspace**: Create new or use existing Log Analytics workspace

3. Once created, go to **Properties** and copy the **Connection String**
   - It looks like: `InstrumentationKey=xxx;IngestionEndpoint=https://xxx.in.applicationinsights.azure.com/;LiveEndpoint=https://xxx.livediagnostics.monitor.azure.com/`

### 2. Create Local .env File

```bash
# In the project root
cp .env.example .env
```

Edit `.env` and add your connection string:

```bash
VSCODE_TELEMETRY_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://xxx.in.applicationinsights.azure.com/;LiveEndpoint=https://xxx.livediagnostics.monitor.azure.com/
```

**Important**: Never commit this file! It's already in `.gitignore`.

### 3. Test Locally

```bash
# Compile and run
npm run compile
npm run compile:webview

# Press F5 to debug in Extension Development Host
# Telemetry will be sent to your Azure Application Insights instance
```

### 4. Verify Telemetry in Azure

1. Go to Azure Portal > Your Application Insights resource
2. Navigate to **Logs** or **Live Metrics**
3. Wait a few minutes for data to appear
4. Query recent events:

```kusto
customEvents
| where timestamp > ago(1h)
| project timestamp, name, customDimensions
| order by timestamp desc
```

## GitHub Actions Setup

### 1. Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `VSCODE_TELEMETRY_CONNECTION_STRING` | Azure App Insights connection string | `InstrumentationKey=xxx;...` |
| `VSCE_PAT` | VS Code Marketplace Personal Access Token | `xxxxxx` |
| `OVSX_PAT` | Open VSX Personal Access Token (optional) | `xxxxxx` |

### 2. Get VS Code Marketplace PAT

1. Go to [Azure DevOps](https://dev.azure.com)
2. Create a Personal Access Token:
   - **Organization**: All accessible organizations
   - **Scopes**: **Marketplace** > **Manage**
   - **Expiration**: 1 year (or your preference)
3. Copy the token and save it as `VSCE_PAT` secret in GitHub

### 3. Get Open VSX PAT (Optional)

1. Go to [Open VSX Registry](https://open-vsx.org)
2. Create an account and generate an access token
3. Save it as `OVSX_PAT` secret in GitHub

## Workflow Files

Two GitHub Actions workflows are provided:

### CI Workflow (`.github/workflows/ci.yml`)

- Runs on every push and pull request
- Builds and tests the extension
- **Does NOT inject telemetry secrets** (extension handles this gracefully)
- Runs on multiple platforms (Ubuntu, macOS, Windows)

### Publish Workflow (`.github/workflows/publish.yml`)

- Runs on release creation or manual trigger
- Builds with telemetry secrets injected
- Publishes to VS Code Marketplace and Open VSX
- Creates artifacts with VSIX file

## How Telemetry Connection String Works

### Priority Chain

The `TelemetryManager` checks for the connection string in this order:

1. **Environment variable** (development/CI):
   ```typescript
   process.env.VSCODE_TELEMETRY_CONNECTION_STRING
   ```

2. **package.json** (production builds):
   ```json
   {
     "telemetryConnectionString": "InstrumentationKey=xxx;..."
   }
   ```

3. **Fallback**: If neither exists, telemetry is disabled gracefully
   - Extension logs: "No telemetry connection string found"
   - All telemetry methods become no-ops
   - Extension works perfectly without telemetry

### Graceful Degradation

```typescript
// In telemetryManager.ts
private getTelemetryConnectionString(): string | undefined {
  // Try environment variable first (for development/local testing)
  if (process.env.VSCODE_TELEMETRY_CONNECTION_STRING) {
    return process.env.VSCODE_TELEMETRY_CONNECTION_STRING;
  }

  // Try from extension's package.json (for production builds)
  const extension = vscode.extensions.getExtension("personal.dev-buddy");
  const connectionString = extension?.packageJSON.telemetryConnectionString;

  if (connectionString) {
    return connectionString;
  }

  // No connection string found
  return undefined;
}
```

## Security Best Practices

### ✅ DO

- Keep connection strings in `.env` files (never commit)
- Use GitHub Secrets for CI/CD
- Rotate connection strings periodically
- Use separate App Insights resources for dev/prod
- Monitor telemetry usage and costs in Azure

### ❌ DON'T

- Never commit `.env` files
- Never hardcode connection strings in code
- Never expose connection strings in logs
- Never share connection strings in chat/issues
- Never commit `.vsix` files with embedded secrets to public repos

## Testing Without Telemetry

You can develop and test the extension without setting up telemetry:

1. **Skip creating `.env`** - Extension works without it
2. **Check logs** - You'll see: "No telemetry connection string found"
3. **All features work** - Telemetry is completely optional

## Troubleshooting

### Telemetry Not Showing in Azure

**Problem**: Events not appearing in Application Insights

**Solutions**:
1. Wait 2-5 minutes for data ingestion
2. Check connection string format (must include all parts)
3. Verify environment variable is set: `echo $VSCODE_TELEMETRY_CONNECTION_STRING`
4. Enable debug logging: Set `DEVBUDDY_DEBUG_TELEMETRY=true` in `.env`
5. Check VS Code global telemetry setting: `telemetry.telemetryLevel`

### GitHub Actions Failing

**Problem**: Publish workflow fails with telemetry error

**Solutions**:
1. Verify `VSCODE_TELEMETRY_CONNECTION_STRING` secret is set in GitHub
2. Check secret name matches exactly (case-sensitive)
3. Ensure secret value doesn't have extra spaces or quotes
4. Re-run workflow after updating secrets

### Connection String Not Found Locally

**Problem**: "No telemetry connection string found" in logs

**Solutions**:
1. Ensure `.env` file exists in project root
2. Verify `.env` has correct variable name
3. Restart VS Code Extension Development Host
4. Check `.env` file isn't accidentally gitignored

## Alternative: Inject at Build Time

If you prefer not to use environment variables, you can inject the connection string at build time using a build script:

```typescript
// scripts/inject-telemetry.js
const fs = require('fs');
const path = require('path');

const connectionString = process.env.VSCODE_TELEMETRY_CONNECTION_STRING;

if (connectionString) {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.telemetryConnectionString = connectionString;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Telemetry connection string injected into package.json');
} else {
  console.log('⚠️ No telemetry connection string found, skipping injection');
}
```

Add to `package.json`:

```json
{
  "scripts": {
    "prepackage": "node scripts/inject-telemetry.js"
  }
}
```

## Cost Monitoring

Azure Application Insights has a free tier with limits:

- **Free tier**: 1 GB/month included
- **Overage**: ~$2.30 per GB

Monitor usage:
1. Azure Portal > Application Insights > Usage and estimated costs
2. Set up budget alerts
3. Configure sampling if needed (see Azure docs)

## Privacy Compliance

DevBuddy's telemetry is privacy-first:

- ✅ Opt-in only (respects VS Code global telemetry setting)
- ✅ No PII collected
- ✅ No code or file names tracked
- ✅ Anonymous user IDs (UUID v4)
- ✅ Sanitization for error messages
- ✅ GDPR compliant (export/delete commands)

See `src/utils/telemetryManager.ts` for implementation details.

---

## Quick Reference

```bash
# Local development
cp .env.example .env
# Edit .env with your connection string
npm run compile && npm run compile:webview
# Press F5 to debug

# GitHub Actions
# 1. Add VSCODE_TELEMETRY_CONNECTION_STRING secret
# 2. Add VSCE_PAT secret
# 3. Push or create release
# 4. Workflow injects secrets automatically

# Verify telemetry
# Azure Portal > Application Insights > Logs
# Query: customEvents | where timestamp > ago(1h)
```

---

**Need Help?** Check the [TelemetryManager implementation](../../src/utils/telemetryManager.ts) or open an issue on GitHub.

