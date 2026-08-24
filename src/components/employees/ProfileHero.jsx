import React, { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { MUTED, NAVY, NAVY_FILL, OK, WARN, ACCENT } from "@/lib/platformStyles";
import { profileCompletionStats } from "@/lib/employeeProfileFields";
import IdentityCard from "@/components/shared/IdentityCard";

/** Platform isEmpFile hero — L2623–2646 (inline styles AS-IS). */
export default function ProfileHero({ employee, companyId, canEdit, roleLabel, grade, stationName }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [uploading, setUploading] = useState(false);
  const avatarInput = useRef(null);
  const profile = employee.profile || {};

  const { pct: completionPct } = profileCompletionStats(employee);

  const hireIso = profile.hireDate || employee.hireDate || employee.startDate || "";
  const hireDate = hireIso ? new Date(`${String(hireIso).slice(0, 10)}T00:00:00`) : null;
  const preStart = hireDate && hireDate > new Date();
  const svcYears = hireDate && !preStart
    ? Math.max(0, Math.floor((Date.now() - hireDate.getTime()) / 31557600000))
    : 0;
  const yrWord = (n) => {
    if (ar) {
      if (n === 0) return "أقل من سنة";
      if (n === 1) return "سنة واحدة";
      if (n === 2) return "سنتان";
      if (n <= 10) return `${n} سنوات`;
      return `${n} سنة`;
    }
    return `${n} year${n === 1 ? "" : "s"} of service`;
  };
  const niceHire = hireDate
    ? hireDate.toLocaleDateString(ar ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { year: "numeric", month: "short", day: "numeric" })
    : "—";
  const tenure = preStart
    ? (ar ? `يباشر في ${niceHire} — لم يباشر بعد` : `Starts ${niceHire} — not yet commenced`)
    : (ar ? `${yrWord(svcYears)} في الخدمة` : yrWord(svcYears));

  const statusLabel = preStart
    ? (ar ? "قيد المباشرة" : "Pending start")
    : (employee.active === false ? (ar ? "غير نشط" : "Inactive") : (ar ? "نشط" : "Active"));
  const statusStyle = preStart ? WARN : OK;

  const initials = (employee.name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const dept = profile.department || grade?.label || grade?.name || "";
  const meta = [roleLabel, dept, stationName].filter(Boolean).join(" · ");

  const upload = async (file) => {
    if (!file || !canEdit) return;
    setUploading(true);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      updateEmployeeProfile(companyId, employee.id, { avatarUrl: up.file_url });
    } finally {
      setUploading(false);
    }
  };

  return (
    <IdentityCard dir={ar ? "rtl" : "ltr"} bodyStyle={{ padding: 0 }}>
    <div style={{
      padding: "20px 22px",
      display: "flex",
      gap: "18px",
      flexWrap: "wrap",
      alignItems: "center",
    }}
    >
      <button
        type="button"
        onClick={() => canEdit && avatarInput.current?.click()}
        disabled={!canEdit || uploading}
        title={canEdit ? (ar ? "تحديث الصورة" : "Update photo") : undefined}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: NAVY_FILL,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          fontWeight: 600,
          fontFamily: "'IBM Plex Sans',sans-serif",
          flexShrink: 0,
          border: "none",
          padding: 0,
          cursor: canEdit ? "pointer" : "default",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {profile.avatarUrl
          ? <img src={profile.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initials}
        {uploading && (
          <span style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          >
            <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
          </span>
        )}
      </button>
      <input
        ref={avatarInput}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => upload(e.target.files?.[0])}
      />

      <div style={{ flex: "1 1 240px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "19px", fontWeight: 600, color: NAVY }}>{employee.name}</span>
          <span style={statusStyle}>{statusLabel}</span>
        </div>
        <div style={{ fontSize: "13px", color: "#A8B4C8", marginTop: "4px" }}>{meta || "—"}</div>
        <div style={{ fontSize: "11px", color: "#A8B4C8", marginTop: "4px", fontFamily: "'IBM Plex Mono',monospace" }} dir="ltr">
          {employee.id}
        </div>
      </div>

      <div style={{ flex: "0 0 auto", display: "flex", gap: "22px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "10px", color: MUTED, letterSpacing: "0.06em" }}>
            {ar ? "اكتمال الملف" : "COMPLETION"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "7px" }}>
            <span style={{ width: "92px", height: "6px", borderRadius: "5px", background: "#F1F5F9", overflow: "hidden" }}>
              <span style={{
                display: "block",
                width: `${completionPct}%`,
                height: "100%",
                background: completionPct === 100 ? "#15803D" : ACCENT,
                borderRadius: "5px",
              }}
              />
            </span>
            <span dir="ltr" style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right", color: NAVY }}>
              {completionPct}%
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: "10px", color: MUTED, letterSpacing: "0.06em" }}>
            {ar ? "تاريخ التعيين" : "HIRE DATE"}
          </div>
          <div style={{ fontSize: "13px", fontWeight: 500, marginTop: "7px", color: NAVY }}>{tenure}</div>
        </div>
      </div>
    </div>
    </IdentityCard>
  );
}
