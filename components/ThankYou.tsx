"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import {
  BOOKING_DURATION_MIN,
  BOOKING_LOCATION,
  formatBookingFields,
  parseBookingParams,
  type Booking,
} from "@/lib/booking";
import CalendarRow from "./CalendarRow";
import ThankYouNav from "./ThankYouNav";
import ThankYouFooter from "./ThankYouFooter";

export default function ThankYou() {
  const searchParams = useSearchParams();
  const booking = useMemo<Booking | null>(
    () => parseBookingParams(searchParams),
    [searchParams],
  );
  const firstName = booking?.firstName ?? null;

  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 60);
    return () => clearTimeout(t);
  }, []);

  const r = (delay: number): CSSProperties => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 0.7s var(--ease) ${delay}s, transform 0.7s var(--ease) ${delay}s`,
  });

  const fields = booking ? formatBookingFields(booking) : null;
  const dayName = fields?.dayName ?? null;

  return (
    <div className="thanks">
      <div aria-hidden="true" className="thanks__glow" />
      <ThankYouNav />

      <main className="thanks__main">
        <div className="thanks__eyebrow" style={r(0.0)}>
          <span className="thanks__dot" />
          <span className="thanks__eyebrow-text">You&apos;re booked</span>
        </div>

        <h1 className="thanks__headline" style={r(0.08)}>
          {dayName ? (
            <>
              See you <span className="thanks__accent">{dayName}</span>
              {firstName ? (
                <>
                  ,<br />
                  {firstName}.
                </>
              ) : (
                "."
              )}
            </>
          ) : (
            <>You&apos;re booked.</>
          )}
        </h1>

        <p className="thanks__sub" style={r(0.18)}>
          A confirmation is on its way.
        </p>

        {booking && fields && (
          <>
            <div className="thanks__divider" style={r(0.28)} />

            <div className="thanks__fields" style={r(0.32)}>
              <Field
                label="Date"
                value={`${fields.dayName}, ${fields.dateLong}`}
              />
              <Field label="Time" value={`${fields.time} ${fields.tzShort}`} />
              <Field label="Length" value={`${BOOKING_DURATION_MIN} min`} />
              <Field label="Where" value={BOOKING_LOCATION} />
            </div>

            <div className="thanks__cal" style={r(0.42)}>
              <p className="thanks__cal-eyebrow">Add to your calendar</p>
              <CalendarRow
                start={booking.start}
                end={booking.end}
                meetingUrl={booking.meetingUrl}
              />
            </div>
          </>
        )}

        <p className="thanks__closer" style={r(0.55)}>
          Talk soon.
        </p>
      </main>

      <ThankYouFooter />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="thanks__field">
      <div className="thanks__field-label">{label}</div>
      <div className="thanks__field-value">{value}</div>
    </div>
  );
}
