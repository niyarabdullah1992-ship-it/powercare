import React, { useState } from "react";
import { ACCENT, BRAND, BRAND_SOFT, BRAND_DEEP, MUTED, NAVY, dot, field, CARD, SURFACE } from "@/lib/platformStyles";
import {
  CERT_FOR,
  CERT_LABELS,
  addLocalDays,
  dayDiffFromToday,
  daysForPlanHorizon,
  deriveTaskDailyPace,
  planHorizonFromDue,
  taskDailyPaceLabel,
} from "@/lib/opsDerivations";

/** Platform.dc.html L3533–3708 — new-task modal (inline styles AS-IS). */

const FIELD = { ...field };

const SELECT = { ...FIELD, padding: "0 10px" };

const LABEL_SPAN = {
  fontSize: "12px",
  fontWeight: 600,
  color: MUTED,
};

const PRIORITIES = [
  { id: "high", ar: "عالية", en: "High", color: "#DC2626" },
  { id: "medium", ar: "متوسطة", en: "Medium", color: "#F59E0B" },
  { id: "low", ar: "منخفضة", en: "Low", color: MUTED },
];

const WEIGHTS = [
  { w: 1, ar: "روتيني", en: "Routine" },
  { w: 2, ar: "إدخال/متابعة", en: "Data & follow-up" },
  { w: 3, ar: "تشغيلي", en: "Operational" },
  { w: 4, ar: "فني/صيانة", en: "Technical / maintenance" },
  { w: 5, ar: "حرج/عميل", en: "Critical / client" },
];

const KINDS = [
  { id: "pm", ar: "وقائية", en: "Preventive" },
  { id: "cm", ar: "تصحيحية", en: "Corrective" },
  { id: "em", ar: "طارئة", en: "Emergency" },
  { id: "pr", ar: "مشروع", en: "Project" },
  { id: "cp", ar: "امتثال", en: "Compliance" },
];

const PLANS = [
  { id: "y", ar: "سنوية", en: "Annual" },
  { id: "h", ar: "نصف سنوية", en: "Half-year" },
  { id: "q", ar: "ربعية", en: "Quarterly" },
  { id: "m", ar: "شهرية", en: "Monthly" },
  { id: "w", ar: "أسبوعية", en: "Weekly" },
];

const WEIGHT_RULES = [
  [5, /مدير|رئيس|سلامة|طوارئ|عميل|manager|director|safety|emergency|client/i],
  [4, /مهندس|فني أول|صيانة|كهرب|ميكانيك|engineer|senior|maintenance|electric|mechanic/i],
  [3, /فني|مشغل|تشغيل|technician|operator/i],
  [2, /مساعد|إداري|تقارير|مدخل|assistant|admin|clerk|report/i],
];

function suggestWeight(title) {
  return (WEIGHT_RULES.find(([, re]) => re.test(String(title || ""))) || [1])[0];
}

function initialsOf(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";
}

function assignBtnStyle(active) {
  return {
    flex: 1,
    minWidth: 0,
    height: "36px",
    padding: "0 6px",
    borderRadius: "9px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...(active
      ? { border: `1px solid ${BRAND}`, background: BRAND_SOFT, color: BRAND_DEEP, fontWeight: 600 }
      : { border: "1px solid #E2E8F0", background: CARD, color: MUTED }),
  };
}

function planModeStyle(active) {
  return {
    flex: 1,
    minWidth: 0,
    height: "34px",
    padding: "0 8px",
    borderRadius: "9px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "11px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...(active
      ? { border: `1px solid ${BRAND}`, background: BRAND_SOFT, color: BRAND_DEEP, fontWeight: 600 }
      : { border: "1px solid #E2E8F0", background: CARD, color: MUTED }),
  };
}

function priorityBtnStyle(active, color) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    flex: 1,
    height: "36px",
    borderRadius: "9px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    ...(active
      ? { border: `1px solid ${color}`, background: `${color}14`, color, fontWeight: 600 }
      : { border: "1px solid #E2E8F0", background: CARD, color: MUTED }),
  };
}

