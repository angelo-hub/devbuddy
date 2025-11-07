# New AI Features - Configuration & Enhancements

## What's New

Three major improvements to the AI-powered features:

1. **✨ First-Time Setup Wizard** - Interactive configuration on first use
2. **🎨 Tone Selection** - Choose writing style (Casual, Professional, Technical, Concise)
3. **🤖 Configurable AI Model** - Select GPT-4, GPT-3.5, or Claude
4. **📝 Git Diff Analysis** - AI now sees actual code changes, not just file names

---

## 1. First-Time Setup Wizard

### What It Does

On first installation, the extension shows a friendly setup wizard to configure your preferences.

### Setup Flow

```
👋 Welcome to Cursor Monorepo Tools! Would you like to configure your preferences?
  → [Yes, configure] [Skip for now]

Step 1: Choose your preferred writing tone
  → Professional (recommended)
  → Casual
  → Technical  
  → Concise

Step 2: Choose AI model
  → GPT-4 (most capable, recommended)
  → GPT-3.5 Turbo (faster)

Step 3: Package paths (optional)
  → Use defaults: packages/, apps/
  → Customize: libs/, services/, ...

Step 4: Base branch
  → main (default)
  → master, develop, etc.

✅ Setup Complete!
```

### Skip Setup

- Can skip and use defaults
- Can reconfigure anytime in Settings

---

## 2. Tone Selection

### Available Tones

**Professional** (Default)
- Clear, informative writing
- Suitable for most teams
- Focus on readability and maintainability
- Example: "Refactored authentication flow to improve scalability and security"

**Casual**
- Friendly, conversational  
- Use contractions and natural language
- Relaxed but clear
- Example: "Cleaned up the auth code, made it way more scalable"

**Technical**
- Precise, implementation-focused
- Uses technical terminology accurately
- Detailed architectural decisions
- Example: "Migrated from session-based auth to JWT tokens with RS256 signing"

**Concise**
- Extremely brief
- Minimal words, maximum clarity
- No fluff
- Example: "JWT auth migration, RS256 signing"

### How It Affects Output

**PR Summary (Professional):**
```
- Refactored authentication flow to use JWT tokens, improving scalability
- Added comprehensive test coverage for token validation scenarios
- Updated API documentation to reflect new auth endpoints
```

**PR Summary (Casual):**
```
- Switched auth to JWT tokens - way more scalable now
- Added a bunch of tests to make sure tokens work properly
- Updated the docs so everyone knows about the new endpoints
```

**PR Summary (Technical):**
```
- Migrated authentication from stateful sessions to stateless JWT tokens with RS256 signing
- Implemented token lifecycle management: generation, validation, refresh, expiration
- Extended OpenAPI specification with new /auth/** endpoints and error schemas
```

**PR Summary (Concise):**
```
- JWT auth migration (stateless, RS256)
- Token lifecycle: gen, validate, refresh, expire
- New /auth/** endpoints
```

### Configure Tone

**Via Settings:**
```json
{
  "monorepoTools.writingTone": "technical"  // or casual, professional, concise
}
```

**Via UI:**
1. `Cmd+,` → Search "writing tone"
2. Select dropdown
3. Choose tone

---

## 3. Configurable AI Model

### Available Models

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| **GPT-4** | Slower | Best | PR summaries, detailed analysis |
| **GPT-3.5 Turbo** | Faster | Good | Quick standups, simple summaries |
| **Claude-3** | Medium | Excellent | Alternative to GPT-4 |

### How to Configure

**Via Settings:**
```json
{
  "monorepoTools.aiModel": "gpt-4"  // or gpt-3.5-turbo, claude-3
}
```

**Via Setup Wizard:**
- Shown on first use
- Can reconfigure anytime

### Model Selection Logic

1. Tries your configured model
2. Falls back to any available model
3. Falls back to manual input if none available

### When to Use Each

**GPT-4:**
- Complex PR summaries
- Multiple tickets/branches
- Detailed technical analysis
- When quality > speed

**GPT-3.5 Turbo:**
- Quick daily standups
- Simple single-ticket work
- When speed > quality

**Claude-3:**
- Alternative to GPT-4
- Good at technical writing
- May have better availability

---

## 4. Git Diff Analysis

### What Changed

**Before:** AI only saw:
- Commit messages
- File names that changed
- Number of files

**After:** AI now also sees:
- Actual line-by-line diffs
- Code changes (additions/deletions)
- Context around changes

### How It Works

```typescript
// Extension fetches git diff
const fileDiffs = await gitAnalyzer.getFileDiffs(comparisonBranch, 200);

// Passes to AI
await aiSummarizer.summarizeCommitsForStandup({
  commits: allCommits,
  changedFiles: allChangedFiles,
  fileDiffs: fileDiffs,  // ← NEW!
  ticketId: ticketId,
  context: description
});
```

### What AI Sees

