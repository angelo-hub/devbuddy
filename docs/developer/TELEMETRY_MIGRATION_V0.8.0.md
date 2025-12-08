# Telemetry Pattern Migration - v0.8.0+

## 🔄 **What Changed**

### **Before (v0.7.1 and earlier):**
- ❌ Telemetry was **opt-in only**
- ❌ Users had to explicitly enable it
- ❌ Showed an opt-in prompt
- ❌ Separate from VS Code global setting

### **After (v0.8.0+):**
- ✅ Telemetry **follows VS Code's global setting** by default
- ✅ Users can **opt-out** via `devBuddy.telemetry.optOut` setting
- ✅ No intrusive prompts
- ✅ Respects VS Code user preferences

---

## 📊 **New Telemetry Behavior**

### **Default Behavior**

DevBuddy now follows the standard VS Code extension pattern:

1. **Check VS Code Global Setting** (`telemetry.telemetryLevel`)
   - `all` → Telemetry enabled ✅
   - `error` → Only errors (treated as disabled for now)
   - `crash` → Only crashes (treated as disabled for now)
   - `off` → Telemetry disabled ❌

2. **Check DevBuddy Opt-Out** (`devBuddy.telemetry.optOut`)
   - If `true` → Telemetry disabled even if VS Code allows it
   - If `false` (default) → Follow VS Code setting

### **Decision Flow**

```
Is devBuddy.telemetry.optOut = true?
├─ YES → ❌ Telemetry DISABLED
└─ NO → Check VS Code telemetry.telemetryLevel
    ├─ 'all' → ✅ Telemetry ENABLED
    └─ 'error', 'crash', 'off' → ❌ Telemetry DISABLED
```

---

## 🔧 **Migration Logic**

### **Automatic Migration**

For users upgrading from v0.7.1 or earlier:

```typescript
// In telemetryManager.ts
private async migrateFromOptInPattern(context: vscode.ExtensionContext): Promise<void> {
  const hasMigrated = context.globalState.get<boolean>("devBuddy.telemetryMigrated", false);
  
  if (hasMigrated) {
    return; // Already migrated
  }

  const hadOldOptIn = context.globalState.get<boolean>("devBuddy.telemetryAsked", false);
  const wasEnabled = this.config?.enabled || false;
  
  if (hadOldOptIn && !wasEnabled) {
    // User explicitly declined → Set opt-out flag
    await config.update("telemetry.optOut", true, vscode.ConfigurationTarget.Global);
  }
  // If they opted in or were never asked, follow VS Code setting (default)
  
  await context.globalState.update("devBuddy.telemetryMigrated", true);
}
```

### **Migration Scenarios**

| Old Behavior (v0.7.1) | Migration Action | New Behavior (v0.8.0+) |
|-----------------------|------------------|------------------------|
| Never asked about telemetry | None | Follow VS Code setting (default) |
| Explicitly opted in | None | Follow VS Code setting (likely enabled) |
| Explicitly opted out | Set `telemetry.optOut = true` | Respect opt-out choice |

---

## ⚙️ **Configuration Changes**

### **Removed Settings**

```json
{
  "devBuddy.telemetry.enabled": false,        // ❌ REMOVED
  "devBuddy.telemetry.showPrompt": true       // ❌ REMOVED
}
```

### **New Settings**

```json
{
  "devBuddy.telemetry.optOut": false          // ✅ NEW (default: false)
}
```

### **How to Opt Out**

**Method 1: DevBuddy Settings**
```bash
# Open VS Code Settings
Cmd/Ctrl + ,

# Search for:
devBuddy telemetry opt out

# Enable the checkbox
```

**Method 2: settings.json**
```json
{
  "devBuddy.telemetry.optOut": true
}
```

**Method 3: Command Palette**
```bash
# Cmd/Ctrl + Shift + P
DevBuddy: Manage Telemetry
→ Toggle Telemetry → Opt Out
```

### **How to Check Status**

**Command Palette:**
```bash
DevBuddy: Manage Telemetry
→ View Statistics
```

**Shows:**
- VS Code telemetry level
- DevBuddy opt-out status
- Telemetry active: Yes/No
- Events sent count

---

## 📝 **Code Changes Summary**

### **TelemetryManager.ts**

```typescript
// OLD: Check internal opt-in flag
public isEnabled(): boolean {
  return this.config?.enabled || false;
}

// NEW: Check VS Code setting + opt-out flag
public isEnabled(): boolean {
  const optOut = vscode.workspace.getConfiguration('devBuddy')
    .get<boolean>('telemetry.optOut', false);
  
  if (optOut) return false;
  
  const telemetryLevel = vscode.workspace.getConfiguration('telemetry')
    .get<string>('telemetryLevel', 'all');
  
  return telemetryLevel === 'all';
}
```

