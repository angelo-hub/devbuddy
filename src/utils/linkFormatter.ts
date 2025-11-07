import * as vscode from "vscode";

/**
 * Format a ticket link based on user preference
 */
export function formatTicketLink(
  ticketId: string,
  ticketUrl: string,
  format?: "slack" | "markdown" | "plain"
): string {
  // Get format from config if not provided
  if (!format) {
    const config = vscode.workspace.getConfiguration("linearBuddy");
    format = config.get<"slack" | "markdown" | "plain">("linkFormat", "markdown");
  }

  switch (format) {
    case "slack":
      return `<${ticketUrl}|${ticketId}>`;
    case "markdown":
      return `[${ticketId}](${ticketUrl})`;
    case "plain":
    default:
      return ticketId;
  }
}

/**
 * Replace ticket references in text with formatted links
 * Looks for patterns like TICKET-123 or ENG-456 and converts them to links
 */
export function formatTicketReferencesInText(
  text: string,
  ticketUrlTemplate: (ticketId: string) => string,
  format?: "slack" | "markdown" | "plain"
): string {
  // Get format from config if not provided
  if (!format) {
    const config = vscode.workspace.getConfiguration("linearBuddy");
    format = config.get<"slack" | "markdown" | "plain">("linkFormat", "markdown");
  }

  // Match ticket patterns like TICKET-123, ENG-456, etc.
  // Look for uppercase letters followed by hyphen and numbers
  const ticketPattern = /\b([A-Z]{2,}-\d+)\b/g;

  return text.replace(ticketPattern, (match, ticketId) => {
    const ticketUrl = ticketUrlTemplate(ticketId);
    return formatTicketLink(ticketId, ticketUrl, format);
  });
}

