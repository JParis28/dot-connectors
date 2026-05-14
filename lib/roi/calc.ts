/* ============================================================
   Recoverable Revenue Calculator — math engine
   Pure functions. No DOM, no React.
   Ported from agency/internal-website/design_handoff_roi_calculator/scripts/engine.js
   ============================================================ */

import { money, count, pct } from "./format";

export type TradeId = "hvac" | "roofing" | "general";
export type ModeId = "conservative" | "research" | "aggressive";

export type TradeConfig = {
  label: string;
  monthlyLeads: number;
  bookingRate: number;
  smallTicket: number;
  bigTicket: number;
  bigTicketMix: number;
  smallMargin: number;
  bigMargin: number;
  pastCustomers: number;
  planMembersPct: number;
  planFeeAnnual: number;
  smallLabel: string;
  bigLabel: string;
  bigShareLabel: string;
  planNoun: string;
};

export type ModeConfig = {
  label: string;
  leakRate: number;
  recoveryRate: number;
  noShowRate: number;
  rebookLift: number;
  attachRate: number;
  reactivateRate: number;
  reachableRate: number;
  yr2Growth: number;
  yr3Growth: number;
};

export type Inputs = {
  trade: TradeId;
  mode: ModeId;
  monthlyLeads: number;
  bookingRate: number;
  smallTicket: number;
  bigTicket: number;
  bigTicketMix: number;
  pastCustomers: number;
  planMembersPct: number;
  planFeeAnnual: number;
};

export type MathRow = {
  label: string;
  math: string;
  value: string | null;
  strong?: boolean;
  dim?: boolean;
};

export type PillarResult = {
  id: "p1" | "p2" | "p3" | "p4";
  eyebrow: string;
  title: string;
  oneliner: string;
  revenue: number;
  profit: number;
  rows: MathRow[];
  footer?: string;
  featured?: boolean;
};

export type CalcResult = {
  inputs: Inputs;
  trade: TradeConfig;
  mode: ModeConfig;
  derived: {
    annualLeads: number;
    blendedTicket: number;
    blendedProfit: number;
    monthlyMissed: number;
    p2Rescued: number;
    p3Attached: number;
    p4Reactivated: number;
  };
  // Headline revenue figures (the big numbers prospects see)
  year1: number;
  steadyAnnual: number;
  threeYearTotal: number;
  year2: number;
  year3: number;
  tenYearTotal: number;
  twentyYearTotal: number;
  thirtyYearTotal: number;
  // Profit figures (shown as honest underline beneath revenue)
  year1Profit: number;
  steadyAnnualProfit: number;
  threeYearTotalProfit: number;
  year2Profit: number;
  year3Profit: number;
  tenYearTotalProfit: number;
  twentyYearTotalProfit: number;
  thirtyYearTotalProfit: number;
  pillars: PillarResult[];
};

