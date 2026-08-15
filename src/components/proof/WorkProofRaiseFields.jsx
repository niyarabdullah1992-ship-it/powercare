import React, { useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { ACCENT, MUTED, NAVY, CARD, SURFACE } from "@/lib/platformStyles";
import { vehicleLabel } from "@/lib/proofVehicle";

export const EMPTY_VEHICLE = {
  maker: "", model: "", type: "", year: "", plateLetters: "", plateNumbers: "",
};

export function formatProofDateTime(value, ar) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(ar ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", {
    timeZone: "Asia/Riyadh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function workDurationLabel(startedAt, endedAt, ar) {
  const start = formatProofDateTime(startedAt, ar);
  const end = formatProofDateTime(endedAt, ar);
  if (!start && !end) return "";
  if (start && end) {
    const from = new Date(startedAt);
    const to = new Date(endedAt);
    let extra = "";
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to > from) {
      const hours = Math.round(((to - from) / 36e5) * 10) / 10;
      extra = ar ? ` · ${hours} ساعة` : ` · ${hours} h`;
    }
    return `${start} → ${end}${extra}`;
  }
  return start || end;
}

export function proofPersonLabel(proof) {
  return proof.personName || proof.client || "";
}

export function proofVehicleText(proof) {
  return vehicleLabel(proof.vehicle || {});
}

const CSS = `
  .wp-raise-split { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(260px, .85fr); gap: 18px; align-items: start; }
  .wp-raise-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .wp-fold > summary::-webkit-details-marker { display: none; }
  .wp-fold > summary { list-style: none; }
  .wp-fold > summary::before { content: "+"; display: inline-block; width: 14px; color: #5A6B85; font-weight: 600; }
  .wp-fold[open] > summary::before { content: "−"; }
  @media (max-width: 860px) {
    .wp-raise-split { grid-template-columns: 1fr; }
  }
  @media (max-width: 520px) {
    .wp-raise-2 { grid-template-columns: 1fr; }
  }
`;

const box = {
  width: "100%",
  height: 36,
  borderRadius: 9,
  border: "1px solid #E2E8F0",
  background: CARD,
  padding: "0 11px",
  fontSize: 13,
  color: NAVY,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

function Field({ label, required, children }) {
  return (
    <label>
      <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 5 }}>
        {label}{required ? <span style={{ color: ACCENT, marginInlineStart: 3 }}>•</span> : null}
      </span>
      {children}
    </label>
  );
}

function Fold({ title, hint, children }) {
  return (
    <details className="wp-fold" style={{ borderTop: "1px solid #EEF2F6", paddingTop: 8, marginTop: 10 }}>
      <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 600, color: NAVY, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{title}</span>
        {hint ? <span style={{ fontSize: 11, fontWeight: 500, color: MUTED }}>{hint}</span> : null}
      </summary>
      <div className="wp-raise-2" style={{ marginTop: 8 }}>{children}</div>
    </details>
  );
}

function PhotoSlot({ file, title, required, onFile, ar }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) { setUrl(""); return undefined; }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: url ? 132 : 88,
        borderRadius: 10,
        border: file ? `1px solid color-mix(in oklab, ${ACCENT} 28%, #fff)` : "1px dashed #D5DCE6",
        background: file ? "color-mix(in oklab, #1E9E63 5%, #fff)" : "#F7F8FA",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      {url ? (
        <img src={url} alt="" style={{ width: "100%", height: 88, objectFit: "cover", display: "block" }} />
      ) : null}
      <span style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
        <Camera style={{ width: 15, height: 15, color: file ? ACCENT : MUTED }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>
          {title}{required ? "" : ` · ${ar ? "اختياري" : "optional"}`}
        </span>
        <span style={{ fontSize: 11, color: MUTED, marginInlineStart: "auto" }}>
          {file?.name || (ar ? "اختيار" : "Choose")}
        </span>
      </span>
      <input
        type="file"
        accept="image/*"
        required={required}
        onChange={(e) => onFile(e.target.files?.[0] || null)}
        style={{ display: "none" }}
      />
    </label>
  );
}

