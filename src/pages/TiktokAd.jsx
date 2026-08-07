import React from "react";
import GeneratedVideoAd from "@/components/tiktok-ad/GeneratedVideoAd";
import "@/components/tiktok-ad/tiktok-ad.css";

const AD_VIDEOS = [
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/778392daf__2090_.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/0c9dd8f9a__2090_.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/28b6e4b69__2090_.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/1292e366b__2090_.mp4",
  "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/322c6b9aa__2090_.mp4",
];
const AD_LOGO = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/65a30b8a4_9a8843bf0_generated_image.png";
const AD_AUDIO = "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/59e28a277_speech.mp3";
const AD_POSTER = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/f70d7dfa4_generated_6460ea2a.png";

export default function TiktokAd() {
  return (
    <main className="ad-page" dir="rtl">
      <section className="ad-phone" aria-label="إعلان NiroVera عن الموظفين والعمليات">
        <GeneratedVideoAd urls={AD_VIDEOS} audioUrl={AD_AUDIO} logoUrl={AD_LOGO} posterUrl={AD_POSTER} />
      </section>
    </main>
  );
}