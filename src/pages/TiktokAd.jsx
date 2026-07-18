import React from "react";
import GeneratedVideoAd from "@/components/tiktok-ad/GeneratedVideoAd";
import "@/components/tiktok-ad/tiktok-ad.css";

const AD_VIDEOS = [
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/a3130983b___.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/472c77f56___.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/3040f6808___.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/76088b66e___.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/2b52fd9e6___.mp4",
];
const AD_AUDIO = "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/59e28a277_speech.mp3";

export default function TiktokAd() {
  return (
    <main className="ad-page" dir="rtl">
      <section className="ad-phone" aria-label="إعلان PowerCare عن الموظفين والعمليات">
        <GeneratedVideoAd urls={AD_VIDEOS} audioUrl={AD_AUDIO} />
      </section>
    </main>
  );
}