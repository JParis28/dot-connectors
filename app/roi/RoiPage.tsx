"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculate,
  defaultInputsFor,
  TRADES,
  type CalcResult,
  type Inputs,
  type ModeId,
  type TradeId,
} from "@/lib/roi/calc";
import { InputsPanel } from "./InputsPanel";
import { ResultsPanel } from "./ResultsPanel";

function encodeSnapshot(inputs: Inputs): string {
  try {
    const json = JSON.stringify(inputs);
    return typeof btoa === "function" ? btoa(unescape(encodeURIComponent(json))) : "";
  } catch {
    return "";
  }
}

function decodeSnapshot(raw: string): Inputs | null {
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    const obj = JSON.parse(json) as Partial<Inputs>;
    if (!obj || typeof obj !== "object") return null;
    if (!obj.trade || !(obj.trade in TRADES)) return null;
    if (obj.mode !== "conservative" && obj.mode !== "research" && obj.mode !== "aggressive") return null;
    return { ...defaultInputsFor(obj.trade as TradeId, obj.mode as ModeId), ...obj } as Inputs;
  } catch {
    return null;
  }
}

function PageHeader({ result, embedded }: { result: CalcResult; embedded?: boolean }) {
  const HeadingTag = embedded ? "h2" : "h1";
  return (
    <section className="rc-header">
      <p className="rc-header__eyebrow">Recoverable Revenue Calculator</p>
      <HeadingTag className="rc-header__title">
        The revenue your front office <span className="accent">never gets the chance to catch</span>.
      </HeadingTag>
      <p className="rc-header__sub">
        Drop in your trade and a few figures. We&rsquo;ll show you, line by line, the revenue
        your team can&rsquo;t catch alone, and the added profit underneath it.
      </p>
      <div className="rc-header__meta">
        <span>
          <span className="rc-header__meta-dot" />
          <strong>Trade · {result.trade.label}</strong>
        </span>
        <span>
          <strong>Mode · {result.mode.label} assumptions</strong>
        </span>
        <span>No signup. Numbers stay on this device.</span>
      </div>
    </section>
  );
}

export function RoiPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [inputs, setInputs] = useState<Inputs>(() => defaultInputsFor("hvac", "research"));

  // Rehydrate from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s");
    if (!s) return;
    const decoded = decodeSnapshot(s);
    if (decoded) setInputs(decoded);
  }, []);

  // Sync to URL (replace, no scroll)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const encoded = encodeSnapshot(inputs);
    if (!encoded) return;
    const params = new URLSearchParams(window.location.search);
    params.set("s", encoded);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [inputs]);

  const setInput = useCallback(<K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);
  const setTrade = useCallback((id: TradeId) => {
    setInputs((prev) => defaultInputsFor(id, prev.mode));
  }, []);
  const setMode = useCallback((id: ModeId) => {
    setInputs((prev) => ({ ...prev, mode: id }));
  }, []);

  const result = useMemo(() => calculate(inputs), [inputs]);

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);

  return (
    <div className="rc-page">
      <PageHeader result={result} embedded={embedded} />
      <main className="rc-shell">
        <InputsPanel
          inputs={inputs}
          onInput={setInput}
          onTrade={setTrade}
          onMode={setMode}
        />
        <ResultsPanel result={result} inputs={inputs} onPrint={handlePrint} />
      </main>
    </div>
  );
}
