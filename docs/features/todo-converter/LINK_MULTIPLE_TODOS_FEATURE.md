# Link Multiple TODOs Feature

## Overview

After converting a TODO to a Linear ticket, you can now **link additional related TODOs** across your codebase to the same ticket. This solves the common problem where you create one ticket but realize there are related TODOs elsewhere that should reference it.

## How It Works

### Step 1: Convert First TODO
```typescript
// TODO: Add caching layer for API calls
```

Right-click → **"Convert TODO to Linear Ticket"** → Ticket created (e.g., `ENG-456`)

### Step 2: Choose Action

After ticket creation, you'll see:
```
✅ Created ticket ENG-456: Add caching layer for API calls

[Replace TODO]  [Link More TODOs]  [Open Ticket]  [Copy URL]
```

### Step 3: Select "Link More TODOs"

The extension will:
1. **Automatically replace** the current TODO with ticket reference
2. **Search your workspace** for all other TODOs (up to 1000 files)
3. **Show searchable list** of all TODOs found

### Step 4: Select Related TODOs

You'll see a multi-select picker showing:
```
☐ Implement Redis caching
  src/api/users.ts:45
  // TODO: Implement Redis caching

☐ Add cache invalidation logic  
  src/api/auth.ts:123
  // TODO: Add cache invalidation logic

☐ Cache user preferences
  src/services/userService.ts:67
  // TODO: Cache user preferences
```

### Step 5: Link Selected TODOs

Select the related TODOs (can select multiple) and press Enter.

All selected TODOs will be replaced with:
```typescript
// ENG-456: Track at https://linear.app/team/issue/ENG-456
```

Success message:
```
✅ Linked 3 additional TODOs to ENG-456
```

## Use Cases

### 1. **Technical Debt Across Files**

You find one TODO about refactoring, realize there are related refactoring TODOs elsewhere:

```typescript
// Before:
// File A: // TODO: Refactor auth logic
// File B: // TODO: Refactor user permissions  
// File C: // TODO: Refactor role checking

// After linking to ENG-789:
// File A: // ENG-789: Track at https://linear.app/...
// File B: // ENG-789: Track at https://linear.app/...
// File C: // ENG-789: Track at https://linear.app/...
```

All tracked under one ticket!

### 2. **Feature Implementation Across Components**

```typescript
// TODO: Add loading states
// (Found in Button.tsx, Modal.tsx, Form.tsx, etc.)

// Link them all to ENG-456: "Add loading states to all components"
```

### 3. **Bug Fixes with Multiple Locations**

```typescript
// TODO: Fix memory leak in WebSocket
// (Found in connection.ts, handler.ts, cleanup.ts)

// Link to ENG-234: "Fix WebSocket memory leak"
```

### 4. **Performance Optimizations**

```typescript
// TODO: Optimize rendering
// (Found in multiple components)

// Link to ENG-567: "Performance optimization sprint"
```

## Features

### ✅ **Workspace-Wide Search**
- Searches all code files (TypeScript, JavaScript, Python, Go, Rust, etc.)
- Excludes `node_modules` and other common ignore patterns
- Finds TODOs in comments of any style (`//`, `#`, `/* */`, `<!-- -->`)

### ✅ **Smart Preview**
- Shows first 60 characters of TODO text
- Displays file path and line number
- Shows full context line in detail view

### ✅ **Multi-Select**
- Select as many TODOs as you want
- Use space to toggle selection
- Use arrows to navigate

### ✅ **Safe Replacement**
- Preserves indentation
- Respects comment style (doesn't mix `//` with `#`)
- Only replaces selected TODOs
- Opens files in background for review

### ✅ **Performance Optimized**
- Limits search to 1000 files max
- Skips binary and ignored files
- Async processing for responsiveness

## Button Options Explained

After creating a ticket, you have 4 choices:

| Button | Action |
|--------|--------|
| **Replace TODO** | Replace only the current TODO with ticket reference |
| **Link More TODOs** | Replace current TODO + search for more to link |
| **Open Ticket** | Open the ticket in Linear (or VS Code panel) |
| **Copy URL** | Copy ticket URL to clipboard |

## Technical Details

### Search Pattern

Matches various TODO styles:
```javascript
// TODO: Something
// TODO Something  
/* TODO: Something */
# TODO: Something (Python, Shell, YAML)
<!-- TODO: Something --> (HTML, Markdown)
; TODO: Something (Assembly, Lisp)
```

### Supported File Types

Searches in:
- TypeScript/JavaScript: `.ts`, `.tsx`, `.js`, `.jsx`
- Python: `.py`
- Go: `.go`
- Rust: `.rs`
- Java: `.java`
- C/C++: `.c`, `.cpp`
- C#: `.cs`
- PHP: `.php`
- Ruby: `.rb`
- Swift: `.swift`
- Kotlin: `.kt`
- Scala: `.scala`
- Shell: `.sh`
- YAML: `.yml`, `.yaml`

### Exclusions

Automatically excludes:
- `node_modules/`
- `.git/`
- Binary files
- Other standard ignore patterns

## Example Workflow

**Scenario:** You're refactoring authentication and find multiple related TODOs

1. **Find first TODO:**
   ```typescript
   // src/auth/login.ts
   // TODO: Move JWT logic to separate service
   ```

2. **Convert to ticket:**
   - Right-click → "Convert TODO to Linear Ticket"
   - Title: "Refactor authentication to separate service"
   - Create as `ENG-890`

3. **Link related TODOs:**
   - Click "Link More TODOs"
   - Extension finds:
     ```
     ☐ Extract token validation     [src/auth/middleware.ts:56]
     ☐ Move refresh token logic     [src/auth/refresh.ts:23]
     ☐ Centralize JWT configuration [src/config/jwt.ts:12]
     ```
   - Select all 3
   - Press Enter

4. **Result:**
   All 4 TODOs (original + 3 selected) now reference `ENG-890`:
   ```typescript
   // ENG-890: Track at https://linear.app/team/issue/ENG-890
   ```

5. **In Linear:**
   The ticket has the full permalink and context from the first TODO, and now you know there are 4 locations to update.

## Benefits

### 🎯 **Single Source of Truth**
Instead of scattered TODOs, you have one ticket tracking all related work.

### 📍 **Better Tracking**
Know exactly how many places need changes when you pick up the ticket.

### 🔍 **Discovery**
Often reminds you of related TODOs you'd forgotten about.

### ⚡ **Saves Time**
No need to manually search for and update related TODOs.

### 📊 **Better Planning**
When sizing tickets, you know the full scope (4 TODOs = more work than 1).

## Limitations

- **Search limit:** Max 1000 files (performance optimization)
- **Pattern matching:** May miss unusually formatted TODOs
- **No undo:** Once TODOs are replaced, use git to revert if needed
- **No filtering:** Shows all TODOs in workspace (can be a lot)

## Future Enhancements

Potential improvements:
- **Smart filtering:** Suggest related TODOs using AI
- **Bulk operations:** "Link all TODOs matching this pattern"
- **TODO → Ticket mapping:** Show which TODOs are already linked
- **Batch creation:** Create tickets for multiple TODOs at once
- **Search refinement:** Filter by file, folder, or keyword

---

**Status:** ✅ Implemented and ready for testing
**Added:** November 2025

