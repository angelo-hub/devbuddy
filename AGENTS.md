# Linear Buddy Development Guide

This workspace contains **Linear Buddy** - an AI-powered VS Code extension that integrates Linear issue tracking with intelligent workflow automation for monorepo development. It provides sidebar ticket management, chat participant integration, PR summary generation, standup automation, and TODO-to-ticket conversion with code permalinks.

## Development Commands

### Setup

```bash
npm install              # Install dependencies
```

### Build & Development

```bash
npm run compile              # Compile TypeScript (extension)
npm run compile:webview      # Build webviews (React apps)
npm run watch                # Watch extension TypeScript
npm run watch:webview        # Watch webview React apps
```

### Testing & Quality

```bash
npm run type-check           # TypeScript type checking
npm run lint                 # ESLint (extension code)
npm run pretest              # Compile before testing
```

### Packaging & Distribution

```bash
npm run package              # Create VSIX package
./reinstall.sh               # Build and install locally for testing
```

### Specialized Commands

```bash
npm run logo                 # Generate logo and PNG resources
npm run generate:logo        # Generate logo SVG
npm run generate:png         # Convert SVG to PNG variants
```

### Debugging

- Use **F5** to launch Extension Development Host
- Extension code compiles via TypeScript (`tsc`)
- Webviews compile via esbuild with React JSX transform
- Hot reload for webviews: make changes, save, and refresh webview panel
- Enable debug mode: Settings → `linearBuddy.debugMode` → `true`
- View logs: Output panel → "Linear Buddy" channel

## High-Level Architecture

### Directory Structure

```
src/
├── extension.ts                    # Extension entry point, activation logic
├── commands/                       # Command implementations
│   ├── generatePRSummary.ts        # PR summary generation with monorepo support
│   ├── generateStandup.ts          # Standup update generation
│   └── convertTodoToTicket.ts      # TODO to Linear ticket with permalinks
├── utils/                          # Utility modules
│   ├── aiSummarizer.ts             # AI summarization via VS Code LM API
│   ├── fallbackSummarizer.ts       # Rule-based analysis (no AI required)
│   ├── linearClient.ts             # Linear GraphQL API client
│   ├── gitAnalyzer.ts              # Git operations and commit analysis
│   ├── gitPermalinkGenerator.ts    # GitHub/GitLab/Bitbucket permalink generation
│   ├── packageDetector.ts          # Monorepo package detection
│   ├── branchAssociationManager.ts # Ticket-branch association tracking
│   ├── templateParser.ts           # PR template parsing
│   ├── linkFormatter.ts            # Link format (Slack/Markdown/Plain)
│   ├── todoCodeActionProvider.ts   # Code actions for TODO comments
│   ├── firstTimeSetup.ts           # Onboarding flow
│   └── logger.ts                   # Centralized logging with debug mode
├── views/                          # Tree view providers (sidebar)
│   ├── linearTicketsProvider.ts    # Main tickets tree view provider
│   ├── linearTicketPanel.ts        # Webview panel for ticket details
│   ├── createTicketPanel.ts        # Webview panel for creating tickets
│   └── standupBuilderPanel.ts      # Webview panel for standup builder
└── chat/
    └── linearBuddyParticipant.ts   # Chat participant (@linear)

webview-ui/
├── build.js                        # esbuild configuration
├── src/
    ├── global.css                  # Global webview styles
    ├── shared/                     # Shared React components & hooks
    │   ├── components/             # Reusable UI components
    │   │   ├── Button.tsx          # Button component
    │   │   ├── Input.tsx           # Input component
    │   │   ├── Select.tsx          # Dropdown component
    │   │   ├── TextArea.tsx        # Text area component
    │   │   └── Badge.tsx           # Badge/tag component
    │   ├── hooks/
    │   │   └── useVSCode.ts        # Hook for VS Code API communication
    │   └── types/
    │       └── messages.ts         # Message protocol types
    ├── standup-builder/            # Standup builder webview app
    │   ├── App.tsx                 # Main app component
    │   ├── components/             # Feature components
    │   │   ├── ModeSelector.tsx    # Mode selection (Single/Multi/Custom)
    │   │   ├── TicketSelector.tsx  # Ticket picker
    │   │   ├── StandupForm.tsx     # Standup options form
    │   │   ├── CommitsAndFiles.tsx # Git changes viewer
    │   │   ├── ProgressIndicator.tsx # Loading/progress state
    │   │   └── ResultsDisplay.tsx  # Generated standup display
    │   └── index.tsx               # Entry point
    ├── ticket-panel/               # Ticket detail webview app
    │   ├── App.tsx                 # Main app component
    │   ├── components/             # Feature components
    │   │   ├── TicketHeader.tsx    # Ticket identifier and title
    │   │   ├── TicketDescription.tsx # Ticket description with markdown
    │   │   ├── TicketMetadata.tsx  # Priority, estimate, dates
    │   │   ├── TicketLabels.tsx    # Labels/tags
    │   │   ├── StatusSelector.tsx  # Status dropdown
    │   │   ├── AssigneeSelector.tsx # Assignee picker
    │   │   ├── Comments.tsx        # Comment thread
    │   │   ├── CommentForm.tsx     # Add comment form
    │   │   ├── SubIssues.tsx       # Sub-issues list
    │   │   ├── AttachedPRs.tsx     # Linked pull requests
    │   │   ├── BranchManager.tsx   # Branch associations
    │   │   ├── ActionButtons.tsx   # Primary actions
    │   │   └── ShareButton.tsx     # Copy link functionality
    │   └── index.tsx               # Entry point
    └── create-ticket/              # Create ticket webview app
        ├── App.tsx                 # Main app component
        ├── components/
        │   └── TicketForm.tsx      # Ticket creation form
        └── index.tsx               # Entry point

docs/                               # Documentation
├── features/                       # Feature-specific docs
│   ├── ai/                         # AI features documentation
│   ├── branches/                   # Branch management
│   ├── pr-standup/                 # PR and standup features
│   ├── tickets/                    # Ticket management
│   └── todo-converter/             # TODO conversion feature
├── developer/                      # Developer guides
│   ├── DEBUG_QUICK_START.md        # Debugging guide
│   ├── WEBVIEW_GUIDE.md            # Webview development
│   ├── THEME_GUIDE.md              # Theming and CSS
│   └── TESTING.md                  # Testing strategy
└── user-guides/                    # End-user documentation
    ├── QUICKSTART.md               # Getting started
    ├── LINEAR_BUDDY_GUIDE.md       # Complete guide
    └── MULTI_TICKET_GUIDE.md       # Multi-ticket workflows
```

