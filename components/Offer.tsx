import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

const BOOKING_URL = "/start";

export function Offer() {
  return (
    <section id="offer" className="offer section--dark">
      <div className="section__inner">
        <Reveal>
          <p className="offer__eyebrow">Founding Cohort · First 25 customers only</p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="offer__title">
            $1,997 a month.{" "}
            <span className="accent">Locked at the founding rate for 5 years.</span>
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <p className="offer__strapline">
            Introductory pricing for the first 25 customers. After the cohort closes, we reset to standard pricing.
          </p>
        </Reveal>
        <Reveal delay={260}>
          <ul className="offer__terms">
            <li>
              <Icon name="check" size={16} strokeWidth={2.5} />
              <span>
                <strong>$1,997/month</strong> locked at the founding rate for 5 full years.
              </span>
            </li>
            <li>
              <Icon name="check" size={16} strokeWidth={2.5} />
              <span>
                Install fee <strong>($2,997 value)</strong> waived.
              </span>
            </li>
            <li>
              <Icon name="check" size={16} strokeWidth={2.5} />
              <span>
                Cancel any month. The 5-year price lock is our commitment to you, not yours to us.
              </span>
            </li>
          </ul>
        </Reveal>
        <Reveal delay={380}>
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
        <Reveal delay={500}>
          <a href={BOOKING_URL} className="btn btn--primary btn--lg">
            Book a Call
            <Icon name="arrow" size={18} />
          </a>
          <p className="offer__consent">
            Founding Cohort pricing closes when the first 25 spots are filled.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
