# BYOT (Bring Your Own Token) AI Providers 🧪 Beta

> **Beta Feature:** BYOT providers are in beta. While functional, you may encounter occasional issues. Please report bugs via GitHub Issues.

DevBuddy supports multiple AI providers for features like Standup Builder and PR Summary generation. You can use the default GitHub Copilot integration or bring your own API keys for direct access to OpenAI, Anthropic, or Google AI.

## Why BYOT?

- **Cost Control**: Pay only for what you use with your own API keys
- **Model Selection**: Choose the exact model that fits your needs
- **No Copilot Required**: Use AI features without a GitHub Copilot subscription
- **Privacy Options**: Some organizations prefer direct API access

## Supported Providers

### 🔷 GitHub Copilot (Default)

Uses VS Code's Language Model API through your GitHub Copilot subscription.

**Pros:**
- No additional setup if you have Copilot
- Automatic model selection
- Native VS Code integration

**Models:** GPT-4o, GPT-4.1, GPT-4-Turbo, GPT-4, GPT-4o-mini, GPT-3.5-Turbo, Gemini 2.0 Flash

### 🟢 OpenAI

Direct access to OpenAI's API with your own API key.

**Setup:**
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Run command: `DevBuddy: Set OpenAI API Key`
3. Set provider in settings: `"devBuddy.ai.provider": "openai"`

**Models:**
| Model | Description | Best For |
|-------|-------------|----------|
| `gpt-4o` | Latest flagship | Highest quality |
| `gpt-4o-mini` | Fast & affordable | **Recommended** |
| `gpt-4-turbo` | Fast & powerful | Complex tasks |
| `gpt-4` | Classic GPT-4 | Reliability |
| `gpt-3.5-turbo` | Fastest | Quick tasks |
| `o1-preview` | Reasoning model | Complex analysis |
| `o1-mini` | Fast reasoning | Quick reasoning |

### 🟣 Anthropic (Claude)

Direct access to Anthropic's Claude models.

**Setup:**
1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Run command: `DevBuddy: Set Anthropic API Key`
3. Set provider in settings: `"devBuddy.ai.provider": "anthropic"`

**Models:**
| Model | Description | Best For |
|-------|-------------|----------|
| `claude-sonnet-4-20250514` | Latest Sonnet | Highest quality |
| `claude-3-5-sonnet-20241022` | Claude 3.5 Sonnet | Excellent quality |
| `claude-3-5-haiku-20241022` | Claude 3.5 Haiku | **Recommended** |
| `claude-3-opus-20240229` | Most capable | Complex tasks |
| `claude-3-haiku-20240307` | Fastest | Quick tasks |

### 🔵 Google AI (Gemini)

Direct access to Google's Gemini models.

**Setup:**
1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Run command: `DevBuddy: Set Google AI API Key`
3. Set provider in settings: `"devBuddy.ai.provider": "google"`

**Models:**
| Model | Description | Best For |
|-------|-------------|----------|
| `gemini-2.0-flash-exp` | Latest experimental | Cutting edge |
| `gemini-1.5-pro` | Most capable | Complex tasks |
| `gemini-1.5-flash` | Fast & efficient | **Recommended** |
| `gemini-1.5-flash-8b` | Fastest | Quick tasks |

## Configuration

### Settings

```json
{
  // Provider selection
  "devBuddy.ai.provider": "copilot",  // copilot, openai, anthropic, google
  
  // Copilot model (when provider = copilot)
  "devBuddy.ai.model": "auto",  // auto, copilot:gpt-4o, etc.
  
  // OpenAI model (when provider = openai)
  "devBuddy.ai.openai.model": "gpt-4o-mini",
  
  // Anthropic model (when provider = anthropic)
  "devBuddy.ai.anthropic.model": "claude-3-5-haiku-20241022",
  
  // Google model (when provider = google)
  "devBuddy.ai.google.model": "gemini-1.5-flash",
  
  // Completely disable AI (use rule-based fallback)
  "devBuddy.ai.disabled": false,
  
  // Writing tone for summaries
  "devBuddy.writingTone": "professional"  // casual, professional, technical, concise
}
```

### Commands

| Command | Description |
|---------|-------------|
| `DevBuddy: Set OpenAI API Key` | Securely store your OpenAI API key |
| `DevBuddy: Set Anthropic API Key` | Securely store your Anthropic API key |
| `DevBuddy: Set Google AI API Key` | Securely store your Google AI API key |
| `DevBuddy: Remove AI API Key` | Remove a stored API key |
| `DevBuddy: Show AI Provider Status` | View status of all AI providers |

## Features Using AI

These features benefit from AI providers:

1. **Standup Builder** (`DevBuddy: Open Standup Builder`)
   - Summarizes git commits into standup updates
   - Suggests next steps based on work done
   - Detects potential blockers

2. **PR Summary** (`DevBuddy: Generate PR Summary`)
   - Analyzes code changes and commits
   - Generates clear, structured PR descriptions
   - Categorizes changes by type

3. **Next Steps Suggestions**
   - Analyzes recent work
   - Suggests what to work on next

4. **Blocker Detection**
   - Scans commit messages for warning signs
   - Identifies potential issues

## Fallback Behavior

If AI is unavailable (no Copilot, no API key, or disabled), DevBuddy automatically uses intelligent **rule-based summarization**:

- Categorizes commits by conventional commit types
- Extracts package/directory information
- Generates structured summaries without AI

This ensures you can always use features like Standup Builder, even in air-gapped environments.

## Security

- **API keys are stored in VS Code's Secret Storage** (OS keychain)
- Keys are never written to settings files
- Keys are never logged or transmitted except to the respective API
- Each provider has isolated storage

## Troubleshooting

### "No AI models available"
- **Copilot**: Ensure GitHub Copilot extension is installed and active
- **BYOT**: Check that your API key is configured

### "API key not configured"
Run the appropriate "Set API Key" command for your provider.

### "API error"
- Verify your API key is valid
- Check your API quota/credits
- Ensure network connectivity to the API endpoint

### Checking Provider Status
Run `DevBuddy: Show AI Provider Status` to see:
- Which providers are configured
- Which provider is currently active
- Any error messages

## Cost Estimates

Rough estimates for typical DevBuddy usage (varies by model and usage):

| Provider | Model | Est. Cost/Month |
|----------|-------|-----------------|
| OpenAI | gpt-4o-mini | $1-5 |
| OpenAI | gpt-4o | $5-20 |
| Anthropic | claude-3-5-haiku | $1-5 |
| Anthropic | claude-3-5-sonnet | $5-20 |
| Google | gemini-1.5-flash | $1-3 |

*Estimates assume 10-20 standup/PR generations per day.*

## Adding New Providers

The BYOT architecture is extensible. To add a new provider:

1. Create a new provider class extending `BaseAIProvider`
2. Implement `loadConfiguration()`, `initialize()`, `isAvailable()`, `performRequest()`
3. Add configuration options to `package.json`
4. Register in `AIProviderManager`
5. Add key management command

See `src/shared/ai/providers/` for implementation examples.

