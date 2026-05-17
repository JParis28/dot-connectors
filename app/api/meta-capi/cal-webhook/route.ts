import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { sendCapiEvent } from "@/lib/meta-capi";

const STRATEGY_CALL_VALUE_USD = 1997;

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf-8").digest("hex");
  const max = Math.max(expected.length, signatureHeader.length);
  const a = Buffer.alloc(max);
  const b = Buffer.alloc(max);
  a.write(expected, "utf-8");
  b.write(signatureHeader, "utf-8");
  return timingSafeEqual(a, b) && expected.length === signatureHeader.length;
}

type CalAttendee = {
  name?: string;
  email?: string;
  timeZone?: string;
  phoneNumber?: string;
};

type CalWebhookPayload = {
  triggerEvent?: string;
  createdAt?: string;
  payload?: {
    uid?: string;
    bookingId?: string | number;
    title?: string;
    type?: string;
    startTime?: string;
    endTime?: string;
    attendees?: CalAttendee[];
    organizer?: { email?: string; name?: string };
    responses?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
};

export async function POST(request: NextRequest) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[cal-webhook] CAL_WEBHOOK_SECRET not configured");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("x-cal-signature-256");
  if (!verifySignature(rawBody, sig, secret)) {
    console.warn("[cal-webhook] Signature verification failed");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: CalWebhookPayload;
  try {
    body = JSON.parse(rawBody) as CalWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const trigger = body.triggerEvent ?? "";
  if (trigger !== "BOOKING_CREATED") {
    return NextResponse.json({ ok: true, ignored: trigger });
  }

  const payload = body.payload ?? {};
  const uid =
    typeof payload.uid === "string" && payload.uid
      ? payload.uid
      : payload.bookingId != null
        ? String(payload.bookingId)
        : "";
  if (!uid) {
    console.warn("[cal-webhook] BOOKING_CREATED missing uid/bookingId");
    return NextResponse.json({ ok: false, error: "Missing booking id" }, { status: 400 });
  }

  const attendee = payload.attendees?.[0];
  const email = attendee?.email?.trim();
  const fullName = attendee?.name?.trim() ?? "";
  const [firstName, ...rest] = fullName.split(/\s+/);
  const lastName = rest.join(" ");
  const phone = attendee?.phoneNumber?.trim();

  const fwd = request.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || undefined;
  const ua = request.headers.get("user-agent") ?? undefined;

  const capi = await sendCapiEvent({
    eventName: "Schedule",
    eventId: uid,
    eventSourceUrl: "https://www.getconnectors.ai/start",
    userData: {
      email: email || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
      clientIpAddress: ip,
      clientUserAgent: ua,
    },
    customData: {
      currency: "USD",
      value: STRATEGY_CALL_VALUE_USD,
      content_name: "Strategy call",
    },
  });

  if (!capi.ok) {
    const safeLog = capi.reason === "http-error" ? { reason: capi.reason, status: capi.status } : { reason: capi.reason };
    console.error("[cal-webhook] CAPI Schedule fire failed:", safeLog);
    return NextResponse.json({ ok: false, reason: capi.reason }, { status: 502 });
  }

  return NextResponse.json({ ok: true, eventId: uid });
}
