import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";

const VIDEO_URLS = [
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/7b1b2e430_Promo_Video.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/7c69959d3__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/6e2764f45__HSE.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/7b4dbcdc7__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/50c44c7e2__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/b0a1f77aa__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/b53cc5f7a__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/434efbe0a__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/b130d3504__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/34405c732__.mp4",
];

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

export default function VideoIntro() {
  const { t, lang } = useI18n();
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);
  const narrationUrl = NARRATION_URLS[lang] || NARRATION_URLS.en;

  const resetPlayback = () => {
    videoRef.current?.pause();
    if (videoRef.current) videoRef.current.currentTime = 0;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setVideoIndex(0);
    setPlaying(false);
  };

  useEffect(() => { resetPlayback(); }, [lang]);
  useEffect(() => {
    if (playing) videoRef.current?.play();
  }, [videoIndex]);

  const togglePlay = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      video?.pause();
      audio.pause();
      setPlaying(false);
    } else {
      if (video && !video.ended) video.play();
      if (!audio.ended) audio.play();
      setPlaying(true);
    }
  };

  const handleVideoEnded = () => {
    if (videoIndex < VIDEO_URLS.length - 1) {
      setVideoIndex((index) => index + 1);
    } else if (audioRef.current?.ended) {
      resetPlayback();
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleAudioEnded = () => {
    if (videoIndex === VIDEO_URLS.length - 1 && videoRef.current?.ended) resetPlayback();
  };

  return (
    <section className="relative overflow-hidden bg-landing-cinema px-6 py-20 md:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 start-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-landing-gold/20 blur-[120px]" />
        <div className="absolute bottom-0 end-0 h-[400px] w-[400px] rounded-full bg-landing-gold-deep/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 scale-150 rounded-full bg-landing-gold/30 blur-xl" />
            <div className="relative rounded-full border border-landing-gold/30 bg-card/5 p-4"><Logo size={48} /></div>
          </div>
        </div>

        <h2 className="hero-title mb-4 bg-gradient-to-b from-landing-gold-light to-landing-gold bg-clip-text text-4xl text-transparent md:text-5xl">{t("videoHeading")}</h2>
        <p className="mx-auto mb-12 max-w-2xl font-body leading-relaxed text-landing-bg/50">{t("videoText")}</p>

        <div className="group relative mb-8 overflow-hidden rounded-2xl border border-landing-gold/20 shadow-2xl">
          <video
            key={VIDEO_URLS[videoIndex]}
            ref={videoRef}
            src={VIDEO_URLS[videoIndex]}
            muted
            playsInline
            preload="auto"
            onEnded={handleVideoEnded}
            onClick={togglePlay}
            className="aspect-video w-full cursor-pointer bg-landing-cinema object-cover"
          />
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className={`absolute inset-0 flex items-center justify-center transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-landing-gold/90 text-landing-bg shadow-2xl transition-transform hover:scale-105">
              {playing ? <Pause className="h-8 w-8" /> : <Play className="ms-1 h-8 w-8" />}
            </span>
          </button>
        </div>

        {VIDEO_URLS.slice(1).map((url) => <video key={url} src={url} preload="auto" muted playsInline className="hidden" aria-hidden="true" />)}
        <audio key={narrationUrl} ref={audioRef} src={narrationUrl} preload="auto" onEnded={handleAudioEnded} />

        <button type="button" onClick={togglePlay} className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-landing-gold/30 bg-card/5 px-6 py-3 font-body text-sm text-landing-gold-light transition-colors hover:bg-landing-gold/20">
          {playing ? <Pause className="h-4 w-4 opacity-60" /> : <Volume2 className="h-4 w-4 opacity-60" />}
          {t("narrationCta")}
        </button>
      </div>
    </section>
  );
}