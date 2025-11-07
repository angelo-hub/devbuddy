# Quick Reference: Help & Tutorial Access

## User Paths to Help

### 1. **First-Time Installation**
```
Install VSIX → First-Time Setup → "Setup Complete!" prompt
                                    ↓
                      "Yes, show me around" button
                                    ↓
                         Interactive Walkthrough
```

### 2. **Help Button in Sidebar**
```
Linear Buddy Sidebar → Click $(question) icon → Help Menu
                                                    ↓
                         ┌──────────────────────────┴─────────────────────────┐
                         ↓                  ↓                 ↓                ↓
                  Walkthrough       Documentation    Keyboard Shortcuts     FAQ
```

### 3. **Command Palette**
```
Cmd/Ctrl+Shift+P → Type "Linear Buddy: Show Help" → Same Help Menu as above
```

### 4. **Chat Interface**
```
@linear help → AI provides contextual assistance
```

## Walkthrough Structure

**11 Interactive Steps:**

1. 👋 **Welcome** - Feature overview
2. 🔑 **API Setup** - Connect Linear workspace  
3. 📋 **Sidebar** - Explore ticket management
4. 🌿 **Branches** - Smart branch creation
5. ✅ **Status** - Update workflows
6. ➕ **Create** - New ticket creation
7. 💡 **TODO** - Code to ticket conversion
8. 📊 **Standup** - AI standup generation
9. 📝 **PR Summary** - AI PR descriptions
10. 💬 **Chat** - AI assistant usage
11. ❓ **Help** - Settings & support

## Help Menu Options

When clicking the help button, users see:

```
┌─────────────────────────────────────────────┐
│  How can we help you?                       │
├─────────────────────────────────────────────┤
│  $(book) Getting Started Tutorial           │
│  Interactive walkthrough of all features    │
├─────────────────────────────────────────────┤
│  $(file-text) View Documentation            │
│  Open the complete guide                    │
├─────────────────────────────────────────────┤
│  $(gear) Configuration Guide                │
│  Learn about all settings and customization │
├─────────────────────────────────────────────┤
│  $(keyboard) Keyboard Shortcuts             │
│  See all available commands                 │
├─────────────────────────────────────────────┤
│  $(question) Frequently Asked Questions     │
│  Common questions and troubleshooting       │
└─────────────────────────────────────────────┘
```

## FAQ Topics

1. **How do I get a Linear API key?**
2. **Why aren't my tickets showing up?**
3. **Can I use multiple Linear workspaces?**
4. **How do I customize branch naming?**
5. **Is my API key secure?**
6. **Can I change the AI model?**
7. **How do I report bugs/features?**

## Keyboard Shortcuts Shown

### Command Palette Commands
- Generate PR Summary
- Generate Standup  
- Create New Ticket
- Convert TODO to Ticket

### Chat Commands
- `@linear /tickets`
- `@linear /standup`
- `@linear /pr`
- `@linear /status`

## Settings Accessible

Users can access settings from help menu:
- AI Model selection
- Writing tone
- Branch naming conventions
- Package paths
- Auto-refresh intervals
- Team filters
- Desktop app preference

## Testing Checklist

- [ ] Help button visible in sidebar
- [ ] Walkthrough opens from help menu
- [ ] All 11 steps load correctly
- [ ] Markdown files display properly
- [ ] Settings links work
- [ ] Command links execute
- [ ] FAQ answers display in modals
- [ ] First-time setup offers walkthrough
- [ ] No compilation errors
- [ ] No linting errors

## User Benefits

✅ **Discoverable** - Help always one click away
✅ **Non-intrusive** - Optional walkthrough
✅ **Comprehensive** - All features documented
✅ **Safe** - No real data modification
✅ **Interactive** - VS Code native experience
✅ **Always available** - Can revisit anytime

