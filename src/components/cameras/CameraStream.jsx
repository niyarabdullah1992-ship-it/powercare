import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { ExternalLink, Maximize2, Radio } from "lucide-react";
import HlsPlayer from "@/components/cameras/HlsPlayer";

export default function CameraStream({ camera, companyId, sessionToken, ar }) {
  const frameRef = useRef(null);
  const [state, setState] = useState("loading");
  const [playerCheck, setPlayerCheck] = useState(null);
  const ready = useCallback(() => setState("online"), []);
  const failed = useCallback(() => setState("offline"), []);
  const fullscreen = () => frameRef.current?.requestFullscreen?.();

  useEffect(() => {
    if (camera.streamType !== "player" || !camera.streamUrl || !companyId || !sessionToken) return;
    let active = true;
    setState("loading"); setPlayerCheck(null);
    base44.functions.invoke("cameraConnectionTest", { companyId, sessionToken, url: camera.streamUrl, streamType: "player" })
      .then(({ data }) => { if (!active) return; setPlayerCheck(data); setState(data.ok ? "online" : "offline"); })
      .catch(() => { if (active) { setPlayerCheck({ ok: false }); setState("offline"); } });
    return () => { active = false; };
  }, [camera.streamType, camera.streamUrl, companyId, sessionToken]);

  if (!camera.streamUrl) return <div className="grid aspect-video place-items-center bg-muted text-sm text-muted-foreground">{ar ? "لا يوجد رابط بث" : "No stream URL"}</div>;
  let media;
  if (camera.streamType === "mjpeg") media = <Image src={camera.streamUrl} alt={camera.name} className="aspect-video w-full bg-muted object-cover" onLoad={ready} onError={failed} />;
  else if (camera.streamType === "hls") media = <HlsPlayer src={camera.streamUrl} className="aspect-video w-full bg-black object-contain" onReady={ready} onError={failed} />;
  else if (camera.streamType === "player" && playerCheck?.ok) media = <iframe src={camera.streamUrl} title={camera.name} className="aspect-video w-full border-0 bg-muted" allow="autoplay; fullscreen" />;
  else if (camera.streamType === "player" && playerCheck && !playerCheck.ok) media = <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-muted p-6 text-center"><Radio className="h-8 w-8 text-destructive" /><p className="text-sm font-semibold text-destructive">{ar ? "رابط البث غير صالح أو الملف غير موجود" : "The stream URL is invalid or missing"}</p><p className="text-xs text-muted-foreground">{ar ? "اضغط تعديل وأدخل رابط Web Player يعمل عبر HTTPS." : "Select Edit and enter a working HTTPS Web Player URL."}</p></div>;
  else if (camera.streamType === "player") media = <div className="grid aspect-video place-items-center bg-muted text-sm text-muted-foreground">{ar ? "جارٍ التحقق من رابط البث…" : "Checking stream URL…"}</div>;
  else media = <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-muted p-5 text-center"><Radio className="h-8 w-8 text-accent" /><p className="text-xs text-muted-foreground">{ar ? "حوّل RTSP إلى HLS عبر بوابة الشبكة لعرضه هنا." : "Convert RTSP to HLS through the network gateway to play it here."}</p><a href={camera.streamUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:underline"><ExternalLink className="h-4 w-4" />{ar ? "فتح الرابط" : "Open URL"}</a></div>;
  return <div ref={frameRef} className="relative overflow-hidden bg-black">{media}<span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold ${state === "online" ? "bg-emerald-600 text-white" : state === "offline" ? "bg-destructive text-destructive-foreground" : "bg-foreground/70 text-background"}`}>{state === "online" ? (ar ? "متصل" : "Online") : state === "offline" ? (ar ? "منقطع" : "Offline") : (ar ? "جارٍ الاتصال" : "Connecting")}</span><button onClick={fullscreen} className="absolute right-2 top-2 rounded-md bg-foreground/70 p-2 text-background" title={ar ? "ملء الشاشة" : "Fullscreen"}><Maximize2 className="h-4 w-4" /></button></div>;
}