import React, { useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export default function OrgTreeFullscreenButton({ active, onToggle, ar }) {
  useEffect(() => {
    if (!active) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event) => { if (event.key === "Escape") onToggle(false); };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
    };
  }, [active, onToggle]);

  const Icon = active ? Minimize2 : Maximize2;
  return (
    <button type="button" onClick={() => onToggle(!active)} className="flex items-center gap-1.5 rounded-md border border-primary-foreground/25 px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/10" title={active ? (ar ? "تصغير الشاشة" : "Exit full screen") : (ar ? "تكبير الشجرة" : "View full screen")}>
      <Icon className="h-4 w-4" /> {active ? (ar ? "تصغير" : "Exit") : (ar ? "تكبير" : "Full screen")}
    </button>
  );
}