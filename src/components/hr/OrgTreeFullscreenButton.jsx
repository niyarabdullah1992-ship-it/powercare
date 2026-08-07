import React, { useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export default function OrgTreeFullscreenButton({ active, onToggle, targetRef, ar }) {
  useEffect(() => {
    if (!active) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const syncFullscreen = () => { if (!document.fullscreenElement) onToggle(false); };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("fullscreenchange", syncFullscreen);
    };
  }, [active, onToggle]);

  const toggle = async () => {
    if (active) {
      if (document.fullscreenElement) await document.exitFullscreen();
      else onToggle(false);
      return;
    }
    try {
      if (targetRef.current?.requestFullscreen) await targetRef.current.requestFullscreen();
    } catch {
      // The fixed full-screen layout remains available when browser full-screen is blocked.
    }
    onToggle(true);
  };
  const Icon = active ? Minimize2 : Maximize2;
  return (
    <button type="button" onClick={toggle} className="flex items-center gap-1.5 rounded-md border border-primary-foreground/25 px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/10" title={active ? (ar ? "تصغير الشاشة" : "Exit full screen") : (ar ? "تكبير الشجرة" : "View full screen")}>
      <Icon className="h-4 w-4" /> {active ? (ar ? "تصغير" : "Exit") : (ar ? "تكبير" : "Full screen")}
    </button>
  );
}