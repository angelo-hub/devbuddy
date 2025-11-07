# AI Prompt Engineering Improvements

## Summary

This document outlines the improvements made to the AI prompt engineering and git diff formatting for better AI-generated summaries.

## Changes Made

### 1. Enhanced Git Diff Formatting (`gitAnalyzer.ts`)

**Previous Implementation:**
- Used `--stat` flag which only showed file-level statistics
- Basic line truncation without context preservation
- Limited to 2000 characters for diffs

**Improvements:**
```typescript
async getFileDiffs(baseBranch: string, maxLines: number = 200): Promise<string>
```

- ✅ **Removed `--stat`** - Now gets actual unified diffs with code changes
- ✅ **Added `--no-color`** - Removes ANSI color codes for cleaner parsing
- ✅ **Added `--no-prefix`** - Removes `a/` and `b/` prefixes for cleaner paths
- ✅ **Smart truncation** - Preserves complete hunks instead of cutting mid-context
- ✅ **Better context** - Uses `--unified=3` for optimal AI understanding

**Impact:** AI now sees actual code changes instead of just file names and line counts, leading to more accurate and detailed summaries.

---

### 2. Structured PR Summary Prompts (`aiSummarizer.ts`)

**Previous Implementation:**
- Simple bullet list of commits
- First 30 files listed
- Basic prompt structure
- 2000 character limit for diffs

**Improvements:**

#### Commit Categorization
Added `categorizeCommits()` method that groups commits by type:
- ✨ Features/Additions
- 🐛 Bug Fixes
- ♻️ Refactors
- 🧪 Tests
- 📝 Documentation
- Other

#### File Categorization
Added `categorizeFilesByPath()` method that organizes files by:
- Package/app structure (`packages/`, `apps/`)
- Source directories (`src/`)
- Top 10 most affected areas

#### Enhanced Prompt Structure
```
# Context
- Ticket information
- Additional context

# Commit History (N total)
- Categorized by type
- Better organization

# Files Modified (N total)
- Grouped by package/directory
- Shows file counts per area

## Code Changes:
```diff
[Actual diff content - up to 3000 chars]
```

# Instructions
- Clear output requirements
- Format examples
- What to focus on

# Example Output Format
- ✨ Implemented user authentication...
- 🐛 Fixed memory leak...
```

**Key Improvements:**
- 📊 **Structured sections** with markdown headers
- 🎯 **Categorized commits** for better context
- 📁 **Organized files** by package/directory
- 💬 **Clear instructions** with examples
- 📈 **Increased limit** to 3000 chars for diffs
- 🎨 **Output format examples** guide AI behavior

---

### 3. Improved Standup Summary Prompts

**Previous Implementation:**
- Simple commit list with branches
- Basic file count
- 1500 character diff limit

**Improvements:**

#### Structured Prompt
```
# Work Completed
- Categorized commits by type
- Clear organization

# Scope
- Files modified count
- Commit count
- Context information

## Recent Code Changes:
```diff
[Actual diff content]
```

# Instructions
- First person narration
- Focus on outcomes
- Under 100 words
- Team-ready format

# Example Output
I implemented user authentication...
```

**Key Improvements:**
- 👤 **First person focus** - Clear instructions for "I" statements
- 🎯 **Outcome-oriented** - Focus on impact, not tasks
- 📝 **Example output** - Shows desired format
- 🔍 **Better context** - Categorized work completed

---

### 4. Helper Methods Added

#### `categorizeCommits(commits)`
Analyzes commit messages and categorizes them by:
- Conventional commit prefixes (`feat:`, `fix:`, etc.)
- Keywords (implement, bug, refactor, test, document)
- Falls back to "other" category

#### `formatCategorizedCommits(categories)`
Formats categorized commits with:
- Clear section headers
- Emoji/formatting for visual clarity
- Counts for large categories
- Organized bullet lists

