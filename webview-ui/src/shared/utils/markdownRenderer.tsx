/**
 * Markdown to React/HTML Renderer
 * 
 * Converts Markdown (used by Linear) to React components with syntax highlighting
 * Uses lowlight (highlight.js) for syntax highlighting
 */

import React from "react";
import { common, createLowlight } from "lowlight";
import { toHtml } from "hast-util-to-html";

// Import highlight styles (shared with editor)
import "../components/MarkdownEditor/highlight.css";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

/**
 * Map language codes to lowlight language identifiers
 */
const languageMap: Record<string, string> = {
  typescript: "typescript",
  tsx: "typescript", // lowlight uses typescript for tsx
  ts: "typescript",
  javascript: "javascript",
  jsx: "javascript", // lowlight uses javascript for jsx
  js: "javascript",
  python: "python",
  py: "python",
  java: "java",
  go: "go",
  rust: "rust",
  rs: "rust",
  c: "c",
  "c++": "cpp",
  cpp: "cpp",
  csharp: "csharp",
  "c#": "csharp",
  cs: "csharp",
  ruby: "ruby",
  rb: "ruby",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
  kt: "kotlin",
  scala: "scala",
  shell: "bash",
  bash: "bash",
  sh: "bash",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  markdown: "markdown",
  md: "markdown",
  sql: "sql",
  graphql: "graphql",
  css: "css",
  sass: "scss",
  scss: "scss",
  html: "xml",
  xml: "xml",
  text: "text",
};

/**
 * Parse inline markdown formatting (bold, italic, code, links, strikethrough)
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let key = 0;
  let lastIndex = 0;

  // Combined regex that matches all inline patterns
  // Order matters: code first (to avoid parsing inside code), then bold (before italic), then rest
  const combinedRegex = /(`[^`]+`)|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*]+)\*)|(_([^_]+)_)|(~~([^~]+)~~)|(\[([^\]]+)\]\(([^)]+)\))/g;

  let match;
  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        elements.push(beforeText);
      }
    }

    // Determine which pattern matched and create appropriate element
    if (match[1]) {
      // Inline code: `code`
      const code = match[1].slice(1, -1); // Remove backticks
      elements.push(
        <code
          key={`code-${key++}`}
          style={{
            backgroundColor: "var(--vscode-textCodeBlock-background)",
            padding: "2px 4px",
            borderRadius: "3px",
            fontFamily: "var(--vscode-editor-font-family)",
            fontSize: "0.9em",
          }}
        >
          {code}
        </code>
      );
    } else if (match[2]) {
      // Bold: **text**
      const content = match[3];
      // Recursively parse nested formatting
      elements.push(
        <strong key={`bold-${key++}`}>
          {parseInlineMarkdown(content)}
        </strong>
      );
    } else if (match[4]) {
      // Bold: __text__
      const content = match[5];
      elements.push(
        <strong key={`bold-${key++}`}>
          {parseInlineMarkdown(content)}
        </strong>
      );
    } else if (match[6]) {
      // Italic: *text*
      const content = match[7];
      elements.push(
        <em key={`italic-${key++}`}>
          {parseInlineMarkdown(content)}
        </em>
      );
    } else if (match[8]) {
      // Italic: _text_
      const content = match[9];
      elements.push(
        <em key={`italic-${key++}`}>
          {parseInlineMarkdown(content)}
        </em>
      );
    } else if (match[10]) {
      // Strikethrough: ~~text~~
      const content = match[11];
      elements.push(
        <del key={`strike-${key++}`}>
          {parseInlineMarkdown(content)}
        </del>
      );
    } else if (match[12]) {
      // Link: [text](url)
      const linkText = match[13];
      const url = match[14];
      elements.push(
        <a
          key={`link-${key++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--vscode-textLink-foreground)" }}
        >
          {linkText}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    if (remaining) {
      elements.push(remaining);
    }
  }

  return elements.length > 0 ? elements : [text];
}

/**
 * Render a code block with syntax highlighting
 */
