# AI-Powered Summarization - Feature Guide

## Overview

The extension now uses **Cursor's AI agents** to automatically analyze your code changes and generate intelligent summaries for:
- 🤖 **Standup updates** - Automatically summarizes what you did based on commits
- 📝 **PR descriptions** - Generates professional PR summaries from your changes
- 🎯 **Next steps** - Suggests what you should work on next
- ⚠️ **Blocker detection** - Identifies potential issues from commit messages

## How It Works

The extension integrates with VS Code's Language Model API (used by Cursor/Copilot) to:
1. Analyze your commits and file changes
2. Generate natural language summaries
3. Pre-fill forms with AI-generated content
4. Let you review and edit before finalizing

### No Manual Prompts Needed!

Instead of manually typing answers, the AI:
- Reads your commit messages
- Analyzes changed files
- Understands the context
- Generates professional summaries automatically

## Standup Updates (Fully Automated)

### Before (Manual)
```
1. What did you do? [type manually]
2. What will you do? [type manually]
3. Any blockers? [type manually]
```

### After (AI-Powered)
```
✨ AI analyzing commits...
✨ Suggesting next steps...
✨ Detecting blockers...

Generated summary:
"Implemented authentication fixes in the auth package, 
added comprehensive test coverage, and addressed code 
review feedback for the payment flow"

[Edit if needed or press Enter to accept]
```

### Example Workflow

1. **Run command:** `Monorepo Tools: Generate Standup Update`
2. **Choose mode:** Single or multiple tickets
3. **AI generates:** Summaries based on your commits
4. **You review:** Edit the AI-generated content if needed
5. **Done!** Copy to Slack/Geekbot

### What AI Generates

**"What did you do?"**
- Analyzes commit messages from last 24 hours
- Summarizes work across all branches
- Groups by ticket if multiple tickets
- Written in first person ("I worked on...")
- 1-2 concise sentences

**"What will you do?"**
- Looks at current progress
- Suggests logical next steps
- Based on incomplete work or patterns
- Forward-looking and actionable

**"Blockers?"**
- Scans commit messages for keywords like "WIP", "TODO", "FIXME", "blocked"
- Identifies potential issues
- Returns "None detected" if everything looks normal

## PR Summaries (AI-Enhanced)

### How It Works

1. **Run command:** `Monorepo Tools: Generate PR Summary`
2. **Enter ticket info:** ID and description
3. **AI generates summary:** While you wait
4. **Review sections:** AI pre-fills the "Summary of Changes" section
5. **Edit if needed:** Refine the AI-generated content
6. **Done!** Complete PR description ready

### What AI Generates

The AI creates 2-4 bullet points that explain:
- **What changed:** Key modifications made
- **Why it changed:** Purpose and context
- **Impact:** What this affects
- **Maintainability:** How it improves the codebase

### Example Output

```markdown
## Summary of Changes

- Refactored authentication flow to use JWT tokens instead of session cookies,
  improving scalability and enabling stateless authentication
- Added comprehensive test coverage for token validation, refresh, and 
  expiration scenarios
- Updated API documentation to reflect new auth endpoints and error responses
- Implemented proper error handling for edge cases including expired tokens
  and invalid signatures
```

## Configuration

### Enable/Disable AI

```json
{
  "monorepoTools.enableAISummarization": true  // Set to false to disable AI
}
```

### What Happens When Disabled

- Extension falls back to manual input (original behavior)
- Shows message: "AI summarization not available"
- All prompts work as before without AI

## Requirements

### For AI to Work

✅ **Cursor Editor** - Running in Cursor (which has built-in AI models)
✅ **Copilot** - OR VS Code with GitHub Copilot enabled  
✅ **No API Key** - Uses Cursor's built-in AI, no setup needed

### Fallback Behavior

If AI is not available:
- Extension automatically detects this
- Shows informational message
- Falls back to manual input
- Everything still works, just no AI assist

## Privacy & Security

### What Gets Sent to AI

