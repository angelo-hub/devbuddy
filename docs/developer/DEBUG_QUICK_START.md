# Quick Reference: Debug Launch Configurations

## Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│ Run and Debug (Cmd/Ctrl+Shift+D)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Select Configuration: ▼                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Run Extension                                         │ │
│  │ Run Extension with Walkthrough         ⭐            │ │
│  │ Run Extension with Help Menu                         │ │
│  │ Extension Tests                                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [▶ Start Debugging] (F5)                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Test the Walkthrough
```bash
1. Press F5 (or click Run icon)
2. Select "Run Extension with Walkthrough"
3. Wait 1 second
4. ✨ Walkthrough opens automatically!
```

### Test the Help Menu
```bash
1. Press F5
2. Select "Run Extension with Help Menu"
3. Wait 1 second
4. ✨ Help menu appears!
```

## Configuration Matrix

| Configuration | Auto-Opens | Best For |
|--------------|-----------|----------|
| **Run Extension** | Nothing | Normal development |
| **Run Extension with Walkthrough** ⭐ | Walkthrough tutorial | Testing walkthrough content |
| **Run Extension with Help Menu** | Help quick pick | Testing help features |
| **Extension Tests** | Test runner | Running unit tests |

## Environment Variables

```typescript
// Walkthrough Mode
LINEARBUDDY_OPEN_WALKTHROUGH=true
  ↓
  Opens walkthrough after 1 second
  ↓
  "workbench.action.openWalkthrough"

// Help Menu Mode
LINEARBUDDY_OPEN_HELP=true
  ↓
  Opens help menu after 1 second
  ↓
  "linearBuddy.showHelp"
```

## Timing Diagram

```
Extension Launch
      ↓
  Activate
      ↓
Initialize Features (0ms)
      ↓
Check Environment Variables (0ms)
      ↓
If LINEARBUDDY_OPEN_WALKTHROUGH
      ↓
  Wait 1000ms ⏱️
      ↓
  Open Walkthrough ✨

If LINEARBUDDY_OPEN_HELP
      ↓
  Wait 1000ms ⏱️
      ↓
  Open Help Menu ✨
```

## Code Flow

```typescript
// src/extension.ts (lines 58-73)

activate(context) {
  // ... initialization ...
  
  if (process.env.LINEARBUDDY_OPEN_WALKTHROUGH === "true") {
    setTimeout(() => {
      vscode.commands.executeCommand(
        "workbench.action.openWalkthrough",
        "personal.linear-buddy#linearBuddy.gettingStarted",
        false
      );
    }, 1000);
  }
  
  if (process.env.LINEARBUDDY_OPEN_HELP === "true") {
    setTimeout(() => {
      vscode.commands.executeCommand("linearBuddy.showHelp");
    }, 1000);
  }
}
```

## Testing Workflow

### Iterative Development

```
1. Edit walkthrough markdown
   ↓
2. Press F5 (selects last config)
   ↓
3. Walkthrough opens automatically
   ↓
4. Review changes
   ↓
5. Press Cmd/Ctrl+R to reload
   ↓
6. Repeat
```

### Full Test Cycle

```
Edit Code → Compile → Launch → Auto-Open → Test → Reload
    ↑                                              ↓
    └──────────────────────────────────────────────┘
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Run & Debug | `Cmd/Ctrl+Shift+D` |
| Start Debugging | `F5` |
| Reload Extension | `Cmd/Ctrl+R` (in dev host) |
| Stop Debugging | `Shift+F5` |
| Restart Debugging | `Cmd/Ctrl+Shift+F5` |

## Files Overview

```
cursor-monorepo-tools/
├── .vscode/
│   └── launch.json              # Launch configurations ⚙️
├── src/
│   └── extension.ts             # Environment variable checks
├── media/
│   └── walkthrough/
│       ├── welcome.md           # Step 1
│       ├── setup-apikey.md      # Step 2
│       └── ...                  # Steps 3-11
├── package.json                 # Walkthrough definition
└── DEBUG_CONFIGURATIONS.md      # Full documentation 📖
```

## Common Tasks

### Add a New Debug Config

1. Edit `.vscode/launch.json`
2. Copy existing configuration
3. Change name and env variables
4. Add logic in `extension.ts`

### Adjust Timing

```typescript
// Change from 1 second to 2 seconds
setTimeout(() => { ... }, 2000);  // was 1000
```

### Disable Auto-Open Temporarily

```typescript
// Comment out the auto-open block
// if (process.env.LINEARBUDDY_OPEN_WALKTHROUGH === "true") {
//   ...
// }
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Walkthrough doesn't open | Check Debug Console for errors |
| Wrong walkthrough opens | Verify walkthrough ID in package.json |
| Timing issues | Increase setTimeout delay |
| Extension won't compile | Run `npm run compile` manually |

## Pro Tips

💡 **Fastest iteration:** Use "Reload Extension" (`Cmd/Ctrl+R`) instead of stopping and starting
💡 **Breakpoint debugging:** Set breakpoints in the setTimeout callback
💡 **Console output:** Check Debug Console for `console.log` messages
💡 **Multiple windows:** You can run multiple debug sessions simultaneously
💡 **Custom shortcuts:** Bind F5 variants to specific configurations

## Related Documentation

- 📖 [DEBUG_CONFIGURATIONS.md](./DEBUG_CONFIGURATIONS.md) - Full documentation
- 📖 [WALKTHROUGH_IMPLEMENTATION.md](./WALKTHROUGH_IMPLEMENTATION.md) - Walkthrough details
- 📖 [HELP_QUICK_REFERENCE.md](./HELP_QUICK_REFERENCE.md) - Help system overview

---

**Quick Test:** Press `F5` → Select "Run Extension with Walkthrough" → See it in action! ✨

