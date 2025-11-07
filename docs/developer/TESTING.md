# Testing the Extension

## Quick Start

1. **Install the extension:**
   - Open Cursor
   - Press `Cmd+Shift+P`
   - Type "Install from VSIX"
   - Select the `cursor-monorepo-tools-0.0.1.vsix` file

2. **Test in a real monorepo:**
   - Open any monorepo project in Cursor
   - Make some changes to files
   - Try the commands

## Test Commands

### Test PR Summary Generation

1. Create a test branch:
   ```bash
   git checkout -b feature/TEST-123-test-extension
   ```

2. Make some changes to files in your monorepo

3. Run the command:
   - Press `Cmd+Shift+P`
   - Type "Monorepo Tools: Generate PR Summary"
   - Follow the prompts

4. Expected output:
   - A new markdown document with:
     - Ticket section (TEST-123 should be auto-detected)
     - Package analysis
     - Scope verdict
     - Git context with commits and files

### Test Standup Generation

1. Make sure you have some commits in the last 24 hours

2. Run the command:
   - Press `Cmd+Shift+P`
   - Type "Monorepo Tools: Generate Standup Update"
   - Follow the prompts

3. Expected output:
   - A new markdown document with:
     - Daily standup format
     - Your answers to the three questions
     - Recent commits
     - Changed files

## Testing with Different Configurations

### Test with multiple package paths

Open Settings (`Cmd+,`) and search for "monorepo":

```json
{
  "monorepoTools.packagesPaths": ["packages/", "apps/", "services/"]
}
```

### Test with different base branch

```json
{
  "monorepoTools.baseBranch": "develop"
}
```

### Test with different scope limit

```json
{
  "monorepoTools.maxPackageScope": 3
}
```

## Development Testing

1. Open this extension folder in Cursor
2. Press `F5` to launch Extension Development Host
3. A new Cursor window will open with the extension loaded
4. Open a monorepo in that window
5. Test the commands
6. Check the Debug Console for logs

## Common Test Cases

### 1. Repository with no PR template
- Should use default template
- Should show warning message

### 2. Branch without ticket ID
- Should prompt for ticket ID
- Should handle empty ticket ID gracefully

### 3. Changes in multiple packages
- Test with 1 package (should pass)
- Test with 2 packages (should pass)
- Test with 3+ packages (should show warning)

### 4. Repository not in git
- Should show error message
- Should not crash

### 5. No commits in time window
- Standup should show "(no new commits)"
- Should still generate standup

### 6. PR template with checkboxes
- Should prompt for Yes/No/N/A for each checkbox
- Should format checkboxes correctly

## Troubleshooting Development

### Extension not loading
```bash
npm run compile
# Then restart Cursor or reload window
```

### Changes not reflecting
1. Make your changes
2. Run: `npm run compile`
3. In Extension Development Host: `Cmd+Shift+P` → "Developer: Reload Window"

### Debugging
- Use `console.log()` in your code
- Check Debug Console in Cursor (View → Debug Console)
- Add breakpoints and use F5 to debug

## Manual Testing Checklist

- [ ] Install extension from VSIX
- [ ] Extension shows up in Extensions panel
- [ ] PR Summary command appears in Command Palette
- [ ] Standup command appears in Command Palette
- [ ] PR Summary detects ticket from branch name
- [ ] PR Summary analyzes packages correctly
- [ ] PR Summary validates scope (1-2 packages)
- [ ] PR Summary reads custom PR template
- [ ] PR Summary handles missing PR template
- [ ] Standup shows commits from last 24 hours
- [ ] Standup shows changed files
- [ ] Standup handles empty commits gracefully
- [ ] Configuration settings work
- [ ] Works with different base branches (main/master/develop)
- [ ] Error messages are helpful
- [ ] Generated documents are well-formatted

