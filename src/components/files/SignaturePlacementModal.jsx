import React, { useState, useEffect, useRef } from "react";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, X, MousePointerClick } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// DocuSign-style placement: preview the document's pages and click exactly
// where the signature should be stamped. Returns { page, x, y } — the center
// of the signature as percentages measured from the page's top-left corner.
export default function SignaturePlacementModal({ doc, signatureUrl, ar, onConfirm, onClose }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [spot, setSpot] = useState(null); // { page, x, y } in %
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  // Load the PDF once.
  useEffect(() => {
    if (!doc.isPdf) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const loaded = await pdfjsLib.getDocument(doc.url).promise;
      if (cancelled) return;
      setPdfDoc(loaded);
      setNumPages(loaded.numPages);
    })();
    return () => { cancelled = true; };
  }, [doc.url, doc.isPdf]);

  // Render the current page onto the canvas.
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
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSpot({ page, x: Math.min(Math.max(x, 2), 98), y: Math.min(Math.max(y, 2), 98) });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-body font-medium flex items-center gap-1.5">
            <MousePointerClick className="w-4 h-4 text-accent" />
            {ar ? "انقر على المكان الذي تريد وضع التوقيع فيه" : "Click where you want to place the signature"}
          </p>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        {/* Page preview */}
        <div className="flex-1 overflow-auto bg-muted/50 p-4">
          <div ref={wrapRef} onClick={handleClick} className="relative mx-auto max-w-full cursor-crosshair bg-white shadow-md">
            {doc.isPdf ? (
              <canvas ref={canvasRef} className="block w-full" />
            ) : (
              <img src={doc.url} alt="" className="block w-full" onLoad={() => setLoading(false)} draggable={false} />
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            )}
            {/* Signature preview at the chosen spot */}
            {spot && spot.page === page && (
              <div
                className="absolute pointer-events-none border-2 border-accent rounded-md bg-accent/10 p-1"
                style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: "24%", transform: "translate(-50%, -50%)" }}
              >
                {signatureUrl ? (
                  <img src={signatureUrl} alt="signature" className="w-full" draggable={false} />
                ) : (
                  <div className="h-8" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border">
          {doc.isPdf && numPages > 1 ? (
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
              onClick={() => onConfirm(spot)}
              disabled={!spot}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-40"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {ar ? "تثبيت مكان التوقيع" : "Confirm placement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}