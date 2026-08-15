import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import { Loader2, Save } from "lucide-react";
import {
  CONTRACT_TYPE_OPTIONS,
  canonicalFieldValue,
  isFixedContractType,
} from "@/lib/employeeProfileFields";
import { MUTED, NAVY, NAVY_FILL, field, cardShell, CARD } from "@/lib/platformStyles";

export default function ContractForm({ employee, companyId, contract, ar, onDone }) {
  const [file, setFile] = useState(null);
  const [contractType, setContractType] = useState(
    canonicalFieldValue(
      { options: "contractType" },
      contract?.type || employee?.profile?.contractType || "indefinite",
    ) || "indefinite",
  );
  const [startDate, setStartDate] = useState(contract?.startDate || employee?.profile?.hireDate || "");
  const [endDate, setEndDate] = useState(contract?.endDate || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fixed = isFixedContractType(contractType);
  const hasExisting = Boolean(contract?.fileUrl);

  const save = async () => {
    const isPdf = file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    if (!hasExisting && !isPdf) {
      setError(ar ? "ارفع عقد العمل بصيغة PDF." : "Upload the employment contract as a PDF.");
      return;
    }
    if (file && !isPdf) {
      setError(ar ? "الملف يجب أن يكون PDF." : "The file must be a PDF.");
      return;
    }
    if (!startDate) {
      setError(ar ? "أدخل تاريخ بداية العقد." : "Enter the contract start date.");
      return;
    }
    if (fixed && !endDate) {
      setError(ar ? "العقد محدد المدة يحتاج تاريخ نهاية." : "A fixed-term contract needs an end date.");
      return;
    }
    if (endDate && endDate < startDate) {
      setError(ar ? "تاريخ النهاية قبل البداية." : "The end date is before the start date.");
      return;
    }
    setSaving(true);
    try {
      let fileUrl = contract?.fileUrl || "";
      let fileName = contract?.fileName || "";
      if (file) {
        const uploaded = await base44.integrations.Core.UploadFile({ file });
        fileUrl = uploaded.file_url;
        fileName = file.name;
      }
      updateEmployeeProfile(companyId, employee.id, {
        contractType,
        contract: {
          fileUrl,
          fileName,
          startDate,
          endDate: fixed ? endDate : "",
          type: contractType,
        },
      });
      onDone();
    } catch {
      setError(ar ? "تعذر حفظ العقد. حاول مرة أخرى." : "The contract could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ ...cardShell, display: "flex", flexDirection: "column", gap: "14px" }} dir={ar ? "rtl" : "ltr"}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
        {ar ? "عقد العمل — جاهز لملف قوى" : "Employment contract — Qiwa file"}
      </div>
      <div style={{ fontSize: "11px", color: MUTED, lineHeight: 1.65 }}>
        {ar
          ? "يُحفظ في الملف — الإرسال الحي لقوى عند الاعتماد. غير محدد المدة يبقى بلا تاريخ نهاية. محدد المدة يُنبَّه قبل انتهائه بستين يومًا."
          : "Stored on the file — live Qiwa send waits for credentials. Indefinite contracts stay open-ended. Fixed-term contracts are flagged sixty days before they expire."}
      </div>
      <label style={{ fontSize: "11px", color: MUTED }}>
        {ar ? "نوع العقد" : "Contract type"}
        <select
          value={contractType}
          onChange={(e) => {
            setContractType(e.target.value);
            setError("");
          }}
          style={{ ...field, marginTop: 6 }}
        >
          {CONTRACT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{ar ? o.ar : o.en}</option>
          ))}
        </select>
      </label>
      <input
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => {
          setFile(event.target.files?.[0] || null);
          setError("");
        }}
        style={{ ...field, height: "auto", padding: "8px 12px" }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "12px" }}>
        <label style={{ fontSize: "11px", color: MUTED }}>
          {ar ? "تاريخ بداية العقد" : "Contract start date"}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ ...field, marginTop: 6 }}
          />
        </label>
        <label style={{ fontSize: "11px", color: MUTED }}>
          {ar ? "تاريخ نهاية العقد" : "Contract end date"}
          <input
            type="date"
            value={endDate}
            min={startDate}
            disabled={!fixed}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ ...field, marginTop: 6, opacity: fixed ? 1 : 0.55 }}
          />
        </label>
      </div>
      {error && <p style={{ margin: 0, fontSize: "12px", color: "#DC2626" }}>{error}</p>}
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onDone}
          style={{
            padding: "8px 15px",
            borderRadius: "9px",
            border: "1px solid #E2E8F0",
            background: CARD,
            color: MUTED,
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {ar ? "إلغاء" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            padding: "8px 15px",
            borderRadius: "9px",
            border: "none",
            background: NAVY_FILL,
            color: "#fff",
            fontSize: "12px",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
          {ar ? "حفظ العقد" : "Save contract"}
        </button>
      </div>
    </div>
  );
}
