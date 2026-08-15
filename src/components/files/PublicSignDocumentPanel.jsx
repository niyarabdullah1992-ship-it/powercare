import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Loader2, PenLine, ShieldCheck } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import IdentityCard from "@/components/shared/IdentityCard";
import { ACCENT, BORDER, MUTED, NAVY, SURFACE, ui } from "@/lib/platformStyles";
import { STAMP_CANVAS_HEIGHT, STAMP_CANVAS_WIDTH, STAMP_WIDTH_PERCENT } from "@/lib/signatureStampGeometry";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
const fieldWidth = (field) => (field.type === "text" ? 26 : STAMP_WIDTH_PERCENT) * ((field.scale || 100) / 100);

export default function PublicSignDocumentPanel({ ar, info, textValues, onTextChange, onSignatureClick, interactive = true }) {
  const fields = info.signer.spots || (info.signer.spot ? [{ ...info.signer.spot, id: "signature", type: "signature" }] : []);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(fields[0]?.page || 1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const bytes = await fetch(info.docUrl).then((response) => response.arrayBuffer());
      const loaded = await pdfjsLib.getDocument({ data: bytes }).promise;
      if (!cancelled) {
        setPdfDoc(loaded);
        setPages(loaded.numPages);
      }
    })().catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [info.docUrl]);
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const pdfPage = await pdfDoc.getPage(page);
      const base = pdfPage.getViewport({ scale: 1 });
      const scale = Math.min((wrapRef.current?.clientWidth || 700) / base.width, 1.5) * (window.devicePixelRatio || 1);
      const viewport = pdfPage.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = "100%";
      canvas.style.direction = "ltr";
      const context = canvas.getContext("2d");
      context.direction = "ltr";
      await pdfPage.render({ canvasContext: context, viewport }).promise;
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, page]);

  return (
    <IdentityCard
      icon={FileText}
      kicker={ar ? "المستند والحقول" : "Document & fields"}
      title={info.fileName}
      dir={ar ? "rtl" : "ltr"}
      bodyStyle={{ padding: 0 }}
      meta={pages > 1 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} style={{ ...ui.btnGhost, padding: 6, opacity: page === 1 ? 0.35 : 1 }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </button>
          <span>{page}/{pages}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(pages, value + 1))} disabled={page === pages} style={{ ...ui.btnGhost, padding: 6, opacity: page === pages ? 0.35 : 1 }}>
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      ) : null}
    >
      <div style={{ overflow: "auto", background: SURFACE, padding: 12 }}>
        <div ref={wrapRef} dir="ltr" style={{ position: "relative", margin: "0 auto", background: "#fff", boxShadow: "0 8px 24px rgba(20,40,75,.06)", direction: "ltr" }}>
          <canvas ref={canvasRef} dir="ltr" style={{ display: "block", width: "100%" }} />
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.7)" }}>
              <Loader2 style={{ width: 20, height: 20, color: MUTED }} className="animate-spin" />
            </div>
          )}
          {fields.filter((field) => field.page === page).map((field) => (
            <div
              key={field.id}
              style={{
                position: "absolute",
                left: `${field.x}%`,
                top: `${field.y}%`,
                width: `${fieldWidth(field)}%`,
                minHeight: field.type === "text" ? 42 : undefined,
                aspectRatio: field.type === "signature" ? `${STAMP_CANVAS_WIDTH} / ${STAMP_CANVAS_HEIGHT}` : undefined,
                transform: "translate(-50%, -50%)",
                borderRadius: 8,
                border: `2px solid ${field.type === "text" ? NAVY : ACCENT}`,
                background: field.type === "text" ? "rgba(247,248,250,.95)" : "rgba(255,255,255,.95)",
                padding: field.type === "text" ? 4 : 0,
              }}
            >
              {!interactive ? (
                <div style={{ display: "flex", height: "100%", minHeight: 40, alignItems: "center", justifyContent: "center", gap: 4, padding: "0 4px", textAlign: "center", fontSize: 9, fontWeight: 600, color: field.type === "text" ? NAVY : ACCENT }}>
                  <PenLine style={{ width: 12, height: 12 }} />
                  {field.type === "text" ? (field.label || (ar ? "حقل نص مطلوب" : "Required text field")) : (ar ? "موضع توقيعك" : "Your signature field")}
                </div>
              ) : field.type === "text" ? (
                <label style={{ position: "relative", display: "block", height: "100%" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 8, fontWeight: 600, color: NAVY }}>
                    <PenLine style={{ width: 10, height: 10 }} />
                    {field.label || (ar ? "اكتب النص" : "Enter text")}
                  </span>
                  <input
                    value={textValues[field.id] || ""}
                    onChange={(event) => onTextChange(field.id, event.target.value)}
                    style={{ height: 28, width: "100%", borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", padding: "0 6px", fontSize: 10, color: NAVY, outline: "none" }}
                  />
                </label>
              ) : (
                <button type="button" onClick={onSignatureClick} style={{ display: "flex", height: "100%", minHeight: 48, width: "100%", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 9, fontWeight: 600, color: ACCENT, background: "transparent", border: 0, cursor: "pointer" }}>
                  <PenLine style={{ width: 12, height: 12 }} />
                  {ar ? "اضغط لإضافة التوقيع" : "Tap to add signature"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {info.verificationId ? (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: 16, background: "#fff" }}>
          <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: NAVY }}>
            <ShieldCheck style={{ width: 16, height: 16, color: ACCENT }} />
            {ar ? "معرّف التحقق" : "Verification ID"}
          </p>
          <p dir="ltr" style={{ margin: "8px 0 0", wordBreak: "break-all", borderRadius: 12, background: SURFACE, padding: "8px 12px", fontFamily: "ui-monospace, monospace", fontSize: 10, color: MUTED }}>{info.verificationId}</p>
        </div>
      ) : null}
    </IdentityCard>
  );
}
