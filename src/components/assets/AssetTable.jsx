import React from "react";
import { AlertTriangle } from "lucide-react";
import AssetStatusBadge from "@/components/assets/AssetStatusBadge";
import { inspectionDue } from "@/lib/assetAlerts";

export default function AssetTable({ assets, lang, stationName, onOpen }) {
  const H = lang === "ar"
    ? ["الأصل والرقم التسلسلي", "الفئة", "الحائز", "الوحدة والمقر", "الحالة", "الفحص القادم"]
    : ["Asset & serial", "Category", "Holder", "Unit & site", "Status", "Next inspection"];

  if (!assets.length) {
    return <p className="rounded-[10px] border border-border bg-card p-8 text-center text-sm font-body text-muted-foreground">{lang === "ar" ? "لا توجد أصول مطابقة." : "No matching assets."}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[10px] border border-border bg-card shadow-soft">
      <table className="w-full mobile-cards">
        <thead>
          <tr>{H.map((h) => <th key={h} className="px-3 py-2 text-start font-body">{h}</th>)}</tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.id} onClick={() => onOpen(a)} className="cursor-pointer border-t border-border">
              <td data-label={H[0]} className="px-3 py-2">
                <p className="font-body font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground font-display tabular-nums">{a.assetCode}</p>
              </td>
              <td data-label={H[1]} className="px-3 py-2 font-body">{a.category || "—"}</td>
              <td data-label={H[2]} className="px-3 py-2 font-body">{a.holderName || "—"}</td>
              <td data-label={H[3]} className="px-3 py-2 font-body">{stationName(a.stationId)}{a.site ? ` · ${a.site}` : ""}</td>
              <td data-label={H[4]} className="px-3 py-2"><AssetStatusBadge status={a.status} lang={lang} /></td>
              <td data-label={H[5]} className="px-3 py-2 font-display tabular-nums text-sm">
                <span className={inspectionDue(a) ? "text-destructive inline-flex items-center gap-1" : ""}>
                  {inspectionDue(a) && <AlertTriangle className="w-3.5 h-3.5" />}
                  {a.nextInspectionDate || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}