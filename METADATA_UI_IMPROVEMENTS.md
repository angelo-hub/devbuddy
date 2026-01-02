# Metadata UI Improvements

**Date:** December 29, 2025  
**Goal:** VS Code-styled, modern, inline metadata editing

## Changes Made

### 1. PrioritySelector - VS Code Dropdown Style

**Before:**
- Generic Select component wrapper
- Emojis only in options
- Not visually aligned with VS Code theme

**After:**
- Custom styled select with VS Code theme variables
- Icon displayed in the selected value
- Inline layout with label
- Full theme integration using:
  - `var(--vscode-dropdown-background)`
  - `var(--vscode-dropdown-foreground)`
  - `var(--vscode-dropdown-border)`
  - `var(--vscode-focusBorder)`

**Features:**
- Clean horizontal layout (label | value)
- Custom dropdown arrow
- Icon + label display
- Hover states that respect theme
- Proper focus indicators

### 2. EstimateSelector - Inline Edit Pattern

**Before:**
- Always visible number input
- Felt disconnected and "form-like"
- Standard HTML number input styling

**After:**
- Click-to-edit pattern (like VS Code settings)
- Displays as button showing current value
- Text input on click (not number input for better UX)
- Auto-select on edit
- Keyboard shortcuts (Enter/Escape)
- Inline layout matching other fields

**Features:**
- Display mode: Shows value or "None" as clickable button
- Edit mode: Focused text input with auto-select
- Smooth transitions between modes
- VS Code theme colors throughout
- No spinners or number input quirks

### 3. DueDateSelector - Smart Date Input

**Before:**
- Native HTML5 date picker (browser-dependent styling)
- Clear button felt disconnected
- Didn't match VS Code aesthetic

**After:**
- Click-to-edit text input (like EstimateSelector)
- Displays formatted date in display mode (e.g., "Jan 15, 2025")
- Flexible date parsing (accepts YYYY-MM-DD, MM/DD/YYYY, etc.)
- Inline clear button (only visible when date is set)
- Placeholder hints format

**Features:**
- Display mode: Formatted date or "None"
- Edit mode: Text input with format hint
- Flexible parsing of common date formats
- Clear button integrated into display
- Consistent with VS Code's inline editing pattern

## Design Philosophy

### Inline Editing Pattern
All three components follow VS Code's "click-to-edit" pattern:
1. **Display Mode**: Value shown as interactive element
2. **Edit Mode**: Input field replaces display
3. **Save**: Blur, Enter key, or explicit save
4. **Cancel**: Escape key

### Theme Integration
All components use VS Code CSS variables:
- `--vscode-foreground` / `--vscode-dropdown-foreground`
- `--vscode-input-background` / `--vscode-dropdown-background`
- `--vscode-input-border` / `--vscode-dropdown-border`
- `--vscode-focusBorder`
- `--vscode-list-hoverBackground`
- `--vscode-widget-border`

### Layout Consistency
All components share the same structure:
```
┌──────────────────────────────────────┐
│ Label (100px)    Value (flex)        │
└──────────────────────────────────────┘
```

- Label: Fixed 100px width, 80% opacity
- Value: Flexible width, theme colors
- Border bottom: Subtle separator
- Padding: 8px vertical

## Visual Examples

### Priority (Dropdown)
```
Priority        🔴 High ▼
```
Clicking opens native select with themed styling.

### Estimate (Click-to-Edit)
```
Estimate        5
```
Clicking shows: `[  5  ]` (editable input)

### Due Date (Click-to-Edit)
```
Due Date        Jan 15, 2025  ✕
```
Clicking shows: `[YYYY-MM-DD]` (editable input)

## Benefits

1. **Consistency**: All fields look and behave similarly
2. **Theme Respect**: Works with any VS Code theme (dark/light)
3. **Modern UX**: Click-to-edit feels more integrated
4. **Less Visual Noise**: Fields don't look like a form
5. **Better Spacing**: Aligned labels create visual rhythm
6. **Keyboard Friendly**: Enter/Escape work everywhere

## Comparison to Previous Version

### Old Approach
- Generic form inputs
- Always editable state
- Mismatched with VS Code UI
- Felt like embedded web form
- Browser-dependent date picker

### New Approach
- VS Code-native patterns
- Click-to-edit for less noise
- Full theme integration
- Feels like VS Code settings
- Consistent cross-browser experience

## Testing Notes

The components now:
- ✅ Match VS Code's visual language
- ✅ Respect user's theme choice
- ✅ Feel more "native" to VS Code
- ✅ Reduce visual clutter
- ✅ Maintain full functionality
- ✅ Work identically in Linear and Jira panels

## Future Enhancements

Potential improvements:
1. **Smart date parsing**: "today", "tomorrow", "+3d", etc.
2. **Quick priority picker**: Click icon to cycle priorities
3. **Estimate presets**: Common values (1, 2, 3, 5, 8, 13)
4. **Date calendar popup**: Mini calendar for visual date selection
5. **Keyboard shortcuts**: Arrow keys to change priority/estimate

These can be added incrementally without breaking the current implementation.

