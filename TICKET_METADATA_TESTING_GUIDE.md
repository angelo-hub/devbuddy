# Ticket Metadata Testing Guide

## Quick Start Testing

### Prerequisites
1. Build the extension: `npm run compile && npm run compile:webview`
2. Press **F5** to launch Extension Development Host
3. Have Linear or Jira credentials configured

## Test Scenarios

### Linear Testing

#### Test Priority Editing
1. Open a Linear ticket in the sidebar
2. Locate the **Priority** dropdown (between Assignee and Estimate)
3. Change priority from current value to different options:
   - None (⚪)
   - Urgent (🔴)
   - High (🟠)
   - Medium (🟡)
   - Low (🟢)
4. **Expected:** Success notification, ticket panel refreshes, sidebar updates

#### Test Estimate Editing
1. Open a Linear ticket
2. Locate the **Estimate (points)** input field
3. Test cases:
   - Enter `5` → Press Enter
   - Enter `2.5` (decimal) → Press Enter
   - Clear value (empty) → Press Enter
   - Enter `abc` (invalid) → Should revert
   - Enter value → Press Escape → Should cancel
4. **Expected:** Success notification for valid values, revert for invalid

#### Test Due Date Editing
1. Open a Linear ticket
2. Locate the **Due Date** date picker
3. Test cases:
   - Click date picker → Select future date
   - Click Clear button (✕) to remove due date
   - Select date → Press Enter to save
   - Select date → Press Escape to cancel
4. **Expected:** Success notification, date displayed in metadata section

### Jira Cloud/Server Testing

#### Test Priority Editing
1. Open a Jira ticket
2. Locate the **Priority** dropdown
3. Change priority to different levels:
   - Highest (⬆️)
   - High (🔴)
   - Medium (🟡)
   - Low (🟢)
   - Lowest (⬇️)
4. **Expected:** Success notification, ticket updates

#### Test Story Points Editing
1. Open a Jira ticket
2. Locate the **Story Points** input field
3. Test cases:
   - Enter `8` → Press Enter
   - Enter `3.5` (decimal) → Press Enter
   - Clear value → Press Enter
4. **Expected:** 
   - **Jira Cloud:** Updates `customfield_10016`
   - **Jira Server:** Updates detected story points field
   - Success notification shown

#### Test Due Date Editing
1. Open a Jira ticket
2. Locate the **Due Date** picker
3. Test same scenarios as Linear
4. **Expected:** Due date updates in Jira

#### Test Labels (Jira)
Labels are displayed in the **Details** section (TicketMetadata component).
Backend support is implemented for updating via `updateLabels` action.
*Future enhancement: Dedicated LabelSelector component*

## Verification Checklist

### Linear
- [ ] Priority updates in Linear web app
- [ ] Estimate visible in Linear web app
- [ ] Due date visible in Linear web app
- [ ] Sidebar refreshes after updates
- [ ] No console errors

### Jira Cloud
- [ ] Priority updates in Jira web app
- [ ] Story points updates (check actual field used)
- [ ] Due date updates in Jira web app
- [ ] Sidebar refreshes after updates
- [ ] No console errors

### Jira Server
- [ ] Field mapping detects story points field
- [ ] All metadata updates work
- [ ] Compatible with Jira 8.0+

## Common Issues

### Issue: Story Points Not Updating (Jira Cloud)
**Cause:** Your Jira instance uses a different custom field ID  
**Solution:** Update `JiraCloudClient.ts` line ~529 to use your field ID, or pass via `customFields`:
```typescript
await jiraClient.updateIssue(key, {
  customFields: {
    "customfield_YOUR_ID": storyPoints
  }
});
```

### Issue: Priority Dropdown Empty
**Cause:** Priority options are hardcoded  
**Solution:** Verify your Jira/Linear instance uses standard priority IDs

### Issue: Date Picker Not Showing
**Cause:** Browser compatibility  
**Solution:** Use a modern browser (Chrome, Edge, Firefox)

## Developer Console Commands

Open webview DevTools (Right-click → "Open Webview Developer Tools"):

```javascript
// Check current issue state (Linear)
window.__LINEAR_INITIAL_STATE__

// Check for errors
console.log(localStorage)
```

## API Verification

### Linear GraphQL
Check that queries include new fields:
- `dueDate`
- `estimate`

### Jira REST API
Check PUT requests to `/rest/api/2/issue/{key}`:
```json
{
  "fields": {
    "priority": { "id": "2" },
    "customfield_10016": 5,
    "duedate": "2025-12-31"
  }
}
```

## Performance Testing

1. Update multiple fields rapidly
2. Verify cache invalidation works
3. Check sidebar refresh performance
4. Test with slow network (throttle in DevTools)

## Regression Testing

Ensure existing functionality still works:
- [ ] Status updates
- [ ] Assignee updates
- [ ] Comments
- [ ] Branch associations
- [ ] Labels (Linear)
- [ ] Cycles (Linear)
- [ ] Subtasks/Sub-issues

## Success Criteria

✅ All metadata fields editable  
✅ No TypeScript errors  
✅ No console errors  
✅ Changes persist in Linear/Jira  
✅ Sidebar reflects updates  
✅ Error handling works (invalid input)  
✅ Loading states work properly  

## Next Steps After Testing

1. Report any field ID mismatches (Jira story points)
2. Test with team members' instances
3. Document any instance-specific configurations needed
4. Consider adding UI for custom field configuration

