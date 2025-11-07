# Right-Click & Code Actions for TODO Converter

## Overview

The TODO to Ticket converter now supports **two convenient ways** to create tickets from TODOs:

1. **💡 Lightbulb (Code Actions)** - Automatic suggestions when cursor is on a TODO
2. **🖱️ Right-Click Menu** - Context menu option available anywhere in editor

## 1. Lightbulb Suggestions (Code Actions)

### How It Works

When your cursor is on a line with a TODO comment, a **💡 lightbulb** appears in the editor margin.

### Usage

1. **Place cursor** on a TODO line:
   ```javascript
   // TODO: Implement caching
   ```

2. **See the lightbulb** appear in the margin

3. **Click the lightbulb** or press `Cmd+.` (Quick Fix)

4. **Select**: "💡 Convert TODO to Linear Ticket"

5. **Interactive flow starts** automatically

### Supported TODO Formats

The lightbulb appears for these comment styles:
```javascript
// TODO: Single line comment
/* TODO: Block comment */
```

```python
# TODO: Python comment
```

```html
<!-- TODO: HTML comment -->
```

```ruby
# TODO: Ruby/Shell comment
```

### Keyboard Shortcut

Instead of clicking the lightbulb:
- **Mac**: `Cmd + .`
- **Windows/Linux**: `Ctrl + .`

This opens the Quick Fix menu with the TODO converter option.

## 2. Right-Click Context Menu

### How It Works

Right-click anywhere in a file to see the "Convert TODO to Ticket" option in the context menu.

### Usage

1. **Place cursor** on a TODO line (or select TODO text)

2. **Right-click** in the editor

3. **Select**: "Linear Buddy: Convert TODO to Ticket"

4. **Interactive flow starts**

### When It Appears

The context menu option is available:
- ✅ When editor has focus
- ✅ When text is selected
- ✅ Anywhere in any file type
- ✅ Even if cursor is not on a TODO

If no TODO is found, you'll get a helpful message.

## Comparison

| Feature | Lightbulb 💡 | Right-Click 🖱️ |
|---------|-------------|----------------|
| **When Available** | Only on TODO lines | Always available |
| **Keyboard Shortcut** | `Cmd + .` | N/A |
| **Discoverability** | High (visual cue) | Medium (in menu) |
| **Best For** | Quick conversion when on TODO | Converting TODOs while browsing |

## Complete Workflow Examples

### Example 1: Using Lightbulb

```javascript
// TODO: Add error handling for edge cases
function processData(data) {
  // ↑ Cursor here
  // 💡 appears
  // Press Cmd+.
  // Select "Convert TODO to Linear Ticket"
}
```

### Example 2: Using Right-Click

```typescript
// TODO: Refactor this into separate service
class UserService {
  // ↑ Right-click anywhere
  // Select "Linear Buddy: Convert TODO to Ticket"
}
```

### Example 3: With Selection

```python
def calculate_total():
    # TODO: Optimize this loop - it's O(n²)
    #       ^---select this text---^
    # Right-click or Cmd+.
    for i in items:
        for j in items:
            # ...
```

## Implementation Details

### Code Action Provider

**File**: `src/utils/todoCodeActionProvider.ts`

Provides:
- TODO detection on current line
- Lightbulb icon in editor margin
- Quick Fix suggestion
- Keyboard shortcut support

### Context Menu

**File**: `package.json`

Configuration:
```json
{
  "menus": {
    "editor/context": [
      {
        "command": "monorepoTools.convertTodoToTicket",
        "when": "editorTextFocus",
        "group": "linear@1"
      }
    ]
  }
}
```

### Activation

Both features are automatically activated when the extension loads:
- Code Action Provider: Registered for all file types
- Context Menu: Available in all editors

## Tips

### Lightbulb Best Practices

1. **Navigate to TODO** using search (`Cmd+Shift+F` for "TODO")
2. **Place cursor** on the line
3. **Wait for lightbulb** (appears immediately)
4. **Press Cmd+.** for quick access

### Context Menu Best Practices

1. **Right-click is always available** - no need to search for TODOs first
2. **Works with selections** - select any text to use as ticket title
3. **Good for browsing** - convert TODOs as you review code

### Keyboard Shortcuts

**Add a custom shortcut** for even faster access:

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S`)
2. Search for "Convert TODO to Ticket"
3. Add keybinding (e.g., `Cmd+Shift+T`)

Example `keybindings.json`:
```json
{
  "key": "cmd+shift+t",
  "command": "monorepoTools.convertTodoToTicket",
  "when": "editorTextFocus"
}
```

## Discovery Methods Comparison

| Method | Access | Speed | When to Use |
|--------|--------|-------|-------------|
| **Lightbulb** | Automatic | Fastest | When cursor is already on TODO |
| **Right-Click** | Manual | Fast | When browsing code |
| **Command Palette** | Manual | Medium | When TODO is far from cursor |
| **Custom Shortcut** | Keyboard | Fastest | Power users |

## Visual Indicators

### Lightbulb Appearance

```
  │ // TODO: Implement caching
💡│ function getData() {
  │   // ...
  │ }
```

The lightbulb appears in the left margin when:
- Cursor is on a TODO line
- TODO format is recognized
- Extension is active

### Context Menu Appearance

```
┌─ Right-Click Menu ────────────────┐
│ Cut                    Cmd+X       │
│ Copy                   Cmd+C       │
│ Paste                  Cmd+V       │
├───────────────────────────────────┤
│ Linear Buddy ►                     │
│   Convert TODO to Ticket           │ ← New!
└───────────────────────────────────┘
```

## Troubleshooting

### Lightbulb Not Appearing

**Problem**: No lightbulb shows up

**Solutions**:
- Ensure cursor is directly on TODO line
- Check TODO format is supported
- Reload window: `Cmd+Shift+P` → "Reload Window"

### Context Menu Option Missing

**Problem**: Can't find "Convert TODO to Ticket" in menu

**Solutions**:
- Check extension is activated
- Look under "Linear Buddy" submenu
- Reload window if recently installed

### Multiple Quick Fixes Available

**Problem**: Lightbulb shows many options

**Solution**:
- "Convert TODO to Linear Ticket" is marked as **preferred** (appears first)
- Look for 💡 emoji in the option name

## Performance

Both methods are:
- ⚡ **Instant** - no noticeable delay
- 🪶 **Lightweight** - minimal resource usage
- 🔄 **Always available** - registered on extension activation

## Accessibility

### Screen Readers

- Lightbulb announces as "Quick Fix available"
- Context menu item reads as "Linear Buddy: Convert TODO to Ticket"
- All prompts are accessible via keyboard

### Keyboard-Only Navigation

1. Navigate to TODO: `Cmd+G` (Go to Line)
2. Open Quick Fix: `Cmd+.`
3. Select with arrows and Enter
4. Complete flow using keyboard inputs

## Related Features

- **Command Palette**: `Cmd+Shift+P` → "Convert TODO to Ticket"
- **Custom Shortcuts**: Add your own keybinding
- **Code Search**: Find TODOs with `Cmd+Shift+F`
- **TODO Extensions**: Works alongside TODO Highlight extensions

## Next Steps

After implementing these improvements:

1. **Test lightbulb** on various TODO formats
2. **Try right-click** in different file types
3. **Add custom shortcut** if desired
4. **Share with team** to improve adoption

---

**Status**: ✅ Implemented and Ready
**Version**: Added in TODO to Ticket v1.1
**Requires**: Extension reload after installation

