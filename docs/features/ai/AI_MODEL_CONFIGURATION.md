# AI Model Configuration

## Overview

Linear Buddy now supports flexible AI model configuration through VS Code settings, similar to GitLens. Users can choose their preferred AI model or let the extension automatically select the best available model.

## Key Features

### 1. Auto Mode (Recommended)
- **Setting**: `"linearBuddy.ai.model": "auto"`
- Automatically selects the best available model from GitHub Copilot
- Tries models in this preference order:
  1. GPT-4o (OpenAI's latest flagship)
  2. GPT-4.1 (Proven and reliable)
  3. GPT-4 Turbo (Fast and powerful)
  4. GPT-4 (Classic)
  5. Gemini 2.0 Flash (Google's model)
  6. GPT-4o Mini (Faster)
  7. GPT-3.5 Turbo (Most widely available)

### 2. Manual Model Selection
Users can explicitly choose their preferred model:
- `"linearBuddy.ai.model": "copilot:gpt-4o"`
- `"linearBuddy.ai.model": "copilot:gpt-4.1"`
- `"linearBuddy.ai.model": "copilot:gpt-4-turbo"`
- `"linearBuddy.ai.model": "copilot:gpt-4"`
- `"linearBuddy.ai.model": "copilot:gpt-4o-mini"`
- `"linearBuddy.ai.model": "copilot:gpt-3.5-turbo"`
- `"linearBuddy.ai.model": "copilot:gemini-2.0-flash"`

## Configuration

### Via Settings UI

1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for "linearBuddy.ai.model"
3. Select your preferred model from the dropdown
4. The extension will use VS Code's Language Model API (GitHub Copilot)

### Via settings.json

```json
{
  "linearBuddy.ai.model": "auto",
  "linearBuddy.writingTone": "professional"
}
```

Or with a specific model:

```json
{
  "linearBuddy.ai.model": "copilot:gpt-4.1",
  "linearBuddy.writingTone": "technical"
}
```

## How It Works

### VS Code Language Model API

The extension uses VS Code's built-in Language Model API (`vscode.lm`), which provides access to AI models through registered providers like GitHub Copilot. This means:

1. **No API Keys Needed**: Uses your existing GitHub Copilot subscription
2. **Native Integration**: Works seamlessly with VS Code's AI infrastructure  
3. **Model Discovery**: Automatically discovers available models
4. **Fallback Support**: Falls back to alternative models if preferred model is unavailable

### Model Selection Logic

```typescript
// Auto mode
if (setting === "auto") {
  // Try each model family in preference order
  // Use first available model
}

// Manual mode  
else {
  // Try to match specified model family
  // Fall back to first available if not found
}
```

### Logging

The extension logs detailed information about model selection:

```
[Monorepo Tools] Requested model: auto, Family: auto
[Monorepo Tools] Found 3 available models:
  1. copilot-gpt-4o { vendor: 'copilot', family: 'gpt-4o', ... }
  2. copilot-gpt-4 { vendor: 'copilot', family: 'gpt-4', ... }
  3. copilot-gpt-3.5-turbo { vendor: 'copilot', family: 'gpt-3.5-turbo', ... }
[Monorepo Tools] ✓ Auto-selected model: copilot-gpt-4o
```

## First-Time Setup

During onboarding, users are presented with model options:

1. **Auto (Recommended)** - Let the extension choose
2. **GPT-4o** - OpenAI's latest
3. **GPT-4.1** - Reliable and proven
4. **GPT-4 Turbo** - Fast and powerful
5. **GPT-4** - Classic
6. **GPT-4o Mini** - Faster
7. **GPT-3.5 Turbo** - Cost-effective
8. **Gemini 2.0 Flash** - Google's model

## Backward Compatibility

The extension maintains backward compatibility with the legacy `linearBuddy.aiModel` setting:

```json
{
  "linearBuddy.aiModel": "gpt-4o"  // ⚠️ Deprecated but still works
}
```

Users are encouraged to migrate to the new setting:
```json
{
  "linearBuddy.ai.model": "copilot:gpt-4o"  // ✅ New format
}
```

## Requirements

- **VS Code**: Version 1.85.0 or higher
- **GitHub Copilot**: Active subscription
- **Internet Connection**: For AI model access

## Troubleshooting

### No Models Available

If you see "No AI models available":
1. Ensure GitHub Copilot is installed and activated
2. Sign in to your GitHub account
3. Verify your Copilot subscription is active
4. Reload VS Code

### Model Not Found

If your preferred model isn't available:
1. The extension automatically falls back to the first available model
2. Check the console logs for model availability
3. Try switching to "auto" mode
4. Consider using a more common model like GPT-3.5 Turbo

### Changing Models Mid-Session

Settings changes take effect on the next AI operation:
- PR Summary generation
- Standup update generation
- TODO to ticket conversion

## Example Configurations

### For Best Quality
```json
{
  "linearBuddy.ai.model": "copilot:gpt-4o",
  "linearBuddy.writingTone": "professional"
}
```

### For Speed
```json
{
  "linearBuddy.ai.model": "copilot:gpt-4o-mini",
  "linearBuddy.writingTone": "concise"
}
```

### For Technical Docs
```json
{
  "linearBuddy.ai.model": "copilot:gpt-4-turbo",
  "linearBuddy.writingTone": "technical"
}
```

### Let Extension Decide
```json
{
  "linearBuddy.ai.model": "auto",
  "linearBuddy.writingTone": "professional"
}
```

## Future Enhancements

Potential future improvements:
- Custom model provider support (OpenAI direct, Anthropic, etc.)
- Model-specific prompt optimization
- Token usage tracking
- Model performance metrics
- Per-feature model selection
- Cost tracking for external providers

## Related Settings

- `linearBuddy.enableAISummarization` - Enable/disable AI features
- `linearBuddy.writingTone` - Control output style
- `linearBuddy.aiModel` - Legacy setting (deprecated)

