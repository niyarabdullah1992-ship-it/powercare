import React from "react";
import GeneratedVideoAd from "@/components/tiktok-ad/GeneratedVideoAd";
import "@/components/tiktok-ad/tiktok-ad.css";

const AD_VIDEOS = [
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/a68d4d516_2090__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/e1e7ab634_2090__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/3995716f6_2090__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/687b6feaa_2090__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/d3dd379e5_2090__.mp4",
];
const AD_LOGO = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/65a30b8a4_9a8843bf0_generated_image.png";
const AD_AUDIO = "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/59e28a277_speech.mp3";

export default function TiktokAd() {
  return (
    <main className="ad-page" dir="rtl">
      <section className="ad-phone" aria-label="إعلان PowerCare عن الموظفين والعمليات">
        <GeneratedVideoAd urls={AD_VIDEOS} audioUrl={AD_AUDIO} logoUrl={AD_LOGO} />
      </section>
    </main>
  );
}