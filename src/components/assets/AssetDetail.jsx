import React from "react";
import { X, QrCode, FileText, AlertTriangle, ArrowLeftRight, Pencil } from "lucide-react";
import AssetStatusBadge from "@/components/assets/AssetStatusBadge";
import CustodyTimeline from "@/components/assets/CustodyTimeline";
import MaintenanceLog from "@/components/assets/MaintenanceLog";
import { assetAlerts, endOfLifeDate } from "@/lib/assetAlerts";

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-3 py-1.5 border-b border-border/60 last:border-0">
    <span className="text-xs font-body text-muted-foreground">{label}</span>
    <span className="text-sm font-body">{value || "—"}</span>
  </div>
);

export default function AssetDetail({ asset, custody, maintenance, lang, stationName, onClose, onHandover, onEdit, onAddMaintenance, onMarkLost }) {
  const alerts = assetAlerts(asset, lang);
  const link = `${window.location.origin}/app/assets?asset=${encodeURIComponent(asset.qrCode || asset.assetCode)}`;
  const qr = `https://quickchart.io/qr?size=200&text=${encodeURIComponent(link)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-[10px] border border-border bg-card p-4 space-y-4 pb-safe">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading text-lg font-semibold truncate">{asset.name}</h3>
            <p className="text-xs font-display tabular-nums text-muted-foreground">{asset.assetCode}</p>
          </div>
          <div className="flex items-center gap-2">
            <AssetStatusBadge status={asset.status} lang={lang} />
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="rounded-[10px] border border-amber-300 bg-amber-50 p-3 space-y-1">
            {alerts.map((a) => (
              <p key={a} className="text-xs font-body text-amber-900 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {a}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          <div>
            <Row label={lang === "ar" ? "الفئة" : "Category"} value={asset.category} />
            <Row label={lang === "ar" ? "الحائز الحالي" : "Current holder"} value={asset.holderName} />
            <Row label={lang === "ar" ? "الوحدة والمقر" : "Unit & site"} value={`${stationName(asset.stationId)}${asset.site ? ` · ${asset.site}` : ""}`} />
            <Row label={lang === "ar" ? "تاريخ الشراء" : "Purchase date"} value={asset.purchaseDate} />
            <Row label={lang === "ar" ? "القيمة" : "Value"} value={asset.value ? Number(asset.value).toLocaleString("en-US") : ""} />
            <Row label={lang === "ar" ? "نهاية الضمان" : "Warranty end"} value={asset.warrantyEndDate} />
            <Row label={lang === "ar" ? "نهاية العمر الافتراضي" : "End of useful life"} value={endOfLifeDate(asset)} />
            <Row label={lang === "ar" ? "الفحص القادم" : "Next inspection"} value={asset.nextInspectionDate} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <img src={qr} alt="QR" className="w-28 h-28 rounded-[10px] border border-border bg-white p-1" />
            <span className="text-[11px] font-body text-muted-foreground flex items-center gap-1"><QrCode className="w-3 h-3" /> {asset.qrCode}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={onHandover} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-body text-primary-foreground">
            <ArrowLeftRight className="w-4 h-4" /> {lang === "ar" ? "تسليم العهدة" : "Hand over"}
          </button>
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-body hover:bg-muted">
            <Pencil className="w-4 h-4" /> {lang === "ar" ? "تعديل" : "Edit"}
          </button>
          {asset.status !== "lost" && (
            <button onClick={onMarkLost} className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-2 text-sm font-body text-destructive hover:bg-red-50">
              <AlertTriangle className="w-4 h-4" /> {lang === "ar" ? "فتح بلاغ فقدان" : "Report lost"}
            </button>
          )}
        </div>

        {(asset.documents || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {asset.documents.map((d) => (
              <a key={d.url} href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-body hover:bg-muted">
                <FileText className="w-3.5 h-3.5" /> {d.name}
              </a>
            ))}
          </div>
        )}

        <div>
          <h4 className="font-heading font-semibold mb-2">{lang === "ar" ? "سجل العهدة" : "Custody trail"}</h4>
          <CustodyTimeline records={custody} lang={lang} />
        </div>

        <MaintenanceLog records={maintenance} lang={lang} onAdd={onAddMaintenance} />
      </div>
    </div>
  );
}