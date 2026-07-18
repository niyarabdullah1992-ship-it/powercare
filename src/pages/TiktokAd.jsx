import React from "react";
import GeneratedVideoAd from "@/components/tiktok-ad/GeneratedVideoAd";
import "@/components/tiktok-ad/tiktok-ad.css";

const AD_VIDEOS = [
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/bc4de59f2__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/a6b5a5973__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/b05ef556e__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/e8c129f35__.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/6291a8ae8__.mp4",
];

export default function TiktokAd() {
  return (
    <main className="ad-page" dir="rtl">
      <section className="ad-phone" aria-label="إعلان PowerCare عن الموظفين والعمليات">
        <GeneratedVideoAd urls={AD_VIDEOS} />
      </section>
    </main>
  );
}