function renderCodeBlock(code: string, language: string = "text", key: number): React.ReactNode {
  const langName = languageMap[language.toLowerCase()] || "text";

  try {
    // Check if language is supported
    if (langName === "text" || !lowlight.registered(langName)) {
      return renderPlainCodeBlock(code, key);
    }

    // Highlight code with lowlight
    const tree = lowlight.highlight(langName, code);
    const highlighted = toHtml(tree);

    return (
      <pre
        key={key}
        style={{
          backgroundColor: "var(--vscode-editor-background)",
          border: "1px solid var(--vscode-panel-border)",
          borderRadius: "4px",
          padding: "16px",
          overflow: "auto",
          marginBottom: "16px",
          fontSize: "13px",
          lineHeight: "1.6",
          fontFamily: "var(--vscode-editor-font-family, 'Menlo', 'Monaco', 'Courier New', monospace)",
        }}
      >
        <code
          style={{
            fontFamily: "inherit",
            fontSize: "inherit",
            background: "transparent",
            display: "block",
          }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    );
  } catch (error) {
    console.error("[Markdown Renderer] Failed to highlight code:", error);
    return renderPlainCodeBlock(code, key);
  }
}

/**
 * Render plain code block without highlighting (fallback)
 */
function renderPlainCodeBlock(code: string, key: number): React.ReactNode {
  return (
    <pre
      key={key}
      style={{
        backgroundColor: "var(--vscode-editor-background)",
        border: "1px solid var(--vscode-panel-border)",
        borderRadius: "4px",
        padding: "16px",
        overflow: "auto",
        marginBottom: "16px",
        fontSize: "13px",
        lineHeight: "1.6",
        fontFamily: "var(--vscode-editor-font-family, 'Menlo', 'Monaco', 'Courier New', monospace)",
        color: "var(--vscode-editor-foreground)",
      }}
    >
      <code>{code}</code>
    </pre>
  );
}

/**
 * Main renderer: Convert Markdown to React elements
 */
export function renderMarkdown(markdown: string | undefined): React.ReactNode {
  if (!markdown) {
    return null;
  }

  try {
    const lines = markdown.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockLanguage = "";
    let codeBlockContent: string[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];
    let listType: "ul" | "ol" | null = null;
    let key = 0;

    const flushList = () => {
      if (inList && listItems.length > 0) {
        const ListTag = listType === "ol" ? "ol" : "ul";
        elements.push(
          <ListTag key={key++} style={{ marginBottom: "12px", paddingLeft: "20px" }}>
            {listItems}
          </ListTag>
        );
        listItems = [];
        inList = false;
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          // End code block
          const codeText = codeBlockContent.join("\n");
          if (codeText.trim()) {
            elements.push(renderCodeBlock(codeText, codeBlockLanguage, key++));
          }
          inCodeBlock = false;
          codeBlockLanguage = "";
          codeBlockContent = [];
        } else {
          // Start code block
          flushList();
          inCodeBlock = true;
          codeBlockLanguage = line.substring(3).trim();
          codeBlockContent = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const content = headingMatch[2];
        const Tag = `h${level}` as keyof JSX.IntrinsicElements;
        elements.push(
          <Tag key={key++} style={{ marginBottom: "8px", marginTop: "16px" }}>
            {parseInlineMarkdown(content)}
          </Tag>
        );
        continue;
      }

      // Handle horizontal rule
      if (line.match(/^(---|\*\*\*|___)$/)) {
        flushList();
        elements.push(
          <hr
            key={key++}
            style={{
              border: "none",
              borderTop: "1px solid var(--vscode-panel-border)",
              margin: "16px 0",
            }}
          />
        );
        continue;
      }

      // Handle unordered lists
      const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
      if (ulMatch) {
        if (!inList || listType !== "ul") {
          flushList();
          inList = true;
          listType = "ul";
        }
        listItems.push(
          <li key={key++} style={{ marginBottom: "4px" }}>
            {parseInlineMarkdown(ulMatch[1])}
          </li>
        );
        continue;
      }

      // Handle ordered lists
      const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      if (olMatch) {
        if (!inList || listType !== "ol") {
          flushList();
          inList = true;
          listType = "ol";
        }
        listItems.push(
          <li key={key++} style={{ marginBottom: "4px" }}>
            {parseInlineMarkdown(olMatch[1])}
          </li>
        );
        continue;
      }

      // Handle blockquotes
      const quoteMatch = line.match(/^>\s+(.+)$/);
      if (quoteMatch) {
        flushList();
        elements.push(
          <blockquote
            key={key++}
            style={{
              borderLeft: "4px solid var(--vscode-textBlockQuote-border)",
              backgroundColor: "var(--vscode-textBlockQuote-background)",
              padding: "8px 16px",
              marginBottom: "12px",
              fontStyle: "italic",
            }}
          >
            {parseInlineMarkdown(quoteMatch[1])}
          </blockquote>
        );
        continue;
      }

      // Handle empty lines
      if (line.trim() === "") {
        flushList();
        if (elements.length > 0) {
          elements.push(<br key={key++} />);
        }
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={key++} style={{ marginBottom: "8px", lineHeight: "1.6" }}>
          {parseInlineMarkdown(line)}
        </p>
      );
    }

    // Flush any remaining list
    flushList();

    // Handle unclosed code block
    if (inCodeBlock && codeBlockContent.length > 0) {
      const codeText = codeBlockContent.join("\n");
      if (codeText.trim()) {
        elements.push(renderCodeBlock(codeText, codeBlockLanguage, key++));
      }
    }

    return <div style={{ lineHeight: "1.6" }}>{elements}</div>;
  } catch (error) {
    console.error("[Markdown Renderer] Failed to render markdown:", error);
    // Fallback to plain text with line breaks
    return (
      <div style={{ whiteSpace: "pre-wrap" }}>
        {markdown}
      </div>
    );
  }
}