#### `categorizeFilesByPath(files)`
Groups files by directory structure:
- Detects `src/`, `packages/`, `apps/` patterns
- Extracts meaningful package names
- Creates organized Map of categories

#### `formatCategorizedFiles(categories)`
Formats file categories with:
- Top 10 most affected areas
- File counts per category
- Sample files (first 5) with "and N more" indicators
- Clear visual hierarchy

---

## Benefits

### For AI Model Understanding
1. **Better Context** - Actual code changes vs. just file names
2. **Structured Data** - Categorized information is easier to process
3. **Clear Instructions** - AI knows exactly what format to produce
4. **Examples** - Output examples guide behavior

### For Generated Output Quality
1. **More Accurate** - AI sees the actual code changes
2. **Better Organized** - Categorization helps identify themes
3. **More Relevant** - Focus on "what" and "why" vs. "how"
4. **Consistent Format** - Examples ensure predictable output

### For User Experience
1. **Higher Quality Summaries** - More useful and actionable
2. **Better Context** - Organized by package/feature area
3. **Easier to Edit** - Structured output is easier to refine
4. **Time Savings** - Less manual editing needed

---

## Technical Details

### Diff Format Improvements
```typescript
// Before
const diffResult = await this.git.diff([
  baseBranch,
  "HEAD",
  "--unified=3",
  "--stat",  // ❌ Only shows stats
  "--",
]);

// After
const diffResult = await this.git.diff([
  baseBranch,
  "HEAD",
  "--unified=3",      // ✅ 3 lines of context
  "--no-color",       // ✅ Clean output
  "--no-prefix",      // ✅ Cleaner paths
  "--",
]);
```

### Truncation Improvements
```typescript
// Before
const limitedDiff = lines.slice(0, maxLines).join("\n");

// After
let truncatedLines = lines.slice(0, maxLines);

// Find last complete hunk to avoid cutting mid-context
for (let i = truncatedLines.length - 1; i >= 0; i--) {
  if (
    truncatedLines[i].startsWith("diff --git") ||
    truncatedLines[i].startsWith("@@")
  ) {
    truncatedLines = truncatedLines.slice(0, i);
    break;
  }
}
```

### Prompt Structure Best Practices
1. **Use markdown headers** (`#`, `##`) for clear sections
2. **Provide examples** of desired output format
3. **Give specific instructions** on tone, length, and style
4. **Categorize information** before feeding to AI
5. **Use code blocks** (```diff) for proper formatting
6. **Increase context limits** for better understanding
7. **Add metadata** (counts, categories) for context

---

## Testing

All changes have been:
- ✅ Compiled successfully with TypeScript
- ✅ Linted with no errors
- ✅ Webview build successful
- ✅ Type-safe with proper TypeScript types

---

## Future Enhancements

Potential improvements for future iterations:

1. **Commit Metadata**
   - Add author, date, files changed count
   - Group by author for multi-person PRs
   
2. **Semantic Analysis**
   - Detect breaking changes
   - Identify security concerns
   - Highlight performance impacts

3. **Custom Templates**
   - User-defined categorization rules
   - Custom prompt templates
   - Organization-specific formats

4. **Diff Intelligence**
   - Prioritize important files
   - Detect test coverage
   - Show impact scope

5. **Token Optimization**
   - Smart truncation based on importance
   - Compress repetitive changes
   - Focus on key changes

---

## Related Files

- `src/utils/gitAnalyzer.ts` - Git diff generation
- `src/utils/aiSummarizer.ts` - AI prompt building
- `src/commands/generatePRSummary.ts` - PR summary command
- `src/commands/generateStandup.ts` - Standup command
- `src/chat/linearBuddyParticipant.ts` - Chat integration

---

## References

- [Git diff documentation](https://git-scm.com/docs/git-diff)
- [Unified diff format](https://en.wikipedia.org/wiki/Diff#Unified_format)
- [Prompt engineering best practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Date:** November 7, 2025  
**Version:** 0.1.0

