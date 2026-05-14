export const money = (n: number): string =>
  `$${Math.round(n).toLocaleString("en-US")}`;

export const moneyCompact = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return money(n);
};

export const pct = (n: number): string => {
  const p = n * 100;
  return Number.isInteger(p) ? `${p}%` : `${p.toFixed(1)}%`;
};

export const count = (n: number): string =>
  Math.round(n).toLocaleString("en-US");

export const parseNum = (raw: string): number => {
  if (raw == null) return 0;
  const cleaned = String(raw).replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};
