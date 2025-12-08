# Team License Implementation Guide

## Overview

This document explains how to implement team licenses where one license key can be used by multiple team members (different GitHub accounts).

---

## Architecture

### Team License Structure:

```typescript
// Lemon Squeezy License Metadata for Team License
{
  license_key: "TEAM-XXXX-XXXX-XXXX",
  status: "active",
  activation_limit: 15,  // 5 seats × 3 machines each = 15 total activations
  activation_usage: 8,   // Currently 3 team members on various machines
  
  meta: {
    license_type: "team",
    seats: 5,              // Number of team members allowed
    github_accounts: [     // Track which GitHub accounts are using seats
      {
        github_id: "12345",
        github_username: "alice",
        activated_at: "2025-01-15T10:00:00Z",
        machines: ["alice@machine-1", "alice@machine-2"]
      },
      {
        github_id: "67890",
        github_username: "bob",
        activated_at: "2025-01-16T11:30:00Z",
        machines: ["bob@machine-1", "bob@machine-2", "bob@machine-3"]
      },
      {
        github_id: "11111",
        github_username: "charlie",
        activated_at: "2025-01-17T09:00:00Z",
        machines: ["charlie@machine-1"]
      }
    ]
  }
}
```

---

## Implementation Option 1: Native Lemon Squeezy (Recommended) ⭐

### Lemon Squeezy Configuration:

When creating your Team product:

1. **Product Settings:**
   - Name: "DevBuddy Pro - Team (5 seats)"
   - Type: Recurring subscription or one-time
   - License keys: **Enabled**

