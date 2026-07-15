import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";

const VIDEO_URL = "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/7b1b2e430_Promo_Video.mp4";
// Narration in every language the site supports — plays synced over the video.
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
  const narrationUrl = NARRATION_URLS[lang] || NARRATION_URLS.en;

  // Switching language stops playback so the new narration starts cleanly.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setPlaying(false);
  }, [lang]);

  const togglePlay = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;
    if (playing) {
      video.pause();
      audio.pause();
      setPlaying(false);
    } else {
      video.play();
      audio.play();
      setPlaying(true);
    }
  };

  // The video may be shorter than the narration — when it ends, loop it
  // silently so the voice-over always plays to the very end.
  const handleVideoEnded = () => {
    const audio = audioRef.current;
    const video = videoRef.current;
    if (audio && !audio.paused && !audio.ended) {
      if (video) {
        video.currentTime = 0;
        video.play();
      }
      return;
    }
    if (video) video.currentTime = 0;
    setPlaying(false);
  };

  // Narration finished — stop the video and reset everything.
  const handleAudioEnded = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPlaying(false);
  };

  return (
    <section className="relative overflow-hidden bg-[#181109] py-20 px-6 md:px-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 start-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-landing-gold/20 blur-[120px]" />
        <div className="absolute bottom-0 end-0 w-[400px] h-[400px] rounded-full bg-landing-gold-deep/20 blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-landing-gold/30 blur-xl scale-150" />
            <div className="relative bg-white/5 border border-landing-gold/30 rounded-full p-4">
              <Logo size={48} />
            </div>
          </div>
        </div>

        <h2 className="hero-title text-transparent bg-clip-text bg-gradient-to-b from-landing-gold-light to-landing-gold text-4xl md:text-5xl mb-4">
          {t("videoHeading")}
        </h2>
        <p className="text-white/50 font-body max-w-2xl mx-auto mb-12 leading-relaxed">
          {t("videoText")}
        </p>

        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-landing-gold/20 mb-8 group">
          <video
            ref={videoRef}
            src={VIDEO_URL}
            muted
            playsInline
            onEnded={handleVideoEnded}
            onClick={togglePlay}
            className="w-full aspect-video bg-black cursor-pointer"
          />
          {/* Play/pause overlay — narration follows the selected site language */}
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className={`absolute inset-0 flex items-center justify-center transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
          >
            <span className="flex items-center justify-center w-20 h-20 rounded-full bg-landing-gold/90 text-white shadow-2xl hover:scale-105 transition-transform">
              {playing ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ms-1" />}
            </span>
          </button>
        </div>

        {/* Narration audio — resets automatically whenever the language changes */}
        <audio key={narrationUrl} ref={audioRef} src={narrationUrl} preload="auto" onEnded={handleAudioEnded} />

        <button
          type="button"
          onClick={togglePlay}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-landing-gold/30 text-landing-gold-light font-body text-sm hover:bg-landing-gold/20 transition-colors cursor-pointer"
        >
          {playing ? <Pause className="w-4 h-4 opacity-60" /> : <Volume2 className="w-4 h-4 opacity-60" />}
          {t("narrationCta")}
        </button>
      </div>
    </section>
  );
}