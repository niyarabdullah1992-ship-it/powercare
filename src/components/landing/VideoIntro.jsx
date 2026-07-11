import React, { useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";

const VIDEO_URL = "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/7b1b2e430_Promo_Video.mp4";
const NARRATION_URL = "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/3e21a84a0_speech.mp3";

export default function VideoIntro() {
  const { t } = useI18n();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
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

        <div className="rounded-2xl overflow-hidden shadow-2xl border border-landing-gold/20 mb-8">
          <video src={VIDEO_URL} controls className="w-full aspect-video bg-black" />
        </div>

        <audio ref={audioRef} src={NARRATION_URL} onEnded={() => setPlaying(false)} />
        <button
          onClick={toggleAudio}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-landing-gold/30 hover:bg-white/10 transition-colors text-landing-gold-light font-body text-sm"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {t("narrationCta")}
          <Volume2 className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </section>
  );
}