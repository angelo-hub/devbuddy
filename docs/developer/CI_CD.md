# CI/CD Configuration

This document describes the continuous integration and deployment setup for DevBuddy.

## Overview

DevBuddy uses GitHub Actions for CI/CD with two main workflows:

1. **CI Workflow** (`ci.yml`) - Runs on PRs and pushes to main/develop
2. **Release Workflow** (`publish.yml`) - Manually triggered for releases

## CI Workflow

**File:** `.github/workflows/ci.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

**Matrix:**
- Operating Systems: Ubuntu, macOS, Windows
- Node.js: 20.x

**Steps:**

1. **Install dependencies** - `npm ci`
2. **Type check** - `npm run type-check` ✅ **REQUIRED CHECK**
3. **Lint** - `npm run lint` ✅ **REQUIRED CHECK**
4. **Compile extension** - `npm run compile`
5. **Compile webviews** - `npm run compile:webview`
6. **Package extension** - `npm run package`
7. **Upload artifacts** (Ubuntu only)

### Required Checks for PRs

The following checks must pass before merging:

- ✅ **Type Check** - All TypeScript must compile without errors
- ✅ **Lint** - Code must pass ESLint rules (extension + webviews)
- ✅ **Build** - Extension and webviews must compile successfully
- ✅ **Package** - Extension must package into `.vsix` successfully

**All checks run on 3 platforms:** Ubuntu, macOS, Windows

## Release Workflow

**File:** `.github/workflows/publish.yml`

**Trigger:** Manual dispatch via GitHub Actions UI

**Release Types:**
- `auto` - Automatic version bump based on conventional commits
- `major` - Major version bump (breaking changes)
- `minor` - Minor version bump (new features)
- `patch` - Patch version bump (bug fixes)

**Steps:**

1. **Install dependencies** - `npm ci`
2. **Type check** - `npm run type-check`
3. **Lint** - `npm run lint`
4. **Compile extension** - `npm run compile`
5. **Compile webviews** - `npm run compile:webview`
6. **Version bump** - Uses `standard-version`
7. **Package extension** - With telemetry secrets
8. **Publish to VS Code Marketplace**
9. **Publish to Open VSX** (optional)
10. **Create Git tag**
11. **Push changes**
12. **Create GitHub Release**

### Release Notes

Automatically generated from conventional commits using `standard-version`.

## Setting Up Required Checks on GitHub

### Step 1: Enable Branch Protection

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add branch protection rule**
4. Branch name pattern: `main` (or `develop`)

### Step 2: Configure Required Checks

Enable these options:

- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

Select these status checks as required:

- `build-and-test (ubuntu-latest, 20)`
- `build-and-test (macos-latest, 20)`
- `build-and-test (windows-latest, 20)`

The individual steps (type-check, lint, compile) are part of the `build-and-test` job.

### Step 3: Additional Protections (Recommended)

- ✅ **Require a pull request before merging**
- ✅ **Require approvals: 1** (for team projects)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from Code Owners** (if you have CODEOWNERS file)
- ✅ **Require linear history**
- ✅ **Do not allow bypassing the above settings**

### Step 4: Apply to Develop Branch (Optional)

Repeat the same process for the `develop` branch if you use a git-flow model.

## Local Development Workflow

Before pushing code, run these checks locally:

```bash
# Quick validation (type-check + lint)
npm run validate

# Full CI simulation
npm run type-check    # Check types
npm run lint          # Check linting
npm run compile       # Compile extension
npm run compile:webview  # Compile webviews
npm run package       # Package extension
```

## Pre-commit Hook (Optional)

Consider adding a pre-commit hook with Husky:

```bash
# Install husky
npm install --save-dev husky

# Initialize husky
npx husky init

# Add pre-commit hook
echo "npm run validate" > .husky/pre-commit
chmod +x .husky/pre-commit
```

This will automatically run `type-check` and `lint` before every commit.

## Fixing CI Failures

### Type Check Failures

```bash
# Run type check locally
npm run type-check

