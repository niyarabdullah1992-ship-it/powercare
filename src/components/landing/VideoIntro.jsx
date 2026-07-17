import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";
import PromoScene from "@/components/landing/PromoScene";

const NARRATION_URLS = {
  ar: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/8111ff65d_3e21a84a0_speech.mp3",
  en: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/a71af389e_speech.mp3",
  de: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/003d6b25c_speech.mp3",
  fr: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/7254f6bce_speech.mp3",
  es: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/6c27674c4_speech.mp3",
  pt: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/1b27d629f_speech.mp3",
  ru: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/c816c8103_speech.mp3",
  ja: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/a01dbb1af_speech.mp3",
  ko: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/1c1c8c196_speech.mp3",
};

const SCENES = [
  { id: "logo", duration_ms: 4500, component: PromoScene },
  { id: "title", duration_ms: 4500, component: PromoScene },
  { id: "attendance", duration_ms: 5000, component: PromoScene },
  { id: "tasks", duration_ms: 5000, component: PromoScene },
  { id: "payroll", duration_ms: 5000, component: PromoScene },
  { id: "hse", duration_ms: 5000, component: PromoScene },
  { id: "stats", duration_ms: 4500, component: PromoScene },
  { id: "finale", duration_ms: 4500, component: PromoScene },
];
const TOTAL_DURATION = SCENES.reduce((sum, scene) => sum + scene.duration_ms, 0);

export default function VideoIntro() {
  const { t, lang } = useI18n();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const narrationUrl = NARRATION_URLS[lang] || NARRATION_URLS.en;

  const resetPlayback = () => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    setPlaying(false);
    setElapsed(0);
  };

  useEffect(() => { resetPlayback(); }, [lang]);
  useEffect(() => {
    if (!playing) return undefined;
    const startedAt = Date.now() - elapsed;
    const timer = window.setInterval(() => {
      const next = Date.now() - startedAt;
      if (next >= TOTAL_DURATION) resetPlayback();
      else setElapsed(next);
    }, 80);
    return () => window.clearInterval(timer);
  }, [playing]);

  let sceneStart = 0;
  let sceneIndex = SCENES.findIndex((scene) => {
    const current = elapsed < sceneStart + scene.duration_ms;
    if (!current) sceneStart += scene.duration_ms;
    return current;
  });
  if (sceneIndex < 0) sceneIndex = 0;
  const scene = SCENES[sceneIndex];
  const SceneComponent = scene.component;
  const progress = Math.min(1, Math.max(0, (elapsed - sceneStart) / scene.duration_ms));

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { if (!audio.ended) audio.play(); setPlaying(true); }
  };

  return (
    <section className="relative overflow-hidden bg-landing-cinema px-6 py-20 md:px-10">
      <div className="pointer-events-none absolute inset-0"><div className="absolute -top-32 start-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-landing-gold/20 blur-[120px]" /><div className="absolute bottom-0 end-0 h-[400px] w-[400px] rounded-full bg-landing-gold-deep/20 blur-[100px]" /></div>
      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-6 flex justify-center"><div className="relative"><div className="absolute inset-0 scale-150 rounded-full bg-landing-gold/30 blur-xl" /><div className="relative rounded-full border border-landing-gold/30 bg-card/5 p-4"><Logo size={48} /></div></div></div>
        <h2 className="hero-title mb-4 bg-gradient-to-b from-landing-gold-light to-landing-gold bg-clip-text text-4xl text-transparent md:text-5xl">{t("videoHeading")}</h2>
        <p className="mx-auto mb-12 max-w-2xl font-body leading-relaxed text-landing-bg/50">{t("videoText")}</p>

        <div className="group relative mb-8 aspect-video cursor-pointer overflow-hidden rounded-2xl border border-landing-gold/20 bg-landing-cinema shadow-2xl" onClick={togglePlay}>
          <div key={scene.id} className="promo-scene-enter absolute inset-0"><SceneComponent scene={scene.id} progress={progress} lang={lang} /></div>
          <button onClick={(event) => { event.stopPropagation(); togglePlay(); }} aria-label={playing ? "Pause" : "Play"} className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}><span className="flex h-20 w-20 items-center justify-center rounded-full bg-landing-gold/90 text-landing-bg shadow-2xl transition-transform hover:scale-105">{playing ? <Pause className="h-8 w-8" /> : <Play className="ms-1 h-8 w-8" />}</span></button>
          <div className="absolute inset-x-4 bottom-3 z-30 flex items-center gap-2" aria-label={`Scene ${sceneIndex + 1} of ${SCENES.length}`}>
            {SCENES.map((item, index) => <span key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-card/20"><span className="block h-full bg-landing-gold-light transition-[width] duration-100" style={{ width: index < sceneIndex ? "100%" : index === sceneIndex ? `${progress * 100}%` : "0%" }} /></span>)}
            <span className="min-w-9 font-body text-[10px] text-landing-bg/60">{sceneIndex + 1} / 8</span>
          </div>
        </div>

        <audio key={narrationUrl} ref={audioRef} src={narrationUrl} preload="auto" />
        <button type="button" onClick={togglePlay} className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-landing-gold/30 bg-card/5 px-6 py-3 font-body text-sm text-landing-gold-light transition-colors hover:bg-landing-gold/20">{playing ? <Pause className="h-4 w-4 opacity-60" /> : <Volume2 className="h-4 w-4 opacity-60" />}{t("narrationCta")}</button>
      </div>
    </section>
  );
}