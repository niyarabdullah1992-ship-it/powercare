import React, { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// استيراد جماعي من Excel: الأعمدة المتوقعة الاسم، الرقم الوظيفي، الجوال، البريد.
export default function InviteExcelImport({ onRows, lang }) {
  const ar = lang === "ar";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            rows: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "اسم الموظف / employee name" },
                  jobNumber: { type: "string", description: "الرقم الوظيفي / job number" },
                  phone: { type: "string", description: "رقم الجوال / mobile" },
                  email: { type: "string", description: "البريد الإلكتروني / email" },
                },
              },
            },
          },
        },
      });
      if (res.status !== "success") throw new Error(res.details || "extract failed");
      const rows = (res.output?.rows || (Array.isArray(res.output) ? res.output : [])).filter((r) => r.name && r.jobNumber);
      if (!rows.length) throw new Error(ar ? "لم يُعثر على صفوف صالحة (الاسم والرقم الوظيفي مطلوبان)" : "No valid rows found (name and job number required)");
      await onRows(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-heading font-semibold flex items-center gap-2 mb-2"><FileSpreadsheet className="w-4 h-4 text-accent" />{ar ? "استيراد جماعي من Excel" : "Bulk import from Excel"}</h3>
      <p className="text-xs text-muted-foreground mb-3">{ar ? "أعمدة الملف: الاسم، الرقم الوظيفي، الجوال، البريد الإلكتروني." : "Columns: name, job number, mobile, email."}</p>
      <label className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm cursor-pointer hover:bg-muted">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        {ar ? "اختيار ملف Excel / CSV" : "Choose Excel / CSV file"}
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} disabled={busy} />
      </label>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}