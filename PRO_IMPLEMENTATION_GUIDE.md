# Implementation Guide: Pro Feature Licensing

This guide shows you how to implement the licensing system for Linear Buddy's Pro features.

## Directory Structure

```
src/
├── commands/           # Free features
├── utils/             # Free utilities
├── views/             # Free views
└── pro/               # 💎 Pro features directory
    ├── LICENSE        # Symlink/copy of LICENSE.pro
    ├── commands/      # Pro commands
    ├── utils/         # Pro utilities
    │   ├── licenseManager.ts    # License validation
    │   └── proFeatureGate.ts    # Feature access control
    └── views/         # Pro views

webview-ui/src/
├── shared/            # Free components
├── ticket-panel/      # Free panels
└── pro/               # 💎 Pro webview components
    └── analytics/     # Pro analytics UI
```

## Core Components

### 1. License Manager (`src/pro/utils/licenseManager.ts`)

```typescript
import * as vscode from 'vscode';

export interface LicenseInfo {
  key: string;
  email: string;
  type: 'personal' | 'team' | 'enterprise';
  expiresAt: Date;
  isValid: boolean;
  isTrial: boolean;
  trialEndsAt?: Date;
}

export class LicenseManager {
  private static instance: LicenseManager;
  private context: vscode.ExtensionContext;
  private licenseInfo: LicenseInfo | null = null;
  private readonly LICENSE_KEY = 'linearBuddy.licenseKey';
  private readonly LICENSE_API = 'https://api.yourservice.com/validate'; // Your backend

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public static getInstance(context: vscode.ExtensionContext): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager(context);
    }
    return LicenseManager.instance;
  }

  /**
   * Initialize license on extension activation
   */
  async initialize(): Promise<void> {
    const storedKey = await this.context.secrets.get(this.LICENSE_KEY);
    if (storedKey) {
      await this.validateLicense(storedKey);
    } else {
      // Check if in trial period
      await this.initializeTrial();
    }
  }

  /**
   * Activate a license key
   */
  async activateLicense(licenseKey: string): Promise<boolean> {
    const isValid = await this.validateLicense(licenseKey);
    if (isValid) {
      await this.context.secrets.store(this.LICENSE_KEY, licenseKey);
      vscode.window.showInformationMessage('✨ Linear Buddy Pro activated successfully!');
      return true;
    } else {
      vscode.window.showErrorMessage('❌ Invalid license key. Please check and try again.');
      return false;
    }
  }

  /**
   * Validate license with backend
   */
  private async validateLicense(licenseKey: string): Promise<boolean> {
    try {
      const response = await fetch(this.LICENSE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey,
          product: 'linear-buddy',
          version: vscode.extensions.getExtension('your-publisher.linear-buddy')?.packageJSON.version,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.licenseInfo = {
        key: licenseKey,
        email: data.email,
        type: data.type,
        expiresAt: new Date(data.expiresAt),
        isValid: data.isValid,
        isTrial: data.isTrial,
        trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
      };

      return data.isValid;
    } catch (error) {
      console.error('License validation failed:', error);
      // Offline grace period: allow if validated within last 7 days
      return this.checkOfflineGracePeriod();
    }
  }

  /**
   * Initialize trial period
   */
  private async initializeTrial(): Promise<void> {
    const trialStartKey = 'linearBuddy.trialStartDate';
    const trialStart = this.context.globalState.get<string>(trialStartKey);

    if (!trialStart) {
      // First time - start trial
      const now = new Date();
      await this.context.globalState.update(trialStartKey, now.toISOString());
      
      this.licenseInfo = {
        key: 'TRIAL',
        email: '',
        type: 'personal',
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isValid: true,
        isTrial: true,
        trialEndsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      };

      vscode.window.showInformationMessage(
        '🎉 Welcome to Linear Buddy Pro! You have 30 days free trial.',
        'Learn More'
      ).then(selection => {
        if (selection === 'Learn More') {
          vscode.env.openExternal(vscode.Uri.parse('https://yoursite.com/pro'));
        }
      });
    } else {
      // Check if trial expired
      const trialDate = new Date(trialStart);
      const now = new Date();
      const daysElapsed = (now.getTime() - trialDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysElapsed > 30) {
        this.licenseInfo = {
          key: 'TRIAL_EXPIRED',
          email: '',
          type: 'personal',
          expiresAt: new Date(trialDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          isValid: false,
          isTrial: true,
          trialEndsAt: new Date(trialDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        };
      } else {
        this.licenseInfo = {
          key: 'TRIAL',
          email: '',
          type: 'personal',
          expiresAt: new Date(trialDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          isValid: true,
          isTrial: true,
          trialEndsAt: new Date(trialDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        };
      }
    }
  }

  /**
   * Check offline grace period (7 days)
   */
  private checkOfflineGracePeriod(): boolean {
    const lastValidation = this.context.globalState.get<string>('linearBuddy.lastValidation');
    if (!lastValidation) {
      return false;
    }

    const lastDate = new Date(lastValidation);
    const now = new Date();
    const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSince <= 7;
  }

  /**
   * Check if Pro features are available
   */
  public hasProAccess(): boolean {
    return this.licenseInfo?.isValid ?? false;
  }

  /**
   * Get license info
   */
  public getLicenseInfo(): LicenseInfo | null {
    return this.licenseInfo;
  }

  /**
   * Show upgrade prompt
   */
  public async promptUpgrade(featureName: string): Promise<void> {
    const action = await vscode.window.showInformationMessage(
      `💎 "${featureName}" is a Pro feature. Upgrade to access advanced capabilities!`,
      'View Plans',
      'Activate License',
      'Dismiss'
    );

    if (action === 'View Plans') {
      vscode.env.openExternal(vscode.Uri.parse('https://yoursite.com/pricing'));
    } else if (action === 'Activate License') {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your Linear Buddy Pro license key',
        placeHolder: 'XXXX-XXXX-XXXX-XXXX',
        password: true,
      });

      if (key) {
        await this.activateLicense(key);
      }
    }
  }

  /**
   * Deactivate license
   */
  public async deactivateLicense(): Promise<void> {
    await this.context.secrets.delete(this.LICENSE_KEY);
    this.licenseInfo = null;
    vscode.window.showInformationMessage('License deactivated.');
  }
}
```

