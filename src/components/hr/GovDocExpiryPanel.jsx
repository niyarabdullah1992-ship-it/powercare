import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/PowerCareAuth";
import { deriveAttachedGovDocAlerts, EXPIRY_WARN_DAYS } from "@/lib/complianceDerivations";
import { ChromeBox } from "@/components/shared/IdentityCard";
import { BAD, MUTED, NAVY, WARN } from "@/lib/platformStyles";

function tone(days) {
  if (days < 0) return BAD;
  return WARN;
}

export default function GovDocExpiryPanel({ lang = "ar", compact = false }) {
  const ar = lang === "ar";
  const { data } = useAuth();
  const rows = useMemo(() => deriveAttachedGovDocAlerts(data?.employees || []), [data?.employees]);

  if (compact) {
    if (!rows.length) return null;
    const expired = rows.filter((row) => row.days < 0).length;
    return (
      <Link
        to="/app/settings?tab=docs"
        style={{
          display: "block",
          textDecoration: "none",
          borderRadius: 12,
          border: "1px solid #FDE68A",
          background: "#FFFBEB",
          padding: "12px 16px",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "#B45309" }}>
          {ar
            ? `${rows.length} ملف حكومي مرفق يحتاج تجديدًا`
            : `${rows.length} attached government files need renewal`}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#92400E", lineHeight: 1.55 }}>
          {expired
            ? (ar ? `${expired} منتهٍ — يُنبَّه الموظف والموارد البشرية.` : `${expired} expired — employee and HR are alerted.`)
            : (ar ? `يُنبَّه الأشخاص المعنيون قبل ${EXPIRY_WARN_DAYS} يومًا من الانتهاء.` : `The named people are alerted ${EXPIRY_WARN_DAYS} days before expiry.`)}
        </div>
      </Link>
    );
  }

  return (
    <ChromeBox>
      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
        {ar ? "ملفات حكومية مرفقة" : "Attached government files"}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.65, maxWidth: 720 }}>
        {ar
          ? `التنبيه يظهر فقط إذا أُرفق الملف وحُدّد تاريخ انتهائه. يُنبَّه الموظف والموارد البشرية ومدير الفرع قبل ${EXPIRY_WARN_DAYS} يومًا. هذا تنبيه داخل المنصة — ليس إرسالًا حيًا لقوى أو التأمينات.`
          : `An alert appears only when the file is attached and an expiry date is set. The employee, HR and station manager are notified ${EXPIRY_WARN_DAYS} days before. This is an in-app alert — not a live Qiwa or GOSI send.`}
      </p>

      {rows.length === 0 ? (
        <div style={{ marginTop: 16, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          {ar
            ? "لا ملفات مرفقة قاربت على الانتهاء. ارفع الوثيقة في ملف الموظف مع تاريخ الانتهاء ليظهر التنبيه هنا."
            : "No attached files are nearing expiry. Upload the document on the employee file with an expiry date to raise an alert here."}
        </div>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((row) => (
            <Link
              key={`${row.employeeId}-${row.kind}-${row.expiryDate}`}
              to={row.employeeId ? `/app/employees/${row.employeeId}` : "/app/hr"}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr) auto",
                gap: 12,
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: 11,
                border: "1px solid #E2E8F0",
                textDecoration: "none",
                background: row.days < 0 ? "#FEF2F2" : "#FFFBEB",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{row.name}</div>
                <div style={{ marginTop: 3, fontSize: 12, color: MUTED }}>
                  {ar ? row.docLabelAr : row.docLabelEn}
                  {row.stationName ? ` · ${row.stationName}` : ""}
                </div>
              </div>
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>
                {(ar ? row.notifyAr : row.notifyEn).join(" · ")}
              </div>
              <span style={tone(row.days)}>
                {row.days < 0
                  ? (ar ? "منتهٍ" : "Expired")
                  : (ar ? `${row.days} يومًا` : `${row.days} days`)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </ChromeBox>
  );
}
