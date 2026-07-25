import React, { useState } from "react";
import { Music2, Volume2, VolumeX, X } from "lucide-react";

const VIDEO_URL = "https://www.youtube.com/embed/gqpzR2fLYA4?autoplay=1&playsinline=1&start=0&end=3600&rel=0";

export default function BrandMusicPlayer({ lang }) {
  const [playing, setPlaying] = useState(false);
  const title = lang === "ar" ? "موسيقى PowerCare الفاخرة" : "PowerCare luxury music";
  return (
    <div className="fixed bottom-5 end-5 z-50 flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-2">
      {playing && (
        <div className="overflow-hidden rounded-lg border border-accent/40 bg-primary shadow-elevated">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-primary-foreground">
            <span className="flex items-center gap-2"><Music2 className="h-4 w-4 text-accent" />{title}</span>
            <button type="button" onClick={() => setPlaying(false)} className="rounded-full p-1 hover:bg-primary-foreground/10" aria-label={lang === "ar" ? "إغلاق المشغل" : "Close player"}><X className="h-4 w-4" /></button>
          </div>
          <iframe width="320" height="180" src={VIDEO_URL} title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="block max-w-full border-0" />
        </div>
      )}
      <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={title} className="flex items-center gap-2 rounded-full border border-accent/40 bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-elevated hover:bg-primary/90">
        <Music2 className="h-4 w-4 text-accent" />{playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        <span>{lang === "ar" ? (playing ? "إيقاف الموسيقى" : "موسيقى فاخرة · ساعة") : (playing ? "Stop music" : "Luxury music · 1 hour")}</span>
      </button>
    </div>
  );
}