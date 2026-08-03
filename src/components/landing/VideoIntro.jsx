import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import SeamlessVideoPlaylist from "@/components/landing/SeamlessVideoPlaylist";
import { Image } from "@/components/ui/image";

const VIDEO_URLS = [
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/58bfeba3f__NiroVera.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/fefc49702__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/b2e7418ff__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/9a24b6bf3__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/d2a2ee186__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/01c189d36__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/d26ad44d9__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/ea168e01b__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/c0a9d83d6__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/2d9384c30_NiroVera_Film.mp4",
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
      <div className="video-intro-blue mx-auto grid max-w-[1200px] overflow-hidden border border-accent/35 bg-card shadow-elevated lg:grid-cols-[52px_minmax(0,1fr)]">
        <div className="hidden bg-primary lg:block" />

        <div className="min-w-0">
          <div className="grid border-b border-accent/50 lg:grid-cols-[54px_minmax(0,1fr)]">
            <div className="order-2 flex min-h-14 items-center justify-between border-y border-accent/45 bg-primary px-5 text-primary-foreground lg:order-none lg:min-h-[390px] lg:flex-col lg:border-y-0 lg:border-x lg:px-0 lg:py-4">
              <span className="font-heading text-lg tracking-wide lg:vertical-text">NiroVera</span>
              <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="flex h-10 w-10 items-center justify-center border-t border-accent/45 text-landing-gold-light lg:h-14 lg:w-full">
                {playing ? <Pause className="h-5 w-5" strokeWidth={1.5} /> : <Play className="h-5 w-5" strokeWidth={1.5} />}
              </button>
            </div>

            <div className="group relative order-1 aspect-video overflow-hidden bg-card p-3 lg:order-none lg:aspect-auto lg:min-h-[460px]">
              <div className="absolute inset-3 overflow-hidden border border-accent/55">
                <Image src="https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/e03e45e6f_generated_image.png" alt="Executive leadership team reviewing NiroVera operations" originWidth={1536} originHeight={864} fittingType="fill" focalPointX={0.5} focalPointY={0.5} className="absolute inset-0 h-full w-full" />
                <div className={`absolute inset-0 transition-opacity ${playing ? "opacity-100" : "opacity-0"}`}>
                  <SeamlessVideoPlaylist ref={playerRef} urls={VIDEO_URLS} playing={playing} onClick={togglePlay} onPlaylistEnd={handlePlaylistEnd} />
                </div>
                <div className="pointer-events-none absolute bottom-5 start-5 z-10 border-s-2 border-accent bg-primary/80 px-3 py-1.5 font-heading text-lg font-semibold tracking-wide text-primary-foreground backdrop-blur-sm">NiroVera</div>
                <div className="pointer-events-none absolute inset-0 bg-primary/5" />
                <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className={`absolute inset-0 flex items-center justify-center transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/70 text-landing-gold-light shadow-xl backdrop-blur-sm">
                    {playing ? <Pause className="h-7 w-7" /> : <Play className="ms-1 h-7 w-7" />}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div dir={lang === "ar" ? "rtl" : "ltr"} className="border-s border-accent/50 px-7 py-8 sm:px-10 lg:px-11 lg:py-7">
            <h2 className="font-heading text-4xl font-semibold leading-none tracking-[-0.04em] text-primary sm:text-5xl">{t("videoHeading")}</h2>
            <p className="mt-3 max-w-5xl text-sm leading-6 text-foreground md:text-base md:leading-6">{t("videoText")}</p>
          </div>
        </div>
        <audio key={narrationUrl} ref={audioRef} src={narrationUrl} preload="auto" onEnded={resetPlayback} />
      </div>
    </section>
  );
}