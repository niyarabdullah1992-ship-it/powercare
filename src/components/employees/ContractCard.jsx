import React from "react";
import { FileText, ExternalLink, RefreshCw } from "lucide-react";

export default function ContractCard({ contract, canEdit, ar, onUpdate }) {
  const date = (value) => value ? new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB").format(new Date(`${value}T00:00:00`)) : "—";
  return <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-destructive/10"><FileText className="h-7 w-7 text-destructive" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{contract.fileName}</p>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">{ar ? "تاريخ البداية:" : "Start date:"}</span> {date(contract.startDate)}</p>
          <p><span className="text-muted-foreground">{ar ? "تاريخ النهاية:" : "End date:"}</span> {date(contract.endDate)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground"><ExternalLink className="h-4 w-4" />{ar ? "عرض / تنزيل" : "View / download"}</a>
        {canEdit && <button type="button" onClick={onUpdate} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted"><RefreshCw className="h-4 w-4" />{ar ? "تحديث العقد" : "Update contract"}</button>}
      </div>
    </div>
  </div>;
}