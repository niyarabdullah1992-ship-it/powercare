import React, { useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";

export default function QrScanner({ value, onChange, ar }) {
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [reading, setReading] = useState(false);

  const readImage = async (file) => {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file)); setReading(true); setStatus(""); onChange("");
    try {
      const bitmap = await window.createImageBitmap(file); let code = "";
      if ("BarcodeDetector" in window) {
        const detected = await new window.BarcodeDetector().detect(bitmap).catch(() => []);
        code = detected[0]?.rawValue || "";
      } else {
        const { default: jsQR } = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/+esm");
        const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
        const context = canvas.getContext("2d", { willReadFrequently: true }); context.drawImage(bitmap, 0, 0);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        code = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" })?.data || "";
      }
      bitmap.close();
      if (code) { onChange(code); setStatus(ar ? `تمت القراءة: ${code}` : `Code read: ${code}`); }
      else setStatus(ar ? "تعذرت قراءة الباركود من الصورة." : "No barcode could be read from this image.");
    } catch {
      setStatus(ar ? "تعذرت معالجة الصورة. استخدم JPEG أو PNG واضحاً." : "The image could not be processed. Use a clear JPEG or PNG.");
    } finally { setReading(false); }
  };

  return <div className="space-y-3">
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4 text-sm font-medium text-accent"><input type="file" accept="image/jpeg,image/png,image/*" className="hidden" onChange={(event) => readImage(event.target.files?.[0])} />{reading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageUp className="h-5 w-5" />}{ar ? "رفع صورة الباركود" : "Upload barcode image"}</label>
    {preview && <img src={preview} alt={ar ? "معاينة الباركود" : "Barcode preview"} className="h-28 w-full rounded-xl border object-contain" />}
    {status && <p className={`rounded-lg px-3 py-2 text-xs ${value ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{status}</p>}
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={ar ? "أو أدخل الكود يدوياً" : "Or enter the code manually"} className="w-full rounded-lg border px-3 py-2" />
  </div>;
}