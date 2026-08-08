import React, { useState } from "react";
import { Camera, Loader2, Plus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

function PhotoUploader({ label, urls, onChange, ar }) {
  const [uploading, setUploading] = useState(false);
  const pick = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files.slice(0, 10 - urls.length)) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push(file_url);
      }
      onChange([...urls, ...uploaded]);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground font-body">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {urls.map((url) => (
          <div key={url} className="relative">
            <Image src={url} alt={label} className="h-16 w-16 rounded-md border border-border" />
            <button type="button" onClick={() => onChange(urls.filter((u) => u !== url))} className="absolute -top-1.5 -end-1.5 rounded-full bg-destructive p-0.5 text-white" aria-label="remove">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-accent/40 text-accent hover:bg-accent/5">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-5 w-5" />}
          <input type="file" accept="image/*" multiple className="hidden" onChange={pick} disabled={uploading} />
        </label>
      </div>
    </div>
  );
}

export default function WorkProofForm({ stations, ar, onSubmit }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ stationId: "", workTitle: "", workDescription: "", workDate: today });
  const [beforeImageUrls, setBeforeImageUrls] = useState([]);
  const [afterImageUrls, setAfterImageUrls] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const valid = form.stationId && form.workTitle.trim() && form.workDate;

  const submit = async (event) => {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    const ok = await onSubmit({ ...form, beforeImageUrls, afterImageUrls });
    setSaving(false);
    if (ok) {
      setForm({ stationId: "", workTitle: "", workDescription: "", workDate: today });
      setBeforeImageUrls([]);
      setAfterImageUrls([]);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-lg font-semibold">{ar ? "توثيق عمل جديد" : "Document new work"}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <select value={form.stationId} onChange={set("stationId")} required className="rounded-md border px-3 py-2 text-sm font-body">
          <option value="">{ar ? "اختر المحطة" : "Select station"}</option>
          {stations.map((s) => <option key={s.stationId} value={s.stationId}>{s.name}</option>)}
        </select>
        <input value={form.workTitle} onChange={set("workTitle")} required placeholder={ar ? "عنوان العمل المنجز" : "Work title"} className="rounded-md border px-3 py-2 text-sm font-body" />
        <input type="date" value={form.workDate} onChange={set("workDate")} required className="rounded-md border px-3 py-2 text-sm font-body" />
      </div>
      <textarea value={form.workDescription} onChange={set("workDescription")} rows={3} placeholder={ar ? "وصف تفصيلي للعمل المنجز…" : "Detailed description of the completed work…"} className="w-full rounded-md border px-3 py-2 text-sm font-body" />
      <div className="grid gap-4 sm:grid-cols-2">
        <PhotoUploader label={ar ? "صور قبل العمل" : "Before photos"} urls={beforeImageUrls} onChange={setBeforeImageUrls} ar={ar} />
        <PhotoUploader label={ar ? "صور بعد العمل" : "After photos"} urls={afterImageUrls} onChange={setAfterImageUrls} ar={ar} />
      </div>
      <button type="submit" disabled={!valid || saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {ar ? "إنشاء سجل الإثبات" : "Create proof record"}
      </button>
    </form>
  );
}