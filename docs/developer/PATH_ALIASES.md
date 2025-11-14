# Path Alias Quick Reference

This document provides a quick reference for using the TypeScript path aliases in the DevBuddy project.

## Extension Code (src/)

### Available Aliases

```typescript
// Core features (free)
import { Something } from '@core/commands/tickets/refreshTickets';
import { BasicClient } from '@core/providers/linear/LinearClient';

// Pro features (premium)
import { generatePRSummary } from '@pro/commands/ai/generatePRSummary';
import { FeatureGate } from '@pro/licensing/featureGating';

// Shared utilities
import { getLogger } from '@shared/utils/logger';
import { GitAnalyzer } from '@shared/git/gitAnalyzer';
import { BaseTicketProvider } from '@shared/base/BaseTicketProvider';

// Providers
import { LinearClient } from '@providers/linear/LinearClient';
import { JiraClient } from '@providers/jira/cloud/JiraCloudClient';

// Commands
import { convertTodoToTicket } from '@commands/convertTodoToTicket';

// Chat
import { devBuddyParticipant } from '@chat/devBuddyParticipant';

// Views
import { LinearTicketsProvider } from '@views/linearTicketsProvider';

// Utils (legacy - prefer @shared)
import { logger } from '@utils/logger';
```

### Before vs After

**Before** (relative imports):
```typescript
import { getLogger } from '../../../shared/utils/logger';
import { GitAnalyzer } from '../../../shared/git/gitAnalyzer';
import { BaseTicketProvider } from '../../../shared/base/BaseTicketProvider';
```

**After** (alias imports):
```typescript
import { getLogger } from '@shared/utils/logger';
import { GitAnalyzer } from '@shared/git/gitAnalyzer';
import { BaseTicketProvider } from '@shared/base/BaseTicketProvider';
```

## Webview Code (webview-ui/src/)

### Available Aliases

```typescript
// Shared components
import { Button } from '@shared/components/Button';
import { useVSCode } from '@shared/hooks/useVSCode';
import { MessageType } from '@shared/types/messages';

// Core webviews (free)
import { BasicTicketPanel } from '@core/basic-ticket-panel/App';

// Pro webviews (premium)
import { StandupBuilder } from '@pro/standup-builder/App';
import { useLicense } from '@shared/hooks/useLicense';

// Linear-specific
import { LinearApp } from '@linear/ticket-panel/App';

// Jira-specific
import { JiraApp } from '@jira/ticket-panel/App';
```

### Before vs After

**Before** (relative imports):
```typescript
import { Button } from '../../shared/components/Button';
import { useVSCode } from '../../shared/hooks/useVSCode';
```

**After** (alias imports):
```typescript
import { Button } from '@shared/components/Button';
import { useVSCode } from '@shared/hooks/useVSCode';
```

## IDE Support

### VS Code IntelliSense

TypeScript path aliases work seamlessly with VS Code IntelliSense:

1. Start typing the alias: `import { ... } from '@shared/`
2. Press `Ctrl+Space` to see available modules
3. Navigate through the directory structure
4. Auto-import suggestions will use aliases

### Jump to Definition

- `Cmd/Ctrl + Click` on any alias import to jump to the file
- `F12` or right-click → "Go to Definition"
- Works exactly like relative imports

## Migration Tips

### 1. Gradual Migration

You don't need to migrate all imports at once. The aliases work alongside relative imports:

```typescript
// Both work fine together
import { getLogger } from '@shared/utils/logger';  // New alias
import { oldUtil } from '../utils/oldUtil';        // Old relative
```

### 2. Auto-Fix with IDE

Most modern IDEs can automatically update imports:

1. Rename/move a file
2. IDE will ask to update imports
3. Choose "Update imports" and specify alias format

### 3. Search and Replace

For bulk migration, you can use regex search/replace:

**Find:**
```regex
from ['"](\.\./)+shared/(.+)['"]
```

**Replace:**
```
from '@shared/$2'
```

## Build Configuration

### Extension Build

The extension uses native TypeScript compilation:

```bash
npm run compile        # Compile with aliases
npm run watch          # Watch mode
npm run type-check     # Type checking only
```

TypeScript automatically resolves aliases using `tsconfig.json` paths.

### Webview Build

The webviews use esbuild with a custom path alias plugin:

```bash
npm run compile:webview   # Build webviews
npm run watch:webview     # Watch mode
```

The `pathAliasPlugin` in `webview-ui/build.js` handles alias resolution.

## Troubleshooting

### "Cannot find module '@shared/...'"

**Cause:** TypeScript can't resolve the alias.

**Solution:**
1. Check `tsconfig.json` has correct `baseUrl` and `paths`
2. Restart TypeScript server: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
3. Reload VS Code window

### "Module not found" in webview build

**Cause:** esbuild alias plugin isn't resolving the path.

**Solution:**
1. Check `webview-ui/build.js` has `pathAliasPlugin` in plugins array
2. Verify alias matches one of: `@shared`, `@core`, `@pro`, `@linear`, `@jira`
3. Check file actually exists at the path

### Relative imports still work but aliases don't

**Cause:** TypeScript configuration may not be loaded.

**Solution:**
1. Make sure you're editing files inside `src/` (for extension) or `webview-ui/src/` (for webviews)
2. Check your file is not in `exclude` list of tsconfig.json
3. Run `npm run type-check` to verify TypeScript configuration

## Best Practices

### 1. Use Aliases for Deep Imports

```typescript
// ❌ Avoid: Deep relative imports
import { logger } from '../../../../shared/utils/logger';

// ✅ Use: Clean alias imports
import { logger } from '@shared/utils/logger';
```

### 2. Use Relative Imports for Siblings

```typescript
// ✅ Good: Relative for same directory
import { TicketHeader } from './TicketHeader';
import { TicketFooter } from './TicketFooter';

// ❌ Overkill: Alias for sibling files
import { TicketHeader } from '@pro/standup-builder/components/TicketHeader';
```

### 3. Group Imports Logically

```typescript
// External dependencies
import * as vscode from 'vscode';
import React from 'react';

// Alias imports (grouped by alias)
import { getLogger } from '@shared/utils/logger';
import { GitAnalyzer } from '@shared/git/gitAnalyzer';

import { FeatureGate } from '@pro/licensing/featureGating';

// Relative imports (local)
import { TicketHeader } from './TicketHeader';
import styles from './App.module.css';
```

### 4. Prefer @shared Over @utils

The `@utils` alias exists for backward compatibility, but new code should use `@shared`:

```typescript
// ❌ Deprecated: Using legacy @utils
import { logger } from '@utils/logger';

// ✅ Preferred: Using @shared
import { logger } from '@shared/utils/logger';
```

## Quick Commands

```bash
# Type checking (both extension and webviews)
npm run type-check

# Linting (checks alias usage)
npm run lint

# Validation (type-check + lint)
npm run validate

# Format code (will preserve aliases)
npm run format

# Check formatting
npm run format:check
```

## Additional Resources

- [PRO_CORE_ARCHITECTURE.md](./PRO_CORE_ARCHITECTURE.md) - Full architecture guide
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [esbuild Plugins](https://esbuild.github.io/plugins/)

