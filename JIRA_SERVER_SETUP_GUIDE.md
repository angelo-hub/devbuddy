# DevBuddy: Jira Server/Data Center Setup Guide

Quick guide to connect DevBuddy with your self-hosted Jira Server or Data Center instance.

## What is Jira Server/Data Center?

- **Jira Server**: Self-hosted Jira on your company's infrastructure
- **Jira Data Center**: Enterprise version with clustering and high availability
- **NOT Jira Cloud**: Cloud uses `atlassian.net` URLs (see [Jira Cloud Setup](JIRA_QUICK_START.md) instead)

**How to tell?**
- Jira Server/Data Center: `http://jira.company.com` or `https://jira.internal.company.com`
- Jira Cloud: `https://yourcompany.atlassian.net`

---

## Supported Versions

✅ **Jira Server 8.0+**  
✅ **Jira Data Center 8.0+**

DevBuddy has been tested with:
- Jira 8.5 LTS
- Jira 8.20 LTS
- Jira 9.4 LTS
- Jira 9.12 LTS (latest)

Older versions (7.x) are not supported due to API limitations.

---

## Quick Setup (5 Minutes)

### Step 1: Start Setup Wizard

In VS Code:
```
Command Palette (Cmd/Ctrl+Shift+P) → DevBuddy: Setup Jira Server/Data Center
```

Or:
```
DevBuddy Sidebar → Click "Setup Jira"
```

### Step 2: Enter Server URL

Enter your Jira Server URL (including `http://` or `https://`):

**Examples:**
- `http://jira.company.com`
- `https://jira.internal.mycompany.com`
- `http://10.0.1.100:8080`

**Important:**
- Include the protocol (`http://` or `https://`)
- Do NOT include `/browse` or other paths
- Remove trailing slash

### Step 3: Enter Username

Enter your Jira username (NOT email):

**Example:**
- Username: `john.doe`
- NOT: `john.doe@company.com`

### Step 4: Choose Authentication

**Option A: Personal Access Token (Recommended)**
- Available in Jira 8.14+
- More secure than password
- Create at: **Settings → Personal Access Tokens**

**Option B: Password**
- Works on all Jira Server versions
- Uses your Jira login password
- Less secure but universally compatible

### Step 5: Test Connection

DevBuddy will:
1. Detect your Jira Server version
2. Test authentication
3. Fetch your issues
4. Show server capabilities

✅ **Success!** You're ready to use DevBuddy with Jira Server.

---

## Creating a Personal Access Token (Recommended)

If your Jira version is 8.14 or later, use a PAT instead of your password.

### 1. Access Token Settings

In Jira:
```
Profile (top right) → Settings → Personal Access Tokens
```

Or navigate to:
```
https://jira.company.com/secure/ViewProfile.jspa → Personal Access Tokens
```

### 2. Create Token

1. Click **"Create token"**
2. **Token name**: `DevBuddy VS Code Extension`
3. **Expiry**: Choose expiration (recommend: 90 days or 1 year)
4. Click **"Create"**

### 3. Copy Token

⚠️ **Important**: Copy the token immediately - you can't view it again!

Token format: Long alphanumeric string (60+ characters)

Example: `NjM4OTY4NjI1NjE3OkRlbm55IExpbmRzdHLDtsK2w7bDtsO2w7bDtsO2`

### 4. Use Token in DevBuddy

When DevBuddy asks for authentication:
1. Choose **"Personal Access Token"**
2. Paste the token
3. Test connection

---

## Troubleshooting

### ❌ Connection Failed: Cannot Reach Server

**Possible causes:**
1. Wrong URL
2. Server is down
3. Network restrictions (VPN required?)
4. Firewall blocking connection

**Solutions:**
- Open the URL in your browser - does it work?
- Are you on the company network or VPN?
- Try `http://` if `https://` fails (or vice versa)
- Check with your Jira admin

### ❌ Authentication Failed: 401 Unauthorized

**Possible causes:**
1. Wrong username or password/token
2. Account locked or disabled
3. Token expired

**Solutions:**
- Double-check username (not email!)
- Verify password by logging into Jira web
- If using PAT, create a new token
- Try "Password" option instead of PAT

### ❌ 403 Forbidden: Access Denied

**Possible causes:**
1. Insufficient permissions
2. API access disabled

**Solutions:**
- Ask your Jira admin to grant API access
- Ensure you have permission to view issues
- Try logging into Jira web to verify account status

### ❌ Version Not Supported

If you see: "Jira Server 7.x is not supported"

**Solution:**
- Ask your admin to upgrade to Jira 8.0+
- Jira 7.x reached end-of-life and has security issues
- DevBuddy requires Jira 8.0+ for full feature support

### ❌ Server Info Shows Wrong Version

If DevBuddy detects the wrong version or says "Cloud" when you have Server:

**Solution:**
1. Run: `Command Palette → DevBuddy: Reset Jira Configuration`
2. Run setup again
3. Ensure URL is correct (no `/rest/api` or other paths)

---

## Features by Version

