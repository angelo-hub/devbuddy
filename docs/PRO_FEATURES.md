# DevBuddy Pro Features Documentation

This document provides an overview of DevBuddy Pro features and their licensing requirements.

## 🎯 Overview

DevBuddy uses a **dual licensing model**:
- **Free features** (MIT License) - Available to everyone
- **Pro features** (Commercial License) - Require a valid license

All Pro features are located in the `src/pro/` and `webview-ui/src/pro/` directories.

## 💎 Pro Features

### 1. Advanced Analytics 🔮
**Status:** Planned  
**Location:** `src/pro/commands/advancedAnalytics.ts`

Deep insights into your development workflow with comprehensive analytics dashboards.

**Features:**
- Workflow pattern analysis
- Time tracking and productivity metrics
- Code velocity tracking
- Commit frequency analysis
- Work hours heatmaps
- Focus time recommendations

**Usage:**
```
Command Palette → DevBuddy Pro: Open Advanced Analytics
```

### 2. Smart Task Prioritization 🎯
**Status:** Planned  
**Location:** `src/pro/commands/smartPrioritization.ts`

AI-powered recommendations for task prioritization based on deadlines, dependencies, and workload.

**Features:**
- Intelligent task ranking
- Deadline and dependency analysis
- Workload balancing suggestions
- Focus time scheduling
- Automated priority updates
- Sprint planning assistance

**Usage:**
```
Command Palette → DevBuddy Pro: Open Smart Prioritization
```

### 3. Team Analytics Dashboard 📊
**Status:** Planned  
**Location:** `src/pro/views/TeamDashboard.ts`

Visualize team velocity, productivity, and collaboration metrics.

**Features:**
- Team velocity tracking
- Sprint burndown/burnup charts
- Code review metrics
- Collaboration insights
- Member activity heatmaps
- Custom team reports

**Usage:**
```
Command Palette → DevBuddy Pro: Open Team Dashboard
```

### 4. Advanced Automation 🔄
**Status:** Planned  
**Location:** `src/pro/commands/automation.ts`

Create custom workflows and automate repetitive tasks.

**Features:**
- Custom workflow triggers
- Automated ticket routing
- Status change automation
- Integration webhooks
- Scheduled actions
- Bulk operations

**Usage:**
```
Command Palette → DevBuddy Pro: Configure Automation
```

### 5. Multi-Workspace Support 🏢
**Status:** Planned  
**Location:** `src/pro/utils/workspaceManager.ts`

Manage multiple Linear or Jira workspaces from a single interface.

**Features:**
- Multiple workspace connections
- Cross-workspace reporting
- Unified ticket view
- Quick workspace switching
- Workspace-specific settings
- Cross-workspace ticket linking

**Usage:**
```
Settings → DevBuddy Pro: Workspaces
```

### 6. Custom Theming 🎨
**Status:** Planned  
**Location:** `webview-ui/src/pro/themes/`

Personalize your DevBuddy interface with custom themes and layouts.

**Features:**
- Custom color schemes
- Icon set selection
- Layout customization
- Dark/light mode variants
- Custom fonts
- UI density controls

**Usage:**
```
Command Palette → DevBuddy Pro: Customize Theme
```

### 7. Priority Support ⚡
**Status:** Available  
**Contact:** angelo@cooked.mx

Get faster response times and direct access to the development team.

**Includes:**
- Direct email support
- Response time < 24 hours
- Video call support (Enterprise)
- Custom feature requests
- Bug fix priority
- Upgrade assistance

### 8. Enterprise SSO 🔐
**Status:** Planned  
**Location:** `src/pro/auth/ssoProvider.ts`

Single sign-on integration for enterprise teams.

**Features:**
- SAML 2.0 support
- OAuth 2.0 integration
- Active Directory sync
- Team access management
- Centralized user provisioning
- Audit logs

**Usage:**
```
Settings → DevBuddy Pro: Configure SSO
```

## 📋 Feature Comparison

| Feature | Free | Pro |
|---------|------|-----|
| View & manage tickets | ✅ | ✅ |
| Create & update tickets | ✅ | ✅ |
| TODO to ticket conversion | ✅ | ✅ |
| Branch management | ✅ | ✅ |
| AI PR summaries | ✅ | ✅ |
| AI standups | ✅ | ✅ |
| Chat participant | ✅ | ✅ |
| GitHub/GitLab permalinks | ✅ | ✅ |
| Monorepo support | ✅ | ✅ |
| Multiple platforms (Linear, Jira) | ✅ | ✅ |
| **Advanced analytics** | ❌ | ✅ 💎 |
| **Smart prioritization** | ❌ | ✅ 💎 |
| **Team dashboard** | ❌ | ✅ 💎 |
| **Custom automation** | ❌ | ✅ 💎 |
| **Multi-workspace** | ❌ | ✅ 💎 |
| **Custom theming** | ❌ | ✅ 💎 |
| **Priority support** | ❌ | ✅ 💎 |
| **Enterprise SSO** | ❌ | ✅ 💎 |

## 🚀 Getting Started with Pro

### Activating Your License

1. **Purchase a license** (when available)
2. Open Command Palette (`Cmd/Ctrl + Shift + P`)
3. Run: `DevBuddy: Activate Pro License 💎`
4. Enter your license key
5. Pro features unlock automatically ✨

### Free Trial

