/**
 * ADF (Atlassian Document Format) Converter
 * 
 * Converts between ADF and Markdown for Jira integration
 */

// ADF Types
interface ADFMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface ADFNode {
  type: string;
  text?: string;
  marks?: ADFMark[];
  attrs?: Record<string, unknown>;
  content?: ADFNode[];
}

interface ADFDocument {
  type: "doc";
  version: number;
  content: ADFNode[];
}

/**
 * Convert ADF document to Markdown
 */
export function adfToMarkdown(adf: ADFDocument | string): string {
  try {
    const doc = typeof adf === "string" ? JSON.parse(adf) : adf;
    
    if (!doc || doc.type !== "doc" || !doc.content) {
      return typeof adf === "string" ? adf : JSON.stringify(adf);
    }

    return doc.content.map((node: ADFNode) => convertNode(node)).join("\n\n");
  } catch (error) {
    console.error("[ADF Converter] Failed to convert ADF to Markdown:", error);
    return typeof adf === "string" ? adf : JSON.stringify(adf);
  }
}

/**
 * Convert a single ADF node to Markdown
 */
function convertNode(node: ADFNode): string {
  switch (node.type) {
    case "paragraph":
      return convertParagraph(node);
    case "heading":
      return convertHeading(node);
    case "codeBlock":
      return convertCodeBlock(node);
    case "bulletList":
      return convertBulletList(node);
    case "orderedList":
      return convertOrderedList(node);
    case "listItem":
      return convertListItem(node);
    case "blockquote":
      return convertBlockquote(node);
    case "rule":
      return "---";
    case "hardBreak":
      return "\n";
    case "text":
      return convertText(node);
    case "panel":
      return convertPanel(node);
    default:
      // For unknown types, try to convert content recursively
      if (node.content) {
        return node.content.map(convertNode).join("");
      }
      return "";
  }
}

/**
 * Convert paragraph node
 */
function convertParagraph(node: ADFNode): string {
  if (!node.content) return "";
  return node.content.map(convertNode).join("");
}

/**
 * Convert heading node
 */
function convertHeading(node: ADFNode): string {
  const level = (node.attrs?.level as number) || 1;
  const prefix = "#".repeat(level);
  const content = node.content ? node.content.map(convertNode).join("") : "";
  return `${prefix} ${content}`;
}

/**
 * Convert code block node
 */
function convertCodeBlock(node: ADFNode): string {
  const language = (node.attrs?.language as string) || "";
  const code = node.content?.[0]?.text || "";
  return `\`\`\`${language}\n${code}\n\`\`\``;
}

/**
 * Convert bullet list node
 */
function convertBulletList(node: ADFNode): string {
  if (!node.content) return "";
  return node.content.map((item, index) => {
    const content = convertListItem(item);
    return `- ${content}`;
  }).join("\n");
}

/**
 * Convert ordered list node
 */
function convertOrderedList(node: ADFNode): string {
  if (!node.content) return "";
  return node.content.map((item, index) => {
    const content = convertListItem(item);
    return `${index + 1}. ${content}`;
  }).join("\n");
}

/**
 * Convert list item node
 */
function convertListItem(node: ADFNode): string {
  if (!node.content) return "";
  // List items contain paragraphs, so we extract the text
  return node.content.map(child => {
    if (child.type === "paragraph") {
      return child.content ? child.content.map(convertNode).join("") : "";
    }
    return convertNode(child);
  }).join("\n");
}

/**
 * Convert blockquote node
 */
function convertBlockquote(node: ADFNode): string {
  if (!node.content) return "";
  const content = node.content.map(convertNode).join("\n");
  return content.split("\n").map(line => `> ${line}`).join("\n");
}

/**
 * Convert panel node (info/warning/error boxes)
 */
function convertPanel(node: ADFNode): string {
  if (!node.content) return "";
  const content = node.content.map(convertNode).join("\n");
  // Convert panels to blockquotes with emoji indicators
  const panelType = node.attrs?.panelType as string || "info";
  const emoji = {
    info: "ℹ️",
    note: "📝",
    warning: "⚠️",
    error: "❌",
    success: "✅",
  }[panelType] || "ℹ️";
  
  return `> ${emoji} ${content}`;
}

/**
 * Convert text node with marks
 */
