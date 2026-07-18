import { useCallback, useEffect, useRef } from "react";

export function useAmbientScore(run) {
  const audioRef = useRef(null);
  const start = useCallback(() => {
    audioRef.current?.close();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.025, ctx.currentTime);
    master.connect(ctx.destination);
    [110, 164.81, 220].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = index === 1 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.22 / (index + 1);
      oscillator.connect(gain).connect(master);
      oscillator.start();
    });
    audioRef.current = ctx;
  }, []);
  useEffect(() => {
    start();
    return () => audioRef.current?.close();
  }, [run, start]);
  return { restartScore: start };
}