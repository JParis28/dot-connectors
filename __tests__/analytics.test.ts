/**
 * Tests for lib/analytics.ts — newEventId() only.
 * The file has "use client" but newEventId is pure and importable in node env.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { newEventId } from "@/lib/analytics";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("lib/analytics.ts newEventId()", () => {
  it("returns a string >= 16 chars", () => {
    const id = newEventId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThanOrEqual(16);
  });

  it("two consecutive calls return different values", () => {
    expect(newEventId()).not.toBe(newEventId());
  });

  it("native path: matches UUID format when crypto.randomUUID is available", () => {
    // Node 25 has crypto.randomUUID natively — vitest node env inherits it
    const id = newEventId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("fallback path: works and meets length requirement when crypto.randomUUID is unavailable", () => {
    // Shadow randomUUID for this test
    const origUUID = crypto.randomUUID.bind(crypto);
    // @ts-ignore – intentional deletion to test fallback branch
    delete (crypto as Record<string, unknown>).randomUUID;
    try {
      const id = newEventId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThanOrEqual(16);
      expect(id).toMatch(/-/); // fallback format: <base36>-<random>
    } finally {
      crypto.randomUUID = origUUID;
    }
  });
});