- Your commit messages
- List of changed file paths
- Ticket IDs and descriptions you enter
- NO actual code content
- NO file contents
- NO sensitive data

### Where It Goes

- Uses Cursor's built-in AI models (same as Cmd+K)
- Stays within your Cursor environment
- Same privacy policy as using Cursor AI normally
- No third-party services

## Tips for Better AI Summaries

### Write Good Commit Messages

**Good:**
```
feat: Add JWT authentication
fix: Handle token expiration edge case  
test: Add coverage for auth flow
```

**Bad:**
```
stuff
wip
fix
changes
```

### Be Specific in Prompts

When asked for ticket description:
- **Good:** "Add JWT authentication to replace session cookies"
- **Bad:** "auth stuff"

### Review AI Output

- AI is smart but not perfect
- Always review generated content
- Edit for accuracy and tone
- Add context AI might miss

## Comparison: Manual vs AI

| Aspect | Manual | AI-Powered |
|--------|--------|------------|
| Time to complete | 2-3 minutes | 30 seconds |
| Accuracy | Depends on memory | Analyzes all commits |
| Consistency | Varies by day | Always professional |
| Multiple tickets | Tedious to track | Automatic grouping |
| Missed details | Easy to forget | Comprehensive |
| Writing quality | Varies | Consistently good |

## Troubleshooting

### "AI summarization not available"

**Cause:** Language Model API not accessible

**Solutions:**
1. Make sure you're running in Cursor (not regular VS Code)
2. Check if Cursor AI features work (try Cmd+K)
3. Restart Cursor
4. Fall back to manual input (still works)

### AI generates incorrect summaries

**Solutions:**
1. Edit the generated content - that's why it's pre-filled, not auto-submitted
2. Improve your commit messages for future use
3. Add more context when prompted for ticket description

### AI summaries are too verbose/brief

**Solutions:**
1. Edit to your preferred length
2. The AI learns general patterns, but you control final output
3. Consistent commit message style helps AI learn your preferences

### Slow AI generation

**Causes:**
- Large number of commits
- Many changed files
- AI model busy

**Solutions:**
- Wait for progress indicator
- Process usually takes 5-10 seconds
- Extension shows progress: "Analyzing commits..."

## Examples

### Single Ticket Standup

**Input:**
- Commits: 5 commits on `feature/OB-123-auth-fix`
- Time: Last 24 hours

**AI Generated:**
```
What did you do?
Fixed critical authentication bug affecting token refresh, added test 
coverage for edge cases, and addressed PR review feedback.

What will you do?
Complete final testing and prepare for deployment to staging.

Blockers?
None detected
```

### Multiple Tickets Standup

**Input:**
- Commits: 8 commits across 3 branches
- Tickets: OB-123, OB-456, OB-789

**AI Generated:**
```
What did you do?
Worked on authentication fixes (OB-123), added payment flow tests 
(OB-456), and addressed code review comments (OB-789). Completed 
bug fixes and enhanced test coverage across multiple packages.

What will you do?
Deploy authentication fix, continue payment feature development, and 
finalize remaining review feedback.

Blockers?
None detected
```

### PR Summary

**Input:**
- 12 commits
- 24 files changed
- Ticket: OB-123 "JWT Authentication"

**AI Generated:**
```
- Migrated authentication system from session-based to JWT tokens, 
  improving scalability and enabling stateless architecture
- Implemented token generation, validation, refresh, and expiration 
  handling with proper error messages
- Added comprehensive test suite covering token lifecycle, edge cases,
  and security scenarios
- Updated API endpoints and documentation to reflect new auth flow
```

## Future Enhancements

Potential future features:
- Custom AI prompts/templates
- Learning from your edit patterns
- Team-specific summary styles
- Integration with Linear/Jira for ticket context
- Sentiment analysis for blocker detection
- Code complexity analysis

---

**Version:** 0.0.1+ai
**Status:** ✅ Ready to use
**Package:** cursor-monorepo-tools-0.0.1.vsix (135 KB)
**AI Model:** Uses Cursor's built-in AI (GPT-4 class)

