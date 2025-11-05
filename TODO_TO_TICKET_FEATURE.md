# TODO to Ticket Converter (Beta)

## Overview

A beta feature that converts TODO comments in your code into Linear tickets through an interactive guided flow. Perfect for capturing technical debt and quick tasks without leaving your editor.

## How It Works

The feature detects TODO comments in your code and guides you through creating a Linear ticket with:
- **Automatic TODO extraction** from selection or current line
- **Interactive prompts** for ticket details
- **Team selection** with smart defaults
- **Optional priority** setting
- **Automatic TODO replacement** with ticket reference

## Usage

### Basic Flow

1. **Place cursor on a TODO comment** or select TODO text
2. **Run command**: `Cmd+Shift+P` → "Linear Buddy: Convert TODO to Ticket"
3. **Follow the prompts**:
   - Confirm/edit ticket title
   - Add description (optional, includes file location)
   - Select team (defaults to first team or saved preference)
   - Choose priority (optional)
4. **Ticket created!** Choose next action:
   - Replace TODO with ticket reference
   - Open ticket in Linear Buddy
   - Copy ticket URL

### Example

**Before:**
```javascript
// TODO: Implement caching for API responses
async function fetchData() {
  // ...
}
```

**After (with replacement):**
```javascript
// ENG-123: Track at https://linear.app/company/issue/ENG-123
async function fetchData() {
  // ...
}
```

## Supported TODO Formats

The feature automatically detects various TODO comment styles:

### JavaScript/TypeScript
```javascript
// TODO: Fix this bug
/* TODO: Refactor this code */
```

### Python
```python
# TODO: Add error handling
```

### HTML
```html
<!-- TODO: Update styling -->
```

### Ruby/Shell
```ruby
# TODO: Optimize query
```

### Other Languages
Any line containing `TODO:` or `TODO` followed by text will be detected.

## Interactive Steps

### 1. Ticket Title
- **Pre-filled** with TODO text
- **Editable** to add more context
- **Required** - cannot be empty

### 2. Description
- **Pre-filled** with:
  - File location (e.g., `Found in: src/utils/api.ts:42`)
  - Original TODO context
- **Optional** - press Escape to skip
- **Editable** - add more details

### 3. Team Selection
- **Shows all teams** from your Linear workspace
- **Auto-selects** if only one team exists
- **Remembers your choice**:
  - Prompts to save as default
  - Saves to: `monorepoTools.linearDefaultTeamId`
  - Uses saved team automatically next time

### 4. Priority (Optional)
- **No Priority** - Default (0)
- **🔴 Urgent** - Highest priority (1)
- **🟠 High** - High priority (2)
- **🔵 Medium** - Medium priority (3)
- **⚪ Low** - Low priority (4)
- Press **Escape to skip**

### 5. Post-Creation Actions
- **Replace TODO** - Replaces with ticket reference
- **Open Ticket** - Opens in Linear Buddy webview
- **Copy URL** - Copies ticket URL to clipboard

## Features

### Smart TODO Detection
- **Selection-based**: Select any text to use as TODO
- **Line-based**: Place cursor on TODO line
- **Nearby search**: Checks 2 lines above/below cursor
- **Format-agnostic**: Works with any comment style

### Intelligent Defaults
- **Team memory**: Remembers your preferred team
- **Context preservation**: Includes file location in description
- **Clean title**: Removes usernames, dates, brackets from TODO text

### TODO Replacement
When you choose "Replace TODO":
- Maintains original indentation
- Uses same comment style as original
- Adds ticket ID and URL
- Example formats:
  ```javascript
  // ENG-123: Track at https://linear.app/...
  /* ENG-123: Track at https://linear.app/... */
  # ENG-123: Track at https://linear.app/...
  ```

## Configuration

### Default Team
After first use, you'll be asked to save your team preference:
```json
{
  "monorepoTools.linearDefaultTeamId": "team_abc123"
}
```

This team will be auto-selected on future TODO conversions.