# Check specific file
npx tsc --noEmit path/to/file.ts
```

**Common issues:**
- Missing types: Install `@types/*` packages
- Type errors: Fix TypeScript errors in code
- Config issues: Check `tsconfig.json`

### Lint Failures

```bash
# Run lint locally
npm run lint

# Auto-fix issues
npm run lint:fix

# Check specific file
npx eslint path/to/file.ts
```

**Common issues:**
- Unused variables: Prefix with `_` or remove
- Missing dependencies in useEffect: Add to deps array
- Lexical declarations in case blocks: Wrap in `{ }`
- Any types: Add proper typing

### Build Failures

```bash
# Compile extension
npm run compile

# Compile webviews
npm run compile:webview

# Watch mode for debugging
npm run watch          # Extension
npm run watch:webview  # Webviews
```

**Common issues:**
- Import errors: Check path aliases
- Module not found: Check imports and file paths
- Build plugin errors: Check `webview-ui/build.js`

### Package Failures

```bash
# Try packaging locally
npm run package
```

**Common issues:**
- Missing files: Check `.vscodeignore`
- Build artifacts missing: Run compile first
- Size too large: Check what's included

## CI Performance

Current CI times (approximate):

- **Ubuntu:** ~3-4 minutes
- **macOS:** ~4-5 minutes
- **Windows:** ~5-6 minutes

**Total time:** ~5-6 minutes (runs in parallel)

## Secrets Required

The following secrets must be configured in GitHub repository settings:

### For Release Workflow

- `VSCE_PAT` - VS Code Extension Publisher Personal Access Token
- `OVSX_PAT` - Open VSX Registry Token (optional)
- `VSCODE_TELEMETRY_CONNECTION_STRING` - Application Insights connection string

### Setting Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret with its value

## Troubleshooting CI

### "npm ci" fails

**Cause:** `package-lock.json` out of sync

**Fix:**
```bash
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
```

### "Module not found" after adding dependency

**Cause:** Need to run `npm install` and commit lock file

**Fix:**
```bash
npm install
git add package.json package-lock.json
git commit -m "chore: add dependency"
```

### CI passes locally but fails in CI

**Causes:**
1. Platform-specific issues (Windows vs Unix paths)
2. Different Node.js versions
3. Missing files in git
4. Environment differences

**Fix:**
- Check CI logs for specific errors
- Test on the failing platform locally
- Ensure all files are committed
- Check for hardcoded paths

### CI is slow

**Optimizations:**
- Use `npm ci` instead of `npm install` (already done)
- Enable npm caching (already done via `cache: 'npm'`)
- Cache build outputs (consider adding)
- Reduce matrix (remove platforms if not needed)

## Best Practices

1. **Run validation locally** before pushing:
   ```bash
   npm run validate
   ```

2. **Fix lint issues** with auto-fix when possible:
   ```bash
   npm run lint:fix
   ```

3. **Keep CI fast** - Don't add unnecessary steps

4. **Monitor CI status** - Check GitHub Actions tab regularly

5. **Update dependencies** - Keep CI dependencies up to date

6. **Test on all platforms** - CI runs on Ubuntu, macOS, Windows

7. **Use conventional commits** - Enables automatic versioning

## Conventional Commits

For automatic versioning in releases, follow conventional commit format:

```bash
feat: add new feature       # Minor version bump
fix: resolve bug            # Patch version bump
docs: update documentation  # No version bump
chore: update dependencies  # No version bump
refactor: improve code      # No version bump
test: add tests            # No version bump

# Breaking changes (major version bump)
feat!: breaking change
fix!: breaking fix
```

## Monitoring

- **GitHub Actions Tab** - View all workflow runs
- **Pull Request Checks** - See status on each PR
- **Branch Protection** - Enforces required checks
- **Notifications** - GitHub sends emails on failures

## Future Improvements

- [ ] Add automated tests (unit, integration)
- [ ] Add code coverage reporting
- [ ] Add performance benchmarks
- [ ] Add automatic dependency updates (Dependabot)
- [ ] Add security scanning
- [ ] Add pre-commit hooks
- [ ] Cache build outputs for faster CI
- [ ] Add smoke tests after packaging

---

**Remember:** The CI is your safety net. Trust the checks! 🛡️

