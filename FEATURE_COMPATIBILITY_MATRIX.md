# DevBuddy Feature Compatibility Matrix

## Overview

DevBuddy is a multi-platform ticket management extension for VS Code. This matrix shows which features are available for each platform.

**Legend:**
- ✅ **Fully Supported** - Feature is complete and tested
- 🚧 **In Progress** - Feature is partially implemented
- ⏳ **Planned** - Feature is planned for future release
- ❌ **Not Applicable** - Feature doesn't apply to this platform
- 🔄 **Platform-Specific** - Different implementation per platform

---

## Platform Support Status

| Platform | Status | Authentication | API Version | Notes |
|----------|--------|----------------|-------------|-------|
| **Linear** | ✅ Production | API Key | GraphQL | Full feature set |
| **Jira Cloud** | ✅ Production | Email + API Token | REST API v3 | Full CRUD, Zod validation |
| **Jira Server (beta)** | 🚧 Beta | Personal Access Token | REST API v2 | Testing phase |
| **Monday.com** | ⏳ Planned | API Key | GraphQL | Phase 3 |
| **ClickUp** | ⏳ Planned | API Token | REST API v2 | Phase 4 |

---

## Core Features

### 1. Ticket Management

| Feature | Linear | Jira Cloud | Jira Server (beta) | Monday | ClickUp |
|---------|--------|------------|-------------|--------|---------|
| **View Issues/Tickets** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Create Issues/Tickets** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Update Status** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Assign Issues** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Add Comments** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Edit Title/Description** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Set Priority** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Add Labels/Tags** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Set Due Date** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Delete Issues** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Search/Filter** | ✅ | ✅ (JQL) | ⏳ | ⏳ | ⏳ |
| **Bulk Operations** | ❌ | ❌ | ⏳ | ⏳ | ⏳ |

### 2. UI Integration

| Feature | Linear | Jira Cloud | Jira Server (beta) | Monday | ClickUp |
|---------|--------|------------|-------------|--------|---------|
| **Sidebar Tree View** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Detail Webview Panel** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Create Issue Form** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Command Palette** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Context Menus** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Status Bar** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Quick Pick Menus** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Icons & Theming** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |

### 3. Git Integration

| Feature | Linear | Jira Cloud | Jira Server (beta) | Monday | ClickUp |
|---------|--------|------------|-------------|--------|---------|
| **Branch Creation** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Branch Naming Convention** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Branch Association** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Auto-detect Branches** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Branch Analytics** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Checkout Branch** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **PR Detection** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Commit Links** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Multi-Repo Associations** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Cross-Workspace Branches** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Open in Repository** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **IDE Fork Detection** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |

### 4. AI Features

| Feature | Linear | Jira Cloud | Jira Server (beta) | Monday | ClickUp |
|---------|--------|------------|-------------|--------|---------|
| **PR Summary Generation** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Standup Generation** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Commit Analysis** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Monorepo Detection** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Multi-Ticket Standup** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Writing Tone Options** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **AI Model Selection** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Privacy Mode (No AI)** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Fallback Summarizer** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |

### 5. Chat Participant

| Feature | Linear | Jira Cloud | Jira Server (beta) | Monday | ClickUp |
|---------|--------|------------|-------------|--------|---------|
| **View Tickets** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Create Tickets** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Update Status** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Generate Standup** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Generate PR Summary** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Natural Language** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |
| **Slash Commands** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |

### 6. Advanced Features

| Feature | Linear | Jira Cloud | Jira Server (beta) | Monday | ClickUp |
|---------|--------|------------|-------------|--------|---------|
| **TODO → Ticket Conversion** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Code Permalinks** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Multi-TODO Linking** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Custom Fields** | ✅ | ⏳ | ⏳ | 🔄 | 🔄 |
| **Sub-tasks/Issues** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Attachments** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Watchers** | ✅ | ❌ | ⏳ | ⏳ | ⏳ |
| **Relations/Links** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Estimates** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |

### 7. Agile Features

