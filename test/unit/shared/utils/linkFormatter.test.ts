/**
 * Link Formatter Unit Tests
 *
 * Tests for ticket link formatting with different output formats.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  formatTicketLink,
  formatTicketReferencesInText,
} from "@shared/utils/linkFormatter";
// Import from "vscode" to use the same mock module instance as linkFormatter
import {
  setMockConfig,
  resetMockConfig,
} from "vscode";

describe("formatTicketLink", () => {
  beforeEach(() => {
    resetMockConfig();
  });

  it("should format as markdown by default", () => {
    const result = formatTicketLink(
      "ENG-123",
      "https://linear.app/team/issue/ENG-123"
    );
    expect(result).toBe("[ENG-123](https://linear.app/team/issue/ENG-123)");
  });

  it("should format as slack when specified", () => {
    const result = formatTicketLink(
      "ENG-123",
      "https://linear.app/team/issue/ENG-123",
      "slack"
    );
    expect(result).toBe("<https://linear.app/team/issue/ENG-123|ENG-123>");
  });

  it("should format as markdown when specified", () => {
    const result = formatTicketLink(
      "ENG-123",
      "https://linear.app/team/issue/ENG-123",
      "markdown"
    );
    expect(result).toBe("[ENG-123](https://linear.app/team/issue/ENG-123)");
  });

  it("should format as plain when specified", () => {
    const result = formatTicketLink(
      "ENG-123",
      "https://linear.app/team/issue/ENG-123",
      "plain"
    );
    expect(result).toBe("ENG-123");
  });

  it("should use config setting when format not specified", () => {
    setMockConfig("devBuddy", "linkFormat", "slack");

    const result = formatTicketLink(
      "ENG-123",
      "https://linear.app/team/issue/ENG-123"
    );
    expect(result).toBe("<https://linear.app/team/issue/ENG-123|ENG-123>");
  });

  it("should handle Jira ticket IDs", () => {
    const result = formatTicketLink(
      "PROJ-456",
      "https://company.atlassian.net/browse/PROJ-456",
      "markdown"
    );
    expect(result).toBe(
      "[PROJ-456](https://company.atlassian.net/browse/PROJ-456)"
    );
  });
});

describe("formatTicketReferencesInText", () => {
  const urlTemplate = (ticketId: string) =>
    `https://linear.app/team/issue/${ticketId}`;

  beforeEach(() => {
    resetMockConfig();
  });

  it("should replace ticket references with formatted links", () => {
    const text = "Fixed ENG-123 and started work on ENG-456";

    const result = formatTicketReferencesInText(text, urlTemplate, "markdown");

    expect(result).toContain("[ENG-123](https://linear.app/team/issue/ENG-123)");
    expect(result).toContain("[ENG-456](https://linear.app/team/issue/ENG-456)");
  });

  it("should handle multiple ticket formats", () => {
    const text = "Working on ENG-123, PROJ-456, and BUG-789";

    const result = formatTicketReferencesInText(text, urlTemplate, "markdown");

    expect(result).toContain("[ENG-123]");
    expect(result).toContain("[PROJ-456]");
    expect(result).toContain("[BUG-789]");
  });

  it("should not modify text without ticket references", () => {
    const text = "This is a regular message without tickets";

    const result = formatTicketReferencesInText(text, urlTemplate, "markdown");

    expect(result).toBe(text);
  });

  it("should format as slack when specified", () => {
    const text = "Fixed ENG-123";

    const result = formatTicketReferencesInText(text, urlTemplate, "slack");

    expect(result).toBe("Fixed <https://linear.app/team/issue/ENG-123|ENG-123>");
  });

  it("should keep plain ticket ID when format is plain", () => {
    const text = "Fixed ENG-123";

    const result = formatTicketReferencesInText(text, urlTemplate, "plain");

    expect(result).toBe("Fixed ENG-123");
  });

  it("should handle ticket at start of text", () => {
    const text = "ENG-123 is now complete";

    const result = formatTicketReferencesInText(text, urlTemplate, "markdown");

    expect(result).toContain("[ENG-123]");
    expect(result).toContain("is now complete");
  });

  it("should handle ticket at end of text", () => {
    const text = "Started work on ENG-123";

    const result = formatTicketReferencesInText(text, urlTemplate, "markdown");

    expect(result).toContain("[ENG-123]");
    expect(result).toContain("Started work on");
  });

  it("should use config setting when format not specified", () => {
    setMockConfig("devBuddy", "linkFormat", "slack");

    const text = "Fixed ENG-123";
    const result = formatTicketReferencesInText(text, urlTemplate);

    expect(result).toBe("Fixed <https://linear.app/team/issue/ENG-123|ENG-123>");
  });

  it("should not match lowercase ticket patterns", () => {
    const text = "Fixed eng-123";

    const result = formatTicketReferencesInText(text, urlTemplate, "markdown");

    expect(result).toBe("Fixed eng-123"); // Unchanged
  });
});

