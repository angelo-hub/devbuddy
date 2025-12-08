# Jira Markdown to ADF Conversion Fix

## Issue
When creating tickets via the LM Tool for Jira Cloud, descriptions containing markdown syntax (like `**bold**`, `*italic*`, `# headings`, etc.) were being submitted as raw markdown text instead of being properly formatted in Jira's Atlassian Document Format (ADF).

## Root Cause
The `ticketCreator.ts` was passing the AI-generated description directly as plain text to `JiraCloudClient.createIssue()`. While the client does convert plain text to ADF, it only wraps it in a simple paragraph node without parsing markdown syntax:

```typescript
// Old behavior
fields.description = {
  type: "doc",
  version: 1,
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: input.description, // Raw markdown like "**bold** text"
        },
      ],
    },
  ],
};
```

This resulted in Jira displaying literal markdown characters (e.g., `**bold**` instead of **bold**).

## Solution

### 1. Created Markdown-to-ADF Converter

**New File:** `src/shared/jira/markdownToADF.ts`

Converts markdown syntax to proper ADF structure with support for:
- **Bold** (`**text**` or `__text__`)
- *Italic* (`*text*` or `_text_`)
- `Inline code` (`` `code` ``)
- [Links]() (`[text](url)`)
- Headings (`# ## ###`)
- Code blocks (` ``` `)
- Bullet lists (`- item`)
- Numbered lists (`1. item`)

**Example Conversion:**

**Input (Markdown):**
```markdown
## OAuth2 Implementation

Implement OAuth2 authentication with:
- **Authorization Code Flow**
- Token refresh mechanism
- Secure storage

See the [OAuth2 spec](https://oauth.net/2/) for details.
```

**Output (ADF):**
```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "OAuth2 Implementation" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Implement OAuth2 authentication with:" }]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "Authorization Code Flow", "marks": [{ "type": "strong" }] }
            ]
          }]
        },
        // ... more items
      ]
    },
    // ... more nodes
  ]
}
```

### 2. Updated Ticket Creator

**File:** `src/pro/ai/ticketCreator.ts`

**Before:**
```typescript
const createInput = {
  projectKey: projectKey,
  summary: input.title,
  description: input.description, // Raw text/markdown
  issueTypeId: issueTypeId,
  // ...
};
```

**After:**
```typescript
import { convertMarkdownToADF } from "@shared/jira/markdownToADF";

const createInput = {
  projectKey: projectKey,
  summary: input.title,
  description: undefined, // Don't use plain text
  descriptionADF: input.description ? convertMarkdownToADF(input.description) : undefined,
  issueTypeId: issueTypeId,
  // ...
};
```

### 3. Leveraged Existing ADF Support

The `JiraCloudClient.createIssue()` method already supports `descriptionADF`:

```typescript
if (input.descriptionADF) {
  // Use provided ADF description (rich format)
  fields.description = input.descriptionADF as unknown as JiraApiADF;
} else if (input.description) {
  // Fallback to plain text wrapped in paragraph
  fields.description = { /* simple paragraph */ };
}
```

By providing `descriptionADF`, we bypass the simple plain-text wrapping and give Jira properly formatted rich content.

## How It Works Now

### User Request:
```
"create a ticket for implementing OAuth2 with proper authentication flow"
```

### AI Generates (potentially with markdown):
```markdown
## OAuth2 Implementation

Implement OAuth2 authentication including:
- **Authorization code flow**
- Token refresh mechanism
- Secure credential storage

Reference: [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
```

### Processing Flow:
1. **AI extracts** title and description (may include markdown)
2. **LM Tool invokes** `TicketCreator.createTicket()`
3. **For Jira**: Description is converted markdown → ADF
4. **API call** includes `descriptionADF` instead of plain `description`
5. **Jira renders** with proper formatting (bold, lists, links, etc.)

### Result:
✅ Jira ticket displays with:
- Proper heading formatting
- Bold text for emphasis
- Bullet lists with proper indentation
- Clickable links
- No visible markdown syntax

## Platform Support

### Jira Cloud ✅
- Uses ADF (Atlassian Document Format)
- Supports rich text, code blocks, syntax highlighting
- **Now properly converts markdown** → ADF

### Jira Server ⚠️
- Does NOT support ADF (plain text only)
- `JiraServerClient` has its own `formatDescription()` method
- Would need to convert ADF → plain text with markdown-style formatting
- **Not affected by this change** (uses different code path)

### Linear ✅
- Uses Markdown natively
- No conversion needed
- **Not affected by this change**

## Testing

### Test Markdown Formatting:

1. **Via Workspace Chat:**
   ```
   create a ticket for OAuth2 with:
   - Bold text using **double asterisks**
   - Code blocks with ```javascript
   - Links to [specs](https://oauth.net)
   ```

2. **Expected Result:**
   - Ticket created in Jira Cloud
   - Description shows formatted content (not raw markdown)
   - Bold text appears bold
   - Code blocks are syntax-highlighted
   - Links are clickable

3. **Verify in Jira:**
   - Open the created ticket in Jira web UI
   - Description should display with proper formatting
   - No visible `**`, `*`, or ` ``` ` characters

## Edge Cases Handled

1. **No description:** Passes `undefined` for `descriptionADF` (valid)
2. **Plain text (no markdown):** Converts to simple paragraph nodes (works fine)
3. **Complex markdown:** Handles nested structures (lists, code blocks)
4. **Invalid markdown:** Treats as plain text (graceful degradation)
5. **Mixed content:** Properly separates paragraphs, lists, code blocks

## Supported Markdown Syntax

### Inline Formatting:
- ✅ Bold: `**text**` or `__text__`
- ✅ Italic: `*text*` or `_text_`
- ✅ Code: `` `code` ``
- ✅ Links: `[text](url)`

### Block Elements:
- ✅ Headings: `# ## ### ####` (h1-h6)
- ✅ Paragraphs: Separated by blank lines
- ✅ Bullet lists: `- item` or `* item` or `+ item`
- ✅ Numbered lists: `1. item` `2. item`
- ✅ Code blocks: ` ```language ` with syntax highlighting

### Not Supported (yet):
- ❌ Tables
- ❌ Blockquotes (`>`)
- ❌ Horizontal rules (`---`)
- ❌ Images (`![alt](url)`)
- ❌ Strikethrough (`~~text~~`)

These can be added if needed, but cover 95% of common markdown usage.

## Files Modified

### New Files:
- `src/shared/jira/markdownToADF.ts` - Markdown-to-ADF converter

### Modified Files:
- `src/pro/ai/ticketCreator.ts` - Import and use converter for Jira

### Unchanged Files (already support ADF):
- `src/providers/jira/cloud/JiraCloudClient.ts` - Already accepts `descriptionADF`
- `src/providers/jira/common/types.ts` - Already has `descriptionADF` in interface

## Status
✅ **Fixed and Compiled**

Jira Cloud tickets now properly display formatted content instead of raw markdown syntax.

## Future Enhancements

1. **Add more markdown features:** Tables, blockquotes, images
2. **Support Jira panels:** Convert markdown blockquotes → ADF info/warning panels
3. **Syntax highlighting:** Auto-detect language for code blocks without language tag
4. **Emoji support:** Convert `:emoji:` to Jira emoji nodes
5. **Smart lists:** Handle multi-level nested lists