```
Commits:
- feat: Add payment form component
- test: Add validation tests

Changed files:
- src/PaymentForm.tsx
- src/PaymentForm.test.tsx

Code Changes (sample):
+++ src/PaymentForm.tsx
+export function PaymentForm() {
+  const [amount, setAmount] = useState(0);
+  const [cardNumber, setCardNumber] = useState('');
+  
+  function handleSubmit() {
+    // Validate and process payment
+  }
+  
+  return <form>...</form>
+}

+++ src/PaymentForm.test.tsx
+test('validates card number', () => {
+  expect(validateCard('1234')).toBe(false);
+});
... (truncated for length)
```

### Benefits

**Better Understanding:**
- AI sees WHAT changed, not just WHERE
- More accurate summaries
- Better context for suggestions

**Example Improvement:**

**Before (file names only):**
"Updated payment form and added tests"

**After (with diffs):**
"Implemented payment form validation with card number verification and amount validation, added comprehensive test coverage for edge cases"

### Limitations

**Diff Size:** Limited to 200 lines (standup) or 2000 characters (PR)
**Reason:** Prevent overwhelming AI with too much context
**Truncation:** Shows "... (truncated)" if exceeded

---

## Configuration Summary

### All New Settings

```json
{
  // Writing style for AI summaries
  "monorepoTools.writingTone": "professional",  // casual, technical, concise
  
  // AI model selection
  "monorepoTools.aiModel": "gpt-4",  // gpt-3.5-turbo, claude-3
  
  // First-time setup tracking (auto-managed)
  "monorepoTools.firstTimeSetupComplete": false
}
```

### Access Settings

1. **Command Palette:** `Cmd+Shift+P` → "Preferences: Open Settings (UI)"
2. **Search:** "monorepo tools"
3. **Edit:** Change any setting
4. **Apply:** Restart extension or reload window

---

## Examples

### Scenario 1: Quick Standup (Concise Tone)

**Configuration:**
```json
{
  "monorepoTools.writingTone": "concise",
  "monorepoTools.aiModel": "gpt-3.5-turbo"
}
```

**Output:**
```
What did you do?
Fixed auth bug, added tests

What will you do?
Deploy fix, monitor prod

Blockers?
None
```

### Scenario 2: Detailed PR (Technical Tone)

**Configuration:**
```json
{
  "monorepoTools.writingTone": "technical",
  "monorepoTools.aiModel": "gpt-4"
}
```

**Output:**
```
- Migrated authentication system from stateful HTTP sessions to stateless JWT 
  tokens with RS256 asymmetric signing algorithm
- Implemented complete token lifecycle management including generation with 
  configurable expiration, validation with signature verification, refresh 
  token rotation, and graceful expiration handling
- Extended test suite with 47 new unit tests covering token lifecycle, 
  edge cases (expired tokens, invalid signatures, malformed payloads), and 
  security scenarios
```

### Scenario 3: Team Standup (Casual Tone)

**Configuration:**
```json
{
  "monorepoTools.writingTone": "casual",
  "monorepoTools.aiModel": "gpt-4"
}
```

**Output:**
```
What did you do?
Spent the day fixing that annoying auth bug and making sure it's actually 
covered by tests this time. Also cleaned up some code that was bugging me.

What will you do?
Gonna deploy the fix and keep an eye on prod to make sure nothing breaks

Blockers?
None, should be smooth sailing
```

---

## Reconfiguring

### Change Tone Anytime

Settings → Search "writing tone" → Select new tone

### Change Model Anytime

Settings → Search "ai model" → Select new model

### Reset First-Time Setup

```json
{
  "monorepoTools.firstTimeSetupComplete": false
}
```

Then reload extension to see setup wizard again.

---

## Performance Impact

### Model Speed Comparison

| Model | Standup Time | PR Summary Time |
|-------|--------------|-----------------|
| GPT-4 | 5-8 seconds | 8-12 seconds |
| GPT-3.5 | 2-4 seconds | 4-6 seconds |
| Claude-3 | 4-7 seconds | 7-10 seconds |

### Git Diff Impact

**Additional Time:** +1-2 seconds to fetch diffs
**Worth It:** Much better AI understanding
**Optimization:** Diffs truncated to prevent slowdown

---

## Troubleshooting

### Setup wizard not showing

- Check: `monorepoTools.firstTimeSetupComplete` in settings
- Set to `false` to re-trigger
- Reload window

### AI model not available

- Extension falls back automatically
- Check Cursor AI features work (`Cmd+K`)
- Verify Copilot enabled

### Tone not reflected in output

- Settings may not be loaded
- Try: Reload window (`Cmd+Shift+P` → "Reload Window")
- Verify setting: `monorepoTools.writingTone`

### Diffs not helping

- May be too truncated
- Check: Only 200 lines shown
- Consider: Simpler commit messages

---

**Version:** 0.0.1+config
**Package:** cursor-monorepo-tools-0.0.1.vsix (156 KB)
**New Settings:** 3 (tone, model, setup)
**New Feature:** Git diff analysis
**Status:** ✅ Ready!

