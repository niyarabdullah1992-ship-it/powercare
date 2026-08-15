import React from "react";
import { MapPin, ClipboardCheck, Gauge } from "lucide-react";

const ICONS = { MapPin, ClipboardCheck, Gauge };

export default function TruePerfPillar({ pillar }) {
  const Icon = ICONS[pillar.icon] || Gauge;
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-accent">
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </span>
        <div>
          <h3 className="font-heading text-xl font-semibold text-primary">{pillar.titleAr}</h3>
          <p className="text-[11px] uppercase tracking-widest text-accent">{pillar.titleEn}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {pillar.pointsAr.map((point) => (
          <li key={point} className="flex gap-2 text-sm leading-6 text-foreground">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}