# Ticket Navigation Testing Guide

Quick reference for testing the new navigation history feature.

---

## Visual Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Initial State: Viewing ENG-123                              │
│                                                             │
│ ┌─────────────────────────────────────────┐                │
│ │ ENG-123: Implement user authentication │                │
│ │                                         │                │
│ │ Parent: ENG-100 (Auth Epic)            │ ← Click here   │
│ │ Child: ENG-124 (Login UI)              │                │
│ │ Related: ENG-200 (Password Reset)      │                │
│ └─────────────────────────────────────────┘                │
│                                                             │
│ History: [empty]                                           │
│ Back Button: ❌ Hidden                                      │
└─────────────────────────────────────────────────────────────┘

                        ↓ Click "ENG-100"

┌─────────────────────────────────────────────────────────────┐
│ Now Viewing: ENG-100 (Parent Issue)                        │
│                                                             │
│ [← Back]  ← Back button appears!                           │
│                                                             │
│ ┌─────────────────────────────────────────┐                │
│ │ ENG-100: Authentication Epic            │                │
│ │                                         │                │
│ │ Children:                               │                │
│ │  - ENG-123 (Implementation)            │                │
│ │  - ENG-124 (Login UI)                  │                │
│ │  - ENG-125 (OAuth)                     │ ← Click here   │
│ └─────────────────────────────────────────┘                │
│                                                             │
│ History: [ENG-123]                                         │
│ Current Index: 0                                            │
│ Back Button: ✅ Visible                                     │
└─────────────────────────────────────────────────────────────┘

                        ↓ Click "ENG-125"

┌─────────────────────────────────────────────────────────────┐
│ Now Viewing: ENG-125 (Sibling Issue)                       │
│                                                             │
│ [← Back]  ← Still visible                                  │
│                                                             │
│ ┌─────────────────────────────────────────┐                │
│ │ ENG-125: Add OAuth support              │                │
│ │                                         │                │
│ │ Parent: ENG-100 (Auth Epic)            │                │
│ │ Related: ENG-200 (Password Reset)      │ ← Click here   │
│ └─────────────────────────────────────────┘                │
│                                                             │
│ History: [ENG-123, ENG-100]                                │
│ Current Index: 1                                            │
│ Back Button: ✅ Visible                                     │
└─────────────────────────────────────────────────────────────┘

                        ↓ Click "ENG-200"

┌─────────────────────────────────────────────────────────────┐
│ Now Viewing: ENG-200 (Related Issue)                       │
│                                                             │
│ [← Back]  ← Still visible                                  │
│                                                             │
│ ┌─────────────────────────────────────────┐                │
│ │ ENG-200: Password reset flow            │                │
│ │                                         │                │
│ │ Blocked by: ENG-125                    │                │
│ │ Related: ENG-123                        │                │
│ └─────────────────────────────────────────┘                │
│                                                             │
│ History: [ENG-123, ENG-100, ENG-125]                       │
│ Current Index: 2                                            │
│ Back Button: ✅ Visible                                     │
└─────────────────────────────────────────────────────────────┘

                        ↓ Click "← Back"

┌─────────────────────────────────────────────────────────────┐
│ Back to: ENG-125                                           │
│                                                             │
│ [← Back]  ← Still visible                                  │
│                                                             │
│ History: [ENG-123, ENG-100, ENG-125]                       │
│ Current Index: 1  ← Moved back                             │
│ Back Button: ✅ Visible                                     │
└─────────────────────────────────────────────────────────────┘

                        ↓ Click "← Back"

┌─────────────────────────────────────────────────────────────┐
│ Back to: ENG-100                                           │
│                                                             │
│ [← Back]  ← Still visible                                  │
│                                                             │
│ History: [ENG-123, ENG-100, ENG-125]                       │
│ Current Index: 0  ← Moved back again                       │
│ Back Button: ✅ Visible                                     │
└─────────────────────────────────────────────────────────────┘

                        ↓ Click "← Back"

┌─────────────────────────────────────────────────────────────┐
│ Back to: ENG-123 (Original)                                │
│                                                             │
│ (no back button - at start of history)                     │
│                                                             │
│ History: [ENG-123, ENG-100, ENG-125]                       │
│ Current Index: -1  ← Before first item                     │
│ Back Button: ❌ Hidden                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Branching Navigation Example

```
Start: ENG-123
  ↓ click ENG-100
ENG-100 (history: [ENG-123])
  ↓ click ENG-125
ENG-125 (history: [ENG-123, ENG-100])
  ↓ click Back
ENG-100 (history: [ENG-123, ENG-100], index: 0)
  ↓ click ENG-126 (different child!)
ENG-126 (history: [ENG-123, ENG-100])  ← Forward history TRUNCATED!

Note: ENG-125 is no longer in forward history
```

