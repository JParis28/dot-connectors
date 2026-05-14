"use client";

import { useState } from "react";
import type { PillarResult } from "@/lib/roi/calc";
import { money } from "@/lib/roi/format";
import { Icon } from "@/components/Icon";
import { TickingValue } from "./Ticking";

const PILLAR_ICONS = ["phone", "bell", "clipboard", "file-text"] as const;

type Props = {
  pillar: PillarResult;
  index: number;
};

export function PillarCard({ pillar, index }: Props) {
  const [open, setOpen] = useState(false);
  const iconName = PILLAR_ICONS[index] ?? "phone";

  return (
    <article className={`rc-pillar ${open ? "rc-pillar--open" : ""}`}>
      <div className="rc-pillar__head">
        <span className="rc-pillar__icon">
          <Icon name={iconName} size={20} strokeWidth={1.5} />
        </span>
        <div className="rc-pillar__title-block">
          <p className="rc-pillar__eyebrow">{pillar.eyebrow}</p>
          <h3 className="rc-pillar__title">{pillar.title}</h3>
          <p className="rc-pillar__oneliner">{pillar.oneliner}</p>
        </div>
        <div className="rc-pillar__value-block">
          <TickingValue value={money(pillar.revenue)} className="rc-pillar__value tnum" />
          <span className="rc-pillar__value-suffix">/ Year 1</span>
          <span className="rc-pillar__profit tnum">≈ {money(pillar.profit)} profit</span>
        </div>
      </div>

      <div className="rc-pillar__disclosure">
        <div className="rc-pillar__disclosure-inner">
          <div className="rc-pillar__math">
            {pillar.rows.map((row, i) => (
              <div
                key={i}
                className={`rc-math-row ${row.strong ? "rc-math-row--strong" : ""} ${row.dim ? "rc-math-row--dim" : ""}`}
              >
                <span className="rc-math-row__label">
                  {row.label}
                  {row.math ? <em className="rc-math-row__expr">{row.math}</em> : null}
                </span>
                <span className="rc-math-row__value">{row.value ?? ""}</span>
              </div>
            ))}
          </div>
          {pillar.footer ? (
            <p className="rc-pillar__footer">{pillar.footer}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="rc-pillar__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="rc-pillar__toggle-chev">
          <Icon name="chevron-right" size={10} strokeWidth={1.75} />
        </span>
        {open ? "Hide the math" : "Show the math"}
      </button>
    </article>
  );
}
