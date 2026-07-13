import React from "react";
import { useI18n } from "@/lib/i18n";
import { X } from "lucide-react";

export const PRESET_BANNERS = [
  "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/221c9c728_generated_image.png",
  "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/8480934c9_generated_image.png",
  "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/11de53104_generated_image.png",
  "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/e7d793d09_generated_image.png",
];

export default function BannerGallery({ onSelect, onClose }) {
  const { lang } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">
            {lang === "ar" ? "اختر صورة غلاف جاهزة" : "Choose a ready banner"}
          </h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PRESET_BANNERS.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => { onSelect(url); onClose(); }}
              className="overflow-hidden rounded-xl border border-border transition hover:ring-2 hover:ring-accent"
            >
              <img src={url} alt="" className="h-20 w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}