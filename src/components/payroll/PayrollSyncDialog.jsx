import React from "react";
import { RefreshCw, X } from "lucide-react";
import { ACCENT, MUTED, NAVY, BORDER, SURFACE, BRAND_SOFT, dialogOverlay, dialogCard, ui } from "@/lib/platformStyles";

export default function PayrollSyncDialog({ open, onOpenChange, onConfirm, ar }) {
  if (!open) return null;

  return (
    <div
      style={dialogOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange?.(false);
      }}
    >
      <div style={{ ...dialogCard, maxWidth: "440px", padding: 0, overflow: "hidden" }} dir={ar ? "rtl" : "ltr"} role="dialog" aria-modal="true">
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <span style={{
                display: "inline-flex",
                height: "36px",
                width: "36px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "999px",
                border: `1px solid ${BORDER}`,
                background: BRAND_SOFT,
                color: ACCENT,
                marginBottom: "10px",
              }}>
                <RefreshCw style={{ width: 18, height: 18 }} strokeWidth={1.75} />
              </span>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: NAVY }}>
                {ar ? "تحديث بيانات الرواتب" : "Refresh payroll data"}
              </h2>
              <p style={{ margin: "8px 0 0", fontSize: "13px", color: MUTED, lineHeight: 1.7 }}>
                {ar ? "سيتم تحديث الراتب الأساسي والبدلات والعملة للموظفين غير المدفوعين فقط." : "Base salary, allowances, and currency will be refreshed for unpaid employees only."}
              </p>
            </div>
            <button type="button" onClick={() => onOpenChange?.(false)} aria-label={ar ? "إغلاق" : "Close"} style={{ ...ui.btnGhost, padding: "6px" }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "14px 20px" }}>
          <button type="button" onClick={() => onOpenChange?.(false)} style={ui.btnSecondary}>
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => { onConfirm?.(); onOpenChange?.(false); }}
            style={ui.btnPrimary}
          >
            {ar ? "تأكيد التحديث" : "Confirm refresh"}
          </button>
        </div>
      </div>
    </div>
  );
}
