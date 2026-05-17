"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

export function StartViewContent({ year1Recoverable }: { year1Recoverable: string | null }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent("ViewContent", {
      content_name: "Strategy call",
      content_category: "booking",
      personalized: year1Recoverable ? "true" : "false",
      ...(year1Recoverable ? { year1_recoverable: year1Recoverable } : {}),
    });
  }, [year1Recoverable]);
  return null;
}
