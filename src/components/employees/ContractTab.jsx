import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import ContractForm from "@/components/employees/ContractForm";
import { MUTED, NAVY, OK, WARN, BAD, cardShell, CARD, SURFACE } from "@/lib/platformStyles";
import { CONTRACT_TYPE_OPTIONS, optionLabel } from "@/lib/employeeProfileFields";

const PDF_CHIP = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 9px",
  borderRadius: "20px",
  fontSize: "10px",
  fontWeight: 600,
  background: "#FEF2F2",
  color: "#DC2626",
  border: "1px solid #FECACA",
  flexShrink: 0,
};

function daysTo(iso) {
  if (!iso) return null;
  const d = Math.round((new Date(`${String(iso).slice(0, 10)}T00:00:00`) - Date.now()) / 86400000);
  return Number.isFinite(d) ? d : null;
}

function expiryChip(iso, ar) {
  const d = daysTo(iso);
  if (d === null) return { text: ar ? "مفتوح" : "Open-ended", style: OK };
  if (d < 0) return { text: ar ? "منتهٍ" : "Expired", style: BAD };
  if (d <= 60) return { text: ar ? `${d} يومًا` : `${d} days`, style: WARN };
  return { text: ar ? "ساري" : "Valid", style: OK };
}

function niceDate(iso, ar) {
  if (!iso) return "";
  try {
    return new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString(
      ar ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB",
      { year: "numeric", month: "short", day: "numeric" },
    );
  } catch {
    return String(iso).slice(0, 10);
  }
}

/** Platform isTabContract — L2741–2762 */
export default function ContractTab({ employee, companyId, canEdit }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const profile = employee.profile || {};
  const contract = profile.contract;
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <ContractForm employee={employee} companyId={companyId} contract={contract} ar={ar} onDone={() => setEditing(false)} />;
  }

  const typeRaw = contract?.type || profile.contractType || "";
  const type = optionLabel(CONTRACT_TYPE_OPTIONS, typeRaw, ar) || typeRaw || "—";
  const start = contract?.startDate || profile.hireDate || "";
  const end = contract?.endDate || "";
  const endChip = end ? expiryChip(end, ar) : { text: ar ? "مفتوح" : "Open-ended", style: OK };
  const qiwa = profile.qiwaRegistered === false
    ? (ar ? "لا" : "No")
    : (ar ? "نعم · مسجَّل في الملف" : "Yes · recorded in file");

  const rows = [
    { label: ar ? "نوع العقد" : "Contract type", value: type || "—", chipText: "", chipStyle: null },
    { label: ar ? "تاريخ البداية" : "Start date", value: start ? niceDate(start, ar) : "—", chipText: "", chipStyle: null },
    {
      label: ar ? "تاريخ النهاية" : "End date",
      value: end ? niceDate(end, ar) : (ar ? "غير محدد" : "Not set"),
      chipText: endChip.text,
      chipStyle: endChip.style,
    },
    { label: ar ? "مسجَّل في قوى" : "Registered in Qiwa", value: qiwa, chipText: "", chipStyle: null },
  ];

  const fileName = contract?.fileName
    || (contract?.fileUrl ? (ar ? "عقد العمل الموقّع.pdf" : "Signed employment contract.pdf") : null);

  return (
    <div style={cardShell} dir={ar ? "rtl" : "ltr"}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>{ar ? "عقد العمل" : "Employment contract"}</div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={{
              padding: "7px 13px",
              borderRadius: "9px",
              border: "1px solid #E2E8F0",
              background: CARD,
              color: MUTED,
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {contract?.fileUrl ? (ar ? "تحديث العقد" : "Update contract") : (ar ? "رفع عقد" : "Upload contract")}
          </button>
        ) : (
          <span style={{ fontSize: "10px", color: MUTED }}>{ar ? "للإدارة فقط" : "Management only"}</span>
        )}
      </div>
      <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.6, textWrap: "pretty" }}>
        {ar
          ? "يُحفظ العقد في الملف ليكون جاهزًا لتوثيق قوى. الإرسال الحي عند الاعتماد. غير محدد المدة يبقى مفتوحًا، ويُنبَّه قبل انتهاء المحدد بستين يومًا."
          : "The contract is stored on the file so it is ready for Qiwa. Live send waits for credentials. Indefinite contracts stay open-ended; fixed-term contracts are flagged sixty days before they expire."}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "14px", marginTop: "18px" }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div style={{ fontSize: "11px", color: MUTED }}>{r.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
              <span style={{ flex: 1, fontSize: "13px", color: NAVY }}>{r.value}</span>
              {r.chipText ? <span style={r.chipStyle}>{r.chipText}</span> : null}
            </div>
          </div>
        ))}
      </div>

      {fileName ? (
        <a
          href={contract.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "18px",
            padding: "12px 14px",
            borderRadius: "11px",
            background: SURFACE,
            border: "1px solid #E2E8F0",
            textDecoration: "none",
          }}
        >
          <span style={PDF_CHIP}>PDF</span>
          <span style={{ flex: 1, fontSize: "13px", color: NAVY }}>{fileName}</span>
        </a>
      ) : (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "18px",
          padding: "12px 14px",
          borderRadius: "11px",
          background: SURFACE,
          border: "1px solid #E2E8F0",
        }}
        >
          <span style={PDF_CHIP}>PDF</span>
          <span style={{ flex: 1, fontSize: "13px", color: MUTED }}>
            {ar ? "لا يوجد عقد مرفوع بعد" : "No contract uploaded yet"}
          </span>
        </div>
      )}
    </div>
  );
}
