/**
 * Time Formatter Unit Tests
 *
 * Tests for relative time formatting utilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatRelativeTime,
  formatShortRelativeTime,
} from "@shared/utils/timeFormatter";

describe("formatRelativeTime", () => {
  beforeEach(() => {
    // Mock Date.now to return a fixed timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should format seconds ago", () => {
    const date = new Date("2024-01-15T11:59:30Z"); // 30 seconds ago
    expect(formatRelativeTime(date)).toBe("30 seconds ago");
  });

  it("should format singular second", () => {
    const date = new Date("2024-01-15T11:59:59Z"); // 1 second ago
    expect(formatRelativeTime(date)).toBe("1 second ago");
  });

  it("should format minutes ago", () => {
    const date = new Date("2024-01-15T11:55:00Z"); // 5 minutes ago
    expect(formatRelativeTime(date)).toBe("5 minutes ago");
  });

  it("should format singular minute", () => {
    const date = new Date("2024-01-15T11:59:00Z"); // 1 minute ago
    expect(formatRelativeTime(date)).toBe("1 minute ago");
  });

  it("should format hours ago", () => {
    const date = new Date("2024-01-15T09:00:00Z"); // 3 hours ago
    expect(formatRelativeTime(date)).toBe("3 hours ago");
  });

  it("should format singular hour", () => {
    const date = new Date("2024-01-15T11:00:00Z"); // 1 hour ago
    expect(formatRelativeTime(date)).toBe("1 hour ago");
  });

  it("should format days ago", () => {
    const date = new Date("2024-01-13T12:00:00Z"); // 2 days ago
    expect(formatRelativeTime(date)).toBe("2 days ago");
  });

  it("should format singular day", () => {
    const date = new Date("2024-01-14T12:00:00Z"); // 1 day ago
    expect(formatRelativeTime(date)).toBe("1 day ago");
  });

  it("should format weeks ago", () => {
    const date = new Date("2024-01-01T12:00:00Z"); // 2 weeks ago
    expect(formatRelativeTime(date)).toBe("2 weeks ago");
  });

  it("should format singular week", () => {
    const date = new Date("2024-01-08T12:00:00Z"); // 1 week ago
    expect(formatRelativeTime(date)).toBe("1 week ago");
  });

  it("should format months ago", () => {
    const date = new Date("2023-11-15T12:00:00Z"); // ~2 months ago
    expect(formatRelativeTime(date)).toBe("2 months ago");
  });

  it("should format singular month", () => {
    const date = new Date("2023-12-15T12:00:00Z"); // ~1 month ago
    expect(formatRelativeTime(date)).toBe("1 month ago");
  });

  it("should format years ago", () => {
    const date = new Date("2022-01-15T12:00:00Z"); // 2 years ago
    expect(formatRelativeTime(date)).toBe("2 years ago");
  });

  it("should format singular year", () => {
    const date = new Date("2023-01-15T12:00:00Z"); // 1 year ago
    expect(formatRelativeTime(date)).toBe("1 year ago");
  });

  it("should accept string dates", () => {
    const result = formatRelativeTime("2024-01-14T12:00:00Z");
    expect(result).toBe("1 day ago");
  });
});

describe("formatShortRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should format seconds as 's'", () => {
    const date = new Date("2024-01-15T11:59:30Z");
    expect(formatShortRelativeTime(date)).toBe("30s");
  });

  it("should format minutes as 'm'", () => {
    const date = new Date("2024-01-15T11:55:00Z");
    expect(formatShortRelativeTime(date)).toBe("5m");
  });

  it("should format hours as 'h'", () => {
    const date = new Date("2024-01-15T09:00:00Z");
    expect(formatShortRelativeTime(date)).toBe("3h");
  });

  it("should format days as 'd'", () => {
    const date = new Date("2024-01-13T12:00:00Z");
    expect(formatShortRelativeTime(date)).toBe("2d");
  });

  it("should format weeks as 'w'", () => {
    const date = new Date("2024-01-01T12:00:00Z");
    expect(formatShortRelativeTime(date)).toBe("2w");
  });

  it("should format months as 'mo'", () => {
    const date = new Date("2023-11-15T12:00:00Z");
    expect(formatShortRelativeTime(date)).toBe("2mo");
  });

  it("should format years as 'y'", () => {
    const date = new Date("2022-01-15T12:00:00Z");
    expect(formatShortRelativeTime(date)).toBe("2y");
  });

  it("should accept string dates", () => {
    const result = formatShortRelativeTime("2024-01-14T12:00:00Z");
    expect(result).toBe("1d");
  });
});

