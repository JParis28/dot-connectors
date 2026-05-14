import { Reveal } from "./Reveal";

export function Proof() {
  return (
    <section className="proof section--dark">
      <div className="section__inner">
        <Reveal>
          <span className="proof__big">7&times;</span>
        </Reveal>
        <Reveal delay={120}>
          <p className="proof__line">more likely to qualify a lead inside the first hour.</p>
        </Reveal>
        <Reveal delay={240}>
          <p className="proof__sub">Speed wins. Now it&apos;s automatic.</p>
        </Reveal>
        <Reveal delay={360}>
          <span className="proof__source">Oldroyd, McElheran, Elkington · Harvard Business Review, 2011</span>
        </Reveal>
      </div>
    </section>
  );
}
