import React, { useState, useEffect, useRef } from "react";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, X, MousePointerClick } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Signer-side spot picker: the signer clicks anywhere on the document to
// choose where their own signature will be stamped. Pinch with two fingers
// (or use the slider) to resize the signature.
export default function SignSpotPicker({ docUrl, initialSpot, initialScale = 100, signerName, ar, onConfirm, onClose }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(initialSpot?.page || 1);
  const [numPages, setNumPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [spot, setSpot] = useState(initialSpot || null); // {page,x,y}
  const [scale, setScale] = useState(initialScale); // signature size % (50–200)
  const scaleRef = useRef(initialScale);
  scaleRef.current = scale;
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  // Pinch-to-resize: two fingers on the preview adjust the signature size.
  // Attached natively with { passive: false } so preventDefault blocks the
  // browser's page-zoom only during a two-finger pinch — scrolling stays free.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let startDist = 0;
    let startScale = 100;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        startScale = scaleRef.current;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2 && startDist > 0) {
        if (e.cancelable) e.preventDefault();
        const next = Math.round(startScale * (dist(e.touches) / startDist));
        setScale(Math.min(200, Math.max(50, next)));
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
    setSpot({ page, x, y });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-body font-medium flex items-center gap-1.5">
            <MousePointerClick className="w-4 h-4 text-accent" />
            {ar ? "انقر على مكان التوقيع — واقرص بإصبعين للتكبير/التصغير" : "Tap where you want to sign — pinch to resize"}
          </p>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
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
                {ar ? "تعذّر عرض معاينة الملف — أغلق النافذة وسيُوضع التوقيع في المكان الافتراضي." : "Couldn't preview this file — close this window and the signature will use the default spot."}
              </div>
            )}
            {spot && spot.page === page && (
              <div
                className="absolute pointer-events-none rounded-md px-1.5 py-1 text-center"
                style={{
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  width: `${22 * (scale / 100)}%`,
                  transform: "translate(-50%, -50%)",
                  border: "2px solid #b45309",
                  backgroundColor: "#b453091a",
                }}
              >
                <p className="text-[10px] font-body font-medium truncate" style={{ color: "#b45309" }}>{signerName}</p>
                <div className="h-6" />
              </div>
            )}
          </div>
        </div>

        {/* Size control — mirrors the pinch gesture for non-touch devices */}
        <div className="px-4 py-2.5 border-t border-border space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-body">
            <span>{ar ? "حجم التوقيع" : "Signature size"}</span>
            <span dir="ltr">{scale}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={200}
            step={5}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full accent-current"
          />
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
              onClick={() => onConfirm(spot, scale)}
              disabled={!spot}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-40"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {ar ? "تثبيت مكان التوقيع" : "Confirm spot"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}