export default function WorkProofRaiseFields({ form, setForm, stations, headerScope, ar, hidePhotos }) {
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const setVehicle = (key) => (event) => setForm({
    ...form,
    vehicle: { ...(form.vehicle || EMPTY_VEHICLE), [key]: event.target.value },
  });
  const vehicle = form.vehicle || EMPTY_VEHICLE;

  const entityKind = form.entityKind === "government" ? "company" : (form.entityKind || "company");
  const entityExtra = useMemo(
    () => [form.entityProject, form.entityCr, form.entityQiwa, form.entityContact, form.entityPhone].filter(Boolean).length,
    [form.entityProject, form.entityCr, form.entityQiwa, form.entityContact, form.entityPhone],
  );
  const vehicleExtra = useMemo(
    () => Object.values(vehicle).filter(Boolean).length,
    [vehicle],
  );

  return (
    <div style={{ marginTop: 12 }}>
      <style>{CSS}</style>
      <div className="wp-raise-split">
        <div>
          <Field label={ar ? "سبب العمل" : "Reason for work"} required>
            <input
              required
              value={form.workReason}
              onChange={set("workReason")}
              placeholder={ar ? "لماذا يُنفَّذ هذا العمل؟" : "Why is this work being done?"}
              style={{ ...box, height: 40, fontSize: 14, fontWeight: 500 }}
            />
          </Field>
          <Field label={ar ? "وصف العمل" : "Work"} required>
            <input
              required
              value={form.title}
              onChange={set("title")}
              placeholder={ar ? "ما العمل الذي سيُنفَّذ؟" : "What work is starting?"}
              style={{ ...box, height: 40, fontSize: 14, fontWeight: 500, marginTop: 10 }}
            />
          </Field>

          <div style={{ marginTop: 10 }}>
            <Field label={ar ? "تاريخ ووقت البداية" : "Start date & time"} required>
              <input
                type="datetime-local"
                required
                dir="ltr"
                value={form.startedAt}
                onChange={set("startedAt")}
                style={{ ...box, minWidth: 220 }}
              />
            </Field>
          </div>
          <div className="wp-raise-2" style={{ marginTop: 10 }}>
            <Field label={ar ? "الفرع" : "Branch"} required>
              <select required value={form.stationId} onChange={set("stationId")} disabled={headerScope !== "all"} style={box}>
                <option value="">{ar ? "اختر فرعًا" : "Pick a branch"}</option>
                {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label={ar ? "الموقع عند الالتقاط" : "Capture location"}>
              <select value={form.geoVerdict} onChange={set("geoVerdict")} style={box}>
                <option value="in">{ar ? "داخل نطاق الفرع" : "Inside the branch"}</option>
                <option value="out">{ar ? "خارج النطاق" : "Outside geofence"}</option>
              </select>
            </Field>
          </div>

          {!hidePhotos && (
          <div style={{ marginTop: 12 }}>
            <PhotoSlot
              file={form.beforeFile}
              title={ar ? "صورة قبل — عند البداية" : "Before — at start"}
              required
              ar={ar}
              onFile={(file) => setForm({ ...form, beforeFile: file })}
            />
          </div>
          )}
        </div>

        <div style={{ padding: "12px 12px 10px", borderRadius: 12, background: SURFACE, border: "1px solid #EEF2F6" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: NAVY, marginBottom: 10 }}>
            {ar ? "المستفيد" : "Beneficiary"}
          </div>
          <div className="wp-raise-2">
            <Field label={ar ? "نوع المنشأة" : "Establishment type"} required>
              <select required value={entityKind} onChange={set("entityKind")} style={box}>
                <option value="company">{ar ? "شركة / مؤسسة" : "Company"}</option>
                <option value="individual">{ar ? "مؤسسة فردية" : "Sole establishment"}</option>
              </select>
            </Field>
            <Field label={ar ? "الاسم الرسمي" : "Official name"} required>
              <input required value={form.entityName} onChange={set("entityName")} placeholder={ar ? "كما في السجل أو القرار" : "As on the register"} style={box} />
            </Field>
            <Field label={ar ? "الرقم الوطني الموحد" : "Unified national no."}>
              <input value={form.entityUnified} onChange={set("entityUnified")} dir="ltr" placeholder="700xxxxxxxx" style={box} />
            </Field>
            <Field label={ar ? "موقع التنفيذ" : "Work site"}>
              <input value={form.entitySite} onChange={set("entitySite")} placeholder={ar ? "المبنى / الوحدة / المدينة" : "Building / unit / city"} style={box} />
            </Field>
          </div>
          <Fold
            title={ar ? "عقد وهوية وتواصل" : "Contract, IDs & contact"}
            hint={entityExtra ? (ar ? `${entityExtra} مُعبّأة` : `${entityExtra} filled`) : (ar ? "اختياري" : "optional")}
          >
            <Field label={ar ? "رقم العقد / أمر العمل" : "Contract / work order"}>
              <input value={form.entityProject} onChange={set("entityProject")} style={box} />
            </Field>
            <Field label={ar ? "السجل التجاري" : "Commercial registration"}>
              <input value={form.entityCr} onChange={set("entityCr")} dir="ltr" placeholder="10 أرقام" style={box} />
            </Field>
            <Field label={ar ? "رقم المنشأة في قوى" : "Qiwa establishment no."}>
              <input value={form.entityQiwa} onChange={set("entityQiwa")} dir="ltr" placeholder="7-1104829" style={box} />
            </Field>
            <Field label={ar ? "مسؤول التواصل" : "Contact"}>
              <input value={form.entityContact} onChange={set("entityContact")} style={box} />
            </Field>
            <Field label={ar ? "جوال المسؤول" : "Contact phone"}>
              <input value={form.entityPhone} onChange={set("entityPhone")} dir="ltr" placeholder="05xxxxxxxx" style={box} />
            </Field>
          </Fold>

          <div style={{ fontSize: 11, fontWeight: 600, color: NAVY, margin: "14px 0 10px" }}>
            {ar ? "المنفذ" : "Worker"}
          </div>
          <div className="wp-raise-2">
            <Field label={ar ? "الاسم" : "Name"} required>
              <input required value={form.personName} onChange={set("personName")} style={box} />
            </Field>
            <Field label={ar ? "الجوال" : "Phone"}>
              <input value={form.personPhone} onChange={set("personPhone")} dir="ltr" style={box} />
            </Field>
            <Field label={ar ? "رقم الهوية" : "ID number"}>
              <input value={form.personId} onChange={set("personId")} dir="ltr" style={box} />
            </Field>
            <Field label={ar ? "المسمى" : "Title"}>
              <input value={form.personTitle} onChange={set("personTitle")} style={box} />
            </Field>
          </div>

          <Fold
            title={ar ? "السيارة" : "Vehicle"}
            hint={vehicleExtra ? (ar ? `${vehicleExtra} مُعبّأة` : `${vehicleExtra} filled`) : (ar ? "اختياري" : "optional")}
          >
            <Field label={ar ? "الشركة المصنعة" : "Maker"}>
              <input value={vehicle.maker} onChange={setVehicle("maker")} style={box} />
            </Field>
            <Field label={ar ? "الموديل" : "Model"}>
              <input value={vehicle.model} onChange={setVehicle("model")} style={box} />
            </Field>
            <Field label={ar ? "نوع السيارة" : "Type"}>
              <input value={vehicle.type} onChange={setVehicle("type")} style={box} />
            </Field>
            <Field label={ar ? "سنة الصنع" : "Year"}>
              <input value={vehicle.year} onChange={setVehicle("year")} dir="ltr" style={box} />
            </Field>
            <Field label={ar ? "حروف اللوحة" : "Plate letters"}>
              <input value={vehicle.plateLetters} onChange={setVehicle("plateLetters")} style={box} />
            </Field>
            <Field label={ar ? "أرقام اللوحة" : "Plate numbers"}>
              <input value={vehicle.plateNumbers} onChange={setVehicle("plateNumbers")} dir="ltr" style={box} />
            </Field>
          </Fold>
        </div>
      </div>
    </div>
  );
}
