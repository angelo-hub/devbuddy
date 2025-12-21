/**
 * Query Escaping Utilities
 * 
 * Provides robust escaping functions for various query languages used in DevBuddy.
 * Primary purpose: Prevent query syntax errors when users search with special characters.
 * Secondary benefit: Defense in depth against potential injection vulnerabilities.
 */

/**
 * Escape special characters in GraphQL string literals
 * 
 * Used for user-provided search terms that will be interpolated into GraphQL queries.
 * Handles all GraphQL string escape sequences to prevent syntax errors.
 * 
 * @param text - User-provided text to escape
 * @returns Escaped text safe for GraphQL string literals
 * 
 * @example
 * ```typescript
 * const userSearch = 'Test "quoted" text\nwith newline';
 * const escaped = escapeGraphQLString(userSearch);
 * const query = `{ issues(filter: { title: { contains: "${escaped}" } }) }`;
 * ```
 */
export function escapeGraphQLString(text: string): string {
  return text
    .replace(/\\/g, '\\\\')    // Escape backslashes first (must be first!)
    .replace(/"/g, '\\"')       // Escape double quotes
    .replace(/\n/g, '\\n')      // Escape newlines
    .replace(/\r/g, '\\r')      // Escape carriage returns
    .replace(/\t/g, '\\t');     // Escape tabs
}

/**
 * Escape special characters in JQL (Jira Query Language) strings
 * 
 * Used for user-provided search terms in Jira queries.
 * Escapes all JQL special characters to prevent syntax errors and ensure
 * the search term is treated as a literal string.
 * 
 * JQL special characters: + - & | ! ( ) { } [ ] ^ ~ * ? : \ / " '
 * 
 * @param text - User-provided text to escape
 * @returns Escaped text safe for JQL queries
 * 
 * @example
 * ```typescript
 * const userSearch = 'TODO: fix array[0]';
 * const escaped = escapeJQLString(userSearch);
 * const jql = `summary ~ "${escaped}"`;
 * ```
 */
export function escapeJQLString(text: string): string {
  return text
    // Escape all JQL special characters by prefixing with backslash
    // Must escape backslash first to avoid double-escaping
    .replace(/\\/g, '\\\\')                             // Escape backslash first
    // eslint-disable-next-line no-useless-escape
    .replace(/([+\-&|!(){}\[\]^~*?:\\/"])/g, '\\$1')  // Escape JQL operators
    .replace(/'/g, "\\'")                              // Escape single quotes
    .replace(/\s/g, '\\ ');                            // Escape spaces
}

/**
 * Test utilities for development/debugging
 * These are exposed for testing but should not be used in production code
 */
export const __testUtils = {
  /**
   * Test if a string contains unescaped GraphQL special characters
   */
  hasUnescapedGraphQLChars(text: string): boolean {
    // Check for unescaped quotes, newlines, etc.
    return /["\n\r\t]/.test(text) && !/\\["\nrt]/.test(text);
  },
  
  /**
   * Test if a string contains unescaped JQL special characters
   */
  hasUnescapedJQLChars(text: string): boolean {
    // Check for unescaped JQL special chars
    // eslint-disable-next-line no-useless-escape
    return /[+\-&|!(){}\[\]^~*?:\\/"]/.test(text);
  }
};

