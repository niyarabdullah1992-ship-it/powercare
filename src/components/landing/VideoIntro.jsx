import React, { useRef, useState, useEffect } from "react";
import { UserCog } from "lucide-react";
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
    <section className="bg-card px-4 py-16 sm:px-6 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-[1120px] items-center gap-10 overflow-hidden rounded-2xl bg-executive-panel px-7 py-12 sm:px-12 md:grid-cols-[1.03fr,0.97fr] md:gap-12 md:px-14 md:py-16">
        <div className="text-start">
          <h2 className="max-w-lg font-heading text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-executive-ink sm:text-6xl">{t("videoHeading")}</h2>
          <p className="mt-7 max-w-xl text-lg leading-8 text-executive-ink/90 md:text-xl md:leading-9">{t("videoText")}</p>
          <button type="button" onClick={togglePlay} className="mt-8 inline-flex items-center gap-3 rounded-md bg-executive-teal px-7 py-3.5 text-xl font-semibold text-card hover:bg-executive-teal/90">
            <UserCog className="h-6 w-6" strokeWidth={1.75} />
            {t("narrationCta")}
          </button>
        </div>

        <div className="group relative min-h-[430px] overflow-hidden rounded-lg border border-executive-line bg-card shadow-soft md:min-h-[520px]">
          <Image src="https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/1be1b15d3_generated_image.png" alt="Executive human resources management dashboard" fittingType="fill" focalPointX={0.5} focalPointY={0.5} className="absolute inset-0 h-full w-full" />
          <div className={`absolute inset-0 bg-executive-ink transition-opacity duration-300 ${playing ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <SeamlessVideoPlaylist ref={playerRef} urls={VIDEO_URLS} playing={playing} onClick={togglePlay} onPlaylistEnd={handlePlaylistEnd} />
          </div>
        </div>
        <audio key={narrationUrl} ref={audioRef} src={narrationUrl} preload="auto" onEnded={resetPlayback} />
      </div>
    </section>
  );
}