function weightBtnStyle(active) {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    flex: 1,
    minWidth: 0,
    padding: "7px 4px",
    borderRadius: "9px",
    cursor: "pointer",
    fontFamily: "inherit",
    ...(active
      ? { border: `1px solid ${BRAND}`, background: BRAND_SOFT, color: BRAND_DEEP }
      : { border: "1px solid #E2E8F0", background: CARD, color: MUTED }),
  };
}

function modeBtnStyle(active) {
  return {
    flex: 1,
    height: "36px",
    borderRadius: "9px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    ...(active
      ? { border: `1px solid ${BRAND}`, background: BRAND_SOFT, color: BRAND_DEEP, fontWeight: 600 }
      : { border: "1px solid #E2E8F0", background: CARD, color: MUTED }),
  };
}

function teamChipStyle(on) {
  return on
    ? {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "7px 11px 7px 8px",
        borderRadius: "20px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "12px",
        border: `1px solid ${BRAND}`,
        background: BRAND_SOFT,
        color: BRAND_DEEP,
        fontWeight: 600,
      }
    : {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "7px 11px 7px 8px",
        borderRadius: "20px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "12px",
        border: "1px solid #E2E8F0",
        background: CARD,
        color: MUTED,
      };
}

function avatarStyle(on) {
  return {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    fontSize: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "'IBM Plex Sans',sans-serif",
    ...(on ? { background: BRAND, color: "#fff" } : { background: SURFACE, color: MUTED }),
  };
}

