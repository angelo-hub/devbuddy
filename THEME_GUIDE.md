# Custom Theme Support Guide

## Current Implementation

The webviews currently inherit all theming from VS Code's built-in theme variables:
- `--vscode-foreground`, `--vscode-background`, etc.
- Automatically adapts to light/dark themes
- Uses CSS custom properties for consistency

## Adding Custom Theme Presets (Future Enhancement)

To add custom color presets on top of VS Code's theme:

### 1. Define Theme Presets

Update `webview-ui/src/global.css` to add theme classes:

```css
/* Default (VS Code theme) */
:root {
  --accent-color: var(--vscode-focusBorder);
}

/* Linear Blue Theme */
body[data-theme="linear-blue"] {
  --accent-color: #5E6AD2;
  --status-started: #5E6AD2;
  --button-background: #5E6AD2;
}

/* GitHub Dark Theme */
body[data-theme="github-dark"] {
  --accent-color: #58a6ff;
  --status-started: #58a6ff;
  --button-background: #238636;
}

/* Custom Theme */
body[data-theme="custom"] {
  /* User-configurable colors */
  --accent-color: var(--custom-accent, #6366f1);
  --status-started: var(--custom-primary, #6366f1);
}
```

### 2. Add Theme Selection

Create a theme selector component:

```tsx
// webview-ui/src/shared/components/ThemeSelector.tsx
export const ThemeSelector: React.FC = () => {
  const [theme, setTheme] = useState('default');
  
  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  return (
    <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="default">VS Code Default</option>
      <option value="linear-blue">Linear Blue</option>
      <option value="github-dark">GitHub Dark</option>
      <option value="custom">Custom</option>
    </Select>
  );
};
```

### 3. Persist Theme Preference

Use VS Code's state or settings:

```tsx
// Save theme preference
vscode.setState({ theme: 'linear-blue' });

// Load theme preference
const state = vscode.getState();
const theme = state?.theme || 'default';
```

### 4. Add Extension Settings

Add to `package.json`:

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "monorepoTools.webviewTheme": {
          "type": "string",
          "enum": ["default", "linear-blue", "github-dark", "custom"],
          "default": "default",
          "description": "Color theme for webview panels"
        }
      }
    }
  }
}
```

### 5. Pass Theme from Extension

Update panel creation to pass theme:

```typescript
// src/views/standupBuilderPanel.ts
const theme = vscode.workspace.getConfiguration('monorepoTools').get('webviewTheme');
// Pass theme in initial state or as data attribute
```

## Benefits of Current Approach

- **Zero configuration**: Works out of the box with all VS Code themes
- **Consistent**: Matches user's editor theme perfectly
- **Accessible**: Respects contrast and color preferences
- **Lightweight**: No additional theme data or logic

## When to Add Custom Themes

Consider adding custom themes when:
- Users request specific brand colors
- You want a distinctive look regardless of VS Code theme
- Specific color combinations improve usability
- Creating a themed extension experience

## Testing Themes

1. Switch VS Code themes (Light/Dark/High Contrast)
2. Verify all UI elements are visible
3. Check contrast ratios for accessibility
4. Test in different color modes

