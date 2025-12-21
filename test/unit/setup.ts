/**
 * Vitest Setup File
 *
 * This file runs before each test file and sets up the test environment.
 */

import { vi } from "vitest";

// Mock the logger to prevent console output during tests
vi.mock("@shared/utils/logger", () => ({
  getLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    getOutputChannel: vi.fn(() => ({ dispose: vi.fn() })),
  }),
}));

