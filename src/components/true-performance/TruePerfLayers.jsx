import React from "react";

// رسم توضيحي هرمي: من الميدان إلى القرار، بعرض متدرّج يوضح الترقّي.
export default function TruePerfLayers({ layers }) {
  return (
    <div className="space-y-2">
      {layers.items.map((layer, index) => (
        <div
          key={layer.titleAr}
          className="mx-auto flex items-center gap-4 rounded-lg border border-accent/40 bg-card px-5 py-3"
          style={{ width: `${100 - index * 7}%` }}
        >
          <span className="font-heading text-2xl font-semibold text-accent/70">{layer.numAr}</span>
          <div className="min-w-0">
            <p className="font-heading text-base font-semibold text-primary">{layer.titleAr}</p>
            <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">{layer.textAr}</p>
          </div>
        </div>
      ))}
    </div>
  );
}