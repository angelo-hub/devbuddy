# Walkthrough GIFs TODO

## Overview
Currently all walkthrough steps use markdown files for media. Once we record GIFs, we should replace the markdown with GIFs for a better visual experience.

## GIFs to Record

### High Priority (Best Visual Impact)

1. **`sidebar-demo.gif`** - For step `explore.sidebar`
   - Show: Opening DevBuddy sidebar, viewing tickets organized by status, clicking a ticket
   - Current: Uses `sidebar.md`
   - Impact: HIGH - First visual of the product

2. **`todo-converter-demo.gif`** - For step `feature.todoconverter`
   - Show: Hovering over a TODO comment, clicking "Convert to Linear Ticket", showing the created ticket with permalink
   - Current: Uses `todo-converter.md`
   - Impact: HIGH - Unique feature showcase

3. **`standup-demo.gif`** - For step `feature.standup`
   - Show: Opening standup builder, selecting tickets, AI generating the standup update, copying result
   - Current: Uses `standup.md`
   - Impact: HIGH - AI feature showcase

### Medium Priority

4. **`pr-summary-demo.gif`** - For step `feature.prsummary`
   - Show: Running PR summary command, showing monorepo detection, AI analysis, final summary
   - Current: Uses `pr-summary.md`
   - Impact: MEDIUM - AI feature showcase

5. **`linear-sidebar-demo.gif`** - For step `feature.branches`
   - Show: Clicking branch icon on a ticket, selecting source branch, reviewing generated name, branch created
   - Current: Uses `branches.md`
   - Impact: MEDIUM - Linear-specific feature

### Lower Priority (Text is Sufficient)

6. **`status-update-demo.gif`** - For step `feature.status`
   - Show: Right-clicking a ticket, selecting "Update Status", choosing new status with visual indicators
   - Current: Uses `status.md`
   - Impact: LOW - Simple interaction

## Implementation Steps

When ready to add GIFs:

1. **Record the GIFs** (see `RECORDING_SCRIPTS.md` for detailed scripts)
   - Use a screen recording tool (QuickTime, OBS, etc.)
   - Keep recordings short (5-15 seconds)
   - Show clear, focused actions
   - Use a clean demo workspace

2. **Optimize the GIFs**
   - Compress to reasonable file sizes (< 5 MB each)
   - Use tools like `gifsicle` or online converters
   - Ensure they're readable at walkthrough size

3. **Update `package.json`**
   - Replace `"markdown": "media/walkthrough/xxx.md"` with:
   ```json
   "media": {
     "image": "media/walkthrough/videos/xxx-demo.gif",
     "altText": "Description for accessibility"
   }
   ```

4. **Update `.vscodeignore`**
   - Add this line to include the videos directory:
   ```
   !media/walkthrough/videos/**
   ```

5. **Keep the markdown files as fallback documentation**
   - The markdown files can stay in the repo for reference
   - Or move them to `docs/walkthrough/` if you want to keep them

## File Locations

- GIFs should be saved to: `media/walkthrough/videos/`
- Current markdown files: `media/walkthrough/*.md`
- Recording scripts: `media/walkthrough/RECORDING_SCRIPTS.md`

## Testing Checklist

After adding GIFs:
- [ ] Build VSIX package: `npm run package`
- [ ] Check package size (should increase by ~10-30 MB depending on GIF optimization)
- [ ] Verify GIFs are included: `npx vsce ls | grep "\.gif"`
- [ ] Install and test walkthrough in VS Code
- [ ] Verify all GIFs load and play smoothly
- [ ] Test on both light and dark themes
- [ ] Verify accessibility (alt text is descriptive)

## Notes

- The walkthrough was not showing up because VS Code requires **all steps to have media**
- We fixed this by adding markdown files to steps that had missing media
- VS Code walkthroughs support both images (`.gif`, `.png`, `.jpg`) and markdown (`.md`)
- GIFs provide better visual learning but increase package size
- Keep GIFs optimized and under 5 MB each for reasonable package size

