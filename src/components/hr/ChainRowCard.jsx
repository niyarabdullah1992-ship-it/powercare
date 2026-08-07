import React from "react";
import { Building2 } from "lucide-react";

// One rung of the management ladder: navy card for an organisational branch,
// white card for a person (highlighted in green when it is the viewer).
export default function ChainRowCard({ row, lang }) {
  if (row.type === "station") {
    return (
      <div className="flex min-w-[220px] items-center gap-3 rounded-xl bg-primary px-5 py-3.5 text-primary-foreground shadow-elevated">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20">
          <Building2 className="h-4 w-4 text-accent" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold">{row.name}</p>
          {row.meta && <p className="truncate text-[11px] text-primary-foreground/60">{row.meta}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-w-[240px] items-center gap-3 rounded-xl bg-card px-4 py-3.5 shadow-soft ${row.isMe ? "border-[1.5px] border-accent" : "border border-border"}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold text-primary">
        {row.name.trim().charAt(0)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-semibold text-foreground">{row.name}</p>
        {row.role && (
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-muted-foreground">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {row.role}
          </p>
        )}
        <span className="mt-1 inline-block rounded-full border border-accent/25 bg-accent/8 px-2 py-0.5 text-[10px] text-accent-text">
          {row.isMe
            ? (lang === "ar" ? "أنت هنا" : "You are here")
            : row.isTop
              ? (lang === "ar" ? "رأس الهرم" : "Top of the pyramid")
              : row.chip
                ? (lang === "ar" ? `${row.chip} جهة تابعة` : `${row.chip} direct reports`)
                : (lang === "ar" ? "مستوى إشرافي" : "Supervisory level")}
        </span>
      </div>
    </div>
  );
}