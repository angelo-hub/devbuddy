# Icon Improvements Summary

## Overview
Enhanced the visual consistency of the extension by improving icon usage across the tree view with folder icons for collapsible sections and maintaining the existing color-coding scheme.

## Changes Implemented

### 1. Tree View - Collapsible Sections
Updated collapsible section headers to use folder icons while maintaining color coding:

- **My Issues Section**: `folder-opened` icon in blue (`charts.blue`)
- **Teams Section**: `folder-opened` icon in purple (`charts.purple`)  
- **Projects Section**: `folder-opened` icon in orange (`charts.orange`)

### 2. Tree View - Team Items
Changed from `people` icon to `folder` icon:
- Uses purple color (`charts.purple`) to match Teams section
- Maintains visual hierarchy with folder metaphor

### 3. Tree View - Project Items
Changed from `project` icon to `folder` icon:
- Uses orange color (`charts.orange`) to match Projects section
- Consistent folder metaphor across all collapsible containers

## Existing Color Scheme (Preserved)

The extension maintains this comprehensive color-coding system for tickets:

| Status/Priority | Icon | Color |
|----------------|------|-------|
| **Started** | `play-circle` | Blue (`charts.blue`) |
| **Completed** | `check-all` | Green (`charts.green`) |
| **Canceled** | `circle-slash` | Gray (`disabledForeground`) |
| **Backlog** | `circle-outline` | Purple (`charts.purple`) |
| **Unstarted - Urgent** | `alert` | Red (`errorForeground`) |
| **Unstarted - High** | `arrow-up` | Orange (`editorWarning.foreground`) |
| **Unstarted - Medium** | `circle-outline` | Yellow (`charts.yellow`) |
| **Unstarted - Low** | `arrow-down` | Gray (`descriptionForeground`) |

### Status Header Icons
| Status Type | Icon | Color |
|------------|------|-------|
| **Started** | `record` | Blue (`charts.blue`) |
| **Completed** | `pass-filled` | Green (`charts.green`) |
| **Canceled** | `circle-slash` | Gray (`disabledForeground`) |
| **Backlog** | `inbox` | Purple (`charts.purple`) |
| **Unstarted** | `circle-large-outline` | Orange (`charts.orange`) |

## Webview Panel Icons - Technical Limitation

**Note**: Webview panels (Linear Ticket Panel and Standup Builder Panel) do NOT support `ThemeIcon` like tree view items. They only accept:
- `Uri` (file paths to actual SVG/PNG files)
- `{ light: Uri, dark: Uri }` (separate icons for light/dark themes)
- `undefined`

To add dynamic, color-coded icons to webview panel tabs, we would need to:
1. Create SVG/PNG icon files for each status/priority combination
2. Bundle them with the extension
3. Use file URIs to reference them

This would require creating approximately 10-15 icon variants to match the tree view's color scheme.

## Benefits

✅ **Visual Consistency**: Folder icons clearly indicate collapsible/expandable sections  
✅ **Color Coding**: Maintained existing color scheme throughout  
✅ **Improved UX**: Users can quickly identify section types by color  
✅ **Hierarchical Clarity**: Folder metaphor makes organization clearer  
✅ **Theme Compatible**: All colors use VSCode theme colors for light/dark mode support  

## Files Modified

- `src/views/linearTicketsProvider.ts` - Updated section, team, and project icons
- `src/views/linearTicketPanel.ts` - Added comments about webview icon limitations
- `src/views/standupBuilderPanel.ts` - Added comments about webview icon limitations

## Future Enhancement Ideas

If you want to add icons to webview panel tabs in the future:

1. Create a `resources/icons/` directory
2. Generate SVG icons for each status/priority combination in the color scheme
3. Update webview panel creation code to use:
   ```typescript
   panel.iconPath = vscode.Uri.file(
     path.join(extensionPath, 'resources', 'icons', 'status-started.svg')
   );
   ```
4. Update icons dynamically when ticket status changes

This would provide visual feedback in the tab bar matching the tree view's color scheme.

