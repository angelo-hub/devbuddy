# Beta Channel Guide

This guide explains how to manage and publish beta/pre-release versions of DevBuddy, including releases from experimental branches.

## Overview

DevBuddy supports VS Code's built-in pre-release system, allowing users to opt-in to beta versions directly from the marketplace. Pre-release versions are published alongside stable versions and are clearly marked as such.

### Key Features

- **Release from any branch** - No need to merge to main first
- **Multiple pre-release types** - alpha, beta, rc
- **Branch-aware versioning** - Experimental branches include branch identifier
- **Skip marketplace option** - GitHub-only releases for internal testing

## Pre-release Types

We support three types of pre-release versions:

| Type | Use Case | Stability |
|------|----------|-----------|
| **alpha** | Early development, experimental features | May be unstable |
| **beta** | Feature-complete but needs testing | Relatively stable |
| **rc** | Release candidate, final testing | Should be stable |

## Releasing from Experimental Branches

### Quick Start

1. Create your experimental branch:
   ```bash
   git checkout -b experimental/my-feature
   git push origin experimental/my-feature
   ```

2. Go to **Actions** → **"Publish Beta (Pre-release)"**

3. Configure the release:
   - **Branch to release from**: `experimental/my-feature`
   - **Pre-release type**: `alpha` (recommended for experimental)
   - **Increment patch**: `yes` (for subsequent releases)
   - **Skip marketplace**: `yes` (optional - for internal testing only)

4. Click **"Run workflow"**

### Version Format

**From main branch:**
```
0.10.0  (even minor = pre-release)
0.11.0  (odd minor = stable)
```

**From experimental branches:**
```
0.8.3-alpha.1+myfeature
0.8.3-alpha.2+myfeature
```

The `+branchid` suffix identifies which branch the release came from.

### CI Support

CI automatically runs on these branch patterns:
- `main`, `develop`
- `experimental/**`, `experiment/**`, `exp/**`
- `feature/**`, `feat/**`

Example branch names that trigger CI:
```bash
experimental/new-feature
experiment/refactor
exp/bugfix
feature/cool-thing
feat/widget
```

## Workflow Options

### Branch Selection

Choose any branch that exists in the repository:
- `main` - Standard pre-releases with even/odd versioning
- `experimental/*` - Feature branches with branch identifier in version
- Any other branch name

### Pre-release Type

- **alpha** - Recommended for experimental branches (highly experimental)
- **beta** - For staging/testing branches (mostly stable)  
- **rc** - For release candidates (should be stable)

### Skip Marketplace

When enabled:
- ✅ Builds and packages the extension
- ✅ Creates GitHub pre-release with VSIX download
- ❌ Does NOT publish to VS Code Marketplace

**Use cases:**
- Internal team testing
- Stakeholder demos
- Testing before public pre-release

## Publishing Beta Versions

### Option 1: GitHub Actions (Recommended)

1. Go to **Actions** tab in GitHub
2. Select **"Publish Beta (Pre-release)"** workflow
3. Click **"Run workflow"**
4. Choose options:
   - **Branch**: The branch to release from
   - **Beta Type**: alpha, beta, or rc
   - **Increment Patch**: yes/no
   - **Skip Marketplace**: yes/no
5. Click **"Run workflow"**

The workflow will:
- Checkout the specified branch
- Build and test the extension
- Determine the next pre-release version
- Publish to VS Code Marketplace (unless skipped)
- Create a GitHub pre-release with VSIX
- Tag the version in git
- Push version bump back to the branch

### Option 2: Manual with Script

Use the beta release script locally:

```bash
# Increment current beta version (e.g., 0.5.0-beta.1 → 0.5.0-beta.2)
npm run beta

# Create first beta for next minor version (e.g., 0.5.0 → 0.6.0-beta.1)
npm run beta -- beta minor

# Create first alpha for next major version (e.g., 0.5.0 → 1.0.0-alpha.1)
npm run beta -- alpha major

# Create release candidate (e.g., 0.5.0-beta.2 → 0.5.0-rc.1)
npm run beta -- rc
```

Then follow the instructions printed by the script to commit, tag, and push.

### Option 3: Full Manual Process

1. **Update version**:
   ```bash
   # Manually edit package.json version field
   # Example: "0.5.0" → "0.6.0-beta.1"
   ```

2. **Build**:
   ```bash
   npm run compile
   npm run compile:webview
   ```

3. **Package**:
   ```bash
   npm run beta:package
   # Creates: dev-buddy-0.6.0-beta.1.vsix
   ```

4. **Publish to marketplace** (optional):
   ```bash
   npm run beta:publish
   # Uses VSCE_PAT from environment
   ```

5. **Commit and tag**:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 0.6.0-beta.1 (pre-release)"
   git tag v0.6.0-beta.1
   git push origin HEAD --tags
   ```

## Installing Beta Versions

### For End Users

**Via VS Code/Cursor (Easiest)**:
1. Open Extensions view
2. Search for "DevBuddy"
3. Click the dropdown next to "Install"
4. Select **"Install Pre-Release Version"**

**Via VSIX File**:
1. Download .vsix from GitHub pre-release
2. Run:
   ```bash
   code --install-extension dev-buddy-X.Y.Z-alpha.N.vsix
   ```

**Switching Back to Stable**:
1. In Extensions view, find DevBuddy
2. Click the dropdown next to "Uninstall"
3. Select **"Install Release Version"**

### For Developers

When testing locally:

```bash
# Build and package
npm run compile && npm run compile:webview
npm run package

# Install in VS Code
code --install-extension dev-buddy-*.vsix

