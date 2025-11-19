# Jira Server Description Format Detection

## The Problem

Jira Server can use **two different description formats**:

1. **Wiki Markup** (Legacy, but still common in v9.x)
2. **ADF** (Atlassian Document Format, modern)

The format depends on:
- Project age (old projects use Wiki Markup)
- Migration history
- Project-level text editor settings

## Real Example from Jira Server 9.12

### Wiki Markup Format (What We Got)

```json
{
  "description": "Test format\r\n\r\n \r\n{code:java}\r\n// { \"test\": code block }\r\n{code}",
  "renderedFields": {
    "description": "<p>Test format</p>\n\n<p> </p>\n<div class=\"code panel\">..."
  }
}
```

**Characteristics:**
- Plain text string
- Wiki markup syntax: `{code:java}`, `*bold*`, `_italic_`, etc.
- `\r\n` line breaks
- HTML rendering available in `renderedFields`

### ADF Format (Modern)

```json
{
  "description": {
    "version": 1,
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Test format"
          }
        ]
      },
      {
        "type": "codeBlock",
        "attrs": { "language": "java" },
        "content": [
          {
            "type": "text",
            "text": "// { \"test\": code block }"
          }
        ]
      }
    ]
  }
}
```

**Characteristics:**
- JSON object structure
- Has `version`, `type`, `content` properties
- Structured nodes for formatting

## Detection Strategy

### 1. Runtime Detection

```typescript
/**
 * Detect description format for an issue
 */
function detectDescriptionFormat(description: any): 'wiki' | 'adf' | 'plaintext' {
  // Null or undefined
  if (!description) {
    return 'plaintext';
  }
  
  // ADF: Object with version and type
  if (typeof description === 'object' && description.version && description.type === 'doc') {
    return 'adf';
  }
  
  // Wiki Markup: String with markup syntax
  if (typeof description === 'string') {
    // Check for wiki markup patterns
    const wikiPatterns = [
      /\{code[:\}]/,      // {code:java} or {code}
      /\{quote\}/,        // {quote}
      /\{noformat\}/,     // {noformat}
      /\[~\w+\]/,         // [~username]
      /\[\w+\|http/,      // [text|http://url]
    ];
    
    const hasWikiMarkup = wikiPatterns.some(pattern => pattern.test(description));
    
    if (hasWikiMarkup) {
      return 'wiki';
    }
    
    return 'plaintext';
  }
  
  return 'plaintext';
}
```

### 2. Use renderedFields for Display

The safest approach is to **use `renderedFields.description`** for display:

```typescript
interface JiraIssueResponse {
  fields: {
    description: string | object;  // Can be either!
    // ... other fields
  };
  renderedFields?: {
    description: string;  // Always HTML
    // ... other fields
  };
}

function getDescriptionForDisplay(issue: JiraIssueResponse): string {
  // Prefer rendered HTML (works for both Wiki and ADF)
  if (issue.renderedFields?.description) {
    return issue.renderedFields.description;
  }
  
  // Fallback to raw description
  const raw = issue.fields.description;
  
  if (typeof raw === 'string') {
    return raw;  // Wiki markup or plain text
  }
  
  if (typeof raw === 'object' && raw.type === 'doc') {
    return convertADFToText(raw);  // Convert ADF to plain text
  }
  
  return '';
}
```

### 3. Creating Issues (Write Operation)

When **creating/updating** issues, detect what format the project expects:

```typescript
async function createIssue(projectKey: string, data: CreateIssueInput): Promise<JiraIssue> {
  // Check project's editor type
  const projectMeta = await this.getProjectMetadata(projectKey);
  
  if (projectMeta.editorType === 'wiki') {
    // Send Wiki Markup
    return this.createIssueWithWikiMarkup(data);
  } else {
    // Send ADF
    return this.createIssueWithADF(data);
  }
}
```

## Implementation for JiraServerClient

### Reading Issues (Already Working)

