# Documentation Organization Guide

This directory contains all documentation for Linear Buddy organized by audience and purpose.

## 📂 Directory Structure

```
docs/
├── user-guides/          # User-facing documentation
│   ├── README.md        # Main user guide
│   ├── QUICKSTART.md    # Getting started guide
│   ├── USAGE.md         # How to use features
│   └── ...
│
├── features/            # Feature specifications & docs
│   ├── ai/             # AI-related features
│   ├── branches/       # Branch management
│   ├── tickets/        # Ticket management
│   └── todo-converter/ # TODO conversion features
│
├── developer/          # Developer/contributor docs
│   ├── DEVELOPMENT.md  # Development setup
│   ├── ARCHITECTURE.md # Technical architecture
│   ├── TESTING.md      # Testing guide
│   └── ...
│
├── planning/          # Planning & roadmap docs
│   ├── SPRINT_PLAN.md
│   ├── IDEAS.md
│   └── ROADMAP.md
│
└── archive/          # Historical/deprecated docs
    └── old-implementations/
```

## 📚 Documentation Types

### User Guides (docs/user-guides/)
**Audience:** End users of the extension  
**Purpose:** Help users understand and use features  
**Files:**
- README.md - Main documentation
- QUICKSTART.md - Quick start guide
- USAGE.md - Detailed usage instructions
- Feature-specific guides

### Features (docs/features/)
**Audience:** Users + developers  
**Purpose:** Document specific features  
**Organization:** By feature category
- AI features
- Branch management
- Ticket management
- TODO converter
- PR & Standup

### Developer Docs (docs/developer/)
**Audience:** Contributors & maintainers  
**Purpose:** Technical documentation  
**Files:**
- Architecture
- Development setup
- Testing
- API references
- Implementation details

### Planning (docs/planning/)
**Audience:** Project owner & contributors  
**Purpose:** Roadmap & planning  
**Files:**
- Sprint plans
- Feature ideas
- Roadmap
- Strategy documents

### Archive (docs/archive/)
**Audience:** Reference only  
**Purpose:** Keep old docs for reference  
**Files:** Deprecated or superseded documentation

---

## 📋 File Migration Map

### Root → User Guides
```
README.md              → (stays at root, symlink to docs/)
QUICKSTART.md          → docs/user-guides/
USAGE.md               → docs/user-guides/
LINEAR_BUDDY_GUIDE.md  → docs/user-guides/
MULTI_TICKET_GUIDE.md  → docs/user-guides/
HELP_QUICK_REFERENCE.md → docs/user-guides/
```

### Root → Features
```
# AI Features
AI_FEATURES_GUIDE.md           → docs/features/ai/
AI_MODEL_CONFIGURATION.md      → docs/features/ai/
AI_FALLBACK_QUICK_REFERENCE.md → docs/features/ai/
AI_PROMPT_IMPROVEMENTS.md      → docs/features/ai/

# Branch Features
BRANCH_CREATION_GUIDE.md       → docs/features/branches/
BRANCH_ASSOCIATION_FEATURE.md  → docs/features/branches/
ENHANCED_BRANCH_FEATURES.md    → docs/features/branches/

# Ticket Features
CREATE_TICKET_GUIDE.md         → docs/features/tickets/
CREATE_TICKET_FEATURE.md       → docs/features/tickets/

# TODO Converter
TODO_PERMALINK_FEATURE.md      → docs/features/todo-converter/
LINK_MULTIPLE_TODOS_FEATURE.md → docs/features/todo-converter/
ADD_MORE_TODOS_WORKFLOW.md     → docs/features/todo-converter/
TODO_TO_TICKET_FEATURE.md      → docs/features/todo-converter/

# PR & Standup
PR_DISPLAY_FEATURE.md          → docs/features/pr-standup/
PR_FEATURES_SUMMARY.md         → docs/features/pr-standup/
```

### Root → Developer
```
TESTING.md                     → docs/developer/
DEBUG_CONFIGURATIONS.md        → docs/developer/
DEBUG_QUICK_START.md           → docs/developer/
WEBVIEW_GUIDE.md              → docs/developer/
THEME_GUIDE.md                → docs/developer/
LINEAR_COLOR_REFERENCE.md     → docs/developer/
DESKTOP_APP_SUPPORT.md        → docs/developer/
```

