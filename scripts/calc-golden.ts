/**
 * Smoke test for lib/roi/calc.ts (Recoverable Revenue engine).
 *
 * Run with: npx tsx scripts/calc-golden.ts
 *
 * Sanity-checks the HVAC defaults under Conservative + Aggressive modes:
 *   - All 4 pillars produce positive numbers
 *   - Year1 + 2 × steady ≈ threeYearTotal (rounding tolerance)
 *   - Aggressive > Conservative on every pillar
 *   - 10/20/30-year cumulative monotonically increasing
 *   - Switching trades doesn't crash
 */

import {
  calculate,
  defaultInputsFor,
  TRADES,
  type TradeId,
} from "../lib/roi/calc";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

const failures: string[] = [];
const assert = (cond: boolean, msg: string) => {
  if (!cond) failures.push(msg);
};

// 1. HVAC Conservative — print breakdown
console.log("\nHVAC · Conservative");
console.log("─".repeat(60));
{
  const inputs = defaultInputsFor("hvac", "conservative");
  const r = calculate(inputs);
  for (const p of r.pillars) {
    console.log(`  ${p.eyebrow}: ${p.title.padEnd(36)} ${fmt(p.revenue).padStart(12)}`);
    assert(p.revenue > 0, `${p.id} should be positive`);
  }
  console.log("─".repeat(60));
  console.log(`  Year 1:                    ${fmt(r.year1).padStart(12)}`);
  console.log(`  Year 2:                    ${fmt(r.year2).padStart(12)}`);
  console.log(`  Year 3:                    ${fmt(r.year3).padStart(12)}`);
  console.log(`  Steady-state annual:       ${fmt(r.steadyAnnual).padStart(12)}`);
  console.log(`  3-year cumulative:         ${fmt(r.threeYearTotal).padStart(12)}`);
  console.log(`  10-year cumulative:        ${fmt(r.tenYearTotal).padStart(12)}`);
  console.log(`  20-year cumulative:        ${fmt(r.twentyYearTotal).padStart(12)}`);
  console.log(`  30-year cumulative:        ${fmt(r.thirtyYearTotal).padStart(12)}`);

  const pillarSum = r.pillars.reduce((s, p) => s + p.revenue, 0);
  assert(Math.abs(pillarSum - r.year1) < 1, "pillar sum should equal year1");
  assert(Math.abs(r.year1 + r.year2 + r.year3 - r.threeYearTotal) < 1, "year1+y2+y3 ≈ 3yr total");
  assert(r.tenYearTotal < r.twentyYearTotal, "10yr < 20yr");
  assert(r.twentyYearTotal < r.thirtyYearTotal, "20yr < 30yr");
  assert(r.tenYearTotal > r.threeYearTotal, "10yr > 3yr");
}

// 2. HVAC Conservative vs Aggressive — every pillar should grow
console.log("\nHVAC · Conservative vs Aggressive");
console.log("─".repeat(60));
{
  const consInputs = defaultInputsFor("hvac", "conservative");
  const aggInputs = defaultInputsFor("hvac", "aggressive");
  const c = calculate(consInputs);
  const a = calculate(aggInputs);
  for (let i = 0; i < 4; i++) {
    const cv = c.pillars[i].revenue;
    const av = a.pillars[i].revenue;
    console.log(`  ${c.pillars[i].eyebrow}: ${fmt(cv).padStart(12)} → ${fmt(av).padStart(12)}`);
    assert(av > cv, `Aggressive ${c.pillars[i].id} should exceed Conservative`);
  }
  console.log(`  3-year total: ${fmt(c.threeYearTotal).padStart(14)} → ${fmt(a.threeYearTotal).padStart(14)}`);
  assert(a.threeYearTotal > c.threeYearTotal, "Aggressive 3yr > Conservative 3yr");
}

// 3. All trades render without crashing
console.log("\nAll trades (Conservative)");
console.log("─".repeat(60));
for (const id of Object.keys(TRADES) as TradeId[]) {
  const r = calculate(defaultInputsFor(id, "conservative"));
  console.log(`  ${TRADES[id].label.padEnd(25)} 3yr ${fmt(r.threeYearTotal).padStart(14)}  steady ${fmt(r.steadyAnnual).padStart(12)}`);
  assert(r.year1 > 0, `${id} year1 should be positive`);
  assert(r.threeYearTotal > r.year1, `${id} 3yr should exceed year1`);
}

console.log();
if (failures.length > 0) {
  console.error(`❌ ${failures.length} assertion(s) failed:`);
  for (const f of failures) console.error(`   - ${f}`);
  process.exit(1);
}
console.log("✓ all assertions passed");
