import React, { useRef, useState } from "react";
import { Check, Eraser, Minus, PenTool, Plus } from "lucide-react";
import { makeSignatureStamp } from "@/lib/multiSignStamp";
import { generateVerificationId } from "@/lib/verificationBadge";
import { BORDER, MUTED, NAVY, ui, CARD, SURFACE } from "@/lib/platformStyles";
import StampPreview from "./StampPreview";

const INKS = [
  { value: "#14284B", label: "Navy" },
  { value: "#1E9E63", label: "Green" },
  { value: "#111827", label: "Black" },
];

export default function SignaturePad({ ar, signerName, verificationId, stampTheme = "heritage", onPreview, onSave, saving }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const previous = useRef(null);
  const inkRef = useRef(false);
  const [stamp, setStamp] = useState("");
  const [inkColor, setInkColor] = useState(INKS[0].value);
  const [thickness, setThickness] = useState(5);
  const [sealId] = useState(() => verificationId || generateVerificationId());

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height), time: performance.now() };
  };
  const start = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawing.current = true;
    previous.current = { ...point(event), width: thickness };
  };
  const move = (event) => {
    if (!drawing.current || !previous.current) return;
    event.preventDefault();
    const current = point(event);
    const last = previous.current;
    const velocity = Math.hypot(current.x - last.x, current.y - last.y) / Math.max(current.time - last.time, 1);
    const target = Math.max(1.5, Math.min(11, thickness + 2.2 - velocity * 2.4));
    const width = last.width * 0.65 + target * 0.35;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.quadraticCurveTo(last.x, last.y, (last.x + current.x) / 2, (last.y + current.y) / 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = width;
    ctx.strokeStyle = inkColor;
    ctx.stroke();
    previous.current = { ...current, width };
    inkRef.current = true;
  };
  const end = async () => {
    drawing.current = false;
    previous.current = null;
    if (!inkRef.current) return;
    try {
      const composed = await makeSignatureStamp(canvasRef.current.toDataURL("image/png"), signerName, sealId, "drawn", stampTheme);
      setStamp(composed);
      onPreview?.(composed);
    } catch {
      setStamp("");
      onPreview?.("");
    }
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    inkRef.current = false;
    setStamp("");
    onPreview?.("");
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, padding: 8, border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: MUTED }}>{ar ? "لون الخط" : "Ink"}</span>
          {INKS.map((ink) => (
            <button
              key={ink.value}
              type="button"
              onClick={() => setInkColor(ink.value)}
              aria-label={ink.label}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: ink.value,
                border: inkColor === ink.value ? "2px solid #1E9E63" : `1px solid ${BORDER}`,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: MUTED }}>{ar ? "السُمك" : "Width"}</span>
          <button type="button" onClick={() => setThickness((value) => Math.max(2, value - 1))} style={ui.btnGhost}><Minus style={{ width: 14, height: 14 }} /></button>
          <span style={{ width: 16, textAlign: "center", fontSize: 11, color: NAVY }}>{thickness}</span>
          <button type="button" onClick={() => setThickness((value) => Math.min(10, value + 1))} style={ui.btnGhost}><Plus style={{ width: 14, height: 14 }} /></button>
        </div>
      </div>
      <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED }}>
        <PenTool style={{ width: 13, height: 13, color: "#1E9E63" }} />
        {ar ? "ارسم توقيعك داخل الإطار" : "Draw your signature inside the frame"}
      </p>
      <canvas
        ref={canvasRef}
        width={900}
        height={260}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
        style={{ width: "100%", height: 112, touchAction: "none", cursor: "crosshair", borderRadius: 10, border: `1px dashed ${BORDER}`, background: CARD }}
      />
      <StampPreview src={stamp} sealId={sealId} ar={ar} />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "auto 1fr" }}>
        <button type="button" onClick={clear} style={{ ...ui.btnGhost, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Eraser style={{ width: 14, height: 14 }} />
          {ar ? "مسح" : "Clear"}
        </button>
        <button
          type="button"
          disabled={!stamp || saving}
          onClick={() => onSave(canvasRef.current.toDataURL("image/png"), signerName, "drawn", sealId)}
          style={{ ...ui.btnPrimary, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: !stamp || saving ? 0.45 : 1 }}
        >
          <Check style={{ width: 14, height: 14 }} />
          {saving ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ التوقيع" : "Save signature")}
        </button>
      </div>
    </div>
  );
}
