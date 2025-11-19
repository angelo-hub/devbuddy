#!/bin/bash

# VSIX Security Verification Script
# Checks VSIX package for sensitive files before distribution

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get VSIX file
VSIX_FILE="${1:-$(ls -t dev-buddy-*.vsix 2>/dev/null | head -1)}"

if [ -z "$VSIX_FILE" ]; then
    echo -e "${RED}❌ Error: No VSIX file found${NC}"
    echo "Usage: $0 [path-to-vsix-file]"
    exit 1
fi

if [ ! -f "$VSIX_FILE" ]; then
    echo -e "${RED}❌ Error: File not found: $VSIX_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Verifying VSIX Security: $VSIX_FILE${NC}"
echo "=================================================="

# Check 1: Environment files
echo -ne "\n${BLUE}1. Checking for .env files...${NC} "
if unzip -l "$VSIX_FILE" 2>/dev/null | grep -qE "\.env"; then
    echo -e "${RED}❌ DANGER: .env files found!${NC}"
    echo "   Found:"
    unzip -l "$VSIX_FILE" | grep -E "\.env"
    EXIT_CODE=1
else
    echo -e "${GREEN}✅ No .env files${NC}"
fi

# Check 2: Credential patterns
echo -ne "${BLUE}2. Checking for credential patterns...${NC} "
CRED_PATTERNS=$(unzip -l "$VSIX_FILE" 2>/dev/null | grep -iE "credential|secret|api_key" | grep -v "node_modules" || true)
if [ -n "$CRED_PATTERNS" ]; then
    echo -e "${YELLOW}⚠️  Potential credential files found:${NC}"
    echo "$CRED_PATTERNS"
    echo -e "${YELLOW}   Please verify these manually${NC}"
else
    echo -e "${GREEN}✅ No credential patterns${NC}"
fi

# Check 3: Development files
echo -ne "${BLUE}3. Checking for development files...${NC} "
DEV_FILES=$(unzip -l "$VSIX_FILE" 2>/dev/null | grep -E "src/.*\.ts$|\.vscode/|scripts/" | grep -v "node_modules" || true)
if [ -n "$DEV_FILES" ]; then
    echo -e "${YELLOW}⚠️  Development files found:${NC}"
    echo "$DEV_FILES" | head -5
    if [ $(echo "$DEV_FILES" | wc -l) -gt 5 ]; then
        echo "   ... and $(( $(echo "$DEV_FILES" | wc -l) - 5 )) more"
    fi
else
    echo -e "${GREEN}✅ No development files${NC}"
fi

# Check 4: Token patterns in compiled code (basic check)
echo -ne "${BLUE}4. Checking for hardcoded tokens...${NC} "
TEMP_DIR=$(mktemp -d)
unzip -q "$VSIX_FILE" -d "$TEMP_DIR" 2>/dev/null

# Check for common token patterns
TOKEN_FOUND=0
if grep -rE "lin_api_[a-zA-Z0-9]{40}" "$TEMP_DIR/extension/out" 2>/dev/null | grep -v "node_modules" >/dev/null; then
    echo -e "${RED}❌ Linear API token found!${NC}"
    TOKEN_FOUND=1
fi
if grep -rE "(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}" "$TEMP_DIR/extension/out" 2>/dev/null | grep -v "node_modules" >/dev/null; then
    echo -e "${RED}❌ GitHub token found!${NC}"
    TOKEN_FOUND=1
fi
if grep -rE "sk_[a-zA-Z0-9]{32,}" "$TEMP_DIR/extension/out" 2>/dev/null | grep -v "node_modules" >/dev/null; then
    echo -e "${RED}❌ Secret key found!${NC}"
    TOKEN_FOUND=1
fi

if [ $TOKEN_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No hardcoded tokens${NC}"
fi

rm -rf "$TEMP_DIR"

# Check 5: File size
echo -ne "${BLUE}5. Checking package size...${NC} "
SIZE=$(ls -lh "$VSIX_FILE" | awk '{print $5}')
SIZE_BYTES=$(ls -l "$VSIX_FILE" | awk '{print $5}')
MAX_SIZE=$((20 * 1024 * 1024)) # 20MB

if [ $SIZE_BYTES -gt $MAX_SIZE ]; then
    echo -e "${YELLOW}⚠️  Large package: $SIZE${NC}"
    echo "   Consider reducing package size"
else
    echo -e "${GREEN}✅ Size: $SIZE${NC}"
fi

# Check 6: Required files present
echo -ne "${BLUE}6. Checking required files...${NC} "
MISSING=0
REQUIRED_FILES=("extension/package.json" "extension/README.md" "extension/LICENSE")

for file in "${REQUIRED_FILES[@]}"; do
    if ! unzip -l "$VSIX_FILE" 2>/dev/null | grep -q "$file"; then
        echo -e "${RED}❌ Missing: $file${NC}"
        MISSING=1
    fi
done

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ All required files present${NC}"
fi

# Summary
echo -e "\n=================================================="
if [ ${EXIT_CODE:-0} -eq 0 ] && [ $TOKEN_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ VSIX PASSED SECURITY CHECKS${NC}"
    echo -e "${GREEN}Safe to distribute: $VSIX_FILE${NC}"
    exit 0
else
    echo -e "${RED}❌ VSIX FAILED SECURITY CHECKS${NC}"
    echo -e "${RED}DO NOT DISTRIBUTE THIS PACKAGE${NC}"
    echo -e "\nRecommended actions:"
    echo -e "1. Fix .vscodeignore to exclude sensitive files"
    echo -e "2. Remove .env files from workspace"
    echo -e "3. Clean build: rm -rf out/ *.vsix && npm run compile && npm run package"
    echo -e "4. Re-run this verification"
    exit 1
fi


