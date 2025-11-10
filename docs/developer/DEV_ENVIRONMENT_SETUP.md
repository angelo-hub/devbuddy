# Development Environment Setup with Pre-configured Credentials

This guide explains how to set up your local development environment with pre-configured API credentials for quick testing without going through the setup flow each time.

## Quick Start

### 1. Create Your `.env` File

```bash
cp .env.example .env
```

### 2. Fill in Your Credentials

Edit `.env` with your actual credentials:

```bash
# Choose your provider (linear or jira)
DEV_PROVIDER=linear

# Linear credentials
DEV_LINEAR_API_TOKEN=lin_api_your_actual_token_here
DEV_LINEAR_ORGANIZATION=your-org-slug

# OR Jira credentials
DEV_JIRA_SITE_URL=https://yoursite.atlassian.net
DEV_JIRA_EMAIL=your-email@example.com
DEV_JIRA_API_TOKEN=your-actual-jira-token-here

# Optional: Enable debug mode
DEV_DEBUG_MODE=true
```

### 3. Launch in Development Mode

Open the Debug panel (⌘+Shift+D or Ctrl+Shift+D) and select:

- **"Run Extension (Linear Dev Mode)"** - Launch with Linear credentials
- **"Run Extension (Jira Dev Mode)"** - Launch with Jira credentials

Press F5 or click the green play button.

## How It Works

When you launch with one of the dev mode configurations:

1. **Environment variables are loaded** from VS Code's launch configuration
2. **DevBuddy reads these variables** on activation
3. **Credentials are automatically stored** in secure storage and settings
4. **Provider is set** to the correct platform (Linear or Jira)
5. **Debug mode is enabled** automatically (if requested)
6. **A warning banner appears** confirming dev mode is active

## Security Notes

- ✅ The `.env` file is **gitignored** and will never be committed
- ✅ Credentials are stored in **VS Code's secure storage** (OS keychain)
- ✅ Dev mode only activates when using specific launch configurations
- ⚠️ **Never commit your `.env` file** or share it publicly
- ⚠️ **Never commit credentials** to version control

## Getting Your Credentials

### Linear API Token

