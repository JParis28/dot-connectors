"use client";

import { useState, type ReactNode } from "react";
import type { Inputs, TradeId, ModeId } from "@/lib/roi/calc";
import { TRADES, MODES } from "@/lib/roi/calc";
import { Icon } from "@/components/Icon";

type FieldProps = {
  label: string;
  help?: string;
  prefix?: string;
  suffix?: string;
  value: number;
  onChange: (n: number) => void;
  full?: boolean;
  format?: "auto" | "comma" | "plain";
};

function Field({ label, help, prefix, suffix, value, onChange, full, format = "auto" }: FieldProps) {
  const [focused, setFocused] = useState(false);
  let display: string;
  if (focused) {
    display = String(value);
  } else if (format === "comma" || (format === "auto" && Math.abs(value) >= 1000)) {
    display = value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  } else {
    display = String(value);
  }

  return (
    <div className={`rc-field ${full ? "rc-field--full" : ""}`}>
      <label className="rc-field__label">
        {label}
        {help ? (
          <span
            className="rc-field__help"
            data-tooltip={help}
            aria-label={help}
            tabIndex={0}
          >
            ?
          </span>
        ) : null}
      </label>
      <div className="rc-field__input-wrap">
        {prefix ? <span className="rc-field__prefix">{prefix}</span> : null}
        <input
          className={`rc-field__input ${prefix ? "rc-field__input--prefixed" : ""} ${suffix ? "rc-field__input--suffixed" : ""}`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={display}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[,\s$]/g, "");
            if (raw === "" || raw === "-") { onChange(0); return; }
            const n = parseFloat(raw);
            if (!Number.isNaN(n)) onChange(n);
          }}
        />
        {suffix ? <span className="rc-field__suffix">{suffix}</span> : null}
      </div>
    </div>
  );
}

type InputGroupProps = {
  title: string;
  defaultOpen?: boolean;
  fullGrid?: boolean;
  children: ReactNode;
};

function InputGroup({ title, defaultOpen = true, fullGrid = false, children }: InputGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rc-group ${open ? "rc-group--open" : ""}`}>
      <button type="button" className="rc-group__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="rc-group__title">{title}</span>
        <span className="rc-group__chev">
          <Icon name="chevron-right" size={10} strokeWidth={1.75} />
        </span>
      </button>
      {open ? (
        <div className={`rc-group__body ${fullGrid ? "rc-group__body--full" : ""}`}>{children}</div>
      ) : null}
    </div>
  );
}

type Props = {
  inputs: Inputs;
  onInput: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void;
  onTrade: (id: TradeId) => void;
  onMode: (id: ModeId) => void;
};

export function InputsPanel({ inputs, onInput, onTrade, onMode }: Props) {
  const trade = TRADES[inputs.trade];

  return (
    <aside className="rc-inputs">
      <div className="rc-inputs__head">
        <p className="rc-inputs__head-label">Your trade</p>
        <div className="rc-seg" role="tablist" aria-label="Trade">
          {(Object.keys(TRADES) as TradeId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={inputs.trade === id}
              className={`rc-seg__btn ${inputs.trade === id ? "rc-seg__btn--active" : ""}`}
              onClick={() => onTrade(id)}
            >
              {id === "general" ? "Home services" : TRADES[id].label}
            </button>
          ))}
        </div>
      </div>

      <div className="rc-mode-row">
        <span className="rc-mode-row__label">Assumptions</span>
        <div className="rc-mode-toggle" role="tablist" aria-label="Mode">
          {(Object.keys(MODES) as ModeId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={inputs.mode === id}
              className={`rc-mode-toggle__btn ${inputs.mode === id ? "rc-mode-toggle__btn--active" : ""}`}
              onClick={() => onMode(id)}
            >
              {MODES[id].label}
            </button>
          ))}
        </div>
      </div>

      <InputGroup title="Lead funnel">
        <Field
          label="Monthly leads"
          help="Calls, forms, DMs combined. Annual = monthly × 12."
          value={inputs.monthlyLeads}
          onChange={(v) => onInput("monthlyLeads", v)}
        />
        <Field
          label="Booking rate"
          help="Of the leads that reach you, what % turn into booked jobs today?"
          suffix="%"
          value={Math.round(inputs.bookingRate * 1000) / 10}
          onChange={(v) => onInput("bookingRate", v / 100)}
        />
      </InputGroup>

      <InputGroup title="Ticket sizes">
        <Field
          label={trade.smallLabel}
          prefix="$"
          value={inputs.smallTicket}
          onChange={(v) => onInput("smallTicket", v)}
        />
        <Field
          label={trade.bigLabel}
          prefix="$"
          value={inputs.bigTicket}
          onChange={(v) => onInput("bigTicket", v)}
        />
        <Field
          full
          label={trade.bigShareLabel}
          help={`Of all your jobs, what % are ${trade.bigLabel.toLowerCase().replace(/^avg /, "")}s (vs. ${trade.smallLabel.toLowerCase().replace(/^avg /, "")}s)?`}
          suffix="%"
          value={Math.round(inputs.bigTicketMix * 1000) / 10}
          onChange={(v) => onInput("bigTicketMix", v / 100)}
        />
      </InputGroup>

      {inputs.trade !== "roofing" ? (
        <InputGroup title={trade.planNoun} defaultOpen={false}>
          <Field
            label="Already on a plan"
            help="Roughly what share of your customer base is already enrolled in a plan today? We use this to estimate how many new jobs are still pitchable."
            suffix="%"
            value={Math.round(inputs.planMembersPct * 1000) / 10}
            onChange={(v) => onInput("planMembersPct", v / 100)}
          />
          <Field
            label="Plan fee (annual)"
            prefix="$"
            value={inputs.planFeeAnnual}
            onChange={(v) => onInput("planFeeAnnual", v)}
          />
        </InputGroup>
      ) : null}

      <InputGroup title="Past customer database" defaultOpen={false} fullGrid>
        <Field
          full
          label="Past customers served"
          help="Total unique customers in your CRM / database. Ballpark is fine."
          value={inputs.pastCustomers}
          onChange={(v) => onInput("pastCustomers", v)}
        />
      </InputGroup>
    </aside>
  );
}
