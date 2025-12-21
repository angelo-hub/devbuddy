# Pre-release Channel Guide

This guide explains how to manage and publish pre-release versions of DevBuddy using VS Code's recommended versioning strategy.

## Overview

DevBuddy uses VS Code's **odd/even versioning** strategy for pre-releases:

| Minor Version | Type | Example |
|---------------|------|---------|
| Even (0, 2, 4, 6, 8...) | **Stable** | `0.8.0`, `0.8.1`, `0.10.0` |
| Odd (1, 3, 5, 7, 9...) | **Pre-release** | `0.9.0`, `0.9.1`, `0.11.0` |

This is VS Code's recommended approach. Users who opt into pre-releases will automatically get odd minor versions, while stable users stay on even minor versions.

## Version Tracks

### Stable Track (Even Minor)
```
0.8.0 → 0.8.1 → 0.8.2 → ... → 0.10.0 → 0.10.1 → ...
```
- Published normally (no `--pre-release` flag)
- Users get this by default
- Bug fixes and stable features

### Pre-release Track (Odd Minor)
```
0.9.0 → 0.9.1 → 0.9.2 → ... → 0.11.0 → 0.11.1 → ...
```
- Published with `--pre-release` flag
- Users must opt-in via "Switch to Pre-Release Version"
- Experimental features and early testing

## Publishing Pre-releases

### Option 1: GitHub Actions (Recommended)

1. Go to **Actions** tab in GitHub
2. Select **"Publish Pre-release"** workflow
3. Click **"Run workflow"**
4. Choose bump type:
   - **patch**: Increment patch (e.g., 0.9.0 → 0.9.1)
   - **minor**: Jump to next odd minor (e.g., 0.9.x → 0.11.0)
5. Click **"Run workflow"**

The workflow will:
- Automatically determine the correct pre-release version
- Build and test the extension
- Publish to VS Code Marketplace with `--pre-release` flag
- Create a GitHub pre-release
- Tag the version in git

### Option 2: Manual with Script

```bash
# Move to pre-release track (from 0.8.x → 0.9.0)
# Or increment patch if already on pre-release track
npm run beta

# Bump to next pre-release minor (0.9.x → 0.11.0)
npm run beta -- minor
```

Then follow the printed instructions to commit, tag, push, and publish.

### Option 3: Full Manual Process

1. **Update version** (must be odd minor):
   ```bash
   # If on stable (0.8.0), move to pre-release
   npm version 0.9.0 --no-git-tag-version
   
   # If already on pre-release (0.9.0), increment
   npm version 0.9.1 --no-git-tag-version
   ```

2. **Build**:
   ```bash
   npm run compile
   npm run compile:webview
   ```

3. **Package**:
   ```bash
   npm run beta:package
   ```

4. **Publish with pre-release flag**:
   ```bash
   npm run beta:publish
   # This runs: vsce publish --pre-release
   ```

5. **Commit and tag**:
   ```bash
   git add package.json
   git commit -m "chore: release v0.9.0 (pre-release)"
   git tag v0.9.0
   git push origin HEAD --tags
   ```

## Example Release Cycle

```
0.8.0 (stable)
  ↓ [user runs pre-release workflow]
0.9.0 (pre-release) ← Testing new features
  ↓ [bug found, fix pushed]
0.9.1 (pre-release) ← Bug fix
  ↓ [more fixes]
0.9.2 (pre-release) ← More fixes
  ↓ [ready for stable]
0.10.0 (stable) ← Features graduate to stable
  ↓ [start next cycle]
0.11.0 (pre-release) ← Next batch of features
```

## Installing Pre-releases

### For End Users

**Via VS Code/Cursor (Recommended)**:
1. Open Extensions view
2. Search for "DevBuddy"
3. Click the gear icon or dropdown
4. Select **"Switch to Pre-Release Version"**

**Switching Back to Stable**:
1. In Extensions view, find DevBuddy
2. Click the gear icon or dropdown
3. Select **"Switch to Release Version"**

### For Developers

```bash
# Build and test locally
npm run compile && npm run compile:webview
npm run package

# Install the VSIX
code --install-extension dev-buddy-0.9.0.vsix
```

## Best Practices

### Version Strategy

- **Stable releases (even minor)**: Only ship tested, stable features
- **Pre-releases (odd minor)**: Ship experimental features for testing
- Keep pre-release cycles short (1-2 weeks)
- Graduate features to stable once validated

### Communication

- Always announce pre-releases in appropriate channels
- Include changelog/release notes
- List known issues and limitations
- Set expectations about stability

### When to Create a Pre-release

Create a pre-release when:
- Introducing new experimental features
- Making significant architectural changes
- Testing with a subset of users before stable release
- Need feedback before finalizing a release

### Graduating to Stable

When promoting pre-release features to stable:

1. Ensure all major bugs are fixed
2. Update version to next even minor (0.9.x → 0.10.0)
3. Publish without `--pre-release` flag
4. Announce the stable release
5. Update documentation

## Marketplace Behavior

### How Pre-releases Work

- Pre-releases are published with `--pre-release` flag
- Users see a "Switch to Pre-Release Version" button
- Pre-release users auto-update to newer pre-releases
- Stable users auto-update to newer stable versions
- Both versions coexist on the marketplace

### Version Resolution

- **Stable users**: Get latest even minor version (e.g., 0.8.2)
- **Pre-release users**: Get latest odd minor version (e.g., 0.9.3)

## Troubleshooting

### "My pre-release isn't showing up"

Ensure you:
1. Used an odd minor version (0.9.x, 0.11.x, etc.)
2. Published with `--pre-release` flag
3. Version is higher than the last pre-release

### "Users aren't seeing pre-release updates"

- Ensure they clicked "Switch to Pre-Release Version"
- Check they have auto-updates enabled
- Verify marketplace shows the pre-release

### "Want to skip pre-release and go to stable"

Just publish a stable version (even minor) with a higher version number. The marketplace will show stable as latest for stable-track users.

## GitHub Secrets Required

For automated publishing:

- `VSCE_PAT` - VS Code Marketplace Personal Access Token
- `OVSX_PAT` - Open VSX Token (optional)
- `VSCODE_TELEMETRY_CONNECTION_STRING` - Application Insights connection string
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

## Useful Commands

```bash
# Move to pre-release track or increment patch
npm run beta

# Bump to next pre-release minor
npm run beta -- minor

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

---

**Remember:** Pre-releases use odd minor versions (0.9.x, 0.11.x). Stable releases use even minor versions (0.8.x, 0.10.x). Always maintain a stable version that users can fall back to!
