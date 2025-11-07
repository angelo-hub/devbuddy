#!/bin/bash

# Linear Buddy Documentation Reorganization Script
# This script moves markdown files from root to organized directories

set -e  # Exit on error

echo "🗂️  Linear Buddy Documentation Reorganization"
echo "==========================================="
echo ""

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p docs/user-guides
mkdir -p docs/features/ai
mkdir -p docs/features/branches
mkdir -p docs/features/tickets
mkdir -p docs/features/todo-converter
mkdir -p docs/features/pr-standup
mkdir -p docs/developer
mkdir -p docs/planning
mkdir -p docs/archive

echo "✅ Directories created"
echo ""

# Function to move file safely
move_file() {
    local source="$1"
    local dest="$2"
    
    if [ -f "$source" ]; then
        echo "   Moving: $source → $dest"
        mv "$source" "$dest"
    else
        echo "   Skip (not found): $source"
    fi
}

# Move User Guides
echo "📚 Moving user guides..."
move_file "QUICKSTART.md" "docs/user-guides/"
move_file "USAGE.md" "docs/user-guides/"
move_file "LINEAR_BUDDY_GUIDE.md" "docs/user-guides/"
move_file "MULTI_TICKET_GUIDE.md" "docs/user-guides/"
move_file "HELP_QUICK_REFERENCE.md" "docs/user-guides/"

# Move AI Features
echo "🤖 Moving AI feature docs..."
move_file "AI_FEATURES_GUIDE.md" "docs/features/ai/"
move_file "AI_MODEL_CONFIGURATION.md" "docs/features/ai/"
move_file "AI_FALLBACK_QUICK_REFERENCE.md" "docs/features/ai/"
move_file "AI_PROMPT_IMPROVEMENTS.md" "docs/features/ai/"

# Move Branch Features
echo "🌿 Moving branch feature docs..."
move_file "BRANCH_CREATION_GUIDE.md" "docs/features/branches/"
move_file "BRANCH_ASSOCIATION_FEATURE.md" "docs/features/branches/"
move_file "ENHANCED_BRANCH_FEATURES.md" "docs/features/branches/"

# Move Ticket Features
echo "🎫 Moving ticket feature docs..."
move_file "CREATE_TICKET_GUIDE.md" "docs/features/tickets/"
move_file "CREATE_TICKET_FEATURE.md" "docs/features/tickets/"

# Move TODO Converter Features
echo "✅ Moving TODO converter docs..."
move_file "TODO_PERMALINK_FEATURE.md" "docs/features/todo-converter/"
move_file "LINK_MULTIPLE_TODOS_FEATURE.md" "docs/features/todo-converter/"
move_file "ADD_MORE_TODOS_WORKFLOW.md" "docs/features/todo-converter/"
move_file "TODO_TO_TICKET_FEATURE.md" "docs/features/todo-converter/"

# Move PR & Standup Features
echo "📊 Moving PR & standup docs..."
move_file "PR_DISPLAY_FEATURE.md" "docs/features/pr-standup/"
move_file "PR_FEATURES_SUMMARY.md" "docs/features/pr-standup/"

# Move Developer Docs
echo "⚙️  Moving developer docs..."
move_file "TESTING.md" "docs/developer/"
move_file "DEBUG_CONFIGURATIONS.md" "docs/developer/"
move_file "DEBUG_QUICK_START.md" "docs/developer/"
move_file "WEBVIEW_GUIDE.md" "docs/developer/"
move_file "THEME_GUIDE.md" "docs/developer/"
move_file "LINEAR_COLOR_REFERENCE.md" "docs/developer/"
move_file "DESKTOP_APP_SUPPORT.md" "docs/developer/"

# Move Planning Docs
echo "📋 Moving planning docs..."
move_file "SPRINT_PLAN_MULTI_PLATFORM.md" "docs/planning/"
move_file "IDEAS.md" "docs/planning/"

