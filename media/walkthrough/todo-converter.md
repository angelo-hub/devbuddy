# Convert TODOs to Tickets with Permalinks

Transform TODO comments into fully-tracked Linear tickets with automatic GitHub/GitLab/Bitbucket permalinks to the exact line of code.

---

## Demo Video

![TODO Converter Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/todo-converter-demo.gif)

**Shows:** Converting a TODO → ticket creation → "Add More TODOs" workflow

---

## How It Works

### Step 1: Write a TODO Comment

```typescript
// TODO: Add rate limiting for failed login attempts
```

### Step 2: Convert to Ticket

**Two ways:**

#### Method 1: Right-Click
1. Place cursor on TODO line (or select it)
2. Right-click → **"Convert TODO to Linear Ticket"**

#### Method 2: Code Action (Lightbulb)
1. Cursor on TODO line
2. Press `Cmd/Ctrl + .`
3. Select **"Convert TODO to Linear Ticket"**

---

## Quick Demo: Basic Conversion

![Basic Conversion Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/basic-conversion.gif)

**Shows:** Right-click → convert → ticket created (15 seconds)

---

### Step 3: Review Auto-Generated Description

DevBuddy creates a ticket with:

```markdown
**Location:** `src/auth/login.ts:145`
**View in code:** [GitHub](https://github.com/org/repo/blob/abc1234/src/auth/login.ts#L145)
**Branch:** `feature/auth-improvements`
**Commit:** `abc1234`

**Code context:**

```typescript
140  async function handleLogin(credentials) {
141    // Validate credentials
142    if (!credentials.email || !credentials.password) {
143      throw new Error('Invalid credentials');
144    }
145    // TODO: Add rate limiting for failed login attempts
146    return await authenticateUser(credentials);
147  }
```
```

**Automatic permalinks** to GitHub, GitLab, or Bitbucket.

---

## Demo: Permalink in Ticket

![Permalink Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/permalink-in-linear.gif)

**Shows:** Opening Linear ticket → clicking permalink → jumps to code

---

### Step 4: Choose Your Next Action

After ticket creation, you'll see:

```
✅ Created ticket ENG-456: Add rate limiting

[Replace TODO]  [Add More TODOs]  [Link Existing TODOs]  [Open Ticket]
```

**Choose based on your needs:**

---

## Option 1: Replace TODO

Just replace this one TODO with ticket reference:

```typescript
// Before:
// TODO: Add rate limiting for failed login attempts

// After:
// ENG-456: Track at https://linear.app/team/issue/ENG-456
```

Simple one-and-done!

---

## Option 2: Add More TODOs (KEY FEATURE)

![Add More TODOs Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/add-more-todos.gif)

**Workflow:**
1. Click "Add More TODOs"
2. Ticket reference copied to clipboard notification
3. Quick Open (Cmd+P) → type filename → navigate
4. Paste ticket reference
5. Click "Add Another" → navigate to next file
6. Paste again
7. Click "Done"

