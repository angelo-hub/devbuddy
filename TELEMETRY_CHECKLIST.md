# Telemetry Setup Checklist

Use this checklist to complete the telemetry setup for Linear Buddy.

## ✅ Completed (By AI)

- [x] Created `telemetryManager.ts` with VSCode native telemetry
- [x] Updated `extension.ts` to initialize and use telemetry
- [x] Added telemetry configuration to `package.json`
- [x] Added telemetry management commands
- [x] Created `.env.example` template
- [x] Verified `.gitignore` excludes `.env` files
- [x] Created comprehensive documentation:
  - [x] User guide (`TELEMETRY_GUIDE.md`)
  - [x] Developer guide (`IMPLEMENTATION_GUIDE.md`)
  - [x] Setup guide (`SETUP_GUIDE.md`)
  - [x] Quick setup (`QUICK_SETUP.md`)
- [x] Implemented trial extension incentive (14 days)
- [x] Implemented GDPR compliance (export/delete)
- [x] Privacy-first design (no PII collection)

## 🔧 To Do (Manual Actions)

### 1. Install Package

```bash
npm install @vscode/extension-telemetry
```

**Status**: ⏳ Pending  
**Why**: Package must be installed for telemetry to work

---

### 2. Create Azure Application Insights

1. Go to: https://azure.microsoft.com/free/
2. Create free account (if needed)
3. Navigate to: https://portal.azure.com
4. Create Application Insights resource:
   - Click "Create a resource"
   - Search "Application Insights"
   - Fill in:
     - Name: `linear-buddy-telemetry`
     - Region: Choose closest to you
     - Resource Group: Create new
   - Click "Create"
5. Copy connection string from Overview tab

**Status**: ⏳ Pending  
**Time**: ~5 minutes  
**Cost**: Free  
**Guide**: `docs/features/telemetry/QUICK_SETUP.md`

---

### 3. Configure Development Environment

Create `.env` file in project root:

```bash
# Copy from .env.example
cp .env.example .env

# Then edit .env and add your connection string:
VSCODE_TELEMETRY_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://region.in.applicationinsights.azure.com/
```

