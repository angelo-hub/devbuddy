/**
 * ADF (Atlassian Document Format) to React/HTML Renderer
 * 
 * Converts Jira's ADF format to React components with syntax highlighting
 * Uses lowlight (highlight.js) for syntax highlighting
 */

import React from "react";
import { common, createLowlight } from "lowlight";
import { toHtml } from "hast-util-to-html";
import type { EnrichedTicketMetadata } from "../types/messages";

// Import highlight styles (shared with editor)
import "../components/MarkdownEditor/highlight.css";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// ADF Types (simplified)
interface ADFNode {
  type: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: unknown }>;
  attrs?: { 
    language?: string; 
    level?: number; 
    panelType?: string;
    // Mention attrs
    id?: string;
    text?: string;  // Display text for mentions
    accessLevel?: string;
    localId?: string;
    // InlineCard attrs
    url?: string;
  };
  content?: ADFNode[];
}

interface ADFDocument {
  type: "doc";
  version: number;
  content: ADFNode[];
}

/**
 * Map ADF language codes to lowlight language identifiers
 */
const languageMap: Record<string, string> = {
  typescript: "typescript",
  tsx: "typescript", // lowlight uses typescript for tsx
  javascript: "javascript",
  jsx: "javascript", // lowlight uses javascript for jsx
  python: "python",
  java: "java",
  go: "go",
  rust: "rust",
  c: "c",
  "c++": "cpp",
  cpp: "cpp",
  csharp: "csharp",
  ruby: "ruby",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
  scala: "scala",
  shell: "bash",
  bash: "bash",
  json: "json",
  yaml: "yaml",
  markdown: "markdown",
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
 * Render inline text content with marks (formatting)
 */
function renderTextNode(node: ADFNode, key: number): React.ReactNode {
  if (!node.text) return null;

  let element: React.ReactNode = node.text;

  // Apply marks (formatting)
  if (node.marks && node.marks.length > 0) {
    for (const mark of node.marks) {
      switch (mark.type) {
        case "strong":
          element = <strong key={key}>{element}</strong>;
          break;
        case "em":
          element = <em key={key}>{element}</em>;
          break;
        case "code":
          element = <code key={key} style={{ 
            backgroundColor: "var(--vscode-textCodeBlock-background)",
            padding: "2px 4px",
            borderRadius: "3px",
            fontFamily: "var(--vscode-editor-font-family)",
            fontSize: "0.9em",
          }}>{element}</code>;
          break;
        case "strike":
          element = <del key={key}>{element}</del>;
          break;
        case "underline":
          element = <u key={key}>{element}</u>;
          break;
        case "link": {
          const attrs = mark.attrs as { href?: string };
          element = (
            <a
              key={key}
              href={attrs?.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--vscode-textLink-foreground)" }}
            >
              {element}
            </a>
          );
          break;
        }
      }
    }
  }

  return element;
}

/**
 * Render a paragraph node
 */
function renderParagraphWithMetadata(
  node: ADFNode, 
  key: number,
  options?: ADFRenderOptions
): React.ReactNode {
  if (!node.content || node.content.length === 0) {
    return <p key={key}>&nbsp;</p>;
  }

  return (
    <p key={key} style={{ marginBottom: "8px", lineHeight: "1.6" }}>
      {node.content.map((child, idx) => renderNode(child, idx, options))}
    </p>
  );
}

/**
 * Render a code block with syntax highlighting
 */
function renderCodeBlock(node: ADFNode, key: number): React.ReactNode {
  const language = node.attrs?.language || "text";
  const langName = languageMap[language.toLowerCase()] || "text";
  const code = node.content?.[0]?.text || "";

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
          }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    );
  } catch (error) {
    console.error("[ADF Renderer] Failed to highlight code:", error);
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
 * Render a heading node
 */
function renderHeadingWithMetadata(
  node: ADFNode, 
  key: number,
  options?: ADFRenderOptions
): React.ReactNode {
  const level = node.attrs?.level || 1;
  const content = node.content?.map((child, idx) => renderNode(child, idx, options));
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <Tag key={key} style={{ marginBottom: "8px", marginTop: "16px" }}>
      {content}
    </Tag>
  );
}

/**
 * Render a bullet list
 */
function renderBulletListWithMetadata(
  node: ADFNode, 
  key: number,
  options?: ADFRenderOptions
): React.ReactNode {
  return (
    <ul key={key} style={{ marginBottom: "12px", paddingLeft: "20px" }}>
      {node.content?.map((child, idx) => renderNode(child, idx, options))}
    </ul>
  );
}

