/**
 * Self-contained unit test for lib/analytics.ts
 * Run: npx tsx scripts/analytics-test.ts
 *
 * No test framework required — manual mocks + inline assertions.
 * Wrapped in async IIFE to avoid top-level await (CJS compat).
 */

(async () => {
  // -------------------------------------------------------------------------
  // Import module under test
  // -------------------------------------------------------------------------
  // @vercel/analytics.track may no-op or throw in Node — that's fine;
  // the try/catch in analytics.ts is what we're validating handles it.
  let trackEvent: (name: string, params?: Record<string, unknown>) => void;
  try {
    const mod = await import("../lib/analytics.js");
    trackEvent = mod.trackEvent as typeof trackEvent;
  } catch (e) {
    console.error("FATAL: could not import lib/analytics.ts:", e);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  function makeWindow(overrides: Record<string, unknown> = {}): void {
    (globalThis as Record<string, unknown>).window = overrides;
  }

  function clearWindow(): void {
    delete (globalThis as Record<string, unknown>).window;
  }

  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  function assert(label: string, condition: boolean, detail = ""): void {
    if (condition) {
      passed++;
      results.push(`[PASS] ${label}`);
    } else {
      failed++;
      results.push(`[FAIL] ${label}${detail ? " — " + detail : ""}`);
    }
  }

  // -------------------------------------------------------------------------
  // Test A: server-side guard — no-op when window is undefined
  // -------------------------------------------------------------------------
  {
    clearWindow();
    let threw = false;
    try {
      trackEvent("Lead");
    } catch {
      threw = true;
    }
    assert(
      "server-side guard: no-op when window is undefined",
      !threw && typeof (globalThis as Record<string, unknown>).window === "undefined",
      threw ? "threw an error" : "window was unexpectedly defined"
    );
  }

  // -------------------------------------------------------------------------
  // Test B: gtag called with correct args when present
  // -------------------------------------------------------------------------
  {
    const gtagCalls: unknown[][] = [];
    makeWindow({ gtag: (...args: unknown[]) => gtagCalls.push(args) });
    try { trackEvent("Lead", { source: "hero" }); } catch { /* vercelTrack may throw in Node */ }
    const call = gtagCalls[0] as unknown[];
    assert(
      "gtag: called with ('event', name, params) when window.gtag is a function",
      gtagCalls.length === 1 &&
        call?.[0] === "event" &&
        call?.[1] === "Lead" &&
        (call?.[2] as Record<string, string>)?.source === "hero",
      JSON.stringify(gtagCalls)
    );
  }

  // -------------------------------------------------------------------------
  // Test C: gtag skipped when window.gtag is not a function
  // -------------------------------------------------------------------------
  {
    const win = { gtag: "not-a-function" };
    makeWindow(win as unknown as Record<string, unknown>);
    let threw = false;
    try { trackEvent("Lead"); } catch { threw = true; }
    // If gtag were called on a string it would throw; no throw = skipped.
    assert(
      "gtag: skipped when window.gtag is not a function",
      !threw,
      "calling a non-function gtag caused a throw"
    );
  }

  // -------------------------------------------------------------------------
  // Test D: fbq uses 'track' for standard Meta events
  // -------------------------------------------------------------------------
  {
    const fbqCalls: unknown[][] = [];
    makeWindow({ fbq: (...args: unknown[]) => fbqCalls.push(args) });
    try { trackEvent("Lead", { source: "cta" }); } catch { /* vercelTrack */ }
    assert(
      "fbq: uses 'track' for standard Meta event (Lead)",
      fbqCalls.length === 1 && fbqCalls[0]?.[0] === "track" && fbqCalls[0]?.[1] === "Lead",
      JSON.stringify(fbqCalls)
    );
  }

  // -------------------------------------------------------------------------
  // Test E: fbq uses 'trackCustom' for non-standard events
  // -------------------------------------------------------------------------
  {
    const fbqCalls: unknown[][] = [];
    makeWindow({ fbq: (...args: unknown[]) => fbqCalls.push(args) });
    try { trackEvent("ClickedPricing", { section: "offer" }); } catch { /* vercelTrack */ }
    assert(
      "fbq: uses 'trackCustom' for non-standard event (ClickedPricing)",
      fbqCalls.length === 1 && fbqCalls[0]?.[0] === "trackCustom" && fbqCalls[0]?.[1] === "ClickedPricing",
      JSON.stringify(fbqCalls)
    );
  }

  // -------------------------------------------------------------------------
  // Test F: fbq skipped when window.fbq is not a function
  // -------------------------------------------------------------------------
  {
    makeWindow({ fbq: 42 });
    let threw = false;
    try { trackEvent("Lead"); } catch { threw = true; }
    assert(
      "fbq: skipped when window.fbq is not a function",
      !threw,
      "calling non-function fbq caused a throw"
    );
  }

  // -------------------------------------------------------------------------
  // Test G: all 7 standard Meta events route to 'track'
  // -------------------------------------------------------------------------
  {
    const standardEvents = [
      "Lead", "Schedule", "CompleteRegistration", "Contact",
      "ViewContent", "Purchase", "InitiateCheckout",
    ];
    let allCorrect = true;
    const failures: string[] = [];
    for (const evt of standardEvents) {
      const fbqCalls: unknown[][] = [];
      makeWindow({ fbq: (...args: unknown[]) => fbqCalls.push(args) });
      try { trackEvent(evt); } catch { /* vercelTrack */ }
      if (fbqCalls[0]?.[0] !== "track") {
        allCorrect = false;
        failures.push(`${evt} → ${fbqCalls[0]?.[0]}`);
      }
    }
    assert(
      "fbq: all 7 standard Meta events route to 'track'",
      allCorrect,
      failures.join(", ")
    );
  }

  // -------------------------------------------------------------------------
  // Test H: undefined param values don't crash; gtag receives params object
  // -------------------------------------------------------------------------
  {
    const gtagCalls: unknown[][] = [];
    makeWindow({ gtag: (...args: unknown[]) => gtagCalls.push(args) });
    try { trackEvent("ViewContent", { page: "home", extra: undefined }); } catch { /* vercelTrack */ }
    const received = gtagCalls[0]?.[2] as Record<string, unknown>;
    assert(
      "params with undefined values: no crash, gtag receives params",
      gtagCalls.length === 1 && received?.page === "home",
      JSON.stringify(gtagCalls)
    );
  }

  // -------------------------------------------------------------------------
  // Test I: vercelTrack error doesn't propagate; downstream fbq still called
  // -------------------------------------------------------------------------
  {
    // In Node, vercelTrack from @vercel/analytics may throw because it
    // expects a browser environment. The try/catch in analytics.ts must
    // swallow that and continue to fbq.
    const fbqCalls: unknown[][] = [];
    makeWindow({ fbq: (...args: unknown[]) => fbqCalls.push(args) });
    let threw = false;
    try {
      trackEvent("Lead");
    } catch {
      threw = true;
    }
    assert(
      "error resilience: vercelTrack errors don't propagate; fbq still called",
      !threw && fbqCalls.length === 1,
      threw ? "trackEvent threw" : `fbqCalls=${JSON.stringify(fbqCalls)}`
    );
  }

  // -------------------------------------------------------------------------
  // Report
  // -------------------------------------------------------------------------
  console.log("\nlib/analytics.ts — unit test results");
  console.log("─".repeat(60));
  for (const r of results) console.log(r);
  console.log("─".repeat(60));
  console.log(`Tests run: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
