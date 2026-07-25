import React, { useEffect, useRef, useState } from "react";
import { Music2, Pause } from "lucide-react";
import { useLocation } from "react-router-dom";

const VIDEO_ID = "5n5YG8ShXRQ";

export default function PlatformMusicButton() {
  const { pathname } = useLocation();
  const frameRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const insidePlatform = pathname.startsWith("/app");

  useEffect(() => {
    if (!insidePlatform) {
      setLoaded(false);
      setPlaying(false);
    }
  }, [insidePlatform]);

  if (!insidePlatform) return null;

  const toggleMusic = () => {
    if (!loaded) {
      setLoaded(true);
      setPlaying(true);
      return;
    }
    const nextPlaying = !playing;
    frameRef.current?.contentWindow?.postMessage(JSON.stringify({
      event: "command",
      func: nextPlaying ? "playVideo" : "pauseVideo",
      args: [],
    }), "*");
    setPlaying(nextPlaying);
  };

  return <>
    {loaded && <iframe ref={frameRef} title="PowerCare focus music" src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&enablejsapi=1&playsinline=1&loop=1&playlist=${VIDEO_ID}`} allow="autoplay" className="pointer-events-none fixed h-px w-px opacity-0" />}
    <button type="button" onClick={toggleMusic} aria-label={playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"} title={playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"} className="fixed bottom-24 end-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-card text-accent shadow-lg hover:bg-secondary md:bottom-6 md:end-6">
      {playing ? <Pause className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
    </button>
  </>;
}