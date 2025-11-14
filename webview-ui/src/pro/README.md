# DevBuddy Pro - Webview Components

This directory contains **commercial UI components** for DevBuddy Pro features.

## License

All code in this directory and its subdirectories is licensed under the **DevBuddy Pro License** (see [../../../LICENSE.pro](../../../LICENSE.pro)).

## Pro Webview Components (Planned)

### Analytics Dashboard
- Real-time workflow metrics
- Interactive charts and graphs
- Custom date range selection
- Export reports

### Team Dashboard
- Team velocity tracking
- Sprint progress visualization
- Member activity heatmaps
- Collaboration metrics

### Custom Theme Editor
- Visual theme customization
- Color picker and preview
- Icon set selection
- Layout configuration

## Directory Structure

```
webview-ui/src/pro/
├── README.md (this file)
├── LICENSE.pro (symlink to root LICENSE.pro)
├── analytics/      # Analytics dashboard components
├── components/     # Shared Pro components
└── themes/         # Theme editor components
```

## Building Pro Webviews

Pro webview components are built alongside free components:

```bash
npm run compile:webview
```

The build process automatically includes both free and Pro components.

## Using Pro Components

Pro components should check license status before rendering:

```tsx
import React from 'react';
import { useVSCode } from '../shared/hooks/useVSCode';

export const ProAnalyticsDashboard = () => {
  const vscode = useVSCode();
  const [hasProAccess, setHasProAccess] = React.useState(false);

  React.useEffect(() => {
    // Request license status from extension
    vscode.postMessage({ command: 'checkProAccess' });
  }, []);

  if (!hasProAccess) {
    return (
      <div className="pro-upgrade-prompt">
        <h2>💎 Pro Feature</h2>
        <p>Upgrade to DevBuddy Pro to access Advanced Analytics.</p>
        <button onClick={() => vscode.postMessage({ command: 'upgradeToPro' })}>
          View Plans
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Your Pro component */}
    </div>
  );
};
```

## Questions?

- 📧 Email: angelo@cooked.mx
- 🐛 Issues: [GitHub Issues](https://github.com/angelo-hub/devbuddy/issues)
- 📖 Docs: [Full Documentation](../../../LICENSING_MODEL.md)

---

**Last Updated:** November 14, 2025

