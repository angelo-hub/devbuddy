#!/bin/bash
# Quick reinstall script for DevBuddy extension

set -e

echo "📦 Compiling..."
npm run compile

echo "📦 Packaging..."
npm run package

echo "✅ Package ready!"
echo ""
echo "To install in Cursor:"
echo "1. Cmd+Shift+P"
echo "2. Type: Extensions: Install from VSIX"
echo "3. Select: cursor-monorepo-tools-0.0.1.vsix"
echo "4. Reload Window (Cmd+Shift+P → Developer: Reload Window)"
echo ""
echo "Or use Cursor command line (if available):"
echo "  cursor --install-extension cursor-monorepo-tools-0.0.1.vsix"

