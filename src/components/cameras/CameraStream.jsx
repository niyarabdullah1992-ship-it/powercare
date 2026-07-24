import React from "react";
import { Image } from "@/components/ui/image";
import { ExternalLink, Radio } from "lucide-react";

export default function CameraStream({ camera, ar }) {
  if (!camera.streamUrl) return <div className="grid aspect-video place-items-center bg-muted text-sm text-muted-foreground">{ar ? "لا يوجد رابط بث" : "No stream URL"}</div>;
  if (camera.streamType === "mjpeg") return <Image src={camera.streamUrl} alt={camera.name} className="aspect-video w-full bg-muted object-cover" />;
  if (camera.streamType === "hls") return <video src={camera.streamUrl} className="aspect-video w-full bg-black object-contain" controls autoPlay muted playsInline />;
  if (camera.streamType === "player") return <iframe src={camera.streamUrl} title={camera.name} className="aspect-video w-full border-0 bg-muted" allow="autoplay; fullscreen" />;
  return <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-muted p-5 text-center"><Radio className="h-8 w-8 text-accent" /><p className="text-xs text-muted-foreground">{ar ? "بث RTSP يفتح عبر مشغّل الكاميرا أو جهاز التسجيل." : "RTSP opens through the camera or NVR player."}</p><a href={camera.streamUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:underline"><ExternalLink className="h-4 w-4" />{ar ? "فتح البث" : "Open stream"}</a></div>;
}