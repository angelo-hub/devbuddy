# Linear Buddy Telemetry Guide

## 🔒 Privacy-First Telemetry

Linear Buddy uses **100% opt-in telemetry** to help us build a better extension. We take your privacy seriously and are completely transparent about what we collect.

## 🎁 Telemetry Incentive

**Get 14 extra days of Pro features** by enabling telemetry! This extends your Pro trial from 30 days to 44 days.

### Why This Matters

- Your usage data helps us prioritize features
- We can identify and fix bugs faster
- Better understanding of user workflows
- Improved performance and stability

## 🔍 What We Collect

### ✅ We DO Collect

- **Feature usage**: Which commands and features you use
- **Error counts**: Types of errors (not the content)
- **Performance metrics**: How long operations take
- **Extension version**: Your installed version
- **Platform info**: OS type (Windows/Mac/Linux)
- **Anonymous user ID**: Random UUID (not tied to you)

### ❌ We DON'T Collect

- ❌ Your code or file contents
- ❌ File names or paths
- ❌ Personal information (name, email, etc.)
- ❌ Linear API tokens or credentials
- ❌ Ticket content or descriptions
- ❌ Git commit messages or diffs
- ❌ IP addresses or location data
- ❌ Any identifiable information

## 🚀 How to Enable Telemetry

### Method 1: First-Time Prompt

When you first use Linear Buddy, you'll see a prompt asking if you want to enable telemetry. Click **"Enable Telemetry (+14 days Pro)"** to opt in.

### Method 2: Command Palette

1. Press `Cmd/Ctrl + Shift + P`
2. Type `Linear Buddy: Manage Telemetry`
3. Select **"Telemetry: Disabled"** to enable
4. Confirm to get your trial extension

### Method 3: Settings

1. Open VS Code Settings (`Cmd/Ctrl + ,`)
2. Search for `linearBuddy.telemetry.enabled`
3. Check the box to enable
4. Note: You won't get the trial extension this way

## 🔧 Managing Your Telemetry

### View Statistics

Run `Linear Buddy: Manage Telemetry` to see:
- Whether telemetry is enabled
- How many events have been sent
- When you opted in
- Trial extension status

### Export Your Data (GDPR Compliant)

You have the right to see all your data:

1. Run `Linear Buddy: Export My Telemetry Data`
2. Save the JSON file to review
3. See exactly what we've collected

### Delete Your Data (Right to Deletion)

You have the right to delete your data:

1. Run `Linear Buddy: Delete My Telemetry Data`
2. Confirm the deletion
3. All local data is removed
4. Contact support to delete backend data

### Opt-Out Anytime

Disabling telemetry is easy:

1. Run `Linear Buddy: Manage Telemetry`
2. Select **"Toggle Telemetry"**
3. Confirm opt-out
4. No more data will be sent

Note: You keep your trial extension even if you opt out later!

## 📊 Example Telemetry Data

Here's what a typical telemetry event looks like:

```json
{
  "event": "command_executed",
  "properties": {
    "command": "linearBuddy.generatePRSummary",
    "success": true,
    "userId": "a1b2c3d4-e5f6-4789-90ab-cdef12345678",
    "version": "0.1.0",
    "platform": "darwin",
    "vsCodeVersion": "1.90.0"
  },
  "timestamp": "2025-11-07T10:30:00.000Z"
}
```

Notice:
- No file paths or names
- No code content
- No personal information
- Just usage patterns

## 🛡️ Security & Privacy

### Data Transmission

- All data sent over HTTPS
- No data sent without explicit opt-in
- Data anonymized at collection time
- Cannot be traced back to you

### Data Storage

- Stored securely on our backend
- Access restricted to core team only
- Used only for product improvement
- Never sold or shared with third parties
- Automatically deleted after 90 days

### Compliance

- **GDPR Compliant**: Right to access and deletion
- **CCPA Compliant**: California privacy rights
- **Privacy by Design**: Minimal data collection
- **Transparent**: Open about what we collect

