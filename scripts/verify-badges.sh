#!/bin/bash

# Script to verify README badges are working
# This checks if all badge URLs return valid responses

echo "🔍 Verifying README badges..."
echo ""

FAILED=0

# Badge 1: GitHub Release Version
echo "1️⃣  Checking GitHub Release badge..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://img.shields.io/github/v/release/angelo-hub/devbuddy?label=version")
if [ "$RESPONSE" = "200" ]; then
  echo "   ✅ GitHub Release badge: OK"
else
  echo "   ❌ GitHub Release badge: FAILED (HTTP $RESPONSE)"
  FAILED=$((FAILED + 1))
fi

# Badge 2: VS Code Marketplace Version
echo "2️⃣  Checking VS Code Marketplace Version badge..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://img.shields.io/visual-studio-marketplace/v/angelogirardi.dev-buddy")
if [ "$RESPONSE" = "200" ]; then
  echo "   ✅ VS Code Marketplace Version badge: OK"
else
  echo "   ❌ VS Code Marketplace Version badge: FAILED (HTTP $RESPONSE)"
  FAILED=$((FAILED + 1))
fi

# Badge 3: VS Code Marketplace Downloads
echo "3️⃣  Checking VS Code Marketplace Downloads badge..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://img.shields.io/visual-studio-marketplace/d/angelogirardi.dev-buddy")
if [ "$RESPONSE" = "200" ]; then
  echo "   ✅ VS Code Marketplace Downloads badge: OK"
else
  echo "   ❌ VS Code Marketplace Downloads badge: FAILED (HTTP $RESPONSE)"
  FAILED=$((FAILED + 1))
fi

# Badge 4: License Badge
echo "4️⃣  Checking License badge..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://img.shields.io/badge/license-MIT%20%2B%20Pro-blue")
if [ "$RESPONSE" = "200" ]; then
  echo "   ✅ License badge: OK"
else
  echo "   ❌ License badge: FAILED (HTTP $RESPONSE)"
  FAILED=$((FAILED + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if GitHub repo exists
echo ""
echo "🔗 Checking linked resources..."
echo ""

echo "5️⃣  Checking GitHub repository..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://github.com/angelo-hub/devbuddy")
if [ "$RESPONSE" = "200" ]; then
  echo "   ✅ GitHub repository: OK"
else
  echo "   ❌ GitHub repository: FAILED (HTTP $RESPONSE)"
  FAILED=$((FAILED + 1))
fi

echo "6️⃣  Checking VS Code Marketplace page..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://marketplace.visualstudio.com/items?itemName=angelogirardi.dev-buddy")
if [ "$RESPONSE" = "200" ]; then
  echo "   ✅ VS Code Marketplace page: OK"
else
  echo "   ❌ VS Code Marketplace page: FAILED (HTTP $RESPONSE)"
  echo "   ⚠️  This is expected if the extension hasn't been published yet"
  FAILED=$((FAILED + 1))
fi

echo "7️⃣  Checking GitHub releases page..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://github.com/angelo-hub/devbuddy/releases")
if [ "$RESPONSE" = "200" ]; then
  echo "   ✅ GitHub releases page: OK"
else
  echo "   ❌ GitHub releases page: FAILED (HTTP $RESPONSE)"
  FAILED=$((FAILED + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✅ All badges verified successfully!"
  exit 0
else
  echo "⚠️  $FAILED check(s) failed"
  echo ""
  echo "💡 Common issues:"
  echo "   - Marketplace badges fail if extension not published yet"
  echo "   - Release badge shows 'no releases' if no GitHub release created"
  echo "   - License badge needs LICENSE file in repo"
  exit 1
fi

