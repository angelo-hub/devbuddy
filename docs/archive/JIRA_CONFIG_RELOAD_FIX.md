# 🔧 Jira Cloud Configuration Reload Fix

## Problem

After completing Jira Cloud setup and saving the API token, the connection test was failing with:
```
Error: Jira Cloud is not properly configured
```

## Root Cause

The `JiraCloudClient` uses a **singleton pattern**, which means once it's instantiated, it doesn't reload configuration from settings or secrets. Here's the flow:

1. **User runs setup** → `runJiraCloudSetup()`
2. **Setup saves config** → VS Code settings + secure storage
3. **Setup tests connection** → `testJiraCloudConnection()`
4. **Test creates client** → `JiraCloudClient.create()`
5. **Problem:** If client was already created before setup (e.g., by tree view initialization), it still has **empty config** from before setup

## Solution

### 1. Added `reset()` Method ✅

Allows resetting the singleton instance to force reinitialization:

```typescript
/**
 * Reset singleton instance (useful after configuration changes)
 */
static reset(): void {
  JiraCloudClient.instance = null;
}
```

### 2. Added `reload()` Method ✅

Allows existing instance to reload configuration:

```typescript
/**
 * Reload configuration from VS Code settings and secrets
 */
async reload(): Promise<void> {
  await this.initialize();
}
```

### 3. Enhanced Logging ✅

Better debugging information:

```typescript
if (this.isConfigured()) {
  logger.info(`Jira Cloud client initialized successfully (${this.siteUrl})`);
} else {
  logger.warn("Jira Cloud client not fully configured");
  logger.debug(`Config state: siteUrl=${!!this.siteUrl}, email=${!!this.email}, apiToken=${!!this.apiToken}`);
}
```

### 4. Reset Before Testing ✅

Updated `testJiraCloudConnection()` to reset the singleton:

```typescript
export async function testJiraCloudConnection(
  context: vscode.ExtensionContext
): Promise<boolean> {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Testing Jira Cloud connection...",
        cancellable: false,
      },
      async () => {
        // Reset the singleton to force it to reload configuration
        JiraCloudClient.reset();
        const client = await JiraCloudClient.create();

        if (!client.isConfigured()) {
          throw new Error("Jira Cloud is not properly configured");
        }

        const user = await client.getCurrentUser();
        // ... rest of test
      }
    );
    // ... rest of function
  }
}
```

### 5. Added Delay After Saving ✅

Small delay to ensure VS Code persists settings before testing:

```typescript
// Save API token to secure storage
await context.secrets.store("jiraCloudApiToken", apiToken);

logger.success("Jira Cloud configuration saved");
logger.debug(`Saved config: siteUrl=${siteUrl}, email=${email}`);

// Small delay to ensure settings are persisted
await new Promise(resolve => setTimeout(resolve, 100));

// Step 6: Test connection
const testing = await vscode.window.showInformationMessage(
  "Configuration saved! Test the connection now?",
  "Test Connection",
  "Skip"
);
```

## How It Works Now

### Before (Broken)
```
1. Extension activates
2. JiraIssuesProvider created → JiraCloudClient.create() (empty config)
3. User runs setup → Saves config
4. Test runs → Uses SAME instance (still empty config)
5. ❌ Error: "Jira Cloud is not properly configured"
```

### After (Fixed)
```
1. Extension activates
2. JiraIssuesProvider created → JiraCloudClient.create() (empty config)
3. User runs setup → Saves config
4. Test runs → JiraCloudClient.reset() → New instance created
5. New instance reads fresh config from settings/secrets
6. ✅ Success: "Connected to Jira Cloud as John Doe (john@company.com)"
```

## Files Changed

- ✅ `src/providers/jira/cloud/JiraCloudClient.ts`
  - Added `reset()` static method
  - Added `reload()` instance method
  - Enhanced logging with site URL and debug info

- ✅ `src/providers/jira/cloud/firstTimeSetup.ts`
  - Call `JiraCloudClient.reset()` before testing
  - Added debug logging for saved config
  - Added 100ms delay after saving config

## Testing

To verify the fix:

1. **Fresh install** (no Jira config):
   ```bash
   code --uninstall-extension dev-buddy
   rm -rf ~/Library/Application\ Support/Code/User/globalStorage/dev-buddy
   ```

2. **Install and run setup**:
   ```bash
   npm run package
   code --install-extension dev-buddy-*.vsix
   ```

3. **Run:** `DevBuddy: Setup Jira Cloud`
4. **Enter:** Jira URL, email, API token
5. **Click:** "Test Connection"
6. **Expected:** ✅ "Successfully connected to Jira Cloud!"

## Debug Information

If the issue persists, enable debug mode to see detailed logs:

1. Settings → `devBuddy.debugMode` → `true`
2. Output Panel → "DevBuddy"
3. Look for:
   ```
   [DevBuddy] Jira Cloud configuration saved
   [DevBuddy] Saved config: siteUrl=mycompany.atlassian.net, email=user@company.com
   [DevBuddy] Testing Jira Cloud connection...
   [DevBuddy] Jira Cloud client initialized successfully (mycompany.atlassian.net)
   [DevBuddy] Connected to Jira Cloud as John Doe (john@company.com)
   ```

## Related Issues

This singleton pattern issue could also affect:
- Configuration updates via settings
- Switching Jira workspaces
- Updating API tokens

**Future Enhancement:** Consider adding a configuration change listener that automatically reloads the client when settings change.

---

**Status:** ✅ **FIXED**

The Jira Cloud client now properly reloads configuration after setup, and connection tests should succeed! 🚀

