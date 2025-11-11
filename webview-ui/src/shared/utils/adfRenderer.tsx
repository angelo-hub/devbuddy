/**
 * ADF (Atlassian Document Format) to React/HTML Renderer
 * 
 * Converts Jira's ADF format to React components with syntax highlighting
 */

import React from "react";
import Prism from "prismjs";

// Import Prism theme - using a dark theme that works well with VS Code
import "prismjs/themes/prism-tomorrow.css";

// Import common languages
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-php";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-scala";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-markup";

// ADF Types (simplified)
interface ADFNode {
  type: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: unknown }>;
  attrs?: { language?: string; level?: number; panelType?: string };
  content?: ADFNode[];
}

interface ADFDocument {
  type: "doc";
  version: number;
  content: ADFNode[];
}

/**
 * Map ADF language codes to Prism language identifiers
 */
const languageMap: Record<string, string> = {
  typescript: "typescript",
  tsx: "tsx",
  javascript: "javascript",
  jsx: "jsx",
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
  html: "markup",
  xml: "markup",
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
        case "link":
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

  return element;
}

/**
 * Render a paragraph node
 */
function renderParagraph(node: ADFNode, key: number): React.ReactNode {
  if (!node.content || node.content.length === 0) {
    return <p key={key}>&nbsp;</p>;
  }

  return (
    <p key={key} style={{ marginBottom: "8px", lineHeight: "1.6" }}>
      {node.content.map((child, idx) => renderNode(child, idx))}
    </p>
  );
}

/**
 * Render a code block with syntax highlighting
 */
function renderCodeBlock(node: ADFNode, key: number): React.ReactNode {
  const language = node.attrs?.language || "text";
  const prismLanguage = languageMap[language.toLowerCase()] || "text";
  const code = node.content?.[0]?.text || "";

  try {
    // Highlight code with Prism
    const highlighted = Prism.highlight(
      code,
      Prism.languages[prismLanguage] || Prism.languages.text,
      prismLanguage
    );

    return (
      <pre
        key={key}
        style={{
          backgroundColor: "var(--vscode-editor-background)",
          border: "1px solid var(--vscode-panel-border)",
          borderRadius: "4px",
          padding: "12px",
          overflow: "auto",
          marginBottom: "12px",
          fontSize: "13px",
          lineHeight: "1.5",
        }}
      >
        <code
          className={`language-${prismLanguage}`}
          style={{ fontFamily: "var(--vscode-editor-font-family)" }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    );
  } catch (error) {
    // Fallback to plain code block
    return (
      <pre
        key={key}
        style={{
          backgroundColor: "var(--vscode-editor-background)",
          border: "1px solid var(--vscode-panel-border)",
          borderRadius: "4px",
          padding: "12px",
          overflow: "auto",
          marginBottom: "12px",
          fontSize: "13px",
          lineHeight: "1.5",
          fontFamily: "var(--vscode-editor-font-family)",
        }}
      >
        <code>{code}</code>
      </pre>
    );
  }
}

/**
 * Render a heading node
 */
function renderHeading(node: ADFNode, key: number): React.ReactNode {
  const level = node.attrs?.level || 1;
  const content = node.content?.map((child, idx) => renderNode(child, idx));
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag key={key} style={{ marginBottom: "8px", marginTop: "16px" }}>
      {content}
    </Tag>
  );
}

/**
 * Render a bullet list
 */
function renderBulletList(node: ADFNode, key: number): React.ReactNode {
  return (
    <ul key={key} style={{ marginBottom: "12px", paddingLeft: "20px" }}>
      {node.content?.map((child, idx) => renderNode(child, idx))}
    </ul>
  );
}

/**
 * Render an ordered list
 */
function renderOrderedList(node: ADFNode, key: number): React.ReactNode {
  return (
    <ol key={key} style={{ marginBottom: "12px", paddingLeft: "20px" }}>
      {node.content?.map((child, idx) => renderNode(child, idx))}
    </ol>
  );
}

/**
 * Render a list item
 */
function renderListItem(node: ADFNode, key: number): React.ReactNode {
  return (
    <li key={key} style={{ marginBottom: "4px" }}>
      {node.content?.map((child, idx) => renderNode(child, idx))}
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
function renderPanel(node: ADFNode, key: number): React.ReactNode {
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
      {node.content?.map((child, idx) => renderNode(child, idx))}
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
 * Render any ADF node
 */
function renderNode(node: ADFNode, key: number): React.ReactNode {
  switch (node.type) {
    case "text":
      return renderTextNode(node, key);
    case "paragraph":
      return renderParagraph(node, key);
    case "codeBlock":
      return renderCodeBlock(node, key);
    case "heading":
      return renderHeading(node, key);
    case "bulletList":
      return renderBulletList(node, key);
    case "orderedList":
      return renderOrderedList(node, key);
    case "listItem":
      return renderListItem(node, key);
    case "rule":
      return renderRule(key);
    case "panel":
      return renderPanel(node, key);
    case "hardBreak":
      return renderHardBreak(key);
    default:
      // Unsupported node type - render children if available
      if (node.content) {
        return node.content.map((child, idx) => renderNode(child, idx));
      }
      return null;
  }
}

/**
 * Main renderer: Convert ADF document to React elements
 */
export function renderADF(adf: ADFDocument | string): React.ReactNode {
  try {
    // Parse if string
    const doc = typeof adf === "string" ? JSON.parse(adf) : adf;

    if (!doc || doc.type !== "doc" || !doc.content) {
      return null;
    }

    return (
      <div style={{ lineHeight: "1.6" }}>
        {doc.content.map((node, idx) => renderNode(node, idx))}
      </div>
    );
  } catch (error) {
    console.error("Failed to render ADF:", error);
    // Fallback to plain text
    return <div>{typeof adf === "string" ? adf : JSON.stringify(adf)}</div>;
  }
}

