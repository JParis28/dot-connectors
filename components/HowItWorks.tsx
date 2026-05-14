import { Reveal } from "./Reveal";

export function HowItWorks() {
  return (
    <section id="how" className="how">
      <div className="section__inner">
        <Reveal>
          <p className="how__eyebrow">How it works</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="how__title">
            Three things happen <span className="accent">while you&rsquo;re on the job.</span>
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
        <Reveal delay={400}>
          <p className="how__close">
            Not an answering service. Every call books, qualifies, follows up. Automatically.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
