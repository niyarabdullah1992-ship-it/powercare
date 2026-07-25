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
    master.gain.exponentialRampToValueAtTime(0.32, context.currentTime + 3);
    master.gain.setValueAtTime(0.32, context.currentTime + 7195);
    master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 7200);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 900; filter.Q.value = 0.7;
    master.connect(filter).connect(context.destination);
    CHORDS[0].forEach((frequency, note) => {
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = note === 0 ? "sine" : "triangle";
      gain.gain.value = note === 0 ? 0.12 : 0.045;
      Array.from({ length: 900 }).forEach((_, index) => oscillator.frequency.setValueAtTime(CHORDS[index % CHORDS.length][note], context.currentTime + index * 8));
      oscillator.connect(gain).connect(master); oscillator.start(); oscillator.stop(context.currentTime + 7200);
    });
    const pulse = context.createOscillator(); const pulseDepth = context.createGain();
    pulse.type = "sine"; pulse.frequency.value = 0.12; pulseDepth.gain.value = 0.035;
    pulse.connect(pulseDepth).connect(master.gain); pulse.start(); pulse.stop(context.currentTime + 7200);
    contextRef.current = context; setPlaying(true); timerRef.current = window.setTimeout(stop, 7200000);
  }, [stop]);
  useEffect(() => { window.addEventListener("pointerdown", play, { once: true }); return () => { window.removeEventListener("pointerdown", play); stop(); }; }, [play, stop]);
  return <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={playing ? stop : play} aria-label={lang === "ar" ? "التحكم بموسيقى PowerCare" : "Control PowerCare music"} className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full border border-accent/40 bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-elevated hover:bg-primary/90"><Music2 className="h-4 w-4 text-accent" />{playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}<span className="hidden sm:inline">{lang === "ar" ? (playing ? "إيقاف موسيقى التركيز" : "موسيقى تركيز · ساعتان") : (playing ? "Stop focus music" : "Focus music · 2 hours")}</span></button>;
}