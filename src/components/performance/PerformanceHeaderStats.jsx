import React from "react";

// Three figures on the navy banner: scope performance, period, approved evidence.
export default function PerformanceHeaderStats({ items }) {
  return (
    <div className="mt-4 flex flex-wrap items-stretch gap-x-5 gap-y-3">
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <span className="w-px h-8 bg-white/15 self-center" aria-hidden="true" />}
          <div>
            <p className="text-[11px] font-body" style={{ color: "rgba(255,255,255,0.55)" }}>{item.label}</p>
            <p className="text-2xl font-semibold font-heading text-white leading-tight">{item.value}</p>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}