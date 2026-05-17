/**
 * Tests for lib/meta-capi.ts (real module — no vi.mock here)
 * Mocks: global.fetch via vi.stubGlobal, process.env mutations.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "crypto";
import { sendCapiEvent } from "@/lib/meta-capi";

function sha256hex(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

describe("lib/meta-capi.ts", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    process.env.META_PIXEL_ID = "PIXEL123";
    process.env.META_CAPI_ACCESS_TOKEN = "TOKEN123";
    delete process.env.META_TEST_EVENT_CODE;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.META_PIXEL_ID;
    delete process.env.META_CAPI_ACCESS_TOKEN;
    delete process.env.META_TEST_EVENT_CODE;
  });

  function mockOkFetch() {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events_received: 1 }),
    });
  }

  async function sendAndGetPayload(userData: Record<string, string>) {
    mockOkFetch();
    await sendCapiEvent({
      eventName: "Lead",
      eventId: "evt-1",
      eventTime: 1700000000,
      userData: userData as Parameters<typeof sendCapiEvent>[0]["userData"],
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    return JSON.parse(fetchMock.mock.calls[0][1].body);
  }

  // ── Hashing tests ──────────────────────────────────────────────────────────

  it("hashes email (lowercased + trimmed)", async () => {
    const body = await sendAndGetPayload({ email: "  Hello@Example.COM  " });
    expect(body.data[0].user_data.em[0]).toBe(sha256hex("hello@example.com"));
  });

  it("hashes phone (digits-only)", async () => {
    const body = await sendAndGetPayload({ phone: "+1 (813) 555-0100" });
    expect(body.data[0].user_data.ph[0]).toBe(sha256hex("18135550100"));
  });

  it("hashes firstName (lowercased + trimmed)", async () => {
    const body = await sendAndGetPayload({ firstName: " Jordan " });
    expect(body.data[0].user_data.fn[0]).toBe(sha256hex("jordan"));
  });

  it("hashes lastName (lowercased + trimmed)", async () => {
    const body = await sendAndGetPayload({ lastName: "Paris" });
    expect(body.data[0].user_data.ln[0]).toBe(sha256hex("paris"));
  });

  it("hashes zip (lowercased + trimmed)", async () => {
    const body = await sendAndGetPayload({ zip: " 33701 " });
    expect(body.data[0].user_data.zp[0]).toBe(sha256hex("33701"));
  });

  it("hashes country (lowercased + trimmed)", async () => {
    const body = await sendAndGetPayload({ country: "US" });
    expect(body.data[0].user_data.country[0]).toBe(sha256hex("us"));
  });

  // ── Plaintext passthrough ──────────────────────────────────────────────────

  it("passes clientIpAddress plaintext (not hashed)", async () => {
    const ip = "203.0.113.5";
    const body = await sendAndGetPayload({ clientIpAddress: ip });
    expect(body.data[0].user_data.client_ip_address).toBe(ip);
  });

  it("passes clientUserAgent plaintext (not hashed)", async () => {
    const ua = "Mozilla/5.0";
    const body = await sendAndGetPayload({ clientUserAgent: ua });
    expect(body.data[0].user_data.client_user_agent).toBe(ua);
  });

  // ── Payload shape ──────────────────────────────────────────────────────────

  it("data[0] has correct shape fields (eventName, event_time, event_id, action_source)", async () => {
    mockOkFetch();
    await sendCapiEvent({ eventName: "Schedule", eventId: "abc-123", eventTime: 1700000000 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const d = body.data[0];
    expect(d.event_name).toBe("Schedule");
    expect(d.event_time).toBe(1700000000);
    expect(d.event_id).toBe("abc-123");
    expect(d.action_source).toBe("website");
  });

  // ── test_event_code ────────────────────────────────────────────────────────

  it("includes test_event_code when META_TEST_EVENT_CODE is set", async () => {
    process.env.META_TEST_EVENT_CODE = "TEST12345";
    mockOkFetch();
    await sendCapiEvent({ eventName: "Lead", eventId: "e1", eventTime: 1700000000 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.test_event_code).toBe("TEST12345");
  });

  it("omits test_event_code when META_TEST_EVENT_CODE is unset", async () => {
    mockOkFetch();
    await sendCapiEvent({ eventName: "Lead", eventId: "e1", eventTime: 1700000000 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.test_event_code).toBeUndefined();
  });

  // ── Missing env ────────────────────────────────────────────────────────────

  it("returns {ok:false, reason:'missing-env'} with no META_PIXEL_ID — no fetch call", async () => {
    delete process.env.META_PIXEL_ID;
    const result = await sendCapiEvent({ eventName: "Lead", eventId: "e1" });
    expect(result).toEqual({ ok: false, reason: "missing-env" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns {ok:false, reason:'missing-env'} with no META_CAPI_ACCESS_TOKEN — no fetch call", async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    const result = await sendCapiEvent({ eventName: "Lead", eventId: "e1" });
    expect(result).toEqual({ ok: false, reason: "missing-env" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ── HTTP errors / throws ───────────────────────────────────────────────────

  it("returns {ok:false, reason:'http-error'} on non-2xx response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "bad token" } }),
    });
    const result = await sendCapiEvent({ eventName: "Lead", eventId: "e1" });
    expect(result).toMatchObject({ ok: false, reason: "http-error", status: 400 });
  });

  it("returns {ok:false, reason:'throw'} when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network failure"));
    const result = await sendCapiEvent({ eventName: "Lead", eventId: "e1" });
    expect(result).toMatchObject({ ok: false, reason: "throw", detail: "network failure" });
  });
});
