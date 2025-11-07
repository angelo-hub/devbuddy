# Connect Your Linear Workspace

To use Linear Buddy, you'll need a Linear Personal API Key. This lets the extension securely access your Linear workspace.

## Getting Your API Key

1. Click the **"Configure Linear API Key"** button in the walkthrough step
2. Enter any URL from your Linear workspace (e.g., a ticket or project URL)
3. Linear Buddy will automatically detect your organization
4. We'll open your Linear API settings page directly
5. Copy your **Personal API Key** from Linear
6. Paste it back in VS Code

## Example Linear URLs

Any of these URL formats work:
- `https://linear.app/acme/issue/ENG-123`
- `https://linear.app/acme/team/ENG/active`
- `https://linear.app/acme/project/new-feature`

## Security & Privacy

Your API key is stored securely using **VS Code's Secret Storage API**, which uses:
- 🔐 **macOS**: Keychain
- 🔐 **Windows**: Credential Vault
- 🔐 **Linux**: Secret Service API

Your API key is:
- **Never shared** with third parties
- **Never logged** or stored in plain text
- **Only used** to communicate with Linear's official API
- **Stored locally** on your machine

🔒 **Your data stays private and secure.**