function convertText(node: ADFNode): string {
  let text = node.text || "";
  
  if (!node.marks || node.marks.length === 0) {
    return text;
  }

  // Apply marks in reverse order (innermost first)
  for (const mark of node.marks) {
    switch (mark.type) {
      case "strong":
        text = `**${text}**`;
        break;
      case "em":
        text = `*${text}*`;
        break;
      case "code":
        text = `\`${text}\``;
        break;
      case "strike":
        text = `~~${text}~~`;
        break;
      case "link": {
        const href = (mark.attrs?.href as string) || "";
        text = `[${text}](${href})`;
        break;
      }
      // underline has no markdown equivalent, keep as-is
    }
  }

  return text;
}

/**
 * Convert Markdown to ADF document
 */
export function markdownToAdf(markdown: string): ADFDocument {
  const lines = markdown.split("\n");
  const content: ADFNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      content.push({
        type: "codeBlock",
        attrs: { language: language || undefined },
        content: [{ type: "text", text: codeLines.join("\n") }],
      });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      content.push({
        type: "heading",
        attrs: { level: headingMatch[1].length },
        content: parseInlineContent(headingMatch[2]),
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^(---|\*\*\*|___)$/)) {
      content.push({ type: "rule" });
      i++;
      continue;
    }

    // Bullet list
    if (line.match(/^[-*+]\s+/)) {
      const items: ADFNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*+]\s+/)) {
        const itemContent = lines[i].replace(/^[-*+]\s+/, "");
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: parseInlineContent(itemContent) }],
        });
        i++;
      }
      content.push({ type: "bulletList", content: items });
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s+/)) {
      const items: ADFNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        const itemContent = lines[i].replace(/^\d+\.\s+/, "");
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: parseInlineContent(itemContent) }],
        });
        i++;
      }
      content.push({ type: "orderedList", content: items });
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      content.push({
        type: "blockquote",
        content: [{ type: "paragraph", content: parseInlineContent(quoteLines.join("\n")) }],
      });
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    content.push({
      type: "paragraph",
      content: parseInlineContent(line),
    });
    i++;
  }

  return {
    type: "doc",
    version: 1,
    content,
  };
}

/**
 * Parse inline markdown content to ADF nodes
 */
function parseInlineContent(text: string): ADFNode[] {
  const nodes: ADFNode[] = [];
  let remaining = text;

  // Combined regex for inline patterns
  const patterns = [
    // Code (must be first to prevent parsing inside code)
    { regex: /`([^`]+)`/, type: "code" },
    // Bold **text** or __text__
    { regex: /\*\*([^*]+)\*\*/, type: "strong" },
    { regex: /__([^_]+)__/, type: "strong" },
    // Italic *text* or _text_
    { regex: /\*([^*]+)\*/, type: "em" },
    { regex: /_([^_]+)_/, type: "em" },
    // Strikethrough
    { regex: /~~([^~]+)~~/, type: "strike" },
    // Link
    { regex: /\[([^\]]+)\]\(([^)]+)\)/, type: "link" },
  ];

  while (remaining.length > 0) {
    let earliestMatch: { index: number; length: number; node: ADFNode } | null = null;

    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match && match.index !== undefined) {
        if (!earliestMatch || match.index < earliestMatch.index) {
          let node: ADFNode;
          
          if (pattern.type === "link") {
            node = {
              type: "text",
              text: match[1],
              marks: [{ type: "link", attrs: { href: match[2] } }],
            };
          } else {
            node = {
              type: "text",
              text: match[1],
              marks: [{ type: pattern.type }],
            };
          }

          earliestMatch = {
            index: match.index,
            length: match[0].length,
            node,
          };
        }
      }
    }

    if (earliestMatch) {
      // Add text before the match
      if (earliestMatch.index > 0) {
        nodes.push({ type: "text", text: remaining.slice(0, earliestMatch.index) });
      }
      // Add the matched node
      nodes.push(earliestMatch.node);
      // Continue with remaining text
      remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
    } else {
      // No more matches, add remaining text
      if (remaining.length > 0) {
        nodes.push({ type: "text", text: remaining });
      }
      break;
    }
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text: "" }];
}

/**
 * Check if a string is valid ADF JSON
 */
export function isAdfDocument(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return parsed && parsed.type === "doc" && Array.isArray(parsed.content);
  } catch {
    return false;
  }
}


