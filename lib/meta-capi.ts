import { createHash } from "crypto";

const GRAPH_API_VERSION = "v22.0";

type StandardEvent = "Lead" | "Schedule" | "ViewContent" | "Contact" | "CompleteRegistration";

export type CapiUserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
};

export type CapiEvent = {
  eventName: StandardEvent;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  userData?: CapiUserData;
  customData?: Record<string, unknown>;
};

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function buildHashedUserData(u: CapiUserData): Record<string, string[] | string> {
  const out: Record<string, string[] | string> = {};
  if (u.email) out.em = [sha256(normalizeEmail(u.email))];
  if (u.phone) {
    const p = normalizePhone(u.phone);
    if (p) out.ph = [sha256(p)];
  }
  if (u.firstName) out.fn = [sha256(normalizeName(u.firstName))];
  if (u.lastName) out.ln = [sha256(normalizeName(u.lastName))];
  if (u.city) out.ct = [sha256(normalizeName(u.city))];
  if (u.state) out.st = [sha256(normalizeName(u.state))];
  if (u.zip) out.zp = [sha256(u.zip.trim().toLowerCase())];
  if (u.country) out.country = [sha256(u.country.trim().toLowerCase())];
  if (u.clientIpAddress) out.client_ip_address = u.clientIpAddress;
  if (u.clientUserAgent) out.client_user_agent = u.clientUserAgent;
  if (u.fbp) out.fbp = u.fbp;
  if (u.fbc) out.fbc = u.fbc;
  return out;
}

export type CapiResult =
  | { ok: true; received: number; messages?: unknown }
  | { ok: false; reason: "missing-env" | "http-error" | "throw"; status?: number; detail?: unknown };

export async function sendCapiEvent(event: CapiEvent): Promise<CapiResult> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return { ok: false, reason: "missing-env" };
  }

  const testCode = process.env.META_TEST_EVENT_CODE;
  const eventTime = event.eventTime ?? Math.floor(Date.now() / 1000);

  const body = {
    data: [
      {
        event_name: event.eventName,
        event_time: eventTime,
        event_id: event.eventId,
        action_source: "website",
        ...(event.eventSourceUrl ? { event_source_url: event.eventSourceUrl } : {}),
        user_data: event.userData ? buildHashedUserData(event.userData) : {},
        ...(event.customData ? { custom_data: event.customData } : {}),
      },
    ],
    ...(testCode ? { test_event_code: testCode } : {}),
  };

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as
      | { events_received?: number; messages?: unknown; error?: unknown }
      | null;
    if (!res.ok) {
      return { ok: false, reason: "http-error", status: res.status, detail: json };
    }
    return { ok: true, received: json?.events_received ?? 0, messages: json?.messages };
  } catch (err) {
    return { ok: false, reason: "throw", detail: err instanceof Error ? err.message : String(err) };
  }
}
