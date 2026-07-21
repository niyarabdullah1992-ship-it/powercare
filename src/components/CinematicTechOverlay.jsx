import React from "react";
import { Activity, AlertTriangle, Check, Cog, ScanLine, ShieldCheck } from "lucide-react";

const symbols = [
  { Icon: Check, position: "tech-symbol-check" },
  { Icon: Cog, position: "tech-symbol-gear" },
  { Icon: ShieldCheck, position: "tech-symbol-shield" },
  { Icon: AlertTriangle, position: "tech-symbol-alert" },
  { Icon: Activity, position: "tech-symbol-pulse" },
];

export default function CinematicTechOverlay() {
  return (
    <div className="cinematic-tech-overlay" aria-hidden="true">
      <div className="tech-cinema-scan"><ScanLine /></div>
      <span className="tech-cinema-line tech-cinema-line-a" />
      <span className="tech-cinema-line tech-cinema-line-b" />
      {symbols.map(({ Icon, position }) => (
        <span key={position} className={`tech-cinema-symbol ${position}`}>
          <span className="tech-cinema-orbit" />
          <Icon strokeWidth={1.35} />
        </span>
      ))}
    </div>
  );
}