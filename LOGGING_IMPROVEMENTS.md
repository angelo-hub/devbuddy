# Logging System Improvements

## Summary

Implemented a comprehensive logging system with **OutputChannel** support and **debug mode** for better visibility and troubleshooting.

## Changes Made

### 1. Created Logger Utility (`src/utils/logger.ts`)

**Features:**
- ✅ **Singleton pattern** for centralized logging
- ✅ **OutputChannel** - Shows up in VS Code's Output panel dropdown as "Linear Buddy"
- ✅ **Debug mode** - Configurable via settings to show detailed logs
- ✅ **Log levels** - info, debug, warn, error, success
- ✅ **Timestamps** - All logs include HH:MM:SS timestamps
- ✅ **Auto-show** - Automatically opens Output panel when debug mode is enabled
- ✅ **Configuration listener** - Reacts to settings changes in real-time

**Log Methods:**
```typescript
logger.info("message")     // Always shown - general information
logger.debug("message")    // Only in debug mode - detailed tracing
logger.warn("message")     // Always shown - warnings
logger.error("msg", error) // Always shown - errors with stack traces
logger.success("message")  // Always shown - successful operations
logger.divider("title")    // Visual section dividers
```

---

### 2. Added Debug Mode Configuration (`package.json`)

**New Setting:** `linearBuddy.debugMode`
- **Type:** Boolean (default: false)
- **Description:** Enable debug logging for troubleshooting
- **When enabled:**
  - Shows detailed logs in "Linear Buddy" Output channel
  - Automatically opens the Output panel
  - Logs all API calls, AI operations, and git commands

**How to Enable:**
1. Open VS Code Settings
2. Search for "Linear Buddy Debug"
3. Check "Enable debug logging"

---

### 3. Updated All Files to Use Logger

Replaced **46+ console.log statements** across 6 files:

#### Files Updated:
1. ✅ `src/extension.ts` - Extension lifecycle and commands
2. ✅ `src/utils/aiSummarizer.ts` - AI model initialization and summarization
3. ✅ `src/views/linearTicketsProvider.ts` - Ticket tree view and auto-refresh
4. ✅ `src/views/linearTicketPanel.ts` - Webview panel state updates
5. ✅ `src/utils/linearClient.ts` - Linear API queries and responses
6. ✅ `src/utils/branchAssociationManager.ts` - Branch associations and cleanup

#### Log Level Strategy:
- **info** - User-facing actions (extension activation, token migration, associations)
- **debug** - Internal operations (auto-refresh, model selection, queries)
- **success** - Successful completions (AI summary generated, model selected)
- **warn** - Non-fatal issues (model family not found, fallback used)
- **error** - Failures with stack traces (API errors, model initialization failed)

---

### 4. Improved Log Messages

**Before:**
```typescript
console.log("[Monorepo Tools] Requested model: gpt-4o, Family: gpt-4o")
console.log("[Linear Buddy] Auto-refreshing tickets...")
console.error("[Linear Buddy] Failed to fetch issues:", error)
```

**After:**
```typescript
logger.debug("Requested model: gpt-4o, Family: gpt-4o")
logger.debug("Auto-refreshing tickets...")
logger.error("Failed to fetch issues", error)
```

**Benefits:**
- Cleaner messages (no prefix clutter)
- Consistent formatting with timestamps
- Proper error handling with stack traces
- Debug vs. production log separation

---

## User Benefits

### For End Users:
1. **Output Channel** - Easy access to logs via Output dropdown (like Git, ESLint, etc.)
2. **Production Mode** - Only important messages shown by default
3. **Debug Mode** - Detailed logging when troubleshooting issues
4. **Better Support** - Easier to provide logs when reporting bugs

### For Developers:
1. **Centralized Logging** - Single source of truth for all logs
2. **Type-Safe** - Full TypeScript support with autocomplete
3. **Consistent Format** - All logs follow the same structure
4. **Easy Debugging** - Just enable debug mode in settings

---

## Usage Examples

### Viewing Logs:
1. Open VS Code Output panel (`Cmd+Shift+U` or `View > Output`)
2. Select "Linear Buddy" from the dropdown
3. See all extension activity in real-time

### Enabling Debug Mode:
1. Open Settings (`Cmd+,`)
2. Search for "Linear Buddy Debug Mode"
3. Enable the checkbox
4. Output panel opens automatically with detailed logs

### Log Output Example:
```
[10:30:15] [INFO] Linear Buddy extension is now active
[10:30:15] [DEBUG] Tree view became visible, triggering background refresh
[10:30:16] [DEBUG] Background refresh completed - data preloaded
[10:30:20] [✓ SUCCESS] Auto-selected model: copilot-gpt-4o (vendor: copilot, family: gpt-4o)
[10:30:25] [DEBUG] Sending PR request to model: copilot-gpt-4o
[10:30:28] [✓ SUCCESS] Successfully generated PR summary
```

---

## Technical Implementation

### Logger Singleton Pattern:
```typescript
// Get logger instance anywhere in the codebase
import { getLogger } from "./utils/logger";

const logger = getLogger();
logger.info("Extension activated");
```

### Configuration Listener:
```typescript
// Automatically reacts to settings changes
vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration("linearBuddy.debugMode")) {
    this.loadDebugMode();
  }
});
```

### Proper Disposal:
```typescript
// Output channel is added to extension subscriptions
context.subscriptions.push(logger.getOutputChannel());
```

---

## Testing

### Compilation:
- ✅ TypeScript compiled successfully
- ✅ No linter errors
- ✅ All imports resolved correctly

### Files Modified:
- 7 files created/modified
- 46+ console.log statements replaced
- 0 breaking changes

---

## Future Enhancements

Potential improvements for future iterations:

1. **Log File Export** - Save logs to file for bug reports
2. **Log Filtering** - Filter by log level or component
3. **Performance Metrics** - Track operation timing
4. **Remote Logging** - Optional telemetry (opt-in only)
5. **Log Buffer** - Keep last N logs in memory for quick access

---

## Migration Notes

### For Existing Code:
No breaking changes - all existing functionality preserved.

### For New Features:
Always use the logger instead of console.log:
```typescript
// ❌ Don't do this
console.log("[My Feature] Starting...");

// ✅ Do this instead
import { getLogger } from "../utils/logger";
const logger = getLogger();
logger.info("Starting my feature");
logger.debug("Detailed trace info");
```

---

## Related Files

- `src/utils/logger.ts` - Logger implementation
- `package.json` - Debug mode configuration
- `src/extension.ts` - Logger initialization
- All source files using `getLogger()`

---

**Date:** November 7, 2025  
**Version:** 0.1.0  
**Status:** ✅ Complete and tested