2. **License Key Settings:**
   - **Activation limit**: `15` (5 seats × 3 machines per person)
   - **Allow multiple users**: No (Lemon Squeezy doesn't natively support this)
   - **Solution**: Track GitHub accounts in license metadata

### Code Changes to `licenseManager.ts`:

```typescript
// Add team license interface
interface TeamLicenseMetadata {
  license_type: 'personal' | 'team' | 'enterprise';
  seats?: number;
  github_accounts?: Array<{
    github_id: string;
    github_username: string;
    activated_at: string;
    machines: string[];
  }>;
}

// Update activateLicense method to handle team licenses
async activateLicense(licenseKey: string): Promise<boolean> {
  // ... existing GitHub auth code ...

  // Step 3: Validate license and check type
  const validationResponse = await this.validateLicenseWithLemonSqueezy(licenseKey);
  
  if (!validationResponse) {
    vscode.window.showErrorMessage('❌ Invalid license key.');
    return false;
  }

  // Check if this is a team license
  const licenseType = validationResponse.meta?.license_type || 'personal';
  const isTeamLicense = licenseType === 'team';

  if (isTeamLicense) {
    // Handle team license activation
    return await this.activateTeamLicense(licenseKey, githubUsername, githubId, validationResponse);
  } else {
    // Handle personal license (existing code)
    return await this.activatePersonalLicense(licenseKey, githubUsername, githubId, validationResponse);
  }
}

/**
 * Activate team license (multiple GitHub accounts allowed)
 */
private async activateTeamLicense(
  licenseKey: string,
  githubUsername: string,
  githubId: string,
  validationResponse: LemonSqueezyValidateResponse
): Promise<boolean> {
  const seats = validationResponse.meta?.seats || 5;
  const githubAccounts = validationResponse.meta?.github_accounts || [];

  // Check if this GitHub account is already using a seat
  const existingSeat = githubAccounts.find(acc => acc.github_id === githubId);

  if (!existingSeat) {
    // New team member - check if seats are available
    if (githubAccounts.length >= seats) {
      const usedSeats = githubAccounts.map(acc => `@${acc.github_username}`).join(', ');
      
      const choice = await vscode.window.showErrorMessage(
        `❌ All ${seats} team seats are in use.\n` +
        `Current team members: ${usedSeats}\n\n` +
        `To add a new member, an existing member must deactivate their seat.`,
        'Contact Admin',
        'View License Info'
      );

      if (choice === 'Contact Admin') {
        vscode.env.openExternal(
          vscode.Uri.parse('mailto:admin@yourteam.com?subject=DevBuddy Team License - Add Member')
        );
      } else if (choice === 'View License Info') {
        await vscode.commands.executeCommand('devBuddy.showLicenseInfo');
      }

      return false;
    }

    // Seat available - show confirmation
    const confirm = await vscode.window.showInformationMessage(
      `This is a team license with ${seats - githubAccounts.length} of ${seats} seats remaining.\n\n` +
      `Activate for @${githubUsername}?`,
      'Yes, Activate',
      'Cancel'
    );

    if (confirm !== 'Yes, Activate') {
      return false;
    }
  } else {
    // Existing team member activating on new machine
    const machineCount = existingSeat.machines.length;
    const machineLimit = 3; // Per-user machine limit

    if (machineCount >= machineLimit) {
      vscode.window.showErrorMessage(
        `❌ You (@${githubUsername}) have reached the machine limit (${machineLimit}) for this team license.\n` +
        `Deactivate on another machine first.`
      );
      return false;
    }
  }

  // Activate with Lemon Squeezy
  const activationResult = await this.activateLicenseWithLemonSqueezy(
    licenseKey,
    githubUsername,
    githubId
  );

  if (!activationResult) {
    return false;
  }

  // Store as team license
  await this.storeLicenseInfo({
    key: licenseKey,
    email: validationResponse.license_key.customer.email,
    type: 'team',
    expiresAt: validationResponse.license_key.expires_at 
      ? new Date(validationResponse.license_key.expires_at)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isValid: true,
    isTrial: false,
    features: ['all'],
    githubId: githubId,
    githubUsername: githubUsername,
  });

  await this.context.globalState.update(this.LAST_VALIDATION_KEY, new Date().toISOString());

  vscode.window.showInformationMessage(
    `✨ Team license activated for @${githubUsername}! (${githubAccounts.length + 1}/${seats} seats used)`
  );

  logger.success(`Team license activated: ${githubUsername} (${githubAccounts.length + 1}/${seats} seats)`);

  // TODO: Update license metadata with new GitHub account (requires backend)
  // await this.updateTeamLicenseMetadata(licenseKey, githubId, githubUsername, vscode.env.machineId);

  return true;
}

/**
 * Activate personal license (single GitHub account)
 */
private async activatePersonalLicense(
  licenseKey: string,
  githubUsername: string,
  githubId: string,
  validationResponse: LemonSqueezyValidateResponse
): Promise<boolean> {
  // Check if license is already associated with a different GitHub account
  const existingGitHubId = validationResponse.meta?.github_id;

  if (existingGitHubId && existingGitHubId !== githubId) {
    const choice = await vscode.window.showErrorMessage(
      `❌ This license is already associated with another GitHub account. ` +
      `If you own both accounts, you can transfer the license.`,
      'Contact Support',
      'Cancel'
    );

    if (choice === 'Contact Support') {
      vscode.env.openExternal(
        vscode.Uri.parse('mailto:support@angelogirardi.com?subject=DevBuddy Pro License Transfer Request')
      );
    }
    return false;
  }

  // ... rest of existing personal activation code ...
  
  const activationResult = await this.activateLicenseWithLemonSqueezy(
    licenseKey,
    githubUsername,
    githubId
  );

  if (!activationResult) {
    return false;
  }

  await this.storeLicenseInfo({
    key: licenseKey,
    email: validationResponse.license_key.customer.email,
    type: 'personal',
    expiresAt: validationResponse.license_key.expires_at 
      ? new Date(validationResponse.license_key.expires_at)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isValid: true,
    isTrial: false,
    features: ['all'],
    githubId: githubId,
    githubUsername: githubUsername,
  });

  await this.context.globalState.update(this.LAST_VALIDATION_KEY, new Date().toISOString());

  vscode.window.showInformationMessage(
    `✨ DevBuddy Pro activated successfully for @${githubUsername}!`
  );

  return true;
}

/**
 * Deactivate team license seat
 */
public async deactivateTeamSeat(): Promise<void> {
  const licenseInfo = await this.getCachedLicenseInfo();
  
  if (!licenseInfo || licenseInfo.type !== 'team') {
    vscode.window.showErrorMessage('No team license found.');
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    `⚠️ This will deactivate your team seat and remove access on all your machines.\n\n` +
    `Are you sure you want to proceed?`,
    { modal: true },
    'Yes, Deactivate',
    'Cancel'
  );

  if (confirm !== 'Yes, Deactivate') {
    return;
  }

  // Deactivate all machines for this user
  try {
    // Get all activations for this GitHub account
    // Call backend to deactivate all instances for this GitHub ID
    
    await this.context.secrets.delete(this.LICENSE_KEY);
    await this.context.globalState.update(this.LICENSE_METADATA_KEY, undefined);
    
    this.licenseInfo = null;
    
    vscode.window.showInformationMessage(
      `✅ Team seat deactivated. Another team member can now use this seat.`
    );
    
    logger.info(`Team seat deactivated for GitHub user: ${licenseInfo.githubUsername}`);
  } catch (error) {
    logger.error('Failed to deactivate team seat:', error);
    vscode.window.showErrorMessage('Failed to deactivate team seat. Please contact support.');
  }
}
```

---

## Implementation Option 2: Separate License Keys (Simpler)

### How It Works:

Lemon Squeezy can generate multiple license keys for one purchase:

```
Team purchases 5-seat license
  ↓
Lemon Squeezy generates 5 license keys:
  - DEVBUDDY-AAAA-1111-AAAA (Seat 1) → @alice
  - DEVBUDDY-BBBB-2222-BBBB (Seat 2) → @bob
  - DEVBUDDY-CCCC-3333-CCCC (Seat 3) → @charlie
  - DEVBUDDY-DDDD-4444-DDDD (Seat 4) → @diana
  - DEVBUDDY-EEEE-5555-EEEE (Seat 5) → @eve
  ↓
Admin distributes keys to team members
  ↓
Each member activates like a personal license
```

### Lemon Squeezy Configuration:

1. Create product: "DevBuddy Pro - Team (5 seats)"
2. Enable **"Generate multiple keys"**
3. Set: Generate **5 keys** per purchase
4. Each key has activation limit: **3** (one person, 3 machines)

### Pros:
- ✅ Simpler implementation (reuse personal license code)
- ✅ Easier to manage (each person has their own key)
- ✅ Clear separation between team members

### Cons:
- ❌ Key distribution burden on team admin
- ❌ Lost keys require contacting support
- ❌ Can't easily add/remove team members

---

## Implementation Option 3: GitHub Organization (Advanced)

### How It Works:

License tied to GitHub Organization instead of individual accounts:

```
Team purchases license for "@acme-corp" organization
  ↓
Any member of @acme-corp can activate:
  - @alice (member of @acme-corp) → ✅ Activated
  - @bob (member of @acme-corp) → ✅ Activated
  - @frank (not a member) → ❌ Access denied
```

### Implementation:

```typescript
async activateOrgLicense(licenseKey: string): Promise<boolean> {
  // 1. Get GitHub session
  const githubSession = await vscode.authentication.getSession(
    'github',
    ['user:email', 'read:org'],  // Need org read permission
    { createIfNone: true }
  );

  // 2. Get user's organizations
  const orgs = await axios.get('https://api.github.com/user/orgs', {
    headers: {
      Authorization: `Bearer ${githubSession.accessToken}`,
    },
  });

  // 3. Validate license is for an org
  const validationResponse = await this.validateLicenseWithLemonSqueezy(licenseKey);
  const orgName = validationResponse.meta?.github_org; // e.g., "acme-corp"

  if (!orgName) {
    vscode.window.showErrorMessage('This is not an organization license.');
    return false;
  }

  // 4. Check if user is member of the licensed org
  const isMember = orgs.data.some((org: any) => org.login === orgName);

  if (!isMember) {
    vscode.window.showErrorMessage(
      `❌ You must be a member of @${orgName} to use this license.`
    );
    return false;
  }

  // 5. Activate
  // No seat limit - any org member can activate
  // Activation limit is per-org (e.g., 50 total activations)
  
  return true;
}
```

### Pros:
- ✅ Automatic access for all org members
- ✅ No manual key distribution
- ✅ Easy to add/remove members (just update GitHub org)
- ✅ Scales well for large teams

### Cons:
- ❌ More complex implementation
- ❌ Requires GitHub organization (not all teams have this)
- ❌ Harder to control costs (any org member can activate)

---

## Comparison Matrix

| Feature | Multi-Seat Key | Separate Keys | GitHub Org |
|---------|---------------|---------------|------------|
| **Implementation Complexity** | Medium | Easy | Hard |
| **Key Management** | One key for team | Multiple keys | One key for org |
| **Seat Tracking** | Backend required | Lemon Squeezy native | Backend required |
| **Add/Remove Members** | Backend call | Issue new key | Automatic |
| **Cost Control** | Exact seat count | Exact seat count | Harder to control |
| **Recommended For** | SMBs (5-20 seats) | Small teams (2-10) | Enterprises (20+) |

---

## Recommended Approach for MVP: **Separate Keys** ⭐

For your initial launch, I recommend **Option 2 (Separate License Keys)** because:

1. ✅ **Simplest to implement** - Reuse existing personal license code
2. ✅ **Lemon Squeezy handles everything** - No backend needed
3. ✅ **Clear and simple** for users
4. ✅ **Easy to support** - Each user has their own key

### Later, upgrade to **Multi-Seat Key** (Option 1) for better UX:
- Better for larger teams
- One key to manage instead of many
- More professional experience

---

## Example Product Structure

### In Lemon Squeezy:

**Product 1: DevBuddy Pro - Personal**
- Price: $9.99/month or $99/year
- License keys: 1 key per purchase
- Activation limit: 3 machines

**Product 2: DevBuddy Pro - Team (5 seats)**
- Price: $39.99/month or $399/year ($8/user/month)
- License keys: **5 keys per purchase** ← Configure this
- Activation limit per key: 3 machines
- Discount: 20% vs individual

**Product 3: DevBuddy Pro - Team (10 seats)**
- Price: $69.99/month or $699/year ($7/user/month)
- License keys: **10 keys per purchase**
- Activation limit per key: 3 machines
- Discount: 30% vs individual

---

## Next Steps

1. **For MVP**: Use **Separate Keys** (Option 2)
   - Configure Lemon Squeezy to generate 5 keys for team product
   - No code changes needed!
   - Admin distributes keys via email

2. **Post-launch**: Upgrade to **Multi-Seat Key** (Option 1)
   - Better UX for teams
   - Implement the code above
   - Requires a simple backend to update license metadata

3. **Enterprise**: Consider **GitHub Org** (Option 3)
   - For large companies
   - Premium feature

---

Would you like me to implement Option 1 (Multi-Seat Key) or stick with Option 2 (Separate Keys) for simplicity?



