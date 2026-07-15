import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";

// Custom audio player — avoids native <audio controls> quirks inside
// mobile WebViews / preview iframes and surfaces real playback errors.
export default function AdAudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audioRef.current = audio;
    const onTime = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    const onErr = () => { setLoading(false); setPlaying(false); setError("تعذّر تحميل الملف الصوتي"); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
    };
  }, [src]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError("");
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      setLoading(true);
      await audio.play();
      setPlaying(true);
    } catch (e) {
      setError("تعذّر تشغيل الصوت: " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          aria-label={playing ? "إيقاف" : "تشغيل"}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ms-0.5" />}
        </button>
        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive font-body">{error}</p>}
    </div>
  );
}