### Change Default Team
To change your default team:
1. Open Settings (`Cmd+,`)
2. Search for "Linear Default Team"
3. Clear the value
4. Next TODO conversion will ask again

## Keyboard Shortcuts

You can add a custom keyboard shortcut:

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S`)
2. Search for "Convert TODO to Ticket"
3. Add your preferred keybinding

Example keybinding.json:
```json
{
  "key": "cmd+shift+t",
  "command": "monorepoTools.convertTodoToTicket",
  "when": "editorTextFocus"
}
```

## Tips & Best Practices

### Writing Good TODOs
```javascript
// ✅ Good - specific and actionable
// TODO: Add rate limiting to prevent API abuse

// ❌ Bad - too vague
// TODO: fix this
```

### When to Use
- **Quick tasks** that don't warrant a full ticket discussion
- **Technical debt** discovered during development
- **Bugs** found that need tracking
- **Refactoring** opportunities

### When NOT to Use
- **Large features** requiring planning - create ticket in Linear directly
- **Urgent bugs** - fix immediately instead of tracking
- **Discussions needed** - create ticket with team for context

## Workflow Integration

### During Code Review
1. Reviewer adds TODO comment
2. Author converts TODO to ticket
3. Links ticket in PR description

### During Development
1. Spot improvement opportunity
2. Add TODO comment inline
3. Convert to ticket immediately
4. Continue working, address later

### Cleanup Sessions
1. Search for all TODOs: `Cmd+Shift+F` → Search "TODO"
2. Convert old TODOs to tickets
3. Clean up codebase

## Limitations

### Beta Feature Notes
- **Linear API required**: Must have configured API token
- **No bulk conversion**: One TODO at a time
- **Manual detection**: Must cursor-select or be on TODO line
- **Simple replacement**: Doesn't preserve multi-line TODOs

### Known Issues
- Multi-line TODOs only use first line
- Very long TODOs might be truncated in title
- Complex comment formats may not be preserved

## Troubleshooting

### "No TODO found"
**Problem**: Cursor not on TODO line or format not recognized

**Solutions**:
- Place cursor directly on TODO line
- Select the TODO text manually
- Check TODO format matches supported styles

### "Linear API not configured"
**Problem**: No Linear API token set

**Solutions**:
1. Run "Linear Buddy: Update Linear API Key"
2. Get token from [Linear Settings](https://linear.app/settings/api)
3. Enter token when prompted

### "No teams found"
**Problem**: Linear workspace has no teams

**Solutions**:
- Check you have access to teams in Linear
- Verify API token has correct permissions
- Contact Linear admin

### Replacement not working
**Problem**: TODO not replaced with ticket reference

**Solutions**:
- Check file is not read-only
- Ensure file is saved
- Try manual replacement using ticket URL from clipboard

## Examples

### JavaScript/TypeScript
```typescript
// TODO: Add input validation
function processUser(data: any) {
  // ...
}
```
→ Creates ticket: "Add input validation"
→ Description: "Found in: src/users.ts:42\n\n// TODO: Add input validation"

### Python
```python
# TODO: Optimize database query with indexes
def get_users():
    # ...
```
→ Creates ticket: "Optimize database query with indexes"

### React Component
```jsx
{/* TODO: Add loading state */}
<button onClick={handleSubmit}>Submit</button>
```
→ Creates ticket: "Add loading state"

## Future Enhancements

Planned improvements:
- [ ] Bulk TODO conversion
- [ ] Auto-assign to TODO author
- [ ] Label detection from TODO tags
- [ ] Multi-line TODO support
- [ ] Integration with VS Code TODO extension
- [ ] Automatic TODO scanning on file save

## Feedback

This is a **beta feature**! Please report issues or suggestions:
- Use the Linear Buddy chat participant: `@linear`
- File issues in your team's feedback channel
- Share workflow improvements with the team

## Related Features

- **Linear Buddy Panel** - View and manage all tickets
- **Standup Builder** - Include TODO-created tickets in standups
- **PR Summary** - Reference TODO tickets in PR descriptions
- **Branch Creator** - Create branches for TODO tickets

