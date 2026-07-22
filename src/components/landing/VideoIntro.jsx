import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";
import SeamlessVideoPlaylist from "@/components/landing/SeamlessVideoPlaylist";

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
  ar: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/074f54976_speech.mp3",
  en: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/33609ca50_speech.mp3",
  de: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/b5d20a1c5_speech.mp3",
  fr: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/5f89dcba0_speech.mp3",
  es: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/5d0fb6198_speech.mp3",
  pt: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/a130726f3_speech.mp3",
  ru: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/fe94a81a5_speech.mp3",
  ja: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/a82142529_speech.mp3",
  ko: "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/1877423df_speech.mp3",
};

export default function VideoIntro() {
  const { t, lang } = useI18n();
  const playerRef = useRef(null);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const narrationUrl = NARRATION_URLS[lang] || NARRATION_URLS.en;

  const resetPlayback = () => {
    playerRef.current?.reset();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPlaying(false);
  };

  useEffect(() => { resetPlayback(); }, [lang]);

  const togglePlay = () => {
    if (playing) {
      playerRef.current?.pause();
      audioRef.current?.pause();
    } else {
      playerRef.current?.play();
      audioRef.current?.play();
    }
    setPlaying((current) => !current);
  };

  const handlePlaylistEnd = () => {
    if (audioRef.current?.ended) resetPlayback();
    else playerRef.current?.replayLast();
  };

  return (
    <section className="relative overflow-hidden bg-landing-bg px-4 py-0 sm:px-6 md:px-8">
      <div className="relative mx-auto grid max-w-[1380px] items-center gap-8 rounded-lg border border-foreground/10 bg-landing-cinema p-6 md:grid-cols-[0.9fr,1.1fr] md:p-8">
        <div className="text-start">
          <div className="mb-5"><Logo size={44} /></div>
          <h2 className="font-heading text-3xl font-semibold text-white md:text-4xl">{t("videoHeading")}</h2>
          <p className="mt-4 leading-relaxed text-white/55">{t("videoText")}</p>
          <button type="button" onClick={togglePlay} className="mt-7 inline-flex items-center gap-3 rounded-md bg-accent px-5 py-3 text-xs font-semibold text-accent-foreground hover:bg-accent/90">
            {playing ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}{t("narrationCta")}
          </button>
        </div>
        <div className="group relative h-64 overflow-hidden rounded-lg border border-white/10 bg-black">
          <SeamlessVideoPlaylist ref={playerRef} urls={VIDEO_URLS} playing={playing} onClick={togglePlay} onPlaylistEnd={handlePlaylistEnd} />
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className={`absolute inset-0 flex items-center justify-center transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/85 text-primary shadow-2xl">{playing ? <Pause className="h-7 w-7" /> : <Play className="ms-1 h-7 w-7" />}</span>
          </button>
        </div>
        <audio key={narrationUrl} ref={audioRef} src={narrationUrl} preload="auto" onEnded={resetPlayback} />
      </div>
    </section>
  );
}