// Trade defaults. Tickets + booking rates + gross margins sourced where
// published data exists; monthly lead counts + plan-member %s are Connectors
// deployment estimates.
//   - HVAC booking 38%: ServiceTitan 2022 industry data
//     https://www.servicetitan.com/blog/data-call-booking-rates
//   - HVAC tickets: ServiceTitan + Built on Tenth synthesis ($400–$700 service,
//     $7,500–$14,000 replacement) https://www.builtontenth.com/hvac-research/hvac-average-ticket-size-by-job-type
//   - HVAC margins (57% service, 40% replacement): Profitability Partners,
//     200+ P&Ls reviewed under PE underwriting at Apex Service Partners.
//     https://profitabilitypartners.io/hvac-profit-margins/
//   - Roofing close 28%: ProLine benchmark (~27% large-shop)
//     https://useproline.com/what-is-a-good-closing-rate-in-roofing-sales/
//   - Roofing tickets: storm/insurance-market baseline. National retail
//     averages are lower (~$1,150 repair / ~$13,000 replacement per Angi +
//     Modernize 2026 data) — defaults reflect insurance-claim work.
//   - Roofing margins (57% repair, 38% replacement): Profitability Partners,
//     same P&L dataset, $2M–$30M roofing companies.
//     https://profitabilitypartners.io/roofing-profit-margins/
//   - General home-services booking 42%: ServiceTitan 2022 all-trades average.
//   - General home-services margins (55% / 38%): Build-Folio + NAHB
//     remodeling benchmarks, inferred from same labor-vs-materials pattern.
//     https://build-folio.com/profit-margins/
export const TRADES: Record<TradeId, TradeConfig> = {
  hvac: {
    label: "HVAC",
    monthlyLeads: 400,
    bookingRate: 0.46,
    smallTicket: 300,
    bigTicket: 9200,
    bigTicketMix: 0.05,
    smallMargin: 0.50,
    bigMargin: 0.50,
    pastCustomers: 4800,
    planMembersPct: 0.15,
    planFeeAnnual: 219,
    smallLabel: "Avg service ticket",
    bigLabel: "Avg system replacement",
    bigShareLabel: "Replacement share of jobs",
    planNoun: "Maintenance plans",
  },
  roofing: {
    label: "Roofing",
    monthlyLeads: 95,
    bookingRate: 0.28,
    smallTicket: 1850,
    bigTicket: 18500,
    bigTicketMix: 0.55,
    smallMargin: 0.57,
    bigMargin: 0.38,
    pastCustomers: 3200,
    planMembersPct: 0.04,
    planFeeAnnual: 220,
    smallLabel: "Avg repair ticket",
    bigLabel: "Avg replacement",
    bigShareLabel: "Replacement share of jobs",
    planNoun: "Roof-care plans",
  },
  general: {
    label: "General home-services",
    monthlyLeads: 105,
    bookingRate: 0.42,
    smallTicket: 480,
    bigTicket: 4200,
    bigTicketMix: 0.20,
    smallMargin: 0.55,
    bigMargin: 0.38,
    pastCustomers: 5500,
    planMembersPct: 0.08,
    planFeeAnnual: 245,
    smallLabel: "Avg small-job ticket",
    bigLabel: "Avg large-job ticket",
    bigShareLabel: "Large-job share of jobs",
    planNoun: "Service plans",
  },
};