### Core Architectural Patterns

**1. Extension Activation Pattern**

- Single activation point in `src/extension.ts`
- All services initialized on `onStartupFinished` activation event
- Secure storage for API tokens using VS Code Secret Storage API
- Centralized logging with debug mode support
- Commands registered with `vscode.commands.registerCommand()`
- Tree view provider registered with `vscode.window.createTreeView()`
- Chat participant registered with context subscriptions

**2. Webview Panel Architecture**

- Three main webview apps: Standup Builder, Ticket Panel, Create Ticket
- Each webview has:
  - **Panel class** (in `src/views/`) - VS Code webview provider
  - **React app** (in `webview-ui/src/`) - UI implementation
  - **Message protocol** - Bidirectional communication via `postMessage()`
- Built with esbuild, React 18, CSS Modules
- Communication pattern:
  ```
  Extension (Panel) ↔ postMessage() ↔ Webview (React App)
  ```
- Shared components in `webview-ui/src/shared/`
- `useVSCode` hook abstracts VS Code API communication

**3. Layered Architecture**

```
VS Code Extension API
    ↓
Commands & Chat Participant (User Entry Points)
    ↓
Views & Panels (UI Controllers)
    ↓
Utility Services (Business Logic)
    ├── Linear Client (GraphQL API)
    ├── AI Summarizer (VS Code LM API)
    ├── Fallback Summarizer (Rule-based)
    ├── Git Analyzer (simple-git)
    ├── Package Detector (Monorepo)
    └── Branch Association Manager (Persistence)
    ↓
External APIs & Storage
    ├── Linear GraphQL API
    ├── GitHub Copilot (VS Code LM API)
    ├── VS Code Secret Storage (API tokens)
    └── VS Code Global State (Branch associations)
```

