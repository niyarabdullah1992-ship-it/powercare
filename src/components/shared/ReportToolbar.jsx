import React from "react";
import PeriodPicker from "@/components/shared/PeriodPicker";
import ExportBar from "@/components/shared/ExportBar";
import { usePeriod } from "@/lib/PeriodContext";
import { useI18n } from "@/lib/i18n";

// One row directly under the tab bar in every section: period on one side,
// export on the other, section-specific filters as children, and a single line
// telling the visitor exactly what is on screen right now.
export default function ReportToolbar({
  showDaily = false,
  showWeekly = false,
  contextNote = "",
  children,
  ...exportProps
}) {
  const { lang } = useI18n();
  const { resolved } = usePeriod();
  const shownLabel = lang === "ar" ? "معروض" : "Showing";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ExportBar {...exportProps} />
        <div className="flex flex-wrap items-start gap-3">
          {children}
          <PeriodPicker showDaily={showDaily} showWeekly={showWeekly} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-body">
        {shownLabel}: {resolved.label}
        {contextNote ? ` · ${contextNote}` : ""}
      </p>
    </div>
  );
}