### Root → Planning
```
SPRINT_PLAN_MULTI_PLATFORM.md → docs/planning/
IDEAS.md                      → docs/planning/
```

### Root → Archive
```
# Implementation summaries (historical)
AI_IMPLEMENTATION_SUMMARY.md
IMPLEMENTATION_SUMMARY.md
DEVELOPMENT_SUMMARY.md
ENHANCEMENT_SUMMARY.md
REACT_CONVERSION_SUMMARY.md
LINEAR_ENHANCEMENTS_SUMMARY.md
LINEAR_INTEGRATION_STATUS.md
SESSION_COMPLETE.md
COMPLETION_CHECKLIST.md

# UI improvements (archived)
BRANCH_UI_IMPROVEMENTS.md
TODO_CONVERTER_UI_IMPROVEMENTS.md
ICON_IMPROVEMENTS.md
DROPDOWN_IMPLEMENTATION.md
COMMENTS_AND_NAVIGATION.md

# Old implementations
BRANCH_ASSOCIATION_IMPLEMENTATION.md
AI_FALLBACK_IMPLEMENTATION.md
AI_FALLBACK_STRATEGY.md
CURSOR_API_WORKAROUND.md
SECURE_STORAGE_MIGRATION.md
WALKTHROUGH_IMPLEMENTATION.md
LINEAR_ONBOARDING_IMPROVEMENT.md

# Deprecated guides
LINEAR_VISUAL_GUIDE.md
LINEAR_ENHANCEMENTS_README.md
COMPLETE_FEATURE_SUMMARY.md
NEW_AI_FEATURES.md
SUBISSUES_FEATURE.md
TARGET_BRANCH_FEATURE.md
LINK_FORMAT_FEATURE.md
```

---

## 🔄 Migration Process

Run this script to organize everything:
```bash
./scripts/organize-docs.sh
```

Or manually:
1. Create directory structure
2. Move files to appropriate locations
3. Update internal links
4. Update README to point to new locations
5. Create DOCUMENTATION_INDEX.md in root

---

## 📖 Documentation Index (Root)

After migration, create a simple index at root:

```markdown
# Linear Buddy Documentation

Main documentation hub for Linear Buddy.

## Quick Links
- [Quick Start](docs/user-guides/QUICKSTART.md)
- [User Guide](docs/user-guides/README.md)
- [Feature Documentation](docs/features/)
- [Developer Guide](docs/developer/)

## For Users
- Getting Started
- Feature Guides
- Tips & Tricks

## For Developers
- Development Setup
- Architecture
- Contributing

## Planning
- Roadmap
- Sprint Plans
```

---

## 🏷️ File Naming Conventions

### User Guides
- `README.md` - Main guide
- `QUICKSTART.md` - Getting started
- `[feature]-guide.md` - Feature guides (lowercase)

### Features
- `[feature]-overview.md` - Feature overview
- `[feature]-guide.md` - How to use
- `[feature]-spec.md` - Technical spec

### Developer
- `ARCHITECTURE.md` - System architecture
- `DEVELOPMENT.md` - Dev setup
- `[component]-reference.md` - API references

### Planning
- `ROADMAP.md` - Product roadmap
- `SPRINT_PLAN.md` - Sprint plans
- `IDEAS.md` - Feature ideas

---

## 📝 Link Update Checklist

After moving files:
- [ ] Update links in README.md
- [ ] Update links in package.json (walkthrough media paths)
- [ ] Update links between documentation files
- [ ] Update .gitignore if needed
- [ ] Test all links
- [ ] Update CHANGELOG

---

## 🎯 Benefits

### Before
```
root/
├── README.md
├── 57+ other .md files (chaos)
└── src/
```

### After
```
root/
├── README.md (clean, links to docs/)
├── docs/
│   ├── user-guides/ (5-10 files)
│   ├── features/ (organized by category)
│   ├── developer/ (5-10 files)
│   ├── planning/ (3-5 files)
│   └── archive/ (30+ old files)
└── src/
```

**Result:**
- ✅ Easy to find relevant docs
- ✅ Clear audience separation
- ✅ Better for newcomers
- ✅ Professional structure
- ✅ Easier to maintain
- ✅ Better for AI agents (clear context)

---

**Next step:** Run the migration script or manually reorganize

