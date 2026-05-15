/**
 * Tests for lib/roi/snapshot.ts (encodeSnapshot / decodeSnapshot)
 * and the readPersonalization logic from app/start/page.tsx.
 *
 * All tests are pure unit tests — no Next.js server needed.
 */

import { describe, it, expect } from "vitest";
import { encodeSnapshot, decodeSnapshot } from "../lib/roi/snapshot";
import { calculate } from "../lib/roi/calc";
import { moneyCompact } from "../lib/roi/format";
import { defaultInputsFor, TRADES } from "../lib/roi/calc";
import type { Inputs } from "../lib/roi/calc";

// ---------------------------------------------------------------------------
// Replicate readPersonalization without importing the page module (avoids
// pulling in Next.js Image, Nav, CalEmbed, etc.).
// ---------------------------------------------------------------------------
type SearchParams = { s?: string | string[] };

function readPersonalization(searchParams: SearchParams | undefined): string | null {
  const raw = searchParams?.s;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return null;
  const inputs = decodeSnapshot(s);
  if (!inputs) return null;
  try {
    const result = calculate(inputs);
    if (!Number.isFinite(result.year1) || result.year1 <= 0) return null;
    return moneyCompact(result.year1);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: base64-encode a string the same way Node / browser would (utf-8 safe)
// ---------------------------------------------------------------------------
function b64(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

// ---------------------------------------------------------------------------
// encodeSnapshot + decodeSnapshot — round-trip tests
// ---------------------------------------------------------------------------

describe("encodeSnapshot / decodeSnapshot — round-trip", () => {
  const trades = Object.keys(TRADES) as Array<keyof typeof TRADES>;
  const modes = ["conservative", "research", "aggressive"] as const;

  for (const trade of trades) {
    for (const mode of modes) {
      it(`preserves all Inputs fields for trade=${trade} mode=${mode}`, () => {
        const inputs: Inputs = defaultInputsFor(trade, mode);
        const encoded = encodeSnapshot(inputs);
        expect(typeof encoded).toBe("string");
        expect(encoded.length).toBeGreaterThan(0);

        const decoded = decodeSnapshot(encoded);
        expect(decoded).not.toBeNull();

        // Every field on the original Inputs object must survive the round-trip
        // exactly (numbers as numbers, strings as strings).
        const keys = Object.keys(inputs) as Array<keyof Inputs>;
        for (const k of keys) {
          expect(decoded![k]).toBe(inputs[k]);
        }
      });
    }
  }
});

// ---------------------------------------------------------------------------
// decodeSnapshot — empty / garbage input
// ---------------------------------------------------------------------------

describe("decodeSnapshot — invalid input returns null without throwing", () => {
  it("returns null for empty string", () => {
    expect(decodeSnapshot("")).toBeNull();
  });

  it("returns null for a non-base64 string", () => {
    expect(decodeSnapshot("not-base64-at-all!!!")).toBeNull();
  });

  it("returns null when decoded JSON is a plain string, not an object", () => {
    // btoa('"just a string"')
    expect(decodeSnapshot(b64('"just a string"'))).toBeNull();
  });

  it("returns null when decoded JSON is an array", () => {
    expect(decodeSnapshot(b64("[]"))).toBeNull();
  });

  it("returns null when decoded JSON is null", () => {
    expect(decodeSnapshot(b64("null"))).toBeNull();
  });

  it("returns null when trade is unknown", () => {
    expect(decodeSnapshot(b64('{"trade":"unknown","mode":"research"}'))).toBeNull();
  });

  it("returns null when trade is valid but mode is invalid", () => {
    expect(decodeSnapshot(b64('{"trade":"hvac","mode":"banana"}'))).toBeNull();
  });

  it("returns null when trade field is missing entirely", () => {
    expect(decodeSnapshot(b64('{"mode":"research"}'))).toBeNull();
  });

  it("returns null when mode field is missing entirely", () => {
    expect(decodeSnapshot(b64('{"trade":"hvac"}'))).toBeNull();
  });

  it("does not throw on a 10KB garbage base64 string", () => {
    const garbage = Buffer.alloc(10_000, 0xab).toString("base64");
    let result: Inputs | null | undefined;
    expect(() => { result = decodeSnapshot(garbage); }).not.toThrow();
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// decodeSnapshot — partial inputs get defaults merged in
// ---------------------------------------------------------------------------

describe("decodeSnapshot — merges defaults for missing fields", () => {
  it("returns a full Inputs object when only trade+mode are present", () => {
    const encoded = b64('{"trade":"hvac","mode":"research"}');
    const decoded = decodeSnapshot(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.trade).toBe("hvac");
    expect(decoded!.mode).toBe("research");

    // All numeric fields from Inputs should be present and finite
    const numericFields: Array<keyof Inputs> = [
      "monthlyLeads",
      "bookingRate",
      "smallTicket",
      "bigTicket",
      "bigTicketMix",
      "pastCustomers",
      "planMembersPct",
      "planFeeAnnual",
    ];
    for (const field of numericFields) {
      expect(typeof decoded![field]).toBe("number");
      expect(Number.isFinite(decoded![field] as number)).toBe(true);
    }
  });

  it("allows the caller to override a default field via the encoded value", () => {
    const custom = { trade: "roofing", mode: "aggressive", monthlyLeads: 999 };
    const encoded = b64(JSON.stringify(custom));
    const decoded = decodeSnapshot(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.monthlyLeads).toBe(999);
    expect(decoded!.trade).toBe("roofing");
    expect(decoded!.mode).toBe("aggressive");
  });
});

// ---------------------------------------------------------------------------
// decodeSnapshot — prototype pollution safety
// ---------------------------------------------------------------------------

describe("decodeSnapshot — prototype pollution safety", () => {
  it("returns null for a payload that attempts __proto__ injection", () => {
    const payload = b64('{"__proto__":{"polluted":true}}');
    const result = decodeSnapshot(payload);
    // Must return null (no trade field)
    expect(result).toBeNull();
  });

  it("does not pollute Object.prototype after a __proto__ payload", () => {
    const payload = b64('{"__proto__":{"polluted":true}}');
    decodeSnapshot(payload);
    // JSON.parse is not safe against prototype pollution by default, but the
    // decoder returns null before the spread — the spread would be the only
    // place a __proto__ key could escape. Verify prototype is clean.
    expect((({}) as Record<string, unknown>)["polluted"]).toBeUndefined();
  });

  it("returns null for a constructor pollution attempt", () => {
    const payload = b64('{"constructor":{"prototype":{"polluted":true}}}');
    const result = decodeSnapshot(payload);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// readPersonalization — behavior tests
// ---------------------------------------------------------------------------

describe("readPersonalization", () => {
  it("returns null when searchParams is undefined", () => {
    expect(readPersonalization(undefined)).toBeNull();
  });

  it("returns null when s param is absent", () => {
    expect(readPersonalization({})).toBeNull();
  });

  it("returns null when s is an empty string", () => {
    expect(readPersonalization({ s: "" })).toBeNull();
  });

  it("returns null for a malformed s string", () => {
    expect(readPersonalization({ s: "garbage!!!" })).toBeNull();
  });

  it("returns null when s decodes to invalid trade", () => {
    const bad = b64('{"trade":"plumbing","mode":"research"}');
    expect(readPersonalization({ s: bad })).toBeNull();
  });

  it("handles s as an array by using the first element", () => {
    // first element is garbage, so result should be null
    expect(readPersonalization({ s: ["garbage!!!", "alsogarbage"] })).toBeNull();
  });

  it("handles s as an array with a valid first element", () => {
    const inputs = defaultInputsFor("hvac", "research");
    const encoded = encodeSnapshot(inputs);
    const result = readPersonalization({ s: [encoded, "ignored"] });

    // Should be a money string starting with $ containing K or M
    expect(result).not.toBeNull();
    expect(result).toMatch(/^\$/);
    expect(result).toMatch(/[KM]/);
  });

  it("returns a $ money string for a valid hvac/research snapshot", () => {
    const inputs = defaultInputsFor("hvac", "research");
    const encoded = encodeSnapshot(inputs);
    const result = readPersonalization({ s: encoded });

    expect(result).not.toBeNull();
    expect(result).toMatch(/^\$/);
    expect(result).toMatch(/[KM]/);
  });

  it("returns a $ money string for a valid roofing/conservative snapshot", () => {
    const inputs = defaultInputsFor("roofing", "conservative");
    const encoded = encodeSnapshot(inputs);
    const result = readPersonalization({ s: encoded });

    expect(result).not.toBeNull();
    expect(result).toMatch(/^\$/);
  });

  it("returns a $ money string for a valid general/aggressive snapshot", () => {
    const inputs = defaultInputsFor("general", "aggressive");
    const encoded = encodeSnapshot(inputs);
    const result = readPersonalization({ s: encoded });

    expect(result).not.toBeNull();
    expect(result).toMatch(/^\$/);
  });

  it("returns null when year1 would be zero (all leads = 0)", () => {
    // Zero monthly leads => zero revenue across all pillars (p4 is dormant
    // reactivation, which depends on pastCustomers; set both to 0).
    const inputs: Inputs = {
      ...defaultInputsFor("hvac", "research"),
      monthlyLeads: 0,
      pastCustomers: 0,
    };
    const encoded = encodeSnapshot(inputs);
    const result = readPersonalization({ s: encoded });
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// moneyCompact sanity (format used in readPersonalization output)
// ---------------------------------------------------------------------------

describe("moneyCompact format", () => {
  it("formats values >= 1M with M suffix", () => {
    expect(moneyCompact(1_500_000)).toMatch(/^\$.*M$/);
  });

  it("formats values >= 1K with K suffix", () => {
    expect(moneyCompact(94_000)).toBe("$94K");
  });

  it("formats values < 1K without suffix", () => {
    expect(moneyCompact(500)).toBe("$500");
  });
});
