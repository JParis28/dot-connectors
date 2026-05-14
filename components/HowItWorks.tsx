"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

type Step = { time: string; label: string; detail: string };

const STEPS: Step[] = [
  { time: "9:47 PM", label: "Missed call", detail: "Homeowner's AC just died. Your front office is closed." },
  { time: "+8 sec", label: "Riley answers", detail: "AI receptionist picks up live. Captures the emergency, qualifies the job." },
  { time: "+2 min", label: "Same-day dispatch booked", detail: "Riley slots a tech tomorrow morning. Confirms by text + email." },
  { time: "Day +1", label: "Diagnostic + quote sent", detail: "Tech runs the diagnostic. Repair quote goes out. Follow-up automatic." },
];

const SCENES: ReactNode[] = [
  // 0: Missed
  <div key="s0" className="scene is-active">
    <span className="scene__pill scene__missed-pill">9:47 PM &middot; Missed</span>
    <div className="bubble bubble--meta">No answer</div>
  </div>,
  // 1: Riley on the call
  <div key="s1" className="scene is-active">
    <span className="scene__pill">9:47 PM &middot; Riley on the call</span>
    <div className="bubble bubble--in">St. Pete HVAC, this is Riley. How can I help?</div>
    <div className="bubble bubble--out">My AC just died and it&apos;s 88 in the house. Can someone come out tomorrow?</div>
    <div className="bubble bubble--in">Yes. I have an 8 to 10 AM window or 1 to 3 PM. Which works?</div>
    <div className="bubble bubble--out">Morning.</div>
    <div className="bubble bubble--in">8 to 10 AM tomorrow, then. What&apos;s the address?</div>
  </div>,
  // 2: Booked
  <div key="s2" className="scene is-active">
    <span className="scene__pill">9:49 PM &middot; Booked</span>
    <div className="confirm-card">
      <div className="confirm-card__row"><span>Customer</span><span>Janet M.</span></div>
      <div className="confirm-card__divider" />
      <div className="confirm-card__row"><span>When</span><span>Tomorrow &middot; 8&ndash;10 AM</span></div>
      <div className="confirm-card__divider" />
      <div className="confirm-card__row"><span>Service</span><span>AC diagnostic ($89)</span></div>
      <div className="confirm-card__divider" />
      <div className="confirm-card__row"><span>Address</span><span>421 Oak St.</span></div>
    </div>
    <div className="bubble bubble--meta" style={{ marginTop: 12 }}>Confirmed by SMS + email</div>
  </div>,
  // 3: Diagnostic + repair quote
  <div key="s3" className="scene is-active">
    <span className="scene__pill">Day +1 &middot; Diagnostic + quote</span>
    <div className="bubble bubble--meta">Diagnostic complete &middot; capacitor + low refrigerant</div>
    <div className="bubble bubble--out">Repair quote: $487. Approve to schedule the fix.</div>
    <div className="bubble bubble--in">Looks good. Approved.</div>
    <div className="bubble bubble--meta">Auto follow-up #2 ✓</div>
  </div>,
];

const PIPELINE = [
  { num: "01", title: "New Lead", meta: "<60 sec response" },
  { num: "02", title: "Dispatch Scheduled", meta: "Tomorrow 8–10 AM" },
  { num: "03", title: "Tech En Route", meta: "Riley confirmed by text" },
  { num: "04", title: "Quote Approved", meta: "Closed + logged" },
];

export function HowItWorks() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => setPlaying(e.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <section id="how" className="how" ref={ref}>
      <div className="section__inner">
        <Reveal>
          <p className="how__eyebrow">How it works</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="how__title">
            Three things happen <span className="accent">every time your front office can&rsquo;t get there.</span>
          </h2>
        </Reveal>
        <ol className="how__steps">
          <Reveal as="li" delay={160} className="how__step">
            <span className="how__step-num" aria-hidden="true">1</span>
            <h3 className="how__step-title">A call comes in.</h3>
            <p className="how__step-body">
              Riley picks up in 8 seconds. 24/7. Sounds like a person.
            </p>
          </Reveal>
          <Reveal as="li" delay={240} className="how__step">
            <span className="how__step-num" aria-hidden="true">2</span>
            <h3 className="how__step-title">Riley qualifies the job.</h3>
            <p className="how__step-body">
              Asks the right questions. Captures the details. Handles it like one of your best CSRs.
            </p>
          </Reveal>
          <Reveal as="li" delay={320} className="how__step">
            <span className="how__step-num" aria-hidden="true">3</span>
            <h3 className="how__step-title">The job books itself.</h3>
            <p className="how__step-body">
              Slot lands on your Cal.com. Customer gets a text. You see it on your dashboard.
            </p>
          </Reveal>
        </ol>

        <Reveal>
          <div className="demo__stage">
            <div className="timeline">
              {STEPS.map((s, i) => (
                <button
                  key={i}
                  type="button"
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
                </button>
              ))}
            </div>

            <div className="demo__view">
              <div className="demo-phone">
                <div className="demo-phone__notch" />
                <div className="demo-phone__screen">
                  <div className="demo-phone__time">9:47 PM</div>
                  {SCENES[step]}
                </div>
              </div>

              <div className="pipeline">
                <div className="pipeline__head">Pipeline &middot; Live</div>
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
          <span className="demo__caption">{STEPS[step].time}</span>
        </div>

        <Reveal delay={120}>
          <p className="how__close">
            Not an answering service. Every call books, qualifies, follows up. Automatically.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
