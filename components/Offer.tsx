import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

const BOOKING_URL = "/start";

export function Offer() {
  return (
    <section id="offer" className="offer section--dark">
      <div className="section__inner">
        <Reveal>
          <p className="offer__eyebrow">Founding Cohort · First 25 customers</p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="offer__title">
            Install fee waived.{" "}
            <span className="accent">$1,997/month, locked for 5 years.</span>
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <ul className="offer__terms">
            <li>
              <Icon name="check" size={16} strokeWidth={2.5} />
              <span>
                Install fee <strong>($2,997 value)</strong> waived for the first 25.
              </span>
            </li>
            <li>
              <Icon name="check" size={16} strokeWidth={2.5} />
              <span>Price locked at $1,997/month for 5 years.</span>
            </li>
            <li>
              <Icon name="check" size={16} strokeWidth={2.5} />
              <span>No contracts. Cancel anytime.</span>
            </li>
          </ul>
        </Reveal>
        <Reveal delay={320}>
          <div className="offer__guarantees">
            <p className="offer__guarantees-eyebrow">Two refund guarantees</p>
            <ul className="offer__guarantees-list">
              <li>
                <Icon name="check" size={16} strokeWidth={2.5} />
                <span>Live in 30 days, or your money back.</span>
              </li>
              <li>
                <Icon name="check" size={16} strokeWidth={2.5} />
                <span>
                  95% of HVAC calls answered in 8 seconds, or your money back.
                </span>
              </li>
            </ul>
          </div>
        </Reveal>
        <Reveal delay={440}>
          <a href={BOOKING_URL} className="btn btn--primary btn--lg">
            Book a Call
            <Icon name="arrow" size={18} />
          </a>
          <p className="offer__consent">
            Founding Cohort pricing ends when the first 25 spots are filled.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