export default function OpsNewTaskModal({
  ar,
  dir,
  form,
  setForm,
  stations,
  employees,
  busy,
  onClose,
  onSubmit,
}) {
  const [files, setFiles] = useState([]);
  const applyHorizon = (id) => {
    const days = daysForPlanHorizon(id);
    setForm((f) => ({
      ...f,
      planPinned: true,
      planHorizon: id,
      dueAt: days ? addLocalDays(days) : f.dueAt,
    }));
  };

  const pace = deriveTaskDailyPace({
    targetCount: form.targetCount,
    completedCount: 0,
    dueAt: form.dueAt || null,
    planHorizon: form.planHorizon || derived,
  });
  const windowDays = form.dueAt && !Number.isNaN(dayDiffFromToday(form.dueAt))
    ? Math.max(0, dayDiffFromToday(form.dueAt))
    : "";
  const derived = planHorizonFromDue(form.dueAt || null) || "w";
  const derivedShort = (PLANS.find((p) => p.id === derived) || PLANS[4]);
  const planAuto = form.planPinned !== true;
  const reqCert = CERT_FOR[form.workKind] || null;
  const reqCertLabel = reqCert ? (CERT_LABELS[reqCert]?.[ar ? "ar" : "en"] || reqCert) : null;

  const canSubmit = (() => {
    if (!String(form.title || "").trim()) return false;
    if (form.assignMode === "one") return !!form.ownerId;
    if (form.assignMode === "some") return (form.memberIds || []).length > 0;
    return !!form.stationId;
  })();

  const submitEnabled = canSubmit && !busy;
  const submitStyle = submitEnabled
    ? {
        flex: 1,
        height: "36px",
        borderRadius: "9px",
        background: BRAND,
        color: "#fff",
        border: "none",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
      }
    : {
        flex: 1,
        height: "36px",
        borderRadius: "9px",
        background: "#E2E8F0",
        color: MUTED,
        border: "none",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "not-allowed",
        fontFamily: "inherit",
      };

  const stationCrew = employees.filter((e) => {
    if (!form.stationId) return false;
    return (e.stationId || e.station_id) === form.stationId;
  }).length;

  const planMismatch =
    !planAuto && form.dueAt && form.planHorizon && form.planHorizon !== derived
      ? (ar
        ? `تنبيه: التاريخ يقع في ${derivedShort.ar}، وأنت تثبّته في ${(PLANS.find((p) => p.id === form.planHorizon) || {}).ar}. هذا مقصود إن كانت المهمة التزامًا من خطة أكبر.`
        : `Note: the date falls in ${derivedShort.en} but you are pinning it to ${(PLANS.find((p) => p.id === form.planHorizon) || {}).en}. That is correct only if the task is a commitment from a larger plan.`)
      : "";

  const setOwner = (id) => {
    const emp = employees.find((e) => (e.employeeId || e.id) === id);
    const weight = suggestWeight(emp?.jobTitle || emp?.title || emp?.role || "");
    setForm((f) => ({ ...f, ownerId: id, effortWeight: weight }));
  };

  const toggleMember = (id) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter((x) => x !== id) : [...f.memberIds, id],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!submitEnabled) return;
    onSubmit(e, files);
  };

  const assignModes = [
    { id: "one", label: ar ? "موظف واحد" : "One employee" },
    { id: "some", label: ar ? "عدد من الفريق" : "Several of the team" },
    { id: "all", label: ar ? "كامل فريق الفرع" : "Whole station team" },
  ];

  return (
    <div
      dir={dir}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(20,40,75,.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
      role="presentation"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "520px",
          maxHeight: "calc(100vh - 48px)",
          background: CARD,
          borderRadius: "18px",
          boxShadow: "0 24px 60px rgba(20,40,75,.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flexShrink: 0, padding: "20px 22px 16px", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>{ar ? "مهمة جديدة" : "New task"}</div>
          <div style={{ fontSize: "12px", color: MUTED, marginTop: "3px" }}>
            {ar ? "تُسند فورًا وتصل إشعارًا للمسؤول" : "Assigned immediately and sent to the owner as a notification"}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <span style={LABEL_SPAN}>{ar ? "عنوان المهمة" : "Task title"}</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={ar ? "مثال: استبدال فلتر الهواء — المرحلة الثالثة" : "e.g. Air filter replacement — phase 3"}
              style={FIELD}
            />
          </label>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={LABEL_SPAN}>{ar ? "الفرع" : "Station"}</span>
              <select
                value={form.stationId}
                onChange={(e) => setForm({ ...form, stationId: e.target.value })}
                style={SELECT}
              >
                <option value="">{ar ? "اختر الفرع" : "Select station"}</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <span style={LABEL_SPAN}>{ar ? "الإسناد" : "Assignment"}</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {assignModes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForm({ ...form, assignMode: m.id })}
                  style={assignBtnStyle(form.assignMode === m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {form.assignMode === "one" && (
              <select
                required
                value={form.ownerId}
                onChange={(e) => setOwner(e.target.value)}
                style={{ ...SELECT, marginTop: "2px" }}
              >
                <option value="">{ar ? "اختر المسؤول" : "Select owner"}</option>
                {employees.map((emp) => {
                  const id = emp.employeeId || emp.id;
                  return (
                    <option key={id} value={id}>
                      {emp.name}
                    </option>
                  );
                })}
              </select>
            )}

            {form.assignMode === "some" && (
              <div style={{ marginTop: "2px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {employees.map((emp) => {
                    const id = emp.employeeId || emp.id;
                    const on = form.memberIds.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleMember(id)}
                        style={teamChipStyle(on)}
                      >
                        <span style={avatarStyle(on)}>{initialsOf(emp.name)}</span>
                        <span>{emp.name}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: "11px", color: MUTED, marginTop: "8px" }}>
                  {ar
                    ? `اختير ${form.memberIds.length} من ${employees.length}`
                    : `${form.memberIds.length} of ${employees.length} selected`}
                </div>
              </div>
            )}

            {form.assignMode === "all" && (
              <div
                style={{
                  marginTop: "2px",
                  padding: "12px 14px",
                  borderRadius: "11px",
                  background: SURFACE,
                  border: "1px solid #E2E8F0",
                  fontSize: "12px",
                  color: MUTED,
                  lineHeight: 1.65,
                }}
              >
                {form.stationId
                  ? (ar
                    ? `تُسند إلى ${stationCrew || "—"} موظفًا في هذا الفرع، ويظهر لكل منهم نسخته الخاصة.`
                    : `Assigned to all ${stationCrew || "—"} employees at this station; each gets their own copy.`)
                  : (ar ? "اختر الفرع أولًا لتحديد الفريق." : "Pick a station first to resolve the team.")}
              </div>
            )}

            <div style={{ fontSize: "10px", color: MUTED, marginTop: "6px", lineHeight: 1.6, textWrap: "pretty" }}>
              {reqCert
                ? (ar
                  ? `يُفضَّل أن يكون للمسؤول شهادة ${reqCertLabel} سارية — يمكن الإسناد حتى إن انتهت، ويُحدَّث التجديد من قسم السلامة.`
                  : `A current ${reqCertLabel} certification is preferred — assignment is still allowed if it has lapsed; renew it from Safety.`)
                : (ar ? "هذا النوع من العمل لا يشترط شهادة كفاءة." : "This work type requires no competency certification.")}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={LABEL_SPAN}>{ar ? "نوع العمل" : "Work type"}</span>
              <select
                value={form.workKind}
                onChange={(e) => setForm({ ...form, workKind: e.target.value })}
                style={SELECT}
              >
                {KINDS.map((k) => (
                  <option key={k.id} value={k.id}>{ar ? k.ar : k.en}</option>
                ))}
              </select>
            </label>
            <div style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={LABEL_SPAN}>{ar ? "كيف يُحتسب الأفق" : "How the horizon is set"}</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button type="button" onClick={() => setForm({ ...form, planPinned: false })} style={planModeStyle(planAuto)}>
                  {ar ? "تلقائي من تاريخ الاستحقاق" : "Auto from due date"}
                </button>
                <button type="button" onClick={() => applyHorizon(form.planHorizon || derived)} style={planModeStyle(!planAuto)}>
                  {ar ? "ثبّته يدويًا" : "Pin manually"}
                </button>
              </div>
            </div>
          </div>

          {planAuto && (
            <div
              style={{
                fontSize: "11px",
                color: MUTED,
                padding: "10px 13px",
                borderRadius: "10px",
                background: SURFACE,
                border: "1px solid #E2E8F0",
                lineHeight: 1.6,
              }}
            >
              {form.dueAt
                ? (ar
                  ? `يُحتسب ضمن: ${derivedShort.ar} — مشتق من تاريخ الاستحقاق`
                  : `Counted under: ${derivedShort.en} — derived from the due date`)
                : (ar ? "بلا تاريخ استحقاق يُحتسب ضمن أعمال هذا الأسبوع." : "With no due date it counts under this week's work.")}
            </div>
          )}

          {!planAuto && (
            <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={LABEL_SPAN}>{ar ? "الأفق الزمني" : "Plan horizon"}</span>
              <select
                value={form.planHorizon || derived}
                onChange={(e) => applyHorizon(e.target.value)}
                style={SELECT}
              >
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>{ar ? p.ar : p.en}</option>
                ))}
              </select>
            </label>
          )}

          {!!planMismatch && (
            <div
              style={{
                fontSize: "11px",
                color: "#B45309",
                padding: "10px 13px",
                borderRadius: "10px",
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                lineHeight: 1.65,
                textWrap: "pretty",
              }}
            >
              {planMismatch}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <span style={LABEL_SPAN}>{ar ? "الأولوية" : "Priority"}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.id })}
                  style={priorityBtnStyle(form.priority === p.id, p.color)}
                >
                  <span style={dot(p.color)} />
                  <span>{ar ? p.ar : p.en}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <span style={LABEL_SPAN}>{ar ? "وزن الجهد" : "Effort weight"}</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {WEIGHTS.map((w) => (
                <button
                  key={w.w}
                  type="button"
                  onClick={() => setForm({ ...form, effortWeight: w.w })}
                  style={weightBtnStyle(Number(form.effortWeight) === w.w)}
                >
                  <span dir="ltr" style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "14px", fontWeight: 600 }}>
                    ×{w.w}
                  </span>
                  <span style={{ fontSize: "9px", opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                    {ar ? w.ar : w.en}
                  </span>
                </button>
              ))}
            </div>
            <span style={{ fontSize: "11px", color: MUTED, lineHeight: 1.6 }}>
              {ar
                ? "يُقترح من مسمى المسؤول، ويُثبَّت قبل بدء العمل — النقاط = الأولوية × الوزن"
                : "Suggested from the owner's job title and fixed before work starts — points = priority × weight"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <span style={LABEL_SPAN}>{ar ? "نمط الإنجاز" : "Completion mode"}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { id: "onsite", label: ar ? "حضوري" : "On-site" },
                { id: "remote", label: ar ? "عن بُعد" : "Remote" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForm({ ...form, mode: m.id })}
                  style={modeBtnStyle(form.mode === m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ flex: "1 1 140px", display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={LABEL_SPAN}>{ar ? "إجمالي المهام" : "Total tasks"}</span>
              <input
                type="number"
                min={1}
                max={9999}
                value={form.targetCount}
                onChange={(e) => setForm({ ...form, targetCount: Number(e.target.value) || 1 })}
                style={{ ...FIELD, height: "36px" }}
              />
            </label>
            <label style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={LABEL_SPAN}>{ar ? "خلال أيام" : "Within days"}</span>
              <input
                type="number"
                min={1}
                max={3650}
                value={windowDays}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setForm({ ...form, dueAt: "" });
                    return;
                  }
                  const n = Math.max(1, Math.round(Number(raw) || 1));
                  setForm({ ...form, dueAt: addLocalDays(n) });
                }}
                style={{ ...FIELD, height: "36px" }}
              />
            </label>
            <label style={{ flex: "1 1 160px", display: "flex", flexDirection: "column", gap: "7px" }}>
              <span style={LABEL_SPAN}>{ar ? "تاريخ التسليم" : "Due date"}</span>
              <input
                type="date"
                value={form.dueAt || ""}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                style={{ ...FIELD, height: "36px" }}
              />
            </label>
          </div>
          <div style={{ fontSize: "12px", color: MUTED, lineHeight: 1.65 }}>
            {ar ? "العدد اليومي المحسوب: " : "Derived daily count: "}
            <strong style={{ color: pace.daily != null ? ACCENT : MUTED }}>
              {pace.daily != null ? (ar ? `${pace.daily} كل يوم` : `${pace.daily} / day`) : "—"}
            </strong>
            {" — "}
            {taskDailyPaceLabel(pace, ar)}
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <span style={LABEL_SPAN}>{ar ? "خطوات التنفيذ" : "Execution steps"}</span>
            <textarea
              rows={3}
              value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })}
              placeholder={ar ? "خطوة في كل سطر — تظهر مرقّمة في بطاقة المهمة" : "One step per line — they appear numbered on the task card"}
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: "9px",
                background: SURFACE,
                padding: "9px 12px",
                fontFamily: "inherit",
                fontSize: "13px",
                color: NAVY,
                outline: "none",
                resize: "vertical",
              }}
            />
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <span style={LABEL_SPAN}>{ar ? "المرفقات" : "Attachments"}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", alignItems: "center" }}>
              {files.map((fl, i) => (
                <div
                  key={`${fl.name}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "6px 9px 6px 11px",
                    borderRadius: "9px",
                    border: "1px solid #E2E8F0",
                    background: SURFACE,
                    fontSize: "12px",
                    color: NAVY,
                    maxWidth: "220px",
                  }}
                >
                  <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fl.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, x) => x !== i))}
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "5px",
                      border: "none",
                      background: "transparent",
                      color: MUTED,
                      fontSize: "12px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 13px",
                  borderRadius: "9px",
                  border: "1px dashed #CBD5E1",
                  background: CARD,
                  fontSize: "12px",
                  color: MUTED,
                  cursor: "pointer",
                }}
              >
                <span>{ar ? "أرفق ملفًا" : "Attach file"}</span>
                <input
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const picked = Array.from(e.target.files || []);
                    e.target.value = "";
                    if (picked.length) setFiles((prev) => [...prev, ...picked]);
                  }}
                />
              </label>
            </div>
          </div>

        </div>

        <div
          style={{
            flexShrink: 0,
            padding: "16px 22px 20px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            gap: "10px",
            background: CARD,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              height: "36px",
              padding: "0 18px",
              borderRadius: "9px",
              background: CARD,
              border: "1px solid #E2E8F0",
              color: MUTED,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <button type="submit" disabled={!submitEnabled} style={submitStyle}>
            {ar ? "أنشئ المهمة" : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}
