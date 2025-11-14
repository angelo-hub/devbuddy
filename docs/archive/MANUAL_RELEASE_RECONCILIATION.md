# Manual Release Reconciliation Guide

## Current Situation

You've manually uploaded **v0.2.0** to the VS Code Marketplace, but the automated release workflow wasn't used. This guide explains how to sync everything up so future releases can be automated.

## Current State

- ✅ **Marketplace**: [v0.2.0 published manually](https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy)
- ✅ **package.json**: `"version": "0.2.0"`
- ⚠️ **Git tags**: Shows `v0.3.0` (needs investigation)
- ❌ **GitHub Release**: No release created for v0.2.0
- ✅ **Workflow**: Already configured and ready

## Reconciliation Steps

### Option 1: Create GitHub Release for v0.2.0 (Recommended)

This aligns your git history with the marketplace and sets a baseline for future automated releases.

```bash
# 1. Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# 2. Check if v0.2.0 tag already exists
git tag --list | grep "v0.2.0"

# 3. If tag doesn't exist, create it pointing to the commit when you manually released
# Find the commit hash where version was 0.2.0
git log --oneline --all | head -20

# 4. Create the tag (replace COMMIT_HASH with actual hash from step 3)
git tag -a v0.2.0 COMMIT_HASH -m "chore(release): v0.2.0 - Manual marketplace upload"

# 5. Push the tag to GitHub
git push origin v0.2.0
```

### Option 2: Create GitHub Release from Web UI

1. Go to: https://github.com/angelogirardi/developer-buddy/releases
2. Click **"Draft a new release"**
3. Configure:
   - **Tag**: Create new tag `v0.2.0` from target: main (or the commit where 0.2.0 was)
   - **Release title**: `DevBuddy v0.2.0`
   - **Description**: 
     ```markdown
     Initial public release of DevBuddy with multi-platform support.
     
     ## Features
     - ✅ Linear integration
     - ✅ Jira Cloud integration
     - ✅ AI-powered PR summaries
     - ✅ Standup generation
     - ✅ Chat participant (@devbuddy)
     
     ## Installation
     
     Download from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy)
     ```
   - **Attach VSIX**: Upload the `dev-buddy-0.2.0.vsix` file if you have it
   - **Set as latest release**: ✅ Check this
4. Click **"Publish release"**

### Option 3: Skip v0.2.0, Move Forward with Automated Releases

If you don't want to backfill v0.2.0, you can just start using the automated workflow for the next release:

```bash
# 1. Ensure main branch is clean
git checkout main
git pull origin main

# 2. Make sure package.json is at 0.2.0
# (it already is, so you're good)

# 3. Make your next changes with conventional commits
git add .
git commit -m "feat(jira): add custom fields support"
git push origin main

# 4. Trigger automated release workflow
# Go to: https://github.com/angelogirardi/developer-buddy/actions
# Select: "Release Extension"
# Click: "Run workflow"
# Choose: "minor" (will bump to 0.3.0)
# Click: "Run workflow"
```

The workflow will:
- Bump version to 0.3.0
- Generate CHANGELOG.md
- Build and package extension
- Publish to marketplace
- Create GitHub Release
- Push git tag

## Investigating the v0.3.0 Tag

There's currently a `v0.3.0` tag in your repository. Let's understand what happened:

```bash
# Check what commit the v0.3.0 tag points to
git show v0.3.0

# Check if v0.3.0 was published to marketplace
# Visit: https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy
# Look at version history

# If v0.3.0 tag was created accidentally:
# 1. Delete it locally
git tag -d v0.3.0

# 2. Delete it remotely
git push origin --delete v0.3.0
```

**Scenarios:**
- **If v0.3.0 is published on marketplace**: You're actually at v0.3.0, update package.json to match
- **If v0.3.0 is NOT published**: Delete the tag and start from v0.2.0

## Fixing Mismatched Versions

### If Marketplace Shows v0.3.0 but package.json is 0.2.0

```bash
# Update package.json to match marketplace
npm version 0.3.0 --no-git-tag-version

# Commit the change
git add package.json
git commit -m "chore: sync version with marketplace (v0.3.0)"
git push origin main

# Ensure v0.3.0 tag exists
git tag -a v0.3.0 -m "chore(release): v0.3.0"
git push origin v0.3.0

# Create GitHub Release for v0.3.0
# (Use Option 2 above, but with v0.3.0)
```

### If package.json is 0.2.0 and That's Correct

