import React, { useState, useEffect, useRef } from "react";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, X, MousePointerClick } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const COLORS = ["#b45309", "#0369a1", "#15803d", "#7c3aed", "#be123c", "#0f766e", "#a16207", "#4338ca", "#c2410c", "#166534"];

// Creator assigns each signer a fixed spot on the document: pick a signer,
// click where they must sign. Each signer can ONLY sign at their own spot.
export default function MultiSignPlacementModal({ docUrl, signers, initialSpots, ar, onConfirm, onClose }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [active, setActive] = useState(0);
  const [spots, setSpots] = useState(initialSpots || {}); // { [signerIndex]: {page,x,y,scale} }
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef({ active: 0, spots: initialSpots || {} });
  stateRef.current = { active, spots };

  // Pinch-to-resize: two fingers on the preview resize the ACTIVE signer's
  // signature spot. Attached natively with { passive: false } so preventDefault
  // blocks the browser's page-zoom only during a two-finger pinch.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let startDist = 0;
    let startScale = 100;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        const { active: a, spots: s } = stateRef.current;
        startScale = s[a]?.scale || 100;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && startDist > 0) {
        if (e.cancelable) e.preventDefault();
        const next = Math.min(200, Math.max(50, Math.round(startScale * (dist(e.touches) / startDist))));
        const { active: a, spots: s } = stateRef.current;
        if (!s[a]) return;
        setSpots({ ...s, [a]: { ...s[a], scale: next } });
      }
    };
    const onTouchEnd = () => { startDist = 0; };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bytes = await fetch(docUrl).then((r) => {
          if (!r.ok) throw new Error("PDF download failed");
          return r.arrayBuffer();
        });
        const loaded = await pdfjsLib.getDocument({ data: bytes }).promise;
        if (cancelled) return;
        setPdfDoc(loaded);
        setNumPages(loaded.numPages);
      } catch {
        if (!cancelled) { setLoadError(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [docUrl]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const p = await pdfDoc.getPage(page);
      if (cancelled) return;
      const containerWidth = wrapRef.current?.clientWidth || 600;
      const base = p.getViewport({ scale: 1 });
      const scale = Math.min(containerWidth / base.width, 1.5) * (window.devicePixelRatio || 1);
      const viewport = p.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = "100%";
      await p.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, page]);

  const handleClick = (e) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 2), 98);
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * 100, 2), 98);
    const next = { ...spots, [active]: { page, x, y, scale: spots[active]?.scale || 100 } };
    setSpots(next);
    // Auto-advance to the next signer without a spot yet.
    const unplaced = signers.findIndex((_, i) => i !== active && !next[i]);
    if (unplaced !== -1) setActive(unplaced);
  };

  const allPlaced = signers.every((_, i) => spots[i]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-body font-medium flex items-center gap-1.5">
            <MousePointerClick className="w-4 h-4 text-accent" />
            {ar ? "اختر موقّعًا وانقر على مكان توقيعه — واقرص بإصبعين للتكبير/التصغير" : "Pick a signer, tap where they must sign — pinch to resize"}
          </p>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* Signer chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border overflow-x-auto no-scrollbar">
          {signers.map((s, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); if (spots[i]) setPage(spots[i].page); }}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-body border transition ${
                active === i ? "text-white border-transparent" : "bg-background hover:bg-muted border-border"
              }`}
              style={active === i ? { backgroundColor: COLORS[i % COLORS.length] } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active === i ? "#fff" : COLORS[i % COLORS.length] }} />
              {s.name}
              {spots[i] && <CheckCircle2 className="w-3 h-3" />}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-auto overscroll-contain bg-muted/50 p-4" style={{ WebkitOverflowScrolling: "touch" }}>
          <div ref={wrapRef} onClick={handleClick} className="relative mx-auto max-w-full cursor-crosshair bg-white shadow-md" style={{ touchAction: "pan-y" }}>
            <canvas ref={canvasRef} className="block w-full" />
            {loading && !loadError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            )}
            {loadError && (
              <div className="min-h-64 flex items-center justify-center p-6 text-center text-sm text-muted-foreground font-body">
                {ar ? "تعذّر عرض معاينة الملف — أغلق النافذة وستُرتَّب التواقيع أسفل الصفحة تلقائيًا." : "Couldn't preview this file — close this window and signatures will be arranged at the bottom automatically."}
              </div>
            )}
            {/* Placed spots on this page */}
            {signers.map((s, i) =>
              spots[i] && spots[i].page === page ? (
                <div
                  key={i}
                  className="absolute pointer-events-none rounded-md px-1.5 py-1 text-center"
                  style={{
                    left: `${spots[i].x}%`,
                    top: `${spots[i].y}%`,
                    width: `${22 * ((spots[i].scale || 100) / 100)}%`,
                    transform: "translate(-50%, -50%)",
                    border: `2px solid ${COLORS[i % COLORS.length]}`,
                    backgroundColor: `${COLORS[i % COLORS.length]}1a`,
                  }}
                >
                  <p className="text-[10px] font-body font-medium truncate" style={{ color: COLORS[i % COLORS.length] }}>{s.name}</p>
                  <div className="h-6" />
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Size control — mirrors the pinch gesture for non-touch devices */}
        {spots[active] && (
          <div className="px-4 py-2.5 border-t border-border space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-body">
              <span>{ar ? `حجم توقيع ${signers[active]?.name || ""}` : `${signers[active]?.name || ""} signature size`}</span>
              <span dir="ltr">{spots[active].scale || 100}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={spots[active].scale || 100}
              onChange={(e) => setSpots({ ...spots, [active]: { ...spots[active], scale: Number(e.target.value) } })}
              className="w-full accent-current"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border">
          {numPages > 1 ? (
            <div className="flex items-center gap-1.5 text-xs font-body">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md border border-border disabled:opacity-40 hover:bg-muted">
                {ar ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
              <span className="text-muted-foreground">{page} / {numPages}</span>
              <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page === numPages} className="p-1.5 rounded-md border border-border disabled:opacity-40 hover:bg-muted">
                {ar ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={() => onConfirm(spots)}
              disabled={!allPlaced}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-40"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {ar ? "تثبيت أماكن التواقيع" : "Confirm placements"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}