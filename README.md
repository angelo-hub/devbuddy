# DevBuddy - Multi-Platform Ticket Management for Developers

[![Version](https://img.shields.io/github/v/release/angelo-hub/devbuddy?label=version)](https://github.com/angelo-hub/devbuddy/releases)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/angelogirardi.dev-buddy)](https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/angelogirardi.dev-buddy)](https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20Pro-blue)](./LICENSE)

**Transform your development workflow with AI-powered ticket management, supporting Linear, Jira, and more!**

> **🔒 Privacy-First:** Works with or without AI! Organizations with strict security policies can disable external AI and use intelligent rule-based analysis instead.

> **🌐 Multi-Platform:** Seamlessly switch between Linear, Jira Cloud, and other platforms (more coming soon).

## 🎯 Supported Platforms

| Platform | Status | Features |
|----------|--------|----------|
| **Linear** | ✅ Full Support | Complete feature set with AI integration |
| **Jira Cloud** | ✅ Core Features | CRUD operations, search, workflows |
| **Jira Server** | ⏳ Coming Soon | Self-hosted Jira support |
| **Monday.com** | ⏳ Planned | Future release |
| **ClickUp** | ⏳ Planned | Future release |

## ✨ Features

### 🌐 Multi-Platform Support
- **Single Interface**: Manage tickets from any platform
- **Easy Switching**: Change platforms via settings
- **Consistent UX**: Same commands work across platforms
- **Platform-Specific Features**: Optimized for each platform

### 💬 Chat Participant
- Ask `@devbuddy` questions in chat
- Commands: `/tickets`, `/standup`, `/pr`, `/status`
- Natural language queries: "show me my open tickets"
- Works with Linear and Jira (more coming)

### 📊 Sidebar Ticket View
- See all your tickets in the sidebar
- Priority indicators (🔴 Urgent, 🟠 High, 🟡 Medium, 🟢 Low)
- One-click to open tickets
- Quick actions: Update status, assign, comment
- Filter by status, project, assignee

### 🤖 AI-Powered Summaries (with Privacy-First Fallback)
- **Standup Generator**: AI analyzes your commits and generates standup updates
- **PR Summary**: Auto-generates PR descriptions from your changes
- **Smart Suggestions**: Next steps and blocker detection
- **🔒 Rule-Based Fallback**: Works without AI for sensitive organizations

### ⚡ Quick Actions
- Create, update, and manage tickets
- Update status and assignments
- Add comments
- Search and filter
- All from VS Code!

### 🔗 Git & Monorepo Support
- Branch creation from tickets (Linear)
- Package detection and validation
- Multi-ticket/branch support
- PR scope validation

## 🚀 Quick Start

### 1. Install Extension
```bash
./reinstall.sh
# Or: code --install-extension dev-buddy-0.1.0.vsix
```

### 2. Choose Your Platform

**Settings → DevBuddy → Provider**
```json
{
  "devBuddy.provider": "linear"  // or "jira"
}
```

### 3. Configure Authentication

#### For Linear:
1. Get token: [linear.app/settings/api](https://linear.app/settings/api)
2. `Cmd+Shift+P` → `DevBuddy: Update Linear API Key`

#### For Jira Cloud:
1. `Cmd+Shift+P` → `DevBuddy: Setup Jira Cloud`
2. Enter your Jira site URL (e.g., `yourcompany.atlassian.net`)
3. Enter your email
4. Create API token: [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

### 4. Start Using DevBuddy
- **Open Sidebar**: Click checklist icon (☑️) in Activity Bar
- **Use Chat**: Open chat → Type `@devbuddy what am I working on?`
- **Command Palette**: `Cmd+Shift+P` → `DevBuddy: ...`

## 📚 Documentation

- **Feature Matrix** (`FEATURE_COMPATIBILITY_MATRIX.md`) - Platform comparison
- **Complete Guide** (`LINEAR_BUDDY_GUIDE.md`) - Full Linear documentation  
- **Jira Guide** (`JIRA_CLOUD_IMPLEMENTATION_SUMMARY.md`) - Jira setup & features
- **Quick Start** (`QUICKSTART.md`) - Get started quickly
- **AI Features** (`AI_FEATURES_GUIDE.md`) - AI model configuration
- **🔒 Privacy Mode** (`AI_FALLBACK_QUICK_REFERENCE.md`) - No external AI
- **Multi-Ticket Guide** (`MULTI_TICKET_GUIDE.md`) - Work across multiple tickets

## 💬 Chat Examples

```
@devbuddy /tickets                    # Show your active tickets
@devbuddy /standup                    # Generate standup update  
@devbuddy show me ENG-123             # Get ticket details
@devbuddy what am I working on?       # Natural language query
@devbuddy create a ticket             # Create new ticket
```

## ⚙️ Configuration

### Platform Selection
```json
{
  // Choose your platform
  "devBuddy.provider": "linear",  // "linear" or "jira"
  
  // Platform-specific settings
  "devBuddy.linear.teamId": "...",
  "devBuddy.linear.organization": "yourorg",
  
  "devBuddy.jira.cloud.siteUrl": "yourcompany.atlassian.net",
  "devBuddy.jira.cloud.email": "you@company.com",
  "devBuddy.jira.defaultProject": "ENG"
}
```

### AI Configuration
```json
{
  // AI Model (auto-selects best available)
  "devBuddy.ai.model": "auto",
  
  // Writing Tone
  "devBuddy.writingTone": "professional",
  
  // 🔒 Disable external AI (use rule-based analysis)
  "devBuddy.ai.disabled": false
}
```

### Monorepo & Git
```json
{
  // Base branch for PRs
  "devBuddy.baseBranch": "main",
  
  // Monorepo package paths
  "devBuddy.packagesPaths": ["packages/", "apps/"],
  
  // Branch naming
  "devBuddy.branchNamingConvention": "conventional"
}
```

## 🎯 Key Features by Platform

### Linear Features ✅
| Feature | Status |
|---------|--------|
| View Tickets | ✅ |
| Create/Edit Tickets | ✅ |
| Status Management | ✅ |
| Branch Creation | ✅ |
| AI Standup/PR | ✅ |
| Chat Participant | ✅ |
| TODO Converter | ✅ |

### Jira Cloud Features ✅
| Feature | Status |
|---------|--------|
| View Issues | ✅ |
| Create/Edit Issues | ✅ |
| Status Transitions | ✅ |
| JQL Search | ✅ |
| Comments | ✅ |
| Sprints & Boards | ✅ |
| Runtime Validation | ✅ (Zod v4) |

See **`FEATURE_COMPATIBILITY_MATRIX.md`** for complete comparison.

## 🤖 AI Models

**Verified Working Models:**
- GPT-4o ⭐ (recommended)
- GPT-4.1
- GPT-4 Turbo  
- Gemini 2.0 Flash

**Privacy-First Option:**
- 🔒 Rule-Based Analysis (no external AI)
  - Perfect for regulated industries
  - 100% local processing
  - Works offline

**Auto-fallback:** If preferred model unavailable, automatically uses best available.

## 🔧 Commands

### Universal Commands (Work with any platform)
- `DevBuddy: Refresh Tickets`
- `DevBuddy: Create Ticket`
- `DevBuddy: Generate Standup Update`
- `DevBuddy: Generate PR Summary`

### Linear-Specific
- `DevBuddy: Update Linear API Key`
- `DevBuddy: Start Branch for Ticket`
- `DevBuddy: Convert TODO to Ticket`

### Jira-Specific
- `DevBuddy: Setup Jira Cloud`
- `DevBuddy: Test Jira Connection`
- `DevBuddy: Update Jira Issue Status`

## 🎉 What's New in v0.1.0

### 🌐 Multi-Platform Architecture
- ✨ Support for Linear AND Jira Cloud
- 🔄 Easy platform switching
- 📊 Unified sidebar interface

### 🔧 Jira Integration
- ✅ Full CRUD operations for Jira Cloud
- ✅ JQL search support
- ✅ Workflow transitions
- ✅ Sprint & board management
- ✅ Production-grade validation (Zod v4)

### 🤖 AI & Chat
- 💬 Chat participant with `@devbuddy`
- 🤖 Enhanced AI with code diffs
- 🔒 Privacy-first fallback mode

### ⚡ Quality Improvements
- ✅ Runtime validation with Zod
- ✅ Better error handling
- ✅ Type-safe throughout
- ✅ Debug mode for troubleshooting

## 🛣️ Roadmap

### Short-Term
- ⏳ Jira webview panels (ticket detail, create form)
- ⏳ Jira branch integration
- ⏳ Jira AI features (standup, PR summary)

### Medium-Term
- ⏳ Jira Server/Data Center support
- ⏳ Custom fields UI
- ⏳ Offline mode

### Long-Term  
- ⏳ Monday.com integration
- ⏳ ClickUp integration
- ⏳ GitHub/GitLab Issues

## 📦 Installation

### From VS Code Marketplace

Install directly from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy):

1. Open VS Code
2. Go to Extensions (Cmd/Ctrl + Shift + X)
3. Search for "DevBuddy"
4. Click Install

### From GitHub Releases

Download the latest `.vsix` file from [GitHub Releases](https://github.com/angelo-hub/devbuddy/releases):

```bash
# Download the latest release
# Visit: https://github.com/angelo-hub/devbuddy/releases

# Install the VSIX file
code --install-extension dev-buddy-x.x.x.vsix
```

### From Source

```bash
# Clone and build
git clone https://github.com/angelo-hub/devbuddy.git
cd devbuddy
npm install
npm run package
code --install-extension dev-buddy-0.1.0.vsix

# Quick reinstall script (for development)
./reinstall.sh
```

### For Contributors

See [docs/developer/RELEASE_PROCESS.md](./docs/developer/RELEASE_PROCESS.md) for information about:
- Release workflow
- Conventional commits
- Publishing to marketplace

## 📄 License

**Dual License:**
- **Core Features**: [MIT License](./LICENSE) - Free and open source
- **Pro Features**: [Commercial License](./LICENSE.pro) - Requires subscription

The extension is free to use with all core features. Pro features (when available) will require a paid subscription. See [LICENSING_MODEL.md](./LICENSING_MODEL.md) for details.

---

**Version:** 0.1.0 | **Status:** ✅ Production Ready | **Date:** November 2025

**Platforms:** Linear (Full) | Jira Cloud (Core) | More Coming Soon!

