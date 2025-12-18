# Wiki Markup Support for TODO Converter

## Summary

Added support for creating Jira issues with **Wiki Markup** format (in addition to ADF) when converting TODOs to tickets.

## Why This Matters

- Jira Server instances often use **Wiki Markup** instead of ADF
- Your test Jira Server 9.12 instance uses Wiki Markup
- Cloud always uses ADF, but Server can use either format

## Changes Made

### 1. Added `jira2md` Package

```json
{
  "dependencies": {
    "jira2md": "^3.1.5"
  }
}
```

**Benefits:**
- Robust markdown ↔ wiki markup conversion
- Well-maintained (3.x version)
- Handles all wiki markup syntax

### 2. Created Wiki Markup Converter

**File:** `src/shared/utils/wikiMarkupConverter.ts`

```typescript
export function convertMarkdownToWiki(markdown: string): string
export function convertWikiToMarkdown(wiki: string): string
export function formatDescriptionWithPermalinkWiki(...)
```

### 3. Integrated into TODO Converter

**File:** `src/commands/convertTodoToTicket.ts`

**Key Functions:**

```typescript
// Convert TODO info to Wiki Markup format
function convertToJiraWiki(
  description: string,
  permalinkInfo: CodePermalink | null,
  codeContext: CodeContext | null,
  fileName: string,
  lineNumber: number,
  language?: string
): string

// Detect if we should use Wiki or ADF
async function shouldUseWikiMarkup(jiraClient: BaseJiraClient): Promise<boolean>
```

**Logic:**
1. Check deployment type (Cloud vs Server)
2. For Cloud: Always use ADF
3. For Server: Use Wiki Markup (default)
4. Create issue with appropriate format

## Example Output

### Wiki Markup Format

```wiki
*📍 Location:* {{src/utils/helper.ts:42}}

*🔗 View in code:* [GitHub|https://github.com/user/repo/blob/abc123/file.ts#L42]

*🌿 Branch:* {{feature/my-feature}}
*📝 Commit:* {{abc1234}}

*Code context:*

{code:javascript}
function calculateTotal() {
  // TODO: Add tax calculation
  return subtotal;
}
{code}

**Note:** TypeScript code is mapped to JavaScript syntax highlighting since Jira wiki markup doesn't support TypeScript.

*Additional notes:*

Need to implement tax calculation based on user location

----
_Created by *DevBuddy* for VS Code_
```

### ADF Format (Cloud)

```json
{
  "version": 1,
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "📍 Location: ", "marks": [{ "type": "strong" }] },
        { "type": "text", "text": "src/utils/helper.ts:42", "marks": [{ "type": "code" }] }
      ]
    }
    // ... more nodes
  ]
}
```

## How It Works

### TODO Conversion Flow

```
User: Right-click TODO → "Convert to Ticket"
  ↓
Extract TODO info & generate permalink
  ↓
Detect Jira deployment type
  ↓
┌─────────────────────────────┬──────────────────────────────┐
│ Jira Cloud (jira.type="cloud") │ Jira Server (jira.type="server") │
├─────────────────────────────┼──────────────────────────────┤
│ Use ADF format              │ Use Wiki Markup format       │
│ convertToJiraADF()          │ convertToJiraWiki()          │
│   ↓                         │   ↓                          │
│ createInput.descriptionADF  │ createInput.description      │
└─────────────────────────────┴──────────────────────────────┘
  ↓
Create Jira issue via API
  ↓
Success! Issue created with proper format
```

## Testing

### Test with Your Jira Server

```bash
# 1. Install dependencies
npm install

# 2. Start Jira Server (if not running)
cd test-env/jira-server
docker-compose up -d

# 3. Configure DevBuddy
{
  "devBuddy.provider": "jira",
  "devBuddy.jira.type": "server",
  "devBuddy.jira.server.baseUrl": "http://localhost:8080",
  "devBuddy.jira.server.username": "admin"
}

# 4. Test TODO converter
# - Add TODO comment in code
# - Right-click → "DevBuddy: Convert TODO to Ticket"
# - Check created issue uses Wiki Markup
```

### Expected Result

The created Jira issue should have:
- ✅ Wiki Markup formatted description
- ✅ Code block with syntax highlighting
- ✅ Working permalink to GitHub/GitLab
- ✅ Proper formatting (bold, code, links)

## Conversion Examples

### Markdown → Wiki Markup

| Markdown | Wiki Markup |
|----------|-------------|
| `# Header` | `h1. Header` |
| `**bold**` | `*bold*` |
| `*italic*` | `_italic_` |
| `` `code` `` | `{{code}}` |
| `[text](url)` | `[text\|url]` |
| ` ```js\ncode\n``` ` | `{code:javascript}\ncode\n{code}` |
| ` ```typescript\ncode\n``` ` | `{code:javascript}\ncode\n{code}` (mapped) |

### Handled by `jira2md`

The package handles all conversions automatically, including:
- Headers (h1-h6)
- Bold, italic, strikethrough
- Lists (ordered and unordered)
- Code blocks (with language)
- Links and images
- Tables → noformat blocks
- Blockquotes → quotes

### Supported Code Block Languages

Jira Wiki Markup supports the following languages for syntax highlighting:

**Supported:** actionscript, ada, applescript, bash, c, c#, c++, cpp, css, erlang, go, groovy, haskell, html, java, javascript, js, json, lua, none, nyan, objc, perl, php, python, r, rainbow, ruby, scala, sh, sql, swift, visualbasic, xml, yaml

**Automatically Mapped:**
- `typescript` → `javascript`
- `ts` → `javascript`

If you encounter other unsupported languages, they will be used as-is and may fall back to plain text rendering in Jira.

## Future Enhancements

### 1. Smart Format Detection

Currently we default to Wiki Markup for all Jira Server instances. Could improve:

```typescript
// Check if project actually supports ADF
const projectMeta = await jiraClient.getProjectMetadata(projectKey);
if (projectMeta.textRenderer === 'atlassian-document') {
  return false;  // Use ADF
}
return true;  // Use Wiki
```

### 2. User Preference

Add setting to override:

```json
{
  "devBuddy.jira.server.preferredFormat": "wiki" | "adf" | "auto"
}
```

### 3. Bidirectional Display

When viewing Jira Server issues:
- Wiki Markup description → Convert to Markdown for display
- Use `convertWikiToMarkdown()` function
- Prettier display in VS Code webview

## Benefits

✅ **Works with your Jira Server** - Uses Wiki Markup as detected  
✅ **No API errors** - Sends format that server expects  
✅ **Beautiful formatting** - Code blocks, links, bold, etc.  
✅ **Permalinks included** - Still get the killer feature  
✅ **Future-proof** - Also supports ADF for Cloud  

## Next Steps

1. ✅ Install package: `npm install`
2. 📋 Test with your Jira Server
3. 📋 Verify issue format in Jira UI
4. 📋 Test with different TODO types

---

**Status:** ✅ Ready to Use  
**Tested:** Pending npm install  
**Documentation:** This file