# Archive Old Implementation Docs
echo "📦 Archiving old implementation docs..."
move_file "AI_IMPLEMENTATION_SUMMARY.md" "docs/archive/"
move_file "IMPLEMENTATION_SUMMARY.md" "docs/archive/"
move_file "DEVELOPMENT_SUMMARY.md" "docs/archive/"
move_file "ENHANCEMENT_SUMMARY.md" "docs/archive/"
move_file "REACT_CONVERSION_SUMMARY.md" "docs/archive/"
move_file "LINEAR_ENHANCEMENTS_SUMMARY.md" "docs/archive/"
move_file "LINEAR_INTEGRATION_STATUS.md" "docs/archive/"
move_file "SESSION_COMPLETE.md" "docs/archive/"
move_file "COMPLETION_CHECKLIST.md" "docs/archive/"

# Archive UI Improvements
echo "🎨 Archiving UI improvement docs..."
move_file "BRANCH_UI_IMPROVEMENTS.md" "docs/archive/"
move_file "TODO_CONVERTER_UI_IMPROVEMENTS.md" "docs/archive/"
move_file "ICON_IMPROVEMENTS.md" "docs/archive/"
move_file "DROPDOWN_IMPLEMENTATION.md" "docs/archive/"
move_file "COMMENTS_AND_NAVIGATION.md" "docs/archive/"

# Archive Old Implementations
echo "🗄️  Archiving old implementation details..."
move_file "BRANCH_ASSOCIATION_IMPLEMENTATION.md" "docs/archive/"
move_file "AI_FALLBACK_IMPLEMENTATION.md" "docs/archive/"
move_file "AI_FALLBACK_STRATEGY.md" "docs/archive/"
move_file "CURSOR_API_WORKAROUND.md" "docs/archive/"
move_file "SECURE_STORAGE_MIGRATION.md" "docs/archive/"
move_file "WALKTHROUGH_IMPLEMENTATION.md" "docs/archive/"
move_file "LINEAR_ONBOARDING_IMPROVEMENT.md" "docs/archive/"

# Archive Deprecated Guides
echo "📚 Archiving deprecated guides..."
move_file "LINEAR_VISUAL_GUIDE.md" "docs/archive/"
move_file "LINEAR_ENHANCEMENTS_README.md" "docs/archive/"
move_file "COMPLETE_FEATURE_SUMMARY.md" "docs/archive/"
move_file "NEW_AI_FEATURES.md" "docs/archive/"
move_file "SUBISSUES_FEATURE.md" "docs/archive/"
move_file "TARGET_BRANCH_FEATURE.md" "docs/archive/"
move_file "LINK_FORMAT_FEATURE.md" "docs/archive/"
move_file "DOCUMENTATION_INDEX.md" "docs/archive/"

# Keep at root
echo "🏠 Keeping at root:"
echo "   - README.md (main entry point)"
echo "   - RELEASE_NOTES_v0.1.0.md (release notes)"
echo "   - example-pr-template.md (template)"

echo ""
echo "✅ Documentation reorganization complete!"
echo ""
echo "📂 New structure:"
echo "   docs/"
echo "   ├── user-guides/     ($(ls docs/user-guides 2>/dev/null | wc -l | tr -d ' ') files)"
echo "   ├── features/        (organized by category)"
echo "   ├── developer/       ($(ls docs/developer 2>/dev/null | wc -l | tr -d ' ') files)"
echo "   ├── planning/        ($(ls docs/planning 2>/dev/null | wc -l | tr -d ' ') files)"
echo "   └── archive/         ($(ls docs/archive 2>/dev/null | wc -l | tr -d ' ') files)"
echo ""
echo "📋 Next steps:"
echo "   1. Review the new structure"
echo "   2. Update links in README.md"
echo "   3. Test that all links work"
echo "   4. Commit the changes"
echo ""
echo "   Run: git status"
echo ""

