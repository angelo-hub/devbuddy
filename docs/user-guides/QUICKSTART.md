# 🚀 Quick Start Guide

## Installation (2 minutes)

1. **Open Cursor**

2. **Install Extension:**
   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type: `Extensions: Install from VSIX...`
   - Navigate to: `~/devtools/cursor-monorepo-tools/`
   - Select: `cursor-monorepo-tools-0.0.1.vsix`
   - Click "Install"

3. **Reload Window:**
   - Press `Cmd+Shift+P`
   - Type: `Developer: Reload Window`

✅ **You're ready to use the extension!**

---

## First Use: Generate a PR Summary

1. **Open a monorepo in Cursor** (any git repository)

2. **Make sure you're on a feature branch** with some changes
   - Example branch: `feature/OB-1234-add-cool-feature`

3. **Run the command:**
   - Press `Cmd+Shift+P`
   - Type: `Monorepo Tools: Generate PR Summary`
   - Hit Enter

4. **Answer the prompts:**
   - Ticket ID: (auto-filled from branch or enter manually)
   - Ticket description: `Add cool new feature`
   - Fill in each section as prompted

5. **Copy the output:**
   - A new document will open with your formatted PR summary
   - Copy all content
   - Paste into your PR description

---

## First Use: Generate a Standup Update

1. **Make sure you have commits in the last 24 hours**

2. **Run the command:**
   - Press `Cmd+Shift+P`
   - Type: `Monorepo Tools: Generate Standup`
   - Hit Enter

3. **Answer the prompts:**
   - What did you do? `Implemented new feature with tests`
   - What will you do? `Review PR feedback and deploy`
   - Any blockers? `None` (or describe if you have any)

4. **Copy the output:**
   - A new document will open with your standup
   - Copy and paste into Slack/Geekbot

---

## Configuration (Optional)

Press `Cmd+,` to open Settings, search for "monorepo tools":

### Most Common Adjustments:

**If your monorepo uses different directories:**
```json
{
  "monorepoTools.packagesPaths": ["libs/", "apps/", "packages/"]
}
```

**If your base branch is 'develop' or 'master':**
```json
{
  "monorepoTools.baseBranch": "develop"
}
```

**If you want to allow more packages per PR:**
```json
{
  "monorepoTools.maxPackageScope": 3
}
```

---

## Troubleshooting

### "No workspace folder open"
→ Open a folder in Cursor (File → Open Folder)

### "Current workspace is not a git repository"
→ Make sure you're in a git repo: `git status`

### Extension doesn't appear
→ Reload window: `Cmd+Shift+P` → "Developer: Reload Window"

### Want to see more details?
- Full documentation: [USAGE.md](USAGE.md)
- Testing guide: [TESTING.md](TESTING.md)
- Implementation details: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## Tips

💡 **Use ticket IDs in branch names** for auto-detection:
   - Good: `feature/ABC-123-description`
   - Auto-detects: `ABC-123`

💡 **The extension reads YOUR PR template** from `.github/pull_request_template.md`
   - No need to configure anything if you follow GitHub conventions

💡 **Package paths are flexible:**
   - Works with `packages/`, `apps/`, `services/`, `libs/`, etc.
   - Just configure once in settings

💡 **Add keyboard shortcuts** for quick access:
   - File → Preferences → Keyboard Shortcuts
   - Search for "Monorepo Tools"

---

## Daily Workflow

### Morning:
```
git checkout -b feature/TICKET-123-my-feature
# ... make changes ...
git commit -m "Implement feature"
```

### When opening PR:
```
Cmd+Shift+P → "Monorepo Tools: Generate PR Summary"
→ Copy output to PR
```

### For standup:
```
Cmd+Shift+P → "Monorepo Tools: Generate Standup"
→ Copy output to Slack
```

---

**That's it! You're all set to boost your monorepo productivity! 🎉**

