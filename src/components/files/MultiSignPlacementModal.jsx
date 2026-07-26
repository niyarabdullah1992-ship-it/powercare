import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { STAMP_CANVAS_HEIGHT, STAMP_CANVAS_WIDTH, STAMP_MAX_SCALE, STAMP_MIN_SCALE, STAMP_WIDTH_PERCENT } from "@/lib/signatureStampGeometry";
import PlacementToolbar from "@/components/files/PlacementToolbar";
import { Image } from "@/components/ui/image";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
const COLORS = ["#b45309", "#0369a1", "#15803d", "#7c3aed", "#be123c", "#0f766e", "#a16207", "#4338ca"];
const normalize = (value = {}) => Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Array.isArray(item) ? item : item ? [{ ...item, id: `legacy-${key}`, type: "signature", label: "" }] : []]));
const fieldWidth = (field) => (field.type === "text" ? 26 : STAMP_WIDTH_PERCENT) * ((field.scale || 100) / 100);
const fieldHalfHeight = (field, rect) => field.type === "signature" ? fieldWidth(field) * (rect.width / rect.height) * (STAMP_CANVAS_HEIGHT / STAMP_CANVAS_WIDTH) / 2 : 3;
const scaleBounds = (field) => field?.type === "signature" ? [40, STAMP_MAX_SCALE] : [50, 200];
const clampScale = (field, value) => { const [min, max] = scaleBounds(field); return Math.min(max, Math.max(min, Math.round(value))); };