### 2. Pro Feature Gate (`src/pro/utils/proFeatureGate.ts`)

```typescript
import * as vscode from 'vscode';
import { LicenseManager } from './licenseManager';

/**
 * Decorator for Pro features
 */
export function requireProLicense(featureName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = (this as any).context as vscode.ExtensionContext;
      const licenseManager = LicenseManager.getInstance(context);

      if (!licenseManager.hasProAccess()) {
        await licenseManager.promptUpgrade(featureName);
        return;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Check if Pro feature is available
 */
export function isProFeatureAvailable(context: vscode.ExtensionContext): boolean {
  const licenseManager = LicenseManager.getInstance(context);
  return licenseManager.hasProAccess();
}

/**
 * Show Pro badge in UI
 */
export function getProBadge(): string {
  return '💎';
}
```

### 3. Example Pro Command

```typescript
// src/pro/commands/advancedAnalytics.ts
import * as vscode from 'vscode';
import { requireProLicense } from '../utils/proFeatureGate';

export class AdvancedAnalyticsCommand {
  constructor(private context: vscode.ExtensionContext) {}

  @requireProLicense('Advanced Analytics')
  async execute() {
    // This code only runs if user has Pro license
    vscode.window.showInformationMessage('Opening Advanced Analytics...');
    
    // Your Pro feature implementation
    const panel = vscode.window.createWebviewPanel(
      'advancedAnalytics',
      'Advanced Analytics',
      vscode.ViewColumn.One,
      {}
    );

    // ... rest of implementation
  }
}
```

### 4. Registration in Extension

```typescript
// src/extension.ts
import { LicenseManager } from './pro/utils/licenseManager';

export async function activate(context: vscode.ExtensionContext) {
  // Initialize license manager
  const licenseManager = LicenseManager.getInstance(context);
  await licenseManager.initialize();

  // Register Pro license activation command
  context.subscriptions.push(
    vscode.commands.registerCommand('linearBuddy.activateProLicense', async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your Linear Buddy Pro license key',
        placeHolder: 'XXXX-XXXX-XXXX-XXXX',
        password: true,
      });

      if (key) {
        await licenseManager.activateLicense(key);
      }
    })
  );

  // Register Pro license status command
  context.subscriptions.push(
    vscode.commands.registerCommand('linearBuddy.showLicenseInfo', () => {
      const info = licenseManager.getLicenseInfo();
      if (info) {
        const status = info.isTrial ? 'Trial' : info.type;
        const expires = info.expiresAt.toLocaleDateString();
        vscode.window.showInformationMessage(
          `License Status: ${status} (expires ${expires})`
        );
      } else {
        vscode.window.showInformationMessage('No active license. Using free features.');
      }
    })
  );

  // Your existing activation code...
}
```

## Backend API

You'll need a simple backend to validate licenses. Options:

### Option 1: Use Gumroad
- Gumroad provides license key API
- Simple integration
- Handles payments automatically

### Option 2: Use Lemon Squeezy
- More flexible than Gumroad
- Better API
- European company (GDPR friendly)

### Option 3: Use Paddle
- Enterprise-grade
- Handles VAT/taxes globally
- More expensive

### Option 4: Build Your Own
Simple Node.js/Express backend:

```typescript
// Backend API example
app.post('/api/validate', async (req, res) => {
  const { licenseKey, product, version } = req.body;
  
  // Check database for license key
  const license = await db.licenses.findOne({ key: licenseKey, product });
  
  if (!license) {
    return res.status(404).json({ isValid: false });
  }
  
  if (new Date() > license.expiresAt) {
    return res.status(200).json({ 
      isValid: false, 
      reason: 'expired' 
    });
  }
  
  // Log usage
  await db.validations.create({
    licenseKey,
    version,
    timestamp: new Date(),
  });
  
  return res.json({
    isValid: true,
    email: license.email,
    type: license.type,
    expiresAt: license.expiresAt,
    isTrial: false,
  });
});
```

## Next Steps

1. **Create `src/pro/` directory**
2. **Implement LicenseManager**
3. **Set up backend API** (or use Gumroad/Lemon Squeezy)
4. **Add activation command** to package.json
5. **Create first Pro feature** as proof of concept
6. **Test thoroughly** with trial and license key
7. **Update documentation**

## Testing

```typescript
// Test license flow
1. Install extension → Should start trial
2. Use Pro feature → Should work during trial
3. Wait 30 days (or mock date) → Should show upgrade prompt
4. Enter license key → Should unlock Pro features
5. Restart VS Code → Should remember license
6. Go offline → Should work for 7 days
```

## Important Notes

⚠️ **Security Considerations:**
- Never store sensitive data in extension code
- Use VS Code's SecretStorage for license keys
- Validate server-side, not just client-side
- Implement rate limiting on validation API
- Log validation attempts for abuse detection

✅ **User Experience:**
- Make trial period generous (30 days)
- Show clear upgrade prompts
- Don't nag users repeatedly
- Provide offline grace period
- Keep free features fully functional

📝 **Legal:**
- Clearly mark Pro features in UI
- Update marketplace listing
- Add license terms to docs
- Provide refund policy

Would you like me to help implement any of these components?

