import React, { useState, useEffect, useRef } from "react";
import { Palette, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CORPORATE_PALETTES, getPalette, applyPalette } from "@/lib/corporatePalettes";

// Header control that swaps the whole app between ready-made corporate colour themes.
export default function CorporatePalettePicker() {
  const { lang, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(getPalette);
  const ref = useRef(null);

  useEffect(() => { applyPalette(active); }, [active]);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={lang === "ar" ? "ثيمات مؤسسية" : "Corporate themes"}
        className="p-2 max-md:min-w-[44px] max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Palette className="w-4 h-4" strokeWidth={1.75} />
      </button>
      {open && (
        <div className={`absolute mt-2 ${dir === "rtl" ? "left-0" : "right-0"} w-60 bg-card text-foreground border border-border rounded-md shadow-xl z-50 p-1.5`}>
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {lang === "ar" ? "ثيمات مؤسسية" : "Corporate themes"}
          </p>
          {CORPORATE_PALETTES.map((palette) => (
            <button
              key={palette.id}
              onClick={() => { setActive(palette.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-start text-sm hover:bg-muted ${active === palette.id ? "bg-muted" : ""}`}
            >
              <span className="flex shrink-0 overflow-hidden rounded-full border border-border">
                {palette.swatches.map((color) => (
                  <span key={color} className="h-4 w-4" style={{ background: color }} />
                ))}
              </span>
              <span className="flex-1 truncate font-body">{lang === "ar" ? palette.nameAr : palette.nameEn}</span>
              {active === palette.id && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}