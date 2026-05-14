"use client";

import { useEffect, useRef, useState } from "react";

const NAMESPACE = "strategy-call";
const CAL_LINK = "nicholas/strategy-call";
const ORIGIN = "https://dot-connectors-llc.cal.com";
const EMBED_SCRIPT = "https://app.cal.com/embed/embed.js";

export function CalEmbed() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loaderHidden, setLoaderHidden] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (wrapper.querySelector("iframe")) {
      setLoaderHidden(true);
      return;
    }

    /* eslint-disable */
    // @ts-expect-error: Cal global injected by embed.js — verbatim init from app.cal.com docs.
    (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, EMBED_SCRIPT, "init");

    // @ts-expect-error: Cal global
    window.Cal("init", NAMESPACE, { origin: ORIGIN });
    // @ts-expect-error: Cal namespace API
    window.Cal.ns[NAMESPACE]("inline", {
      elementOrSelector: wrapper,
      config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
      calLink: CAL_LINK,
    });
    // @ts-expect-error: Cal namespace API
    window.Cal.ns[NAMESPACE]("ui", {
      cssVarsPerTheme: { light: { "cal-brand": "#1A4A8C" } },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
    let bookingFired = false;
    const fireBookingConversion = () => {
      if (bookingFired) return;
      bookingFired = true;
      if (typeof window.fbq === "function") window.fbq("track", "Schedule");
      if (typeof window.gtag === "function") {
        window.gtag("event", "generate_lead", { value: 1997, currency: "USD" });
      }
    };
    // @ts-expect-error: Cal namespace API
    window.Cal.ns[NAMESPACE]("on", { action: "bookingSuccessful", callback: fireBookingConversion });
    // @ts-expect-error: Cal namespace API
    window.Cal.ns[NAMESPACE]("on", { action: "bookingSuccessfulV2", callback: fireBookingConversion });
    /* eslint-enable */

    let revealTimer: ReturnType<typeof setTimeout> | null = null;
    const reveal = () => {
      if (revealTimer) return;
      revealTimer = setTimeout(() => setLoaderHidden(true), 250);
    };

    const observer = new MutationObserver(() => {
      if (wrapper.querySelector("iframe")) {
        reveal();
        observer.disconnect();
      }
    });
    observer.observe(wrapper, { childList: true, subtree: true });

    if (wrapper.querySelector("iframe")) {
      reveal();
      observer.disconnect();
    }

    const fallback = setTimeout(() => {
      reveal();
      observer.disconnect();
    }, 6000);

    return () => {
      observer.disconnect();
      if (revealTimer) clearTimeout(revealTimer);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div className="bk-card__body">
      <div className="bk-card__cal" ref={wrapperRef} />
      <div
        className={`bk-card__loader ${loaderHidden ? "bk-card__loader--hidden" : ""}`}
        aria-hidden="true"
      >
        <div className="bk-card__spinner" />
        <span>Loading availability…</span>
      </div>
    </div>
  );
}
