# Linear Buddy - AI-Powered Linear Integration

**Transform your Linear workflow with AI assistance, sidebar ticket management, and chat integration!**

## ✨ Features

### 💬 Chat Participant
- Ask `@linear` questions in chat
- Commands: `/tickets`, `/standup`, `/pr`, `/status`
- Natural language queries: "show me ENG-123"

### 📊 Sidebar Ticket View
- See all your Linear tickets in the sidebar
- Priority indicators (🔴 Urgent, 🟠 High, 🟡 Medium, 🟢 Low)
- One-click to open in Linear
- Quick actions: Start Work (▶️), Complete (✓)

### 🤖 AI-Powered Summaries
- **Standup Generator**: AI analyzes your commits and generates standup updates
- **PR Summary**: Auto-generates PR descriptions from your changes
- **Smart Suggestions**: Next steps and blocker detection

### ⚡ Quick Actions
- Start work on tickets
- Mark tickets complete
- Update ticket status
- All from VS Code!

### 🔗 Monorepo Support
- Package detection and validation
- Multi-ticket/branch support
- PR scope validation

## 🚀 Quick Start

1. **Install Extension:**
   ```bash
   ./reinstall.sh
   ```

2. **Configure Linear API Token:**
   - Get token: [linear.app/settings/api](https://linear.app/settings/api)
   - `Cmd+Shift+P` → `Linear Buddy: Configure API Token`

3. **Open Sidebar:**
   - Click checklist icon (☑️) in Activity Bar

4. **Start Chatting:**
   - Open chat → Type `@linear what am I working on?`

## 📚 Documentation

- **Complete Guide** (`LINEAR_BUDDY_GUIDE.md`) - Full documentation
- **Quick Start** (`QUICKSTART.md`) - Get started quickly
- **AI Features** (`AI_FEATURES_GUIDE.md`) - AI model configuration
- **Multi-Ticket Guide** (`MULTI_TICKET_GUIDE.md`) - Work across multiple tickets

## 💬 Chat Examples

```
@linear /tickets                    # Show your active tickets
@linear /standup                    # Generate standup update
@linear show me ENG-123             # Get ticket details
@linear what am I working on?       # Natural language query
```

## ⚙️ Configuration

```json
{
  // Linear API (required)
  "monorepoTools.linearApiToken": "lin_api_...",
  
  // AI Model (recommended: gpt-4o)
  "monorepoTools.aiModel": "gpt-4o",
  
  // Writing Tone
  "monorepoTools.writingTone": "professional",
  
  // Monorepo paths
  "monorepoTools.packagesPaths": ["packages/", "apps/"]
}
```

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **Sidebar** | View tickets, start work, mark complete |
| **Chat** | Ask questions, get AI summaries |
| **Standup** | Auto-generate from git commits + Linear context |
| **PR Summary** | Smart PR descriptions with validation |
| **Multi-Ticket** | Work across multiple tickets/branches |
| **AI Models** | GPT-4o, GPT-4.1, GPT-4 Turbo, Gemini 2.0 |

## 🤖 AI Models

**Verified Working Models:**
- GPT-4o ⭐ (recommended)
- GPT-4.1
- GPT-4 Turbo
- GPT-4
- GPT-4o Mini
- GPT-3.5 Turbo
- Gemini 2.0 Flash

**Auto-fallback:** If preferred model unavailable, automatically uses best available.

## 🔧 Commands

- `Linear Buddy: Generate Standup Update`
- `Linear Buddy: Generate PR Summary`
- `Linear Buddy: Configure API Token`
- `Linear Buddy: Refresh Tickets`

## 📦 Installation

```bash
# From VSIX file
./reinstall.sh

# Or manually
code --install-extension cursor-monorepo-tools-0.1.0.vsix
```

## 🎉 What's New in v0.1.0

- ✨ Chat participant with `@linear` support
- 📊 Sidebar ticket view with quick actions
- 🤖 Enhanced AI with actual code diffs
- ⚡ One-click ticket management
- 🔗 Full Linear API integration

## 📄 License

Personal use. Not for commercial distribution.

---

**Version:** 0.1.0 | **Status:** ✅ Production Ready | **Date:** November 2025