**Use when:** You know other spots need TODOs (but haven't written them yet)

**Workflow:**
1. Click **"Add More TODOs"**
2. Ticket reference auto-copied: `// ENG-456: Track at https://...`
3. Navigate to next location (Quick Open, search, or manual)
4. Paste (`Cmd/Ctrl + V`)
5. Click "Add Another" to continue, or "Done" when finished

**Perfect for:**
- "This bug affects 3 components"
- "Need to refactor in multiple files"
- Planning phase: "I know I need TODOs in 5 places"

---

## Option 3: Link Existing TODOs

![Link Existing TODOs Demo](https://raw.githubusercontent.com/angelo-hub/devbuddy/main/media/walkthrough/videos/link-existing-todos.gif)

**Workflow:**
1. Click "Link Existing TODOs"
2. Search results appear showing all TODOs in workspace
3. Multi-select checkboxes for related TODOs
4. Click confirm
5. Success message: "Linked 3 additional TODOs"

**Use when:** You already wrote TODOs elsewhere that should reference this ticket

**Workflow:**
1. Click **"Link Existing TODOs"**
2. Extension searches workspace for all TODOs
3. Multi-select related TODOs from searchable list
4. All selected TODOs replaced with ticket reference

**Perfect for:**
- "I already have related TODOs in other files"
- Bulk-linking scattered TODOs to one ticket
- Cleaning up technical debt

---

## 🎬 Side-by-Side Comparison

> **[PLACEHOLDER: Insert Split-Screen Video]**  
> **File:** `media/walkthrough/videos/workflow-comparison.gif`  
> **Left side:** Old way (manual ticket creation, copy-paste IDs)  
> **Right side:** New way (one-click, auto-permalink, guided workflow)  
> **Duration:** 45-60 seconds

---

## Supported TODO Formats

Linear Buddy recognizes various comment styles:

```typescript
// TODO: Description          (JavaScript, TypeScript, C++, Go, Rust)
/* TODO: Description */       (C-style block comments)
# TODO: Description           (Python, Shell, YAML, Ruby)
<!-- TODO: Description -->    (HTML, Markdown, XML)
; TODO: Description           (Lisp, Assembly)
```

**Also detects:**
- `FIXME:` - Bug fixes
- `HACK:` - Quick fixes needing refactor
- `XXX:` - Important warnings
- `BUG:` - Known bugs
- `NOTE:` - Important notes

---

## What Makes This Special?

### 🔗 **Permanent Links**
Click the permalink in Linear → Jump directly to exact line of code, even if:
- Line numbers change
- Code gets refactored
- Branch gets deleted

Uses commit SHA for stability!

### 📍 **Full Context**
- File path and line number
- 5 lines of code before/after
- Branch and commit info
- Syntax highlighting in Linear

### ⚡ **Multiple TODO Workflows**
- **One TODO** → Replace only
- **Add more** → Navigate & paste in other spots
- **Already have TODOs** → Bulk link existing ones

### 🎯 **Zero Context Loss**
When someone picks up the ticket 3 weeks later:
- Click link → Immediately at the right code
- No hunting through files
- No "where was this again?"

---

## 🎬 Real-World Example

> **[PLACEHOLDER: Insert Complete Workflow Video]**  
> **File:** `media/walkthrough/videos/real-world-example.mp4`  
> **Duration:** 1-2 minutes  
> **Scenario:** Developer finds auth bug affecting 4 files  
> **Shows:**
> 1. Write first TODO in login.ts
> 2. Convert to ticket (ENG-789 created)
> 3. Click "Add More TODOs"
> 4. Navigate to middleware.ts → Paste
> 5. Navigate to token.ts → Paste
> 6. Navigate to config/jwt.ts → Paste
> 7. Click "Done"
> 8. Open Linear ticket → Click permalink → Jumps to code
> 
> **Result:** 4 TODOs across 4 files, all linked, done in 45 seconds!

---

## Pro Tips 💡

### Tip 1: Use Quick Open
After clicking "Add More TODOs":
- Press `Cmd/Ctrl + P`
- Type filename
- Fastest way to navigate!

### Tip 2: Search for Related Code
Click "Search Files..." to find where you need TODOs by searching for:
- Function names
- Related comments
- Similar patterns

### Tip 3: Keep Workflow Open
Don't click "Done" until you've added all TODOs - the workflow stays active and clipboard keeps refreshing.

### Tip 4: Review in Linear
The ticket has full code context, so anyone can understand what needs to be done without asking questions.

### Tip 5: Write Good TODOs
Knowing your TODOs become tickets with permalinks, write them with context:

```typescript
// TODO: Add rate limiting (currently allows unlimited login attempts)
// vs
// TODO: Rate limiting
```

---

## Why This Matters

### For You
- ⚡ **10x faster** than manual ticket creation
- 🎯 **Zero typos** in ticket IDs or URLs
- 🧠 **Mental model match** - add TODOs as you think of them

### For Your Team
- 📍 **No context loss** - click link → right place in code
- 🔄 **Better async work** - no Slack messages asking "where?"
- 📊 **Better planning** - see all locations affected by one ticket

### For Your Codebase
- 🧹 **Cleaner** - TODOs become tracked work
- 📈 **Trackable** - Know which TODOs are tickets
- 🎯 **Actionable** - Every TODO links to a ticket

---

## Supported Git Providers

✅ **GitHub** - `github.com/org/repo/blob/sha/file.ts#L145`  
✅ **GitLab** - `gitlab.com/org/repo/-/blob/sha/file.ts#L145`  
✅ **Bitbucket** - `bitbucket.org/org/repo/src/sha/file.ts#lines-145`  

Works with both cloud and self-hosted instances!

---

## Try It Now!

1. Open any file with a TODO
2. Right-click the TODO
3. Select **"Convert TODO to Linear Ticket"**
4. Watch the magic happen! ✨

---

## 🎬 Full Feature Demo

> **[PLACEHOLDER: Insert Complete Feature Video]**  
> **File:** `media/walkthrough/videos/complete-todo-features.mp4`  
> **Duration:** 2-3 minutes  
> **Covers:**
> - Basic TODO conversion with permalink
> - "Add More TODOs" workflow (navigate & paste)
> - "Link Existing TODOs" bulk linking
> - Opening ticket in Linear and clicking permalink
> - Side-by-side: 4 files all referencing one ticket
> 
> **Voiceover script provided in:** `media/walkthrough/videos/voiceover-script.md`

---

**Ready to eliminate context switching and never lose track of TODOs again?** 🚀

[Try Converting a TODO Now](command:linearBuddy.convertTodoToTicket)
