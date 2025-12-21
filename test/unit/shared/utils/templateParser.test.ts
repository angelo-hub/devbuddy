/**
 * Template Parser Unit Tests
 *
 * Tests for parsing markdown PR templates into structured sections.
 */

import { describe, it, expect } from "vitest";
import { TemplateParser, TemplateSection } from "@shared/utils/templateParser";

describe("TemplateParser", () => {
  const parser = new TemplateParser();

  describe("parseTemplate", () => {
    it("should parse a simple template with sections", () => {
      const template = `## Description
Add your description here

## Changes
- Change 1
- Change 2

## Testing
How was this tested?`;

      const sections = parser.parseTemplate(template);

      expect(sections).toHaveLength(3);
      expect(sections[0].title).toBe("Description");
      expect(sections[1].title).toBe("Changes");
      expect(sections[2].title).toBe("Testing");
    });

    it("should extract checkboxes from sections", () => {
      const template = `## Checklist
- [ ] Tests added
- [ ] Documentation updated
- [ ] Code reviewed`;

      const sections = parser.parseTemplate(template);

      expect(sections).toHaveLength(1);
      expect(sections[0].checkboxes).toEqual([
        "Tests added",
        "Documentation updated",
        "Code reviewed",
      ]);
    });

    it("should extract hints from HTML comments", () => {
      const template = `## Description
<!-- Provide a brief description of the changes -->
Your description here`;

      const sections = parser.parseTemplate(template);

      expect(sections).toHaveLength(1);
      expect(sections[0].hint).toBe(
        "Provide a brief description of the changes"
      );
    });

    it("should identify author reminders section", () => {
      const template = `## Author Reminders
- [ ] Self-review completed

## Description
Changes here`;

      const sections = parser.parseTemplate(template);

      expect(sections[0].isAuthorReminders).toBe(true);
      expect(sections[1].isAuthorReminders).toBe(false);
    });

    it("should handle empty template", () => {
      const sections = parser.parseTemplate("");

      expect(sections).toHaveLength(0);
    });

    it("should track line numbers for sections", () => {
      const template = `## First
Line 1

## Second
Line 2`;

      const sections = parser.parseTemplate(template);

      expect(sections[0].startLine).toBe(0);
      expect(sections[1].startLine).toBe(3);
    });
  });

  describe("findSection", () => {
    const sections: TemplateSection[] = [
      {
        title: "Description",
        hint: null,
        checkboxes: [],
        content: "## Description\nContent",
        startLine: 0,
        endLine: 1,
        isAuthorReminders: false,
      },
      {
        title: "Testing Notes",
        hint: null,
        checkboxes: [],
        content: "## Testing Notes\nTest content",
        startLine: 2,
        endLine: 3,
        isAuthorReminders: false,
      },
    ];

    it("should find section by exact title match", () => {
      const section = parser.findSection(sections, "Description");

      expect(section).not.toBeNull();
      expect(section?.title).toBe("Description");
    });

    it("should find section by partial title match", () => {
      const section = parser.findSection(sections, "testing");

      expect(section).not.toBeNull();
      expect(section?.title).toBe("Testing Notes");
    });

    it("should return null for non-existent section", () => {
      const section = parser.findSection(sections, "Nonexistent");

      expect(section).toBeNull();
    });

    it("should be case-insensitive", () => {
      const section = parser.findSection(sections, "DESCRIPTION");

      expect(section).not.toBeNull();
      expect(section?.title).toBe("Description");
    });
  });

  describe("reconstructTemplate", () => {
    it("should reconstruct template from sections", () => {
      const sections: TemplateSection[] = [
        {
          title: "First",
          hint: null,
          checkboxes: [],
          content: "## First\nContent 1",
          startLine: 0,
          endLine: 1,
          isAuthorReminders: false,
        },
        {
          title: "Second",
          hint: null,
          checkboxes: [],
          content: "## Second\nContent 2",
          startLine: 2,
          endLine: 3,
          isAuthorReminders: false,
        },
      ];

      const result = parser.reconstructTemplate(sections);

      expect(result).toBe("## First\nContent 1\n## Second\nContent 2");
    });

    it("should handle empty sections array", () => {
      const result = parser.reconstructTemplate([]);

      expect(result).toBe("");
    });
  });
});

