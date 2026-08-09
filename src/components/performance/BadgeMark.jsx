import React from "react";

// Print-friendly level mark: the tier number inside a circle shaded from grey to green.
const TIERS = [
  "bg-muted text-muted-foreground border-border",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-emerald-100 text-emerald-800 border-emerald-300",
  "bg-emerald-500 text-white border-emerald-600",
  "bg-emerald-700 text-white border-emerald-800",
];

export default function BadgeMark({ level = 0, size = "md", title }) {
  const dims = size === "sm" ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs";
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-semibold ${dims} ${TIERS[Math.min(level, TIERS.length - 1)]}`}
    >
      {level + 1}
    </span>
  );
}