export default function MultiSignPlacementModal({ docUrl, signers, initialSpots, signaturePreviews = [], ar, onConfirm, onClose }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [active, setActive] = useState(0);
  const [fieldType, setFieldType] = useState("signature");
  const [spots, setSpots] = useState(() => normalize(initialSpots));
  const [selectedId, setSelectedId] = useState(null);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef({ active, spots, selectedId });
  stateRef.current = { active, spots, selectedId };

  const selected = useMemo(() => (spots[active] || []).find((field) => field.id === selectedId) || null, [spots, active, selectedId]);
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

  useEffect(() => { let cancelled = false; (async () => { try { const bytes = await fetch(docUrl).then((response) => { if (!response.ok) throw new Error("PDF download failed"); return response.arrayBuffer(); }); const loaded = await pdfjsLib.getDocument({ data: bytes }).promise; if (!cancelled) { setPdfDoc(loaded); setNumPages(loaded.numPages); } } catch { if (!cancelled) { setLoadError(true); setLoading(false); } } })(); return () => { cancelled = true; }; }, [docUrl]);
  useEffect(() => { if (!pdfDoc || !canvasRef.current) return; let cancelled = false; (async () => { setLoading(true); const pdfPage = await pdfDoc.getPage(page); if (cancelled) return; const base = pdfPage.getViewport({ scale: 1 }); const scale = Math.min((wrapRef.current?.clientWidth || 600) / base.width, 1.5) * (window.devicePixelRatio || 1); const viewport = pdfPage.getViewport({ scale }); const canvas = canvasRef.current; canvas.width = viewport.width; canvas.height = viewport.height; canvas.style.width = "100%"; canvas.style.direction = "ltr"; const context = canvas.getContext("2d"); context.direction = "ltr"; await pdfPage.render({ canvasContext: context, viewport }).promise; if (!cancelled) setLoading(false); })(); return () => { cancelled = true; }; }, [pdfDoc, page]);

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

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
    <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-accent/20 bg-card shadow-elevated" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5"><div><p className="text-[10px] font-bold uppercase tracking-widest text-accent">PowerCare Field Studio</p><h2 className="mt-1 font-heading text-2xl font-semibold">{ar ? "توزيع حقول المستند" : "Document field placement"}</h2><p className="mt-1 text-xs text-muted-foreground">{ar ? "اختر الموقّع ونوع الحقل، ثم انقر على الصفحة لإضافته واسحبه لضبط موقعه." : "Choose a signer and field type, then click the page to add it and drag to refine its position."}</p></div><button onClick={onClose} className="rounded-xl border border-border p-2.5 hover:bg-muted"><X className="h-4 w-4" /></button></div>
      <PlacementToolbar ar={ar} fieldType={fieldType} setFieldType={setFieldType} signers={signers} spots={spots} active={active} setActive={(index) => { setActive(index); setSelectedId(null); }} colors={COLORS} />
      <div className="min-h-0 flex-1 overflow-auto bg-secondary/60 p-4 sm:p-6"><div className="mx-auto mb-4 max-w-2xl rounded-xl border border-accent/20 bg-card px-4 py-3 text-center text-xs text-muted-foreground">{ar ? "يمكنك إضافة عدة توقيعات ونصوص لكل موقّع. حدّد أي حقل لتغيير حجمه أو حذفه." : "Add multiple signatures and text fields per signer. Select any field to resize or remove it."}</div><div ref={wrapRef} dir="ltr" onClick={placeField} className="relative mx-auto max-w-full cursor-crosshair bg-white shadow-md" style={{ touchAction: "pan-y", direction: "ltr" }}><canvas ref={canvasRef} dir="ltr" className="block w-full" />
        {loading && !loadError && <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>}
        {loadError && <div className="flex min-h-64 items-center justify-center p-6 text-sm text-muted-foreground">{ar ? "تعذّر عرض الملف." : "Couldn't preview this file."}</div>}
        {signers.flatMap((signer, signerIndex) => (spots[signerIndex] || []).map((field) => ({ signer, signerIndex, field }))).filter(({ field }) => field.page === page).map(({ signer, signerIndex, field }) => <div key={field.id} onPointerDown={(event) => startDrag(event, signerIndex, field)} className={`absolute cursor-move rounded-md px-1.5 py-1 text-center ${field.type === "text" ? "border-2 border-dashed border-blue-600 bg-blue-50/90" : "border-2"}`} style={{ left: `${field.x}%`, top: `${field.y}%`, width: `${fieldWidth(field)}%`, minHeight: field.type === "text" ? 34 : undefined, aspectRatio: field.type === "signature" ? `${STAMP_CANVAS_WIDTH} / ${STAMP_CANVAS_HEIGHT}` : undefined, transform: "translate(-50%, -50%)", borderColor: field.type === "signature" ? COLORS[signerIndex % COLORS.length] : undefined, backgroundColor: field.type === "signature" ? `${COLORS[signerIndex % COLORS.length]}1a` : undefined }}>{field.type === "signature" && signaturePreviews[signerIndex] ? <Image src={signaturePreviews[signerIndex]} alt={signer.name} fittingType="fit" className="h-full w-full" /> : <><p className={`truncate text-[9px] font-semibold ${field.type === "text" ? "text-blue-700" : ""}`} style={field.type === "signature" ? { color: COLORS[signerIndex % COLORS.length] } : {}}>{field.type === "text" ? (field.label || (ar ? "اكتب النص هنا" : "Enter text")) : signer.name}</p>{field.type === "signature" && <div className="h-5" />}</>}{selectedId === field.id && <><button onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); removeField(signerIndex, field.id); }} className="absolute -end-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"><X className="h-3 w-3" /></button><span data-resize="true" onPointerDown={(event) => startResize(event, signerIndex, field)} className="absolute -bottom-2 -end-2 h-5 w-5 cursor-se-resize rounded-sm border-2 border-white bg-blue-600 shadow" /></>}</div>)}
      </div></div>
      {selected && <div className="space-y-2 border-t border-border px-4 py-2.5"><div className="flex items-center gap-3">{selected.type === "text" && <input value={selected.label || ""} onChange={(event) => updateField(active, selected.id, { label: event.target.value.slice(0, 60) })} placeholder={ar ? "عنوان الحقل" : "Field label"} className="min-w-0 flex-1 rounded-md border border-input px-2.5 py-1.5 text-xs" />}<span className="text-[11px] text-muted-foreground">{ar ? "الحجم" : "Size"} {selected.scale}%</span></div><input type="range" min={scaleBounds(selected)[0]} max={scaleBounds(selected)[1]} step="5" value={selected.scale || 100} onChange={(event) => updateField(active, selected.id, { scale: Number(event.target.value) })} className="w-full accent-current" /></div>}
      <div className="flex items-center justify-between gap-2 border-t border-border bg-card px-5 py-4 shadow-[0_-8px_24px_hsl(var(--foreground)/0.06)]"><div className="flex items-center gap-1.5 text-xs"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-md border p-1.5 disabled:opacity-40">{ar ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}</button><span>{page} / {numPages}</span><button onClick={() => setPage((value) => Math.min(numPages, value + 1))} disabled={page === numPages} className="rounded-md border p-1.5 disabled:opacity-40">{ar ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button></div><button onClick={() => onConfirm(spots)} disabled={!allPlaced} className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-lg disabled:opacity-40"><CheckCircle2 className="h-4 w-4" />{ar ? "تثبيت الحقول" : "Confirm fields"}</button></div>
    </div>
  </div>;
}