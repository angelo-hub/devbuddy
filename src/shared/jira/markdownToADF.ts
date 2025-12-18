/**
 * Markdown to ADF Converter
 * Converts basic markdown syntax to Atlassian Document Format (ADF)
 */

import { ADFDocument, ADFBlockNode, ADFInlineNode } from "./adfTypes";

/**
 * Convert markdown text to ADF document
 * Supports: bold, italic, code, links, headings, lists, code blocks
 */
export function convertMarkdownToADF(markdown: string): ADFDocument {
  const lines = markdown.split("\n");
  const content: ADFBlockNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (but preserve them as empty paragraphs for spacing)
    if (!trimmed) {
      i++;
      continue;
    }

    // Heading (# ## ###, etc.)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const text = headingMatch[2];
      content.push({
        type: "heading",
        attrs: { level },
        content: parseInlineContent(text),
      });
      i++;
      continue;
    }

    // Code block (``` or ~~~)
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      const fence = trimmed.startsWith("```") ? "```" : "~~~";
      const language = trimmed.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++; // Skip the opening fence

      // Collect code lines until closing fence
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        codeLines.push(lines[i]);
        i++;
      }

      content.push({
        type: "codeBlock",
        attrs: language ? { language: language as any } : undefined,
        content: [
          {
            type: "text",
            text: codeLines.join("\n"),
          },
        ],
      });
      i++; // Skip the closing fence
      continue;
    }

    // Bullet list (- or * or +)
    if (trimmed.match(/^[-*+]\s+/)) {
      const listItems = [];
      
      while (i < lines.length) {
        const listLine = lines[i].trim();
        const match = listLine.match(/^[-*+]\s+(.+)$/);
        
        if (!match) break;
        
        listItems.push({
          type: "listItem" as const,
          content: [
            {
              type: "paragraph" as const,
              content: parseInlineContent(match[1]),
            },
          ],
        });
        i++;
      }

      content.push({
        type: "bulletList",
        content: listItems,
      });
      continue;
    }

    // Numbered list (1. 2. 3., etc.)
    if (trimmed.match(/^\d+\.\s+/)) {
      const listItems = [];
      
      while (i < lines.length) {
        const listLine = lines[i].trim();
        const match = listLine.match(/^\d+\.\s+(.+)$/);
        
        if (!match) break;
        
        listItems.push({
          type: "listItem" as const,
          content: [
            {
              type: "paragraph" as const,
              content: parseInlineContent(match[1]),
            },
          ],
        });
        i++;
      }

      content.push({
        type: "orderedList",
        content: listItems,
      });
      continue;
    }

    // Regular paragraph
    content.push({
      type: "paragraph",
      content: parseInlineContent(line),
    });
    i++;
  }

  // If no content, add empty paragraph
  if (content.length === 0) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: markdown }],
    });
  }

  return {
    type: "doc",
    version: 1,
    content,
  };
}

/**
 * Parse inline markdown content (bold, italic, code, links)
 */
function parseInlineContent(text: string): ADFInlineNode[] {
  const nodes: ADFInlineNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Bold (**text** or __text__)
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      nodes.push({
        type: "text",
        text: boldMatch[2],
        marks: [{ type: "strong" }],
      });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic (*text* or _text_)
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
    if (italicMatch) {
      nodes.push({
        type: "text",
        text: italicMatch[2],
        marks: [{ type: "em" }],
      });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code (`code`)
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push({
        type: "text",
        text: codeMatch[1],
        marks: [{ type: "code" }],
      });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link ([text](url))
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      nodes.push({
        type: "text",
        text: linkMatch[1],
        marks: [{ type: "link", attrs: { href: linkMatch[2] } }],
      });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Regular text - consume until next special character
    // eslint-disable-next-line no-useless-escape
    const nextSpecial = remaining.search(/[*_`\[]/);
    if (nextSpecial === -1) {
      // No more special characters, consume the rest
      nodes.push({
        type: "text",
        text: remaining,
      });
      remaining = "";
    } else if (nextSpecial === 0) {
      // Special character at start but didn't match any pattern - consume as literal
      nodes.push({
        type: "text",
        text: remaining[0],
      });
      remaining = remaining.slice(1);
    } else {
      // Consume up to the next special character
      nodes.push({
        type: "text",
        text: remaining.slice(0, nextSpecial),
      });
      remaining = remaining.slice(nextSpecial);
    }
  }

  // If no nodes created, return plain text
  if (nodes.length === 0) {
    nodes.push({ type: "text", text });
  }

  return nodes;
}



