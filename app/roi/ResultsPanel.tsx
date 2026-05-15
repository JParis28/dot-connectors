"use client";

import { useState } from "react";
import type { CalcResult, Inputs } from "@/lib/roi/calc";
import { money, count } from "@/lib/roi/format";
import { BookCallLink } from "@/components/BookCallLink";
import { Reveal } from "@/components/Reveal";
import { PillarCard } from "./PillarCard";
import { TickingValue } from "./Ticking";
import { trackEvent } from "@/lib/analytics";

function CohortRow() {
  return (
    <div
      className="rc-cohort-row"
      aria-label="Connectors costs $1,997 per month. Founding cohort, first 25 customers, install fee waived."
    >
      <span className="rc-cohort-row__label">Your cost to recover it</span>
      <span className="rc-cohort-row__value">
        Connectors costs $1,997/month. Your calculator just showed you what doing nothing costs.
      </span>
      <span className="rc-cohort-row__note">Founding cohort · first 25 only · install fee waived</span>
    </div>
  );
}

function KpiStrip({ result }: { result: CalcResult }) {
  return (
    <div className="rc-kpis">
      <div className="rc-kpi">
        <p className="rc-kpi__eyebrow">Year 1 added revenue</p>
        <div className="rc-kpi__value tnum">
          <TickingValue value={money(result.year1)} />
        </div>
        <p className="rc-kpi__profit tnum">
          ≈ <TickingValue value={money(result.year1Profit)} /> added profit
        </p>
        <p className="rc-kpi__caption">Bigger because the past-customer reactivation only runs once.</p>
      </div>
      <div className="rc-kpi">
        <p className="rc-kpi__eyebrow">Annual added revenue</p>
        <div className="rc-kpi__value tnum">
          <TickingValue value={money(result.steadyAnnual)} />
        </div>
        <p className="rc-kpi__profit tnum">
          ≈ <TickingValue value={money(result.steadyAnnualProfit)} /> added profit
        </p>
        <p className="rc-kpi__caption">What Year 2 and Year 3 look like, on average.</p>
      </div>
      <div className="rc-kpi rc-kpi--hero">
        <p className="rc-kpi__eyebrow">3-year added revenue</p>
        <div className="rc-kpi__value tnum">
          <TickingValue value={money(result.threeYearTotal)} />
        </div>
        <p className="rc-kpi__profit tnum">
          ≈ <TickingValue value={money(result.threeYearTotalProfit)} /> added profit
        </p>
        <p className="rc-kpi__caption">
          Every month you wait, you&rsquo;re losing about{" "}
          <TickingValue value={money(result.threeYearTotal / 36)} /> to voicemail.
        </p>
      </div>
    </div>
  );
}

function CompoundStrip({ result }: { result: CalcResult }) {
  const items = [
    { label: "10-year total", value: result.tenYearTotal, profit: result.tenYearTotalProfit },
    { label: "20-year total", value: result.twentyYearTotal, profit: result.twentyYearTotalProfit },
    { label: "30-year total", value: result.thirtyYearTotal, profit: result.thirtyYearTotalProfit },
  ];
  const d = result.derived;
  const hasPlan = result.pillars.some((p) => p.id === "p3");
  return (
    <section className="rc-compound">
      <header className="rc-compound__head">
        <p className="rc-compound__eyebrow">Year after year</p>
        <p className="rc-compound__recap">
          <strong>{count(d.monthlyMissed)} more calls answered every month.</strong>{" "}
          <strong>{count(d.p2Rescued)} no-shows brought back a year.</strong>{" "}
          {hasPlan ? (
            <>
              <strong>{count(d.p3Attached)} customers on a plan they always needed.</strong>{" "}
            </>
          ) : null}
          <strong>{count(d.p4Reactivated)} names in your CRM, alive again.</strong>
        </p>
        <p className="rc-compound__transition">
          Same shop, same crew, same trucks. Let it run a decade. Two. Three:
        </p>
      </header>
      <div className="rc-compound__grid">
        {items.map((it) => (
          <div key={it.label} className="rc-compound__item">
            <p className="rc-compound__num tnum">
              <TickingValue value={money(it.value)} />
            </p>
            <p className="rc-compound__profit tnum">
              ≈ <TickingValue value={money(it.profit)} /> added profit
            </p>
            <p className="rc-compound__label">{it.label}</p>
          </div>
        ))}
      </div>
      <figure className="rc-compound__seal">
        <blockquote className="rc-compound__quote">
          &ldquo;A small leak will sink a great ship.&rdquo;
        </blockquote>
        <figcaption className="rc-compound__attrib">Benjamin Franklin</figcaption>
      </figure>
    </section>
  );
}

type Status = "idle" | "sending" | "sent" | "error";

function AsideRow({ inputs }: { inputs: Inputs }) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const disabled = status === "sending" || !isValidEmail;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/email-roi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), businessName: firstName.trim(), inputs }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Couldn't send. Try again in a moment.");
        return;
      }
      setStatus("sent");
      trackEvent("email_capture_submit");
      trackEvent("Lead", { content_name: "ROI report" });
    } catch {
      setStatus("error");
      setErrorMsg("Network hiccup. Try again.");
    }
  };

  return (
    <div className="rc-aside">
      <form className="rc-email-form" onSubmit={submit} aria-busy={status === "sending"}>
        <input
          className="rc-email-form__input"
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={status === "sending" || status === "sent"}
          autoComplete="given-name"
        />
        <span className="rc-email-form__divider" />
        <input
          className="rc-email-form__input"
          type="email"
          placeholder="you@business.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "sending" || status === "sent"}
          autoComplete="email"
          required
        />
        <button
          className="rc-email-form__btn"
          type="submit"
          disabled={disabled}
        >
          {status === "sending" ? "Sending…" : status === "sent" ? "Sent ✓" : "Email me the report"}
        </button>
      </form>
      {status === "error" ? (
        <p className="rc-aside__status rc-aside__status--error">{errorMsg}</p>
      ) : null}
      {status === "sent" ? (
        <p className="rc-aside__status rc-aside__status--ok">
          On its way to <strong>{email}</strong>. Check your inbox.
        </p>
      ) : null}
    </div>
  );
}