1. Go to [Linear Settings → API](https://linear.app/settings/account/security)
2. Create a new Personal API Key
3. Copy the token (starts with `lin_api_`)
4. Paste into `.env` as `DEV_LINEAR_API_TOKEN`

Your organization slug is in your Linear URL: `https://linear.app/YOUR-ORG-SLUG`

### Jira API Token

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a name (e.g., "DevBuddy Dev Testing")
4. Copy the generated token
5. Paste into `.env` as `DEV_JIRA_API_TOKEN`

Your site URL is your Jira Cloud URL: `https://yoursite.atlassian.net`

## Launch Configurations Explained

### Development Modes (Auto-Configure)

**Run Extension (Linear Dev Mode)**
- Loads Linear credentials from environment
- Sets provider to `linear`
- Enables debug logging
- Shows warning banner

**Run Extension (Jira Dev Mode)**
- Loads Jira credentials from environment
- Sets provider to `jira`
- Enables debug logging
- Shows warning banner

### Standard Modes (Manual Setup Required)

**Run Extension**
- Normal launch without auto-configuration
- Uses existing stored credentials
- Good for testing user setup flow

**Run Extension (Fresh Install)**
- Starts with clean user data directory
- No stored settings or credentials
- Perfect for testing first-time setup

**Run Extension with Walkthrough**
- Auto-opens the getting started walkthrough
- Uses existing credentials

**Run Extension with Help Menu**
- Auto-opens the help menu
- Uses existing credentials

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DEV_MODE` | Enable dev mode (auto-set by launch config) | `true` |
| `DEV_PROVIDER` | Platform to use | `linear` or `jira` |
| `DEV_LINEAR_API_TOKEN` | Linear Personal API key | `lin_api_abc123...` |
| `DEV_LINEAR_ORGANIZATION` | Linear org slug | `my-company` |
| `DEV_JIRA_SITE_URL` | Jira Cloud site URL | `https://mysite.atlassian.net` |
| `DEV_JIRA_EMAIL` | Jira account email | `dev@example.com` |
| `DEV_JIRA_API_TOKEN` | Jira API token | `ATATT3xF...` |
| `DEV_DEBUG_MODE` | Enable debug logging | `true` or `false` |

## Troubleshooting

### Credentials Not Loading

1. **Check your `.env` file exists** in the workspace root
2. **Verify environment variables** are in the launch configuration
3. **Check the Output panel** (View → Output → "DevBuddy") for logs
4. **Look for the dev mode banner** - it should appear on activation

### Wrong Provider Showing

1. **Check `DEV_PROVIDER`** in your `.env` file
2. **Restart the debug session** - settings persist between launches
3. **Use "Fresh Install" mode** to clear all settings

### Credentials Not Persisting

This is expected! Dev mode credentials are re-loaded on each debug session. This allows you to:
- Quickly switch between Linear and Jira
- Test with different accounts
- Avoid polluting your real extension settings

### Testing First-Time Setup

Use the **"Run Extension (Fresh Install)"** configuration to test the setup flow without dev mode credentials.

## Tips & Best Practices

### Quick Provider Switching

Keep both Linear and Jira credentials in your `.env`:

```bash
# Fill in both sets of credentials
DEV_LINEAR_API_TOKEN=lin_api_...
DEV_LINEAR_ORGANIZATION=my-org

DEV_JIRA_SITE_URL=https://mysite.atlassian.net
DEV_JIRA_EMAIL=dev@example.com
DEV_JIRA_API_TOKEN=ATATT...
```

Then just change the provider in `.env` or select different launch config:

```bash
# Switch between these
DEV_PROVIDER=linear
# or
DEV_PROVIDER=jira
```

### Debugging Credentials

Enable debug logging to see exactly what's happening:

```bash
DEV_DEBUG_MODE=true
```

Then check the Output panel (View → Output → "DevBuddy") for detailed logs.

### Multiple Workspaces

You can have different `.env` files for different projects:

```bash
~/work/devbuddy-test-linear/.env    # Linear credentials
~/work/devbuddy-test-jira/.env      # Jira credentials
```

### Keeping Credentials Updated

Update your `.env` file when:
- Your API token expires
- You want to test with a different account
- You switch organizations/workspaces

## VS Code Extension Development Tips

### Environment Variables in Launch Configs

VS Code launch configurations support environment variables:

```json
"env": {
  "MY_VAR": "${env:MY_VAR}"  // Reads from .env or system environment
}
```

Our dev mode configurations use this to read your `.env` file.

### How VS Code Loads Environment

1. VS Code reads your shell environment
2. Loads `.env` file if present (via extensions/plugins)
3. Merges launch configuration `env` block
4. Environment is available to the extension via `process.env`

### Debugging the Dev Loader

Set breakpoints in `src/shared/utils/devEnvLoader.ts` to see:
- What environment variables are detected
- How credentials are stored
- Any errors during loading

## Example Workflows

### Testing Linear Features

1. Set `DEV_PROVIDER=linear` in `.env`
2. Launch "Run Extension (Linear Dev Mode)"
3. Open DevBuddy sidebar - tickets load automatically
4. Test features without setup flow

### Testing Jira Features

1. Set `DEV_PROVIDER=jira` in `.env`
2. Launch "Run Extension (Jira Dev Mode)"
3. Open DevBuddy sidebar - issues load automatically
4. Test features without setup flow

### Testing Setup Flow

1. Use "Run Extension (Fresh Install)"
2. Complete setup manually
3. Verify setup works correctly
4. Return to dev mode for feature testing

### Comparing Providers

1. Launch with Linear dev mode
2. Test a feature
3. Stop debugging
4. Launch with Jira dev mode
5. Test the same feature
6. Compare behavior

## Related Files

- `.env.example` - Template for your `.env` file
- `.vscode/launch.json` - Launch configurations
- `src/shared/utils/devEnvLoader.ts` - Dev environment loader implementation
- `src/extension.ts` - Activation logic that loads dev credentials

## Questions?

Check the main development guide: `AGENTS.md`

---

**Remember:** Never commit your `.env` file! It contains sensitive credentials.

