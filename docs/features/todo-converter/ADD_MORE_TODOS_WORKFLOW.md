# Add More TODOs Workflow

## The Problem You Identified

When working on code, you often realize:
> "I need to add TODOs in 3 different places for this same issue"

But you haven't written them yet - they're just in your head!

**Old workflow was clunky:**
1. Write first TODO, convert to ticket
2. Navigate to other files
3. Manually write TODOs with ticket reference
4. Copy/paste the ticket ID/URL each time
5. Hope you don't make typos

**New workflow is streamlined!** ✨

## How It Works

### Step 1: Convert First TODO

```typescript
// src/auth/login.ts
// TODO: Add rate limiting
```

Right-click → **"Convert TODO to Linear Ticket"**

Creates ticket: `ENG-456: Add rate limiting`

### Step 2: Choose "Add More TODOs"

After ticket creation:
```
✅ Created ticket ENG-456: Add rate limiting

[Replace TODO]  [Add More TODOs]  [Link Existing TODOs]  [Open Ticket]
```

Click **"Add More TODOs"**

### Step 3: Guided Workflow

The extension shows a modal:
```
📋 Ticket reference copied to clipboard!

Workflow:
1. Navigate to where you need another TODO
2. Paste the comment (Cmd/Ctrl+V)
3. Click "Ready" when done, or "Add Another" to continue

[Add Another Location]  [Open File...]  [Done]
```

**Clipboard now contains:**
```typescript
// ENG-456: Track at https://linear.app/team/issue/ENG-456
```

### Step 4: Navigate & Paste

**Option A: Use Quick Open**
- Click "Open File..."
- Type filename: `middleware`
- Opens `src/auth/middleware.ts`
- Navigate to line you need
- Paste (Cmd/Ctrl+V)

**Option B: Manual Navigation**
- Use sidebar / file tree
- Open the file
- Navigate to the spot
- Paste (Cmd/Ctrl+V)

**Option C: Search**
- Click "Search Files..."
- Search for related code
- Jump to location
- Paste

### Step 5: Continue or Finish

After pasting, click:
- **"Add Another"** - Keeps workflow open, refreshes clipboard
- **"Open File..."** - Opens Quick Open, then continues
- **"Search Files..."** - Opens search, then continues  
- **"Done"** - Finishes workflow

## Real-World Example

You're refactoring authentication and realize you need to add TODOs in 4 places:

### 1. **First TODO (Convert to Ticket)**
```typescript
// src/auth/login.ts:45
// TODO: Move JWT logic to auth service
```

Convert → Creates `ENG-789: Refactor auth to separate service`

### 2. **Add More TODOs**

Click "Add More TODOs"

**Navigate to:** `src/auth/middleware.ts`
```typescript
// src/auth/middleware.ts:67
// ENG-789: Track at https://linear.app/...  ← PASTE
```

Click "Add Another"

**Navigate to:** `src/auth/token.ts`
```typescript
// src/auth/token.ts:23
// ENG-789: Track at https://linear.app/...  ← PASTE
```

Click "Add Another"

**Navigate to:** `src/config/jwt.ts`
```typescript
// src/config/jwt.ts:12
// ENG-789: Track at https://linear.app/...  ← PASTE
```

Click "Done"

### Result: 4 TODOs, 1 Ticket

All locations now reference the same ticket:
- `src/auth/login.ts:45` → `// ENG-789: Track at ...`
- `src/auth/middleware.ts:67` → `// ENG-789: Track at ...`
- `src/auth/token.ts:23` → `// ENG-789: Track at ...`
- `src/config/jwt.ts:12` → `// ENG-789: Track at ...`

## Features

### ✅ **Clipboard Magic**
Ticket reference is automatically copied - just paste!

### ✅ **Quick Navigation**
Built-in shortcuts to:
- Quick Open (Cmd/Ctrl+P)
- Search Files (Cmd/Ctrl+Shift+F)
- Manual navigation

### ✅ **Persistent Workflow**
Stays open until you click "Done" - add as many as you need

### ✅ **No Typos**
Always pastes the exact ticket reference - no manual typing

### ✅ **Fast**
Much faster than manually copying ticket IDs

