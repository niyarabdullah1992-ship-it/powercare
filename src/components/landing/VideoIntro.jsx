import React from "react";
import { useI18n } from "@/lib/i18n";
import Logo from "@/components/Logo";

const VIDEO_URL = "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/7b1b2e430_Promo_Video.mp4";

export default function VideoIntro() {
  const { t } = useI18n();

  return (
    <div className="px-6 md:px-10 py-16 max-w-5xl mx-auto text-center">
      <div className="flex justify-center mb-4">
        <Logo size={48} />
      </div>
      <h2 className="hero-title text-landing-gold text-3xl md:text-4xl mb-3">{t("videoHeading")}</h2>
      <p className="text-[#3a2f22]/60 font-body max-w-2xl mx-auto mb-8 leading-relaxed">{t("videoText")}</p>
      <div className="rounded-2xl overflow-hidden shadow-xl">
        <video src={VIDEO_URL} controls className="w-full aspect-video bg-black" />
      </div>
    </div>
  );
}