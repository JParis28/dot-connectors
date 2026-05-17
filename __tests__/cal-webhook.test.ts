/**
 * Tests for app/api/meta-capi/cal-webhook/route.ts
 * sendCapiEvent is mocked via vi.mock at the top level.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

// Must be at top level so vitest hoisting picks it up before the route imports it.
vi.mock("@/lib/meta-capi", () => ({
  sendCapiEvent: vi.fn(),
}));

import { sendCapiEvent } from "@/lib/meta-capi";
import { POST } from "@/app/api/meta-capi/cal-webhook/route";

const mockSend = sendCapiEvent as ReturnType<typeof vi.fn>;

const SECRET = "test-webhook-secret";

function calSig(body: string, secret: string) {
  return createHmac("sha256", secret).update(body, "utf-8").digest("hex");
}

function makeRequest(
  body: string,
  sig: string | null,
  extraHeaders: Record<string, string> = {},
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...extraHeaders,
  };
  if (sig !== null) headers["x-cal-signature-256"] = sig;

  return {
    text: async () => body,
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    },
  } as unknown as import("next/server").NextRequest;
}

function validBody(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    triggerEvent: "BOOKING_CREATED",
    payload: {
      uid: "booking-uid-abc",
      attendees: [
        { name: "Jordan Paris", email: "jp@example.com", phoneNumber: "+18135550100" },
      ],
    },
    ...overrides,
  });
}

beforeEach(() => {
  process.env.CAL_WEBHOOK_SECRET = SECRET;
  mockSend.mockResolvedValue({ ok: true, received: 1 });
});

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.CAL_WEBHOOK_SECRET;
});

describe("cal-webhook route", () => {
  it("503 when CAL_WEBHOOK_SECRET is missing", async () => {
    delete process.env.CAL_WEBHOOK_SECRET;
    const res = await POST(makeRequest(validBody(), calSig(validBody(), SECRET)));
    expect(res.status).toBe(503);
  });

  it("401 when x-cal-signature-256 header is missing", async () => {
    const res = await POST(makeRequest(validBody(), null));
    expect(res.status).toBe(401);
  });

  it("401 when signature uses wrong secret", async () => {
    const body = validBody();
    const wrongSig = calSig(body, "wrong-secret");
    const res = await POST(makeRequest(body, wrongSig));
    expect(res.status).toBe(401);
  });

  it("200 ok+ignored for BOOKING_CANCELLED — no CAPI call", async () => {
    const body = JSON.stringify({ triggerEvent: "BOOKING_CANCELLED", payload: {} });
    const res = await POST(makeRequest(body, calSig(body, SECRET)));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ignored).toBe("BOOKING_CANCELLED");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("400 when BOOKING_CREATED missing uid and bookingId", async () => {
    const body = JSON.stringify({ triggerEvent: "BOOKING_CREATED", payload: {} });
    const res = await POST(makeRequest(body, calSig(body, SECRET)));
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("calls sendCapiEvent with Schedule + uid + value 1997 on valid payload", async () => {
    const body = validBody();
    const res = await POST(makeRequest(body, calSig(body, SECRET)));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.eventId).toBe("booking-uid-abc");
    expect(mockSend).toHaveBeenCalledOnce();
    const arg = mockSend.mock.calls[0][0];
    expect(arg.eventName).toBe("Schedule");
    expect(arg.eventId).toBe("booking-uid-abc");
    expect(arg.customData?.value).toBe(1997);
    expect(arg.customData?.currency).toBe("USD");
  });

  it("uses bookingId as fallback when uid is absent", async () => {
    const body = JSON.stringify({
      triggerEvent: "BOOKING_CREATED",
      payload: { bookingId: 9999, attendees: [] },
    });
    const res = await POST(makeRequest(body, calSig(body, SECRET)));
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].eventId).toBe("9999");
  });

  it("timing-safe compare: same-length but 1-char-flipped signature is rejected (401)", async () => {
    const body = validBody();
    const correctSig = calSig(body, SECRET);
    // Flip the last hex char to produce a same-length but different-value sig
    const lastChar = correctSig[correctSig.length - 1];
    const flipped = lastChar === "a" ? "b" : "a";
    const tampered = correctSig.slice(0, -1) + flipped;
    const res = await POST(makeRequest(body, tampered));
    expect(res.status).toBe(401);
  });
});
