import React, { useCallback, useMemo } from "react";
import { NodeViewContent, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { toHtml } from "hast-util-to-html";
import styles from "./CodeBlockComponent.module.css";
import "./highlight.css"; // Plain CSS for syntax highlighting colors

// Create lowlight instance
const lowlight = createLowlight(common);

// Common programming languages for the selector
const LANGUAGES = [
  { value: "text", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "sql", label: "SQL" },
  { value: "graphql", label: "GraphQL" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "powershell", label: "PowerShell" },
  { value: "dockerfile", label: "Dockerfile" },
];

// Map language aliases to lowlight language names
const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  tsx: "typescript",
  jsx: "javascript",
  py: "python",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  "c#": "csharp",
};

export const CodeBlockComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
}) => {
  const language = node.attrs.language || "text";
  const code = node.textContent;

  // Get highlighted HTML for the backdrop
  const highlightedCode = useMemo(() => {
    if (!code || language === "text") {
      // Return code with preserved whitespace
      return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    try {
      // Map language alias to actual language name
      const langName = LANGUAGE_MAP[language.toLowerCase()] || language.toLowerCase();
      
      // Check if language is registered
      if (!lowlight.registered(langName)) {
        return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }

      const tree = lowlight.highlight(langName, code);
      return toHtml(tree);
    } catch (error) {
      console.warn("[CodeBlock] Highlighting failed:", error);
      return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }, [code, language]);

  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateAttributes({ language: e.target.value });
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper className={styles.codeBlockWrapper}>
      <div className={styles.codeBlockHeader} contentEditable={false}>
        <select
          value={language}
          onChange={handleLanguageChange}
          className={styles.languageSelect}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.codeBlockContainer}>
        {/* Highlighted backdrop - shows syntax highlighting */}
        <pre className={styles.codeBlockBackdrop} aria-hidden="true">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
        {/* Editable overlay - transparent text, handles editing */}
        <pre className={styles.codeBlockPre}>
          <code className={styles.codeBlockCode}>
            <NodeViewContent />
          </code>
        </pre>
      </div>
    </NodeViewWrapper>
  );
};

export default CodeBlockComponent;

