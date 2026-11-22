import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // PIN-protected. PIN is set via ADMIN_PIN env var.
  const expectedPin = process.env.ADMIN_PIN || "";
  if (!expectedPin) {
    return NextResponse.json(
      { ok: false, error: "Dashboard not configured (ADMIN_PIN missing)" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const pin = url.searchParams.get("pin") || req.headers.get("x-admin-pin");

  if (pin !== expectedPin) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const visits = await db.visit.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const downloads = await db.download.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Aggregate visit stats
  const total = visits.length;
  const uniqueIps = new Set(visits.map((v) => v.ip).filter(Boolean)).size;
  const uniqueCountries = new Set(
    visits.map((v) => v.country).filter(Boolean)
  ).size;

  // Last 7 days count (visits)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7Days = visits.filter((v) => v.createdAt >= sevenDaysAgo).length;

  // Top countries (visits)
  const countryCounts: Record<string, number> = {};
  for (const v of visits) {
    if (v.country) {
      countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
    }
  }
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Download stats
  const totalDownloads = downloads.length;
  const uniqueDownloadIps = new Set(
    downloads.map((d) => d.ip).filter(Boolean)
  ).size;
  const downloadsLast7Days = downloads.filter(
    (d) => d.createdAt >= sevenDaysAgo
  ).length;

  return NextResponse.json({
    ok: true,
    stats: {
      total,
      uniqueIps,
      uniqueCountries,
      last7Days,
      topCountries,
      totalDownloads,
      uniqueDownloadIps,
      downloadsLast7Days,
    },
    visits: visits.map((v) => ({
      id: v.id,
      createdAt: v.createdAt.toISOString(),
      city: v.city,
      country: v.country,
      region: v.region,
      timezone: v.timezone,
      device: v.device,
      browser: v.browser,
      os: v.os,
      referrer: v.referrer,
      source: v.source,
    })),
    downloads: downloads.map((d) => ({
      id: d.id,
      createdAt: d.createdAt.toISOString(),
      city: d.city,
      country: d.country,
      region: d.region,
      device: d.device,
      browser: d.browser,
      os: d.os,
      referrer: d.referrer,
    })),
  });
}
