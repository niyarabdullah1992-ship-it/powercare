import React, { useEffect, useRef, useState } from "react";
import { Camera, ExternalLink, X } from "lucide-react";
import { getMediaStream, mediaErrorText, openStandalone } from "@/lib/mediaAccess";

export default function QrScanner({ value, onChange, ar }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");

  useEffect(() => {
    if (!open) return;
    let timer;
    let detecting = false;
    (async () => {
      try {
        const stream = await getMediaStream({ video: { facingMode: { ideal: "environment" } }, audio: false });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        let readCode;
        if ("BarcodeDetector" in window) {
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          readCode = async () => (await detector.detect(videoRef.current).catch(() => []))[0]?.rawValue;
        } else {
          const { default: jsQR } = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/+esm");
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { willReadFrequently: true });
          readCode = async () => {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            return jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "attemptBoth" })?.data;
          };
        }
        timer = setInterval(async () => {
          if (detecting || !videoRef.current?.videoWidth) return;
          detecting = true;
          const code = await readCode().catch(() => null);
          detecting = false;
          if (code) { onChange(code); setOpen(false); }
        }, 400);
      } catch (mediaError) {
        const code = mediaError?.code || "failed";
        setErrorCode(code);
        setError(mediaErrorText(code, ar));
      }
    })();
    return () => {
      clearInterval(timer);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open, ar, onChange]);

  return <div className="space-y-2">
    <div className="flex gap-2"><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={ar ? "رمز QR" : "QR code"} className="min-w-0 flex-1 rounded-lg border px-3 py-2" /><button type="button" onClick={() => { setError(""); setErrorCode(""); setOpen(true); }} className="rounded-lg border p-2" aria-label={ar ? "فتح الكاميرا" : "Open camera"}><Camera className="h-5 w-5" /></button></div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-md"><button type="button" onClick={() => setOpen(false)} className="mb-3 text-white"><X /></button><video ref={videoRef} playsInline muted autoPlay className="aspect-square w-full rounded-2xl bg-black object-cover" /><p className="mt-3 text-center text-sm text-white">{error || (ar ? "وجّه الكاميرا نحو رمز QR" : "Point the camera at the QR code")}</p>{errorCode === "embedded" && <button type="button" onClick={openStandalone} className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"><ExternalLink className="h-4 w-4" />{ar ? "فتح التطبيق في نافذة مستقلة" : "Open app in a new tab"}</button>}</div></div>}
  </div>;
}