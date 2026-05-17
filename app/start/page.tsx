import type { Metadata } from "next";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Icon } from "@/components/Icon";
import { CalEmbed } from "@/components/CalEmbed";
import { StartViewContent } from "@/components/StartViewContent";
import { calculate } from "@/lib/roi/calc";
import { moneyCompact } from "@/lib/roi/format";
import { decodeSnapshot } from "@/lib/roi/snapshot";

export const metadata: Metadata = {
  title: "HVAC Calls Answered in 8 Seconds · Book a Strategy Call · Connectors",
  description:
    "95% of your HVAC calls answered in 8 seconds, or your money back. Pick a time and we'll show you exactly what you've been losing.",
  openGraph: {
    title: "HVAC Calls Answered in 8 Seconds · Book a Strategy Call · Connectors",
    description:
      "95% of your HVAC calls answered in 8 seconds, or your money back. Pick a time and we'll show you exactly what you've been losing.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HVAC Calls Answered in 8 Seconds · Book a Strategy Call · Connectors",
    description:
      "95% of your HVAC calls answered in 8 seconds, or your money back. Pick a time and we'll show you exactly what you've been losing.",
  },
};

type SearchParams = { s?: string | string[] };

function readPersonalization(searchParams: SearchParams | undefined): string | null {
  const raw = searchParams?.s;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return null;
  const inputs = decodeSnapshot(s);
  if (!inputs) return null;
  try {
    const result = calculate(inputs);
    if (!Number.isFinite(result.year1) || result.year1 <= 0) return null;
    return moneyCompact(result.year1);
  } catch {
    return null;
  }
}

export default function StartPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const year1Recoverable = readPersonalization(searchParams);

  return (
    <div className="bk-page" data-layout="focused">
      <StartViewContent year1Recoverable={year1Recoverable} />
      <Nav back />

      <section className="bk-hero">
        <div className="bk-canopy" aria-hidden="true">
          <div className="bk-canopy__grid" />
        </div>
        <div className="bk-hero__inner">
          <div className="bk-pitch">
            <div className="bk-pitch__eyebrow">
              <span className="bk-pitch__livedot" aria-hidden="true" />
              Every Lead. Answered. Booked.
            </div>
            {year1Recoverable ? (
              <>
                <h1 className="bk-pitch__headline">
                  You ran the numbers.{" "}
                  <span className="accent">
                    {year1Recoverable}. Let&rsquo;s talk about it.
                  </span>
                </h1>
                <p className="bk-pitch__attribution">
                  Your numbers. Your booking rate. Your ticket size. That&rsquo;s what we&rsquo;ll talk about.
                </p>
              </>
            ) : (
              <h1 className="bk-pitch__headline">
                <span className="accent">Stop handing HVAC jobs to the next guy.</span>
              </h1>
            )}
            <div className="bk-host">
              <div className="bk-host__row">
                <div className="bk-host__avatar">
                  <Image
                    src="/nicholas.jpg"
                    alt="Nicholas"
                    width={52}
                    height={52}
                    sizes="52px"
                    priority
                  />
                </div>
                <div className="bk-host__body">
                  <p className="bk-host__name">Nicholas</p>
                  <p className="bk-host__role">Founder · Connectors · St. Petersburg, FL</p>
                </div>
              </div>
              <p className="bk-host__quote">
                &ldquo;We&rsquo;ll pull up your missed-call log and price what each one&rsquo;s worth. After that, you&rsquo;ll know whether to hire us, or just fix it yourself. Most owners find out it&rsquo;s bigger than they thought.&rdquo;
              </p>
            </div>
          </div>

          <div className="bk-card">
            <div className="bk-card__top">
              <div className="bk-card__icon" aria-hidden="true">
                <Icon name="calendar" size={22} strokeWidth={1.75} />
              </div>
              <div className="bk-card__top-body">
                <p className="bk-card__eyebrow">Strategy Call</p>
                <h2 className="bk-card__title">Pick a time that works.</h2>
              </div>
            </div>
            <div className="bk-card__meta">
              <span><Icon name="clock" size={14} />45 minutes</span>
              <span><Icon name="video" size={14} />Video call</span>
              <span><Icon name="globe" size={14} />America/New_York</span>
            </div>
            <ul className="bk-card__guarantees">
              <li>
                <Icon name="check" size={14} strokeWidth={2.5} />
                <span>Live in 30 days, or your money back.</span>
              </li>
              <li>
                <Icon name="check" size={14} strokeWidth={2.5} />
                <span>95% of HVAC calls answered in 8 seconds, or your money back.</span>
              </li>
            </ul>
            <CalEmbed />
            <p className="bk-card__disclosure">
              Before you complete this booking, you&rsquo;ll be asked to consent to receive autodialed and prerecorded calls and text messages from Connectors AI LLC at the number you provide: confirmations, reminders, and follow-ups about your strategy call. Consent is not a condition of purchase. Message frequency varies. Message and data rates may apply. Reply HELP for help, STOP to opt out at any time. See our <a href="/privacy-policy">Privacy Policy</a> and <a href="/terms-of-use">Terms of Use</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="bk-proof-strip">
        <div className="bk-proof-strip__inner">
          <div className="bk-stat">
            <div className="bk-stat__num">8<span className="unit">sec</span></div>
            <div className="bk-stat__label">Riley&rsquo;s answer time &mdash; guaranteed or refunded</div>
          </div>
          <div className="bk-stat">
            <div className="bk-stat__num">24/7</div>
            <div className="bk-stat__label">Answered. Even Sundays. Even storms.</div>
          </div>
          <div className="bk-stat">
            <div className="bk-stat__num">30<span className="unit">days</span></div>
            <div className="bk-stat__label">Done-for-you front office, fully wired</div>
          </div>
          <div className="bk-stat">
            <div className="bk-stat__num">0</div>
            <div className="bk-stat__label">Leads left in voicemail purgatory</div>
          </div>
        </div>
      </section>

      <section className="bk-fineprint">
        <div className="bk-fineprint__inner">
          <div className="bk-fineprint__col">
            <div className="bk-fineprint__head">
              <Icon name="check" size={14} strokeWidth={2.5} />
              What this call is
            </div>
            <ul className="bk-fineprint__list">
              <li><Icon name="check" size={16} strokeWidth={2.5} />A working session on your phone log</li>
              <li><Icon name="check" size={16} strokeWidth={2.5} />A live demo of your AI answering a call</li>
              <li><Icon name="check" size={16} strokeWidth={2.5} />An honest read on whether we&rsquo;re a fit</li>
            </ul>
          </div>
          <div className="bk-fineprint__col bk-fineprint__col--alt">
            <div className="bk-fineprint__head bk-fineprint__head--off">
              <Icon name="x" size={14} strokeWidth={2.5} />
              What it isn&rsquo;t
            </div>
            <ul className="bk-fineprint__list">
              <li><Icon name="x" size={16} strokeWidth={2.5} />A pitch from a sales team you&rsquo;ll never see again</li>
              <li><Icon name="x" size={16} strokeWidth={2.5} />A demo you have to figure out on your own</li>
              <li><Icon name="x" size={16} strokeWidth={2.5} />A multi-month onboarding with hidden fees</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
