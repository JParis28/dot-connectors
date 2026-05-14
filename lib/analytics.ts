"use client";

import { track as vercelTrack } from "@vercel/analytics";

type Primitive = string | number | boolean | null;
type EventParams = Record<string, Primitive | undefined>;

const META_STANDARD_EVENTS = new Set([
  "Lead",
  "Schedule",
  "CompleteRegistration",
  "Contact",
  "ViewContent",
  "Purchase",
  "InitiateCheckout",
]);

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

function vercelPayload(params?: EventParams): Record<string, Primitive> | undefined {
  if (!params) return undefined;
  const out: Record<string, Primitive> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export function trackEvent(name: string, params?: EventParams): void {
  if (typeof window === "undefined") return;

  try {
    vercelTrack(name, vercelPayload(params));
  } catch {
    // Vercel Analytics not loaded; non-fatal.
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", name, params ?? {});
  }

  if (typeof window.fbq === "function") {
    if (META_STANDARD_EVENTS.has(name)) {
      window.fbq("track", name, params);
    } else {
      window.fbq("trackCustom", name, params);
    }
  }
}
