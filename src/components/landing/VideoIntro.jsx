import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import SeamlessVideoPlaylist from "@/components/landing/SeamlessVideoPlaylist";
import { Image } from "@/components/ui/image";

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
    <section className="bg-landing-bg px-4 py-16 sm:px-6 md:px-8 md:py-24">
      <div className="video-intro-blue mx-auto grid max-w-[1200px] overflow-hidden rounded-2xl border border-accent/30 bg-primary text-primary-foreground shadow-elevated lg:grid-cols-[0.82fr,1.18fr]">
        <div className="flex flex-col justify-center px-7 py-12 sm:px-10 md:px-14 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest-xl text-landing-gold-light">PowerCare</p>
          <h2 className="mt-4 font-heading text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-primary-foreground sm:text-5xl md:text-6xl">{t("videoHeading")}</h2>
          <p className="mt-7 max-w-xl text-base leading-7 text-primary-foreground/75 md:text-lg md:leading-8">{t("videoText")}</p>
          <button type="button" onClick={togglePlay} className="mt-8 inline-flex w-fit items-center gap-3 rounded-full border border-primary-foreground/50 bg-primary-foreground px-6 py-3 text-base font-semibold text-primary hover:bg-secondary">
            <Volume2 className="h-5 w-5" strokeWidth={1.75} />
            {t("narrationCta")}
          </button>
        </div>

        <div className="group relative min-h-[360px] overflow-hidden bg-sidebar sm:min-h-[440px] lg:min-h-[560px]">
          <Image src="https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/4016f736a_generated_image.png" alt="Corporate management team reviewing company operations" originWidth={1536} originHeight={1024} fittingType="fill" focalPointX={0.5} focalPointY={0.5} className="absolute inset-0 h-full w-full opacity-80" />
          <div className="absolute inset-0">
            <SeamlessVideoPlaylist ref={playerRef} urls={VIDEO_URLS} playing={playing} onClick={togglePlay} onPlaylistEnd={handlePlaylistEnd} />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-primary/20" />
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className={`absolute inset-0 flex items-center justify-center transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-primary-foreground/50 bg-primary/85 text-primary-foreground shadow-xl backdrop-blur-sm">
              {playing ? <Pause className="h-7 w-7" /> : <Play className="ms-1 h-7 w-7" />}
            </span>
          </button>
        </div>
        <audio key={narrationUrl} ref={audioRef} src={narrationUrl} preload="auto" onEnded={resetPlayback} />
      </div>
    </section>
  );
}