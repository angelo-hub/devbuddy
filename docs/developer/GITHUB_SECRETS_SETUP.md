# GitHub Secrets Quick Setup

Step-by-step guide to configure GitHub repository secrets for CI/CD.

## Required Secrets

| Secret Name | Purpose | Required For |
|------------|---------|-------------|
| `VSCODE_TELEMETRY_CONNECTION_STRING` | Azure App Insights telemetry | Production builds |
| `VSCE_PAT` | VS Code Marketplace publishing | Publishing to marketplace |
| `OVSX_PAT` | Open VSX publishing | Publishing to Open VSX (optional) |

## Step-by-Step Setup

### 1. Azure Application Insights Connection String

**Get the connection string:**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Application Insights resource (or create one)
3. Go to **Properties**
4. Copy the **Connection String**

**Format:**
```
InstrumentationKey=xxx-xxx-xxx;IngestionEndpoint=https://xxx.in.applicationinsights.azure.com/;LiveEndpoint=https://xxx.livediagnostics.monitor.azure.com/
```

### 2. VS Code Marketplace PAT

**Get the Personal Access Token:**

1. Go to [Azure DevOps](https://dev.azure.com)
2. Click on your profile icon (top right) → **Personal access tokens**
3. Click **+ New Token**
4. Configure:
   - **Name**: `vscode-marketplace-publish`
   - **Organization**: All accessible organizations
   - **Expiration**: 1 year (or custom)
   - **Scopes**: 
     - Check **Custom defined**
     - Expand **Marketplace**
     - Check **Manage** (includes Acquire and Publish)
5. Click **Create**
6. **IMPORTANT**: Copy the token immediately (you won't see it again)

### 3. Open VSX PAT (Optional)

**Get the access token:**

1. Go to [Open VSX Registry](https://open-vsx.org)
2. Sign up or log in
3. Go to your profile → **Access Tokens**
4. Click **Generate New Token**
5. Copy the token

### 4. Add Secrets to GitHub

**For each secret:**

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter:
   - **Name**: Exact name from table above (case-sensitive)
   - **Secret**: Paste the value
6. Click **Add secret**

**Add all three secrets:**

```
VSCODE_TELEMETRY_CONNECTION_STRING = InstrumentationKey=xxx;...
VSCE_PAT = xxxxxxxxxxxxxx
OVSX_PAT = xxxxxxxxxxxxxx (optional)
```

## Verify Setup

### 1. Check Secrets Are Added

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see all three secrets listed
3. Note: GitHub never shows the actual values (only names)

### 2. Test with CI Workflow

```bash
# Push a commit to trigger CI
git add .
git commit -m "test: verify CI workflow"
git push
```

1. Go to **Actions** tab in GitHub
2. Watch the CI workflow run
3. All steps should pass (green checkmarks)

### 3. Test Telemetry Locally

```bash
# Create .env file
cp .env.example .env

# Edit .env with your Azure connection string
# (same value as VSCODE_TELEMETRY_CONNECTION_STRING)

# Compile and run
npm run compile
npm run compile:webview

# Press F5 in VS Code to debug
# Check "Linear Buddy" output channel for telemetry logs
```

## Troubleshooting

### Secret Not Found Error in Workflow

**Error message**: `secret.VSCODE_TELEMETRY_CONNECTION_STRING is undefined`

**Solutions**:
1. Verify secret name is exactly: `VSCODE_TELEMETRY_CONNECTION_STRING` (case-sensitive)
2. Check the secret is added under **Actions** (not Dependabot or Codespaces)
3. Re-add the secret if needed
4. Ensure you're in the correct repository (not a fork)

### VSCE_PAT Authentication Failed

**Error message**: `Failed request: Unauthorized (401)`

**Solutions**:
1. Verify the PAT has **Marketplace > Manage** permission
2. Check the PAT hasn't expired
3. Ensure organization scope is "All accessible organizations"
4. Regenerate the token and update the secret

### Telemetry Not Working in Production Build

**Symptom**: No telemetry events in Azure Application Insights

**Solutions**:
1. Wait 2-5 minutes for data ingestion
2. Verify connection string format (must include all three parts)
3. Check workflow logs for "Telemetry reporter initialized"
4. Ensure the secret doesn't have extra spaces or quotes
5. Test locally first with `.env` file

### OVSX_PAT Publishing Failed

**Error message**: `Invalid access token`

**Solutions**:
1. Verify you're logged into Open VSX
2. Regenerate the access token
3. Update the GitHub secret
4. If you don't want Open VSX publishing, remove that step from the workflow

## Security Best Practices

✅ **DO**:
- Rotate PATs every 6-12 months
- Use minimal required permissions
- Set expiration dates on tokens
- Use separate tokens for dev/prod
- Monitor token usage in Azure DevOps

❌ **DON'T**:
- Share PATs in chat/email/issues
- Commit tokens to git history
- Use personal accounts for organization tokens
- Leave tokens without expiration
- Use the same token for multiple purposes

## Cost Monitoring

### Azure Application Insights

**Free tier limits**:
- 1 GB data ingestion per month (free)
- $2.30 per additional GB

**Monitor usage**:
1. Azure Portal → Application Insights → **Usage and estimated costs**
2. Set up budget alerts:
   - Go to **Cost Management + Billing**
   - Create budget alert at 80% of your limit
3. Enable sampling if needed (see Azure docs)

### VS Code Marketplace

- Publishing is **free**
- No usage limits or costs

### Open VSX

- Publishing is **free**
- No usage limits or costs

## Testing the Full Pipeline

### Test CI (Pull Request)

```bash
# Create a feature branch
git checkout -b test/ci-workflow

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "test: verify CI workflow"
git push origin test/ci-workflow

# Create pull request on GitHub
# Watch CI run in Actions tab
```

### Test Publishing (Release)

```bash
# Ensure main branch is clean
git checkout main
git pull

# Create a release on GitHub:
# 1. Go to Releases → Draft a new release
# 2. Create a new tag (e.g., v0.1.1)
# 3. Title: "Release v0.1.1"
# 4. Description: "Test release"
# 5. Click "Publish release"

# Watch the publish workflow in Actions tab
# VSIX should be uploaded as artifact
# Extension published to marketplace (if VSCE_PAT is valid)
```

## Quick Command Reference

```bash
# Local development with telemetry
cp .env.example .env
# Edit .env with connection string
npm run compile && npm run compile:webview

# Test package creation
npm run package
# Creates *.vsix file

# Manual publish to VS Code Marketplace
npx @vscode/vsce publish
# Uses VSCE_PAT environment variable

# Manual publish to Open VSX
npx ovsx publish *.vsix
# Uses OVSX_PAT environment variable
```

## Related Documentation

- [Telemetry Secrets Setup](./TELEMETRY_SECRETS_SETUP.md) - Detailed telemetry guide
- [Azure App Insights Docs](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Open VSX Publishing](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions)

---

**Questions?** Open an issue on GitHub or check the [Debug Guide](./DEBUG_QUICK_START.md).


