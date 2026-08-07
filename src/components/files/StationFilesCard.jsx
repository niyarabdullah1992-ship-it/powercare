import React from "react";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function StationFilesCard({ station, count, onOpen }) {
  const { lang, dir } = useI18n();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  return (
    <button type="button" onClick={onOpen} className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-start shadow-sm transition hover:border-accent/60 hover:shadow-soft">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Building2 className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold" dir="auto">{station.name}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">{count} {lang === "ar" ? "عنصر" : "items"}</span>
      </span>
      <Chevron className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
    </button>
  );
}