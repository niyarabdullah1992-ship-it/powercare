import React from "react";

export default function VideoTechHud({ index, logoUrl }) {
  return <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
    <div className="tech-hud-grid" />
    <div className="tech-hud-scan" />
    <div className="absolute inset-x-4 top-5 flex items-center justify-between text-[9px] font-medium tracking-[0.22em] text-landing-gold-light">
      <span className="rounded-full border border-landing-gold/40 bg-landing-cinema/55 px-3 py-1.5 backdrop-blur-md">POWERCARE • 2090</span>
      <span className="flex items-center gap-2"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-landing-gold" /> LIVE OPS</span>
    </div>
    <div className="tech-hud-reticle"><i /><i /><i /><i /></div>
    <div className={`absolute inset-x-0 flex justify-center transition-all duration-700 ${index === 4 ? "bottom-[34%] scale-125" : "bottom-6 scale-75 opacity-80"}`}>
      <div className="rounded-2xl border border-landing-gold/35 bg-landing-bg/90 p-2 shadow-2xl backdrop-blur-xl"><img src={logoUrl} alt="" className="h-12 w-auto rounded-xl object-contain" /></div>
    </div>
  </div>;
}