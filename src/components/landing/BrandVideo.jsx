import React from "react";

const BRAND_VIDEO_AR = "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/3381cac59_NiroVera.mp4";
const BRAND_VIDEO_EN = "https://media.base44.com/videos/public/6a4f617bd7360a0ae9581d2a/5a9c64879_NiroVeraCorporateAdEN.mp4";

export default function BrandVideo({ lang }) {
  const ar = lang === "ar";
  const BRAND_VIDEO_URL = ar ? BRAND_VIDEO_AR : BRAND_VIDEO_EN;
  return (
    <section className="border-y border-border bg-landing-bg px-4 py-12 sm:px-6 md:px-8">
      <div className="mx-auto max-w-[1100px]">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">NiroVera</p>
        <h2 className="mb-6 text-center font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
          {ar ? "تعرّف على المنصة في دقيقة" : "See the platform in a minute"}
        </h2>
        <div className="overflow-hidden rounded-xl border border-accent/35 bg-card shadow-elevated">
          <video
            key={BRAND_VIDEO_URL}
            src={BRAND_VIDEO_URL}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-primary"
            aria-label={ar ? "فيديو تعريفي عن منصة NiroVera" : "NiroVera platform introduction video"}
          />
        </div>
      </div>
    </section>
  );
}