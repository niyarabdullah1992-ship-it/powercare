import React, { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

export default function QrScanner({ value, onChange, ar }) {
  const videoRef = useRef(null); const streamRef = useRef(null); const [open, setOpen] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (!open) return; let timer; (async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); streamRef.current = stream; videoRef.current.srcObject = stream; await videoRef.current.play();
      if (!("BarcodeDetector" in window)) { setError(ar ? "المسح التلقائي غير مدعوم؛ أدخل الرمز يدويًا." : "Automatic scanning is unsupported; enter the code manually."); return; }
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] }); timer = setInterval(async () => { const found = await detector.detect(videoRef.current).catch(() => []); if (found[0]?.rawValue) { onChange(found[0].rawValue); setOpen(false); } }, 500);
    } catch { setError(ar ? "تعذر تشغيل الكاميرا. اسمح بالوصول أو أدخل الرمز يدويًا." : "Camera unavailable. Allow access or enter the code manually."); }
  })(); return () => { clearInterval(timer); streamRef.current?.getTracks().forEach((track) => track.stop()); }; }, [open]);
  return <div className="space-y-2"><div className="flex gap-2"><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={ar ? "رمز QR" : "QR code"} className="min-w-0 flex-1 rounded-lg border px-3 py-2" /><button type="button" onClick={() => { setError(""); setOpen(true); }} className="rounded-lg border p-2"><Camera className="h-5 w-5" /></button></div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-md"><button onClick={() => setOpen(false)} className="mb-3 text-white"><X /></button><video ref={videoRef} playsInline muted className="aspect-square w-full rounded-2xl bg-black object-cover" /><p className="mt-3 text-center text-sm text-white">{error || (ar ? "وجّه الكاميرا نحو رمز QR" : "Point the camera at the QR code")}</p></div></div>}
  </div>;
}