/**
 * Render an ordered list
 */
function renderOrderedListWithMetadata(
  node: ADFNode, 
  key: number,
  options?: ADFRenderOptions
): React.ReactNode {
  return (
    <ol key={key} style={{ marginBottom: "12px", paddingLeft: "20px" }}>
      {node.content?.map((child, idx) => renderNode(child, idx, options))}
    </ol>
  );
}

/**
 * Render a list item
 */
function renderListItemWithMetadata(
  node: ADFNode, 
  key: number,
  options?: ADFRenderOptions
): React.ReactNode {
  return (
    <li key={key} style={{ marginBottom: "4px" }}>
      {node.content?.map((child, idx) => renderNode(child, idx, options))}
    </li>
  );
}

/**
 * Render a horizontal rule
 */
function renderRule(key: number): React.ReactNode {
  return (
    <hr
      key={key}
      style={{
        border: "none",
        borderTop: "1px solid var(--vscode-panel-border)",
        margin: "16px 0",
      }}
    />
  );
}

/**
 * Render a panel (info/warning/error boxes)
 */
function renderPanelWithMetadata(
  node: ADFNode, 
  key: number,
  options?: ADFRenderOptions
): React.ReactNode {
  const panelType = node.attrs?.panelType || "info";
  
  const colors = {
    info: { bg: "rgba(45, 114, 210, 0.1)", border: "rgba(45, 114, 210, 0.5)" },
    note: { bg: "rgba(106, 115, 125, 0.1)", border: "rgba(106, 115, 125, 0.5)" },
    warning: { bg: "rgba(255, 193, 7, 0.1)", border: "rgba(255, 193, 7, 0.5)" },
    error: { bg: "rgba(220, 38, 38, 0.1)", border: "rgba(220, 38, 38, 0.5)" },
    success: { bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.5)" },
  };

  const color = colors[panelType as keyof typeof colors] || colors.info;

  return (
    <div
      key={key}
      style={{
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        padding: "12px",
        marginBottom: "12px",
        borderRadius: "4px",
      }}
    >
      {node.content?.map((child, idx) => renderNode(child, idx, options))}
    </div>
  );
}

/**
 * Render a hardBreak (line break)
 */
function renderHardBreak(key: number): React.ReactNode {
  return <br key={key} />;
}

/**
 * Render a mention node (@user)
 */
function renderMention(node: ADFNode, key: number): React.ReactNode {
  // Get text from attrs.text (where Jira puts it) or fallback
  const text = node.attrs?.text || node.text || `@${node.attrs?.id || "unknown"}`;
  
  return (
    <span
      key={key}
      style={{
        backgroundColor: "var(--vscode-badge-background)",
        color: "var(--vscode-badge-foreground)",
        padding: "2px 6px",
        borderRadius: "12px",
        fontSize: "0.9em",
        fontWeight: 500,
        marginLeft: "2px",
        marginRight: "2px",
      }}
    >
      {text}
    </span>
  );
}

/**
 * Extract Jira issue key from URL
 */
