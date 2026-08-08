import React, { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import PhotoUploader from "@/components/workproof/PhotoUploader";
import FileAttachmentUploader from "@/components/workproof/FileAttachmentUploader";
import CrewEditor from "@/components/workproof/CrewEditor";
import VehicleEditor from "@/components/workproof/VehicleEditor";

export default function WorkProofForm({ stations, ar, onSubmit }) {
  const today = new Date().toISOString().slice(0, 10);
  // When the user already entered a single station, its id is locked into the form.
  const lockedStationId = stations.length === 1 ? stations[0].stationId : "";
  const blank = { stationId: lockedStationId, workTitle: "", workDescription: "", workDate: today, plannedDays: "" };
  const [form, setForm] = useState(blank);
  const [workers, setWorkers] = useState([{ name: "", idType: "iqama", idNumber: "", phone: "" }]);
  const [vehicles, setVehicles] = useState([]);
  const [beforeImageUrls, setBeforeImageUrls] = useState([]);
  const [beforeFiles, setBeforeFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const valid = form.stationId && form.workTitle.trim() && form.workDate;

  const submit = async (event) => {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    const ok = await onSubmit({
      ...form,
      plannedDays: form.plannedDays === "" ? null : Number(form.plannedDays),
      workers: workers.filter((worker) => worker.name?.trim()),
      vehicles: vehicles.filter((vehicle) => vehicle.plate?.trim()),
      beforeImageUrls,
      beforeFiles,
    });
    setSaving(false);
    if (ok) {
      setForm(blank);
      setWorkers([{ name: "", idType: "iqama", idNumber: "", phone: "" }]);
      setVehicles([]);
      setBeforeImageUrls([]);
      setBeforeFiles([]);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-lg font-semibold">{ar ? "فتح مهمة وتوثيق بياناتها" : "Open a job & document its details"}</h2>
      <div className={`grid gap-3 ${lockedStationId ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
        {!lockedStationId && (
          <select value={form.stationId} onChange={set("stationId")} required className="rounded-md border px-3 py-2 text-sm font-body">
            <option value="">{ar ? "اختر المحطة" : "Select station"}</option>
            {stations.map((s) => <option key={s.stationId} value={s.stationId}>{s.name}</option>)}
          </select>
        )}
        <input value={form.workTitle} onChange={set("workTitle")} required placeholder={ar ? "عنوان العمل" : "Work title"} className="rounded-md border px-3 py-2 text-sm font-body" />
        <input type="date" value={form.workDate} onChange={set("workDate")} required className="rounded-md border px-3 py-2 text-sm font-body" />
        <input type="number" min="0" step="0.5" value={form.plannedDays} onChange={set("plannedDays")} placeholder={ar ? "أيام العمل المخططة" : "Planned working days"} className="rounded-md border px-3 py-2 text-sm font-body" />
      </div>
      <textarea value={form.workDescription} onChange={set("workDescription")} rows={3} placeholder={ar ? "وصف تفصيلي للعمل…" : "Detailed description of the work…"} className="w-full rounded-md border px-3 py-2 text-sm font-body" />
      <CrewEditor workers={workers} onChange={setWorkers} ar={ar} />
      <VehicleEditor vehicles={vehicles} onChange={setVehicles} ar={ar} />
      <PhotoUploader label={ar ? "صور قبل العمل" : "Before photos"} urls={beforeImageUrls} onChange={setBeforeImageUrls} />
      <FileAttachmentUploader label={ar ? "إرفاق ملف قبل العمل" : "Attach file (before)"} files={beforeFiles} onChange={setBeforeFiles} />
      <button type="submit" disabled={!valid || saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {ar ? "فتح المهمة" : "Open job"}
      </button>
    </form>
  );
}