function Methodology() {
  return (
    <details className="rc-method">
      <summary className="rc-method__summary">
        <span className="rc-method__label">How we calculate these numbers</span>
        <span className="rc-method__chev" aria-hidden="true">›</span>
      </summary>
      <div className="rc-method__body">
        <p>
          <strong>Revenue vs. profit.</strong> The big numbers are <strong>added revenue</strong>.
          Below each one we show <strong>added profit</strong>, the money that hits your bank
          account. Your trucks, payroll, rent, and ads are already paid for. When the AI rescues a
          job that would have gone to voicemail, the only extra cost is the labor and parts for
          that one job. Everything else is profit.
        </p>
        <p>
          <strong>Margins we use.</strong> HVAC: 50% blended. Roofing: 57% on repairs, 38% on full
          replacements. General trades: 55% / 38%. Source: Profitability Partners reviewed 200+
          home-services P&amp;Ls under PE underwriting at Apex Service Partners.
        </p>
        <p>
          <strong>How many calls you miss.</strong> Three settings.
        </p>
        <p>
          <strong>Conservative (20%).</strong> A well-run shop with daytime coverage and basic
          voicemail.
        </p>
        <p>
          <strong>Research (35%).</strong> A typical small Florida shop. This is the right number
          to show first.
        </p>
        <p>
          <strong>Aggressive (55%).</strong> Owner-operator with no real after-hours setup.
        </p>
        <p>
          <strong>Where 35% comes from.</strong> 57% of calls come in during business hours, 43%
          after hours. Florida shops miss about 15% in the day and 55% at night. The math:
          (0.57 × 0.15) + (0.43 × 0.55) ≈ 32%. We round to 35% to cover busy-season spikes.
        </p>
        <p>
          <strong>Floor and ceiling.</strong> CallRail reports 14% missed (probably low, since
          they only see shops sophisticated enough to track calls). Invoca reports 27%–39%. 411
          Locals reports up to 62%. Our AI answers every call. 100%.
        </p>
        <p>
          <strong>Why we discount by your booking rate.</strong> Not every call is a new job. Some
          are rebookings, vendors, or existing customers with questions. Industry data says
          40%–60% of inbound is new-customer intent. The booking-rate input is the lever you use
          to tune this for your shop.
        </p>
        <p>
          <strong>No-shows.</strong> 5% / 15% / 20% across the three modes. Sources: Allied
          Emergency Services 2026 Roofing Sales KPIs, and a PMC review of 29 appointment-reminder
          studies (23.1% median). Rebook recovery is 10% / 25% / 40%, taken from automated-rebook
          data in medical and dental.
        </p>
        <p>
          <strong>Plan attach.</strong> 5% / 12% / 28% at job close, not your total customer base.
          Here&rsquo;s what that means. About 30% of customers end up on a plan over time
          (FieldEdge benchmark). Without a script at close, you get 10%–15% to sign up at the
          point of sale. With a mandatory script, top operators hit 25%–30%. ServiceTitan&rsquo;s
          &ldquo;20%–30% of HVAC revenue from plans&rdquo; is a different metric (revenue share,
          not attach rate).
        </p>
        <p>
          <strong>Reactivating past customers.</strong> Email addresses decay about 23% per year
          (ZeroBounce). Phone numbers stick longer, about 11% churn per year. So phone wins for
          reaching old customers. Reactivation rate (3% / 4.5% / 7%) is our operator estimate. No
          peer-reviewed home-services study exists for this one.
        </p>
        <p>
          <strong>Three modes, all visible.</strong> Every pillar shows its math. Conservative is
          the floor that should still pencil. Research is the defensible middle, the right number
          to show on first load. Aggressive is best-in-class with tight process. Nothing is
          hidden.
        </p>
      </div>
    </details>
  );
}

export function ResultsPanel({
  result,
  inputs,
}: {
  result: CalcResult;
  inputs: Inputs;
}) {
  return (
    <div className="rc-results">
      <Reveal>
        <KpiStrip result={result} />
      </Reveal>
      <Reveal>
        <CohortRow />
      </Reveal>
      <div className="rc-section-head">
        <h2 className="rc-section-head__title">
          {result.pillars.length === 4 ? "Four" : "Three"} pillars of recoverable revenue
        </h2>
        <span className="rc-section-head__hint">Tap any card to show the math</span>
      </div>
      <div className="rc-pillars">
        {result.pillars.map((p, i) => (
          <Reveal key={p.id}>
            <PillarCard pillar={p} index={i} />
          </Reveal>
        ))}
      </div>
      <p className="rc-disclaimer">
        Projections based on industry research and your inputs. Not a guarantee of results.
        Connectors guarantees what Connectors controls: 95% call answer rate, 30-day go-live. See terms.
      </p>
      <Reveal>
        <CompoundStrip result={result} />
      </Reveal>
      <Reveal>
        <div className="rc-results-cta">
          <BookCallLink className="btn btn--primary btn--lg">
            Claim what&rsquo;s already yours
          </BookCallLink>
        </div>
      </Reveal>
      <Methodology />
      <AsideRow inputs={inputs} />
    </div>
  );
}
