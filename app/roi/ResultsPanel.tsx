"use client";

import { useState } from "react";
import type { CalcResult, Inputs } from "@/lib/roi/calc";
import { money, count } from "@/lib/roi/format";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { PillarCard } from "./PillarCard";
import { TickingValue } from "./Ticking";

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
        <p className="rc-kpi__caption">Bigger because you only wake the dead once.</p>
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

function StandaloneCta() {
  return (
    <div className="rc-standalone-cta">
      <a href="/start" className="rc-standalone-cta__btn">
        Claim what&rsquo;s already yours
        <Icon name="arrow" size={16} strokeWidth={1.75} />
      </a>
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

function AsideRow({ onPrint, inputs }: { onPrint: () => void; inputs: Inputs }) {
  const [businessName, setBusinessName] = useState("");
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
        body: JSON.stringify({ email: email.trim(), businessName: businessName.trim(), inputs }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Couldn't send. Try again in a moment.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMsg("Network hiccup. Try again.");
    }
  };

  return (
    <div className="rc-aside">
      <form className="rc-email-form" onSubmit={submit} aria-busy={status === "sending"}>
        <span className="rc-email-form__label">Email me this</span>
        <span className="rc-email-form__divider" />
        <input
          className="rc-email-form__input"
          type="text"
          placeholder="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          disabled={status === "sending" || status === "sent"}
        />
        <span className="rc-email-form__divider" />
        <input
          className="rc-email-form__input"
          type="email"
          placeholder="you@business.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "sending" || status === "sent"}
          required
        />
        <button
          className="rc-email-form__btn"
          type="submit"
          disabled={disabled}
        >
          {status === "sending" ? "Sending…" : status === "sent" ? "Sent ✓" : "Send"}
        </button>
      </form>
      <button type="button" className="rc-print-btn" onClick={onPrint}>
        <Icon name="file-text" size={14} strokeWidth={1.5} />
        Print or save as PDF
      </button>
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
    <div className="rc-method">
      <p className="rc-method__label">How we calculate</p>
      <div className="rc-method__body">
        <p>
          Headline numbers are <strong>added revenue</strong>. Underneath each one we show
          <strong> added profit</strong>, the real money that hits your business. Your existing
          operations already cover fixed costs: trucks, salaries, rent, insurance, marketing,
          office staff. When the AI recovers a job that was going to voicemail, your only
          incremental cost is direct labor and materials for that specific job, which is what
          gross margin captures. Unlike your net margin, added profit isn&rsquo;t diluted by
          overhead, because the overhead is already paid.
        </p>
        <p>
          Industry-default margins: HVAC 50% blended; Roofing 57% repair / 38% replacement;
          General 55% / 38%. Margins come from Profitability Partners, who reviewed 200+
          home-services P&amp;Ls under PE underwriting at Apex Service Partners.
        </p>
        <p>
          Missed-call rates ladder 20% / 35% / 55% across the three modes, framed by shop maturity
          rather than skepticism. <strong>Conservative</strong> (20%) is the well-run shop with
          decent business-hours coverage and basic voicemail. <strong>Research</strong> (35%) is
          the typical small Florida shop. <strong>Aggressive</strong> (55%) is the owner-operator
          with no real after-hours setup.
        </p>
        <p>
          The weighted math behind the middle tier: 57% of calls land in business hours, 43% after
          hours (Contractor In Charge, VoiceCharm). A typical Florida shop misses about 15% in
          business hours and 55% after hours. (0.57 × 0.15) + (0.43 × 0.55) ≈ 32%, rounded to 35%
          to absorb peak-season surge. Sources behind the bounds: CallRail&rsquo;s 14% home-services
          figure represents the floor (tracking-number data only, biased toward sophisticated shops).
          Invoca&rsquo;s 27% (2024) and 39% (2025, 60M calls) bracket the middle. 411
          Locals&rsquo; 62% caps the ceiling. AI capture is 100%: the agent picks up every inbound
          call.
        </p>
        <p>
          We model every missed call as potentially job-bearing and discount with your close rate.
          In practice 40 to 60% of inbound is new-customer intent; the rest is rebooking, vendors,
          and existing-customer questions, none of which compete with your close rate. The
          booking-rate input is the lever that lets you tune this for your shop.
        </p>
        <p>
          No-show rate (5% / 15% / 20%) comes from Allied Emergency Services&rsquo; 2026 Roofing
          Sales KPIs (sit rate 60 to 85% inverted) and the PMC systematic review of 29
          appointment-reminder studies (23.1% median baseline). Rebook recovery (10% / 25% / 40%)
          is an operator estimate motivated by cross-vertical automated-rebook data from medical
          and dental appointment systems.
        </p>
        <p>
          Plan attach (5% / 12% / 28%) is an at-close flow metric, not the installed-base stock
          metric people usually quote. FieldEdge benchmarks 30% industry-average <strong>adoption</strong> (the
          share of customers who eventually carry a plan) and 25 to 50% as the tech-conversion
          target on demand calls. Without a mandatory at-close script, documented attach lands 10
          to 15%. With a mandatory script, best-in-class operators reach 25 to 30%.
          ServiceTitan&rsquo;s &ldquo;20 to 30% of HVAC revenue&rdquo; benchmark refers to
          service-agreement revenue share, a different metric, and is not the source for the
          ladder here.
        </p>
        <p>
          Database reachability uses ZeroBounce email decay (~23%/yr) and carrier postpaid churn
          (~11%/yr). Phone numbers stick when email decays. Reactivation rate (3% / 4.5% / 7%) is
          an operator estimate; no peer-reviewed home-services rebook-the-dead study exists.
        </p>
        <p>
          Every pillar expands to show the arithmetic. Conservative is the floor that should still
          pencil. Research is the defensible middle, the right number to show a prospect on first
          load. Aggressive is best-in-class with strong process. Nothing is hidden in a black box.
        </p>
      </div>
    </div>
  );
}

export function ResultsPanel({
  result,
  inputs,
  onPrint,
}: {
  result: CalcResult;
  inputs: Inputs;
  onPrint: () => void;
}) {
  return (
    <div className="rc-results">
      <Reveal>
        <KpiStrip result={result} />
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
      <Reveal>
        <CompoundStrip result={result} />
      </Reveal>
      <Reveal>
        <StandaloneCta />
      </Reveal>
      <AsideRow onPrint={onPrint} inputs={inputs} />
      <Methodology />
    </div>
  );
}
