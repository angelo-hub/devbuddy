/**
 * Markdown Builder for Linear
 * Similar to ADFBuilder but generates clean, properly formatted Markdown
 */

/**
 * Escape special Markdown characters
 */
function escapeMarkdown(text: string): string {
  // Escape special Markdown characters but preserve intentional formatting
  return text
    .replace(/\\/g, '\\\\')  // Backslash
    .replace(/`/g, '\\`');    // Backticks (for inline code)
}

/**
 * Builder class for constructing Markdown documents
 */
export class MarkdownBuilder {
  private content: string[] = [];

  /**
   * Add a heading (H1-H6)
   */
  heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 1): this {
    const prefix = '#'.repeat(level);
    this.content.push(`${prefix} ${text}\n`);
    return this;
  }

  /**
   * Add a paragraph
   */
  paragraph(text: string = ''): this {
    if (text) {
      this.content.push(`${text}\n`);
    } else {
      this.content.push('\n');
    }
    return this;
  }

  /**
   * Add bold text
   */
  bold(text: string): string {
    return `**${text}**`;
  }

  /**
   * Add italic text
   */
  italic(text: string): string {
    return `*${text}*`;
  }

  /**
   * Add inline code
   */
  code(text: string): string {
    return `\`${escapeMarkdown(text)}\``;
  }

  /**
   * Add a link
   */
  link(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  /**
   * Add a code block with optional language
   */
  codeBlock(code: string, language: string = ''): this {
    this.content.push(`\`\`\`${language}\n${code}\n\`\`\`\n`);
    return this;
  }

  /**
   * Add a blockquote
   */
  blockquote(text: string): this {
    const lines = text.split('\n');
    const quoted = lines.map(line => `> ${line}`).join('\n');
    this.content.push(`${quoted}\n`);
    return this;
  }

  /**
   * Add a horizontal rule
   */
  horizontalRule(): this {
    this.content.push('---\n');
    return this;
  }

  /**
   * Add an unordered list
   */
  bulletList(items: string[]): this {
    items.forEach(item => {
      this.content.push(`- ${item}\n`);
    });
    this.content.push('\n');
    return this;
  }

  /**
   * Add an ordered list
   */
  orderedList(items: string[]): this {
    items.forEach((item, index) => {
      this.content.push(`${index + 1}. ${item}\n`);
    });
    this.content.push('\n');
    return this;
  }

  /**
   * Add a table
   */
  table(headers: string[], rows: string[][]): this {
    // Header row
    this.content.push(`| ${headers.join(' | ')} |\n`);
    // Separator row
    this.content.push(`| ${headers.map(() => '---').join(' | ')} |\n`);
    // Data rows
    rows.forEach(row => {
      this.content.push(`| ${row.join(' | ')} |\n`);
    });
    this.content.push('\n');
    return this;
  }

  /**
   * Add a task list item
   */
  taskListItem(text: string, checked: boolean = false): this {
    const checkbox = checked ? '[x]' : '[ ]';
    this.content.push(`- ${checkbox} ${text}\n`);
    return this;
  }

  /**
   * Add raw text (use sparingly - for complex formatting)
   */
  raw(text: string): this {
    this.content.push(text);
    return this;
  }

  /**
   * Add a line break (double space + newline for proper Markdown line breaks)
   */
  lineBreak(): this {
    this.content.push('  \n');
    return this;
  }

  /**
   * Build and return the final Markdown string
   */
  build(): string {
    return this.content.join('');
  }

  /**
   * Clear the builder to start fresh
   */
  clear(): this {
    this.content = [];
    return this;
  }
}

/**
 * Helper functions for inline formatting
 */
export const md = {
  bold: (text: string) => `**${text}**`,
  italic: (text: string) => `*${text}*`,
  code: (text: string) => `\`${escapeMarkdown(text)}\``,
  link: (text: string, url: string) => `[${text}](${url})`,
  strikethrough: (text: string) => `~~${text}~~`,
};

/**
 * Create a new MarkdownBuilder instance
 */
export function createMarkdownBuilder(): MarkdownBuilder {
  return new MarkdownBuilder();
}

