import React from "react";
import { X, QrCode, FileText, AlertTriangle, ArrowLeftRight, Pencil, CheckCircle2 } from "lucide-react";
import AssetStatusBadge from "@/components/assets/AssetStatusBadge";
import CustodyTimeline from "@/components/assets/CustodyTimeline";
import MaintenanceLog from "@/components/assets/MaintenanceLog";
import { assetAlerts as getAssetAlerts, endOfLifeDate as getEndOfLifeDate } from "@/lib/assetAlerts";
import {
  INK, MUTED, BORDER, SURFACE, CARD, ui, dialogOverlay, dialogCard,
} from "@/lib/platformStyles";

const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
    <span style={{ fontSize: 12, color: MUTED }}>{label}</span>
    <span style={{ fontSize: 13, color: INK, textAlign: "end" }}>{value || "—"}</span>
  </div>
);

export default function AssetDetail({
  asset,
  custody,
  maintenance,
  lang,
  stationName,
  onClose,
  onHandover,
  onEdit,
  onAddMaintenance,
  onMarkLost,
  onResolveLost,
}) {
  const ar = lang === "ar";
  const alerts = getAssetAlerts(asset, lang);
  const link = `${window.location.origin}/app/assets?asset=${encodeURIComponent(asset.qrCode || asset.assetCode)}`;
  const qr = `https://quickchart.io/qr?size=200&text=${encodeURIComponent(link)}`;

  return (
    <div style={{ ...dialogOverlay, alignItems: "flex-end" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...dialogCard,
          maxWidth: 680,
          maxHeight: "92vh",
          borderRadius: "16px 16px 0 0",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 650, color: INK }}>{asset.name}</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: MUTED, fontVariantNumeric: "tabular-nums" }}>{asset.assetCode}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AssetStatusBadge status={asset.status} lang={lang} />
            <button type="button" onClick={onClose} style={{ ...ui.btnGhost, padding: 6 }} aria-label={ar ? "إغلاق" : "Close"}>
              <X size={16} />
            </button>
          </div>
        </div>

        {alerts.length > 0 && (
          <div style={{ borderRadius: 10, border: "1px solid #FDE68A", background: "#FFFBEB", padding: 12 }}>
            {alerts.map((a) => (
              <p key={a} style={{ margin: "0 0 4px", fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={13} /> {a}
              </p>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0,1fr) auto" }}>
          <div>
            <Row label={ar ? "الفئة" : "Category"} value={asset.category} />
            <Row label={ar ? "الحائز الحالي" : "Current holder"} value={asset.holderName} />
            <Row label={ar ? "الوحدة والمقر" : "Unit & site"} value={`${stationName(asset.stationId)}${asset.site ? ` · ${asset.site}` : ""}`} />
            <Row label={ar ? "تاريخ الشراء" : "Purchase date"} value={asset.purchaseDate} />
            <Row label={ar ? "القيمة" : "Value"} value={asset.value ? Number(asset.value).toLocaleString("en-US") : ""} />
            <Row label={ar ? "نهاية الضمان" : "Warranty end"} value={asset.warrantyEndDate} />
            <Row label={ar ? "نهاية العمر الافتراضي" : "End of useful life"} value={getEndOfLifeDate(asset)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <img
              src={qr}
              alt="QR"
              style={{ width: 112, height: 112, borderRadius: 10, border: `1px solid ${BORDER}`, background: "#fff", padding: 4 }}
            />
            <span style={{ fontSize: 11, color: MUTED, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <QrCode size={12} /> {asset.qrCode}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {asset.status !== "lost" ? (
            <button type="button" onClick={onHandover} style={{ ...ui.btnPrimary, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ArrowLeftRight size={14} /> {ar ? "تسليم العهدة" : "Hand over"}
            </button>
          ) : null}
          <button type="button" onClick={onEdit} style={{ ...ui.btnSecondary, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Pencil size={14} /> {ar ? "تعديل" : "Edit"}
          </button>
          {asset.status !== "lost" ? (
            <button type="button" onClick={onMarkLost} style={{ ...ui.btnDanger, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} /> {ar ? "بلاغ فقدان" : "Report lost"}
            </button>
          ) : (
            <button type="button" onClick={onResolveLost} style={{ ...ui.btnSecondary, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} /> {ar ? "إغلاق بلاغ الفقدان" : "Close lost case"}
            </button>
          )}
        </div>

        {(asset.documents || []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {asset.documents.map((d) => (
              <a
                key={d.url}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                style={{ ...ui.btnGhost, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
              >
                <FileText size={13} /> {d.name}
              </a>
            ))}
          </div>
        )}

        <div>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 650, color: INK }}>
            {ar ? "سجل العهدة" : "Custody trail"}
          </h4>
          <div style={{ background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 12 }}>
            <CustodyTimeline records={custody} lang={lang} />
          </div>
        </div>

        <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 12 }}>
          <MaintenanceLog records={maintenance} lang={lang} onAdd={onAddMaintenance} />
        </div>
      </div>
    </div>
  );
}
