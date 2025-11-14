/**
 * ADF Builder - Type-safe builder for Atlassian Document Format
 * 
 * Provides a fluent API for creating ADF documents with proper typing.
 */

import {
  ADFDocument,
  ADFBlockNode,
  ADFParagraphNode,
  ADFCodeBlockNode,
  ADFHeadingNode,
  ADFInlineNode,
  ADFTextNode,
  ADFMark,
  ADFLinkMark,
  ADFLanguage,
  ADFBulletListNode,
  ADFListItemNode,
  ADFPanelNode,
} from "./adfTypes";

/**
 * Language mapping from file extensions to ADF language codes
 * Mirrors the Linear implementation but adapted for Jira's ADF format
 */
export function getADFLanguageFromExtension(ext: string): ADFLanguage {
  const languageMap: Record<string, ADFLanguage> = {
    // TypeScript/JavaScript
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    mjs: "javascript",
    cjs: "javascript",
    
    // Python
    py: "python",
    pyw: "python",
    
    // Ruby
    rb: "ruby",
    
    // Go
    go: "go",
    
    // Rust
    rs: "rust",
    
    // Java/Kotlin/Scala
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    scala: "scala",
    
    // C/C++/C#
    c: "c",
    h: "c",
    cpp: "c++",
    hpp: "c++",
    cc: "c++",
    cxx: "c++",
    cs: "csharp",
    
    // Swift/Objective-C
    swift: "swift",
    m: "objective-c",
    mm: "objective-c",
    
    // PHP
    php: "php",
    
    // Shell
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    fish: "shell",
    
    // Markup/Config
    html: "html",
    htm: "html",
    xml: "xml",
    css: "css",
    scss: "sass",
    sass: "sass",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "text",
    ini: "text",
    
    // Markdown
    md: "text",
    markdown: "text",
    
    // SQL
    sql: "sql",
    
    // Elixir/Erlang
    ex: "elixir",
    exs: "elixir",
    erl: "erlang",
    
    // Haskell
    hs: "haskell",
    
    // Clojure
    clj: "clojure",
    cljs: "clojure",
    
    // Dart
    dart: "dart",
    
    // R
    r: "r",
    
    // Lua
    lua: "lua",
    
    // Perl
    pl: "perl",
    pm: "perl",
    
    // GraphQL
    graphql: "graphql",
    gql: "graphql",
    
    // PowerShell
    ps1: "powershell",
    psm1: "powershell",
    
    // Docker
    dockerfile: "text",
    
    // Other
    txt: "text",
  };

  return languageMap[ext.toLowerCase()] || "text";
}

/**
 * Builder for creating ADF documents
 */
export class ADFBuilder {
  private content: ADFBlockNode[] = [];

  /**
   * Add a paragraph with optional text content
   */
  paragraph(text?: string, marks?: ADFMark[]): this {
    const paragraph: ADFParagraphNode = {
      type: "paragraph",
    };

    if (text) {
      paragraph.content = [
        {
          type: "text",
          text,
          marks,
        },
      ];
    }

    this.content.push(paragraph);
    return this;
  }

  /**
   * Add a paragraph with rich inline content
   */
  richParagraph(content: ADFInlineNode[]): this {
    this.content.push({
      type: "paragraph",
      content,
    });
    return this;
  }

  /**
   * Add a code block
   */
  codeBlock(code: string, language?: ADFLanguage): this {
    const codeBlock: ADFCodeBlockNode = {
      type: "codeBlock",
      attrs: language ? { language } : undefined,
      content: [
        {
          type: "text",
          text: code,
        },
      ],
    };

    this.content.push(codeBlock);
    return this;
  }

  /**
   * Add a heading
   */
  heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6): this {
    this.content.push({
      type: "heading",
      attrs: { level },
      content: [{ type: "text", text }],
    });
    return this;
  }

  /**
   * Add a bullet list
   */
  bulletList(items: string[]): this {
    const listItems: ADFListItemNode[] = items.map((item) => ({
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: item }],
        },
      ],
    }));

    this.content.push({
      type: "bulletList",
      content: listItems,
    });
    return this;
  }

  /**
   * Add a panel (colored box for info/warning/error)
   */
  panel(
    panelType: "info" | "note" | "warning" | "error" | "success",
    content: ADFBlockNode[]
  ): this {
    this.content.push({
      type: "panel",
      attrs: { panelType },
      content,
    });
    return this;
  }

  /**
   * Add a horizontal rule
   */
  rule(): this {
    this.content.push({
      type: "rule",
    });
    return this;
  }

  /**
   * Build the final ADF document
   */
  build(): ADFDocument {
    return {
      type: "doc",
      version: 1,
      content: this.content,
    };
  }
}

/**
 * Helper functions for creating inline content
 */
export const adf = {
  /**
   * Create a text node
   */
  text(text: string, marks?: ADFMark[]): ADFTextNode {
    return { type: "text", text, marks };
  },

  /**
   * Create bold text
   */
  strong(text: string): ADFTextNode {
    return {
      type: "text",
      text,
      marks: [{ type: "strong" }],
    };
  },

  /**
   * Create italic text
   */
  em(text: string): ADFTextNode {
    return {
      type: "text",
      text,
      marks: [{ type: "em" }],
    };
  },

  /**
   * Create inline code
   */
  code(text: string): ADFTextNode {
    return {
      type: "text",
      text,
      marks: [{ type: "code" }],
    };
  },

  /**
   * Create a link
   */
  link(text: string, href: string, title?: string): ADFTextNode {
    const mark: ADFLinkMark = {
      type: "link",
      attrs: { href, title },
    };
    return {
      type: "text",
      text,
      marks: [mark],
    };
  },

  /**
   * Create a line break
   */
  hardBreak() {
    return { type: "hardBreak" as const };
  },
};

