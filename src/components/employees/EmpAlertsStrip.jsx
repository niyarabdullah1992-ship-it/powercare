import React, { useMemo } from "react";
import { OK, WARN, BAD } from "@/lib/platformStyles";

function daysTo(iso) {
  if (!iso) return null;
  const d = Math.round((new Date(`${String(iso).slice(0, 10)}T00:00:00`) - Date.now()) / 86400000);
  return Number.isFinite(d) ? d : null;
}

function expiryChip(iso, ar) {
  const d = daysTo(iso);
  if (d === null) return null;
  if (d < 0) return { text: ar ? "منتهٍ" : "Expired", style: BAD };
  if (d <= 60) return { text: ar ? `${d} يومًا` : `${d} days`, style: WARN };
  return { text: ar ? "ساري" : "Valid", style: OK };
}

function niceDate(iso, ar) {
  if (!iso) return "—";
  try {
    return new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString(
      ar ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB",
      { year: "numeric", month: "short", day: "numeric" },
    );
  } catch {
    return String(iso).slice(0, 10);
  }
}

const EXPIRY_FIELDS = [
  { keys: ["idExpiry", "iqamaExpiry"], ar: "انتهاء الهوية / الإقامة", en: "ID / Iqama expiry" },
  { keys: ["workPermitExpiry"], ar: "انتهاء رخصة العمل", en: "Work permit expiry" },
  { keys: ["passportExpiry"], ar: "انتهاء الجواز", en: "Passport expiry" },
  { keys: ["medicalInsuranceExpiry"], ar: "انتهاء التأمين الطبي", en: "Medical insurance expiry" },
];

/** Platform emp alerts — L2648–2661 «يحتاج تجديدًا». */
export default function EmpAlertsStrip({ employee, lang = "ar" }) {
  const ar = lang === "ar";
  const profile = employee?.profile || {};

  const alerts = useMemo(() => {
    const rows = [];
    for (const field of EXPIRY_FIELDS) {
      const iso = field.keys.map((k) => profile[k]).find(Boolean);
      if (!iso) continue;
      const chip = expiryChip(iso, ar);
      if (!chip) continue;
      if (chip.text === (ar ? "ساري" : "Valid")) continue;
      rows.push({
        label: ar ? field.ar : field.en,
        value: niceDate(iso, ar),
        chipText: chip.text,
        chipStyle: chip.style,
      });
    }
    const contractEnd = profile.contract?.endDate;
    if (contractEnd) {
      const chip = expiryChip(contractEnd, ar);
      if (chip && chip.text !== (ar ? "ساري" : "Valid")) {
        rows.push({
          label: ar ? "انتهاء العقد" : "Contract end",
          value: niceDate(contractEnd, ar),
          chipText: chip.text,
          chipStyle: chip.style,
        });
      }
    }
    return rows;
  }, [profile, ar]);

  if (!alerts.length) return null;

  return (
    <div style={{
      background: "#FFFBEB",
      border: "1px solid #FDE68A",
      borderRadius: "14px",
      padding: "16px 18px",
    }}
      dir={ar ? "rtl" : "ltr"}
    >
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#B45309" }}>
        {ar ? "يحتاج تجديدًا" : "Needs renewal"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginTop: "12px" }}>
        {alerts.map((a) => (
          <div
            key={`${a.label}-${a.value}`}
            style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}
          >
            <span style={{ flex: "1 1 200px", fontSize: "13px", color: "#78350F" }}>{a.label}</span>
            <span style={{ fontSize: "12px", color: "#92400E" }}>{a.value}</span>
            <span style={a.chipStyle}>{a.chipText}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
