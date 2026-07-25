import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { updateEmployeeProfile } from "@/lib/store";
import { Loader2, Save } from "lucide-react";

export default function ContractForm({ employee, companyId, contract, ar, onDone }) {
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState(contract?.startDate || "");
  const [endDate, setEndDate] = useState(contract?.endDate || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const isPdf = file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    if (!isPdf || !startDate || !endDate || endDate < startDate) {
      setError(ar ? "اختر ملف PDF وأدخل تاريخي بداية ونهاية صحيحين." : "Choose a PDF and enter valid start and end dates.");
      return;
    }
    setSaving(true);
    try {
      const uploaded = await base44.integrations.Core.UploadFile({ file });
      updateEmployeeProfile(companyId, employee.id, { contract: { fileUrl: uploaded.file_url, fileName: file.name, startDate, endDate } });
      onDone();
    } catch {
      setError(ar ? "تعذر رفع العقد. حاول مرة أخرى." : "The contract could not be uploaded. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
    <input type="file" accept="application/pdf,.pdf" onChange={(event) => { setFile(event.target.files?.[0] || null); setError(""); }} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs text-muted-foreground">{ar ? "تاريخ بداية العقد" : "Contract start date"}<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm" /></label>
      <label className="text-xs text-muted-foreground">{ar ? "تاريخ نهاية العقد" : "Contract end date"}<input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm" /></label>
    </div>
    {error && <p className="text-xs text-destructive">{error}</p>}
    <button type="button" onClick={save} disabled={saving} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{ar ? "حفظ العقد" : "Save contract"}</button>
  </div>;
}