**4. AI Strategy Pattern (with Privacy-First Fallback)**

```typescript
// Strategy 1: AI-powered (default)
aiSummarizer.ts → VS Code Language Model API (GitHub Copilot)
  - Supports multiple models: GPT-4o, GPT-4.1, GPT-4 Turbo, Gemini 2.0 Flash
  - Automatic fallback if preferred model unavailable
  - Context-aware prompting with git diffs and Linear data

// Strategy 2: Rule-based (privacy mode)
fallbackSummarizer.ts → No external AI
  - Intelligent pattern detection
  - Commit message analysis
  - File change categorization
  - Works offline, 100% local
```

**5. Linear Integration Pattern**

- `LinearClient` singleton using GraphQL API
- Secure token storage with VS Code Secret Storage API
- Operations:
  - Fetch assigned issues
  - Get workflow states
  - Update issue status
  - Create issues with all metadata
  - Add comments
  - Fetch teams, projects, labels, users
- Automatic token migration from old config storage
- GraphQL queries with efficient field selection

**6. Branch Association Pattern**

- `BranchAssociationManager` tracks ticket-branch mappings
- Storage: VS Code Global State (persists across sessions)
- Features:
  - Manual association (user-driven)
  - Auto-detection based on branch name patterns
  - Intelligent suggestions for association
  - Analytics (stale branches, usage counts, age)
  - Cleanup suggestions
- Used by: Tree view, branch commands, standup builder

## Important Patterns and Conventions

### Configuration Management

- All settings defined in `package.json` contributions
- Access via `vscode.workspace.getConfiguration("linearBuddy")`
- Key settings:
  - `linearBuddy.ai.model` - AI model selection (auto, gpt-4o, etc.)
  - `linearBuddy.ai.disabled` - Privacy mode (disable external AI)
  - `linearBuddy.writingTone` - Tone for summaries
  - `linearBuddy.branchNamingConvention` - Branch naming style
  - `linearBuddy.packagesPaths` - Monorepo package directories
  - `linearBuddy.debugMode` - Enable debug logging
- Secure storage for API tokens (not in settings)

### Logging System

- Centralized logger in `src/utils/logger.ts`
- Singleton pattern: `getLogger()`
- Output channel: "Linear Buddy"
- Levels: `info`, `success`, `warn`, `error`, `debug`
- Debug logs only shown when `linearBuddy.debugMode` is enabled
- Auto-opens output panel in debug mode

### Command Structure

Commands follow the pattern:
```typescript
// In extension.ts
vscode.commands.registerCommand("linearBuddy.commandName", async (args) => {
  // Command implementation or delegate to command file
});

// In commands/commandName.ts
export async function commandNameCommand() {
  // Implementation
}
```

All commands prefixed with `linearBuddy.`

### Webview Communication Protocol

**Extension → Webview:**
```typescript
panel.webview.postMessage({
  command: 'dataUpdate',
  data: { ... }
});
```

**Webview → Extension:**
```typescript
// In React app
const vscode = acquireVsCodeApi();
vscode.postMessage({
  command: 'action',
  payload: { ... }
});

// In panel class
panel.webview.onDidReceiveMessage(async (message) => {
  switch (message.command) {
    case 'action':
      // Handle action
      break;
  }
});
```

### Tree View Pattern

- Tree items created with context values for conditional menu visibility
- Context value format: `linearTicket:state:flags`
  - Example: `linearTicket:started:withBranch:withPR`
- Icons from Codicons: `$(icon-name)`
- Collapsible groups by state: Backlog, Todo, In Progress, Done
- Tooltip shows detailed metadata

### CSS and Styling

