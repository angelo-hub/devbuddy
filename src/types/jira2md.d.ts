/**
 * Type definitions for jira2md
 * Project: https://github.com/kylefarris/J2M
 * 
 * jira2md converts between Jira Wiki Markup, Markdown, and HTML formats
 */

declare module 'jira2md' {
  /**
   * Convert Markdown to Jira Wiki Markup
   * @param markdown - Markdown formatted string
   * @returns Jira Wiki Markup formatted string
   * 
   * @example
   * const jira = j2m.to_jira('**bold text**');
   * // Returns: '*bold text*'
   */
  export function to_jira(markdown: string): string;

  /**
   * Convert Jira Wiki Markup to Markdown
   * @param jira - Jira Wiki Markup formatted string
   * @returns Markdown formatted string
   * 
   * @example
   * const md = j2m.to_markdown('*bold text*');
   * // Returns: '**bold text**'
   */
  export function to_markdown(jira: string): string;

  /**
   * Convert Markdown to HTML
   * @param markdown - Markdown formatted string
   * @returns HTML formatted string
   * 
   * @example
   * const html = j2m.md_to_html('**bold text**');
   * // Returns: '<strong>bold text</strong>'
   */
  export function md_to_html(markdown: string): string;

  /**
   * Convert Jira Wiki Markup to HTML
   * @param jira - Jira Wiki Markup formatted string
   * @returns HTML formatted string
   * 
   * @example
   * const html = j2m.jira_to_html('*bold text*');
   * // Returns: '<strong>bold text</strong>'
   */
  export function jira_to_html(jira: string): string;
}

