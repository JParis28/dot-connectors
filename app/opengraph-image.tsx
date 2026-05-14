import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Connectors. The AI front office for HVAC contractors.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const interBold = fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.ttf"
  ).then((r) => r.arrayBuffer());
  const interSemi = fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf"
  ).then((r) => r.arrayBuffer());

  const [boldData, semiData] = await Promise.all([interBold, interSemi]);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 88px",
          background:
            "linear-gradient(135deg, #0B1F3A 0%, #0D2F5C 55%, #1A4A8C 100%)",
          color: "white",
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 720,
            height: 720,
            background:
              "radial-gradient(ellipse 60% 60% at 75% 40%, rgba(75,163,212,0.22) 0%, transparent 65%)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="40" height="32" viewBox="0 0 28 22" fill="none">
            <circle cx="4" cy="19" r="3" fill="white" />
            <circle cx="14" cy="3" r="3" fill="white" />
            <circle cx="24" cy="19" r="3" fill="white" />
            <line x1="6.5" y1="16.8" x2="11.5" y2="5.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <line x1="16.5" y1="5.8" x2="21.5" y2="16.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <line x1="7" y1="19" x2="21" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          </svg>
          <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>Connectors</span>
        </div>

        <div
          style={{
            marginTop: 56,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#7EC8E3",
          }}
        >
          AI Front Office · HVAC
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 0.98,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>95% of your HVAC calls,</span>
          <span
            style={{
              backgroundImage: "linear-gradient(135deg, #4BA3D4 0%, #7EC8E3 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            answered in 8 seconds.
          </span>
        </div>

        <div
          style={{
            marginTop: 32,
            fontSize: 26,
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.4,
            maxWidth: 880,
          }}
        >
          Or your money back. Founding Cohort price locked for 5 years. First 25 customers.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: boldData, weight: 800, style: "normal" },
        { name: "Inter", data: semiData, weight: 600, style: "normal" },
      ],
    }
  );
}
