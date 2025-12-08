# Extension Architecture Diagram

## Before Refactoring

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                   extension.ts                           │
│                   (3,157 lines)                          │
│                                                          │
│  • URI Handler                                           │
│  • Initialization Logic                                  │
│  • Context Keys                                          │
│  • Tree View Registration                                │
│  • Chat Participant                                      │
│  • Language Model Tools                                  │
│  • Code Actions                                          │
│  • 50+ Command Registrations                             │
│  • Linear Commands                                       │
│  • Jira Commands                                         │
│  • Help Commands                                         │
│  • Walkthrough Commands                                  │
│  • Telemetry Commands                                    │
│  • Settings Commands                                     │
│  • Branch Commands                                       │
│  • PR Commands                                           │
│  • ... and more                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## After Refactoring

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                         extension.ts                               │
│                         (97 lines)                                 │
│                                                                    │
│  Entry Point - Orchestrates Activation in 4 Phases:               │
│  1. Core Infrastructure                                            │
│  2. UI Components                                                  │
│  3. AI & Code Features                                             │
│  4. Commands                                                       │
│                                                                    │
└───────────┬────────────────────────────────────────────────────────┘
            │
            ├─────────────────────────────────────────────────────┐
            │                                                     │
            ▼                                                     ▼
┌───────────────────────┐                          ┌───────────────────────┐
│   activation/         │                          │   commands/           │
│                       │                          │                       │
│  • uriHandler.ts      │                          │  • index.ts           │
│  • initialization.ts  │                          │                       │
│  • treeView.ts        │                          │  ┌─────────────────┐  │
│  • chatParticipant.ts │                          │  │   common/       │  │
│  • lmTools.ts         │                          │  │  • index.ts     │  │
│  • codeActions.ts     │                          │  │  • helpCmds.ts  │  │
│                       │                          │  └─────────────────┘  │
└───────────────────────┘                          │                       │
                                                   │  ┌─────────────────┐  │
                                                   │  │   linear/       │  │
                                                   │  │  • index.ts     │  │
                                                   │  │  (placeholder)  │  │
                                                   │  └─────────────────┘  │
                                                   │                       │
                                                   │  ┌─────────────────┐  │
                                                   │  │   jira/         │  │
                                                   │  │  • index.ts     │  │
                                                   │  │  (placeholder)  │  │
                                                   │  └─────────────────┘  │
                                                   └───────────────────────┘
```

## Activation Sequence

```
┌──────────┐
│  Start   │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────┐
│ 1. Initialize Logger            │
│    • Create output channel      │
│    • Show version banner        │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│ 2. Core Infrastructure          │
│    • Register URI Handler       │
│    • Initialize Telemetry       │
│    • Setup Secret Storage       │
│    • Create Branch Manager      │
│    • Setup Context Keys         │
│    • Handle Dev Mode            │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│ 3. UI Components                │
│    • Register Tree View         │
│    • Setup Refresh Handlers     │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│ 4. AI & Code Features           │
│    • Register Chat Participant  │
│    • Register LM Tools          │
│    • Register Code Actions      │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│ 5. Commands                     │
│    • Core Commands              │
│    • Platform Commands          │
│    • Common Commands            │
│    • Linear Commands            │
│    • Jira Commands              │
└────┬────────────────────────────┘
     │
     ▼
┌──────────┐
│  Ready   │
└──────────┘
```

## Module Responsibilities

### activation/

| Module | Responsibility | Lines | Dependencies |
|--------|---------------|-------|--------------|
| `uriHandler.ts` | Handle vscode:// deeplinks | ~60 | logger |
| `initialization.ts` | Core services setup | ~160 | LinearClient, telemetry, storage |
| `treeView.ts` | Sidebar registration | ~60 | UniversalTicketsProvider |
| `chatParticipant.ts` | AI chat integration | ~20 | DevBuddyChatParticipant |
| `lmTools.ts` | AI agent tools | ~200 | LinearClient, JiraClient |
| `codeActions.ts` | TODO converter | ~20 | TodoToTicketCodeActionProvider |

### commands/

| Module | Responsibility | Lines | Status |
|--------|---------------|-------|--------|
| `index.ts` | Central registration | ~150 | ✅ Complete |
| `common/` | Platform-agnostic | ~100 | ✅ Complete |
| `linear/` | Linear-specific | TBD | 🔄 Placeholder |
| `jira/` | Jira-specific | TBD | 🔄 Placeholder |

## Benefits Summary

### Maintainability ⭐⭐⭐⭐⭐
- Single Responsibility Principle applied
- Easy to locate specific functionality
- Clear module boundaries

### Scalability ⭐⭐⭐⭐⭐
- Easy to add new platforms
- Modular command structure
- Independent feature development

### Testability ⭐⭐⭐⭐⭐
- Isolated modules
- Clear dependencies
- Mockable interfaces

### Readability ⭐⭐⭐⭐⭐
- Self-documenting structure
- Phased activation
- Descriptive file names

### Collaboration ⭐⭐⭐⭐⭐
- Parallel development possible
- Reduced merge conflicts
- Clear ownership
```


