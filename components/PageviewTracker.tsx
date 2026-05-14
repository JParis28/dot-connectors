"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstLoad = useRef(true);

  useEffect(() => {
    // Skip the initial mount — the inline `fbq('init') / fbq('track','PageView')`
    // and the GA4 `config` call in layout already fire on the hard load. Only
    // fire for subsequent client-side route changes.
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ""),
      });
    }
  }, [pathname, searchParams]);

  return null;
}
