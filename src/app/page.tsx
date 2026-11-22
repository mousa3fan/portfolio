'use client'

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PdfViewer from "@/components/PdfViewer";

/* =========================================================
   Landing — Theme 5: Editorial Light × Lime
   ========================================================= */

function Landing() {
  // Lazy initializer reads sessionStorage once on the client
  const [tracked, setTracked] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("msaafan_portfolio_tracked") === "1";
  });

  // Fire visit-tracking on first mount (once per browser session)
  useEffect(() => {
    if (tracked) return;

    let cancelled = false;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        source: "landing",
      }),
      // Use keepalive so the request completes even if the user navigates away
      keepalive: true,
    })
      .then(() => {
        if (cancelled) return;
        sessionStorage.setItem("msaafan_portfolio_tracked", "1");
        setTracked(true);
      })
      .catch(() => {
        // Silent fail — never impact the visitor's experience
      });

    return () => {
      cancelled = true;
    };
  }, [tracked]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F5F1",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        color: "#1A1A1A",
      }}
    >
      {/* ===== HERO ===== */}
      <section
        className="hero-safe"
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Subtle lime glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            background:
              "radial-gradient(circle, rgba(184,240,47,0.10) 0%, rgba(184,240,47,0) 55%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 640, position: "relative", zIndex: 1 }}>
          {/* Lime dash */}
          <div
            style={{
              width: 50,
              height: 3,
              background: "#B8F02F",
              margin: "0 auto 24px",
            }}
          />

          <h1
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(40px, 7vw, 72px)",
              fontWeight: 500,
              color: "#1A1A1A",
              lineHeight: 1.05,
              marginBottom: 20,
              letterSpacing: "-0.01em",
            }}
          >
            Mohamed Saafan
          </h1>

          <p
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(16px, 2.2vw, 22px)",
              color: "#5C5040",
              fontWeight: 400,
              marginBottom: 40,
              lineHeight: 1.4,
            }}
          >
            Cinematographer &amp; Post-Production Lead
          </p>

          <div
            style={{
              width: 60,
              height: 1,
              background: "#1A1A1A",
              margin: "0 auto 36px",
            }}
          />

          <p
            style={{
              fontSize: 15,
              color: "#4A4A4A",
              lineHeight: 1.75,
              marginBottom: 44,
              maxWidth: 500,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Award-winning visual storyteller behind Telepathy, #ABtalks × Cartier,
            and campaigns for Red Bull, Netflix and Palm Hills. Eight pages of films,
            credits, awards, education and experience.
          </p>

          {/* Primary CTA — big */}
          <a
            href="https://vimeo.com/1220305814"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              background: "#B8F02F",
              color: "#161616",
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              padding: "22px 48px",
              minWidth: 280,
              borderRadius: 36,
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 10px 30px rgba(184, 240, 47, 0.3)",
            }}
          >
            <span style={{ fontSize: 14 }}>▶</span> Watch Showreel
          </a>

          {/* Secondary CTA — same colours, smaller */}
          <div style={{ marginTop: 16 }}>
            <a
              href="#portfolio"
              className="tap-scale"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#B8F02F",
                color: "#161616",
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "13px 28px",
                borderRadius: 30,
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 6px 18px rgba(184, 240, 47, 0.22)",
              }}
            >
              Open the Portfolio <span style={{ fontSize: 13 }}>→</span>
            </a>
          </div>

          <div
            style={{
              marginTop: 56,
              fontSize: 10,
              color: "#8A8A8A",
              letterSpacing: "0.2em",
            }}
          >
            PDF · 8 PAGES
          </div>
        </div>

        {/* Scroll hint */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            color: "#8A8A8A",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            animation: "bounce 2s infinite",
          }}
        >
          ▼ Scroll to read
        </div>
      </section>

      {/* ===== PDF / PORTFOLIO SECTION ===== */}
      <section
        id="portfolio"
        className="portfolio-safe"
        style={{
          background: "#1A1A1A",
          padding: "40px 0",
        }}
      >
        <div
          className="portfolio-inner"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 16px",
          }}
        >
          <div
            className="portfolio-label"
            style={{
              color: "#8A8A8A",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            — Mohamed Saafan · Portfolio —
          </div>
          {/* PDF.js viewer — renders on every mobile browser
              (Android Chrome & Firefox can't display PDFs inside iframes) */}
          <PdfViewer />
          <div
            style={{
              textAlign: "center",
              marginTop: 16,
            }}
          >
            <a
              href="/Mohamed_Saafan_Portfolio.pdf"
              download="Mohamed_Saafan_Portfolio.pdf"
              className="tap-scale dl-btn"
              onClick={() => {
                // Fire-and-forget: log the download, don't block the actual download
                fetch("/api/download", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    referrer:
                      typeof document !== "undefined"
                        ? document.referrer || null
                        : null,
                  }),
                  keepalive: true,
                }).catch(() => {});
              }}
              style={{
                display: "inline-block",
                color: "#B8F02F",
                fontSize: 13,
                textDecoration: "none",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                borderBottom: "1px dotted #444",
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              ⬇ Download PDF
            </a>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        className="footer-safe"
        style={{
          background: "#161616",
          color: "#8A8A8A",
          padding: "32px 24px",
          textAlign: "center",
          fontSize: 11,
          letterSpacing: "0.1em",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ marginBottom: 12, color: "#B9B9B9" }}>
            Mohamed Saafan · Egypt (relocation ready)
          </div>
          <div>
            <a
              href="mailto:Mousa3fan@gmail.com"
              style={{ color: "#8A8A8A", textDecoration: "none", margin: "0 8px" }}
            >
              Mousa3fan@gmail.com
            </a>
            {" · "}
            <a
              href="https://wa.me/message/HF3S4BERAP3FP1"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#8A8A8A", textDecoration: "none", margin: "0 8px" }}
            >
              +20 1555 00 4678
            </a>
            {" · "}
            <a
              href="https://www.instagram.com/mousa3fan/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#8A8A8A", textDecoration: "none", margin: "0 8px" }}
            >
              @mousa3fan
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.7; }
          50% { transform: translateX(-50%) translateY(6px); opacity: 1; }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   Dashboard — /?admin=1
   ========================================================= */

