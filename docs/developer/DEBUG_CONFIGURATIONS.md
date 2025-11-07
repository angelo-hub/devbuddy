# Debug Launch Configurations

This document describes the debug launch configurations available for testing Linear Buddy during development.

## Available Configurations

### 1. Run Extension
**Standard development mode** - Runs the extension without any automatic actions.

```json
{
  "name": "Run Extension"
}
```

**Use this when:**
- Testing normal extension behavior
- Debugging specific features manually
- You want full control over the extension

### 2. Run Extension with Walkthrough ⭐
**Auto-opens the walkthrough** - Runs the extension and automatically opens the Getting Started walkthrough after 1 second.

```json
{
  "name": "Run Extension with Walkthrough",
  "env": {
    "LINEARBUDDY_OPEN_WALKTHROUGH": "true"
  }
}
```

**Use this when:**
- Testing the walkthrough tutorial
- Reviewing walkthrough content
- Debugging walkthrough-related issues
- Demonstrating features to team members

**What happens:**
1. Extension activates normally
2. After 1 second delay (to allow full activation)
3. Walkthrough opens automatically
4. You can navigate through all 11 steps

### 3. Run Extension with Help Menu
**Auto-opens the help menu** - Runs the extension and automatically opens the help menu picker.

```json
{
  "name": "Run Extension with Help Menu",
  "env": {
    "LINEARBUDDY_OPEN_HELP": "true"
  }
}
```

**Use this when:**
- Testing the help menu
- Reviewing help menu options
- Testing keyboard shortcuts display
- Testing FAQ functionality

**What happens:**
1. Extension activates normally
2. After 1 second delay
3. Help menu quick pick opens
4. You can select any help option

### 4. Extension Tests
**Standard test runner** - Runs the extension test suite.

```json
{
  "name": "Extension Tests"
}
```

## How to Use

### From VS Code

1. **Open Run and Debug panel**
   - Click the Run icon in the Activity Bar (or press `Cmd/Ctrl+Shift+D`)

2. **Select a configuration**
   - Use the dropdown at the top of the panel
   - Choose one of the four configurations

3. **Start debugging**
   - Click the green play button
   - Or press `F5`

### From Command Palette

1. Press `Cmd/Ctrl+Shift+P`
2. Type "Debug: Select and Start Debugging"
3. Choose your preferred configuration

## Environment Variables

The debug configurations use environment variables to control behavior:

### `LINEARBUDDY_OPEN_WALKTHROUGH`
When set to `"true"`, automatically opens the walkthrough after extension activation.

```typescript
if (process.env.LINEARBUDDY_OPEN_WALKTHROUGH === "true") {
  setTimeout(() => {
    vscode.commands.executeCommand(
      "workbench.action.openWalkthrough",
      "personal.linear-buddy#linearBuddy.gettingStarted",
      false
    );
  }, 1000);
}
```

### `LINEARBUDDY_OPEN_HELP`
When set to `"true"`, automatically opens the help menu after extension activation.

```typescript
if (process.env.LINEARBUDDY_OPEN_HELP === "true") {
  setTimeout(() => {
    vscode.commands.executeCommand("linearBuddy.showHelp");
  }, 1000);
}
```

## Timing

Both automatic actions use a **1-second delay** (`setTimeout(..., 1000)`) to ensure:
- Extension is fully activated
- All commands are registered
- Tree views are initialized
- Context is ready

If you experience issues with timing, you can adjust this in `src/extension.ts`.

## Common Workflows

### Testing Walkthrough Changes

1. Modify markdown files in `/media/walkthrough/`
2. Run `npm run compile` (or rely on pre-launch task)
3. Select **"Run Extension with Walkthrough"**
4. Press `F5`
5. Walkthrough opens automatically
6. Navigate through steps to verify changes

### Testing Help Menu Updates

1. Modify help command in `src/extension.ts`
2. Select **"Run Extension with Help Menu"**
3. Press `F5`
4. Help menu opens automatically
5. Test all menu options

### Manual Testing

1. Select **"Run Extension"**
2. Press `F5`
3. Manually trigger features via:
   - Command Palette
   - Sidebar buttons
   - Right-click menus
   - Chat commands

## Debugging Tips

### Set Breakpoints
- Click in the gutter next to line numbers in TypeScript files
- Breakpoints work in `.ts` files (source maps are configured)
- Debug console shows all `console.log` outputs

### Watch Variables
- Use the Variables panel to inspect state
- Add expressions to the Watch panel
- Hover over variables in the editor

### Debug Console
- Run commands: `vscode.commands.executeCommand(...)`
- Inspect objects: `context`, `vscode.window`, etc.
- Test APIs interactively

### Reload Extension
- Press `Cmd/Ctrl+R` in the Extension Development Host
- Reloads the extension without restarting debugger
- Faster iteration for testing changes

## Pre-Launch Task

All configurations include:
```json
"preLaunchTask": "${defaultBuildTask}"
```

This automatically runs `npm run compile` before launching, ensuring your latest code changes are compiled.

## Output Files

Debug configurations point to compiled JavaScript:
```json
"outFiles": [
  "${workspaceFolder}/out/**/*.js"
]
```

Source maps enable debugging TypeScript directly.

## Troubleshooting

### Walkthrough doesn't open automatically
- Check the Debug Console for errors
- Verify the walkthrough ID is correct in `package.json`
- Increase the timeout if extension is slow to activate

### Help menu doesn't appear
- Ensure the command is registered (check Debug Console)
- Verify no errors during activation
- Check that `linearBuddy.showHelp` command exists

### Extension won't start
- Run `npm run compile` manually to check for errors
- Check `package.json` syntax is valid
- Verify all dependencies are installed (`npm install`)

## Adding New Configurations

To add a new debug configuration:

1. Open `.vscode/launch.json`
2. Add a new configuration object
3. Set environment variables as needed:

```json
{
  "name": "Your Config Name",
  "type": "extensionHost",
  "request": "launch",
  "args": [
    "--extensionDevelopmentPath=${workspaceFolder}"
  ],
  "outFiles": [
    "${workspaceFolder}/out/**/*.js"
  ],
  "preLaunchTask": "${defaultBuildTask}",
  "env": {
    "YOUR_ENV_VAR": "value"
  }
}
```

4. Add corresponding logic in `src/extension.ts`:

```typescript
if (process.env.YOUR_ENV_VAR === "value") {
  // Your custom behavior
}
```

## Benefits

✅ **Faster Testing** - No need to manually open walkthrough each time
✅ **Consistent** - Same starting point for every test run
✅ **Efficient** - Focus on testing, not setup
✅ **Flexible** - Multiple configurations for different scenarios
✅ **Developer-Friendly** - Easy to add new configurations

## Related Files

- `.vscode/launch.json` - Launch configurations
- `src/extension.ts` - Environment variable checks
- `package.json` - Walkthrough definition
- `/media/walkthrough/*.md` - Walkthrough content

Happy debugging! 🐛🔍

