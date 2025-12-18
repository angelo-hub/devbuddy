/**
 * Wiki Markup Converter for Webview
 * 
 * Converts between Jira Wiki Markup and Markdown for display and editing.
 * Uses jira2md library which works in browser (pure JS string manipulation).
 */

import * as j2m from 'jira2md';
import { isAdfDocument, adfToMarkdown } from './adfConverter';

/**
 * Convert Jira Wiki Markup to Markdown
 */
export function wikiToMarkdown(wiki: string): string {
  if (!wiki) {
    return '';
  }
  
  try {
    const result = j2m.to_markdown(wiki);
    // Normalize line endings (jira2md may produce \r\n)
    return result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  } catch (error) {
    console.error('[Wiki Converter] Failed to convert wiki to markdown:', error);
    return wiki;
  }
}

/**
 * Convert Markdown to Jira Wiki Markup
 */
export function markdownToWiki(markdown: string): string {
  if (!markdown) {
    return '';
  }
  
  try {
    return j2m.to_jira(markdown);
  } catch (error) {
    console.error('[Wiki Converter] Failed to convert markdown to wiki:', error);
    return markdown;
  }
}

/**
 * Detect if text is Jira Wiki Markup
 * Checks for common wiki markup patterns
 */
export function isWikiMarkup(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  // Wiki markup patterns
  const wikiPatterns = [
    /^h[1-6]\.\s/m,           // Headings: h1. Title
    /\{code(:\w+)?\}/,        // Code blocks: {code} or {code:java}
    /\{quote\}/,              // Quote blocks
    /\{panel/,                // Panel blocks
    /\{noformat\}/,           // Noformat blocks
    /\{\{[^}]+\}\}/,          // Inline code: {{code}}
    /\[([^\]|]+)\|([^\]]+)\]/, // Links: [text|url]
    /^\*\s+/m,                // Unordered list (at line start)
    /^#\s+/m,                 // Ordered list (at line start)
    /^-{4,}$/m,               // Horizontal rule: ----
    /\*[^*\n]+\*/,            // Bold: *text* (but not **)
    /_[^_\n]+_/,              // Italic: _text_
    /-[^-\n]+-/,              // Strikethrough: -text-
    /\+[^+\n]+\+/,            // Underline: +text+
    /\^[^^]+\^/,              // Superscript: ^text^
    /~[^~]+~/,                // Subscript: ~text~
    /\bh[1-6]\./,             // Heading anywhere in text
  ];
  
  return wikiPatterns.some(pattern => pattern.test(text));
}

/**
 * Detect description format
 */
export type DescriptionFormat = 'wiki' | 'adf' | 'markdown' | 'plaintext';

export function detectDescriptionFormat(description: string | null | undefined): DescriptionFormat {
  if (!description) {
    return 'plaintext';
  }
  
  // Check if it's ADF JSON
  if (isAdfDocument(description)) {
    return 'adf';
  }
  
  // Check if it's wiki markup
  if (isWikiMarkup(description)) {
    return 'wiki';
  }
  
  // Check for markdown patterns (more specific than wiki)
  const markdownPatterns = [
    /^#{1,6}\s/m,             // Markdown headings: # Title
    /```[\s\S]*?```/,         // Fenced code blocks
    /\*\*[^*]+\*\*/,          // Bold: **text**
    /\[([^\]]+)\]\([^)]+\)/,  // Links: [text](url)
    /^>\s/m,                  // Blockquotes
    /^[-*+]\s/m,              // Unordered lists
    /^\d+\.\s/m,              // Ordered lists
  ];
  
  const hasMarkdown = markdownPatterns.some(pattern => pattern.test(description));
  if (hasMarkdown) {
    return 'markdown';
  }
  
  return 'plaintext';
}

/**
 * Convert any description format to Markdown for display/editing
 * This is the main entry point for normalizing descriptions
 */
export function descriptionToMarkdown(description: string | null | undefined): string {
  if (!description) {
    return '';
  }
  
  const format = detectDescriptionFormat(description);
  
  switch (format) {
    case 'adf':
      return adfToMarkdown(description);
    case 'wiki':
      return wikiToMarkdown(description);
    case 'markdown':
    case 'plaintext':
    default:
      return description;
  }
}

/**
 * Convert Markdown to native format for saving
 * @param markdown - The markdown content to convert
 * @param deploymentType - 'cloud' for ADF, 'server' for wiki markup
 */
export function markdownToNativeFormat(
  markdown: string,
  deploymentType: 'cloud' | 'server'
): string {
  if (!markdown) {
    return '';
  }
  
  if (deploymentType === 'server') {
    return markdownToWiki(markdown);
  }
  
  // For cloud, we need to return ADF JSON
  // Import dynamically to avoid circular dependency issues
  // The extension will handle ADF conversion on save
  // For now, return markdown and let the extension convert
  return markdown;
}