| Feature | Jira 8.0-8.13 | Jira 8.14-8.20 | Jira 9.0+ |
|---------|---------------|----------------|-----------|
| **Basic Auth** | ✅ | ✅ | ✅ |
| **Personal Access Tokens** | ❌ | ✅ | ✅ |
| **Rich Text (ADF)** | ✅ | ✅ | ✅ |
| **View Issues** | ✅ | ✅ | ✅ |
| **Create Issues** | ✅ | ✅ | ✅ |
| **Update Status** | ✅ | ✅ | ✅ |
| **Comments** | ✅ | ✅ | ✅ |
| **Agile Boards** | ✅ | ✅ | ✅ |
| **Custom Fields** | Basic | Enhanced | Full |
| **Workflow Properties** | ❌ | ✅ | ✅ |

---

## Configuration Options

### VS Code Settings

```json
{
  // Jira Type
  "devBuddy.jira.type": "server",
  
  // Server Configuration
  "devBuddy.jira.server.baseUrl": "http://jira.company.com",
  "devBuddy.jira.server.username": "john.doe",
  
  // Default Project (optional)
  "devBuddy.jira.defaultProject": "PROJ",
  
  // Provider (when using Jira)
  "devBuddy.provider": "jira"
}
```

**Note**: Password/Token is stored securely and not in settings.

### Secure Storage

Your password or PAT is stored in:
- **macOS**: Keychain
- **Windows**: Credential Manager
- **Linux**: Secret Service API

Never stored in plain text or in settings.json.

---

## Commands

Access via Command Palette (Cmd/Ctrl+Shift+P):

### Setup & Configuration
- `DevBuddy: Setup Jira Server/Data Center` - Initial setup
- `DevBuddy: Test Jira Server Connection` - Verify connection
- `DevBuddy: Update Jira Server Password/Token` - Change credentials
- `DevBuddy: Reset Jira Server Configuration` - Start fresh
- `DevBuddy: Show Jira Server Info` - View version and capabilities

### Issue Management
- `DevBuddy: Create Ticket` - Create new issue
- `DevBuddy: Refresh Jira Issues` - Reload issues
- Right-click issue in sidebar for more options:
  - Open in Jira
  - Update Status
  - Assign to Me
  - Add Comment
  - Copy Issue Key
  - Copy Issue URL

### AI Features (Pro)
- `DevBuddy: Generate PR Summary` - AI-powered PR descriptions
- `DevBuddy: Generate Standup` - Daily standup from commits
- `DevBuddy: Open Standup Builder` - Interactive standup creator

---

## FAQ

### Q: Can I use multiple Jira instances?

**A**: Not simultaneously, but you can switch between them:
1. `DevBuddy: Reset Jira Configuration`
2. Run setup for the other instance

### Q: Does DevBuddy work offline?

**A**: No, it requires network access to your Jira Server.

### Q: Will DevBuddy modify my Jira data?

**A**: Only when you explicitly create/update issues or add comments. Read operations (viewing issues) don't modify data.

### Q: Is my password safe?

**A**: Yes! DevBuddy uses VS Code's secure storage (Keychain/Credential Manager). Passwords are never stored in plain text.

### Q: Can my admin see I'm using DevBuddy?

**A**: API calls show as your user actions. Admins can see API usage but not that you're using DevBuddy specifically.

### Q: Does this work with Jira Data Center?

**A**: Yes! Data Center uses the same API as Jira Server.

### Q: What about Jira Cloud?

**A**: Use `DevBuddy: Setup Jira Cloud` instead. See [Jira Cloud Setup Guide](JIRA_QUICK_START.md).

---

## Getting Help

### View Logs

```
View → Output → Select "DevBuddy"
```

Logs show detailed API calls, errors, and debugging information.

### Enable Debug Mode

```json
{
  "devBuddy.debugMode": true
}
```

Shows more detailed logs for troubleshooting.

### Report Issues

If you encounter bugs:
1. Check logs for errors
2. Copy error message
3. Report at: https://github.com/angelo-hub/devbuddy/issues

Include:
- Jira Server version
- DevBuddy version
- Error message
- Steps to reproduce

---

## Security & Privacy

### What Data is Sent?

DevBuddy only communicates with your Jira Server:
- Authentication requests
- Issue fetches
- Issue updates
- Comments

**No data is sent to third parties.**

### API Token vs Password

**Personal Access Token (PAT)**:
- ✅ More secure
- ✅ Can be revoked without changing password
- ✅ Limited scope (API access only)
- ✅ Expiration dates

**Password**:
- ⚠️ Full account access
- ⚠️ No expiration
- ✅ Works on all versions

**Recommendation**: Use PAT if your Jira version supports it (8.14+).

---

## Next Steps

After setup:

1. **Explore Sidebar**: View your issues in the DevBuddy panel
2. **Create Ticket**: Try creating a test issue
3. **Update Status**: Practice workflow transitions
4. **Try AI Features**: Generate standup or PR summary (Pro)
5. **Read Docs**: Learn about advanced features

---

## Related Guides

- **Quick Start**: `JIRA_QUICK_START.md` (Cloud setup)
- **Feature Guide**: `LINEAR_BUDDY_GUIDE.md` (Comprehensive features)
- **Testing**: `JIRA_SERVER_TESTING_GUIDE.md` (For developers)
- **Version Compatibility**: `docs/planning/JIRA_VERSION_COMPATIBILITY.md`

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Jira Server Support**: 8.0+


