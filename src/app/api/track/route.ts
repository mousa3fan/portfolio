import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UAParser } from "ua-parser-js";
import { Resend } from "resend";

// Helper: pick the first non-empty value from a list of header names
function pickHeader(req: NextRequest, names: string[]): string | null {
  for (const n of names) {
    const v = req.headers.get(n);
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function getIp(req: NextRequest): string | null {
  // Vercel provides x-forwarded-for; fall back to other common headers
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    pickHeader(req, [
      "x-real-ip",
      "x-vercel-forwarded-for",
      "cf-connecting-ip",
      "true-client-ip",
    ]) || null
  );
}

export async function POST(req: NextRequest) {
  try {
    // Optional body sent from the client (referrer etc.)
    const body = await req.json().catch(() => ({} as any));

    const ip = getIp(req);

    // Vercel auto-injects geo headers — https://vercel.com/docs/edge-network/headers
    const city = pickHeader(req, ["x-vercel-ip-city"]);
    const country = pickHeader(req, ["x-vercel-ip-country"]);
    const region = pickHeader(req, ["x-vercel-ip-country-region"]);
    const latitudeRaw = pickHeader(req, ["x-vercel-ip-latitude"]);
    const longitudeRaw = pickHeader(req, ["x-vercel-ip-longitude"]);
    const timezone = pickHeader(req, ["x-vercel-ip-timezone"]);

    const userAgentStr = req.headers.get("user-agent") || null;
    const referrer =
      body.referrer ||
      req.headers.get("referer") ||
      req.headers.get("referrer") ||
      null;
    const source = body.source || null;

    // Parse user-agent
    const parser = new UAParser(userAgentStr || "");
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const visit = await db.visit.create({
      data: {
        ip,
        city,
        country,
        region,
        latitude: latitudeRaw ? parseFloat(latitudeRaw) : null,
        longitude: longitudeRaw ? parseFloat(longitudeRaw) : null,
        timezone,
        userAgent: userAgentStr,
        browser: browser.name ? `${browser.name} ${browser.version || ""}`.trim() : null,
        os: os.name ? `${os.name} ${os.version || ""}`.trim() : null,
        device: device.type || device.vendor || "Desktop",
        referrer,
        source,
      },
    });

    // Send email notification in the background (non-blocking)
    const apiKey = process.env.RESEND_API_KEY;
    const ownerEmail = process.env.OWNER_EMAIL;
    if (apiKey && ownerEmail) {
      try {
        const resend = new Resend(apiKey);
        const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

        const locationStr = [city, region, country].filter(Boolean).join(", ") || "Unknown";
        const visitTime = new Date().toUTCString();
        const adminUrl = `${req.nextUrl.origin}/?admin=1`; // works on any domain you deploy to

        const subject = `Portfolio opened — ${locationStr}`;
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="margin: 0 0 16px 0; color: #1a1a1a;">Someone opened your portfolio</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #8a8a8a; width: 110px;">Time</td><td style="padding: 8px 0; color: #1a1a1a;">${visitTime}</td></tr>
              <tr><td style="padding: 8px 0; color: #8a8a8a;">Location</td><td style="padding: 8px 0; color: #1a1a1a;">${locationStr}${timezone ? ` · ${timezone}` : ""}</td></tr>
              <tr><td style="padding: 8px 0; color: #8a8a8a;">Device</td><td style="padding: 8px 0; color: #1a1a1a;">${visit.device || "Unknown"}</td></tr>
              <tr><td style="padding: 8px 0; color: #8a8a8a;">Browser</td><td style="padding: 8px 0; color: #1a1a1a;">${visit.browser || "Unknown"}</td></tr>
              <tr><td style="padding: 8px 0; color: #8a8a8a;">OS</td><td style="padding: 8px 0; color: #1a1a1a;">${visit.os || "Unknown"}</td></tr>
              <tr><td style="padding: 8px 0; color: #8a8a8a;">Referrer</td><td style="padding: 8px 0; color: #1a1a1a;">${referrer || "Direct / none"}</td></tr>
              <tr><td style="padding: 8px 0; color: #8a8a8a;">IP</td><td style="padding: 8px 0; color: #1a1a1a;">${ip || "Unknown"}</td></tr>
            </table>
            <p style="margin: 24px 0 0 0; font-size: 13px; color: #8a8a8a;">
              View all opens on your <a href="${adminUrl}" style="color: #B8F02F; text-decoration: none;">dashboard</a>.
            </p>
          </div>
        `;

        await resend.emails.send({
          from: fromEmail,
          to: ownerEmail,
          subject,
          html,
        });
      } catch (emailErr) {
        console.error("[track] email send failed:", emailErr);
      }
    } else {
      console.log(
        `[track] visit logged (no email sent — RESEND_API_KEY or OWNER_EMAIL not set). visit id: ${visit.id}`
      );
    }

    return NextResponse.json({ ok: true, id: visit.id });
  } catch (err) {
    console.error("[track] error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to log visit" },
      { status: 500 }
    );
  }
}
