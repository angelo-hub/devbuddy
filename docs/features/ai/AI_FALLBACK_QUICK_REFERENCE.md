# Quick Reference: AI Fallback for Sensitive Organizations

## TL;DR

Your extension now **automatically works without AI** using intelligent rule-based analysis. Perfect for sensitive organizations that can't use external AI services.

## Quick Setup (For Sensitive Orgs)

Add to VS Code settings:
```json
{
  "linearBuddy.ai.disabled": true
}
```

That's it! All features work the same, but use local rule-based analysis instead of external AI.

## What This Means

### Before (AI-Only)
- ❌ Requires GitHub Copilot
- ❌ Sends code to external AI services  
- ❌ Doesn't work in air-gapped environments
- ❌ May violate security policies

### After (Hybrid with Fallback)
- ✅ Works with or without AI
- ✅ Automatic fallback to rule-based analysis
- ✅ No external dependencies required
- ✅ Privacy-friendly for sensitive code
- ✅ Works in any environment

## How It Works

```
User runs command
       ↓
┌─────────────────┐
│ AI Available?   │
└─────────────────┘
    ↙         ↘
  YES         NO
   ↓           ↓
AI Model    Rule-Based
(Copilot)   (Local)
   ↓           ↓
Result      Result
```

## Rule-Based Features

Without AI, the extension intelligently analyzes:

1. **Commit Message Patterns**
   - Detects `feat:`, `fix:`, `refactor:`, etc.
   - Understands conventional commits
   - Groups by type

2. **File Analysis**
   - Extracts package/module names
   - Categories file types (TS, tests, docs, etc.)
   - Counts changes per area

3. **Smart Suggestions**
   - Suggests adding tests if missing
   - Recommends documentation updates
   - Detects WIP and blockers

## Example Outputs

### PR Summary (Rule-Based)
```
- ✨ Added 3 new features
- 🐛 Fixed 2 bugs
- 🧪 Added 4 tests
- 📁 Modified 12 files (TypeScript, Tests)
```

### Standup (Rule-Based)
```
Worked on ENG-123. I implemented new features, 
fixed bugs and added tests across auth, api, 
user-management. Made 8 commits.
```

## Configuration Matrix

| Setting | Value | Result |
|---------|-------|--------|
| `ai.disabled` | `false` (default) | Try AI, fall back if unavailable |
| `ai.disabled` | `true` | Always use rule-based |
| `ai.model` | `"auto"` | Pick best AI model available |
| `ai.model` | `"copilot:gpt-4o"` | Use specific model |

## Recommendations by Organization

### Standard: Use AI with Automatic Fallback
```json
{
  "linearBuddy.ai.disabled": false,
  "linearBuddy.ai.model": "auto"
}
```

### Regulated/Sensitive: Force Rule-Based Only
```json
{
  "linearBuddy.ai.disabled": true
}
```

### Hybrid: Try AI, but gracefully degrade
```json
{
  "linearBuddy.ai.disabled": false,
  "linearBuddy.ai.model": "auto"
}
```
(This is the **default** - no config needed!)

## User Impact

### For Normal Users
- **Zero impact** - features work exactly the same
- If AI unavailable, graceful fallback
- No errors or broken features

### For Sensitive Organizations
- Can explicitly disable AI
- All features still work
- 100% local processing
- No data sent externally

## Implementation Details

### New Files
- `src/utils/fallbackSummarizer.ts` - Rule-based analysis engine

### Updated Files
- `src/utils/aiSummarizer.ts` - Now uses fallback when AI unavailable

### New Settings
- `linearBuddy.ai.disabled` - Force disable AI

## Privacy Benefits

### AI Mode (Default)
- Uses GitHub Copilot
- Subject to GitHub's terms
- Requires subscription

### Rule-Based Mode
- ✅ 100% local processing
- ✅ Zero external API calls
- ✅ Works completely offline
- ✅ GDPR/HIPAA compliant
- ✅ No subscription needed

## Testing

To test rule-based mode:

1. Open Settings (⌘,)
2. Search for "linearBuddy.ai.disabled"
3. Enable it
4. Run any summarization command
5. See rule-based output

## Support

- Full docs: [AI_FALLBACK_STRATEGY.md](./AI_FALLBACK_STRATEGY.md)
- AI features guide: [AI_FEATURES_GUIDE.md](./AI_FEATURES_GUIDE.md)
- Main README: [README.md](./README.md)

## Key Takeaway

**Your extension now works everywhere, for everyone, regardless of AI availability.** 

Sensitive organizations can disable AI completely while still getting intelligent, useful summaries from rule-based analysis.

