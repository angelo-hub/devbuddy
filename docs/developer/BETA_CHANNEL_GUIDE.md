# Beta Channel Guide

This guide explains how to manage and publish beta/pre-release versions of DevBuddy.

## Overview

DevBuddy supports VS Code's built-in pre-release system, allowing users to opt-in to beta versions directly from the marketplace. Pre-release versions are published alongside stable versions and are clearly marked as such.

## Pre-release Types

We support three types of pre-release versions:

- **alpha** (`X.Y.Z-alpha.N`) - Early development, experimental features, may be unstable
- **beta** (`X.Y.Z-beta.N`) - Feature-complete but needs testing, relatively stable
- **rc** (`X.Y.Z-rc.N`) - Release candidate, final testing before stable release

## Version Numbering

Pre-release versions follow this format:

```
major.minor.patch-type.number
```

Examples:
- `0.6.0-beta.1` - First beta of version 0.6.0
- `0.6.0-beta.2` - Second beta of version 0.6.0
- `1.0.0-rc.1` - Release candidate for version 1.0.0

## Publishing Beta Versions

### Option 1: GitHub Actions (Recommended)

1. Go to **Actions** tab in GitHub
2. Select **"Publish Beta (Pre-release)"** workflow
3. Click **"Run workflow"**
4. Choose:
   - **Beta Type**: alpha, beta, or rc
   - **Bump Type**: major, minor, or patch (for base version bump)
5. Click **"Run workflow"**

The workflow will:
- Determine the next pre-release version
- Build and test the extension
- Publish to VS Code Marketplace as pre-release
- Create a GitHub pre-release
- Tag the version in git

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

4. **Publish to marketplace**:
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

6. **Create GitHub pre-release**:
   - Go to GitHub Releases
   - Click "Draft a new release"
   - Select the tag (v0.6.0-beta.1)
   - Check "Set as a pre-release"
   - Upload the .vsix file
   - Publish

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
   code --install-extension dev-buddy-X.Y.Z-beta.N.vsix
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
code --install-extension dev-buddy-X.Y.Z-beta.N.vsix

# Or use the reinstall script (may need updating for beta)
./reinstall.sh
```

## Beta Release Workflow

### When to Create a Beta

Create a beta version when:
- Introducing new experimental features
- Making significant architectural changes
- Testing with a subset of users before stable release
- Need feedback before finalizing a release

### Beta Release Process

1. **Development**:
   - Develop feature on a feature branch
   - Merge to `main` (or `beta` branch if you prefer)

2. **Create Beta**:
   - Run beta release workflow or script
   - Test the beta locally first

3. **Announce**:
   - Share in Discord/Slack/GitHub Discussions
   - Ask for feedback from beta testers
   - Document known issues

4. **Iterate**:
   - Fix bugs found in beta
   - Increment beta version (beta.2, beta.3, etc.)
   - Publish updated betas as needed

5. **Promote to Stable**:
   - When ready, publish as stable release
   - Update version to remove pre-release tag
   - Use standard release workflow

### Example Beta Cycle

```
0.5.0 (current stable)
  ↓
0.6.0-beta.1 (initial beta)
  ↓ (bug fixes)
0.6.0-beta.2
  ↓ (more fixes)
0.6.0-beta.3
  ↓ (final testing)
0.6.0-rc.1 (release candidate)
  ↓ (approved)
0.6.0 (stable release)
```

## Best Practices

### Version Strategy

- Use **alpha** for highly experimental features
- Use **beta** for features that need community testing
- Use **rc** (release candidate) for final validation before stable
- Keep betas short-lived (1-2 weeks max)

### Communication

- Always announce beta releases in appropriate channels
- Include changelog/release notes
- List known issues and limitations
- Set expectations about stability

### Testing

- Test beta versions thoroughly before publishing
- Have a rollback plan (stable version available)
- Monitor issues/feedback closely
- Be responsive to beta tester reports

### Transitioning to Stable

When promoting a beta to stable:

1. Create one final RC version if needed
2. Test RC thoroughly
3. If RC is good, remove pre-release tag
4. Publish as stable using standard workflow
5. Announce the stable release
6. Update documentation

## Marketplace Behavior

### How Pre-releases Work

- Users see a **"Switch to Pre-Release Version"** button
- Pre-release versions auto-update to newer pre-releases
- Users can switch back to stable anytime
- Both versions can coexist on the marketplace

### Version Resolution

VS Code handles version selection:
- Stable users get: Latest stable version
- Pre-release users get: Latest pre-release OR stable (whichever is newer)

### Version Display

In the marketplace:
- Stable: "DevBuddy v0.5.0"
- Pre-release: "DevBuddy v0.6.0-beta.1 (Pre-release)"

## Troubleshooting

### "Pre-release version is older than stable"

This happens when stable version is newer than pre-release. Solutions:
- Bump base version in beta (e.g., 0.6.0-beta.1 vs 0.5.0)
- Publish a new beta with higher version number

### "Users not seeing beta updates"

- Ensure they clicked "Switch to Pre-Release Version"
- Check they have auto-updates enabled
- Verify marketplace shows the pre-release

### "Want to skip beta and go to stable"

- Just publish stable version with higher version number
- The marketplace will show stable as latest

### "Need to unpublish a beta"

You cannot unpublish from marketplace, but you can:
- Publish a newer beta with fixes
- Wait for stable release to supersede it
- Mark it as deprecated in release notes

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
4. Reach out in Discord/GitHub Discussions

---

**Remember:** Beta releases are for testing. Always maintain a stable version that users can fall back to!