### **package.json**

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "devBuddy.telemetry.optOut": {
          "type": "boolean",
          "default": false,
          "description": "Opt out of DevBuddy telemetry even if VS Code telemetry is enabled"
        }
      }
    }
  }
}
```

---

## 🎯 **Benefits of New Approach**

### **For Users**

1. ✅ **Respects VS Code Preferences**
   - No need to manage separate telemetry settings per extension
   - One global control for all telemetry

2. ✅ **Granular Control**
   - Can opt out of DevBuddy specifically
   - Keep VS Code telemetry for other extensions

3. ✅ **No Intrusive Prompts**
   - No modal dialogs asking for opt-in
   - Better user experience

4. ✅ **Privacy-First**
   - Telemetry off by default if VS Code is off
   - Easy opt-out without losing data

### **For Us (Developers)**

1. ✅ **Better Data Collection**
   - More users will have telemetry enabled (default VS Code setting)
   - Better understanding of real usage patterns

2. ✅ **Industry Standard**
   - Follows Microsoft's recommended pattern
   - Consistent with other VS Code extensions

3. ✅ **Easier Maintenance**
   - Less custom opt-in logic
   - Leverages VS Code's built-in telemetry infrastructure

4. ✅ **Compliance**
   - Still GDPR compliant (can export/delete data)
   - Respects user privacy choices

---

## 🧪 **Testing the Migration**

### **Test Case 1: New User (Fresh Install v0.8.0+)**

```
1. Install DevBuddy v0.8.0
2. Check VS Code telemetry setting
   - If 'all' → Telemetry enabled ✅
   - If 'off' → Telemetry disabled ❌
3. No prompts shown
4. Can opt out via settings
```

### **Test Case 2: Existing User (Never Opted In)**

```
1. Upgrade from v0.7.1 → v0.8.0
2. Migration runs automatically
3. No opt-out flag set
4. Now follows VS Code setting
5. Telemetry likely enabled (if VS Code telemetry is 'all')
```

### **Test Case 3: Existing User (Opted Out)**

```
1. Upgrade from v0.7.1 → v0.8.0
2. Migration detects previous opt-out
3. Sets devBuddy.telemetry.optOut = true
4. Telemetry remains disabled ❌
5. User choice respected
```

### **Test Case 4: Existing User (Opted In)**

```
1. Upgrade from v0.7.1 → v0.8.0
2. Migration runs
3. No opt-out flag set
4. Follows VS Code setting
5. Telemetry remains enabled ✅
```

---

## 📚 **Documentation Updates**

### **Files to Update**

- [x] `src/shared/utils/telemetryManager.ts` - Core logic
- [x] `src/extension.ts` - Management UI
- [x] `package.json` - Configuration
- [ ] `docs/features/telemetry/TELEMETRY_GUIDE.md` - User guide
- [ ] `README.md` - Main readme
- [ ] `CHANGELOG.md` - Version notes

### **User-Facing Changes**

Update all documentation to reflect:
1. Telemetry follows VS Code global setting
2. How to opt out via `devBuddy.telemetry.optOut`
3. No more opt-in prompts
4. Migration behavior for existing users

---

## ❓ **FAQ**

### **Will this enable telemetry for users who opted out before?**

No. The migration logic detects users who explicitly opted out and sets the `telemetry.optOut` flag to maintain their choice.

### **What if I want to completely disable telemetry?**

Two options:
1. **Disable VS Code telemetry** (affects all extensions)
   - Settings → `telemetry.telemetryLevel` → `off`

2. **Disable DevBuddy telemetry only**
   - Settings → `devBuddy.telemetry.optOut` → `true`

### **Can I still export/delete my data?**

Yes! All GDPR compliance features remain:
- `DevBuddy: Export My Telemetry Data`
- `DevBuddy: Delete My Telemetry Data`

### **What data is collected?**

Same as before - see `TELEMETRY_GUIDE.md` for full details:
- Feature usage (commands executed)
- Error types (not content)
- Performance metrics
- Extension version & platform
- Anonymous user ID

**Never collected:**
- Code or file contents
- Personal information
- API tokens
- Ticket details

---

## 🚀 **Release Notes (v0.8.0)**

### **Breaking Changes**

- Telemetry now follows VS Code's global telemetry setting instead of opt-in only
- Removed `devBuddy.telemetry.enabled` setting
- Removed `devBuddy.telemetry.showPrompt` setting
- Added `devBuddy.telemetry.optOut` setting

### **Migration**

- Users upgrading from v0.7.1 or earlier will be automatically migrated
- Previous opt-out choices are respected
- No action needed from users

### **New Features**

- Respects VS Code global telemetry preferences
- Easier opt-out via dedicated setting
- Improved telemetry management UI
- Shows VS Code telemetry level in status

---

**Version:** 0.8.0  
**Migration Date:** November 21, 2025  
**Author:** Angelo Girardi



