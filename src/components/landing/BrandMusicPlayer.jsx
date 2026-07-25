import React, { useCallback, useEffect, useRef, useState } from "react";
import { Music2, Volume2, VolumeX } from "lucide-react";

const CHORDS = [[130.81, 164.81, 196], [110, 138.59, 164.81], [87.31, 130.81, 174.61], [98, 123.47, 146.83]];

export default function BrandMusicPlayer({ lang }) {
  const contextRef = useRef(null);
  const timerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const stop = useCallback(() => {
    window.clearTimeout(timerRef.current);
    contextRef.current?.close();
    contextRef.current = null;
    setPlaying(false);
  }, []);
  const play = useCallback(() => {
    if (contextRef.current) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    context.resume();
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.32, context.currentTime + 2);
    master.gain.setValueAtTime(0.32, context.currentTime + 116);
    master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 120);
    master.connect(context.destination);
    Array.from({ length: 15 }, (_, index) => CHORDS[index % CHORDS.length]).forEach((chord, index) => {
      chord.forEach((frequency, note) => {
        const oscillator = context.createOscillator(); const gain = context.createGain();
        oscillator.type = note === 0 ? "sine" : "triangle"; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, context.currentTime + index * 8);
        gain.gain.exponentialRampToValueAtTime(note === 0 ? 0.12 : 0.045, context.currentTime + index * 8 + 2);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 8 + 8);
        oscillator.connect(gain).connect(master); oscillator.start(context.currentTime + index * 8); oscillator.stop(context.currentTime + index * 8 + 8);
      });
    });
    contextRef.current = context; setPlaying(true); timerRef.current = window.setTimeout(stop, 120000);
  }, [stop]);
  useEffect(() => { window.addEventListener("pointerdown", play, { once: true }); return () => { window.removeEventListener("pointerdown", play); stop(); }; }, [play, stop]);
  return <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={playing ? stop : play} aria-label={lang === "ar" ? "التحكم بموسيقى PowerCare" : "Control PowerCare music"} className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full border border-accent/40 bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-elevated hover:bg-primary/90"><Music2 className="h-4 w-4 text-accent" />{playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}<span className="hidden sm:inline">{lang === "ar" ? (playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى") : (playing ? "Mute music" : "Play music")}</span></button>;
}