| Feature | Linear | Jira Cloud | Jira Server (beta) | Monday | ClickUp |
|---------|--------|------------|-------------|--------|---------|
| **Sprints** | ✅ (Cycles) | ✅ | ⏳ | ⏳ | ⏳ |
| **Boards** | ✅ | ✅ | ⏳ | ✅ | ⏳ |
| **Backlogs** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Roadmaps** | ✅ | ❌ | ⏳ | ⏳ | ⏳ |
| **Velocity Tracking** | ❌ | ❌ | ⏳ | ⏳ | ⏳ |
| **Burndown Charts** | ❌ | ❌ | ⏳ | ⏳ | ⏳ |

### 8. Configuration

| Feature | Linear | Jira Cloud | Jira Server (beta) | Monday | ClickUp |
|---------|--------|------------|-------------|--------|---------|
| **First-Time Setup** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Connection Test** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Token Management** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Team/Project Selection** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Auto-refresh** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Secure Storage** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Debug Mode** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |

### 9. Quality & Safety

| Feature | Linear | Jira Cloud | Jira Server (beta) | Monday | ClickUp |
|---------|--------|------------|-------------|--------|---------|
| **Runtime Validation** | ❌ | ✅ (Zod v4) | ⏳ | ⏳ | ⏳ |
| **Type Safety** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Error Handling** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Graceful Fallbacks** | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| **Offline Mode** | ❌ | ❌ | ⏳ | ⏳ | ⏳ |
| **Rate Limiting** | ✅ | ⏳ | ⏳ | ⏳ | ⏳ |

---

## Platform-Specific Features

### Linear-Specific

| Feature | Status | Description |
|---------|--------|-------------|
| **Cycles** | ✅ | Linear's sprint equivalent |
| **Projects** | ✅ | Linear project management |
| **Teams** | ✅ | Multi-team support |
| **Roadmaps** | ✅ | Linear roadmap integration |
| **Templates** | ✅ | Issue templates |
| **Relations** | ✅ | Blocks, duplicate, relates to |
| **Triage** | ✅ | Inbox/triage workflow |
| **Desktop App** | ✅ | Open in Linear desktop app |

### Jira-Specific

| Feature | Status | Description |
|---------|--------|-------------|
| **JQL Search** | ✅ | Jira Query Language support |
| **Sprints** | ✅ | Agile sprint management |
| **Boards** | ✅ | Scrum/Kanban boards |
| **Workflows** | ✅ | Custom workflow transitions |
| **Issue Types** | ✅ | Story, Bug, Task, Epic, etc. |
| **Components** | ⏳ | Jira components |
| **Versions** | ⏳ | Release versions |
| **Epic Links** | ⏳ | Epic hierarchy |
| **Story Points** | ✅ | Estimation field |
| **Custom Fields** | ⏳ | User-defined fields |

---

## Shared Features (Platform-Agnostic)

These features work the same across all platforms:

| Feature | Status | Description |
|---------|--------|-------------|
| **AI Summarization** | ✅ | Works with any platform's data |
| **Git Analysis** | ✅ | Platform-independent git operations |
| **Monorepo Detection** | ✅ | Detects package changes |
| **PR Template Parsing** | ✅ | Works with any PR template |
| **Link Formatting** | ✅ | Slack/Markdown/Plain formats |
| **Debug Logging** | ✅ | Centralized logging system |
| **Telemetry** | ✅ | Privacy-respecting analytics |
| **Model Selection** | ✅ | GPT-4o, Gemini, etc. |
| **Multi-Repo Support** | ✅ | Cross-repository branch associations |
| **IDE Fork Detection** | ✅ | VS Code, Cursor, VSCodium, Windsurf |
| **Repository Registry** | ✅ | Map tickets to repositories |

---

## Multi-Repository Support

DevBuddy supports working across multiple repositories, enabling seamless context-switching for developers who work on multiple codebases.

### Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Global Branch Associations** | ✅ | Branch associations persist across workspaces |
| **Repository Registry** | ✅ | Map ticket prefixes to repository paths |
| **Cross-Workspace Visibility** | ✅ | See tickets from all repos in any workspace |
| **Open in Repository** | ✅ | One-click to switch to the correct workspace |
| **Repository Indicator** | ✅ | See which repo each ticket's branch lives in |
| **IDE Fork Detection** | ✅ | Works with VS Code, Cursor, VSCodium, Windsurf |
| **Auto-Discovery** | ✅ | Scan parent directories for related repos |
| **Manual Registration** | ✅ | Register repositories via command |
| **Config File Support** | ✅ | `.devbuddy/repos.json` for team configs |

