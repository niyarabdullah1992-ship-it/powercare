import React, { useEffect, useRef } from "react";
import { Mic } from "lucide-react";

export default function CallMediaTile({ stream, video, muted }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !stream) return;
    ref.current.srcObject = stream;
    ref.current.play().catch(() => {});
  }, [stream]);
  if (!video) return <div className="flex min-h-32 items-center justify-center rounded-xl bg-muted"><audio ref={ref} autoPlay muted={muted} /><Mic className="h-10 w-10 text-accent" /></div>;
  return <video ref={ref} autoPlay playsInline muted={muted} className="min-h-32 w-full rounded-xl bg-foreground object-cover" />;
}