/**
 * Fuzzy Search Unit Tests
 *
 * Tests for the fuzzy search and scoring functionality.
 */

import { describe, it, expect } from "vitest";
import { fuzzyMatchScore, fuzzySearch } from "@shared/utils/fuzzySearch";

describe("fuzzyMatchScore", () => {
  it("should return highest score for exact match", () => {
    const score = fuzzyMatchScore("hello", "hello");
    expect(score).toBe(1000);
  });

  it("should return high score for starts-with match", () => {
    const score = fuzzyMatchScore("hel", "hello world");
    expect(score).toBe(800);
  });

  it("should return medium score for contains match", () => {
    const score = fuzzyMatchScore("world", "hello world");
    expect(score).toBe(500);
  });

  it("should return lower score for fuzzy match", () => {
    const score = fuzzyMatchScore("hlo", "hello");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(500);
  });

  it("should return 0 for no match", () => {
    const score = fuzzyMatchScore("xyz", "hello");
    expect(score).toBe(0);
  });

  it("should be case insensitive", () => {
    const score1 = fuzzyMatchScore("HELLO", "hello");
    const score2 = fuzzyMatchScore("hello", "HELLO");
    expect(score1).toBe(1000);
    expect(score2).toBe(1000);
  });

  it("should handle empty strings", () => {
    // Empty query starts with everything, so it gets 800 (starts-with score)
    expect(fuzzyMatchScore("", "hello")).toBe(800);
    expect(fuzzyMatchScore("hello", "")).toBe(0);
  });
});

describe("fuzzySearch", () => {
  interface TestItem {
    id: string;
    title: string;
    description: string;
  }

  const items: TestItem[] = [
    { id: "1", title: "Fix login bug", description: "Authentication issue" },
    {
      id: "2",
      title: "Add dark mode",
      description: "Theme customization feature",
    },
    { id: "3", title: "Update README", description: "Documentation changes" },
    {
      id: "4",
      title: "Refactor API client",
      description: "Code cleanup and optimization",
    },
  ];

  const extractors = [
    (item: TestItem) => item.title,
    (item: TestItem) => item.description,
  ];

  it("should return all items for empty query", () => {
    const results = fuzzySearch(items, "", extractors);
    expect(results).toHaveLength(4);
  });

  it("should filter items by query", () => {
    const results = fuzzySearch(items, "bug", extractors);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
  });

  it("should search across multiple fields", () => {
    const results = fuzzySearch(items, "auth", extractors);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1"); // Matches "Authentication" in description
  });

  it("should rank exact matches higher", () => {
    const results = fuzzySearch(items, "README", extractors);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Update README");
  });

  it("should return empty array when no matches", () => {
    const results = fuzzySearch(items, "xyz123", extractors);
    expect(results).toHaveLength(0);
  });

  it("should sort results by score (best first)", () => {
    const testItems = [
      { id: "1", name: "apple pie" },
      { id: "2", name: "apple" },
      { id: "3", name: "pineapple" },
    ];

    const results = fuzzySearch(testItems, "apple", [(i) => i.name]);

    // Exact match should be first
    expect(results[0].id).toBe("2");
  });

  it("should handle items with empty fields", () => {
    const itemsWithEmpty: TestItem[] = [
      { id: "1", title: "", description: "Has description" },
      { id: "2", title: "Has title", description: "" },
    ];

    const results = fuzzySearch(itemsWithEmpty, "title", extractors);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("2");
  });
});