```bash
# Delete the incorrect v0.3.0 tag
git tag -d v0.3.0
git push origin --delete v0.3.0

# Create v0.2.0 tag at current commit
git tag -a v0.2.0 -m "chore(release): v0.2.0 - Initial public release"
git push origin v0.2.0

# Create GitHub Release for v0.2.0
# (Use Option 2 above)
```

## Future Workflow (Once Reconciled)

### For Your Next Release

1. **Make Changes** with conventional commits:
   ```bash
   git commit -m "feat(jira): add custom field support"
   git commit -m "fix(linear): resolve sync issue"
   ```

2. **Merge to Main**:
   ```bash
   git push origin your-branch
   # Create PR, review, merge
   ```

3. **Trigger Release Workflow**:
   - Go to [GitHub Actions](https://github.com/angelogirardi/developer-buddy/actions)
   - Select **"Release Extension"**
   - Click **"Run workflow"**
   - Choose **"auto"** (automatically detects version bump)
   - Click **"Run workflow"**

4. **Automated Steps**:
   - ✅ Runs tests
   - ✅ Bumps version (e.g., 0.2.0 → 0.3.0)
   - ✅ Updates CHANGELOG.md
   - ✅ Builds extension
   - ✅ Publishes to VS Code Marketplace
   - ✅ Creates GitHub Release
   - ✅ Pushes git tag
   - ✅ Commits version bump to main

5. **Verify**:
   - Check [GitHub Releases](https://github.com/angelogirardi/developer-buddy/releases)
   - Check [Marketplace](https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy)
   - Download and test VSIX

## Recommended Action Plan

Based on your situation, here's what I recommend:

### Step 1: Verify Current State
```bash
# Check marketplace version
open https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy

# Check package.json version
grep '"version"' package.json

# Check git tags
git tag --list

# Check if they match
```

### Step 2: Choose Your Path

**If marketplace = 0.2.0 and package.json = 0.2.0:**
- Delete the `v0.3.0` tag (it was created by mistake)
- Create `v0.2.0` tag and GitHub Release
- Start using automated workflow for next release

**If marketplace = 0.3.0 and package.json = 0.2.0:**
- Update package.json to 0.3.0
- Keep the `v0.3.0` tag
- Create GitHub Release for v0.3.0
- Start using automated workflow for next release

### Step 3: Test the Workflow

Once reconciled, test with a patch release:

```bash
# Make a small documentation change
echo "# Test" >> docs/test.md
git add docs/test.md
git commit -m "docs: test automated release"
git push origin main

# Trigger workflow with "patch" bump
# Should bump to 0.2.1 (or 0.3.1 depending on current version)
```

## Checklist

Before your next automated release:

- [ ] Marketplace version matches package.json version
- [ ] Git tag exists for current version (e.g., `v0.2.0`)
- [ ] GitHub Release exists for current version
- [ ] CHANGELOG.md is up to date (or empty, will be auto-generated)
- [ ] `VSCE_PAT` secret is configured in GitHub
- [ ] All marketplace links use `angelogirardi.dev-buddy` (✅ Already fixed)
- [ ] Test workflow with dry-run: `npm run release:dry-run`

## Common Issues

### "No commits since last release"

**Problem**: Running "auto" release when there are no feat/fix commits since last tag.

**Solution**: 
- Add a feat/fix commit, OR
- Use manual bump type (minor/patch/major)

### "Git push rejected"

**Problem**: Branch protection or permissions.

**Solution**:
- Ensure GitHub Actions has write permissions
- Check Settings → Actions → General → Workflow permissions → "Read and write permissions"

### "VSCE_PAT invalid"

**Problem**: Personal Access Token expired or missing.

**Solution**:
1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage/publishers/angelogirardi)
2. Create new PAT with Marketplace → Manage scope
3. Update `VSCE_PAT` in GitHub Secrets

## Summary

The key is to ensure your **package.json version**, **git tags**, **GitHub Releases**, and **marketplace version** all align. Once they do, the automated workflow will handle all future releases seamlessly.

**Your manual v0.2.0 upload is perfectly fine!** Just create the corresponding git tag and GitHub Release, then use the automated workflow for all future releases.

## Questions?

If you're unsure about any step:
1. Check current marketplace version first
2. Choose the reconciliation path that matches
3. Test with a dry-run: `npm run release:dry-run`
4. Reach out if you need help!

---

**Related Docs:**
- [RELEASE_PROCESS.md](docs/developer/RELEASE_PROCESS.md) - Full automated release guide
- [CI_CD_IMPLEMENTATION_SUMMARY.md](CI_CD_IMPLEMENTATION_SUMMARY.md) - Workflow overview

