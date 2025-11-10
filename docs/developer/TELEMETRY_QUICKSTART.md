# Telemetry Setup for VS Code Extensions

Quick guide for setting up telemetry with Azure Application Insights and GitHub Actions.

## 🚀 Quick Setup (5 minutes)

### 1. Local Development

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Azure Application Insights connection string
# Get it from: Azure Portal > Application Insights > Properties > Connection String
```

Your `.env` should look like:
```bash
VSCODE_TELEMETRY_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://xxx.in.applicationinsights.azure.com/;LiveEndpoint=https://xxx.livediagnostics.monitor.azure.com/
```

### 2. GitHub Actions

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

| Secret Name | Where to Get It |
|------------|----------------|
| `VSCODE_TELEMETRY_CONNECTION_STRING` | Azure Portal → App Insights → Properties |
| `VSCE_PAT` | Azure DevOps → Personal Access Tokens (Marketplace > Manage scope) |
| `OVSX_PAT` | Open VSX Registry → Access Tokens (optional) |

### 3. Test It Works

```bash
# Local test
npm run compile && npm run compile:webview
# Press F5 to debug
# Check "DevBuddy" output channel for telemetry logs

# CI test
git add . && git commit -m "test: CI" && git push
# Check Actions tab on GitHub
```

## 📖 Detailed Guides

- **[Telemetry Secrets Setup](./TELEMETRY_SECRETS_SETUP.md)** - Complete setup guide with Azure, local dev, and CI/CD
- **[GitHub Secrets Setup](./GITHUB_SECRETS_SETUP.md)** - Step-by-step GitHub Actions configuration
- **[Debug Guide](./DEBUG_QUICK_START.md)** - Troubleshooting telemetry issues

## 🔐 Security

- ✅ `.env` is already in `.gitignore` - never commit it
- ✅ GitHub Secrets are encrypted and hidden
- ✅ Telemetry connection string is injected at build time
- ✅ Extension works without telemetry (graceful fallback)

## 🏗️ Architecture

```
Local Development:
  .env file → process.env → TelemetryManager

GitHub Actions (CI):
  No telemetry → builds without secrets → works normally

GitHub Actions (Publish):
  GitHub Secrets → injected as env vars → embedded in package → TelemetryManager
```

## ❓ FAQ

**Q: What if I don't want telemetry?**  
A: Just skip creating `.env` and don't add GitHub secrets. The extension works perfectly without telemetry.

**Q: Will my builds fail without telemetry?**  
A: No! The `TelemetryManager` handles missing connection strings gracefully. You'll see a log message but everything works.

**Q: How much does Azure Application Insights cost?**  
A: Free tier includes 1 GB/month. For a VS Code extension, you'll likely stay within the free tier. Monitor at Azure Portal → Usage and estimated costs.

**Q: Can I use a different telemetry service?**  
A: Yes! The `TelemetryManager` uses VS Code's native `@vscode/extension-telemetry` package, which supports Azure App Insights. You could modify it to use other services.

**Q: Where can I see my telemetry data?**  
A: Azure Portal → Your Application Insights resource → Logs. Use query: `customEvents | where timestamp > ago(1h)`

## 📦 Files Created

- `.env.example` - Template for local environment variables
- `.github/workflows/ci.yml` - Continuous integration workflow (no secrets needed)
- `.github/workflows/publish.yml` - Publishing workflow (uses secrets)
- `docs/developer/TELEMETRY_SECRETS_SETUP.md` - Comprehensive setup guide
- `docs/developer/GITHUB_SECRETS_SETUP.md` - GitHub Actions configuration guide

## 🛠️ Troubleshooting

### "No telemetry connection string found" in logs

- **Local dev**: Create `.env` file with connection string
- **Production**: Add `VSCODE_TELEMETRY_CONNECTION_STRING` secret in GitHub
- **Note**: This is not an error - extension works without telemetry

### GitHub Actions failing

- Verify secret names match exactly (case-sensitive)
- Check secrets are added under "Actions" (not Dependabot)
- Ensure VSCE_PAT has Marketplace > Manage permission
- Try re-adding the secrets

### Telemetry not showing in Azure

- Wait 2-5 minutes for data ingestion
- Verify connection string format (must have all three parts)
- Check VS Code's global telemetry setting: `telemetry.telemetryLevel`
- Enable debug mode in your extension settings

## 🎯 Next Steps

1. ✅ Create `.env` file from `.env.example`
2. ✅ Add your Azure App Insights connection string
3. ✅ Test locally with F5
4. ✅ Add GitHub secrets
5. ✅ Push a commit to test CI
6. ✅ Create a release to test publishing

---

**Need help?** Check the detailed guides above or open an issue on GitHub.

