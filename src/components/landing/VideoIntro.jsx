import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Layers3 } from "lucide-react";
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
      <div className="mx-auto max-w-[1080px] bg-foreground/[0.08] px-6 py-12 sm:px-10 md:px-20 md:py-20">
        <div className="flex items-center gap-4">
          <h2 className="font-heading text-4xl font-medium leading-none tracking-[-0.04em] text-foreground sm:text-5xl md:text-6xl">{t("videoHeading")}</h2>
          <Layers3 className="hidden h-12 w-12 shrink-0 text-muted-foreground sm:block" strokeWidth={1} />
        </div>

        <div className="mt-10 grid items-center gap-10 md:grid-cols-[1.08fr,0.92fr] md:gap-8">
          <div className="text-start">
            <p className="max-w-xl text-base leading-7 text-foreground/80 md:text-lg md:leading-8">{t("videoText")}</p>
            <button type="button" onClick={togglePlay} className="mt-7 inline-flex items-center rounded-full border border-foreground/25 px-5 py-2 text-lg font-medium text-foreground underline decoration-1 underline-offset-4 hover:bg-foreground hover:text-background">
              {t("narrationCta")}
            </button>
          </div>

          <div className="group relative h-56 overflow-hidden rounded-3xl bg-muted md:h-60">
            <Image src="https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/57a2a9745_generated_image.png" alt="Monochrome architectural structure" originWidth={1536} originHeight={1024} fittingType="fill" focalPointX={0.5} focalPointY={0.5} className="absolute inset-0 h-full w-full grayscale" />
            <div className="absolute inset-0 grayscale opacity-70">
              <SeamlessVideoPlaylist ref={playerRef} urls={VIDEO_URLS} playing={playing} onClick={togglePlay} onPlaylistEnd={handlePlaylistEnd} />
            </div>
            <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className={`absolute inset-0 flex items-center justify-center transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-card/90 text-foreground shadow-lg">{playing ? <Pause className="h-6 w-6" /> : <Play className="ms-1 h-6 w-6" />}</span>
            </button>
          </div>
        </div>
        <audio key={narrationUrl} ref={audioRef} src={narrationUrl} preload="auto" onEnded={resetPlayback} />
      </div>
    </section>
  );
}