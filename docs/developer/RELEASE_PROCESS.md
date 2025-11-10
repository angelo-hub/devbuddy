# Release Process Guide

This guide explains how to release new versions of DevBuddy to the VS Code Marketplace using our automated CI/CD pipeline.

## Overview

DevBuddy uses an automated release workflow based on:
- **Semantic Versioning (semver)** - Version numbers follow `MAJOR.MINOR.PATCH` format
- **Conventional Commits** - Commit messages determine version bumps
- **GitHub Actions** - Fully automated releases via CI/CD
- **standard-version** - Automatic changelog generation

## Quick Start

### 1. Make Your Changes

Commit your changes using conventional commit format:

```bash
git add .
git commit -m "feat(jira): add support for custom fields"
git push origin your-branch
```

### 2. Merge to Main

Merge your PR to the `main` branch after review.

### 3. Trigger Release

1. Go to [GitHub Actions](https://github.com/angelogirardi/developer-buddy/actions)
2. Select **"Release Extension"** workflow
3. Click **"Run workflow"**
4. Choose release type:
   - **auto** - Automatically detect version bump from commits (recommended)
   - **major** - Force major version bump (1.0.0 → 2.0.0)
   - **minor** - Force minor version bump (1.0.0 → 1.1.0)
   - **patch** - Force patch version bump (1.0.0 → 1.0.1)
5. Click **"Run workflow"**

### 4. Wait for Completion

The workflow will:
1. ✅ Run tests and linting
2. ✅ Calculate version bump
3. ✅ Update `package.json` and generate `CHANGELOG.md`
4. ✅ Build and package the extension
5. ✅ Publish to VS Code Marketplace
6. ✅ Create GitHub Release with VSIX file
7. ✅ Commit version bump back to main
8. ✅ Push git tag

### 5. Verify Release

Check these locations:
- [GitHub Releases](https://github.com/angelogirardi/developer-buddy/releases)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy)

## Conventional Commit Format

Conventional commits are structured messages that trigger automatic versioning.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types and Version Bumps

| Type | Version Bump | Example |
|------|--------------|---------|
| `feat:` | **MINOR** (0.1.0 → 0.2.0) | New feature |
| `fix:` | **PATCH** (0.1.0 → 0.1.1) | Bug fix |
| `perf:` | **PATCH** (0.1.0 → 0.1.1) | Performance improvement |
| `BREAKING CHANGE:` | **MAJOR** (0.1.0 → 1.0.0) | Breaking API change |
| `docs:`, `chore:`, `style:`, `test:` | **None** | Not included in release |

### Examples

#### Feature (Minor Bump)

```bash
git commit -m "feat(jira): add support for custom fields

Adds ability to view and edit custom fields in Jira tickets.
- Custom field rendering in webview
- Edit support for text, number, and select fields
- Validation for required fields"
```

#### Bug Fix (Patch Bump)

```bash
git commit -m "fix(linear): resolve ticket sync race condition

Fixes issue where rapid ticket updates could cause sync conflicts.
Adds proper locking mechanism to prevent concurrent updates."
```

#### Breaking Change (Major Bump)

```bash
git commit -m "feat(ai)!: switch to new AI model configuration

BREAKING CHANGE: AI model configuration has moved from
'devBuddy.aiModel' to 'devBuddy.ai.model'. Users will need
to update their settings."
```

#### Multiple Scopes

```bash
git commit -m "feat(linear,jira): add multi-ticket standup generation"
```

### Common Scopes

- `linear` - Linear-specific features
- `jira` - Jira-specific features
- `ai` - AI/LM features
- `webview` - Webview UI components
- `git` - Git integration
- `config` - Configuration changes
- `telemetry` - Telemetry features
- `docs` - Documentation

## Setting Up VSCE_PAT (First Time Only)

To publish to the VS Code Marketplace, you need a Personal Access Token (PAT).

### 1. Create Azure DevOps PAT

1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft account
3. Click your profile → **Security** → **Personal access tokens**
4. Click **+ New Token**
5. Configure the token:
   - **Name**: `DevBuddy Extension Publishing`
   - **Organization**: All accessible organizations
   - **Expiration**: 90 days (or custom)
   - **Scopes**: Custom defined
     - ✅ Marketplace → **Manage**
6. Click **Create**
7. **Copy the token** (you won't see it again!)

### 2. Add to GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Configure:
   - **Name**: `VSCE_PAT`
   - **Secret**: Paste the token from step 1
5. Click **Add secret**

### 3. Optional: Add Telemetry Secret

If using telemetry features:

1. Create a secret named `VSCODE_TELEMETRY_CONNECTION_STRING`
2. Paste your Application Insights connection string
3. See [TELEMETRY_SECRETS_SETUP.md](./TELEMETRY_SECRETS_SETUP.md) for details

### 4. Optional: Open VSX Publishing

To also publish to Open VSX Registry (VS Code alternatives like VSCodium):

1. Create an Open VSX token at [open-vsx.org](https://open-vsx.org)
2. Add as `OVSX_PAT` secret in GitHub
3. The workflow will automatically publish to both marketplaces

## Version Bump Behavior

### Auto Detection (Recommended)

When you select **"auto"** release type:

```bash
# Analyzes commits since last release tag
# Examples:
#   - Only feat commits → MINOR bump (0.1.0 → 0.2.0)
#   - Only fix commits → PATCH bump (0.1.0 → 0.1.1)
#   - feat + fix commits → MINOR bump (0.1.0 → 0.2.0)
#   - BREAKING CHANGE → MAJOR bump (0.1.0 → 1.0.0)
#   - No feat/fix commits → No release
```

### Manual Override

Force a specific version bump regardless of commits:

```bash
# Major: Breaking changes, major features
0.1.0 → 1.0.0

# Minor: New features, non-breaking
0.1.0 → 0.2.0

# Patch: Bug fixes, small improvements
0.1.0 → 0.1.1
```

## Changelog

The `CHANGELOG.md` file is automatically generated and follows this format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2024-11-10

### ✨ Features

- **jira**: add support for custom fields
- **linear**: add multi-ticket standup builder

### 🐛 Bug Fixes

- **webview**: fix theme not applying on initial load
- **git**: resolve permalink generation for GitLab

### ⚡ Performance

- **ai**: reduce token usage by 40% with better prompts
```

### Manual Edits

You can edit the changelog before release:

1. Run a dry-run locally: `npm run release:dry-run`
2. Review the generated changelog
3. Make changes if needed
4. Commit and push
5. Trigger the release workflow

## Workflow Details

### What Happens During Release

```
┌─────────────────────────────────────────────────┐
│ 1. Checkout code (full history)                │
│    - Fetch all commits and tags                │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 2. Setup Node.js and install dependencies      │
│    - npm ci (clean install)                    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 3. Quality checks                               │
│    - Type checking                             │
│    - Linting                                   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 4. Compile                                      │
│    - TypeScript → JavaScript                   │
│    - Webviews (React) → Bundle                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 5. Version bump (standard-version)              │
│    - Analyze commits since last tag            │
│    - Calculate new version                     │
│    - Update package.json                       │
│    - Generate/update CHANGELOG.md              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 6. Package extension                            │
│    - Create .vsix file                         │
│    - Include telemetry secrets (if configured) │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 7. Publish to marketplaces                      │
│    - VS Code Marketplace (required)            │
│    - Open VSX (optional)                       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 8. Create Git tag                               │
│    - Tag: v0.2.0                               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 9. Commit and push                              │
│    - Commit: "chore(release): v0.2.0"          │
│    - Push to main branch                       │
│    - Push tag                                  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 10. Create GitHub Release                       │
│     - Extract changelog for this version       │
│     - Attach .vsix file                        │
│     - Mark as published                        │
└─────────────────────────────────────────────────┘
```

### Permissions Required

The workflow needs these permissions:
- `contents: write` - To commit version bumps and create releases
- `id-token: write` - For authenticated operations

These are configured in the workflow file and granted automatically by GitHub Actions.

## Troubleshooting

### Release Fails: "No commits since last release"

**Problem**: Running "auto" release with no feat/fix commits.

**Solution**: Either:
1. Add a feature or fix commit
2. Run workflow with manual bump type (major/minor/patch)

### Release Fails: "Invalid VSCE_PAT"

**Problem**: Personal Access Token is expired or invalid.

**Solution**:
1. Generate a new PAT (see setup instructions above)
2. Update the `VSCE_PAT` secret in GitHub
3. Re-run the workflow

### Release Fails: "Git push rejected"

**Problem**: Branch protection or permission issues.

**Solution**:
1. Check that GitHub Actions has write permissions
2. Verify no branch protection rules block bot commits
3. Ensure `GITHUB_TOKEN` has necessary permissions

### Version Bump Not as Expected

**Problem**: Wrong version increment (e.g., minor instead of major).

**Solution**:
1. Check commit messages follow conventional format
2. For breaking changes, ensure `BREAKING CHANGE:` in footer
3. Use manual bump type if needed

### Changelog Missing Commits

**Problem**: Some commits don't appear in changelog.

**Solution**:
1. Ensure commits use conventional format
2. Check commit type is not hidden (chore, style, test are hidden by default)
3. Review `.versionrc.json` configuration

## Testing Locally

Before triggering a release, test locally:

### Dry Run

```bash
# See what version would be bumped
npm run release:dry-run

# Test specific bump types
npm run release:patch -- --dry-run
npm run release:minor -- --dry-run
npm run release:major -- --dry-run
```

### Manual Release (Not Recommended)

If you need to release manually:

```bash
# 1. Bump version and generate changelog
npm run release

# 2. Build and package
npm run compile
npm run compile:webview
npm run package

# 3. Publish to marketplace
npx @vscode/vsce publish

# 4. Push changes
git push --follow-tags origin main
```

**Note**: Manual releases skip GitHub Release creation. Use the automated workflow instead.

## Best Practices

### ✅ Do

- Use conventional commits for all changes
- Write clear, descriptive commit messages
- Include scope when relevant (e.g., `feat(jira):`)
- Test thoroughly before merging to main
- Use "auto" release type for most releases
- Review the changelog after release

### ❌ Don't

- Skip conventional commit format
- Release from feature branches (always use main)
- Force push after a release
- Edit `package.json` version manually
- Delete release tags
- Rush releases without testing

## Release Checklist

Before triggering a release:

- [ ] All PRs merged to main
- [ ] All commits use conventional format
- [ ] CI passing on main branch
- [ ] Local testing completed
- [ ] Breaking changes documented (if any)
- [ ] VSCE_PAT secret is valid
- [ ] Telemetry secrets configured (if using telemetry)

After release:

- [ ] GitHub Release created successfully
- [ ] Extension visible on marketplace
- [ ] Version number correct in marketplace
- [ ] VSIX downloads from GitHub Release
- [ ] Changelog looks correct
- [ ] Tag pushed to repository
- [ ] Announce release to team/users

## Additional Resources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [standard-version Documentation](https://github.com/conventional-changelog/standard-version)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

If you encounter issues:

1. Check the [workflow run logs](https://github.com/angelogirardi/developer-buddy/actions)
2. Review this guide's troubleshooting section
3. Check existing [GitHub Issues](https://github.com/angelogirardi/developer-buddy/issues)
4. Open a new issue with workflow logs attached

---

**Last Updated**: November 10, 2024
**Workflow Version**: 1.0.0

