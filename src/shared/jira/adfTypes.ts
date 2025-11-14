/**
 * Atlassian Document Format (ADF) Type Definitions
 * 
 * ADF is a JSON-based document format used by Jira, Confluence, and other Atlassian products.
 * This provides type-safe interfaces for building ADF documents.
 * 
 * Reference: https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/
 */

/**
 * Mark types for text formatting
 */
export type ADFMarkType = 
  | "strong" 
  | "em" 
  | "code" 
  | "strike" 
  | "underline" 
  | "subsup" 
  | "textColor"
  | "link";

export interface ADFLinkMark {
  type: "link";
  attrs: {
    href: string;
    title?: string;
  };
}

export interface ADFTextColorMark {
  type: "textColor";
  attrs: {
    color: string;
  };
}

export interface ADFSimpleMark {
  type: Exclude<ADFMarkType, "link" | "textColor">;
}

export type ADFMark = ADFSimpleMark | ADFLinkMark | ADFTextColorMark;

/**
 * Text node with optional marks (formatting)
 */
export interface ADFTextNode {
  type: "text";
  text: string;
  marks?: ADFMark[];
}

/**
 * Hard break node
 */
export interface ADFHardBreakNode {
  type: "hardBreak";
}

/**
 * Inline content that can appear within paragraphs
 */
export type ADFInlineNode = ADFTextNode | ADFHardBreakNode;

/**
 * Paragraph node
 */
export interface ADFParagraphNode {
  type: "paragraph";
  content?: ADFInlineNode[];
}

/**
 * Code block with optional language
 */
export interface ADFCodeBlockNode {
  type: "codeBlock";
  attrs?: {
    language?: string;
  };
  content?: ADFTextNode[];
}

/**
 * Heading node (h1-h6)
 */
export interface ADFHeadingNode {
  type: "heading";
  attrs: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
  content?: ADFInlineNode[];
}

/**
 * Bullet list item
 */
export interface ADFBulletListNode {
  type: "bulletList";
  content: ADFListItemNode[];
}

/**
 * Ordered list
 */
export interface ADFOrderedListNode {
  type: "orderedList";
  content: ADFListItemNode[];
}

/**
 * List item
 */
export interface ADFListItemNode {
  type: "listItem";
  content: ADFBlockNode[];
}

/**
 * Block quote
 */
export interface ADFBlockquoteNode {
  type: "blockquote";
  content: ADFBlockNode[];
}

/**
 * Rule (horizontal line)
 */
export interface ADFRuleNode {
  type: "rule";
}

/**
 * Panel (info/note/warning/error/success)
 */
export interface ADFPanelNode {
  type: "panel";
  attrs: {
    panelType: "info" | "note" | "warning" | "error" | "success";
  };
  content: ADFBlockNode[];
}

/**
 * Block-level nodes
 */
export type ADFBlockNode =
  | ADFParagraphNode
  | ADFCodeBlockNode
  | ADFHeadingNode
  | ADFBulletListNode
  | ADFOrderedListNode
  | ADFBlockquoteNode
  | ADFRuleNode
  | ADFPanelNode;

/**
 * Root document node
 */
export interface ADFDocument {
  type: "doc";
  version: 1;
  content: ADFBlockNode[];
}

/**
 * Language codes supported by ADF code blocks
 * Jira supports syntax highlighting for these languages
 */
export type ADFLanguage =
  | "abap"
  | "actionscript"
  | "ada"
  | "arduino"
  | "autoit"
  | "c"
  | "c++"
  | "clojure"
  | "coffeescript"
  | "csharp"
  | "css"
  | "cuda"
  | "d"
  | "dart"
  | "delphi"
  | "elixir"
  | "erlang"
  | "fortran"
  | "foxpro"
  | "go"
  | "graphql"
  | "groovy"
  | "haskell"
  | "haxe"
  | "html"
  | "java"
  | "javascript"
  | "json"
  | "jsx"
  | "julia"
  | "kotlin"
  | "livescript"
  | "lua"
  | "mathematica"
  | "matlab"
  | "objective-c"
  | "objective-j"
  | "objectpascal"
  | "ocaml"
  | "octave"
  | "perl"
  | "php"
  | "powershell"
  | "prolog"
  | "puppet"
  | "python"
  | "qml"
  | "r"
  | "racket"
  | "restructuredtext"
  | "ruby"
  | "rust"
  | "sass"
  | "scala"
  | "scheme"
  | "shell"
  | "smalltalk"
  | "sql"
  | "standardml"
  | "swift"
  | "tcl"
  | "tex"
  | "text"
  | "tsx"
  | "typescript"
  | "vala"
  | "vbnet"
  | "verilog"
  | "vhdl"
  | "xml"
  | "xquery"
  | "yaml";

