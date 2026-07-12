import React from "react";
import { CalendarPlus, FileSpreadsheet } from "lucide-react";
import { buildPersonalIcs, buildPersonalCsv, downloadIcs, downloadCsv } from "@/lib/icsExport";
import { useI18n } from "@/lib/i18n";

// One-click export of the user's shifts, approved leave and maintenance plans.
// Two formats: .ics (direct calendar import) and Excel/CSV — the CSV uses Google
// Calendar's official import format, so it works in both Excel and Google Calendar.
export default function CalendarExportCard({ data, user }) {
  const { lang } = useI18n();
  const ar = lang === "ar";

  return (
    <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
          <CalendarPlus className="w-4 h-4 text-accent" />
          {ar ? "تصدير الجدول" : "Export schedule"}
        </h3>
        <p className="text-[11px] text-muted-foreground font-body mt-1">
          {ar
            ? "ورديات + إجازات + خطط صيانة. ملف Excel يفتح في إكسل ويُستورد أيضًا في تقويم Google: الإعدادات ← استيراد وتصدير."
            : "Shifts + leave + maintenance plans. The Excel file opens in Excel and also imports into Google Calendar: Settings → Import & export."}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => downloadCsv(buildPersonalCsv({ data, user }))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-body"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          {ar ? "ملف Excel (CSV)" : "Excel file (CSV)"}
        </button>
        <button
          onClick={() => downloadIcs(buildPersonalIcs({ data, user }))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-xs font-body hover:bg-muted"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          .ics
        </button>
      </div>
    </div>
  );
}