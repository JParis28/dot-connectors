import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { calculate, defaultInputsFor, TRADES, type Inputs, type ModeId, type TradeId } from "@/lib/roi/calc";
import { money } from "@/lib/roi/format";
import { sendCapiEvent } from "@/lib/meta-capi";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function sanitizeInputs(raw: unknown): Inputs | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.trade !== "string" || !(r.trade in TRADES)) return null;
  if (r.mode !== "conservative" && r.mode !== "research" && r.mode !== "aggressive") return null;
  const base = defaultInputsFor(r.trade as TradeId, r.mode as ModeId);
  const num = (v: unknown, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
  return {
    trade: r.trade as TradeId,
    mode: r.mode as ModeId,
    monthlyLeads: num(r.monthlyLeads, base.monthlyLeads),
    bookingRate: Math.max(0, Math.min(1, num(r.bookingRate, base.bookingRate))),
    smallTicket: num(r.smallTicket, base.smallTicket),
    bigTicket: num(r.bigTicket, base.bigTicket),
    bigTicketMix: Math.max(0, Math.min(1, num(r.bigTicketMix, base.bigTicketMix))),
    pastCustomers: num(r.pastCustomers, base.pastCustomers),
    planMembersPct: Math.max(0, Math.min(1, num(r.planMembersPct, base.planMembersPct))),
    planFeeAnnual: num(r.planFeeAnnual, base.planFeeAnnual),
  };
}

