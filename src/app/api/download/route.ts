import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UAParser } from "ua-parser-js";

function pickHeader(req: NextRequest, names: string[]): string | null {
  for (const n of names) {
    const v = req.headers.get(n);
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function getIp(req: NextRequest): string | null {
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
    const body = await req.json().catch(() => ({} as any));

    const ip = getIp(req);
    const city = pickHeader(req, ["x-vercel-ip-city"]);
    const country = pickHeader(req, ["x-vercel-ip-country"]);
    const region = pickHeader(req, ["x-vercel-ip-country-region"]);
    const userAgentStr = req.headers.get("user-agent") || null;
    const referrer =
      body.referrer ||
      req.headers.get("referer") ||
      req.headers.get("referrer") ||
      null;

    const parser = new UAParser(userAgentStr || "");
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const download = await db.download.create({
      data: {
        ip,
        city,
        country,
        region,
        userAgent: userAgentStr,
        browser: browser.name ? `${browser.name} ${browser.version || ""}`.trim() : null,
        os: os.name ? `${os.name} ${os.version || ""}`.trim() : null,
        device: device.type || device.vendor || "Desktop",
        referrer,
      },
    });

    return NextResponse.json({ ok: true, id: download.id });
  } catch (err) {
    console.error("[download] error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to log download" },
      { status: 500 }
    );
  }
}
