import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function HlsPlayer({ src, className, onReady, onError }) {
  const ref = useRef(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) video.src = src;
    else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(src); hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { onReady?.(); video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) onError?.(); });
      return () => hls.destroy();
    } else onError?.();
  }, [src, onReady, onError]);
  return <video ref={ref} className={className} controls autoPlay muted playsInline onLoadedData={onReady} onError={onError} />;
}