type VisitData = {
  id: string;
  createdAt: string;
  city: string | null;
  country: string | null;
  region: string | null;
  timezone: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  source: string | null;
};

type DownloadData = {
  id: string;
  createdAt: string;
  city: string | null;
  country: string | null;
  region: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
};

type StatsData = {
  total: number;
  uniqueIps: number;
  uniqueCountries: number;
  last7Days: number;
  topCountries: [string, number][];
  totalDownloads: number;
  uniqueDownloadIps: number;
  downloadsLast7Days: number;
};

function Dashboard() {
  // Lazy init: if already authed in this session, skip the PIN gate
  const [authed, setAuthed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("msaafan_admin_ok") === "1";
  });
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState<VisitData[] | null>(null);
  const [downloads, setDownloads] = useState<DownloadData[] | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/visits?pin=${encodeURIComponent(pin)}`);
      if (!res.ok) {
        setError("Wrong PIN");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setVisits(data.visits);
      setDownloads(data.downloads);
      setStats(data.stats);
      setAuthed(true);
      sessionStorage.setItem("msaafan_admin_ok", "1");
      setLoading(false);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  const loadVisits = async (currentPin: string) => {
    const res = await fetch(`/api/visits?pin=${encodeURIComponent(currentPin)}`);
    if (res.ok) {
      const data = await res.json();
      setVisits(data.visits);
      setDownloads(data.downloads);
      setStats(data.stats);
    }
  };

  // Auto-refresh visits every 30s when authed. Also loads initial data
  // when authed is restored from session storage (setState happens after
  // await, so this is not a synchronous set-state-in-effect).
  useEffect(() => {
    if (!authed) return;
    const storedPin = sessionStorage.getItem("msaafan_pin") || "";
    if (!storedPin) return;

    let cancelled = false;

    const refresh = async () => {
      const res = await fetch(`/api/visits?pin=${encodeURIComponent(storedPin)}`);
      if (cancelled || !res.ok) return;
      const data = await res.json();
      if (cancelled) return;
      setVisits(data.visits);
      setDownloads(data.downloads);
      setStats(data.stats);
    };

    refresh();
    const t = setInterval(refresh, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [authed]);

  // PIN gate
  if (!authed) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#161616",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "var(--font-inter), system-ui, sans-serif",
        }}
      >
        <form
          onSubmit={(e) => {
            // Stash pin before authing so we can refresh later
            sessionStorage.setItem("msaafan_pin", pin);
            handleAuth(e);
          }}
          style={{
            background: "#1F1F1F",
            border: "1px solid #2A2A2A",
            padding: 40,
            borderRadius: 12,
            maxWidth: 360,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 3,
              background: "#B8F02F",
              margin: "0 auto 24px",
            }}
          />
          <div
            style={{
              color: "#8A8A8A",
              fontSize: 10,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Dashboard
          </div>
          <h2
            style={{
              color: "#F5F5F5",
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: 28,
              fontWeight: 500,
              margin: "0 0 24px",
            }}
          >
            Enter PIN
          </h2>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            inputMode="numeric"
            placeholder="• • • •"
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "#161616",
              border: "1px solid #333",
              borderRadius: 6,
              color: "#F5F5F5",
              fontSize: 20,
              letterSpacing: "0.5em",
              textAlign: "center",
              fontFamily: "monospace",
              outline: "none",
            }}
          />
          {error && (
            <div style={{ color: "#E55", fontSize: 12, marginTop: 12 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "14px 20px",
              background: "#B8F02F",
              color: "#161616",
              border: "none",
              borderRadius: 30,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Checking…" : "Enter"}
          </button>
          <div style={{ marginTop: 24, fontSize: 10, color: "#5A5A5A" }}>
            <a href="/" style={{ color: "#8A8A8A", textDecoration: "none" }}>
              ← Back to portfolio
            </a>
          </div>
        </form>
      </main>
    );
  }

  // Authed dashboard
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#161616",
        color: "#F5F5F5",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                width: 40,
                height: 3,
                background: "#B8F02F",
                marginBottom: 12,
              }}
            />
            <div
              style={{
                color: "#8A8A8A",
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Portfolio Dashboard
            </div>
            <h1
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontSize: 36,
                fontWeight: 500,
                margin: 0,
                color: "#F5F5F5",
              }}
            >
              View Tracker
            </h1>
          </div>
          <a
            href="/"
            style={{
              color: "#8A8A8A",
              textDecoration: "none",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderBottom: "1px dotted #444",
              paddingBottom: 2,
            }}
          >
            ← Back to portfolio
          </a>
        </div>

        {/* Stats */}
        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <StatCard label="Page Opens" value={stats.total} />
            <StatCard label="PDF Downloads" value={stats.totalDownloads} />
            <StatCard label="Unique Viewers" value={stats.uniqueIps} />
            <StatCard label="Countries" value={stats.uniqueCountries} />
            <StatCard label="Opens (7d)" value={stats.last7Days} />
            <StatCard label="Downloads (7d)" value={stats.downloadsLast7Days} />
          </div>
        )}

        {/* Top countries */}
        {stats && stats.topCountries.length > 0 && (
          <div
            style={{
              background: "#1F1F1F",
              border: "1px solid #2A2A2A",
              borderRadius: 8,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                color: "#8A8A8A",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Top Countries
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {stats.topCountries.map(([country, count]) => (
                <div key={country} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ color: "#B8F02F", fontSize: 22, fontWeight: 600 }}>
                    {count}
                  </span>
                  <span style={{ color: "#B9B9B9", fontSize: 12 }}>{country}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visits table */}
        <div
          style={{
            background: "#1F1F1F",
            border: "1px solid #2A2A2A",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #2A2A2A",
              color: "#8A8A8A",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Recent Opens (max 500)
          </div>
          {visits && visits.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#8A8A8A",
                fontSize: 13,
              }}
            >
              No opens yet. Share your portfolio link to start receiving
              notifications.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr style={{ background: "#181818" }}>
                    {[
                      "Time",
                      "Location",
                      "Device",
                      "Browser",
                      "OS",
                      "Referrer",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 14px",
                          color: "#8A8A8A",
                          fontSize: 10,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          fontWeight: 500,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visits?.map((v, i) => (
                    <tr
                      key={v.id}
                      style={{
                        borderTop: "1px solid #222",
                        background: i % 2 ? "#1C1C1C" : "transparent",
                      }}
                    >
                      <td style={{ padding: "10px 14px", color: "#B9B9B9", whiteSpace: "nowrap" }}>
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#F5F5F5" }}>
                        {[v.city, v.region, v.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#B9B9B9" }}>
                        {v.device || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#B9B9B9" }}>
                        {v.browser || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#B9B9B9" }}>
                        {v.os || "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          color: "#8A8A8A",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v.referrer || "Direct"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Downloads table */}
        <div
          style={{
            background: "#1F1F1F",
            border: "1px solid #2A2A2A",
            borderRadius: 8,
            overflow: "hidden",
            marginTop: 24,
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #2A2A2A",
              color: "#8A8A8A",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>PDF Downloads (max 500)</span>
            <span style={{ color: "#B8F02F", fontWeight: 600 }}>
              {downloads?.length || 0} total
            </span>
          </div>
          {downloads && downloads.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#8A8A8A",
                fontSize: 13,
              }}
            >
              No downloads yet. When visitors click the Download PDF button,
              they'll appear here.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr style={{ background: "#181818" }}>
                    {["Time", "Location", "Device", "Browser", "OS", "Referrer"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "10px 14px",
                            color: "#8A8A8A",
                            fontSize: 10,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            fontWeight: 500,
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {downloads?.map((d, i) => (
                    <tr
                      key={d.id}
                      style={{
                        borderTop: "1px solid #222",
                        background: i % 2 ? "#1C1C1C" : "transparent",
                      }}
                    >
                      <td style={{ padding: "10px 14px", color: "#B9B9B9", whiteSpace: "nowrap" }}>
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#F5F5F5" }}>
                        {[d.city, d.region, d.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#B9B9B9" }}>
                        {d.device || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#B9B9B9" }}>
                        {d.browser || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#B9B9B9" }}>
                        {d.os || "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          color: "#8A8A8A",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.referrer || "Direct"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 10,
            color: "#5A5A5A",
            textAlign: "center",
            letterSpacing: "0.15em",
          }}
        >
          Auto-refreshes every 30 seconds ·{" "}
          <button
            onClick={() => {
              sessionStorage.removeItem("msaafan_admin_ok");
              sessionStorage.removeItem("msaafan_pin");
              setAuthed(false);
              setPin("");
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#8A8A8A",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 10,
              letterSpacing: "0.15em",
              padding: 0,
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "#1F1F1F",
        border: "1px solid #2A2A2A",
        borderRadius: 8,
        padding: 20,
      }}
    >
      <div
        style={{
          color: "#8A8A8A",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "#B8F02F",
          fontSize: 32,
          fontWeight: 600,
          fontFamily: "var(--font-playfair), Georgia, serif",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   Page shell — switches between Landing and Dashboard
   ========================================================= */

function PageInner() {
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "1";

  if (isAdmin) return <Dashboard />;
  return <Landing />;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <PageInner />
    </Suspense>
  );
}
