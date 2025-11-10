# Security Checklist for VSIX Packaging

## Critical: Never Package Credentials!

Before building and distributing a VSIX package, always verify that sensitive files are excluded.

## Pre-Build Checklist

### 1. Check `.vscodeignore`
Ensure these patterns are included:
```
# Environment files
.env
.env.*
.env.local
.env.development
.env.production

# Development credentials
**/credentials/**
**/*_credentials*
```

### 2. Verify `.env.local` Exclusion
```bash
# This should return "No .env files found" (good!)
unzip -l dev-buddy-*.vsix | grep -E "\\.env"
```

### 3. Clean Build
Before packaging:
```bash
# Remove old builds
rm -rf out/
rm -f *.vsix

# Clean build
npm run compile
npm run compile:webview

# Package
npm run package
```

### 4. Inspect VSIX Contents
```bash
# List all files in the VSIX
unzip -l dev-buddy-*.vsix

# Check for sensitive patterns
unzip -l dev-buddy-*.vsix | grep -E "\\.env|credentials|secrets|token|api_key"

# Extract and inspect (in a temp directory)
mkdir -p /tmp/vsix-inspection
unzip dev-buddy-*.vsix -d /tmp/vsix-inspection
ls -la /tmp/vsix-inspection/extension/
```

### 5. Search for Hardcoded Secrets
```bash
# Search for potential API tokens or keys in compiled code
grep -r "lin_api_" out/ 2>/dev/null || echo "✅ No Linear API tokens found"
grep -r "sk_" out/ 2>/dev/null || echo "✅ No secret keys found"
grep -r "ghp_" out/ 2>/dev/null || echo "✅ No GitHub tokens found"
```

## What Should Be Excluded

### Always Exclude:
- ✅ `.env` files (all variants)
- ✅ `credentials/` directories
- ✅ Development scripts with credentials
- ✅ Test fixtures with real data
- ✅ `.git/` directory
- ✅ `node_modules/@types/` (dev dependencies)
- ✅ Source TypeScript files (`src/**/*.ts`)
- ✅ Build configuration files
- ✅ Documentation files (except README, LICENSE)

### Must Be Included:
- ✅ Compiled JavaScript (`out/**/*.js`)
- ✅ Webview builds (`out/webview/**`)
- ✅ Production dependencies (`node_modules/`)
- ✅ `package.json`
- ✅ `README.md`, `LICENSE`, `EULA.md`
- ✅ Icon resources (`resources/`)
- ✅ Walkthrough media (if used)

## Safe Credential Management

### Development Credentials
Use the built-in dev environment loader:

```typescript
// src/shared/utils/devEnvLoader.ts
// This loads .env.local ONLY in development
// Never packaged in VSIX
```

### User Credentials
Store via VS Code Secret Storage:

```typescript
// Stored in OS keychain, never in files
await context.secrets.store("linearApiToken", token);
const token = await context.secrets.get("linearApiToken");
```

## Verification Commands

### Before Publishing
```bash
# 1. Clean build
npm run compile && npm run compile:webview

# 2. Package
npm run package

# 3. Get VSIX filename
VSIX_FILE=$(ls -t dev-buddy-*.vsix | head -1)
echo "Checking: $VSIX_FILE"

# 4. Verify no .env files
echo "Checking for .env files..."
unzip -l "$VSIX_FILE" | grep -E "\\.env" && echo "❌ DANGER: .env files found!" || echo "✅ No .env files"

# 5. Verify no credentials
echo "Checking for credentials..."
unzip -l "$VSIX_FILE" | grep -iE "credential|secret|token|api_key" && echo "⚠️  Check these files manually" || echo "✅ No obvious credential files"

# 6. Check file count (should be reasonable)
FILE_COUNT=$(unzip -l "$VSIX_FILE" | wc -l)
echo "Total files in VSIX: $FILE_COUNT"

# 7. Check size (should be < 10MB typically)
ls -lh "$VSIX_FILE"
```

### After Building
```bash
# Quick inspection
./scripts/verify-vsix.sh dev-buddy-*.vsix
```

## Emergency: VSIX Already Published with Credentials

If you accidentally published a VSIX with credentials:

1. **Immediately rotate all credentials**
   ```bash
   # Linear API token: https://linear.app/settings/api
   # Jira API token: https://id.atlassian.com/manage-profile/security/api-tokens
   # GitHub tokens: https://github.com/settings/tokens
   ```

2. **Unpublish the version** (if possible)
   ```bash
   vsce unpublish <publisher>.<extension> <version>
   ```

3. **Publish clean version immediately**
   - Fix `.vscodeignore`
   - Clean build
   - Verify (use checklist above)
   - Publish new version

4. **Notify users** (if widely distributed)
   - GitHub Security Advisory
   - Release notes warning
   - Email notification (if applicable)

## CI/CD Integration

### GitHub Actions
```yaml
- name: Security Check Before Package
  run: |
    echo "Checking for .env files..."
    if find . -name ".env*" -not -path "./node_modules/*" | grep -q .; then
      echo "ERROR: .env files found!"
      exit 1
    fi
    
- name: Build and Package
  run: |
    npm run compile
    npm run compile:webview
    npm run package
    
- name: Verify VSIX Contents
  run: |
    VSIX_FILE=$(ls -t *.vsix | head -1)
    unzip -l "$VSIX_FILE" | grep -E "\\.env" && exit 1 || echo "✅ Clean"
```

## Best Practices

1. **Never commit credentials** - Use `.gitignore`
2. **Never package credentials** - Use `.vscodeignore`
3. **Use VS Code Secret Storage** - For user credentials
4. **Use environment variables** - For development only
5. **Verify before every release** - Run security checklist
6. **Automate verification** - Add to CI/CD pipeline
7. **Rotate regularly** - Change development credentials periodically

## Quick Reference

```bash
# Safe build process
rm -rf out/ *.vsix                    # Clean
npm run compile && npm run compile:webview  # Build
npm run package                       # Package
unzip -l *.vsix | grep -E "\\.env"    # Verify
```

---

**Remember:** One leaked credential can compromise your entire system. Always verify before distributing!

**Last Updated:** November 10, 2025

