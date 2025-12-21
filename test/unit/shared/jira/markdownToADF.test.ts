/**
 * Markdown to ADF Converter Unit Tests
 *
 * Tests for converting markdown to Atlassian Document Format.
 */

import { describe, it, expect } from "vitest";
import { convertMarkdownToADF } from "@shared/jira/markdownToADF";

describe("convertMarkdownToADF", () => {
  describe("headings", () => {
    it("should convert h1 heading", () => {
      const result = convertMarkdownToADF("# Hello World");

      expect(result.type).toBe("doc");
      expect(result.version).toBe(1);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("heading");
      expect(result.content[0].attrs?.level).toBe(1);
    });

    it("should convert h2 heading", () => {
      const result = convertMarkdownToADF("## Section Title");

      expect(result.content[0].type).toBe("heading");
      expect(result.content[0].attrs?.level).toBe(2);
    });

    it("should convert h3 to h6 headings", () => {
      const result = convertMarkdownToADF(
        "### H3\n#### H4\n##### H5\n###### H6"
      );

      expect(result.content).toHaveLength(4);
      expect(result.content[0].attrs?.level).toBe(3);
      expect(result.content[1].attrs?.level).toBe(4);
      expect(result.content[2].attrs?.level).toBe(5);
      expect(result.content[3].attrs?.level).toBe(6);
    });
  });

  describe("paragraphs", () => {
    it("should convert plain text to paragraph", () => {
      const result = convertMarkdownToADF("This is a paragraph.");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");
    });

    it("should handle multiple paragraphs", () => {
      const result = convertMarkdownToADF("First paragraph\n\nSecond paragraph");

      // Note: empty lines between are skipped, so we get 2 paragraphs
      expect(result.content.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("code blocks", () => {
    it("should convert fenced code block with language", () => {
      const result = convertMarkdownToADF("```typescript\nconst x = 1;\n```");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("codeBlock");
      expect(result.content[0].attrs?.language).toBe("typescript");
      expect(result.content[0].content?.[0].text).toBe("const x = 1;");
    });

    it("should convert fenced code block without language", () => {
      const result = convertMarkdownToADF("```\nplain code\n```");

      expect(result.content[0].type).toBe("codeBlock");
      expect(result.content[0].attrs?.language).toBeUndefined();
    });

    it("should preserve code block content", () => {
      const code = "function test() {\n  return true;\n}";
      const result = convertMarkdownToADF("```javascript\n" + code + "\n```");

      expect(result.content[0].content?.[0].text).toBe(code);
    });
  });

  describe("bullet lists", () => {
    it("should convert bullet list with dash", () => {
      const result = convertMarkdownToADF("- Item 1\n- Item 2\n- Item 3");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("bulletList");
      expect(result.content[0].content).toHaveLength(3);
    });

    it("should convert bullet list with asterisk", () => {
      const result = convertMarkdownToADF("* Item 1\n* Item 2");

      expect(result.content[0].type).toBe("bulletList");
      expect(result.content[0].content).toHaveLength(2);
    });

    it("should convert bullet list with plus", () => {
      const result = convertMarkdownToADF("+ Item 1\n+ Item 2");

      expect(result.content[0].type).toBe("bulletList");
    });
  });

  describe("numbered lists", () => {
    it("should convert numbered list", () => {
      const result = convertMarkdownToADF("1. First\n2. Second\n3. Third");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("orderedList");
      expect(result.content[0].content).toHaveLength(3);
    });

    it("should handle non-sequential numbers", () => {
      const result = convertMarkdownToADF("1. First\n5. Second\n10. Third");

      expect(result.content[0].type).toBe("orderedList");
      expect(result.content[0].content).toHaveLength(3);
    });
  });

  describe("inline formatting", () => {
    it("should convert bold text with asterisks", () => {
      const result = convertMarkdownToADF("This is **bold** text");

      const paragraph = result.content[0];
      expect(paragraph.content).toBeDefined();

      const boldNode = paragraph.content?.find(
        (node) =>
          node.type === "text" && node.marks?.some((m) => m.type === "strong")
      );
      expect(boldNode).toBeDefined();
      expect(boldNode?.text).toBe("bold");
    });

    it("should convert bold text with underscores", () => {
      const result = convertMarkdownToADF("This is __bold__ text");

      const paragraph = result.content[0];
      const boldNode = paragraph.content?.find(
        (node) =>
          node.type === "text" && node.marks?.some((m) => m.type === "strong")
      );
      expect(boldNode?.text).toBe("bold");
    });

    it("should convert italic text with asterisk", () => {
      const result = convertMarkdownToADF("This is *italic* text");

      const paragraph = result.content[0];
      const italicNode = paragraph.content?.find(
        (node) =>
          node.type === "text" && node.marks?.some((m) => m.type === "em")
      );
      expect(italicNode?.text).toBe("italic");
    });

    it("should convert italic text with underscore", () => {
      const result = convertMarkdownToADF("This is _italic_ text");

      const paragraph = result.content[0];
      const italicNode = paragraph.content?.find(
        (node) =>
          node.type === "text" && node.marks?.some((m) => m.type === "em")
      );
      expect(italicNode?.text).toBe("italic");
    });

    it("should convert inline code", () => {
      const result = convertMarkdownToADF("Use `const` keyword");

      const paragraph = result.content[0];
      const codeNode = paragraph.content?.find(
        (node) =>
          node.type === "text" && node.marks?.some((m) => m.type === "code")
      );
      expect(codeNode?.text).toBe("const");
    });

    it("should convert links", () => {
      const result = convertMarkdownToADF(
        "Visit [Google](https://google.com) now"
      );

      const paragraph = result.content[0];
      const linkNode = paragraph.content?.find(
        (node) =>
          node.type === "text" && node.marks?.some((m) => m.type === "link")
      );
      expect(linkNode?.text).toBe("Google");

      const linkMark = linkNode?.marks?.find((m) => m.type === "link");
      expect(linkMark?.attrs?.href).toBe("https://google.com");
    });
  });

  describe("mixed content", () => {
    it("should handle document with multiple element types", () => {
      const markdown = `# Title

This is a paragraph with **bold** and *italic* text.

## Code Section

\`\`\`javascript
const x = 1;
\`\`\`

- Item 1
- Item 2`;

      const result = convertMarkdownToADF(markdown);

      expect(result.type).toBe("doc");
      expect(result.version).toBe(1);

      // Should have heading, paragraph, heading, codeBlock, bulletList
      const types = result.content.map((c) => c.type);
      expect(types).toContain("heading");
      expect(types).toContain("paragraph");
      expect(types).toContain("codeBlock");
      expect(types).toContain("bulletList");
    });
  });

  describe("edge cases", () => {
    it("should handle empty input", () => {
      const result = convertMarkdownToADF("");

      expect(result.type).toBe("doc");
      expect(result.version).toBe(1);
      // Empty input creates a fallback paragraph with empty text
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("paragraph");
    });

    it("should handle whitespace-only input", () => {
      const result = convertMarkdownToADF("   \n\n   ");

      expect(result.type).toBe("doc");
    });

    it("should handle special characters in text", () => {
      const result = convertMarkdownToADF("Test & <special> \"chars\"");

      expect(result.content[0].type).toBe("paragraph");
    });
  });
});

