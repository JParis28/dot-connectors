const STRATEGY_CALL_TITLE = "Strategy Call — Connectors";
const STRATEGY_CALL_LOCATION = "Cal Video";
const STRATEGY_CALL_DESCRIPTION =
  "45-minute strategy call with Nicholas. We will walk through your phone log, demo the AI answering a real call, and figure out if Connectors is a fit.";
const STRATEGY_CALL_ORGANIZER_NAME = "Nicholas Carlson";
const STRATEGY_CALL_ORGANIZER_EMAIL = "nicholas@getconnectors.ai";
const DURATION_MINUTES = 45;

export type Booking = {
  start: Date;
  end: Date;
  tz: string;
  firstName: string | null;
  meetingUrl: string | null;
};

export type ParsedBooking = Booking | null;

type ReadableParams = { get(name: string): string | null };

export function parseBookingParams(params: ReadableParams): ParsedBooking {
  const startParam = params.get("startTime") ?? params.get("date");
  if (!startParam) return null;

  const start = new Date(startParam);
  if (Number.isNaN(start.getTime())) return null;

  const endParam = params.get("endTime");
  const end = endParam
    ? new Date(endParam)
    : new Date(start.getTime() + DURATION_MINUTES * 60 * 1000);

  const name = params.get("attendeeName") ?? params.get("name");
  const firstName = name?.trim().split(/\s+/)[0] ?? null;

  const tz =
    params.get("tz") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const uid = params.get("uid");
  const meetingUrl = uid ? `https://app.cal.com/video/${uid}` : null;

  return { start, end, tz, firstName: firstName || null, meetingUrl };
}

export function formatBookingFields(booking: Booking) {
  const dayName = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: booking.tz,
  }).format(booking.start);

  const dateLong = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: booking.tz,
  }).format(booking.start);

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: booking.tz,
  }).format(booking.start);

  const tzShort = formatTzShort(booking.start, booking.tz);

  return { dayName, dateLong, time, tzShort };
}

function formatTzShort(date: Date, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    if (tzPart) return tzPart.value;
  } catch {
    /* fall through */
  }
  return tz;
}

function toCompactUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function locationField(meetingUrl: string | null): string {
  return meetingUrl ?? STRATEGY_CALL_LOCATION;
}

function detailsBody(meetingUrl: string | null): string {
  const base = "45-minute strategy call with Nicholas.";
  return meetingUrl ? `${base}\n\nJoin: ${meetingUrl}` : base;
}

export function buildGoogleCalUrl(
  start: Date,
  end: Date,
  meetingUrl: string | null = null,
): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: STRATEGY_CALL_TITLE,
    dates: `${toCompactUtc(start)}/${toCompactUtc(end)}`,
    details: detailsBody(meetingUrl),
    location: locationField(meetingUrl),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookCalUrl(
  start: Date,
  end: Date,
  meetingUrl: string | null = null,
): string {
  const params = new URLSearchParams({
    subject: STRATEGY_CALL_TITLE,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: detailsBody(meetingUrl),
    location: locationField(meetingUrl),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function buildIcsDataUrl(
  start: Date,
  end: Date,
  meetingUrl: string | null = null,
): string {
  const dtstart = toCompactUtc(start);
  const dtend = toCompactUtc(end);
  const dtstamp = toCompactUtc(new Date());
  const uid = `strategy-${Date.now()}@getconnectors.ai`;
  const fullDescription = meetingUrl
    ? `${STRATEGY_CALL_DESCRIPTION}\\n\\nJoin: ${meetingUrl}`
    : STRATEGY_CALL_DESCRIPTION;
  const escapedDescription = fullDescription.replace(/,/g, "\\,");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Connectors//Strategy Call//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${STRATEGY_CALL_TITLE}`,
    `DESCRIPTION:${escapedDescription}`,
    `LOCATION:${locationField(meetingUrl)}`,
    `ORGANIZER;CN=${STRATEGY_CALL_ORGANIZER_NAME}:mailto:${STRATEGY_CALL_ORGANIZER_EMAIL}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

export const BOOKING_DURATION_MIN = DURATION_MINUTES;
export const BOOKING_LOCATION = STRATEGY_CALL_LOCATION;