```typescript
// src/providers/jira/server/JiraServerClient.ts

async getIssue(key: string): Promise<JiraIssue | null> {
  try {
    // Request with renderedFields expansion
    const response = await this.request<any>(
      `/issue/${key}?expand=renderedFields`
    );
    
    return this.normalizeIssue(response);
  } catch (error) {
    logger.error(`Failed to get issue ${key}:`, error);
    return null;
  }
}

private normalizeIssue(apiIssue: any): JiraIssue {
  const fields = apiIssue.fields;
  const rendered = apiIssue.renderedFields || {};
  
  return {
    id: apiIssue.id,
    key: apiIssue.key,
    summary: fields.summary,
    
    // Use rendered HTML for description (handles both Wiki and ADF)
    description: rendered.description || fields.description || '',
    descriptionFormat: this.detectDescriptionFormat(fields.description),
    
    status: {
      id: fields.status.id,
      name: fields.status.name,
      category: fields.status.statusCategory?.name || 'To Do',
    },
    
    priority: {
      id: fields.priority?.id || '3',
      name: fields.priority?.name || 'Medium',
      iconUrl: fields.priority?.iconUrl,
    },
    
    assignee: fields.assignee ? {
      accountId: fields.assignee.name,  // Server uses 'name', Cloud uses 'accountId'
      displayName: fields.assignee.displayName,
      avatarUrl: fields.assignee.avatarUrls?.['48x48'],
      emailAddress: fields.assignee.emailAddress,
    } : undefined,
    
    reporter: {
      accountId: fields.reporter.name,
      displayName: fields.reporter.displayName,
      avatarUrl: fields.reporter.avatarUrls?.['48x48'],
      emailAddress: fields.reporter.emailAddress,
    },
    
    created: fields.created,
    updated: fields.updated,
    
    url: `${this.baseUrl}/browse/${apiIssue.key}`,
    
    project: {
      id: fields.project.id,
      key: fields.project.key,
      name: fields.project.name,
      avatarUrl: fields.project.avatarUrls?.['48x48'],
    },
    
    issueType: {
      id: fields.issuetype.id,
      name: fields.issuetype.name,
      iconUrl: fields.issuetype.iconUrl,
      subtask: fields.issuetype.subtask || false,
    },
  };
}

private detectDescriptionFormat(description: any): 'wiki' | 'adf' | 'plaintext' {
  if (!description) return 'plaintext';
  
  // ADF format
  if (typeof description === 'object' && description.type === 'doc') {
    return 'adf';
  }
  
  // Wiki markup (check for common patterns)
  if (typeof description === 'string') {
    const wikiPatterns = [
      /\{code/,
      /\{quote\}/,
      /\{panel\}/,
      /\[~\w+\]/,
    ];
    
    if (wikiPatterns.some(p => p.test(description))) {
      return 'wiki';
    }
  }
  
  return 'plaintext';
}
```

### Creating Issues (Needs Format Detection)

```typescript
async createIssue(input: CreateJiraIssueInput): Promise<JiraIssue | null> {
  try {
    // For now, send as plain text (safest, works everywhere)
    const payload = {
      fields: {
        project: { key: input.projectKey },
        summary: input.summary,
        description: input.description || '',  // Plain text or Wiki markup
        issuetype: { name: input.issueTypeName || 'Task' },
        priority: input.priority ? { name: input.priority } : undefined,
        assignee: input.assigneeId ? { name: input.assigneeId } : undefined,
      }
    };
    
    const response = await this.request<any>('/issue', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    // Fetch full issue details
    return this.getIssue(response.key);
  } catch (error) {
    logger.error('Failed to create Jira issue:', error);
    return null;
  }
}
```

## Key Takeaways

1. **Jira Server 9.12 can still use Wiki Markup** - Don't assume ADF based on version alone

2. **Always request `renderedFields`** - It provides HTML rendering for both formats:
   ```typescript
   `/issue/${key}?expand=renderedFields`
   ```

3. **Use rendered HTML for display** - Safest approach, works for both formats

4. **For writing (create/update):**
   - Plain text works everywhere (no formatting)
   - Wiki Markup works on old projects
   - ADF works on new projects
   - Need to detect per-project which format to use

5. **Detection order:**
   ```typescript
   if (typeof desc === 'object' && desc.type === 'doc') → ADF
   else if (typeof desc === 'string' && hasWikiPatterns) → Wiki Markup
   else → Plain text
   ```

## Next Steps

1. ✅ Use `renderedFields.description` for display (works now)
2. ✅ Add format detection method
3. 📋 Add project metadata check for write operations
4. 📋 Convert markdown → Wiki Markup helper (for creating issues)
5. 📋 Convert markdown → ADF helper (for modern projects)

---

**Summary:** Your Jira Server instance is using **Wiki Markup**, not ADF. This is normal even for v9.12. Always use `renderedFields.description` for display - it gives you HTML rendering regardless of the underlying format.

