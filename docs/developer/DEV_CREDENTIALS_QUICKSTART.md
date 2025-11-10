# Development Environment with Pre-configured Credentials

## Quick Setup

1. **Set your shell environment variables:**

```bash
# For Linear
export DEV_LINEAR_API_TOKEN="your_token_here"
export DEV_LINEAR_ORGANIZATION="your-org"

# For Jira
export DEV_JIRA_SITE_URL="https://yoursite.atlassian.net"
export DEV_JIRA_EMAIL="your-email@example.com"
export DEV_JIRA_API_TOKEN="your_token_here"
```

2. **Launch in debug mode:**
   - Press F5 or ⌘+Shift+D
   - Select **"Run Extension (Linear Dev Mode)"** or **"Run Extension (Jira Dev Mode)"**
   - Extension will auto-configure with your credentials

3. **Test immediately:**
   - Sidebar loads your tickets automatically
   - No setup flow required
   - Debug mode enabled by default

## What This Gives You

✅ **Quick Testing** - Skip setup flow entirely  
✅ **Easy Switching** - Change providers with one click  
✅ **Secure** - Uses VS Code's secure storage  
✅ **Clean** - No credentials in code  
✅ **Fast** - Test features immediately  

## Getting Credentials

**Linear:** [linear.app/settings/account/security](https://linear.app/settings/account/security)  
**Jira:** [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

## Full Documentation

See [docs/developer/DEV_ENVIRONMENT_SETUP.md](docs/developer/DEV_ENVIRONMENT_SETUP.md) for complete guide.