// Mode constants. Mix of published sources and Connectors deployment data:
//   - leakRate (% of inbound calls missed today): the published range across
//     home-services-focused call-tracking studies is wide because the population
//     each study draws from is different. Three modes are calibrated against
//     that range.
//
//     Conservative — 0.20. Floor. CallRail's home-services data shows ~14%
//     unanswered; bumped to 20% to correct for survivor bias (CallRail's
//     dataset over-represents shops with tracking already installed, which
//     skews more sophisticated than the median small shop). Frames as "well-
//     run shop with decent business-hours coverage and basic after-hours
//     voicemail." Below this is hard to defend.
//
//     Research — 0.35. The honest middle. Sits between Invoca's 2025 Home
//     Services 27% baseline (60M-call dataset) and the small-shop weighted
//     math of ~52%. Accounts for Florida-specific drag: year-round AC use
//     drives more after-hours/weekend call volume than the national average,
//     and most small shops have weak after-hours coverage. This is the
//     defensible number to pitch with.
//
//     Aggressive — 0.55. Ceiling. Aligned with 411 Locals' 62% home-services
//     finding and Contractor in Charge's 27-62% reported range. Represents
//     the owner-operator running 2-3 trucks on a cell-phone-only setup in
//     peak season. Defensible but only with the weighted math to back it up.
//
//     https://www.invoca.com/report/the-invoca-call-conversion-benchmarks-report-home-services-2025
//     https://www.callrail.com/
//     https://www.411locals.com/
//     https://contractorincharge.com/
//   - recoveryRate (% of missed calls now answered live by AI): set to 100%.
//     The AI agent literally picks up every inbound call — there are no more
//     misses. Retell's published case data backs this: deployments drop call
//     abandonment from 12.4% to 2.8%, and Connectors' own deployments target
//     0% missed. The previous 40% reflected a "callback playbook" mental model
//     that doesn't apply to a 24/7 AI front office.
//     https://www.retellai.com/blog/how-ai-voice-agents-reduce-call-abandonment
//   - noShowRate (% of booked appointments where customer no-shows or
//     cancels last-minute): 15% conservative / 20% aggressive. Sourced from
//     Allied Emergency Services' 2026 Roofing Sales KPI Guide (sit rate 60-85%
//     implies no-show 15-40%) and the PMC systematic review of 29
//     appointment-reminder studies (23.1% median baseline across verticals).
//     https://www.news.alliedemergencyservices.com/roofing-sales-kpis-leads-inspections-close-rate-avg-job-size-2026-guide/
//     https://pmc.ncbi.nlm.nih.gov/articles/PMC3188816/
//   - rebookLift (% of no-shows the AI rebooks before they go cold): operator
//     estimate, 25% conservative / 40% aggressive. Motivated by cross-vertical
//     automated rebook data from medical/dental appointment systems
//     (OmniMD industry-observed range 40-50% for multi-channel automated;
//     conservative chosen well below to absorb home-services-specific drag).
//     No peer-reviewed home-services-specific study exists.
//   - attachRate (% of new customers who sign up for a maintenance plan at
//     job close): operator estimate. No peer-reviewed at-close attach study
//     exists for residential home services. Industry baseline without a
//     mandatory at-close pitch is 10-15% (research = 12%). Operators with a
//     strong mandatory at-close script + financing reach 25-30% (aggressive =
//     28%). Conservative (5%) is the floor: what if the AI's pitch barely
//     works. (ServiceTitan's separate 20-30% benchmark refers to service-
//     agreement REVENUE as a share of total HVAC revenue — a stock metric,
//     not at-close attach. Don't conflate.)
//     https://www.servicetitan.com/blog/how-to-sell-hvac-maintenance-contracts-service-agreements
//   - reachableRate (% of past customers reachable via phone OR email):
//     ZeroBounce email-decay data (~23%/yr) + carrier postpaid churn data
//     (~11%/yr) — over a 3–5 year window, ~45% of contacts survive on the
//     conservative end (5-yr-old list), ~58% on the aggressive end (3-yr-old
//     list). Phone numbers are stickier than email, so the union of phone-OR-
//     email rescues a meaningful slice that email-only decay would miss.
//     https://www.zerobounce.net/email-list-decay
//   - reactivateRate: Connectors operator estimate from live deployments.
//     No public home-services-specific benchmark exists.
export const MODES: Record<ModeId, ModeConfig> = {
  conservative: {
    label: "Conservative",
    leakRate: 0.20,
    recoveryRate: 1.0,
    noShowRate: 0.05,
    rebookLift: 0.10,
    attachRate: 0.05,
    reactivateRate: 0.03,
    reachableRate: 0.40,
    yr2Growth: 1.05,
    yr3Growth: 1.10,
  },
  research: {
    label: "Research",
    leakRate: 0.35,
    recoveryRate: 1.0,
    noShowRate: 0.15,
    rebookLift: 0.25,
    attachRate: 0.12,
    reactivateRate: 0.045,
    reachableRate: 0.45,
    yr2Growth: 1.08,
    yr3Growth: 1.14,
  },
  aggressive: {
    label: "Aggressive",
    leakRate: 0.55,
    recoveryRate: 1.0,
    noShowRate: 0.20,
    rebookLift: 0.40,
    attachRate: 0.28,
    reactivateRate: 0.07,
    reachableRate: 0.58,
    yr2Growth: 1.12,
    yr3Growth: 1.22,
  },
};

export function defaultInputsFor(
  tradeId: TradeId,
  mode: ModeId = "research"
): Inputs {
  const t = TRADES[tradeId];
  return {
    trade: tradeId,
    mode,
    monthlyLeads: t.monthlyLeads,
    bookingRate: t.bookingRate,
    smallTicket: t.smallTicket,
    bigTicket: t.bigTicket,
    bigTicketMix: t.bigTicketMix,
    pastCustomers: t.pastCustomers,
    planMembersPct: t.planMembersPct,
    planFeeAnnual: t.planFeeAnnual,
  };
}

