# Linear Integration Update - v0.2.0

## Completed

### IDEAS.md Created
- 30+ future enhancement ideas documented
- Prioritized by importance
- Implementation notes included

### Sidebar Toolbar Button Added
- Standup Builder accessible from sidebar (notebook icon)
- No command palette needed
- Opens in right pane

### Auto-Refresh Polling
- Configurable interval (default: 5 minutes)
- Set to 0 to disable
- Automatic ticket sync

## In Progress

### Tighter Linear Integration (#1, #3, #4)
**Status:** Partially implemented

**What's done:**
- `handleLoadTickets()` method added
- Fetches active Linear tickets
- Ready to populate dropdown

**What's needed:**
1. Update HTML to add ticket selector dropdown
2. Remove emojis from all UI text
3. Pre-fill ticket context in AI prompts
4. Show ticket details in results

## Next Steps

### 1. Update Standup Builder HTML
Replace emoji-heavy UI with clean professional look:

**Changes needed in `_getHtmlForWebview()`:**
- Remove 📊 from title
- Add Linear ticket dropdown before form
- Load tickets on panel open
- Use selected ticket for context

**Example dropdown:**
```html
<div class="form-group">
  <label for="ticketSelect">Linear Ticket (Optional)</label>
  <select id="ticketSelect">
    <option value="">-- Auto-detect from branch --</option>
    <!-- Populated from Linear API -->
  </select>
  <div class="hint">Select a ticket or leave empty to auto-detect</div>
</div>
```

### 2. Remove All Emojis
Search and replace in standup builder:
- 📊 Standup Builder → Standup Builder
- ✅ → (remove)
- 🎉 → (remove)
- Any other emojis in UI

### 3. Add Ticket Context to AI
When ticket selected:
- Pass `description` to AI as context
- Include `status` and `priority` in prompt
- Better AI suggestions

### 4. Update Chat UI
Remove emojis from chat responses:
- LinearBuddyChatParticipant.ts
- Remove priority emojis (🔴🟠🟡🟢)
- Use text labels instead

### 5. Update README
Remove emojis from documentation:
- Use ## headers instead of emoji headers
- Professional appearance
- Corporate-friendly

## Testing Checklist

- [ ] Compile without errors
- [ ] Standup Builder opens from sidebar
- [ ] Linear tickets load in dropdown
- [ ] Selected ticket context used by AI
- [ ] No emojis in UI
- [ ] Auto-refresh works
- [ ] Package builds successfully

## Files to Update

1. `src/views/standupBuilderPanel.ts` - Add ticket selector HTML, remove emojis
2. `src/chat/linearBuddyParticipant.ts` - Remove emoji helpers, use text
3. `src/views/linearTicketsProvider.ts` - Already done (auto-refresh)
4. `README.md` - Remove emojis
5. `LINEAR_BUDDY_GUIDE.md` - Remove emojis

## Configuration

New setting added:
```json
{
  "monorepoTools.autoRefreshInterval": 5  // minutes, 0 to disable
}
```

## Commands

New button locations:
- Sidebar toolbar: Notebook icon (Standup Builder)
- Sidebar toolbar: Refresh icon (Manual refresh)

## Package Status

**Current:** v0.1.0 (192 KB)
**Next:** v0.2.0 (with Linear integration)

## Summary

We've laid the groundwork for tight Linear integration. The `handleLoadTickets()` method is ready, auto-refresh is working, and the sidebar button is in place.

Main remaining work:
1. Update HTML to show ticket dropdown (20 lines)
2. Remove emojis throughout (find/replace)
3. Wire selected ticket to AI context (10 lines)

Total remaining: ~1 hour of work for polished Linear integration.


