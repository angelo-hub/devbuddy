/**
 * Markdown to Jira Wiki Markup Converter
 * 
 * Converts markdown text (from code comments) to Jira Wiki Markup format.
 * Used when creating issues in Jira Server instances that use Wiki Markup.
 * 
 * Uses custom conversion for better control over code blocks and formatting.
 */

import * as j2m from 'jira2md';

/**
 * Convert markdown text to Jira Wiki Markup
 * Custom implementation for better code block handling
 */
export function convertMarkdownToWiki(markdown: string): string {
  if (!markdown) return '';
  
  try {
    let wiki = markdown;
    
    // First, handle code blocks BEFORE other conversions to preserve them
    // Match code blocks with language: ```lang\ncode\n```
    wiki = wiki.replace(/```(\w+)\s*\n([\s\S]*?)```/g, (match, lang, code) => {
      // Preserve code exactly as-is, trimming only trailing newlines
      const cleanCode = code.replace(/\n+$/, '');
      return `{code:${lang}}\n${cleanCode}\n{code}`;
    });
    
    // Match code blocks without language: ```\ncode\n```
    wiki = wiki.replace(/```\s*\n([\s\S]*?)```/g, (match, code) => {
      const cleanCode = code.replace(/\n+$/, '');
      return `{code}\n${cleanCode}\n{code}`;
    });
    
    // Now use jira2md for other markdown conversions
    // But skip if it's already been converted (has {code} blocks)
    if (!wiki.includes('{code}')) {
      wiki = j2m.to_jira(wiki);
    } else {
      // Do manual conversions for common elements
      
      // Headers
      wiki = wiki.replace(/^######\s+(.+)$/gm, 'h6. $1');
      wiki = wiki.replace(/^#####\s+(.+)$/gm, 'h5. $1');
      wiki = wiki.replace(/^####\s+(.+)$/gm, 'h4. $1');
      wiki = wiki.replace(/^###\s+(.+)$/gm, 'h3. $1');
      wiki = wiki.replace(/^##\s+(.+)$/gm, 'h2. $1');
      wiki = wiki.replace(/^#\s+(.+)$/gm, 'h1. $1');
      
      // Bold
      wiki = wiki.replace(/\*\*(.+?)\*\*/g, '*$1*');
      wiki = wiki.replace(/__(.+?)__/g, '*$1*');
      
      // Italic (be careful not to match asterisks in bold)
      wiki = wiki.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '_$1_');
      wiki = wiki.replace(/(?<!_)_(?!_)([^_]+?)(?<!_)_(?!_)/g, '_$1_');
      
      // Strikethrough
      wiki = wiki.replace(/~~(.+?)~~/g, '-$1-');
      
      // Inline code (but don't touch {code} blocks)
      wiki = wiki.replace(/`([^`\n]+)`/g, '{{$1}}');
      
      // Links [text](url)
      wiki = wiki.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '[$1|$2]');
      
      // Unordered lists
      wiki = wiki.replace(/^[\*\-]\s+(.+)$/gm, '* $1');
      
      // Ordered lists
      wiki = wiki.replace(/^\d+\.\s+(.+)$/gm, '# $1');
      
      // Blockquotes
      wiki = wiki.replace(/^>\s+(.+)$/gm, '{quote}$1{quote}');
      
      // Horizontal rules
      wiki = wiki.replace(/^---+$/gm, '----');
    }
    
    return wiki;
  } catch (error) {
    console.error('Failed to convert markdown to wiki markup:', error);
    // Fallback: return as-is
    return markdown;
  }
}

/**
 * Convert Jira Wiki Markup to Markdown
 * Useful for displaying Jira content in VS Code or other markdown contexts
 */
export function convertWikiToMarkdown(wiki: string): string {
  if (!wiki) return '';
  
  try {
    return j2m.to_markdown(wiki);
  } catch (error) {
    console.error('Failed to convert wiki markup to markdown:', error);
    // Fallback: return as-is
    return wiki;
  }
}

/**
 * Format description with permalink in Jira Wiki Markup
 */
export function formatDescriptionWithPermalinkWiki(
  todoText: string,
  permalink: string,
  fileName: string,
  lineNumber: number
): string {
  // Clean TODO prefix
  const cleanText = todoText
    .replace(/^\/\/\s*TODO:?\s*/i, '')
    .replace(/^#\s*TODO:?\s*/i, '')
    .replace(/^\/\*\s*TODO:?\s*/i, '')
    .replace(/\*\/\s*$/, '')
    .trim();
  
  // Convert markdown to wiki markup
  const wikiDescription = convertMarkdownToWiki(cleanText);
  
  // Build description with permalink in Wiki format
  const parts: string[] = [];
  
  if (wikiDescription) {
    parts.push(wikiDescription);
    parts.push(''); // Empty line
  }
  
  parts.push('----'); // Horizontal rule
  parts.push('');
  parts.push('*Source Code:*');
  parts.push(`[${fileName}:${lineNumber}|${permalink}]`);
  
  return parts.join('\n');
}

/**
 * Example conversions
 */
export const WIKI_MARKUP_EXAMPLES = {
  markdown: {
    basic: `# Header 1
## Header 2

**Bold text** and *italic text*

\`inline code\` and ~~strikethrough~~

- List item 1
- List item 2

1. Ordered item
2. Ordered item

[Link text](https://example.com)

\`\`\`javascript
const x = 42;
\`\`\`
`,
    
    todoExample: `Fix authentication bug
    
**Steps to reproduce:**
1. Login with invalid credentials
2. Check error message

**Expected:** Show "Invalid credentials"
**Actual:** Shows generic error

\`\`\`javascript
if (!isValid) {
  throw new Error('Auth failed');
}
\`\`\`

See [docs](https://example.com) for details.
`
  },
  
  wiki: {
    basic: `h1. Header 1
h2. Header 2

*Bold text* and _italic text_

{{inline code}} and -strikethrough-

* List item 1
* List item 2

# Ordered item
# Ordered item

[Link text|https://example.com]

{code:javascript}
const x = 42;
{code}
`,
    
    todoExample: `Fix authentication bug
    
*Steps to reproduce:*
# Login with invalid credentials
# Check error message

*Expected:* Show "Invalid credentials"
*Actual:* Shows generic error

{code:javascript}
if (!isValid) {
  throw new Error('Auth failed');
}
{code}

See [docs|https://example.com] for details.
`
  }
};

/**
 * Test the converter
 */
export function testWikiConverter(): void {
  console.log('=== Markdown to Wiki Converter Test ===\n');
  
  console.log('INPUT (Markdown):');
  console.log(WIKI_MARKUP_EXAMPLES.markdown.basic);
  console.log('\nOUTPUT (Wiki Markup):');
  console.log(convertMarkdownToWiki(WIKI_MARKUP_EXAMPLES.markdown.basic));
  console.log('\nEXPECTED:');
  console.log(WIKI_MARKUP_EXAMPLES.wiki.basic);
}

