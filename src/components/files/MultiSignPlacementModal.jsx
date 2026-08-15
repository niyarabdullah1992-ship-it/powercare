import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { STAMP_CANVAS_HEIGHT, STAMP_CANVAS_WIDTH, STAMP_MAX_SCALE, STAMP_WIDTH_PERCENT } from "@/lib/signatureStampGeometry";
import PlacementToolbar from "@/components/files/PlacementToolbar";
import StampOnPage from "@/components/files/StampOnPage";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
const COLORS = ["#1E9E63", "#14284B", "#0F766E", "#1D4E89", "#15803D", "#5A6B85", "#047857", "#334155"];
const normalize = (value = {}) => Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Array.isArray(item) ? item : item ? [{ ...item, id: `legacy-${key}`, type: "signature", label: "" }] : []]));
const fieldWidth = (field) => (field.type === "text" ? 26 : STAMP_WIDTH_PERCENT) * ((field.scale || 100) / 100);
const fieldHalfHeight = (field, rect) => field.type === "signature" ? fieldWidth(field) * (rect.width / rect.height) * (STAMP_CANVAS_HEIGHT / STAMP_CANVAS_WIDTH) / 2 : 3;
const scaleBounds = (field) => field?.type === "signature" ? [40, STAMP_MAX_SCALE] : [50, 200];
const clampScale = (field, value) => { const [min, max] = scaleBounds(field); return Math.min(max, Math.max(min, Math.round(value))); };

