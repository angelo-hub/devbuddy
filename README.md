# DevBuddy for VS Code
### Jira + Linear workflows on steroids. All in VS Code.


[![Downloads](https://img.shields.io/visual-studio-marketplace/d/angelogirardi.dev-buddy)](https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy)
[![Rating](https://img.shields.io/visual-studio-marketplace/stars/angelogirardi.dev-buddy)](https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy)
[![GitHub Release](https://img.shields.io/github/v/release/angelo-hub/devbuddy)](https://github.com/angelo-hub/devbuddy/releases)
[![Version](https://img.shields.io/visual-studio-marketplace/v/angelogirardi.dev-buddy)](https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20Pro-blue)](https://github.com/angelo-hub/devbuddy/blob/main/LICENSE)

## Work Faster with Your Issues Inside VS Code

DevBuddy brings your tickets into a single sidebar so you can browse, create, update, and work on issues without switching to the browser.

![DevBuddy Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/start_ticket_branch.gif)

## Key Features

| Feature | Description | Platforms |
|---------|-------------|-----------|
| **Unified Issue Explorer** | View and manage all tickets from VS Code | Linear, Jira Cloud, Jira Server (beta) |
| **Rich Text Editor** | WYSIWYG Markdown editor for tickets & comments with toolbar, shortcuts, and live preview | Linear, Jira Cloud |
| **AI Tool Integration** | AI agents like `@workspace` and Copilot automatically access your tickets | Linear, Jira Cloud |
| **TODO Converter** | Convert TODOs to tickets with automatic code permalinks | Linear, Jira Cloud |
| **AI Workflows** | Generate PR summaries and standups automatically | Linear, Jira Cloud |
| **Branch Integration** | Create and manage branches directly from tickets | Linear, Jira Cloud |
| **Multi-Repo Support** | Track branch associations across multiple repositories | All platforms |
| **Chat Participant** | Ask `@devbuddy` questions in natural language | Linear, Jira Cloud |
| **Monorepo Support** | Intelligent package detection and validation | All platforms |

## Example Workflows

### Convert TODO → Ticket

![TODO Converter Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/todo-converter-demo.gif)

Write a TODO comment, right-click → "Convert TODO to Ticket". DevBuddy automatically:
- Creates a ticket with file path and line number
- Generates GitHub/GitLab/Bitbucket permalink to exact code location
- Includes 5 lines of surrounding code context
- Links to current branch and commit SHA

### Create a Branch from an Issue

![Branch Creation Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/start_ticket_branch.gif)

Right-click any ticket → "Start Branch for Ticket". DevBuddy creates a branch with smart naming (conventional, simple, or custom) and automatically associates it with the ticket.

### Edit Tickets with Rich Text Editor

![Edit Ticket Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/edit_ticket.gif)

Click any ticket to view full details. Edit descriptions and comments with our WYSIWYG Markdown editor featuring:
- **Formatting toolbar** for quick text styling
- **Keyboard shortcuts** (Cmd+B, Cmd+I, Cmd+K for links)
- **Code blocks** with syntax highlighting
- **Tables, lists, and headings**

### AI-Powered Standup Generator

![Standup Builder Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/standup_builder.gif)

Run `DevBuddy: Generate Standup Update` to automatically generate standup reports from your commits and ticket activity with:
- Yesterday's completed work
- Today's planned tasks
- Blockers and dependencies
- Automatic ticket linking

## Quick Start

1. **Install DevBuddy** from the VS Code Marketplace
2. **Open the DevBuddy sidebar** (click the checklist icon)
3. **Connect your platform:**
   - Linear: `DevBuddy: Update Linear API Key`
   - Jira Cloud: `DevBuddy: Setup Jira Cloud`
4. **Start managing issues** directly inside VS Code

Full documentation: [DevBuddy Quick Start Guide](https://github.com/angelo-hub/devbuddy/blob/main/docs/user-guides/QUICKSTART.md)

## Supported Platforms

### Fully Supported
- **Linear** - Complete feature set with AI integration
- **Jira Cloud** - Full feature parity with Linear

### In Beta
- **Jira Server / Data Center** - Read-only support (editing coming soon)

## Optional AI Enhancements

Connect GitHub Copilot or another LLM provider to unlock:
- Pull request summaries
- Standup reports
- Ticket drafts with descriptions and acceptance criteria

**AI features are optional** — DevBuddy works fully without them using intelligent rule-based analysis.

## Privacy and Security

- ✅ All credentials stored using VS Code Secret Storage
- ✅ No telemetry collected
- ✅ DevBuddy doesn't run servers or proxy your data
- ✅ Only Jira/Linear APIs you configure are contacted
- ✅ Privacy-first: AI is completely optional

## What's New in v1.0.0 🎉

### ✏️ Rich Text WYSIWYG Editor
**Professional-grade editing for tickets and comments.**

DevBuddy now includes a beautiful Markdown editor with:
- **Formatting toolbar** - Bold, italic, code, links, lists, headings
- **Keyboard shortcuts** - Cmd/Ctrl+B for bold, Cmd/Ctrl+I for italic, and more
- **Live preview** - See your formatted text as you type
- **Code blocks** - Syntax highlighting for 50+ languages
- **Tables support** - Create and edit tables visually

Works in ticket descriptions, comments, and ticket creation forms.

### 🤖 AI Tool Integration (Language Model Tools)
**Your AI assistants now understand your tickets—automatically.**

DevBuddy extends `@workspace`, GitHub Copilot, and other AI agents with real-time access to your Linear and Jira tickets. No more hallucinations, no more guessing.

**Just ask naturally:**
```
@workspace what ticket am I working on?
→ Based on your branch feat/eng-125-oauth, you're working on ENG-125: Implement OAuth2 Authentication

@workspace what should I work on next?
→ Your highest priority ticket is ENG-126: Fix payment timeout (Priority: High, Estimate: 3 points)

@workspace help me implement this ticket
→ [AI generates implementation plan with full ticket context]
```

**Available Tools:**
| Tool | Description |
|------|-------------|
| `#getTicket` | Fetch any ticket by ID (e.g., `#getTicket ENG-125`) |
| `#listMyTickets` | List all your active tickets |
| `#getCurrentTicket` | Detect ticket from your current branch |
| `#createTicket` | Create tickets with AI assistance (Pro) |

**Configure:** Settings → Search "language model tools" to enable/disable individual tools.

[Learn more about AI tool integration →](https://github.com/angelo-hub/devbuddy/blob/main/docs/features/ai/LANGUAGE_MODEL_TOOLS.md)

### 🔀 Multi-Repository Support
**Track branches across all your repositories.**

For teams working with microservices or multiple repos:
- **Global branch associations** - Track which ticket belongs to which repo
- **Auto-discovery** - Scans parent directory for related repositories  
- **Cross-workspace navigation** - Click to open ticket in correct repo
- **Repository indicators** - See which repo a branch lives in

Enable in settings: `devBuddy.multiRepo.enabled`

### 🎯 Also in v1.0.0
- **Jira Sidebar Parity** - Recently completed, current sprint, project unassigned sections
- **Jira Branch Manager** - Full branch association support in Jira ticket panels
- **Lucide React Icons** - Modern, consistent iconography throughout
- **Enhanced Chat Participant** - Natural language ticket planning with `@devbuddy`
- **Smart Work Suggestions** - AI-powered recommendations on what to work on next

## Commands Overview

### Universal Commands (All Platforms)
- `DevBuddy: Refresh Tickets` - Reload ticket list
- `DevBuddy: Create Ticket` - Open ticket creation form
- `DevBuddy: Generate PR Summary` - Generate PR description
- `DevBuddy: Generate Standup Update` - Generate standup report

### Platform-Specific Setup
- `DevBuddy: Update Linear API Key` - Configure Linear
- `DevBuddy: Setup Jira Cloud` - Configure Jira Cloud
- `DevBuddy: Setup Jira Server` - Configure Jira Server/Data Center

## Roadmap

- ✅ Linear - Full support
- ✅ Jira Cloud - Full support  
- ✅ Multi-repository branch tracking
- ✅ AI Tool Integration (LM Tools)
- ✅ WYSIWYG Markdown Editor
- 🚧 Jira Server/Data Center - Beta (editing coming soon)
- ⏳ GitHub Issues integration
- ⏳ YouTrack support
- ⏳ Monday.com integration
- ⏳ Developer Stats Dashboard (Pro)

Track updates: [GitHub Repository](https://github.com/angelo-hub/devbuddy)

## Documentation

- [Quick Start Guide](https://github.com/angelo-hub/devbuddy/blob/main/docs/user-guides/QUICKSTART.md)
- [Complete Linear Guide](https://github.com/angelo-hub/devbuddy/blob/main/docs/user-guides/LINEAR_BUDDY_GUIDE.md)
- [Jira Cloud Setup](https://github.com/angelo-hub/devbuddy/blob/main/JIRA_QUICK_START.md)
- [Feature Compatibility Matrix](https://github.com/angelo-hub/devbuddy/blob/main/FEATURE_COMPATIBILITY_MATRIX.md)
- [Developer Guide](https://github.com/angelo-hub/devbuddy/blob/main/DEVELOPER_GUIDE.md) - Contributing & development
- [Full Documentation](https://github.com/angelo-hub/devbuddy)

## Beta Testing

Want to try new features early? Join our beta testing program!

**Install Pre-release Versions:**
1. Open VS Code Extensions view
2. Find DevBuddy
3. Click the dropdown → **"Switch to Pre-Release Version"**

Beta versions include experimental features and improvements before they reach stable release. [Learn more about beta testing →](https://github.com/angelo-hub/devbuddy/blob/main/docs/user-guides/BETA_TESTING.md)

## Support

**Documentation:** [github.com/angelo-hub/devbuddy](https://github.com/angelo-hub/devbuddy)  
**Issues & Feature Requests:** [GitHub Issues](https://github.com/angelo-hub/devbuddy/issues)

If DevBuddy improves your workflow, please consider leaving a review or starring the repository! ⭐

## License

**Dual License:**
- **Core Features:** MIT License - Free and open source
- **Pro Features:** Commercial License (when available)

All current features are free to use. Future Pro features will require a subscription.

---

**Version 1.0.0** | Made with ❤️ for developers who hate context switching

