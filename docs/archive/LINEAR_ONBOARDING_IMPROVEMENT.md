# Linear Onboarding Improvement

## Overview

Enhanced the onboarding experience to make it easier for users to connect their Linear workspace by automatically detecting their organization and providing a direct link to the API key settings.

## Changes

### 1. First-Time Setup Flow (`src/utils/firstTimeSetup.ts`)

The onboarding now starts by asking users for any URL from their Linear workspace:

1. **URL Input**: Users paste any Linear URL (ticket, project, etc.)
   - Example: `https://linear.app/yourorg/issue/ENG-123`
   
2. **Organization Detection**: The system automatically extracts the organization slug
   - Parses the URL to extract `yourorg` from `linear.app/yourorg/...`
   
3. **Direct API Key Link**: Opens the exact page where users can generate their API key
   - Constructs: `https://linear.app/{org}/settings/account/security`
   - Provides "Open API Key Settings" button to open directly in browser
   
4. **API Token Input**: Securely collects and stores the Personal API Key

### 2. Token Configuration Command (`src/extension.ts`)

Updated the `linearBuddy.configureLinearToken` command to use the same flow:

- Checks if organization is already stored
- If not, asks for Linear URL and stores the organization
- Provides direct link to API key settings
- Collects and securely stores the API token

## Benefits

1. **Reduced Friction**: Users don't need to navigate through Linear's settings manually
2. **Clear Instructions**: Step-by-step guidance with contextual buttons
3. **Organization-Specific**: The link goes directly to the user's specific organization
4. **One-Time Setup**: Organization is stored for future token updates

## Configuration

The Linear organization is stored in VS Code settings:

```json
{
  "linearBuddy.linearOrganization": "yourorg"
}
```

This allows the extension to:
- Provide direct links to the correct organization's settings
- Skip asking for URLs on subsequent token updates
- Potentially be used for other organization-specific features in the future

## URL Parsing

The parser handles multiple URL formats:

- `https://linear.app/org/issue/...`
- `http://linear.app/org/team/...`
- `linear.app/org/project/...`
- Strips `www.` and protocols automatically

## Example Flow

1. User runs first-time setup
2. System asks: "Enter any URL from your Linear workspace"
3. User pastes: `https://linear.app/acme/issue/ENG-123`
4. System extracts: `acme`
5. System shows: "Open API Key Settings" button
6. Clicking button opens: `https://linear.app/acme/settings/account/security`
7. User copies their Personal API Key
8. User returns to VS Code and pastes the key
9. Done! ✅

## Future Enhancements

Potential improvements:
- Support for custom Linear instances
- Validation of organization existence via API
- Show organization name in settings UI
- Quick link to organization dashboard