## Button Comparison

After creating a ticket, you now have 4 options:

| Button | Use When |
|--------|----------|
| **Replace TODO** | Only this one TODO, nothing else |
| **Add More TODOs** | ⭐ You know other spots that need TODOs (haven't written them yet) |
| **Link Existing TODOs** | You already wrote TODOs elsewhere, want to link them |
| **Open Ticket** | View the ticket in Linear |

## Use Cases

### 1. **Planning Phase**
```
You: "This refactor touches 5 files"
     *Writes first TODO*
     *Converts to ticket*
     *Navigates to other 4 files*
     *Pastes ticket reference in each*
```

### 2. **Code Review TODOs**
```
Reviewer: "Please add TODOs for X, Y, and Z"
You: *Creates ticket from first TODO*
     *Quickly adds ticket references in other spots*
```

### 3. **Bug Fixes**
```
Bug affects 3 components
*Creates ticket from first occurrence*
*Adds ticket reference to other 2 components*
```

### 4. **Feature Implementation**
```
Feature needs updates in:
- Component
- API handler  
- Tests
- Docs

*Creates ticket*
*Pastes ticket reference in all 4 places*
```

## Tips

### 💡 **Tip 1: Use Quick Open**
After clicking "Add Another", press `Cmd/Ctrl+P` and type filename - fastest way to navigate

### 💡 **Tip 2: Use Go to Line**
`Cmd/Ctrl+G` to jump to specific line numbers

### 💡 **Tip 3: Use Breadcrumbs**
`Cmd/Ctrl+Shift+.` to see function/class hierarchy

### 💡 **Tip 4: Search for Context**
Use "Search Files..." to find where you need to add TODOs by searching for related code

### 💡 **Tip 5: Keep it Open**
Don't click "Done" until you've added all TODOs - the workflow stays active

## Workflow Comparison

### Old Way (Manual)
```
1. Create ticket manually in Linear
2. Copy ticket ID
3. Open file 1
4. Type: // TODO: ENG-456: Track at... (paste URL)
5. Open file 2
6. Type: // TODO: ENG-456: Track at... (paste URL)
7. Open file 3
8. Type: // TODO: ENG-456: Track at... (paste URL)

Time: ~3-5 minutes
Errors: High (typos, wrong IDs, missing URLs)
```

### New Way (Guided)
```
1. Convert TODO to ticket (automatic)
2. Click "Add More TODOs"
3. Navigate to file 1 → Paste
4. Navigate to file 2 → Paste
5. Navigate to file 3 → Paste
6. Click "Done"

Time: ~30 seconds
Errors: None (clipboard has exact reference)
```

**10x faster, zero errors!** ⚡

## Technical Details

### What Gets Copied
```typescript
// ENG-456: Track at https://linear.app/team/issue/ENG-456
```

Includes:
- Comment syntax (`//` - you can change to `#`, `/* */`, etc. after pasting)
- Ticket ID (`ENG-456`)
- Full URL to ticket

### VS Code Commands Used
- `workbench.action.quickOpen` - Quick file picker
- `workbench.action.findInFiles` - Global search

### Clipboard Refresh
Every time you click "Add Another", the clipboard is refreshed to ensure the reference is always available

## Why This Matters

### 🎯 **Matches Mental Model**
When you're working, you think: "This needs TODOs in 3 places"

Now you can immediately act on that thought without breaking flow.

### ⚡ **Speed**
Navigate → Paste → Done. Repeat. No manual copying/typing.

### 🎨 **Quality**
Consistent ticket references across all locations. No typos, no missed URLs.

### 📍 **Completeness**
Easy to add TODOs everywhere you need them, increasing the chance you remember all locations.

## Future Enhancements

Potential improvements:
- **Smart Location Suggestions**: "You opened login.ts, do you want a TODO here?"
- **Multi-cursor Support**: Add TODOs to multiple lines at once
- **Template Comments**: Custom TODO formats with placeholders
- **Auto-save**: Save files after pasting TODOs

---

**Status:** ✅ Implemented and ready for testing  
**Addresses:** The "I haven't written the other TODOs yet" workflow  
**Added:** November 2025

