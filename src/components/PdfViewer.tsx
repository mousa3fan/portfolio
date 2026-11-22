'use client'

import { useCallback, useEffect, useRef, useState } from "react";

/* =========================================================
   PdfViewer — mobile-first, PDF.js page-by-page viewer
   ---------------------------------------------------------
   Why not an <iframe src="*.pdf">?
     • Android Chrome / Firefox do NOT render PDFs inside iframes
       (visitors just see an empty grey box).
     • iOS Safari renders only the first page inside an iframe and
       scrolling inside it is unreliable.
   This component renders the PDF with PDF.js onto a <canvas>,
   so every phone browser sees the pages exactly like page one,
   with clickable prev/next buttons, tappable page dots, swipe
   gestures and a download button.
   ========================================================= */

const PDF_URL = "/Mohamed_Saafan_Portfolio.pdf";
const WORKER_SRC = "/pdfjs/pdf.worker.min.mjs";
const STANDARD_FONTS_URL = "/pdfjs/standard_fonts/";

const CACHE_PAGES = 3; // keep prev + current + next in memory
type CachedCanvas = HTMLCanvasElement & { _dispW?: number; _dispH?: number };

export default function PdfViewer() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const cacheRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const renderSeqRef = useRef(0);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rendering, setRendering] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [ratio, setRatio] = useState(0.707); // width/height, A4 default
  const [flip, setFlip] = useState(false);

  /* ---------- cache helpers (free memory of evicted canvases) ---------- */
  const cachePut = (num: number, canvas: HTMLCanvasElement) => {
    const cache = cacheRef.current;
    cache.set(num, canvas);
    while (cache.size > CACHE_PAGES) {
      // evict the entry farthest from the current page
      let farKey = -1;
      let farDist = -1;
      cache.forEach((_, key) => {
        const d = Math.abs(key - num);
        if (d > farDist) {
          farDist = d;
          farKey = key;
        }
      });
      if (farKey >= 0 && farDist > 1) {
        const evicted = cache.get(farKey)!;
        evicted.width = 0;
        evicted.height = 0;
        cache.delete(farKey);
      } else break;
    }
  };

  /* ---------- geometry ---------- */
  const getFitSize = useCallback((baseW: number, baseH: number) => {
    const stage = stageRef.current;
    const maxW = (stage?.clientWidth || 320) - 2;
    const maxH = Math.max(
      320,
      Math.min(window.innerHeight * 0.78, window.innerWidth * 1.55)
    );
    const scale = Math.min(maxW / baseW, maxH / baseH);
    return { w: Math.floor(baseW * scale), h: Math.floor(baseH * scale) };
  }, []);

  /* ---------- render one page (or paint it from cache) ---------- */
  const showPage = useCallback(
    async (num: number) => {
      const doc = docRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas || status !== "ready") return;

      const seq = ++renderSeqRef.current;
      setRendering(true);

      try {
        const cached = cacheRef.current.get(num);
        const ctx = canvas.getContext("2d");

        if (cached && ctx) {
          // paint instantly from cache
          canvas.width = cached.width;
          canvas.height = cached.height;
          canvas.style.width = `${cached._dispW ?? cached.width}px`;
          canvas.style.height = `${cached._dispH ?? cached.height}px`;
          ctx.drawImage(cached, 0, 0);
          if (seq === renderSeqRef.current) setRendering(false);
          return;
        }

        // cancel any in-flight render
        renderTaskRef.current?.cancel?.();
        renderTaskRef.current = null;

        const pdfPage = await doc.getPage(num);
        if (seq !== renderSeqRef.current) return;

        const base = pdfPage.getViewport({ scale: 1 });
        const fit = getFitSize(base.width, base.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const viewport = pdfPage.getViewport({
          scale: (fit.w / base.width) * dpr,
        });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${fit.w}px`;
        canvas.style.height = `${fit.h}px`;

        const task = pdfPage.render({
          canvasContext: ctx!,
          viewport,
        });
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;

        // update page aspect ratio (pages can differ)
        setRatio(base.width / base.height);

        // store a copy for instant swipe back/forward
        const store = document.createElement("canvas") as CachedCanvas;
        store.width = canvas.width;
        store.height = canvas.height;
        store._dispW = fit.w;
        store._dispH = fit.h;
        store.getContext("2d")!.drawImage(canvas, 0, 0);
        cachePut(num, store);

        if (seq === renderSeqRef.current) setRendering(false);
      } catch (err: any) {
        if (err?.name === "RenderingCancelledException") return;
        console.error("[PdfViewer] render failed:", err);
        if (seq === renderSeqRef.current) setRendering(false);
      }
    },
    [getFitSize, status]
  );

  /* ---------- preload neighbours silently ---------- */
  const preloadNeighbours = useCallback(
    async (num: number) => {
      const doc = docRef.current;
      if (!doc || status !== "ready") return;
      for (const n of [num + 1, num - 1]) {
        if (n < 1 || n > doc.numPages || cacheRef.current.has(n)) continue;
        try {
          const pdfPage = await doc.getPage(n);
          const base = pdfPage.getViewport({ scale: 1 });
          const fit = getFitSize(base.width, base.height);
          const dpr = Math.min(window.devicePixelRatio || 1, 3);
          const viewport = pdfPage.getViewport({
            scale: (fit.w / base.width) * dpr,
          });
          const store = document.createElement("canvas") as CachedCanvas;
          store.width = Math.floor(viewport.width);
          store.height = Math.floor(viewport.height);
          store._dispW = fit.w;
          store._dispH = fit.h;
          const task = pdfPage.render({
            canvasContext: store.getContext("2d")!,
            viewport,
          });
          await task.promise;
          cachePut(num, store); // eviction is centred on the visible page
        } catch {
          /* neighbour preload is best-effort */
        }
      }
    },
    [getFitSize, status]
  );

  /* ---------- load the document once ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
        const doc = await pdfjs.getDocument({
          url: PDF_URL,
          standardFontDataUrl: STANDARD_FONTS_URL,
          rangeChunkSize: 262144,
        }).promise;

        if (cancelled) {
          doc.destroy();
          return;
        }
        docRef.current = doc;
        setTotal(doc.numPages);

        const p1 = await doc.getPage(1);
        const base = p1.getViewport({ scale: 1 });
        if (!cancelled) {
          setRatio(base.width / base.height);
          setStatus("ready");
        }
      } catch (err) {
        console.error("[PdfViewer] failed to load PDF:", err);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
      docRef.current?.destroy?.();
      docRef.current = null;
      cacheRef.current.clear();
    };
  }, []);

  /* ---------- render whenever the page number changes ---------- */
  useEffect(() => {
    if (status !== "ready") return;
    showPage(page);
    setFlip(true);
    const t = setTimeout(() => setFlip(false), 180);
    preloadNeighbours(page);
    return () => clearTimeout(t);
  }, [page, status, showPage, preloadNeighbours]);

  /* ---------- re-render on resize / orientation change ---------- */
  useEffect(() => {
    if (status !== "ready") return;
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        cacheRef.current.forEach((c) => {
          c.width = 0;
          c.height = 0;
        });
        cacheRef.current.clear();
        showPage(page);
      }, 250);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [page, status, showPage]);

  /* ---------- keyboard navigation (desktop) ---------- */
  useEffect(() => {
    if (status !== "ready") return;
    const onKey = (e: KeyboardEvent) => {
      const adminOpen = typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("admin") === "1";
      if (adminOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        setPage((p) => Math.min(p + 1, total || p + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setPage((p) => Math.max(p - 1, 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, total]);

  /* ---------- swipe navigation (touch) ---------- */
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start || status !== "ready") return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.t;
    if (dt > 800) return;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0) setPage((p) => Math.min(p + 1, total || p + 1));
      else setPage((p) => Math.max(p - 1, 1));
    }
  };

  /* ---------- fallback for very old browsers ---------- */
  if (status === "error") {
    return (
      <div>
        <iframe
          src={`${PDF_URL}#toolbar=1&navpanes=0&view=FitH`}
          title="Mohamed Saafan — Portfolio"
          style={{
            width: "100%",
            height: "80vh",
            minHeight: 480,
            border: "1px solid #333",
            background: "#161616",
            borderRadius: 6,
          }}
        />
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#8A8A8A" }}>
          Inline preview unavailable on this browser —{" "}
          <a
            href={PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#B8F02F", textDecoration: "underline" }}
          >
            open the PDF directly
          </a>
        </div>
      </div>
    );
  }

  const btnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    minWidth: 44,
    padding: "10px 20px",
    borderRadius: 999,
    border: "1px solid #3A3A3A",
    background: "#242424",
    color: "#EAEAEA",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.08em",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
    userSelect: "none",
    WebkitUserSelect: "none",
    transition: "border-color 0.15s, background 0.15s, transform 0.1s",
  };

  const disabledStyle: React.CSSProperties = {
    opacity: 0.35,
    cursor: "default",
  };

  const prevDisabled = page <= 1;
  const nextDisabled = total > 0 && page >= total;

  return (
    <div
      role="region"
      aria-label="Portfolio document viewer"
      style={{ position: "relative" }}
    >
      {/* ===== page stage ===== */}
      <div
        ref={stageRef}
        className="pdf-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: `${Math.max(ratio, 0.4)} / ${1}`,
          /* max-height is set in globals.css (.pdf-stage) so it can be
             upgraded to dvh on phones that support it */
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#161616",
          border: "1px solid #333",
          borderRadius: 6,
          touchAction: "pan-y",
          opacity: flip ? 0.55 : 1,
          transition: "opacity 0.18s ease",
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label={`Portfolio page ${page} of ${total || "?"}`}
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: "100%",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            boxShadow: "0 4px 32px rgba(0, 0, 0, 0.45)",
          }}
        />

        {/* loading overlay (first load) */}
        {status === "loading" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              color: "#8A8A8A",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            <span
              className="pdf-spinner"
              aria-hidden
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "2px solid #333",
                borderTopColor: "#B8F02F",
                display: "block",
              }}
            />
            Loading portfolio…
          </div>
        )}

        {/* subtle page-turn indicator */}
        {rendering && status === "ready" && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#B8F02F",
              opacity: 0.85,
            }}
          />
        )}

        {/* page badge */}
        {status === "ready" && (
          <div
            aria-live="polite"
            style={{
              position: "absolute",
              top: 10,
              left: 12,
              background: "rgba(22, 22, 22, 0.82)",
              border: "1px solid #333",
              borderRadius: 999,
              padding: "5px 12px",
              fontSize: 11,
              letterSpacing: "0.15em",
              color: "#B8F02F",
              fontFamily: "var(--font-geist-mono), monospace",
              pointerEvents: "none",
            }}
          >
            {page} / {total || "—"}
          </div>
        )}
      </div>

      {/* ===== click controls ===== */}
      {status === "ready" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 14,
          }}
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={prevDisabled}
            aria-label="Previous page"
            className="tap-scale"
            style={{ ...btnStyle, ...(prevDisabled ? disabledStyle : {}) }}
          >
            <span aria-hidden style={{ fontSize: 15 }}>‹</span> Prev
          </button>

          {/* clickable page dots — jump straight to any page */}
          <div
            role="group"
            aria-label="Go to page"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "4px 10px",
            }}
          >
            {Array.from({ length: total || 0 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-label={`Go to page ${n}`}
                aria-current={n === page ? "page" : undefined}
                className="pdf-dot"
                style={{
                  width: n === page ? 22 : 9,
                  height: 9,
                  borderRadius: 999,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  background: n === page ? "#B8F02F" : "#4A4A4A",
                  transition: "width 0.2s ease, background 0.2s ease",
                  WebkitTapHighlightColor: "transparent",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => (total ? Math.min(p + 1, total) : p + 1))}
            disabled={nextDisabled}
            aria-label="Next page"
            className="tap-scale"
            style={{ ...btnStyle, ...(nextDisabled ? disabledStyle : {}) }}
          >
            Next <span aria-hidden style={{ fontSize: 15 }}>›</span>
          </button>

          <button
            type="button"
            onClick={() => window.open(PDF_URL, "_blank", "noopener,noreferrer")}
            aria-label="Open PDF full screen in a new tab"
            title="Open full screen (pinch to zoom)"
            className="tap-scale"
            style={{ ...btnStyle, minWidth: 44, padding: "10px 14px" }}
          >
            <span aria-hidden style={{ fontSize: 14 }}>⤢</span>
          </button>
        </div>
      )}

      <style>{`
        .pdf-spinner { animation: pdfspin 0.9s linear infinite; }
        @keyframes pdfspin { to { transform: rotate(360deg); } }
        .pdf-dot { touch-action: manipulation; }
        @media (pointer: fine) {
          .pdf-dot:hover { background: #B8F02F; }
        }
      `}</style>
    </div>
  );
}
