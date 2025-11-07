# Secure Storage Migration for Linear API Key

## Summary

The Linear API key is now stored securely using VS Code's SecretStorage API instead of plain-text workspace settings. This is a critical security improvement that protects your Linear API credentials.

## What Changed

### Before (Insecure)
- API keys were stored in workspace settings (`settings.json`)
- Keys were stored as plain text
- Keys could be accidentally committed to version control
- Keys were visible in settings UI

### After (Secure)
- API keys are stored in VS Code's SecretStorage
- Storage is encrypted by the operating system
- Keys are never stored in plain text files
- Keys are isolated per workspace
- Automatic migration from old storage

## Technical Details

### Storage Location

VS Code's SecretStorage uses the following secure storage mechanisms:

- **macOS**: Keychain
- **Windows**: Windows Credential Manager
- **Linux**: Secret Service API (libsecret)

### API Changes

#### LinearClient Class

**New Static Methods:**
```typescript
// Initialize secret storage (called during extension activation)
static initializeSecretStorage(secretStorage: vscode.SecretStorage): void

// Get API token from secure storage
static async getApiToken(): Promise<string>

// Set API token in secure storage
static async setApiToken(token: string): Promise<void>

// Delete API token from secure storage
static async deleteApiToken(): Promise<void>

// Create a LinearClient with token from secure storage
static async create(): Promise<LinearClient>
```

**Usage Pattern:**
```typescript
// Old (insecure)
const client = new LinearClient(); // Reads from settings.json

// New (secure)
const client = await LinearClient.create(); // Reads from secure storage
```

### Migration Process

1. **Automatic Migration**: On extension activation, the system checks if an API token exists in the old location (`settings.json`)

2. **Safe Transfer**: If found, it's automatically migrated to SecretStorage

3. **Cleanup**: The token is removed from `settings.json`

4. **User Notification**: Users are informed of the migration

### Files Modified

1. **src/utils/linearClient.ts**
   - Added SecretStorage integration
   - Changed from synchronous to async initialization
   - Added static methods for token management

2. **src/extension.ts**
   - Initialize SecretStorage on activation
   - Added `migrateApiTokenToSecureStorage()` function
   - Updated `configureLinearToken` command

3. **src/views/linearTicketsProvider.ts**
   - Changed to async client initialization
   - Updated all LinearClient usage to async pattern

4. **src/commands/convertTodoToTicket.ts**
   - Updated to use `LinearClient.create()`

5. **src/chat/linearBuddyParticipant.ts**
   - Changed to async client initialization
   - Updated all LinearClient usage

6. **src/views/standupBuilderPanel.ts**
   - Changed to async client initialization
   - Updated all LinearClient usage

7. **src/views/linearTicketPanel.ts**
   - Changed to async client initialization
   - Updated all LinearClient usage

8. **package.json**
   - Removed `linearBuddy.linearApiToken` configuration property

## For Users

### First-Time Setup

Run the command: **"Linear Buddy: Update Linear API Key"**

This will:
1. Prompt for your API token (input is masked)
2. Store it securely using your OS's credential manager
3. The token is never written to disk in plain text

### Existing Users

- Your token will be automatically migrated on next extension reload
- You'll see a notification confirming the migration
- Your old token in `settings.json` will be removed
- No action required!

### Security Benefits

✅ **Encryption**: Tokens encrypted by OS credential managers
✅ **No Plain Text**: Never stored in readable format
✅ **No VCS Leaks**: Can't be accidentally committed
✅ **Workspace Isolation**: Each workspace has separate secure storage
✅ **Audit Trail**: OS-level access logging (varies by platform)

## For Developers

### Testing

To test the secure storage implementation:

```typescript
// Get token programmatically
const token = await LinearClient.getApiToken();

// Set token programmatically
await LinearClient.setApiToken('lin_api_...');

// Delete token
await LinearClient.deleteApiToken();
```

### Debugging

- Tokens are NOT visible in VS Code settings UI
- Use OS-specific tools to inspect:
  - **macOS**: Keychain Access app
  - **Windows**: Credential Manager
  - **Linux**: `secret-tool` command

### Best Practices

1. **Always use `await`** when calling `LinearClient.create()`
2. **Initialize SecretStorage early** in extension activation
3. **Handle errors** for unauthorized/missing tokens
4. **Never log** the actual token value

## Migration Checklist

- [x] Update LinearClient to use SecretStorage
- [x] Add async initialization pattern
- [x] Update all consumers to use async pattern
- [x] Add migration function
- [x] Remove old configuration property
- [x] Test token storage and retrieval
- [x] Test migration from old format
- [x] Update documentation

## Rollback Plan

If issues occur, users can:

1. Run command: **"Linear Buddy: Update Linear API Key"**
2. Re-enter their API token
3. The system will store it securely again

## Additional Notes

- Migration is **non-destructive**: Original token is only removed after successful migration
- SecretStorage is **workspace-scoped**: Different workspaces can have different tokens
- **No breaking changes** for end users: Everything works the same, just more securely

## References

- [VS Code SecretStorage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage)
- [Linear API Authentication](https://developers.linear.app/docs/graphql/working-with-the-graphql-api#authentication)

