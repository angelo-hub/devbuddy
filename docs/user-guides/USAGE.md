# Usage Guide

## Installation

1. Make sure you're in the extension directory:
   ```bash
   cd ~/devtools/cursor-monorepo-tools
   ```

2. If not already done, install dependencies and compile:
   ```bash
   npm install
   npm run compile
   ```

3. Package the extension (already done if you see the .vsix file):
   ```bash
   npm run package
   ```

4. Install in Cursor:
   - Open Cursor
   - Press `Cmd+Shift+P` to open Command Palette
   - Type "Install from VSIX"
   - Select `Extensions: Install from VSIX...`
   - Navigate to `~/devtools/cursor-monorepo-tools/cursor-monorepo-tools-0.0.1.vsix`
   - Click "Install"

## Using the Extension

### Generate PR Summary

This command helps you create a comprehensive PR description by:
- Analyzing your git changes
- Detecting which packages were modified
- Validating that scope is reasonable (default: max 2 packages)
- Prompting you for all necessary information based on your repo's PR template

**To use:**
1. Make sure you're in a git repository with changes
2. Press `Cmd+Shift+P`
3. Type "Monorepo Tools: Generate PR Summary"
4. Answer the prompts:
   - Ticket ID (auto-detected from branch name if present)
   - Ticket description
   - Fill in each section of your PR template
5. A new document will open with the formatted PR description
6. Copy and paste into your PR

### Generate Standup Update

This command creates a daily standup update with:
- Recent commits (default: last 24 hours)
- Changed files
- Package scope analysis
- Your answers to the three standup questions

**To use:**
1. Make sure you're in a git repository
2. Press `Cmd+Shift+P`
3. Type "Monorepo Tools: Generate Standup Update"
4. Answer the prompts:
   - Ticket ID (auto-detected from branch name if present)
   - Ticket description
   - What did you do since previous update?
   - What are you going to do today?
   - Any blockers or risks?
5. A new document will open with the formatted standup
6. Copy and paste into your standup tool (Slack, Geekbot, etc.)

## Configuration

Open Cursor Settings (`Cmd+,`) and search for "Monorepo Tools" to customize:

### `monorepoTools.baseBranch`
- **Type:** string
- **Default:** `"main"`
- **Description:** Default base branch for comparing changes. Falls back to "master" if "main" doesn't exist.

### `monorepoTools.maxPackageScope`
- **Type:** number
- **Default:** `2`
- **Description:** Maximum number of packages that should be modified in a single PR. If exceeded, you'll get a "⚠️ Too broad" warning.

### `monorepoTools.packagesPaths`
- **Type:** array of strings
- **Default:** `["packages/", "apps/"]`
- **Description:** Directories to scan for package changes. Customize based on your monorepo structure.
- **Examples:**
  - `["packages/", "apps/", "services/"]`
  - `["libs/", "projects/"]`

### `monorepoTools.prTemplatePath`
- **Type:** string
- **Default:** `".github/pull_request_template.md"`
- **Description:** Path to your PR template file relative to workspace root.
- **Note:** If no template is found, a default template will be used.

### `monorepoTools.standupTimeWindow`
- **Type:** string
- **Default:** `"24 hours ago"`
- **Description:** Time window for standup commits. Uses git's `--since` syntax.
- **Examples:**
  - `"24 hours ago"`
  - `"2 days ago"`
  - `"yesterday"`

## Troubleshooting

### "No workspace folder open"
- Make sure you have a folder open in Cursor (not just individual files)

### "Current workspace is not a git repository"
- The extension requires a git repository to work
- Initialize git: `git init` or open a different folder

### "Could not find base branch"
- Check your `monorepoTools.baseBranch` setting
- Make sure the branch exists: `git branch -a`

### Extension not showing up
- Try reloading Cursor: `Cmd+Shift+P` → "Developer: Reload Window"
- Check if extension is enabled: `Cmd+Shift+X` → search for "Monorepo Tools"

### Updating the Extension
1. Make changes to the source code
2. Compile: `npm run compile`
3. Package: `npm run package`
4. Reinstall: Follow installation steps again

## Tips

- **Branch naming:** Use ticket IDs in your branch names (e.g., `feature/OB-1234-add-feature`) for automatic ticket detection
- **Multiple packages:** If you consistently work on more than 2 packages, adjust `maxPackageScope` setting
- **Custom PR templates:** The extension dynamically reads your repo's PR template, including checkboxes and sections
- **Keyboard shortcuts:** You can add custom keyboard shortcuts in Cursor settings for quick access to the commands

## Development

To modify the extension:

1. Open this directory in Cursor
2. Make changes to TypeScript files in `src/`
3. Compile: `npm run compile`
4. Press `F5` to launch Extension Development Host for testing
5. Package when ready: `npm run package`
6. Reinstall the updated VSIX file

## Support

This is a personal tool. For issues or feature requests, modify the source code as needed!

