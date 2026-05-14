"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

type DemoStep = { time: string; label: string; detail: string };
const DEMO_STEPS: DemoStep[] = [
  { time: "9:47 PM", label: "Missed call", detail: "Homeowner tries you. You're wrapping a job." },
  { time: "+8 sec", label: "Riley answers the call", detail: "AI receptionist picks up before they hang up. Sounds like a person, handles it like one." },
  { time: "+2 min", label: "Inspection booked", detail: "Riley qualifies the job and drops it on your calendar." },
  { time: "Day +1", label: "Estimate sent", detail: "Reminders, follow-ups, no-show recovery. All automatic." },
];

const PHONE_SCENES: ReactNode[] = [
  // 0: Missed
  <div key="s0" className="scene is-active">
    <span className="scene__pill scene__missed-pill">9:47 PM · Missed</span>
    <div className="bubble bubble--meta">No answer</div>
  </div>,
  // 1: Riley on the call
  <div key="s1" className="scene is-active">
    <span className="scene__pill">9:47 PM · Riley on the call</span>
    <div className="bubble bubble--in">St. Petersburg Roofing, this is Riley. How can I help?</div>
    <div className="bubble bubble--out">There&apos;s a leak in the kitchen. I need someone out tomorrow.</div>
    <div className="bubble bubble--in">Got it. What works better, morning or afternoon?</div>
    <div className="bubble bubble--out">Afternoon.</div>
    <div className="bubble bubble--in">Wednesday 2:30, then. What&apos;s the address?</div>
  </div>,
  // 2: Booked
  <div key="s2" className="scene is-active">
    <span className="scene__pill">9:49 PM · Booked</span>
    <div className="confirm-card">
      <div className="confirm-card__row"><span>Customer</span><span>Janet M.</span></div>
      <div className="confirm-card__divider" />
      <div className="confirm-card__row"><span>When</span><span>Wed · 2:30 PM</span></div>
      <div className="confirm-card__divider" />
      <div className="confirm-card__row"><span>Address</span><span>421 Oak St.</span></div>
    </div>
    <div className="bubble bubble--meta" style={{ marginTop: 12 }}>Confirmed by SMS + email</div>
  </div>,
  // 3: Estimate
  <div key="s3" className="scene is-active">
    <span className="scene__pill">Day +1 · Estimate sent</span>
    <div className="bubble bubble--out">Estimate: $14,200. Quote attached.</div>
    <div className="bubble bubble--in">Looks good. Ready to schedule.</div>
    <div className="bubble bubble--meta">Auto follow-up #2 ✓</div>
  </div>,
];

const PIPELINE = [
  { num: "01", title: "New Lead", meta: "<60 sec response" },
  { num: "02", title: "Inspection Scheduled", meta: "Wed · 2:30 PM" },
  { num: "03", title: "Estimate Sent", meta: "Follow-up active" },
  { num: "04", title: "Approved", meta: "Closed + logged" },
];

export function Demo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % DEMO_STEPS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        setPlaying(e.isIntersecting);
      },
      { threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const progress = ((step + 1) / DEMO_STEPS.length) * 100;

  return (
    <section id="demo" className="demo section" ref={ref}>
      <div className="section__inner">
        <Reveal className="demo__head">
          <p className="demo__eyebrow">How it actually works</p>
          <h2 className="demo__title">One missed call. One booked job.</h2>
          <p className="demo__sub">Riley answers. Qualifies. Closes the appointment. Whether you&apos;re on the roof, at lunch, or home with the family.</p>
        </Reveal>

        <Reveal>
          <div className="demo__stage">
            <div className="timeline">
              {DEMO_STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`timeline__step ${
                    i === step ? "is-active" : i < step ? "is-done" : ""
                  }`}
                  onClick={() => {
                    setStep(i);
                    setPlaying(false);
                  }}
                >
                  <div className="timeline__dot" />
                  <div className="timeline__time">{s.time}</div>
                  <div className="timeline__label">{s.label}</div>
                  <div className="timeline__detail">{s.detail}</div>
                </div>
              ))}
            </div>

            <div className="demo__view">
              <div className="demo-phone">
                <div className="demo-phone__notch" />
                <div className="demo-phone__screen">
                  <div className="demo-phone__time">9:47 PM</div>
                  {PHONE_SCENES[step]}
                </div>
              </div>

              <div className="pipeline">
                <div className="pipeline__head">Pipeline · Live</div>
                {PIPELINE.map((p, i) => (
                  <div
                    key={i}
                    className={`pcard ${
                      i === step ? "is-active" : i < step ? "is-done" : ""
                    }`}
                  >
                    <div className="pcard__left">
                      <div className="pcard__num">{p.num}</div>
                      <div>
                        <div className="pcard__title">{p.title}</div>
                        <div className="pcard__meta">{p.meta}</div>
                      </div>
                    </div>
                    <span className="pcard__check">
                      <Icon name="check" size={18} strokeWidth={2.5} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="demo__controls">
          <button
            type="button"
            className="demo__playbtn"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
          >
            <Icon name={playing ? "pause" : "play"} size={18} />
          </button>
          <div className="demo__progress">
            <div className="demo__progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <span className="demo__caption">{DEMO_STEPS[step].time}</span>
        </div>
      </div>
    </section>
  );
}
