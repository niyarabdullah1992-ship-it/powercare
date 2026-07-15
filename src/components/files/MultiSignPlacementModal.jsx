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
  const [spots, setSpots] = useState(initialSpots || {}); // { [signerIndex]: {page,x,y} }
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

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
    const next = { ...spots, [active]: { page, x, y } };
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
            {ar ? "اختر موقّعًا ثم انقر على مكان توقيعه" : "Pick a signer, then click where they must sign"}
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
          <div ref={wrapRef} onClick={handleClick} className="relative mx-auto max-w-full cursor-crosshair bg-white shadow-md">
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
                    width: "22%",
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