- **Webviews:** CSS Modules for scoping (`.module.css` files)
- **VS Code theming:** Use CSS custom properties
  - `var(--vscode-foreground)` - Text color
  - `var(--vscode-button-background)` - Button background
  - `var(--vscode-input-background)` - Input background
  - Full list: [VS Code Theme Colors](https://code.visualstudio.com/api/references/theme-color)
- **Global styles:** `webview-ui/src/global.css`
- **Component styles:** Co-located `.module.css` files

### Git Integration

- Uses `simple-git` library (not native git commands)
- `GitAnalyzer` class abstracts git operations:
  - Get commits in time range
  - Get file changes (diff)
  - Detect affected packages
  - Get current branch
  - Get branch list
- Pattern detection for ticket IDs in branch names

### Package Detection (Monorepo)

- Scans configured paths (default: `packages/`, `apps/`)
- Detects changes in subdirectories
- Validates PR scope based on `maxPackageScope` setting
- Used for PR summary generation and standup updates

## Development Environment

### Prerequisites

- **Node.js** ≥ 20.x
- **npm** (comes with Node.js)
- **VS Code** ≥ 1.90.0
- **Git** ≥ 2.0

### VS Code Setup

- Launch configuration: `.vscode/launch.json`
  - "Run Extension" - Debug extension
  - "Extension Tests" - Run tests
- Recommended extensions:
  - ESLint
  - Prettier
  - TypeScript
- Use VS Code's built-in TypeScript language server

### Environment Variables (for Development)

```bash
LINEARBUDDY_OPEN_WALKTHROUGH=true  # Auto-open walkthrough on activation
LINEARBUDDY_OPEN_HELP=true         # Auto-open help menu on activation
```

### Multi-File Architecture

Linear Buddy is organized by feature:

- **Commands** - Entry points for user actions
- **Views** - UI providers (tree views, webview panels)
- **Utils** - Business logic and external integrations
- **Webview-UI** - React applications (separate build)
- **Chat** - AI chat participant implementation

## Common Development Tasks

### Adding a New Command

1. Create command function in `src/commands/` (if complex) or add to `extension.ts`
2. Register command in `extension.ts`:
   ```typescript
   context.subscriptions.push(
     vscode.commands.registerCommand("linearBuddy.myCommand", async () => {
       // Implementation
     })
   );
   ```
3. Add to `package.json` contributions:
   ```json
   {
     "command": "linearBuddy.myCommand",
     "title": "Linear Buddy: My Command",
     "icon": "$(icon-name)",
     "category": "Linear Buddy"
   }
   ```
4. Add to walkthrough or help menu if user-facing
5. Test with F5 (Extension Development Host)

### Adding a New Webview

1. Create panel class in `src/views/myPanel.ts`:
   ```typescript
   export class MyPanel {
     public static currentPanel: MyPanel | undefined;
     private readonly _panel: vscode.WebviewPanel;
     
     public static createOrShow(extensionUri: vscode.Uri) {
       // Implement singleton pattern
     }
     
     private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
       this._panel = panel;
       this._panel.webview.html = this._getHtmlForWebview();
       this._setWebviewMessageListener();
     }
     
     private _getHtmlForWebview(): string {
       // Load HTML with script tag for bundled JS
     }
     
     private _setWebviewMessageListener() {
       this._panel.webview.onDidReceiveMessage(async (message) => {
         // Handle messages from webview
       });
     }
   }
   ```

2. Create React app in `webview-ui/src/my-webview/`:
   ```typescript
   // index.tsx
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import { App } from './App';
   
   ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
   
   // App.tsx
   import React from 'react';
   import { useVSCode } from '../shared/hooks/useVSCode';
   
   export const App = () => {
     const vscode = useVSCode();
     // Implement UI
   };
   ```

3. Add entry point to `webview-ui/build.js`:
   ```javascript
   entryPoints: {
     "my-webview": path.resolve(__dirname, "src/my-webview/index.tsx"),
   }
   ```

4. Register command to open panel in `extension.ts`

5. Build and test:
   ```bash
   npm run compile:webview
   # Press F5 to debug
   ```

### Adding a Linear API Operation

1. Add method to `LinearClient` class in `src/utils/linearClient.ts`:
   ```typescript
   async myOperation(): Promise<ReturnType> {
     const query = `
       query MyQuery {
         issues {
           nodes {
             id
             title
           }
         }
       }
     `;
     
     const response = await this.request(query);
     return response.data.issues.nodes;
   }
   ```

2. Add types for the response data
3. Use in commands or views:
   ```typescript
   const client = await LinearClient.create();
   const result = await client.myOperation();
   ```

### Adding AI Summarization Features

1. Add prompt configuration in `src/utils/aiSummarizer.ts`:
   ```typescript
   const messages = [
     vscode.LanguageModelChatMessage.User(
       `Analyze the following data and generate a summary:\n\n${data}`
     ),
   ];
   
   const response = await model.sendRequest(messages, {}, token);
   ```

2. Add corresponding fallback in `src/utils/fallbackSummarizer.ts`:
   ```typescript
   async generateFallbackSummary(data: any): Promise<string> {
     // Rule-based analysis without AI
     return `Summary based on patterns: ...`;
   }
   ```

3. Choose strategy based on settings:
   ```typescript
   const config = vscode.workspace.getConfiguration("linearBuddy");
   const aiDisabled = config.get<boolean>("ai.disabled", false);
   
   if (aiDisabled) {
     return await fallbackSummarizer.generate(data);
   } else {
     return await aiSummarizer.generate(data, model);
   }
   ```

### Adding a New Tree View Item Type

1. Update `LinearTicketsProvider` in `src/views/linearTicketsProvider.ts`
2. Create tree item with context value:
   ```typescript
   const item = new vscode.TreeItem(label, collapsibleState);
   item.contextValue = "myItemType";
   item.iconPath = new vscode.ThemeIcon("icon-name");
   ```

3. Add menu contribution in `package.json`:
   ```json
   {
     "command": "linearBuddy.myAction",
     "when": "view == linearTickets && viewItem == myItemType",
     "group": "inline@1"
   }
   ```

### Working with Branch Associations

```typescript
// Get manager instance
const branchManager = new BranchAssociationManager(context);

// Associate a branch with a ticket
await branchManager.associateBranch("ENG-123", "feat/eng-123-my-feature");

// Get association
const branch = await branchManager.getAssociatedBranch("ENG-123");

// Auto-detect associations
const detected = await branchManager.autoDetectAllBranchAssociations();

// Get analytics
const analytics = await branchManager.getBranchAnalytics();

// Cleanup stale branches
const removed = await branchManager.cleanupStaleAssociations();
```

### Debugging Webviews

1. Open Extension Development Host (F5)
2. Trigger webview panel (e.g., open standup builder)
3. In webview, right-click → "Open Webview Developer Tools"
4. Use Chrome DevTools to debug React code
5. Console logs from webview appear in DevTools
6. Extension-side logs appear in "Linear Buddy" output channel

## Repository Guidelines

### Commit Messages

- Use conventional commit format:
  - `feat: add new feature`
  - `fix: resolve bug`
  - `docs: update documentation`
  - `chore: maintenance task`
  - `refactor: code improvement`
- Reference Linear tickets: `feat: add standup builder (ENG-123)`
- Keep first line under 72 characters

### Branch Workflow

- Feature branches from `main`
- Use Linear ticket ID in branch name: `feat/eng-123-description`
- Convention options:
  - **Conventional:** `feat/eng-123-description`
  - **Simple:** `eng-123-description`
  - **Custom:** Define your own template

### Code Style

- **TypeScript:** Strict mode enabled
- **React:** Functional components with hooks
- **CSS:** Use CSS Modules for scoping
- **Naming:**
  - Components: PascalCase
  - Files: camelCase or kebab-case
  - CSS Modules: ComponentName.module.css
- **Imports:**
  - External libraries first
  - Internal imports second
  - Sort alphabetically

### Testing Strategy

- Manual testing via Extension Development Host (F5)
- Test all commands and webview panels
- Verify AI summarization (with and without AI)
- Test with and without Linear API token
- Test in monorepo and single-repo workspaces
- Verify branch association features

## Key Technologies

### Core Technologies

- **VS Code Extension API** - Extension framework
- **TypeScript** - Type-safe JavaScript
- **React 18** - Webview UI framework
- **esbuild** - Fast JavaScript bundler
- **simple-git** - Git operations
- **CSS Modules** - Scoped styling

### External APIs

- **Linear GraphQL API** - Issue tracking data
- **VS Code Language Model API** - AI summarization (GitHub Copilot)
- **GitHub/GitLab/Bitbucket** - Permalink generation

### VS Code APIs Used

- `vscode.window` - UI (notifications, quick picks, tree views, webviews)
- `vscode.workspace` - Configuration, file system, workspace folders
- `vscode.commands` - Command registration and execution
- `vscode.secrets` - Secure token storage
- `vscode.ExtensionContext.globalState` - Persistent data storage
- `vscode.lm` - Language Model API (AI)
- `vscode.chat` - Chat participant API

## Configuration Reference

### Key Settings

```typescript
{
  // AI Configuration
  "linearBuddy.ai.model": "auto",           // AI model selection
  "linearBuddy.ai.disabled": false,         // Privacy mode (disable AI)
  "linearBuddy.writingTone": "professional", // Tone for summaries
  
  // Linear Integration
  "linearBuddy.linearOrganization": "myorg", // Organization slug
  "linearBuddy.linearTeamId": "",           // Filter by team (optional)
  "linearBuddy.preferDesktopApp": false,    // Open in desktop app
  "linearBuddy.linkFormat": "markdown",     // Link format (Slack/Markdown/Plain)
  
  // Branch Management
  "linearBuddy.branchNamingConvention": "conventional", // Branch naming
  "linearBuddy.customBranchTemplate": "{type}/{identifier}-{slug}",
  
  // Monorepo Support
  "linearBuddy.baseBranch": "main",         // Base branch for PRs
  "linearBuddy.packagesPaths": ["packages/", "apps/"], // Package directories
  "linearBuddy.maxPackageScope": 2,         // Max packages per PR
  "linearBuddy.prTemplatePath": ".github/pull_request_template.md",
  
  // Standup Configuration
  "linearBuddy.standupTimeWindow": "24 hours ago", // Commit window
  
  // System
  "linearBuddy.debugMode": false,           // Enable debug logging
  "linearBuddy.autoRefreshInterval": 5,     // Refresh tickets (minutes)
}
```

### Secure Storage

API tokens stored via VS Code Secret Storage:
```typescript
// Store token
await context.secrets.store("linearApiToken", token);

// Retrieve token
const token = await context.secrets.get("linearApiToken");

// Delete token
await context.secrets.delete("linearApiToken");
```

## Performance Considerations

- **Lazy Loading:** Services initialized on-demand
- **Caching:** Linear data cached for auto-refresh interval
- **Background Refresh:** Tree view refreshes in background without blocking UI
- **Debouncing:** Git operations debounced to avoid excessive calls
- **Efficient Queries:** Linear GraphQL queries only request needed fields
- **Webview Reuse:** Singleton pattern for webview panels

## Privacy & Security

- **API Tokens:** Stored in OS secure credential storage (never in settings)
- **AI Processing:** All AI via GitHub Copilot (respects GitHub Copilot privacy settings)
- **Privacy Mode:** Rule-based analysis option (no external AI)
- **No Telemetry:** Extension does not collect usage data
- **Local Processing:** Git analysis happens locally
- **No Data Storage:** No user data stored on external servers

## Troubleshooting

### Common Issues

1. **Tickets not showing:**
   - Verify API token is configured
   - Check Linear organization setting
   - Refresh tree view manually
   - Enable debug mode and check logs

2. **AI not working:**
   - Ensure GitHub Copilot is active
   - Check model availability in settings
   - Try "auto" model selection
   - Use fallback mode if AI not available

3. **Branch associations lost:**
   - Associations stored in global state
   - Check workspace storage
   - Use auto-detect to rebuild associations

4. **Webview not loading:**
   - Check webview build output
   - Verify esbuild compiled successfully
   - Check browser console in webview DevTools

### Debug Mode

Enable comprehensive logging:
1. Settings → `linearBuddy.debugMode` → `true`
2. Output panel → "Linear Buddy"
3. View all API calls, git operations, and AI requests

## Contributing Guidelines

### Before Submitting Changes

- Test all modified features
- Verify no TypeScript errors (`npm run type-check`)
- Run lint check (`npm run lint`)
- Test in both monorepo and single-repo workspaces
- Test with AI enabled and disabled
- Update documentation if adding features

### Documentation Updates

- Update `README.md` for user-facing changes
- Update `AGENTS.md` for architectural changes
- Add feature documentation in `docs/features/`
- Update walkthrough if adding major features

---

This architecture enables Linear Buddy to provide powerful workflow automation while maintaining clean separation of concerns, extensibility for new features, and privacy-first AI integration with intelligent fallback strategies.

