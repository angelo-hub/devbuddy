# Linear Buddy - AI-Powered Linear Integration

**Transform your Linear workflow with AI assistance, sidebar ticket management, and chat integration!**

---

## 🎉 What's New in v0.1.0

Linear Buddy is now a comprehensive Linear integration for VS Code/Cursor with:

- **📊 Sidebar Ticket View** - See all your Linear tickets in the sidebar
- **💬 Chat Participant** - Ask `@linear` questions and get AI-powered answers
- **🤖 AI-Powered Summaries** - Generate standups and PRs with context
- **⚡ Quick Actions** - Start work, complete tickets, right from VS Code
- **🔗 Mono repo Support** - Built-in package detection and validation

---

## 🚀 Quick Start

### 1. Install the Extension

```bash
./reinstall.sh
```

Or manually:
```bash
code --install-extension cursor-monorepo-tools-0.1.0.vsix
```

### 2. Configure Linear API Token

1. Go to [Linear Settings → API](https://linear.app/settings/api)
2. Create a new personal API key
3. In VS Code/Cursor:
   - `Cmd+Shift+P` → `Linear Buddy: Configure API Token`
   - Paste your token

### 3. Open Linear Buddy Sidebar

Click the **checklist icon** (☑️) in the Activity Bar to see your tickets!

---

## 💬 Chat Interface

### Start a Conversation

Open the chat panel and type:
```
@linear what tickets am I working on?
```

### Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/tickets` | Show your active Linear tickets | `@linear /tickets` |
| `/standup` | Generate AI-powered standup update | `@linear /standup` |
| `/pr` | Generate PR summary | `@linear /pr` |
| `/status` | Update ticket status | `@linear /status` |

### Natural Language

You can also just ask questions naturally:

```
@linear show me ENG-123
@linear what am I working on?
@linear generate my standup
```

---

## 📊 Sidebar Features

### My Tickets View

**Location:** Activity Bar → Linear Buddy (☑️ icon)

**Features:**
- ✅ See all your active tickets (In Progress, Backlog, etc.)
- 🔴 Priority indicators (Urgent, High, Medium, Low)
- 🔄 Real-time sync with Linear
- 🎯 Click to open in Linear
- ⚡ Quick actions on hover

### Quick Actions

**Start Work** (▶️ icon):
- Moves ticket to "In Progress"
- One-click to start a ticket

**Complete** (✓ icon):
- Marks ticket as "Done"
- Celebrate completion! 🎉

**Refresh** (🔄 in toolbar):
- Manually refresh ticket list

---

## 🤖 AI-Powered Features

### Standup Generator

**Command:**
```
@linear /standup
```

**Or:**
```
Cmd+Shift+P → Linear Buddy: Generate Standup Update
```

**What it does:**
1. Analyzes your git commits (last 24 hours)
2. Reads actual code changes (diffs)
3. Generates AI summary of:
   - What you did
   - What you'll do next
   - Any blockers
4. Links to your Linear ticket

**Customization:**
- Set time window: `monorepoTools.standupTimeWindow`
- Choose AI tone: Professional, Casual, Technical, Concise
- Select AI model: GPT-4o, GPT-4.1, GPT-4 Turbo, etc.

### PR Summary Generator

**Command:**
```
Cmd+Shift+P → Linear Buddy: Generate PR Summary
```

**What it does:**
1. Reads your PR template
2. Analyzes commits and changes
3. Validates monorepo scope
4. Generates AI-powered summary
5. Pre-fills template sections

**Validation:**
- Warns if too many packages modified
- Suggests splitting PRs
- Checks template completeness

---

## ⚙️ Configuration

### Linear API Settings

```json
{
  // Required: Your Linear API token
  "monorepoTools.linearApiToken": "lin_api_...",
  
  // Optional: Filter tickets by team
  "monorepoTools.linearTeamId": "team-id-here"
}
```

### AI Model Settings

```json
{
  // AI model for summarization (GPT-4o recommended)
  "monorepoTools.aiModel": "gpt-4o",
  
  // Writing tone for AI summaries
  "monorepoTools.writingTone": "professional",
  
  // Enable/disable AI features
  "monorepoTools.enableAISummarization": true
}
```

**Available Models:**
- `gpt-4o` ⭐ (recommended - best quality)
- `gpt-4.1` (reliable, proven)
- `gpt-4-turbo` (fast and powerful)
- `gpt-4` (classic)
- `gpt-4o-mini` (faster, efficient)
- `gpt-3.5-turbo` (cost-effective)
- `gemini-2.0-flash` (Google's model)

**Available Tones:**
- `professional` (default - clear, informative)
- `casual` (friendly, conversational)
- `technical` (precise, detailed)
- `concise` (brief, to the point)

### Monorepo Settings

```json
{
  // Base branch for comparisons
  "monorepoTools.baseBranch": "main",
  
  // Package directories
  "monorepoTools.packagesPaths": ["packages/", "apps/"],
  
  // Maximum packages in one PR
  "monorepoTools.maxPackageScope": 2,
  
  // PR template path
  "monorepoTools.prTemplatePath": ".github/pull_request_template.md",
  
  // Standup time window
  "monorepoTools.standupTimeWindow": "24 hours ago"
}
```

---

## 📝 Usage Examples

### Example 1: Daily Standup

**Chat:**
```
@linear /standup
```

**Output:**
```
## 📊 Daily Standup Update

**Ticket:** ENG-456

### What did you do since the previous update?
Implemented JWT authentication flow with RS256 signing, 
added comprehensive test coverage for token lifecycle, 
and updated API documentation with new auth endpoints.

### What are you going to do today?
Deploy authentication changes to staging and monitor for 
edge cases, then start work on refresh token rotation.

### Are you reaching any blockers?
None

---
Recent commits (3):
- feat: Add JWT token authentication
- test: Add auth token tests
- docs: Update API docs with auth endpoints
```

### Example 2: Check Tickets

**Chat:**
```
@linear /tickets
```

**Output:**
```
## Your Active Tickets (3)

### In Progress (2)
🟠 **[ENG-456](https://linear.app/...)** - Implement JWT authentication
🟡 **[ENG-789](https://linear.app/...)** - Add user profile page

### Backlog (1)
🟢 **[ENG-101](https://linear.app/...)** - Refactor API tests
```

### Example 3: Check Specific Ticket

**Chat:**
```
@linear show me ENG-456
```

**Output:**
```
## ENG-456: Implement JWT authentication

**Status:** In Progress
**Priority:** 🟠 High

**Description:**
Replace session-based auth with JWT tokens for better scalability...

[Open in Linear](https://linear.app/...)
```

### Example 4: Generate PR

**Command Palette:**
```
Cmd+Shift+P → Linear Buddy: Generate PR Summary
```

**Output:**
- Validates monorepo scope
- Warns if >2 packages modified
- Generates AI summary
- Pre-fills PR template
- Opens in new document

---

## 🎨 Sidebar Examples

### Ticket View

```
LINEAR BUDDY
 └─ My Tickets
     ├─ In Progress (2)
     │   ├─ 🟠 ENG-456 - Implement JWT auth [▶️][✓]
     │   └─ 🟡 ENG-789 - Add user profile [▶️][✓]
     └─ Backlog (1)
         └─ 🟢 ENG-101 - Refactor tests [▶️][✓]
```

**Actions:**
- Click ticket → Opens in Linear
- ▶️ → Moves to "In Progress"
- ✓ → Marks as "Done"
- 🔄 (toolbar) → Refreshes list

---

## 🔧 Troubleshooting

### Chat Participant Not Showing

**Issue:** `@linear` doesn't appear in chat

**Solution:**
1. Check `package.json` has `"Chat"` in categories
2. Restart VS Code/Cursor
3. Check extension is activated: Look for "[Linear Buddy] Extension is now active" in Output

### No Tickets in Sidebar

**Issue:** Sidebar shows "Configure Linear API Token"

**Solution:**
1. Run: `Linear Buddy: Configure API Token`
2. Get token from [Linear Settings](https://linear.app/settings/api)
3. Paste token when prompted
4. Click refresh (🔄) in sidebar

### API Token Not Working

**Issue:** "Failed to fetch issues" error

**Solution:**
1. Verify token is valid: Check [Linear Settings](https://linear.app/settings/api)
2. Check token has correct permissions:
   - Read issues
   - Write issues (for status updates)
3. Try regenerating token
4. Reconfigure: `Linear Buddy: Configure API Token`

### AI Model Not Available

**Issue:** "model_not_supported" error

**Solution:**
1. Check your Cursor/Copilot subscription
2. Try different model:
   - Settings → Search "ai model"
   - Select `gpt-4o` (most reliable)
3. Extension automatically falls back to available models

### Standup Not Generating

**Issue:** Empty or no standup

**Solution:**
1. Check git commits exist in time window
2. Verify workspace is a git repo
3. Try longer time window:
   ```json
   "monorepoTools.standupTimeWindow": "48 hours ago"
   ```
4. Check Output panel for errors

---

## 🚀 Advanced Features

### Multi-Ticket Standup

Work on multiple tickets? No problem!

**Command:**
```
Linear Buddy: Generate Standup Update
```

**Select:** "Multiple tickets"

**Enter ticket IDs:**
```
ENG-456, ENG-789, ENG-101
```

The standup will include all commits across all branches!

### Target Branch Comparison

Compare against feature branches:

**When generating standup:**
- Enter target branch when prompted
- Default: `main` or `master`
- Custom: `feature/auth`, `develop`, etc.

**Use case:**
- Long-running feature branches
- Multiple branch strategy
- Better diff context for AI

### Custom AI Tone

Set your preferred writing style:

**Settings:**
```json
"monorepoTools.writingTone": "casual"
```

**Example outputs:**

**Professional:**
> Implemented JWT authentication flow with RS256 signing algorithm

**Casual:**
> Switched auth to JWT tokens - way more scalable now

**Technical:**
> Migrated authentication from stateful HTTP sessions to stateless JWT tokens with RS256 asymmetric signing

**Concise:**
> JWT auth migration, RS256 signing

---

## 🎯 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Command Palette | `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Win) |
| Open Chat | `Cmd+I` or `Cmd+L` |
| Settings | `Cmd+,` |

**Recommended Custom Shortcuts:**

Add to `keybindings.json`:
```json
[
  {
    "key": "cmd+shift+s",
    "command": "monorepoTools.generateStandup"
  },
  {
    "key": "cmd+shift+p",
    "command": "monorepoTools.generatePRSummary",
    "when": "!terminalFocus"
  }
]
```

---

## 📚 Resources

- **Linear API Docs:** https://developers.linear.app/docs
- **Get API Token:** https://linear.app/settings/api
- **VS Code Chat API:** https://code.visualstudio.com/api/extension-guides/chat

---

## 🤝 Contributing

This is a personal tool, but feel free to:
- Report issues
- Suggest features
- Share feedback

---

## 📄 License

Personal use. Not for commercial distribution.

---

## 🎉 Enjoy Linear Buddy!

**Happy coding!** 🚀

---

**Version:** 0.1.0
**Date:** November 2025
**Status:** ✅ Production Ready