export default function MultiSignPlacementModal({ docUrl, signers, initialSpots, signaturePreviews = [], activeSigner, onActiveSignerChange, ar, onConfirm, onChange, onClose, embedded = false }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [active, setActive] = useState(activeSigner || 0);
  const [fieldType, setFieldType] = useState("signature");
  const [spots, setSpots] = useState(() => normalize(initialSpots));
  const [selectedId, setSelectedId] = useState(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 600, height: 600 });
  const stateRef = useRef({ active, spots, selectedId });
  stateRef.current = { active, spots, selectedId };

  const selected = useMemo(() => (spots[active] || []).find((field) => field.id === selectedId) || null, [spots, active, selectedId]);
  useEffect(() => { if (typeof activeSigner === "number") setActive(Math.max(0, Math.min(signers.length - 1, activeSigner))); }, [activeSigner, signers.length]);
  useEffect(() => { setSpots(normalize(initialSpots)); setSelectedId(null); }, [docUrl]);
  useEffect(() => { onChange?.(spots); }, [spots]);
  const updateField = (signerIndex, id, patch) => setSpots((current) => ({ ...current, [signerIndex]: (current[signerIndex] || []).map((field) => field.id === id ? { ...field, ...patch } : field) }));
  const removeField = (signerIndex, id) => { setSpots((current) => ({ ...current, [signerIndex]: (current[signerIndex] || []).filter((field) => field.id !== id) })); setSelectedId(null); };
  const startResize = (event, signerIndex, field) => {
    event.stopPropagation(); event.preventDefault();
    const startX = event.clientX; const startScale = field.scale || 100; const width = wrapRef.current?.clientWidth || 600;
    const move = (moveEvent) => updateField(signerIndex, field.id, { scale: clampScale(field, startScale + ((moveEvent.clientX - startX) / width) * 400) });
    const end = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", end);
  };
  const startDrag = (event, signerIndex, field) => {
    if (event.target.closest("button") || event.target.dataset.resize) return;
    event.stopPropagation(); event.preventDefault(); setActive(signerIndex); setSelectedId(field.id);
    const rect = wrapRef.current.getBoundingClientRect(); const startX = event.clientX; const startY = event.clientY; const originX = field.x; const originY = field.y; const halfWidth = fieldWidth(field) / 2; const halfHeight = fieldHalfHeight(field, rect);
    const move = (moveEvent) => updateField(signerIndex, field.id, { x: Math.min(100 - halfWidth, Math.max(halfWidth, originX + ((moveEvent.clientX - startX) / rect.width) * 100)), y: Math.min(100 - halfHeight, Math.max(halfHeight, originY + ((moveEvent.clientY - startY) / rect.height) * 100)) });
    const end = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", end);
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let startDist = 0; let startScale = 100;
    const distance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    const start = (event) => { if (event.touches.length === 2) { startDist = distance(event.touches); const current = (stateRef.current.spots[stateRef.current.active] || []).find((field) => field.id === stateRef.current.selectedId); startScale = current?.scale || 100; } };
    const move = (event) => { if (event.touches.length !== 2 || !startDist) return; if (event.cancelable) event.preventDefault(); const { active: signerIndex, selectedId: id, spots: currentSpots } = stateRef.current; if (!id) return; const current = (currentSpots[signerIndex] || []).find((field) => field.id === id); updateField(signerIndex, id, { scale: clampScale(current, startScale * distance(event.touches) / startDist) }); };
    const end = () => { startDist = 0; };
    el.addEventListener("touchstart", start, { passive: true }); el.addEventListener("touchmove", move, { passive: false }); el.addEventListener("touchend", end); el.addEventListener("touchcancel", end);
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchmove", move); el.removeEventListener("touchend", end); el.removeEventListener("touchcancel", end); };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const updateSize = () => setStageSize({ width: stage.clientWidth, height: stage.clientHeight });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { let cancelled = false; (async () => { try { const bytes = await fetch(docUrl).then((response) => { if (!response.ok) throw new Error("PDF download failed"); return response.arrayBuffer(); }); const loaded = await pdfjsLib.getDocument({ data: bytes }).promise; if (!cancelled) { setPdfDoc(loaded); setNumPages(loaded.numPages); } } catch { if (!cancelled) { setLoadError(true); setLoading(false); } } })(); return () => { cancelled = true; }; }, [docUrl]);
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !stageSize.width || !stageSize.height) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const previousTask = renderTaskRef.current;
      if (previousTask) {
        previousTask.cancel();
        try { await previousTask.promise; } catch { /* Expected cancellation. */ }
      }
      if (cancelled) return;
      const pdfPage = await pdfDoc.getPage(page);
      if (cancelled) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const cssScale = Math.min((stageSize.width - 8) / base.width, (stageSize.height - 8) / base.height);
      const displayWidth = base.width * cssScale;
      const displayHeight = base.height * cssScale;
      const viewport = pdfPage.getViewport({ scale: cssScale * (window.devicePixelRatio || 1) });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      canvas.style.direction = "ltr";
      if (wrapRef.current) {
        wrapRef.current.style.width = `${displayWidth}px`;
        wrapRef.current.style.height = `${displayHeight}px`;
      }
      const context = canvas.getContext("2d");
      context.direction = "ltr";
      const task = pdfPage.render({ canvasContext: context, viewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
        if (!cancelled) setLoading(false);
      } catch (error) {
        if (error?.name !== "RenderingCancelledException") throw error;
      } finally {
        if (renderTaskRef.current === task) renderTaskRef.current = null;
      }
    })();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdfDoc, page, stageSize]);

  const placeField = (event) => {
    if (event.target !== wrapRef.current && event.target !== canvasRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = Math.min(96, Math.max(4, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(96, Math.max(4, ((event.clientY - rect.top) / rect.height) * 100));
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const draft = { type: fieldType, scale: 100 };
    const halfWidth = fieldType === "text" ? 13 : STAMP_WIDTH_PERCENT / 2;
    const halfHeight = fieldHalfHeight(draft, rect);
    const field = { id, type: fieldType, label: fieldType === "text" ? (ar ? "اكتب النص هنا" : "Enter text") : "", page, x: Math.min(100 - halfWidth, Math.max(halfWidth, x)), y: Math.min(100 - halfHeight, Math.max(halfHeight, y)), scale: 100 };
    setSpots((current) => ({ ...current, [active]: [...(current[active] || []), field] })); setSelectedId(id);
  };
  const allPlaced = signers.every((_, index) => (spots[index] || []).some((field) => field.type === "signature"));

  return <div className={embedded ? "w-full min-w-0" : "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"} onClick={embedded ? undefined : onClose}>
    <div className={embedded ? "flex h-full min-h-[420px] w-full flex-col overflow-hidden bg-white" : "flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"} onClick={(event) => event.stopPropagation()}>
      {!embedded && <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3"><div><div className="text-sm font-semibold text-[#14284B]">{ar ? "توزيع حقول المستند" : "Document field placement"}</div><p className="mt-1 text-xs text-[#5A6B85]">{ar ? "اختر الموقّع ثم انقر على الصفحة لإضافة الحقل." : "Choose a signer, then click the page to add the field."}</p></div><button type="button" onClick={onClose} className="rounded-lg border border-[#E2E8F0] p-1.5"><X className="h-3.5 w-3.5" /></button></div>}
      <PlacementToolbar ar={ar} fieldType={fieldType} setFieldType={setFieldType} signers={signers} spots={spots} active={active} setActive={(index) => { setActive(index); onActiveSignerChange?.(index); setSelectedId(null); }} colors={COLORS} />
      <p className="px-4 pt-2 text-[11px] text-[#5A6B85]">{ar ? "اسحب الحقل لضبط مكانه. انقر على الصفحة لإضافة حقل جديد." : "Drag a field to move it. Click the page to add another field."}</p>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F7F8FA] p-3"><div ref={stageRef} className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-1"><div ref={wrapRef} dir="ltr" onClick={placeField} className="relative cursor-crosshair bg-white" style={{ touchAction: "none", direction: "ltr", border: "1px solid #E2E8F0", borderRadius: 8 }}><canvas ref={canvasRef} dir="ltr" className="block" />
        {loading && !loadError && <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>}
        {loadError && <div className="flex min-h-64 items-center justify-center p-6 text-sm text-muted-foreground">{ar ? "تعذّر عرض الملف." : "Couldn't preview this file."}</div>}
        {signers.flatMap((signer, signerIndex) => (spots[signerIndex] || []).map((field) => ({ signer, signerIndex, field }))).filter(({ field }) => field.page === page).map(({ signer, signerIndex, field }) => {
          const color = COLORS[signerIndex % COLORS.length];
          const isSelected = selectedId === field.id;
          return (
            <div
              key={field.id}
              onPointerDown={(event) => startDrag(event, signerIndex, field)}
              className={`absolute cursor-move ${field.type === "text" ? "rounded-lg border border-[#14284B] bg-[#F7F8FA]/95 px-1.5 py-1 text-center" : ""}`}
              style={{ left: `${field.x}%`, top: `${field.y}%`, width: `${fieldWidth(field)}%`, minHeight: field.type === "text" ? 34 : undefined, aspectRatio: field.type === "signature" ? `${STAMP_CANVAS_WIDTH} / ${STAMP_CANVAS_HEIGHT}` : undefined, transform: "translate(-50%, -50%)", zIndex: isSelected ? 3 : 1 }}
            >
              {field.type === "signature" ? (
                <StampOnPage src={signaturePreviews[signerIndex]} name={signer.name} color={color} selected={isSelected} onRemove={() => removeField(signerIndex, field.id)} onResizeStart={(event) => startResize(event, signerIndex, field)} />
              ) : (
                <>
                  <p className="truncate text-[10px] font-semibold text-[#14284B]">{field.label || (ar ? "اكتب النص هنا" : "Enter text")}</p>
                  {isSelected ? (
                    <>
                      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); removeField(signerIndex, field.id); }} className="absolute -end-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#DC2626] text-white"><X className="h-3 w-3" /></button>
                      <span data-resize="true" onPointerDown={(event) => startResize(event, signerIndex, field)} className="absolute -bottom-2 -end-2 h-4 w-4 cursor-se-resize rounded-sm border-2 border-white bg-[#1E9E63] shadow" />
                    </>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </div></div></div>
      {selected && <div className="space-y-2 border-t border-border px-4 py-2.5"><div className="flex items-center gap-3">{selected.type === "text" && <input value={selected.label || ""} onChange={(event) => updateField(active, selected.id, { label: event.target.value.slice(0, 60) })} placeholder={ar ? "عنوان الحقل" : "Field label"} className="min-w-0 flex-1 rounded-md border border-input px-2.5 py-1.5 text-xs" />}<span className="text-[11px] text-muted-foreground">{ar ? "الحجم" : "Size"} {selected.scale}%</span></div><input type="range" min={scaleBounds(selected)[0]} max={scaleBounds(selected)[1]} step="5" value={selected.scale || 100} onChange={(event) => updateField(active, selected.id, { scale: Number(event.target.value) })} className="w-full accent-current" /></div>}
      <div className="flex items-center justify-between gap-2 border-t border-[#E2E8F0] bg-white px-4 py-3"><div className="flex items-center gap-1.5 text-xs text-[#5A6B85]"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-lg border border-[#E2E8F0] p-1.5 disabled:opacity-40">{ar ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}</button><span>{page} / {numPages}</span><button type="button" onClick={() => setPage((value) => Math.min(numPages, value + 1))} disabled={page === numPages} className="rounded-lg border border-[#E2E8F0] p-1.5 disabled:opacity-40">{ar ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button></div>{embedded ? <span className={`inline-flex items-center gap-2 text-[11px] font-semibold ${allPlaced ? "text-[#15803D]" : "text-[#5A6B85]"}`}><CheckCircle2 className="h-3.5 w-3.5" />{allPlaced ? (ar ? "حقول الجميع جاهزة" : "All signer fields placed") : (ar ? "أضف توقيعًا لكل موقّع" : "Add a field for every signer")}</span> : <button type="button" onClick={() => onConfirm(spots)} disabled={!allPlaced} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1E9E63] px-4 text-xs font-semibold text-white disabled:opacity-40"><CheckCircle2 className="h-3.5 w-3.5" />{ar ? "تثبيت الحقول" : "Confirm fields"}</button>}</div>
    </div>
  </div>;
}