function renderEmail(args: {
  businessName: string;
  result: ReturnType<typeof calculate>;
  shareUrl: string;
}): string {
  const { businessName, result, shareUrl } = args;
  const greeting = businessName ? `<p>Here are your numbers, ${escapeHtml(businessName)}.</p>` : "";
  const pillarRows = result.pillars
    .map(
      (p) => `
    <tr>
      <td style="padding:14px 0; border-bottom:1px solid #D1E3F0;">
        <div style="font-size:12px; color:#8BAFC8; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:4px;">${escapeHtml(p.eyebrow)}</div>
        <div style="font-size:16px; font-weight:700; color:#0B1F3A;">${escapeHtml(p.title)}</div>
      </td>
      <td style="padding:14px 0; border-bottom:1px solid #D1E3F0; text-align:right; font-weight:700; color:#0B1F3A; font-variant-numeric:tabular-nums;">${money(p.revenue)}</td>
    </tr>`
    )
    .join("");
  return `<!doctype html>
<html><body style="margin:0; padding:0; background:#F5F9FF; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#0B1F3A;">
  <div style="max-width:560px; margin:0 auto; padding:40px 24px;">
    <div style="font-size:11px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; color:#4BA3D4; margin-bottom:14px;">Recoverable Revenue · Connectors</div>
    <h1 style="margin:0 0 18px; font-size:30px; font-weight:800; letter-spacing:-0.025em; color:#0B1F3A; line-height:1.1;">
      ${money(result.threeYearTotal)} over 3 years.
    </h1>
    ${greeting}
    <p style="margin:0 0 28px; font-size:15px; color:#4A6FA5; line-height:1.6;">
      Based on ${escapeHtml(result.trade.label)} benchmarks, ${escapeHtml(result.mode.label.toLowerCase())} assumptions. Year 1 alone: <strong style="color:#0B1F3A;">${money(result.year1)}</strong>. Steady-state annual: <strong style="color:#0B1F3A;">${money(result.steadyAnnual)}</strong>.
    </p>

    <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
      <thead>
        <tr>
          <th style="text-align:left; font-size:11px; font-weight:700; color:#8BAFC8; letter-spacing:0.14em; text-transform:uppercase; padding-bottom:10px; border-bottom:1px solid #D1E3F0;">Pillar</th>
          <th style="text-align:right; font-size:11px; font-weight:700; color:#8BAFC8; letter-spacing:0.14em; text-transform:uppercase; padding-bottom:10px; border-bottom:1px solid #D1E3F0;">Year 1</th>
        </tr>
      </thead>
      <tbody>${pillarRows}</tbody>
    </table>

    <div style="background:linear-gradient(135deg,#0B1F3A 0%,#0D2F5C 55%,#1A4A8C 100%); border-radius:12px; padding:32px; color:white; margin:32px 0;">
      <div style="font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#7EC8E3; margin-bottom:14px;">3-Year Cost of Doing Nothing</div>
      <div style="font-size:44px; font-weight:800; letter-spacing:-0.04em; line-height:1; margin-bottom:18px; font-variant-numeric:tabular-nums;">${money(result.threeYearTotal)}</div>
      <a href="https://www.getconnectors.ai/start" style="display:inline-block; background:#4BA3D4; color:white; text-decoration:none; font-weight:700; font-size:15px; padding:14px 28px; border-radius:100px;">Claim what&rsquo;s already yours →</a>
    </div>

    <p style="font-size:13px; color:#8BAFC8; line-height:1.6;">
      Want to tweak the inputs? <a href="${escapeHtml(shareUrl)}" style="color:#4BA3D4;">Reopen your calculator</a>.
    </p>
    <p style="font-size:12px; color:#8BAFC8; margin-top:32px; line-height:1.55;">
      Connectors AI LLC · St. Petersburg, FL · getconnectors.ai
    </p>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const businessName = typeof body.businessName === "string" ? body.businessName.trim().slice(0, 120) : "";
  const inputs = sanitizeInputs(body.inputs);
  const eventId = typeof body.eventId === "string" && body.eventId ? body.eventId.slice(0, 96) : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }
  if (!inputs) {
    return NextResponse.json({ ok: false, error: "Invalid inputs" }, { status: 400 });
  }

  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resend || !from) {
    console.error("[email-roi] Missing RESEND_API_KEY or RESEND_FROM_EMAIL");
    return NextResponse.json({ ok: false, error: "Email service not configured" }, { status: 503 });
  }

  const result = calculate(inputs);
  const shareSnapshot = (() => {
    try {
      return Buffer.from(JSON.stringify(inputs), "utf-8").toString("base64");
    } catch {
      return "";
    }
  })();
  const shareUrl = `https://www.getconnectors.ai/roi${shareSnapshot ? `?s=${encodeURIComponent(shareSnapshot)}` : ""}`;
  const html = renderEmail({ businessName, result, shareUrl });
  const subjectName = businessName ? ` for ${businessName}` : "";

  try {
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: `Your recoverable revenue${subjectName} · ${money(result.threeYearTotal)} over 3 years`,
      html,
    });
    if (error) {
      console.error("[email-roi] Resend returned error:", error);
      return NextResponse.json({ ok: false, error: "Failed to send" }, { status: 502 });
    }
  } catch (err) {
    console.error("[email-roi] send threw:", err);
    return NextResponse.json({ ok: false, error: "Failed to send" }, { status: 502 });
  }

  if (eventId) {
    const fwd = request.headers.get("x-forwarded-for") ?? "";
    const ip = fwd.split(",")[0]?.trim() || undefined;
    const ua = request.headers.get("user-agent") ?? undefined;
    const fbp = request.cookies.get("_fbp")?.value;
    const fbc = request.cookies.get("_fbc")?.value;
    const capi = await sendCapiEvent({
      eventName: "Lead",
      eventId,
      eventSourceUrl: shareUrl,
      userData: {
        email,
        clientIpAddress: ip,
        clientUserAgent: ua,
        fbp,
        fbc,
      },
      customData: {
        currency: "USD",
        value: Math.round(result.year1),
        content_name: "ROI report",
        content_category: inputs.trade,
        ...(businessName ? { business_name: businessName } : {}),
      },
    });
    if (!capi.ok) {
      const safeLog = capi.reason === "http-error" ? { reason: capi.reason, status: capi.status } : { reason: capi.reason };
      console.error("[email-roi] CAPI Lead fire failed:", safeLog);
    }
  }

  return NextResponse.json({ ok: true });
}
