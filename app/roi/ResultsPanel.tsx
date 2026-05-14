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
        <p className="rc-kpi__eyebrow">Year 1 Recoverable</p>
        <div className="rc-kpi__value tnum">
          <TickingValue value={money(result.year1)} />
        </div>
        <p className="rc-kpi__profit tnum">
          ≈ <TickingValue value={money(result.year1Profit)} /> gross profit
        </p>
        <p className="rc-kpi__caption">Captured leakage, plan attach, reactivation.</p>
      </div>
      <div className="rc-kpi">
        <p className="rc-kpi__eyebrow">Steady-State Annual</p>
        <div className="rc-kpi__value tnum">
          <TickingValue value={money(result.steadyAnnual)} />
        </div>
        <p className="rc-kpi__profit tnum">
          ≈ <TickingValue value={money(result.steadyAnnualProfit)} /> gross profit
        </p>
        <p className="rc-kpi__caption">Average of Year 2 and Year 3.</p>
      </div>
      <div className="rc-kpi rc-kpi--hero">
        <p className="rc-kpi__eyebrow">3-Year Cumulative</p>
        <div className="rc-kpi__value tnum">
          <TickingValue value={money(result.threeYearTotal)} />
        </div>
        <p className="rc-kpi__profit tnum">
          ≈ <TickingValue value={money(result.threeYearTotalProfit)} /> gross profit
        </p>
        <p className="rc-kpi__caption">
          Every month you wait costs about{" "}
          <TickingValue value={money(result.threeYearTotal / 36)} />.
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
    { label: "10-year cumulative", value: result.tenYearTotal },
    { label: "20-year cumulative", value: result.twentyYearTotal },
    { label: "30-year cumulative", value: result.thirtyYearTotal },
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
        Headline numbers are <strong>recoverable revenue</strong>. Underneath each one we show
        <strong> gross profit</strong> using industry-default margins (HVAC: 57% repair / 40%
        replacement; Roofing: 57% / 38%; General: 55% / 38%). Margins come from Profitability
        Partners, who reviewed 200+ home-services P&amp;Ls under PE underwriting at Apex Service
        Partners. Missed-call rates come from Invoca&rsquo;s 2025 Home Services Call Conversion
        Benchmarks Report (60M calls) and ServiceDirect&rsquo;s 2019 audit of 1,000 recorded calls.
        AI capture rate is 100%. The AI answers every inbound call (Retell&rsquo;s published case
        data backs the floor). No-show rate (15 to 20 percent) comes from Allied Emergency
        Services&rsquo; 2026 Roofing Sales KPIs (sit rate 60 to 85 percent inverted) plus the PMC
        systematic review of 29 appointment-reminder studies (23.1 percent median baseline). AI
        rebook recovery (25 to 40 percent) is an operator estimate motivated by cross-vertical
        automated-rebook data from medical and dental appointment systems. Database reachability
        uses ZeroBounce email-decay (~23%/yr) and carrier postpaid churn (~11%/yr). Phone numbers
        are sticky even when email decays. Conservative mode uses the low end of each range;
        aggressive uses the median. Every pillar expands to show the exact arithmetic. Nothing is
        hidden in a black box.
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
