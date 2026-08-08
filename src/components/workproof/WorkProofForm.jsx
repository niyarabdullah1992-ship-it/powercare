import React, { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import PhotoUploader from "@/components/workproof/PhotoUploader";
import FileAttachmentUploader from "@/components/workproof/FileAttachmentUploader";
import CrewEditor from "@/components/workproof/CrewEditor";
import VehicleEditor from "@/components/workproof/VehicleEditor";
import ProofFormSection, { Field, StageStrip } from "@/components/workproof/ProofFormSection";

const inputCls = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm font-body";

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

  const crewCount = workers.filter((worker) => worker.name?.trim()).length;

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
    <form onSubmit={submit} className="overflow-hidden rounded-xl border border-accent/30 bg-card shadow-soft">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-secondary/40 p-5">
        <div>
          <h2 className="font-heading text-xl font-semibold">{ar ? "فتح مهمة وتوثيق بياناتها" : "Open a job & document its details"}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground font-body">
            {(lockedStationId && stations[0]?.name) || (ar ? "اختر المحطة" : "Select station")} · {form.workDate}
          </p>
        </div>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] text-accent-text font-body">
          {ar ? "مسودة — لم تُفتح بعد" : "Draft — not opened yet"}
        </span>
      </header>

      <div className="border-b border-border px-5 py-3">
        <StageStrip
          steps={ar ? ["١ · قبل العمل", "٢ · أثناء التنفيذ", "٣ · الإغلاق بإثبات"] : ["1 · Before work", "2 · In progress", "3 · Sealed close"]}
          activeIndex={0}
        />
      </div>

      <div className="space-y-5 p-5">
        <ProofFormSection eyebrow="Work order" title={ar ? "تعريف العمل" : "Work definition"}>
          <div className="grid gap-3 sm:grid-cols-2">
            {!lockedStationId && (
              <Field label={ar ? "المحطة" : "Station"} required>
                <select value={form.stationId} onChange={set("stationId")} required className={inputCls}>
                  <option value="">{ar ? "اختر المحطة" : "Select station"}</option>
                  {stations.map((s) => <option key={s.stationId} value={s.stationId}>{s.name}</option>)}
                </select>
              </Field>
            )}
            <div className={lockedStationId ? "sm:col-span-2" : ""}>
              <Field label={ar ? "عنوان العمل" : "Work title"} required>
                <input value={form.workTitle} onChange={set("workTitle")} required placeholder={ar ? "استبدال مضخة التبريد — الوحدة ٣" : "Replace cooling pump — unit 3"} className={inputCls} />
              </Field>
            </div>
            <Field label={ar ? "تاريخ البدء" : "Start date"} required>
              <input type="date" value={form.workDate} onChange={set("workDate")} required className={inputCls} />
            </Field>
            <Field label={ar ? "أيام العمل المخططة" : "Planned working days"}>
              <input type="number" min="0" step="0.5" value={form.plannedDays} onChange={set("plannedDays")} placeholder="3" className={inputCls} />
            </Field>
          </div>
          <Field label={ar ? "وصف تفصيلي للعمل" : "Detailed work description"}>
            <textarea value={form.workDescription} onChange={set("workDescription")} rows={3} placeholder={ar ? "ما الذي سيُنفَّذ، وأين تحديدًا، وما المعدات المطلوبة" : "What will be done, exactly where, and which equipment is needed"} className={inputCls} />
          </Field>
        </ProofFormSection>

        <ProofFormSection
          eyebrow="Crew"
          title={ar ? "الفريق والمعدات" : "Crew & vehicles"}
          note={ar ? `${crewCount} عامل · ${vehicles.length} سيارة` : `${crewCount} crew · ${vehicles.length} vehicles`}
        >
          <CrewEditor workers={workers} onChange={setWorkers} ar={ar} />
          <VehicleEditor vehicles={vehicles} onChange={setVehicles} ar={ar} />
        </ProofFormSection>

        <ProofFormSection
          eyebrow="Evidence · before"
          title={ar ? "إثبات ما قبل العمل" : "Before-work evidence"}
          note={ar ? "صورة واحدة على الأقل" : "At least one photo"}
        >
          <PhotoUploader label={ar ? "صور قبل العمل" : "Before photos"} urls={beforeImageUrls} onChange={setBeforeImageUrls} />
          <FileAttachmentUploader label={ar ? "إرفاق ملف قبل العمل" : "Attach file (before)"} files={beforeFiles} onChange={setBeforeFiles} />
          <p className="text-[11px] text-muted-foreground font-body">
            {ar ? "تُسجَّل الصور بوقتها تلقائيًا — وهي ما يجعل إغلاق المهمة موثّقًا لاحقًا." : "Photos are timestamped automatically — they are what makes the later close verifiable."}
          </p>
        </ProofFormSection>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/40 px-5 py-4">
        <p className="text-[11px] text-muted-foreground font-body">
          {valid
            ? (ar ? "البيانات المطلوبة مكتملة." : "Required details are complete.")
            : (ar ? "يبقى حقل مطلوب أو أكثر قبل فتح المهمة." : "One or more required fields remain.")}
        </p>
        <button type="submit" disabled={!valid || saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {ar ? "فتح المهمة" : "Open job"}
        </button>
      </footer>
    </form>
  );
}