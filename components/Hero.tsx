"use client";

import { useEffect, useRef, useState } from "react";
import { BookCallLink } from "./BookCallLink";
import { Icon } from "./Icon";

type Step = { at: number; action: "show" | "hide" | "reset"; key?: string };
const SCRIPT: Step[] = [
  { at: 200, action: "show", key: "missed" },
  { at: 1400, action: "show", key: "answered" },
  { at: 2200, action: "show", key: "typing-1" },
  { at: 3100, action: "hide", key: "typing-1" },
  { at: 3100, action: "show", key: "bubble-1" },
  { at: 4300, action: "show", key: "typing-2" },
  { at: 5400, action: "hide", key: "typing-2" },
  { at: 5400, action: "show", key: "bubble-2" },
  { at: 6700, action: "show", key: "typing-3" },
  { at: 7700, action: "hide", key: "typing-3" },
  { at: 7700, action: "show", key: "bubble-3" },
  { at: 9000, action: "show", key: "typing-4" },
  { at: 9900, action: "hide", key: "typing-4" },
  { at: 9900, action: "show", key: "bubble-4" },
  { at: 11200, action: "show", key: "typing-5" },
  { at: 12200, action: "hide", key: "typing-5" },
  { at: 12200, action: "show", key: "bubble-5" },
  { at: 13400, action: "show", key: "booked-chip" },
  { at: 19400, action: "reset" },
];
const LOOP_MS = 19500;
const FADE_START = 18400;

const fmtTimer = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

function setsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  return Array.from(a).every((v) => b.has(v));
}

export function Hero() {
  const [active, setActive] = useState<Set<string>>(new Set());
  const [callTimer, setCallTimer] = useState(38);
  const [isFading, setIsFading] = useState(false);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = (now - startRef.current) % LOOP_MS;
      const next = new Set<string>();
      for (const step of SCRIPT) {
        if (step.action === "reset" || !step.key) continue;
        if (t < step.at) continue;
        if (step.action === "show") next.add(step.key);
        else next.delete(step.key);
      }
      setActive((prev) => (setsEqual(prev, next) ? prev : next));
      const fading = t >= FADE_START;
      setIsFading((prev) => (prev === fading ? prev : fading));
      const seconds = 38 + Math.floor((t - 1400) / 1000);
      setCallTimer(t > 1400 ? Math.max(38, Math.min(seconds, 95)) : 38);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <header id="top" className="hero section--dark">
      <div className="hero__inner">
        <div>
          <div className="hero__eyebrow">
            <span>Built in St. Petersburg, FL</span>
          </div>
          <h1>
            <span>We answer 95% of your HVAC calls</span>
            <span className="accent">in 8 seconds, or your money back.</span>
          </h1>
          <p className="hero__sub">
            In a typical HVAC shop, 1 in 5 calls hits voicemail. Each one is a job going to the next contractor. We pick up every one.
          </p>
          <div className="hero__ctas">
            <BookCallLink className="btn btn--primary btn--lg">
              Book a Call
              <Icon name="arrow" size={18} />
            </BookCallLink>
            <a href="#demo" className="hero__ctas-link">Watch the 12-second demo</a>
          </div>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className={`phone-wrap${isFading ? " is-fading-out" : ""}`}>
            <div className="phone">
              <div className="phone__notch" />
              <div className="phone__screen">
                <div className="phone__time">9:47 PM · Tuesday</div>

                {active.has("missed") && (
                  <div className="phone__call phone__call--missed phone__step">
                    <div className="phone__avatar phone__avatar--missed">JM</div>
                    <div className="phone__call-info">
                      <div className="phone__call-name">Janet M.</div>
                      <div className="phone__call-meta">Missed · 9:47 PM</div>
                    </div>
                    <span className="phone__call-status phone__call-status--missed">Missed</span>
                  </div>
                )}

                {active.has("answered") && (
                  <div className="phone__call phone__call--answered phone__step">
                    <div className="phone__avatar">R</div>
                    <div className="phone__call-info">
                      <div className="phone__call-name">Riley · AI receptionist</div>
                      <div className="phone__call-meta">On call · {fmtTimer(callTimer)}</div>
                    </div>
                    <span className="phone__call-status phone__call-status--answered">
                      <span className="phone__live-dot" />Live
                    </span>
                  </div>
                )}

                {active.has("typing-1") && (
                  <div className="phone__typing phone__step" data-from="riley">
                    <span /><span /><span />
                  </div>
                )}
                {active.has("bubble-1") && (
                  <div className="phone__bubble phone__step">
                    St. Pete HVAC, this is Riley. How can I help?
                  </div>
                )}

                {active.has("typing-2") && (
                  <div className="phone__typing phone__typing--out phone__step" data-from="janet">
                    <span /><span /><span />
                  </div>
                )}
                {active.has("bubble-2") && (
                  <div className="phone__bubble phone__bubble--out phone__step">
                    My AC just died and it&apos;s 95 out. I need someone today.
                  </div>
                )}

                {active.has("typing-3") && (
                  <div className="phone__typing phone__step" data-from="riley">
                    <span /><span /><span />
                  </div>
                )}
                {active.has("bubble-3") && (
                  <div className="phone__bubble phone__step">
                    Got it. Morning or afternoon?
                  </div>
                )}

                {active.has("typing-4") && (
                  <div className="phone__typing phone__typing--out phone__step" data-from="janet">
                    <span /><span /><span />
                  </div>
                )}
                {active.has("bubble-4") && (
                  <div className="phone__bubble phone__bubble--out phone__step">
                    Tomorrow morning works. 9am?
                  </div>
                )}

                {active.has("typing-5") && (
                  <div className="phone__typing phone__step" data-from="riley">
                    <span /><span /><span />
                  </div>
                )}
                {active.has("bubble-5") && (
                  <div className="phone__bubble phone__bubble--booked phone__step">
                    <span className="phone__booked-tag">
                      <Icon name="check" size={11} strokeWidth={2.5} /> Booked · Wed 9:00 AM
                    </span>
                    You&apos;re all set. Confirmation text headed your way now.
                  </div>
                )}
              </div>
            </div>

            <div className="hero__chip hero__chip--top">
              <div className="hero__chip-icon"><Icon name="bolt" size={18} /></div>
              <div className="hero__chip-text">
                <div className="hero__chip-label">Riley answered in</div>
                <div className="hero__chip-value">8 seconds</div>
              </div>
            </div>
            {active.has("booked-chip") && (
              <div className="hero__chip hero__chip--bottom">
                <div className="hero__chip-icon"><Icon name="calendar" size={18} /></div>
                <div className="hero__chip-text">
                  <div className="hero__chip-label">Booked</div>
                  <div className="hero__chip-value">Wed · 9:00 AM</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