- **30 days** free trial
- No credit card required
- All Pro features included
- Auto-starts on first use

### Commands

| Command | Description |
|---------|-------------|
| `DevBuddy: Activate Pro License 💎` | Enter and activate your Pro license |
| `DevBuddy: Show License Info` | View current license status |
| `DevBuddy: Deactivate Pro License` | Remove license from this machine |
| `DevBuddy: View Pro Features 💎` | See all Pro features |

## 💰 Pricing

### Personal License
- **$8/month** or **$80/year** (save $16)
- All Pro features
- Single user
- Unlimited devices
- 30-day money-back guarantee

### Team License
- **$20/user/month** or **$200/user/year**
- Everything in Personal
- Team analytics
- Centralized license management
- Priority support
- Volume discounts available

### Enterprise License
- **Custom pricing**
- Everything in Team
- SSO integration
- Custom contracts
- Dedicated support
- On-premise options
- Custom feature development

## 🎁 Free Pro Licenses

We offer free Pro licenses to:

- 🎓 **Students** - Verify with student email
- 🌟 **Open source maintainers** - Link to your projects
- 💚 **Non-profit organizations** - Provide documentation
- 🤝 **Contributors** - Contribute code to get free access!

**Apply:** Contact angelo@cooked.mx

## 🔐 Implementation Details

### License Validation

Pro features are gated using the `@requireProLicense` decorator:

```typescript
import { requireProLicense } from '../pro/utils/proFeatureGate';

class MyProFeature {
  constructor(private context: vscode.ExtensionContext) {}
  
  @requireProLicense('My Pro Feature')
  async execute() {
    // This code only runs if user has valid Pro license
  }
}
```

### Trial Management

- Trial starts automatically on first use
- 30 days of full Pro access
- No credit card required
- Trial status visible in status bar
- Graceful degradation after expiry

### Offline Support

- 7-day offline grace period
- Periodic license revalidation
- Cached license status
- No interruption during offline work

### Security

- License keys stored in VS Code SecretStorage
- Encrypted transmission (HTTPS)
- Server-side validation
- No sensitive data in code
- Source code available for audit

## 📝 Development Guidelines

### Adding New Pro Features

1. Create feature in `src/pro/commands/` or `src/pro/views/`
2. Use `@requireProLicense` decorator
3. Add command to `package.json`
4. Document in this file
5. Add to README Pro Features section
6. Update CHANGELOG.md

### Testing Pro Features

```bash
# Enable development mode for mock license validation
export NODE_ENV=development

# Build and run
npm run compile
code --extensionDevelopmentPath=.
```

### License Validation Backend (TODO)

When implementing the backend:

1. Use Gumroad, Lemon Squeezy, or custom solution
2. Implement `/api/validate` endpoint
3. Store license keys securely
4. Log validation attempts
5. Implement rate limiting
6. Handle offline grace period

## 🤝 Contributing

### Contributing to Pro Features

If you'd like to contribute Pro features:

1. We offer free Pro licenses to contributors
2. Sign our Contributor License Agreement (CLA)
3. Your contribution will be licensed under LICENSE.pro
4. You retain right to use your contribution under MIT

### Testing Pro Features

All contributors get free Pro licenses for testing.

## 📞 Support

### For Free Users
- 📝 [GitHub Issues](https://github.com/angelo-hub/devbuddy/issues)
- 📚 [Documentation](../DOCUMENTATION.md)
- 💬 Community Discord (coming soon)

### For Pro Users
- 📧 **Priority Email**: angelo@cooked.mx
- ⚡ **Response Time**: < 24 hours
- 🎫 **Support Portal**: Coming soon
- All free user channels

## 🗺 Roadmap

### Q1 2025 (Current)
- ✅ Pro licensing infrastructure
- ✅ License validation system
- ✅ Trial management
- 🔄 Payment backend setup

### Q2 2025
- 🔮 Advanced Analytics launch
- 🎯 Smart Prioritization
- 💳 Payment integration
- 📊 License management portal

### Q3-Q4 2025
- 📊 Team Dashboard
- 🔄 Advanced Automation
- 🏢 Multi-workspace support
- 🎨 Custom Theming

### 2026
- 🔐 Enterprise SSO
- 📈 Advanced Reporting
- 🤖 Custom AI Models
- 🌍 International expansion

## ❓ FAQ

**Q: Can I try Pro before buying?**  
A: Yes! 30-day free trial, no credit card required.

**Q: What happens after the trial?**  
A: Free features continue working. Pro features show upgrade prompts.

**Q: Can I use Pro on multiple devices?**  
A: Yes! Use the same license on all your devices.

**Q: Is there a refund policy?**  
A: Yes, 30-day money-back guarantee, no questions asked.

**Q: Can I see the Pro feature code?**  
A: Yes, all code is in the repository for transparency.

**Q: Why charge for Pro features?**  
A: To support sustainable development and fund advanced features.

**Q: Will free features remain free?**  
A: Yes, absolutely. Features that are free today stay free forever.

---

**Need help?**  
- 📧 Email: angelo@cooked.mx
- 🐛 Issues: [GitHub Issues](https://github.com/angelo-hub/devbuddy/issues)
- 📖 Docs: [Main Documentation](../DOCUMENTATION.md)

**Last Updated:** November 14, 2025  
**Version:** 0.2.0