**Status**: ⏳ Pending  
**Note**: This file is gitignored (won't be committed)

---

### 4. Test Locally

1. Press **F5** to launch Extension Development Host
2. Wait for opt-in prompt (after 10 seconds)
3. Click **"Enable Telemetry (+14 days Pro)"**
4. Use some extension features:
   - Refresh tickets
   - Open a ticket
   - Run a command
5. Check telemetry is working:
   - **Option A**: Open Output panel → "Linear Buddy" → See "Telemetry event sent"
   - **Option B**: Azure Portal → Application Insights → Live Metrics → See events

**Status**: ⏳ Pending  
**Requires**: Steps 1-3 completed

---

### 5. Configure Production (Before Publishing)

Add connection string to `package.json`:

```json
{
  "name": "linear-buddy",
  "version": "0.1.0",
  "telemetryConnectionString": "InstrumentationKey=xxx;IngestionEndpoint=https://region.in.applicationinsights.azure.com/"
}
```

**Status**: ⏳ Pending (before v0.2.0 release)  
**Note**: Connection string is safe to commit (it's an ingestion key)

---

### 6. Update README

Add section about telemetry to `README.md`:

```markdown
## Telemetry

Linear Buddy uses opt-in telemetry to help improve the extension. When you enable telemetry:

- 🎁 **Get 14 extra days of Pro features!** (44 days total trial)
- 🔒 **Your privacy is protected** - No code or personal data is collected
- 📊 **Help us improve** - Your anonymous usage data helps us prioritize features

For full details on what we collect (and don't collect), see our [Telemetry Guide](docs/features/telemetry/TELEMETRY_GUIDE.md).

**Managing Telemetry:**
- Enable/disable: Command Palette → "Linear Buddy: Manage Telemetry Settings"
- View your data: Command Palette → "Linear Buddy: Export My Telemetry Data"
- Delete your data: Command Palette → "Linear Buddy: Delete My Telemetry Data"
```

**Status**: ⏳ Pending  
**Time**: 2 minutes

---

### 7. Test All Telemetry Commands

Run each command and verify:

- [ ] `Linear Buddy: Manage Telemetry` - Opens management menu
- [ ] `Linear Buddy: Export My Telemetry Data` - Saves JSON file
- [ ] `Linear Buddy: Delete My Telemetry Data` - Clears data
- [ ] Opt-in prompt shows after 10 seconds on first use
- [ ] Trial extension granted when enabling telemetry
- [ ] Events appear in Azure Live Metrics
- [ ] Debug logs show "Telemetry event sent: ..." when enabled

**Status**: ⏳ Pending (after Steps 1-4)

---

### 8. Verify GDPR Compliance

Test privacy features:

- [ ] Can export data → Shows userId, config, stats
- [ ] Can delete data → Clears everything locally
- [ ] Can opt-out → Stops sending events
- [ ] Trial extension persists after opt-out
- [ ] Documentation clearly explains data collection

**Status**: ⏳ Pending (after Step 7)

---

### 9. Create Separate Dev/Prod Keys (Optional)

For better analytics separation:

1. Create second Application Insights: `linear-buddy-dev`
2. Use dev key in `.env` for development
3. Use prod key in `package.json` for releases

**Status**: ⏳ Optional  
**Benefit**: Separate dev testing from real user data

---

### 10. Set Up Analytics Dashboard (Optional)

In Azure Portal:

1. Go to Application Insights → Workbooks
2. Create custom dashboard with:
   - Most used commands
   - Error rate over time
   - User growth
   - Performance metrics (P95 operation duration)
3. Pin to Azure dashboard for quick access

**Status**: ⏳ Optional  
**Benefit**: At-a-glance metrics visualization  
**Guide**: `docs/features/telemetry/IMPLEMENTATION_GUIDE.md` (sample queries)

---

## 🚀 Ready to Ship Checklist

Before releasing version with telemetry:

- [ ] Package installed (`@vscode/extension-telemetry`)
- [ ] Azure Application Insights created
- [ ] Connection string in `package.json`
- [ ] Tested locally (events appear in Azure)
- [ ] README updated with telemetry section
- [ ] All telemetry commands tested
- [ ] GDPR features verified
- [ ] Documentation reviewed
- [ ] Privacy policy updated (if you have one)

## 📊 Success Metrics

After release, track in Azure Portal:

- **Opt-in rate**: What % of users enable telemetry?
  - Target: 20-30% is good
- **Trial extensions granted**: How many users got extra days?
- **Most used features**: Which commands are popular?
- **Error rate**: Are there any spikes?
- **User growth**: DAU/MAU trends

## 🆘 Troubleshooting

### "Cannot find module '@vscode/extension-telemetry'"

**Fix**: Run `npm install @vscode/extension-telemetry`

---

### "No telemetry connection string found"

**Fix**: Add to `.env` or `package.json`

---

### Events not appearing in Azure

**Check**:
1. Connection string is correct
2. Telemetry is enabled in extension settings
3. VSCode global telemetry isn't disabled
4. Wait 1-2 minutes (not instant)
5. Use Live Metrics (real-time) instead of Logs (delayed)

---

### TypeScript errors after install

**Fix**: Restart VS Code to reload TypeScript server

---

## 📚 Documentation Links

- **User Guide**: `docs/features/telemetry/TELEMETRY_GUIDE.md`
- **Setup Guide**: `docs/features/telemetry/SETUP_GUIDE.md`
- **Quick Setup**: `docs/features/telemetry/QUICK_SETUP.md`
- **Developer Guide**: `docs/features/telemetry/IMPLEMENTATION_GUIDE.md`
- **Implementation Summary**: `TELEMETRY_IMPLEMENTATION_SUMMARY.md`

## 🎉 Done!

Once all items are checked, you have a fully functional, privacy-first telemetry system with trial extension incentive!

---

**Questions?** angelo.girardi@onebrief.com  
**Last Updated**: November 7, 2025