## 📈 How We Use Telemetry

### Feature Prioritization

See which features are most used:
- Popular features get more attention
- Unused features may be deprecated
- New features based on usage patterns

### Bug Detection

Identify issues quickly:
- High error rates trigger investigation
- Performance issues detected early
- Stability improvements prioritized

### Performance Optimization

Improve speed and efficiency:
- Slow operations identified
- Optimization opportunities found
- Resource usage monitored

### Platform Support

Understand our user base:
- Which platforms to prioritize
- OS-specific issues detected
- Better platform compatibility

## 🤝 Your Control

### You're Always in Control

- ✅ Opt-in only (never enabled by default)
- ✅ Easy to disable anytime
- ✅ Full transparency on data collected
- ✅ Export your data anytime
- ✅ Delete your data anytime
- ✅ No penalties for opting out

### Questions?

If you have any questions about telemetry:

1. Run `Linear Buddy: Manage Telemetry`
2. Select **"What Data Do We Collect?"**
3. Review the detailed information
4. Contact us at angelo.girardi@onebrief.com

## 💡 Frequently Asked Questions

### Does telemetry slow down the extension?

No. Telemetry events are:
- Collected asynchronously
- Batched and sent in background
- Minimal performance impact
- Only sent when VS Code is idle

### Can I see what's being sent?

Yes! Enable debug mode:

1. Open Settings → `linearBuddy.debugMode`
2. Enable debug logging
3. Open Output panel → "Linear Buddy"
4. See telemetry events in real-time

### What if I don't trust telemetry?

That's completely fine! We respect your choice:
- Don't enable telemetry
- All features still work
- No nagging or reminders
- Your extension, your choice

### Do I lose my trial extension if I opt out?

No! Once granted, the trial extension is yours:
- Opt out anytime
- Keep the extra 14 days
- No penalties

### Can you track individual users?

No. We deliberately cannot:
- User IDs are random UUIDs
- No link to VS Code account
- No link to Linear account
- No link to git identity
- Truly anonymous

### What about sensitive projects?

For sensitive or confidential projects:
- Don't enable telemetry
- We don't collect code or files
- Even with telemetry, no code is sent
- But your choice matters most

### How long is data retained?

- **Active users**: 90 days rolling window
- **Inactive users**: Deleted after 90 days of no activity
- **Opted-out users**: Deleted within 30 days
- **On request**: Deleted immediately

## 📝 Telemetry Event Types

Here are all the events we track:

### Extension Events
- `extension_activated`: Extension started
- `extension_deactivated`: Extension stopped
- `telemetry_enabled`: User opted in
- `telemetry_disabled`: User opted out

### Command Events
- `command_executed`: Any command run
  - Properties: `command`, `success`

### Feature Events
- `feature_used`: Feature utilized
  - Properties: `feature`, custom metadata

### Error Events
- `error_occurred`: Error happened
  - Properties: `errorType`, `sanitizedMessage`, `context`

### Performance Events
- `performance_metric`: Operation timing
  - Properties: `operation`, `durationMs`

## 🔐 Technical Implementation

### Data Sanitization

All data is sanitized before sending:
- File paths replaced with `[PATH]`
- URLs replaced with `[URL]`
- Emails replaced with `[EMAIL]`
- Messages truncated to 200 chars

### Batching

Events are batched for efficiency:
- Max 50 events per batch
- Sent every 60 seconds
- Or when queue is full
- Minimal network usage

### Retry Logic

Failed sends are retried:
- Events re-queued on failure
- Up to 3 retry attempts
- Exponential backoff
- Eventual deletion after 24 hours

## 🌟 Thank You!

If you enable telemetry, **thank you!** Your anonymous usage data directly helps us:

- Build features you actually use
- Fix bugs you encounter
- Improve performance where it matters
- Make Linear Buddy better for everyone

We're committed to respecting your privacy while building the best possible extension. 🙏

---

**Last Updated**: November 7, 2025  
**Version**: 1.0  
**Contact**: angelo.girardi@onebrief.com

