import React, { useState } from "react";
import { Loader2, QrCode } from "lucide-react";

const aliases = { provider: ["provider", "brand"], name: ["name", "cameraName"], station: ["stationId", "station", "stationName"], streamUrl: ["streamUrl", "stream_url", "url", "stream"], streamType: ["streamType", "type"], deviceAddress: ["deviceAddress", "address", "ip", "serial"] };
const valueOf = (data, keys) => keys.map((key) => data[key]).find((value) => value != null && value !== "");

function cameraData(raw, stations) {
  let data;
  try { data = JSON.parse(raw); } catch { data = Object.fromEntries(raw.split(/[;\n]+/).map((part) => part.split(/[:=](.+)/).slice(0, 2)).filter((pair) => pair.length === 2)); }
  if (!data || Array.isArray(data) || typeof data !== "object") data = {};
  if (!Object.keys(data).length) data = /^(https?|rtsp):\/\//i.test(raw) ? { streamUrl: raw } : { deviceAddress: raw };
  const streamUrl = valueOf(data, aliases.streamUrl);
  if (streamUrl) { const parsed = new URL(streamUrl); if (parsed.username || parsed.password) throw new Error("credentials"); }
  const stationValue = valueOf(data, aliases.station);
  const station = stations.find((item) => item.id === stationValue || item.name?.toLowerCase() === String(stationValue || "").toLowerCase());
  const inferredType = streamUrl?.startsWith("rtsp:") ? "rtsp" : /\.m3u8(?:$|\?)/i.test(streamUrl || "") ? "hls" : /mjpeg|mjpg/i.test(streamUrl || "") ? "mjpeg" : "player";
  const patch = { provider: valueOf(data, aliases.provider), name: valueOf(data, aliases.name), stationId: station?.id, streamUrl, streamType: valueOf(data, aliases.streamType) || (streamUrl ? inferredType : undefined), deviceAddress: valueOf(data, aliases.deviceAddress) };
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value != null && value !== ""));
}

export default function CameraBarcodeImport({ stations, ar, onImport }) {
  const [reading, setReading] = useState(false); const [message, setMessage] = useState(""); const [ok, setOk] = useState(false);
  const read = async (file) => {
    if (!file) return; setReading(true); setMessage(""); setOk(false);
    try { const bitmap = await window.createImageBitmap(file); let raw = ""; if ("BarcodeDetector" in window) raw = (await new window.BarcodeDetector().detect(bitmap))[0]?.rawValue || ""; else { const { default: jsQR } = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/+esm"); const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height; const context = canvas.getContext("2d", { willReadFrequently: true }); context.drawImage(bitmap, 0, 0); const image = context.getImageData(0, 0, canvas.width, canvas.height); raw = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" })?.data || ""; } bitmap.close(); if (!raw) throw new Error("unreadable"); const patch = cameraData(raw.trim(), stations); onImport(patch); setOk(true); setMessage(ar ? "تمت قراءة الباركود وتعبئة البيانات المتاحة." : "Barcode read and available fields filled."); }
    catch (error) { setMessage(error.message === "credentials" ? (ar ? "للحماية، لا يمكن استيراد رابط يحتوي اسم مستخدم أو كلمة مرور." : "For security, URLs containing credentials cannot be imported.") : (ar ? "تعذرت قراءة الباركود. استخدم صورة واضحة بصيغة PNG أو JPEG." : "Couldn't read the barcode. Use a clear PNG or JPEG image.")); }
    finally { setReading(false); }
  };
  return <div className="space-y-2"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-accent/50 bg-accent/5 p-3 text-sm font-semibold text-accent"><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => read(event.target.files?.[0])} />{reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}{ar ? "رفع صورة باركود الكاميرا" : "Upload camera barcode"}</label>{message && <p className={`rounded-md px-3 py-2 text-xs ${ok ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>{message}</p>}</div>;
}