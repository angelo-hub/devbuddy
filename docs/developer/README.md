# Developer Documentation

Welcome to the DevBuddy developer documentation! This directory contains comprehensive guides for understanding and contributing to DevBuddy.

## 📚 Documentation Index

### Getting Started

- **[DEBUG_QUICK_START.md](./DEBUG_QUICK_START.md)** - Quick debugging guide
- **[INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md)** - Summary of recent infrastructure setup (ESLint, path aliases, etc.)

### Architecture & Design

- **[PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md)** - Complete guide to pro/core feature organization
  - Directory structure
  - Feature gating patterns
  - License management
  - Migration strategy (7 phases)
  - Code examples

- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Visual diagrams of the architecture
  - Extension structure
  - Webview structure
  - Feature gating flow
  - User experience flow
  - Feature comparison table

- **[PATH_ALIASES.md](./PATH_ALIASES.md)** - Path alias quick reference
  - All available aliases
  - Usage examples
  - IDE integration
  - Migration tips
  - Troubleshooting

### UI Development

- **[WEBVIEW_GUIDE.md](./WEBVIEW_GUIDE.md)** - Webview development guide
- **[THEME_GUIDE.md](./THEME_GUIDE.md)** - VS Code theming and CSS

### Testing

- **[TESTING.md](./TESTING.md)** - Testing strategy and guidelines

## 🎯 Quick Links by Task

### "I want to understand the codebase"

1. Start with [PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md) - Overview of entire system
2. Then [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) - Visual representation
3. Finally [PATH_ALIASES.md](./PATH_ALIASES.md) - How imports work

### "I want to add a new feature"

1. Read [PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md) - Understand where features go
2. Check [PATH_ALIASES.md](./PATH_ALIASES.md) - Learn import patterns
3. Review [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md) - Available tooling

### "I want to work on UI/webviews"

1. Read [WEBVIEW_GUIDE.md](./WEBVIEW_GUIDE.md) - Webview basics
2. Check [THEME_GUIDE.md](./THEME_GUIDE.md) - Styling guidelines
3. Review [PATH_ALIASES.md](./PATH_ALIASES.md) - Import patterns for React

### "I need to debug something"

1. Start with [DEBUG_QUICK_START.md](./DEBUG_QUICK_START.md) - Quick debugging
2. Enable debug mode: Settings → `devBuddy.debugMode` → `true`
3. Check Output panel → "DevBuddy" channel

### "I'm setting up my dev environment"

1. Read [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md) - Latest setup
2. Run `npm install` to get all dependencies
3. Run `npm run validate` to check everything works

### "I want to implement pro licensing"

1. **Must read:** [PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md) - Complete implementation guide
2. Review [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) - See feature gating flow
3. Follow the 7-phase migration strategy

## 📖 Documentation by Type

### Architecture Documents
- [PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md) - Pro/core feature organization
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) - Visual architecture diagrams

### Setup & Configuration
- [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md) - Infrastructure setup summary
- [PATH_ALIASES.md](./PATH_ALIASES.md) - TypeScript path aliases
- [REACT_ESLINT.md](./REACT_ESLINT.md) - React & Hooks ESLint rules
- [CI_CD.md](./CI_CD.md) - CI/CD configuration and required checks

### Development Guides
- [WEBVIEW_GUIDE.md](./WEBVIEW_GUIDE.md) - Webview development
- [THEME_GUIDE.md](./THEME_GUIDE.md) - Theming and styling
- [DEBUG_QUICK_START.md](./DEBUG_QUICK_START.md) - Debugging
- [TESTING.md](./TESTING.md) - Testing

## Recent Updates

### Infrastructure Setup (Latest)

We've recently completed a major infrastructure upgrade:

✅ **ESLint Configuration**
- TypeScript support
- Separate rules for extension and webview code
- Auto-fix available

✅ **Prettier Configuration**
- Consistent code formatting
- 100-char line width
- Auto-format on save

✅ **TypeScript Path Aliases**
- Clean imports: `@core/*`, `@pro/*`, `@shared/*`
- Works in both extension and webviews
- IDE IntelliSense support

✅ **Enhanced NPM Scripts**
- `npm run validate` - Type-check + lint
- `npm run lint:fix` - Auto-fix issues
- `npm run format` - Format all code

✅ **Comprehensive Documentation**
- [PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md) - 400+ line architecture guide
- [PATH_ALIASES.md](./PATH_ALIASES.md) - Complete alias reference
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) - Visual diagrams

**Status:** Ready for pro/core migration! 🚀

See [INFRASTRUCTURE_SETUP.md](./INFRASTRUCTURE_SETUP.md) for complete details.

## 🏗️ Proposed Pro/Core Architecture

DevBuddy is being reorganized into a tiered licensing model:

### Core (Free)
- Basic ticket viewing
- Status updates
- Branch creation
- Platform support (Linear, Jira)

### Pro (Premium)
- AI-powered features (PR summaries, standups)
- Advanced automation
- Analytics and insights
- TODO to ticket converter
- Third-party integrations

### Directory Structure