# Or use the reinstall script
./reinstall.sh
```

## Experimental Branch Workflow

### Recommended Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Create experimental branch from main                     │
│    git checkout -b experimental/feature-name                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Develop and commit changes                               │
│    git commit -m "feat: add awesome feature"                │
│    git push origin experimental/feature-name                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CI runs automatically on push                            │
│    ✅ Lint, type-check, build                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Release alpha from experimental branch                   │
│    Actions → Publish Beta → branch: experimental/feature    │
│    Creates: 0.8.3-alpha.1+featurename                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Test, iterate, release more alphas                       │
│    0.8.3-alpha.2+featurename                                │
│    0.8.3-alpha.3+featurename                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. When ready, merge to main and release stable             │
│    PR → main → Release workflow → 0.9.0                     │
└─────────────────────────────────────────────────────────────┘
```

### Example: Testing a Risky Feature

```bash
# Start experimental branch
git checkout -b experimental/risky-refactor
git push origin experimental/risky-refactor

# Make changes, push
git add .
git commit -m "refactor: major architecture change"
git push

# CI runs automatically ✅

# Go to GitHub Actions
# Run "Publish Beta (Pre-release)"
# - Branch: experimental/risky-refactor
# - Type: alpha
# - Skip marketplace: yes (for internal testing)

# Download VSIX from GitHub release
# Test locally

# If good, release to marketplace
# Run again with Skip marketplace: no

# If great, merge to main for stable release
```

## Version Numbering

### From Main Branch

Pre-release versions follow even/odd versioning:

```
0.9.0  (stable - odd minor)
  ↓
0.10.0 (pre-release - even minor)
  ↓ (bug fixes)
0.10.1
  ↓ (more fixes)
0.10.2
  ↓ (promoted to stable)
0.11.0 (stable - odd minor)
```

### From Experimental Branches

Experimental versions include branch identifier:

```
0.8.3  (current stable)
  ↓
0.8.3-alpha.1+myfeature (first experimental)
  ↓
0.8.3-alpha.2+myfeature (iteration)
  ↓
0.8.3-alpha.3+myfeature (more iteration)
  ↓ (merge to main)
0.9.0 (stable release with feature)
```

## Best Practices

### Branch Naming

Use descriptive prefixes:
```bash
experimental/ai-improvements
experimental/jira-v2
feature/dark-mode
exp/performance-test
```

### Version Strategy

- Use **alpha** for highly experimental features
- Use **beta** for features that need community testing
- Use **rc** for final validation before stable

### Communication

- Always announce experimental releases in appropriate channels
- Include installation instructions
- List known issues and limitations
- Set expectations about stability

### Testing Flow

1. **Internal testing** (Skip marketplace = yes)
   - Build and release GitHub-only
   - Test with team
   
2. **Public pre-release** (Skip marketplace = no)
   - Release to marketplace pre-release channel
   - Get community feedback

3. **Stable release** (Merge to main)
   - Create PR to main
   - Run standard release workflow

## Marketplace Behavior

### How Pre-releases Work

- Users see a **"Switch to Pre-Release Version"** button
- Pre-release versions auto-update to newer pre-releases
- Users can switch back to stable anytime
- Both versions coexist on the marketplace

### Version Resolution

VS Code handles version selection:
- Stable users get: Latest stable version
- Pre-release users get: Latest pre-release OR stable (whichever is newer)

### Version Display

In the marketplace:
- Stable: "DevBuddy v0.9.0"
- Pre-release: "DevBuddy v0.10.0 (Pre-release)"
- Experimental: "DevBuddy v0.8.3-alpha.1+myfeature (Pre-release)"

## Troubleshooting

### "Branch does not exist"

**Problem**: Trying to release from a branch that doesn't exist remotely.

**Solution**: Push your branch first:
```bash
git push origin your-branch-name
```

### "Pre-release version is older than stable"

**Problem**: This happens when stable version is newer than pre-release.

**Solution**:
- Bump base version in your experimental branch
- Or accept that marketplace will show stable as "latest"

### "Users not seeing experimental updates"

**Solution**:
- Ensure they clicked "Switch to Pre-Release Version"
- Check they have auto-updates enabled
- Verify marketplace shows the pre-release
- For GitHub-only releases, share VSIX download link directly

### "Want to skip beta and go to stable"

**Solution**:
- Merge your branch to main
- Run stable release workflow
- The marketplace will show stable as latest

## GitHub Secrets Required

For automated publishing, ensure these secrets are set:

- `VSCE_PAT` - VS Code Marketplace Personal Access Token
- `OVSX_PAT` - Open VSX Token (optional)
- `VSCODE_TELEMETRY_CONNECTION_STRING` - Application Insights connection string
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

## Useful Commands

```bash
# Create/increment beta version
npm run beta

# Create alpha version
npm run beta -- alpha

# Create RC version
npm run beta -- rc

# Bump minor and create beta
npm run beta -- beta minor

# Package pre-release
npm run beta:package

# Publish pre-release (requires VSCE_PAT)
npm run beta:publish

# Check current version
node -p "require('./package.json').version"
```

## Resources

- [VS Code Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Pre-release Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#prerelease-extensions)
- [vsce CLI Reference](https://github.com/microsoft/vscode-vsce)
- [Semantic Versioning](https://semver.org/)

## Support

If you encounter issues with the beta release process:

1. Check the GitHub Actions logs
2. Verify all secrets are set correctly
3. Test the beta locally before publishing
4. Check branch exists and is pushed to remote

---

**Remember:** Experimental branches let you iterate freely without affecting main. Release early, release often, and gather feedback!
