# Target Branch Feature - Quick Guide

## What's New

The standup generator now **asks for a target branch** before generating the summary, giving you more control over what commits and files to compare against.

## Why This Matters

### Scenario: Long-Running Feature Branch

**Before:**
- You're working on `feature/epic-123-redesign` (branched from `main` 2 weeks ago)
- Standup always compares against `main`
- Shows 2 weeks of changes (not just today's work)
- Too much noise in the diff

**After:**
- Extension asks: "Target branch for comparison?"
- You enter: `feature/epic-123-redesign`
- Shows only changes since that feature branch
- Clean, focused diff for your standup

## How It Works

### Workflow

1. **Run command:** `Monorepo Tools: Generate Standup Update`

2. **Choose target branch:**
   ```
   Target branch for comparison (leave empty for default)
   → [main]  ← pre-filled with main/master
   ```

3. **Options:**
   - **Press Enter** → Uses `main` (or `master`)
   - **Type branch name** → `develop`, `feature/parent-branch`, etc.
   - **Leave empty** → Falls back to default

4. **Result:** Commits and files compared against your chosen branch

### Examples

**Example 1: Default (main)**
```
Target branch: [press Enter]
→ Compares against: main
```

**Example 2: Feature branch**
```
Target branch: feature/epic-123-parent
→ Compares against: feature/epic-123-parent
→ Output shows: "Comparing against: feature/epic-123-parent"
```

**Example 3: Develop**
```
Target branch: develop
→ Compares against: develop
→ Useful for teams that use develop as main branch
```

## Output Format

When using a non-default branch, the standup shows:

```markdown
**Daily Standup Update**
==================================================

**Comparing against:** feature/epic-123-parent

**Tickets worked on:**
- **OB-456** – Add payment UI components

...

**Changed files (feature/epic-123-parent...HEAD):**
- packages/ui/src/PaymentForm.tsx
- packages/ui/src/PaymentButton.tsx
```

## Use Cases

### 1. Long-Running Feature Branches
**Scenario:** Working on a feature that's been going for weeks

**Solution:**
- Compare against the feature branch base
- Only see your recent work
- Clean standup without old commits

### 2. Develop-Based Workflows
**Scenario:** Your team uses `develop` instead of `main`

**Solution:**
- Type `develop` as target branch
- Or set config: `"monorepoTools.baseBranch": "develop"`

### 3. Hotfix Branches
**Scenario:** Working on a hotfix branched from `release`

**Solution:**
- Compare against `release` branch
- See only hotfix changes

### 4. Parallel Feature Work
**Scenario:** You have multiple feature branches

**Solution:**
- Choose the parent feature branch
- See work specific to your sub-feature

## Configuration

### Default Branch

The extension auto-detects `main` or `master` as the default.

To change the default:
```json
{
  "monorepoTools.baseBranch": "develop"
}
```

### How Default Detection Works

1. Checks config: `monorepoTools.baseBranch`
2. If branch exists → uses it
3. Otherwise tries: `main`
4. Otherwise tries: `master`
5. Throws error if none found

## Tips

### Quick Workflow
- For most standups: Just press **Enter** (uses default)
- For feature branches: Type the parent branch name

### Branch Naming
Any valid git branch name works:
- `main`, `master`, `develop`
- `feature/epic-123-parent`
- `release/v2.0`
- `hotfix/critical-bug`

### Team Conventions
If your team always uses `develop`:
1. Set config once: `"monorepoTools.baseBranch": "develop"`
2. Press Enter every time
3. No manual typing needed

## Technical Details

### What Changes

**Before:**
```typescript
const gitContext = await gitAnalyzer.getGitContext();
allChangedFiles = gitContext.changedFiles;
```

**After:**
```typescript
const comparisonBranch = targetBranch?.trim() || baseBranch;
allChangedFiles = await gitAnalyzer.getChangedFiles(comparisonBranch);
```

### Diff Command

The extension runs:
```bash
git diff --name-only <comparisonBranch>...HEAD
```

Where `<comparisonBranch>` is your chosen target.

### Commit Window

**Note:** Commits are still filtered by time window (default: 24 hours)

**Example:**
- Target branch: `feature/parent`
- Time window: `24 hours ago`
- Result: Commits in last 24 hours, compared files against `feature/parent`

## Comparison

### Single vs Multiple Tickets

| Mode | Target Branch Support |
|------|----------------------|
| Single ticket | ✅ Yes - compares files against target |
| Multiple tickets | ✅ Yes - compares files against target |

Both modes now ask for target branch first.

### PR Summary

**Note:** PR summaries still use default base branch logic.

**Reason:** PRs typically merge to `main`/`develop`, so target branch less relevant.

**Future:** May add target branch support to PR summaries if needed.

## Troubleshooting

### Branch not found

**Error:** `fatal: ambiguous argument 'feature/xyz': unknown revision`

**Cause:** Branch name typo or branch doesn't exist

**Solution:**
1. Check branch exists: `git branch -a`
2. Verify spelling
3. Use full branch name if remote: `origin/feature/xyz`

### No files shown

**Scenario:** "Changed files (feature/parent...HEAD): (no changed files)"

**Possible causes:**
1. Your branch IS the target branch (no diff)
2. All changes already merged to target
3. Working on wrong branch

**Solution:** Check current branch: `git branch --show-current`

### Old commits showing

**Scenario:** Seeing commits from weeks ago

**Cause:** Comparing against old branch point

**Solution:** 
- Check target branch is recent
- Or adjust time window: `"standupTimeWindow": "48 hours ago"`

## Backward Compatibility

✅ **Fully backward compatible:**
- Default behavior unchanged (uses main/master)
- Just adds one extra prompt
- Press Enter to skip (use default)
- No config changes required

## Future Enhancements

Potential improvements:
- Remember last used target branch
- Quick branch selection dropdown
- Branch history/favorites
- Team-wide default branch configuration

---

**Version:** 0.0.1+target-branch
**Status:** ✅ Implemented
**Package:** cursor-monorepo-tools-0.0.1.vsix (150 KB)
**Backward Compatible:** Yes

