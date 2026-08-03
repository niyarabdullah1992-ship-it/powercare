import React, { useRef, useState } from "react";
import { Hand, Pause, Play } from "lucide-react";
import useDraggablePosition from "@/hooks/useDraggablePosition";

const VIDEO_ID = "5n5YG8ShXRQ";

export default function PlatformMusicButton() {
  const frameRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { position, handlers } = useDraggablePosition();

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
    {loaded && <iframe ref={frameRef} title="NiroVera focus music" src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&enablejsapi=1&playsinline=1&loop=1&playlist=${VIDEO_ID}`} allow="autoplay" className="pointer-events-none fixed h-px w-px opacity-0" />}
    <div style={position ? { left: position.x, top: position.y } : undefined} className={position ? "fixed z-50 flex overflow-hidden rounded-full border border-accent/40 bg-card text-accent shadow-lg" : "fixed bottom-24 end-4 z-50 flex overflow-hidden rounded-full border border-accent/40 bg-card text-accent shadow-lg md:bottom-6 md:end-6"}>
      <button type="button" {...handlers} aria-label="سحب زر الموسيقى" title="اسحب لتحريك الزر" className="flex h-10 w-10 touch-none cursor-grab items-center justify-center hover:bg-secondary active:cursor-grabbing"><Hand className="h-4 w-4" /></button>
      <button type="button" onClick={toggleMusic} aria-label={playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"} title={playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"} className="flex h-10 w-10 items-center justify-center border-s border-border hover:bg-secondary">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
    </div>
  </>;
}