```
src/
├── core/           # Free features
├── pro/            # Premium features
└── shared/         # Shared utilities

webview-ui/src/
├── core/           # Free webviews
├── pro/            # Premium webviews
└── shared/         # Shared React components
```

See [PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md) for the complete plan.

## 🛠️ Development Workflow

### Before You Start

```bash
# 1. Install dependencies
npm install

# 2. Validate everything works
npm run validate
```

### Daily Development

```bash
# Compile extension
npm run compile

# Compile webviews
npm run compile:webview

# Watch mode (auto-compile on changes)
npm run watch          # Extension
npm run watch:webview  # Webviews
```

### Before Committing

```bash
# Run all checks
npm run validate

# Format code
npm run format

# Fix linting issues
npm run lint:fix
```

### Debugging

1. Press **F5** to launch Extension Development Host
2. Set breakpoints in TypeScript files
3. Use Debug Console for runtime inspection
4. Enable debug mode: Settings → `devBuddy.debugMode` → `true`

See [DEBUG_QUICK_START.md](./DEBUG_QUICK_START.md) for more.

## 📝 Code Style

### ESLint

Configuration: `.eslintrc.json`

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Prettier

Configuration: `.prettierrc`

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### TypeScript

- Strict mode enabled
- No `any` types (use proper typing)
- Use path aliases for clean imports
- Document complex functions with JSDoc

### Imports

Use path aliases for clean, maintainable code:

```typescript
// ✅ Good: Clean alias imports
import { getLogger } from '@shared/utils/logger';
import { LinearClient } from '@core/providers/linear/LinearClient';
import { generatePRSummary } from '@pro/commands/ai/generatePRSummary';

// ❌ Bad: Deep relative imports
import { getLogger } from '../../../shared/utils/logger';
import { LinearClient } from '../../../core/providers/linear/LinearClient';
```

See [PATH_ALIASES.md](./PATH_ALIASES.md) for complete reference.

## 🧪 Testing

See [TESTING.md](./TESTING.md) for comprehensive testing guide.

### Quick Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Full validation
npm run validate
```

### Manual Testing

1. Press **F5** to launch Extension Development Host
2. Test features in the new VS Code window
3. Check Output panel → "DevBuddy" for logs
4. Enable debug mode for detailed logging

## 🎨 UI Development

### Webviews

See [WEBVIEW_GUIDE.md](./WEBVIEW_GUIDE.md) for complete guide.

**Quick tips:**
- React 18 with hooks
- CSS Modules for scoping
- VS Code theme variables
- Message-passing for communication

### Theming

See [THEME_GUIDE.md](./THEME_GUIDE.md) for theming guide.

**Key colors:**
```css
var(--vscode-foreground)          /* Text */
var(--vscode-button-background)   /* Buttons */
var(--vscode-input-background)    /* Inputs */
```

## 📦 Building & Packaging

```bash
# Create .vsix package
npm run package

# Install locally for testing
./reinstall.sh
```

## 🤝 Contributing

### Pull Request Checklist

- [ ] Code follows style guide
- [ ] All tests pass
- [ ] `npm run validate` passes
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation updated if needed
- [ ] Used path aliases for new imports
- [ ] Feature added to appropriate tier (core/pro)

### Adding Features

1. Determine if feature is Core (free) or Pro (premium)
2. Place in appropriate directory (`src/core/` or `src/pro/`)
3. Use path aliases for imports
4. Add feature gating if Pro feature
5. Update documentation
6. Test thoroughly

See [PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md) for detailed guidance.

## 🆘 Getting Help

### Documentation Issues

If something in the docs is unclear:
1. Check related docs (see links above)
2. Look at code examples in the files
3. Ask in GitHub Issues

### Development Issues

1. Check [DEBUG_QUICK_START.md](./DEBUG_QUICK_START.md)
2. Enable debug mode and check logs
3. Run `npm run validate` to catch issues
4. Search GitHub Issues

### Architecture Questions

1. Read [PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md)
2. Check [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)
3. Review existing code for patterns

## 📊 Project Status

### ✅ Completed
- Multi-platform architecture (Linear, Jira)
- AI-powered features (PR summaries, standups)
- Branch management and associations
- Chat participant integration
- TODO to ticket converter
- Telemetry system
- **Infrastructure setup (ESLint, path aliases, documentation)**

### 🚧 In Progress
- Pro/core feature organization
- License management system
- Feature gating implementation

### 📋 Planned
- Additional platforms (Monday.com, ClickUp)
- Enhanced AI features
- Team collaboration features
- Advanced analytics

See [PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md) for migration roadmap.

## 🔗 Related Documentation

### In This Directory
- All files listed in "Documentation Index" above

### Root Directory
- [README.md](../../README.md) - User-facing documentation
- [AGENTS.md](../../AGENTS.md) - AI agent development guide
- [LICENSE](../../LICENSE) - License information

### Features Documentation
- [docs/features/](../features/) - Feature-specific docs

### User Guides
- [docs/user-guides/](../user-guides/) - End-user documentation

---

**Happy coding! 🚀**

For questions or issues, please open a GitHub Issue.

