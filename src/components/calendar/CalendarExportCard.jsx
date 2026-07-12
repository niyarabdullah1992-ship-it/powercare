import React from "react";
import { CalendarPlus } from "lucide-react";
import { buildPersonalIcs, downloadIcs } from "@/lib/icsExport";
import { useI18n } from "@/lib/i18n";

// One-click export of the user's shifts, approved leave and maintenance plans
// as a .ics file — importable into Google Calendar without any account linking.
export default function CalendarExportCard({ data, user }) {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const handleExport = () => {
    downloadIcs(buildPersonalIcs({ data, user }));
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
          <CalendarPlus className="w-4 h-4 text-accent" />
          {ar ? "تقويم Google" : "Google Calendar"}
        </h3>
        <p className="text-[11px] text-muted-foreground font-body mt-1">
          {ar
            ? "حمّل ملف التقويم (ورديات + إجازات + خطط صيانة) ثم استورده في تقويم Google: الإعدادات ← استيراد وتصدير."
            : "Download your calendar file (shifts + leave + maintenance plans), then import it in Google Calendar: Settings → Import & export."}
        </p>
      </div>
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-body shrink-0"
      >
        <CalendarPlus className="w-3.5 h-3.5" />
        {ar ? "تحميل ملف التقويم (.ics)" : "Download calendar (.ics)"}
      </button>
    </div>
  );
}