---

## Quick Test Scenarios

### Scenario 1: Linear Parent/Child Navigation
```bash
1. Open any Linear ticket with sub-issues
2. Click on a sub-issue
3. Verify: Back button appears
4. Click another sub-issue from that ticket
5. Verify: Back button still visible
6. Click Back twice
7. Verify: Back at original ticket, no back button
```

### Scenario 2: Linear Related Issues
```bash
1. Open Linear ticket with "Blocks" or "Related" issues
2. Click on a related issue
3. Verify: Back button appears, metadata shows (status, title)
4. Click on another relation from that ticket
5. Click Back
6. Verify: Returns to previous ticket
```

### Scenario 3: Jira Subtasks (NEW!)
```bash
1. Open Jira parent task with subtasks
2. Hover over subtask
3. Verify: Hover effect (background changes)
4. Click subtask
5. Verify: Navigation works, back button appears
6. Click Back
7. Verify: Returns to parent task
```

### Scenario 4: Jira Issue Links
```bash
1. Open Jira ticket with "blocks", "relates to", etc.
2. Click on linked issue
3. Verify: Navigation works, enriched metadata visible
4. Click on another link
5. Click Back twice
6. Verify: Returns to original ticket
```

### Scenario 5: Edge Case - Rapid Clicking
```bash
1. Open ticket with many links
2. Click link A, immediately click Back, click link B
3. Verify: No errors, navigation works correctly
4. Click Back
5. Verify: Returns to original ticket (not stuck in history)
```

---

## What to Check

### ✅ Back Button Visibility
- [ ] Hidden when at start of history (no previous tickets)
- [ ] Visible after navigating to any linked ticket
- [ ] Hides after clicking back to original ticket

### ✅ Navigation Correctness
- [ ] Clicking linked ticket loads the correct ticket
- [ ] Back button returns to correct previous ticket
- [ ] Multiple back clicks work correctly
- [ ] Panel title updates with each navigation

### ✅ Metadata Enrichment
**Linear:**
- [ ] Sub-issues show: identifier, title, status badge, priority badge
- [ ] Parent shows: identifier, title
- [ ] Relations show: identifier, title, status dot, relation type icon

**Jira:**
- [ ] Subtasks show: key, summary, status badge
- [ ] Subtasks are clickable (hover effect)
- [ ] Linked issues show: key, summary, status badge, issue type icon
- [ ] Links grouped by type (blocks, relates to, etc.)

### ✅ UI/UX Polish
- [ ] Back button has hover effect
- [ ] Back button has active/pressed effect
- [ ] Back button uses VS Code theme colors
- [ ] Subtasks have hover effect (Jira)
- [ ] No layout shift when back button appears/disappears

---

## Expected Behavior

### Normal Flow
```
Navigate forward → History grows, back button appears
Click back → Move backward in history
Back at start → Back button hides
```

### Branching Flow
```
A → B → C → Back → D
Result: History is [A, B, D] (C is gone)
```

### Error Handling
```
Navigate to deleted/inaccessible ticket
→ Show error message
→ Don't corrupt history
→ Back button still works
```

---

## Known Limitations (By Design)

1. **No Forward Button** - Only back navigation (browser-like)
2. **History Not Persisted** - Cleared when panel closes
3. **No History Dropdown** - Can't see full history list
4. **One Panel Instance** - History resets if opening different ticket from sidebar

---

## Performance Benchmarks

**Memory per navigation:**
- Linear: ~30 bytes (UUID string)
- Jira: ~15 bytes (issue key string)

**API calls per navigation:**
- Same as before: 1 call to fetch ticket data
- No additional overhead

**UI responsiveness:**
- Back button toggle: <1ms
- Navigation: <100ms (API dependent)

---

## Debug Tips

### Check History State (DevTools Console)
The webview doesn't expose history directly, but you can observe:
1. Open webview DevTools (Right-click → Inspect)
2. Watch for `navigationState` messages in Network tab
3. Check `canGoBack` property

### Verify API Calls
1. Open VS Code Output panel
2. Select "DevBuddy" channel
3. Enable debug mode: `devBuddy.debugMode: true`
4. Watch for "Opening linked issue" / "Going back" logs

---

## Success Criteria

✅ **Navigation works seamlessly across all link types**
✅ **Back button appears/disappears correctly**
✅ **All linked tickets show enriched metadata**
✅ **No console errors or warnings**
✅ **History management is intuitive and correct**
✅ **Performance is instant (no noticeable lag)**

---

Happy Testing! 🚀

If you encounter any issues, check:
1. Console errors (webview DevTools)
2. Extension logs (DevBuddy output channel)
3. Network tab (API call failures)