### Configuration Options

```json
{
  "devBuddy.multiRepo.enabled": true,
  "devBuddy.multiRepo.autoDiscover": true,
  "devBuddy.multiRepo.parentDir": "~/projects",
  "devBuddy.repositories": {
    "frontend": { "path": "~/projects/frontend", "ticketPrefixes": ["FE"] },
    "backend": { "path": "~/projects/backend", "ticketPrefixes": ["BE", "API"] }
  }
}
```

### Supported IDE Forks

| IDE | CLI Command | Status |
|-----|-------------|--------|
| **VS Code** | `code` | ✅ |
| **Cursor** | `cursor` | ✅ |
| **VSCodium** | `codium` | ✅ |
| **Windsurf** | `windsurf` | ✅ |
| **Positron** | `positron` | ✅ |

---

## Future Enhancements

### Short-Term (Next Release)

| Feature | Target Platform | Priority | Status |
|---------|----------------|----------|--------|
| **Jira Standup Builder** | Jira Cloud | High | ✅ Done |
| **Jira Branch Integration** | Jira Cloud | High | ✅ Done |
| **Jira PR Summaries** | Jira Cloud | Medium | ✅ Done |
| **Multi-Repo Support** | All Platforms | High | ✅ Done |
| **Jira Chat Participant** | Jira Cloud | Medium | 🚧 In Progress |

### Medium-Term

| Feature | Target Platform | Priority |
|---------|----------------|----------|
| **Jira Server Support (beta)** | Jira Server/DC | High |
| **Custom Fields UI** | All Platforms | Medium |
| **Bulk Operations** | All Platforms | Low |
| **Offline Caching** | All Platforms | Low |
| **Advanced Filtering** | All Platforms | Medium |

### Long-Term

| Feature | Target Platform | Priority |
|---------|----------------|----------|
| **Monday.com Support** | Monday | Medium |
| **ClickUp Support** | ClickUp | Medium |
| **Asana Support** | Asana | Low |
| **GitHub Issues** | GitHub | Low |
| **GitLab Issues** | GitLab | Low |

---

## Development Status Summary

### ✅ Production Ready (v0.8.0)
- **Linear**: Full feature set with AI automation and git integration
- **Jira Cloud**: Complete issue management, git integration, and AI features - no browser needed!
- **Multi-Repo Support**: Cross-repository branch associations with IDE fork detection

### 🚧 In Development
- Jira Cloud: Chat participant
- Status bar integration
- Custom fields UI

### ⏳ Planned
- Jira Server/Data Center (beta) - Currently in testing
- Monday.com integration
- ClickUp integration
- Additional platform support

---

## API Coverage

### Linear GraphQL API
- **Coverage**: ~90%
- **Endpoints**: Issues, Projects, Teams, Cycles, Comments, Users
- **Missing**: Some admin features, webhooks

### Jira Cloud REST API v3
- **Coverage**: ~85%
- **Endpoints**: Issues, Projects, Users, Transitions, Comments, Boards, Sprints, Metadata
- **User Benefits**: View, edit, and create issues directly in VS Code without browser context switching
- **Missing**: Components, Versions, Custom fields UI, Advanced filters

### Jira Server REST API v2
- **Coverage**: 0% (not implemented)
- **Planned**: Core endpoints for Phase 2B

---

## Testing Status

| Platform | Unit Tests | Integration Tests | Manual Testing |
|----------|------------|-------------------|----------------|
| **Linear** | ❌ | ❌ | ✅ |
| **Jira Cloud** | ❌ | ❌ | ✅ |
| **Jira Server** | ❌ | ❌ | ❌ |

**Note**: Automated testing is planned for future releases. Jira Cloud webview panels have been manually tested and validated.

---

## Documentation Status