export function calculate(inputs: Inputs): CalcResult {
  const t = TRADES[inputs.trade] || TRADES.hvac;
  const m = MODES[inputs.mode] || MODES.conservative;

  // Roofing doesn't have a subscription maintenance-plan product the way
  // HVAC and general home services do. Pillar 3 is omitted for roofing.
  const hasPlanPillar = inputs.trade !== "roofing";

  const annualLeads = inputs.monthlyLeads * 12;
  // Two parallel tracks: revenue (headline number prospects see) and profit
  // (gross margin applied, the honest underline). Pillar 3 plan fees still
  // cost labor to service (semi-annual tune-ups), so we apply the small-job
  // margin to plan revenue too.
  const blendedTicket =
    inputs.smallTicket * (1 - inputs.bigTicketMix) +
    inputs.bigTicket * inputs.bigTicketMix;
  const blendedProfit =
    inputs.smallTicket * t.smallMargin * (1 - inputs.bigTicketMix) +
    inputs.bigTicket * t.bigMargin * inputs.bigTicketMix;

  // --- Pillar 1 · Always-Open Front Office ---
  // Pool: the 27% of calls that go to voicemail / ring out today.
  // With AI, 100% of those get answered live → close at the standard rate.
  const p1MissedCalls = annualLeads * m.leakRate;
  const p1NewlyAnswered = p1MissedCalls * m.recoveryRate;
  const p1NewCustomers = p1NewlyAnswered * inputs.bookingRate;
  const p1Revenue = p1NewCustomers * blendedTicket;
  const p1Profit = p1NewCustomers * blendedProfit;

  // --- Pillar 2 · Show-Up Rescue ---
  // Pool: customers who already book today (the 73% who reach you), but
  // ~15-20% no-show or cancel last minute. The AI's automated rebook flow
  // (same-day SMS, next-day callback, persistent reactivation) saves 25-40%
  // of that no-show pool that would otherwise just leak out. Non-overlapping
  // with Pillar 1: P1 captures new customers the AI books; P2 rescues already-
  // booked customers who would have ghosted.
  const p2BookedBaseline = annualLeads * (1 - m.leakRate) * inputs.bookingRate;
  const p2NoShows = p2BookedBaseline * m.noShowRate;
  const p2Rescued = p2NoShows * m.rebookLift;
  const p2Revenue = p2Rescued * blendedTicket;
  const p2Profit = p2Rescued * blendedProfit;

  // --- Pillar 3 · Plan attach (skipped for roofing) ---
  // Eligible = every new customer who books this year: P1 captures (missed-
  // calls now answered) + P2 baseline booked customers. The AI pitches the
  // plan at job close to each one. New customers by definition aren't already
  // on a plan.
  const p3EligibleNew = hasPlanPillar
    ? p1NewCustomers + p2BookedBaseline
    : 0;
  const p3Attached = hasPlanPillar ? p3EligibleNew * m.attachRate : 0;
  const p3Revenue = hasPlanPillar ? p3Attached * inputs.planFeeAnnual : 0;
  // Plan fees still cost labor + parts to service (typically 2 tune-ups/yr).
  // Apply the trade's small-job margin as a defensible proxy.
  const p3Profit = hasPlanPillar ? p3Revenue * t.smallMargin : 0;

  // --- Pillar 4 · Database reactivation ---
  // Pool: past customers in the CRM, excluding active plan members (who are
  // already engaged, not dormant). ZeroBounce email-decay + carrier churn
  // data: ~45% reachable on a 5-yr-old list (phone OR email), ~58% on 3-yr.
  const p4Dormant = inputs.pastCustomers * (1 - inputs.planMembersPct);
  const p4Reachable = p4Dormant * m.reachableRate;
  const p4Reactivated = p4Reachable * m.reactivateRate;
  const p4Revenue = p4Reactivated * blendedTicket;
  const p4Profit = p4Reactivated * blendedProfit;

  const year1 = p1Revenue + p2Revenue + p3Revenue + p4Revenue;
  const year1Profit = p1Profit + p2Profit + p3Profit + p4Profit;

  // Steady-state — efficiency compounds + plan ticket-lift kicks in (plan
  // contributions are 0 when hasPlanPillar is false, so roofing's year2/year3
  // come purely from organic growth on year1).
  const planLiftFactor = 1.15;
  const year2 =
    year1 * m.yr2Growth +
    p3Attached * inputs.planFeeAnnual * 0.35 +
    p3Attached * blendedTicket * 0.18 * planLiftFactor;
  const year3 =
    year1 * m.yr3Growth +
    p3Attached * inputs.planFeeAnnual * 0.55 +
    p3Attached * blendedTicket * 0.30 * planLiftFactor;
  const year2Profit =
    year1Profit * m.yr2Growth +
    p3Attached * inputs.planFeeAnnual * 0.35 * t.smallMargin +
    p3Attached * blendedProfit * 0.18 * planLiftFactor;
  const year3Profit =
    year1Profit * m.yr3Growth +
    p3Attached * inputs.planFeeAnnual * 0.55 * t.smallMargin +
    p3Attached * blendedProfit * 0.30 * planLiftFactor;
  const steadyAnnual = (year2 + year3) / 2;
  const steadyAnnualProfit = (year2Profit + year3Profit) / 2;
  const threeYearTotal = year1 + year2 + year3;
  const threeYearTotalProfit = year1Profit + year2Profit + year3Profit;

  // Long-horizon — 2.5% annual real growth on steady-state
  const projectCumulative = (years: number, growthRate = 0.025): number => {
    let total = year1;
    if (years >= 2) total += year2;
    if (years >= 3) total += year3;
    if (years <= 3) return total;
    const n = years - 3;
    const r = 1 + growthRate;
    total += (steadyAnnual * (Math.pow(r, n) - 1)) / growthRate;
    return total;
  };

  const tenYearTotal = projectCumulative(10);
  const twentyYearTotal = projectCumulative(20);
  const thirtyYearTotal = projectCumulative(30);

  const projectCumulativeProfit = (years: number, growthRate = 0.025): number => {
    let total = year1Profit;
    if (years >= 2) total += year2Profit;
    if (years >= 3) total += year3Profit;
    if (years <= 3) return total;
    const n = years - 3;
    const r = 1 + growthRate;
    total += (steadyAnnualProfit * (Math.pow(r, n) - 1)) / growthRate;
    return total;
  };

  const tenYearTotalProfit = projectCumulativeProfit(10);
  const twentyYearTotalProfit = projectCumulativeProfit(20);
  const thirtyYearTotalProfit = projectCumulativeProfit(30);

  const monthlyAnswered = Math.round(inputs.monthlyLeads * (1 - m.leakRate));
  const monthlyMissed = inputs.monthlyLeads - monthlyAnswered;

  const pillars: PillarResult[] = [
    {
      id: "p1",
      eyebrow: "Pillar 01",
      title: "Never Miss a Call",
      oneliner:
        "August Saturday, 95 out, the AC just died. They call you. You're on a job. It goes to voicemail. Riley picks up every one of those calls live.",
      revenue: p1Revenue,
      profit: p1Profit,
      rows: [
        { label: "Inbound leads a year", math: `${inputs.monthlyLeads}/month`, value: count(annualLeads) },
        { label: `× ${pct(m.leakRate)} you miss today (Invoca, 60M-call dataset)`, math: "", value: `${count(p1MissedCalls)} calls/yr` },
        { label: `× ${pct(m.recoveryRate)} the AI now answers live`, math: "", value: `${count(p1NewlyAnswered)} calls/yr` },
        { label: `× ${pct(inputs.bookingRate)} close rate on those calls`, math: "", value: `${count(p1NewCustomers)} new customers` },
        { label: `× ${money(blendedTicket)} average ticket`, math: "", value: money(p1Revenue), strong: true },
        { label: `Added profit (${pct(blendedProfit / blendedTicket)} blended margin)`, math: "", value: money(p1Profit), dim: true },
      ],
      footer: `Today you answer ${monthlyAnswered} of every ${inputs.monthlyLeads} calls. Your AI teammate answers the ${monthlyMissed} that you miss. At your ${pct(inputs.bookingRate)} close rate, that's ${count(p1NewCustomers)} new customers booked by year-end. 85% of callers who hit voicemail never call back, and 62% dial the next contractor on the list within the hour (Invoca, 411 Locals).`,
    },
    {
      id: "p2",
      eyebrow: "Pillar 02",
      title: "No-Show Rescue",
      oneliner: `About ${pct(m.noShowRate)} of booked service calls no-show or cancel before the truck rolls. Diagnostic fee gone, route gone. Riley works the rebook until they're back on the calendar.`,
      revenue: p2Revenue,
      profit: p2Profit,
      rows: [
        { label: "Booked customers a year", math: `${count(annualLeads)} leads × ${pct(inputs.bookingRate)} close`, value: `${count(p2BookedBaseline)} bookings` },
        { label: `× ${pct(m.noShowRate)} no-show or cancel today`, math: "Allied Emergency 2026 + PMC 29-study median", value: `${count(p2NoShows)} no-shows/yr` },
        { label: `× ${pct(m.rebookLift)} the AI rebooks before they go cold`, math: "", value: `${count(p2Rescued)} customers/yr` },
        { label: `× ${money(blendedTicket)} average ticket`, math: "", value: money(p2Revenue), strong: true },
        { label: `Added profit (${pct(blendedProfit / blendedTicket)} blended margin)`, math: "", value: money(p2Profit), dim: true },
      ],
      footer: `Today, when a customer no-shows, most contractors call once and move on. Your AI teammate sends a same-day SMS, a next-day callback, and a "still want it?" check until they rebook or opt out.`,
    },
  ];

  if (hasPlanPillar) {
    const p3PlanNoun = t.planNoun.toLowerCase();
    pillars.push({
      id: "p3",
      eyebrow: "Pillar 03",
      title: "Set It and Forget It",
      oneliner: `Every new customer needs a ${p3PlanNoun.replace(/s$/, "")} and nobody hears the pitch. At job close Riley does, every time, and about ${pct(m.attachRate)} sign up on the spot. Recurring revenue that compounds for years.`,
      revenue: p3Revenue,
      profit: p3Profit,
      featured: true,
      rows: [
        { label: "All your new customers this year", math: "(every one hears the pitch)", value: `${count(p3EligibleNew)} customers` },
        { label: `× ${pct(m.attachRate)} sign up at job close`, math: "FieldEdge: 10–15% without script / 25–30% with mandatory script", value: `${count(p3Attached)} plan members` },
        { label: `× ${money(inputs.planFeeAnnual)} annual plan fee`, math: "", value: money(p3Revenue), strong: true },
        { label: `Added profit (${pct(t.smallMargin)} margin after the tune-up tech)`, math: "", value: money(p3Profit), dim: true },
        { label: "Plan members spend more on tickets too. That compounds in Years 2 and 3.", math: "", value: null, dim: true },
      ],
      footer: `This is the moat. A new install is a one-time check; a plan member pays you twice a year for a decade. Years 2 and 3 of the math above already include the compound from this pillar.`,
    });
  }

  pillars.push({
    id: "p4",
    eyebrow: "Pillar 04",
    title: "Wake the Dead",
    oneliner: `${count(inputs.pastCustomers)} past install and service customers in your CRM. Most haven't heard from you since the truck pulled away. Riley works them, one batch at a time.`,
    revenue: p4Revenue,
    profit: p4Profit,
    rows: [
      { label: "Past customers in your CRM", math: "", value: `${count(inputs.pastCustomers)} contacts` },
      { label: `− ${pct(inputs.planMembersPct)} already on a plan (skip, already engaged)`, math: "", value: `${count(p4Dormant)} dormant` },
      { label: `× ${pct(m.reachableRate)} still reachable (phone or email)`, math: "ZeroBounce + carrier churn data", value: `${count(p4Reachable)} reachable` },
      { label: `× ${pct(m.reactivateRate)} book again when worked`, math: "cross-vertical automated-rebook benchmark", value: `${count(p4Reactivated)} customers/yr` },
      { label: `× ${money(blendedTicket)} average ticket`, math: "", value: money(p4Revenue), strong: true },
      { label: `Added profit (${pct(blendedProfit / blendedTicket)} blended margin)`, math: "", value: money(p4Profit), dim: true },
    ],
    footer: `Most contractors leave this database completely cold. Even reaching 5% of dormant past customers a year is real money.`,
  });

  // Renumber eyebrows by visible position. Roofing skips P3, so it reads
  // 01/02/03 (not 01/02/04) once we re-emit.
  pillars.forEach((p, i) => {
    p.eyebrow = `Pillar ${String(i + 1).padStart(2, "0")}`;
  });

  return {
    inputs,
    trade: t,
    mode: m,
    derived: {
      annualLeads,
      blendedTicket,
      blendedProfit,
      monthlyMissed,
      p2Rescued: Math.round(p2Rescued),
      p3Attached: Math.round(p3Attached),
      p4Reactivated: Math.round(p4Reactivated),
    },
    year1,
    steadyAnnual,
    threeYearTotal,
    year2,
    year3,
    tenYearTotal,
    twentyYearTotal,
    thirtyYearTotal,
    year1Profit,
    steadyAnnualProfit,
    threeYearTotalProfit,
    year2Profit,
    year3Profit,
    tenYearTotalProfit,
    twentyYearTotalProfit,
    thirtyYearTotalProfit,
    pillars,
  };
}