function extractIssueKeyFromUrl(url: string): string | null {
  // Match patterns like /browse/DEV-4 or /issue/DEV-4
  const match = url.match(/\/(?:browse|issue)\/([A-Z]+-\d+)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Get status color based on status category
 */
function getStatusColor(status?: string): string {
  if (!status) return "var(--vscode-badge-background)";
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes("done") || statusLower.includes("complete") || statusLower.includes("closed")) {
    return "#22c55e"; // green
  }
  if (statusLower.includes("progress") || statusLower.includes("review") || statusLower.includes("active")) {
    return "#3b82f6"; // blue
  }
  if (statusLower.includes("blocked") || statusLower.includes("impediment")) {
    return "#ef4444"; // red
  }
  return "#6b7280"; // gray for todo/backlog
}

/**
 * Render an inlineCard node (issue link)
 */
function renderInlineCard(
  node: ADFNode, 
  key: number,
  options?: ADFRenderOptions
): React.ReactNode {
  const url = node.attrs?.url || "";
  const issueKey = extractIssueKeyFromUrl(url);
  
  // Check for enriched metadata
  const metadata = issueKey ? options?.enrichedMetadata?.get(issueKey) : undefined;
  
  // Handler for clicking the ticket link
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (issueKey && options?.onTicketClick) {
      options.onTicketClick(issueKey);
    }
  };
  
  // Only make it clickable if we have a callback
  const isClickable = !!options?.onTicketClick && !!issueKey;
  
  if (metadata) {
    const statusColor = getStatusColor(metadata.status);
    
    return (
      <span
        key={key}
        onClick={isClickable ? handleClick : undefined}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "var(--vscode-editor-inactiveSelectionBackground)",
          color: "var(--vscode-textLink-foreground)",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "0.9em",
          marginLeft: "2px",
          marginRight: "2px",
          border: "1px solid var(--vscode-panel-border)",
          cursor: isClickable ? "pointer" : "default",
        }}
      >
        <span style={{ 
          width: "8px", 
          height: "8px", 
          borderRadius: "50%", 
          backgroundColor: statusColor,
          flexShrink: 0,
        }} />
        <span style={{ fontWeight: 500 }}>{issueKey}:</span>
        <span style={{ 
          maxWidth: "200px", 
          overflow: "hidden", 
          textOverflow: "ellipsis", 
          whiteSpace: "nowrap" 
        }}>
          {metadata.title}
        </span>
        <span style={{
          backgroundColor: "var(--vscode-badge-background)",
          color: "var(--vscode-badge-foreground)",
          padding: "1px 6px",
          borderRadius: "3px",
          fontSize: "0.8em",
          textTransform: "uppercase",
        }}>
          {metadata.status}
        </span>
      </span>
    );
  }
  
  // Fallback: render as clickable link with issue key
  return (
    <span
      key={key}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      style={{
        color: "var(--vscode-textLink-foreground)",
        marginLeft: "2px",
        marginRight: "2px",
        cursor: isClickable ? "pointer" : "default",
        textDecoration: "underline",
      }}
    >
      {issueKey || url}
    </span>
  );
}

/**
 * Render any ADF node
 */
function renderNode(
  node: ADFNode, 
  key: number,
  options?: ADFRenderOptions
): React.ReactNode {
  switch (node.type) {
    case "text":
      return renderTextNode(node, key);
    case "paragraph":
      return renderParagraphWithMetadata(node, key, options);
    case "codeBlock":
      return renderCodeBlock(node, key);
    case "heading":
      return renderHeadingWithMetadata(node, key, options);
    case "bulletList":
      return renderBulletListWithMetadata(node, key, options);
    case "orderedList":
      return renderOrderedListWithMetadata(node, key, options);
    case "listItem":
      return renderListItemWithMetadata(node, key, options);
    case "rule":
      return renderRule(key);
    case "panel":
      return renderPanelWithMetadata(node, key, options);
    case "hardBreak":
      return renderHardBreak(key);
    case "mention":
      return renderMention(node, key);
    case "inlineCard":
      return renderInlineCard(node, key, options);
    default:
      // Unsupported node type - render children if available
      if (node.content) {
        return node.content.map((child, idx) => renderNode(child, idx, options));
      }
      return null;
  }
}

/**
 * Options for ADF rendering
 */
export interface ADFRenderOptions {
  /** Callback when a ticket link is clicked */
  onTicketClick?: (ticketId: string) => void;
  /** Enriched metadata for ticket links (title, status) */
  enrichedMetadata?: Map<string, EnrichedTicketMetadata>;
}

/**
 * Main renderer: Convert ADF document to React elements
 * 
 * @param adf - The ADF document to render
 * @param options - Render options including enrichedMetadata and onTicketClick callback
 */
export function renderADF(
  adf: ADFDocument | string,
  options?: ADFRenderOptions | Map<string, EnrichedTicketMetadata>
): React.ReactNode {
  // Handle both old signature (Map) and new signature (options object)
  const renderOptions: ADFRenderOptions = options instanceof Map 
    ? { enrichedMetadata: options }
    : options || {};
  try {
    // Parse if string
    const doc = typeof adf === "string" ? JSON.parse(adf) : adf;

    if (!doc || doc.type !== "doc" || !doc.content) {
      return null;
    }

    return (
      <div style={{ lineHeight: "1.6" }}>
        {doc.content.map((node: ADFNode, idx: number) => renderNode(node, idx, renderOptions))}
      </div>
    );
  } catch (error) {
    console.error("Failed to render ADF:", error);
    // Fallback to plain text
    return <div>{typeof adf === "string" ? adf : JSON.stringify(adf)}</div>;
  }
}