| Document | Status | Description |
|----------|--------|-------------|
| **README.md** | 🚧 | Needs DevBuddy update |
| **User Guide** | 🚧 | Needs multi-platform update |
| **API Docs** | ✅ | Complete for current features |
| **Developer Docs** | ✅ | Architecture documented |
| **Migration Guide** | ✅ | DevBuddy migration complete |

---

## 🎯 Path to 100% Feature Parity

### Linear - Missing Features (95% Complete)

**Low Priority - Both Platforms:**
| Feature | Priority | Reason |
|---------|----------|---------|
| **Bulk Operations** | Low | Not common in daily workflow |
| **Velocity Tracking** | Low | Better done in platform UI |
| **Burndown Charts** | Low | Better done in platform UI |
| **Offline Mode** | Medium | Nice-to-have but complex |
| **Runtime Validation** | Low | Already has TypeScript safety |

**Linear is essentially feature-complete** for daily development workflow.

---

### Jira Cloud - Missing Features (90% Complete)

**High Priority - Core Workflow:**
| Feature | Status | Impact | Notes |
|---------|--------|--------|-------|
| **Status Bar Integration** | ⏳ | Medium | Show active ticket in status bar |

**Medium Priority - Chat Integration:**
| Feature | Status | Impact | Notes |
|---------|--------|--------|-------|
| **Chat Participant** | ⏳ | Medium | @devbuddy in VS Code chat |

**Low Priority - Advanced Features:**
| Feature | Status | Impact | Notes |
|---------|--------|--------|-------|
| **Custom Fields UI** | ⏳ | Low | Most custom fields work via API |
| **Watchers** | ❌ | Low | Not common in Jira |
| **Rate Limiting** | ⏳ | Low | Add request throttling |
| **Bulk Operations** | ❌ | Low | Not common workflow |

---

### Feature Gaps Summary

**What Jira Cloud Needs for 100%:**

1. **Chat Participant (7 features)** - Natural language interface
   - View tickets via chat
   - Create tickets via chat
   - Update status via chat
   - Generate standups
   - Generate PR summaries
   - Natural language parsing
   - Slash commands

2. **Quality of Life (2 features)**
   - Status bar integration
   - Rate limiting

**Total Missing for Jira Cloud: ~9 features**
**Priority Breakdown:**
- High Priority: 0 features
- Medium Priority: 8 features (Chat participant + Status bar)
- Low Priority: 1 feature (Rate limiting)

**Major Wins in This Update:**
- ✅ **Git Integration (8 features)** - Branch creation, association, analytics - NOW COMPLETE!
- ✅ **AI Features (6 features)** - PR summaries, standup generation, commit analysis - NOW COMPLETE!
- ✅ **TODO Converter (3 features)** - TODO to ticket conversion, code permalinks, multi-TODO linking - NOW COMPLETE!
- ✅ **Multi-Repo Support (9 features)** - Cross-repo associations, IDE fork detection, repository registry - NOW COMPLETE!

---

### Realistic 100% Targets

**Linear: Already 95% Complete**
- Only missing nice-to-have features (bulk ops, charts, offline mode)
- Core workflow is 100% complete

**Jira Cloud: Needs 1 Sprint**
- Sprint 1: Chat participant + Status bar integration

**After this 1 sprint, Jira Cloud would be 95%+ complete** for daily development workflow.

---

## Recommendations for Users

### Choose Linear if:
- You want the most complete feature set
- You use Linear for project management
- You need AI-powered PR/standup features
- You want to avoid context switching between VS Code and browser

### Choose Jira Cloud if:
- Your team uses Jira Cloud
- You want to manage issues without leaving VS Code
- You need to view and edit tickets in your editor
- You want to avoid context switching between apps
- You need TODO to ticket conversion with code permalinks
- You can wait for AI chat features (coming soon)

### Wait for Future Release if:
- You use Jira Server/Data Center (beta available, testing phase)
- You use Monday.com or ClickUp
- You need custom fields UI
- You need offline support

---

**Last Updated**: December 21, 2025  
**Extension Version**: 0.8.0  
**Supported Platforms**: Linear (full), Jira Cloud (full), Jira Server (beta - testing)

