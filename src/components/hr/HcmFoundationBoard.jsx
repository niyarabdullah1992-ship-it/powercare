import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { hcmCall } from "@/lib/hcmApi";
import { useAuth } from "@/lib/PowerCareAuth";
import { toast } from "@/components/ui/use-toast";
import {
  ACTION_LABELS,
  ACTION_REASONS,
  ACTION_TYPES,
  JOB_FAMILIES,
  JOB_FAMILY_LABELS,
  ORG_UNIT_LABELS,
  ORG_UNIT_TYPES,
  POSITION_REQUIRED_ACTIONS,
  todayKey,
} from "@/lib/hcmDerivations";
import { ACCENT, MUTED, NAVY, cardShell, statCard, tableShell, ui, field, SURFACE } from "@/lib/platformStyles";

const labelText = { display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "11px" };
const panel = { marginTop: "14px", padding: "15px 16px", borderRadius: "16px", background: SURFACE, border: "1px solid #E2E8F0" };
const rowLine = { padding: "10px 18px", borderBottom: "1px solid #F1F5F9", fontSize: "12px", color: NAVY, display: "grid", gap: "10px", alignItems: "center" };
const headLine = {
  padding: "10px 18px",
  background: SURFACE,
  borderBottom: "1px solid #E2E8F0",
  fontSize: "10px",
  letterSpacing: "0.06em",
  color: MUTED,
  fontWeight: 600,
  display: "grid",
  gap: "10px",
};

function Section({ title, note, children, action }) {
  return (
    <div style={cardShell}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>{title}</div>
          {note ? <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.7, maxWidth: "820px" }}>{note}</div> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Position management, job catalogue and the date-tracked employment register. */
export default function HcmFoundationBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState("");
  const [unitForm, setUnitForm] = useState({ name: "", type: "department", parentId: "", costCenter: "", establishmentNumber: "", effectiveFrom: todayKey() });
  const [jobForm, setJobForm] = useState({ code: "", title: "", family: "operations", gradeMin: "", gradeMax: "" });
  const [posForm, setPosForm] = useState({ jobId: "", orgUnitId: "", fte: 1, effectiveFrom: todayKey() });
  const [actForm, setActForm] = useState({ employeeId: "", type: "hire", positionId: "", effectiveDate: todayKey(), reasonCode: "new_position", note: "" });

  const isSenior = currentUser && (
    ["owner", "director", "ops_manager", "pgm", "admin", "hr_manager"].includes(currentUser.role)
    || data?.ownerId === currentUser?.id
  );
  // Offering "+ Position" against a register that cannot accept the write would
  // fail after the form is filled — hide the entry points while it is offline.
  const canWrite = Boolean(isSenior) && !loadError;

  const employees = data?.employees || [];
  const empName = (id) => employees.find((e) => e.id === id)?.name || id || "—";

  // An unreachable register must not hide the structure it governs: fall back to
  // an empty shell so units, jobs, positions and the action log stay on screen
  // with named empty states, and name the reason writes are held.
  const EMPTY_REGISTER = {
    orgUnits: [], jobs: [], positions: [], rollup: [], actions: [], changeHistory: [],
    stats: { units: 0, jobs: 0, positions: 0, filled: 0, vacant: 0, unassignedPeople: 0 },
  };

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await hcmCall({ action: "list", companyId: company.id, companyName: company.name });
      if (remote?.ok) {
        setState(remote);
        setLoadError("");
        return;
      }
      setLoadError(ar ? (remote?.reason || "") : (remote?.reasonEn || ""));
      setState(EMPTY_REGISTER);
    } catch {
      setLoadError(ar
        ? "سجل الهيكل الوظيفي غير متصل — لم تستجب خدمة HCM. العرض أدناه فارغ ولا يقبل التسجيل حتى تعود الخدمة."
        : "The HCM register is offline — the HCM service did not respond. The view below is empty and accepts no records until the service returns.");
      setState(EMPTY_REGISTER);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const run = async (payload, okMsg) => {
    if (!company?.id) return false;
    setBusy(true);
    try {
      const remote = await hcmCall({ ...payload, companyId: company.id });
      if (remote?.error) {
        toast({ description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error), variant: "destructive" });
        return false;
      }
      if (okMsg) toast({ description: okMsg });
      setState((prev) => ({ ...(prev || {}), ...remote }));
      return true;
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const stats = state?.stats;
  const units = state?.orgUnits || [];
  const jobs = state?.jobs || [];
  const positions = state?.positions || [];
  const rollup = state?.rollup || [];
  const changeHistory = state?.changeHistory || [];
  const actions = useMemo(
    () => (state?.actions || []).filter((a) => !a.voidedAt).slice().sort((a, b) => String(b.effectiveDate).localeCompare(String(a.effectiveDate))),
    [state?.actions],
  );

  const reasonOptions = ACTION_REASONS[actForm.type] || [];
  const positionNeeded = POSITION_REQUIRED_ACTIONS.includes(actForm.type);
  const openPositions = positions.filter((p) => !p.closed);

  const statBox = (label, value, tone) => (
    <div key={label} style={{ ...statCard, flex: "1 1 130px" }}>
      <div style={{ fontSize: "10px", letterSpacing: "0.06em", color: MUTED, fontWeight: 600 }}>{label}</div>
      <div dir="ltr" style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "22px", fontWeight: 600, color: tone || NAVY, marginTop: "6px", textAlign: ar ? "right" : "left" }}>
        {value}
      </div>
    </div>
  );

  if (!state) {
    return (
      <div style={{ ...cardShell, fontSize: "12px", color: MUTED }}>
        {ar ? "يُحمَّل الهيكل الوظيفي…" : "Loading the job structure…"}
      </div>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "16px" }} dir={ar ? "rtl" : "ltr"}>
      {loadError ? (
        <div style={{
          borderRadius: "12px",
          border: "1px solid #FDE68A",
          background: "#FFFBEB",
          padding: "12px 16px",
          fontSize: "12px",
          lineHeight: 1.7,
          color: "#B45309",
        }}
        >
          <span style={{ fontWeight: 600 }}>{ar ? "التسجيل موقوف · " : "Recording held · "}</span>
          {loadError}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {statBox(ar ? "وحدات تنظيمية" : "ORG UNITS", stats?.units ?? 0)}
        {statBox(ar ? "وظائف" : "JOBS", stats?.jobs ?? 0)}
        {statBox(ar ? "مناصب" : "POSITIONS", stats?.positions ?? 0)}
        {statBox(ar ? "مشغولة" : "FILLED", stats?.filled ?? 0, ACCENT)}
        {statBox(ar ? "شاغرة" : "VACANT", stats?.vacant ?? 0, (stats?.vacant ?? 0) > 0 ? "#B45309" : NAVY)}
        {statBox(ar ? "بلا منصب" : "NO POSITION", stats?.unassignedPeople ?? 0, (stats?.unassignedPeople ?? 0) > 0 ? "#B45309" : NAVY)}
      </div>

      {/* ── org units + cost centres ── */}
      <Section
        title={ar ? "الوحدات التنظيمية ومراكز التكلفة" : "Organization units and cost centres"}
        note={ar
          ? "الوحدة سجل مؤرَّخ: لها تاريخ سريان ومركز تكلفة ورقم منشأة يُورَّثان لما تحتها — الرواتب والتقارير تقرأ منها لا من قوائم موازية."
          : "A unit is a date-tracked record: effective date, cost centre and establishment number are inherited downwards — payroll and reporting read from it, not from parallel lists."}
        action={canWrite ? (
          <button type="button" style={ui.btnPrimary} onClick={() => setOpen(open === "unit" ? "" : "unit")}>
            {ar ? "+ وحدة تنظيمية" : "+ Org unit"}
          </button>
        ) : null}
      >
        {canWrite && open === "unit" && (
          <div style={panel}>
            <div style={formGrid}>
              <label>
                <span style={labelText}>{ar ? "الاسم" : "Name"}</span>
                <input style={field} value={unitForm.name} onChange={(e) => setUnitForm((f) => ({ ...f, name: e.target.value }))} placeholder={ar ? "مثال: إدارة الصيانة" : "e.g. Maintenance department"} />
              </label>
              <label>
                <span style={labelText}>{ar ? "النوع" : "Type"}</span>
                <select style={field} value={unitForm.type} onChange={(e) => setUnitForm((f) => ({ ...f, type: e.target.value }))}>
                  {ORG_UNIT_TYPES.map((t) => <option key={t} value={t}>{ar ? ORG_UNIT_LABELS[t].ar : ORG_UNIT_LABELS[t].en}</option>)}
                </select>
              </label>
              <label>
                <span style={labelText}>{ar ? "الوحدة الأعلى" : "Parent unit"}</span>
                <select style={field} value={unitForm.parentId} onChange={(e) => setUnitForm((f) => ({ ...f, parentId: e.target.value }))}>
                  <option value="">{ar ? "بلا أب (جذر)" : "No parent (root)"}</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>
              <label>
                <span style={labelText}>{ar ? "مركز التكلفة" : "Cost centre"}</span>
                <input style={field} value={unitForm.costCenter} onChange={(e) => setUnitForm((f) => ({ ...f, costCenter: e.target.value }))} placeholder="CC-1200" />
              </label>
              <label>
                <span style={labelText}>{ar ? "رقم المنشأة (وزارة الموارد)" : "Establishment number (MHRSD)"}</span>
                <input style={field} value={unitForm.establishmentNumber} onChange={(e) => setUnitForm((f) => ({ ...f, establishmentNumber: e.target.value }))} placeholder="1234567" />
              </label>
              <label>
                <span style={labelText}>{ar ? "تاريخ السريان" : "Effective from"}</span>
                <input type="date" style={field} value={unitForm.effectiveFrom} onChange={(e) => setUnitForm((f) => ({ ...f, effectiveFrom: e.target.value }))} />
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "13px", justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={busy}
                style={{ ...ui.btnPrimary, opacity: busy ? 0.6 : 1 }}
                onClick={async () => {
                  const ok = await run({ action: "createOrgUnit", ...unitForm, parentId: unitForm.parentId || null }, ar ? "أُضيفت الوحدة" : "Unit added");
                  if (ok) setUnitForm({ name: "", type: "department", parentId: "", costCenter: "", establishmentNumber: "", effectiveFrom: todayKey() });
                }}
              >
                {busy ? <Loader2 style={{ width: 13, height: 13, display: "inline", verticalAlign: "middle" }} className="animate-spin" /> : null}
                {" "}{ar ? "أضف الوحدة" : "Add unit"}
              </button>
            </div>
          </div>
        )}

        <div style={{ ...tableShell, marginTop: "14px" }}>
          <div style={{ ...headLine, gridTemplateColumns: "minmax(180px,2fr) 90px 110px 90px 90px" }}>
            <div>{ar ? "الوحدة" : "UNIT"}</div>
            <div>{ar ? "النوع" : "TYPE"}</div>
            <div>{ar ? "مركز التكلفة" : "COST CENTRE"}</div>
            <div>{ar ? "مناصب" : "POSITIONS"}</div>
            <div>{ar ? "الإشغال" : "FILL"}</div>
          </div>
          {rollup.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: MUTED }}>
              {ar ? "لا وحدات بعد." : "No units yet."}
            </div>
          ) : rollup.map((u) => (
            <div key={u.id} style={{ ...rowLine, gridTemplateColumns: "minmax(180px,2fr) 90px 110px 90px 90px" }}>
              <div style={{ paddingInlineStart: `${u.depth * 14}px`, fontWeight: u.depth === 0 ? 600 : 400 }}>
                {u.name}
                {u.establishmentNumber ? (
                  <span dir="ltr" style={{ fontSize: "10px", color: MUTED, marginInlineStart: "8px" }}>#{u.establishmentNumber}</span>
                ) : null}
              </div>
              <div style={{ fontSize: "11px", color: MUTED }}>{ar ? ORG_UNIT_LABELS[u.type]?.ar || u.type : ORG_UNIT_LABELS[u.type]?.en || u.type}</div>
              <div dir="ltr" style={{ fontSize: "11px", color: MUTED, textAlign: ar ? "right" : "left" }}>{u.costCenter || "—"}</div>
              <div dir="ltr" style={{ fontSize: "12px", textAlign: ar ? "right" : "left" }}>{u.positions}</div>
              <div dir="ltr" style={{ fontSize: "12px", color: u.vacant ? "#B45309" : ACCENT, textAlign: ar ? "right" : "left" }}>{u.fillPct}%</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── job catalogue ── */}
      <Section
        title={ar ? "كتالوج الوظائف" : "Job catalogue"}
        note={ar
          ? "كتالوج مسميات لا شجرة ثانية. المسمى هنا يطابق مسمى البطاقة في الهيكل وقوالب الصلاحيات."
          : "A title catalogue, not a second tree. The name here matches the org-card title and permission templates."}
        action={canWrite ? (
          <button type="button" style={ui.btnPrimary} onClick={() => setOpen(open === "job" ? "" : "job")}>
            {ar ? "+ وظيفة" : "+ Job"}
          </button>
        ) : null}
      >
        {canWrite && open === "job" && (
          <div style={panel}>
            <div style={formGrid}>
              <label>
                <span style={labelText}>{ar ? "الرمز" : "Code"}</span>
                <input style={field} value={jobForm.code} onChange={(e) => setJobForm((f) => ({ ...f, code: e.target.value }))} placeholder="OPS-TECH" />
              </label>
              <label>
                <span style={labelText}>{ar ? "المسمى" : "Title"}</span>
                <input style={field} value={jobForm.title} onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))} placeholder={ar ? "فني تشغيل" : "Operations technician"} />
              </label>
              <label>
                <span style={labelText}>{ar ? "العائلة الوظيفية" : "Job family"}</span>
                <select style={field} value={jobForm.family} onChange={(e) => setJobForm((f) => ({ ...f, family: e.target.value }))}>
                  {JOB_FAMILIES.map((f) => <option key={f} value={f}>{ar ? JOB_FAMILY_LABELS[f].ar : JOB_FAMILY_LABELS[f].en}</option>)}
                </select>
              </label>
              <label>
                <span style={labelText}>{ar ? "أدنى درجة" : "Grade min"}</span>
                <input type="number" style={field} value={jobForm.gradeMin} onChange={(e) => setJobForm((f) => ({ ...f, gradeMin: e.target.value }))} />
              </label>
              <label>
                <span style={labelText}>{ar ? "أعلى درجة" : "Grade max"}</span>
                <input type="number" style={field} value={jobForm.gradeMax} onChange={(e) => setJobForm((f) => ({ ...f, gradeMax: e.target.value }))} />
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "13px", justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={busy}
                style={{ ...ui.btnPrimary, opacity: busy ? 0.6 : 1 }}
                onClick={async () => {
                  const ok = await run({ action: "createJob", ...jobForm }, ar ? "أُضيفت الوظيفة" : "Job added");
                  if (ok) setJobForm({ code: "", title: "", family: "operations", gradeMin: "", gradeMax: "" });
                }}
              >
                {ar ? "أضف الوظيفة" : "Add job"}
              </button>
            </div>
          </div>
        )}

        <div style={{ ...tableShell, marginTop: "14px" }}>
          <div style={{ ...headLine, gridTemplateColumns: "110px minmax(160px,2fr) 120px 90px" }}>
            <div>{ar ? "الرمز" : "CODE"}</div>
            <div>{ar ? "المسمى" : "TITLE"}</div>
            <div>{ar ? "العائلة" : "FAMILY"}</div>
            <div>{ar ? "الدرجات" : "GRADES"}</div>
          </div>
          {jobs.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: MUTED }}>
              {ar ? "لا وظائف بعد — أضف وظيفة قبل إنشاء المناصب." : "No jobs yet — add one before creating positions."}
            </div>
          ) : jobs.map((j) => (
            <div key={j.id} style={{ ...rowLine, gridTemplateColumns: "110px minmax(160px,2fr) 120px 90px" }}>
              <div dir="ltr" style={{ fontSize: "11px", fontWeight: 600, textAlign: ar ? "right" : "left" }}>{j.code}</div>
              <div>{j.title}</div>
              <div style={{ fontSize: "11px", color: MUTED }}>{ar ? JOB_FAMILY_LABELS[j.family]?.ar || j.family : JOB_FAMILY_LABELS[j.family]?.en || j.family}</div>
              <div dir="ltr" style={{ fontSize: "11px", color: MUTED, textAlign: ar ? "right" : "left" }}>
                {j.gradeMin != null || j.gradeMax != null ? `${j.gradeMin ?? "—"}–${j.gradeMax ?? "—"}` : "—"}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── positions ── */}
      <Section
        title={ar ? "المناصب" : "Positions"}
        note={ar
          ? "المنصب مقعد واحد: وظيفة داخل وحدة تنظيمية بنسبة دوام. لا يشغله شخصان في اليوم نفسه، والشاغر يظهر شاغرًا بدل أن يختفي."
          : "A position is one seat: a job inside an org unit with an FTE. Two people cannot hold it on the same day, and a vacancy stays visible instead of disappearing."}
        action={canWrite ? (
          <button type="button" style={ui.btnPrimary} onClick={() => setOpen(open === "pos" ? "" : "pos")}>
            {ar ? "+ منصب" : "+ Position"}
          </button>
        ) : null}
      >
        {canWrite && open === "pos" && (
          <div style={panel}>
            <div style={formGrid}>
              <label>
                <span style={labelText}>{ar ? "الوظيفة" : "Job"}</span>
                <select style={field} value={posForm.jobId} onChange={(e) => setPosForm((f) => ({ ...f, jobId: e.target.value }))}>
                  <option value="">{ar ? "اختر وظيفة" : "Select a job"}</option>
                  {jobs.map((j) => <option key={j.id} value={j.id}>{j.code} · {j.title}</option>)}
                </select>
              </label>
              <label>
                <span style={labelText}>{ar ? "الوحدة التنظيمية" : "Org unit"}</span>
                <select style={field} value={posForm.orgUnitId} onChange={(e) => setPosForm((f) => ({ ...f, orgUnitId: e.target.value }))}>
                  <option value="">{ar ? "اختر وحدة" : "Select a unit"}</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>
              <label>
                <span style={labelText}>{ar ? "نسبة الدوام (FTE)" : "FTE"}</span>
                <input type="number" min="0.1" max="1" step="0.1" style={field} value={posForm.fte} onChange={(e) => setPosForm((f) => ({ ...f, fte: e.target.value }))} />
              </label>
              <label>
                <span style={labelText}>{ar ? "تاريخ السريان" : "Effective from"}</span>
                <input type="date" style={field} value={posForm.effectiveFrom} onChange={(e) => setPosForm((f) => ({ ...f, effectiveFrom: e.target.value }))} />
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "13px", justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={busy}
                style={{ ...ui.btnPrimary, opacity: busy ? 0.6 : 1 }}
                onClick={async () => {
                  const ok = await run({ action: "createPosition", ...posForm }, ar ? "أُنشئ المنصب" : "Position created");
                  if (ok) setPosForm({ jobId: "", orgUnitId: "", fte: 1, effectiveFrom: todayKey() });
                }}
              >
                {ar ? "أنشئ المنصب" : "Create position"}
              </button>
            </div>
          </div>
        )}

        <div style={{ ...tableShell, marginTop: "14px" }}>
          <div style={{ ...headLine, gridTemplateColumns: "100px minmax(150px,1.6fr) minmax(120px,1fr) 60px minmax(120px,1fr)" }}>
            <div>{ar ? "المرجع" : "REF"}</div>
            <div>{ar ? "الوظيفة" : "JOB"}</div>
            <div>{ar ? "الوحدة" : "UNIT"}</div>
            <div>FTE</div>
            <div>{ar ? "الشاغل" : "HOLDER"}</div>
          </div>
          {positions.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: MUTED }}>
              {ar ? "لا مناصب بعد." : "No positions yet."}
            </div>
          ) : positions.map((p) => (
            <div key={p.id} style={{ ...rowLine, gridTemplateColumns: "100px minmax(150px,1.6fr) minmax(120px,1fr) 60px minmax(120px,1fr)", opacity: p.closed ? 0.5 : 1 }}>
              <div dir="ltr" style={{ fontSize: "11px", color: MUTED, textAlign: ar ? "right" : "left" }}>{p.ref}</div>
              <div>{p.jobTitle || "—"}</div>
              <div style={{ fontSize: "11px", color: MUTED }}>{p.orgUnitName || "—"}</div>
              <div dir="ltr" style={{ fontSize: "11px", textAlign: ar ? "right" : "left" }}>{p.fte}</div>
              <div>
                {p.holderName ? (
                  <span style={{ fontSize: "12px" }}>
                    {p.holderName}
                    {p.holderStatus === "suspended" ? <span style={{ fontSize: "10px", color: "#B45309" }}> · {ar ? "موقوف" : "suspended"}</span> : null}
                  </span>
                ) : (
                  <span style={{ fontSize: "11px", color: "#B45309", fontWeight: 600 }}>{ar ? "شاغر" : "Vacant"}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── employment actions ── */}
      <Section
        title={ar ? "سجل الإجراءات الوظيفية" : "Employment action register"}
        note={ar
          ? "التعيين والنقل والترقية وإنهاء الخدمة إجراءات مؤرَّخة بسبب مُرمَّز — منها تُشتق حالة الموظف ومنصبه في أي تاريخ. لا يسجّل أحد إجراءً على نفسه."
          : "Hire, transfer, promotion and termination are date-tracked actions with coded reasons — employment status and position on any date derive from them. Nobody records an action on themselves."}
        action={canWrite ? (
          <button type="button" style={ui.btnPrimary} onClick={() => setOpen(open === "act" ? "" : "act")}>
            {ar ? "+ إجراء وظيفي" : "+ Employment action"}
          </button>
        ) : null}
      >
        {canWrite && open === "act" && (
          <div style={panel}>
            <div style={formGrid}>
              <label>
                <span style={labelText}>{ar ? "الموظف" : "Employee"}</span>
                <select style={field} value={actForm.employeeId} onChange={(e) => setActForm((f) => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">{ar ? "اختر موظفًا" : "Select an employee"}</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </label>
              <label>
                <span style={labelText}>{ar ? "نوع الإجراء" : "Action"}</span>
                <select
                  style={field}
                  value={actForm.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setActForm((f) => ({ ...f, type, reasonCode: (ACTION_REASONS[type] || [])[0]?.id || "" }));
                  }}
                >
                  {ACTION_TYPES.map((t) => <option key={t} value={t}>{ar ? ACTION_LABELS[t].ar : ACTION_LABELS[t].en}</option>)}
                </select>
              </label>
              {positionNeeded && (
                <label>
                  <span style={labelText}>{ar ? "المنصب" : "Position"}</span>
                  <select style={field} value={actForm.positionId} onChange={(e) => setActForm((f) => ({ ...f, positionId: e.target.value }))}>
                    <option value="">{ar ? "اختر منصبًا" : "Select a position"}</option>
                    {openPositions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.ref} · {p.jobTitle || "—"}{p.vacant ? (ar ? " · شاغر" : " · vacant") : ` · ${p.holderName}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                <span style={labelText}>{ar ? "تاريخ السريان" : "Effective date"}</span>
                <input type="date" style={field} value={actForm.effectiveDate} onChange={(e) => setActForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
              </label>
              <label>
                <span style={labelText}>{ar ? "السبب" : "Reason"}</span>
                <select style={field} value={actForm.reasonCode} onChange={(e) => setActForm((f) => ({ ...f, reasonCode: e.target.value }))}>
                  {reasonOptions.map((r) => <option key={r.id} value={r.id}>{ar ? r.ar : r.en}</option>)}
                </select>
              </label>
              <label>
                <span style={labelText}>{ar ? "ملاحظة" : "Note"}</span>
                <input style={field} value={actForm.note} onChange={(e) => setActForm((f) => ({ ...f, note: e.target.value }))} />
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "13px", justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={busy}
                style={{ ...ui.btnPrimary, opacity: busy ? 0.6 : 1 }}
                onClick={async () => {
                  const ok = await run({ action: "recordAction", ...actForm }, ar ? "سُجِّل الإجراء" : "Action recorded");
                  if (ok) setActForm((f) => ({ ...f, employeeId: "", positionId: "", note: "" }));
                }}
              >
                {ar ? "سجّل الإجراء" : "Record action"}
              </button>
            </div>
          </div>
        )}

        <div style={{ ...tableShell, marginTop: "14px" }}>
          <div style={{ ...headLine, gridTemplateColumns: "110px minmax(130px,1.4fr) 100px minmax(120px,1fr) minmax(110px,1fr)" }}>
            <div>{ar ? "التاريخ" : "EFFECTIVE"}</div>
            <div>{ar ? "الموظف" : "EMPLOYEE"}</div>
            <div>{ar ? "الإجراء" : "ACTION"}</div>
            <div>{ar ? "السبب" : "REASON"}</div>
            <div>{ar ? "سجّله" : "RECORDED BY"}</div>
          </div>
          {actions.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: MUTED }}>
              {ar ? "لا إجراءات مسجَّلة — الملفات الحالية تُعرض بإسناد مشتق حتى يُسجَّل التعيين." : "No recorded actions — existing files show a derived assignment until a hire is recorded."}
            </div>
          ) : actions.map((a) => {
            const reason = (ACTION_REASONS[a.type] || []).find((r) => r.id === a.reasonCode);
            return (
              <div key={a.id} style={{ ...rowLine, gridTemplateColumns: "110px minmax(130px,1.4fr) 100px minmax(120px,1fr) minmax(110px,1fr)" }}>
                <div dir="ltr" style={{ fontSize: "11px", color: MUTED, textAlign: ar ? "right" : "left" }}>{a.effectiveDate}</div>
                <div>{empName(a.employeeId)}</div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: a.type === "termination" ? "#DC2626" : NAVY }}>
                  {ar ? ACTION_LABELS[a.type]?.ar || a.type : ACTION_LABELS[a.type]?.en || a.type}
                </div>
                <div style={{ fontSize: "11px", color: MUTED }}>{reason ? (ar ? reason.ar : reason.en) : a.reasonCode}</div>
                <div style={{ fontSize: "11px", color: MUTED }}>{a.recordedByName || "—"}</div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title={ar ? "سجل تغيّر البيانات" : "Data change history"}
        note={ar
          ? "كل تعديل على الهيكل أو المناصب أو الإجراءات أو خطط الأهداف يُقيَّد باسم منفّذه وسببه، ولا يُمحى. هذا ما يقرأه المدقّق."
          : "Every change to units, positions, actions or goal plans is written with its actor and reason, and is never erased. This is what an auditor reads."}
      >
        <div style={{ ...tableShell, marginTop: "14px" }}>
          <div style={{ ...headLine, gridTemplateColumns: "132px 128px minmax(200px,2fr) minmax(110px,1fr)" }}>
            <div>{ar ? "الوقت" : "WHEN"}</div>
            <div>{ar ? "العملية" : "ACTION"}</div>
            <div>{ar ? "التفاصيل" : "DETAILS"}</div>
            <div>{ar ? "المنفّذ" : "BY"}</div>
          </div>
          {changeHistory.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: MUTED }}>
              {ar ? "لا تغييرات مقيَّدة بعد على وحدات الهيكل الوظيفي." : "No recorded changes to the HCM foundation yet."}
            </div>
          ) : changeHistory.map((h) => (
            <div key={h.id} style={{ ...rowLine, gridTemplateColumns: "132px 128px minmax(200px,2fr) minmax(110px,1fr)" }}>
              <div dir="ltr" style={{ fontSize: "11px", color: MUTED, textAlign: ar ? "right" : "left" }}>
                {h.at ? new Date(h.at).toLocaleString(ar ? "ar-SA" : "en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}
              </div>
              <div dir="ltr" style={{ fontSize: "10px", color: ACCENT, fontWeight: 600, textAlign: ar ? "right" : "left" }}>
                {String(h.action || "").replace(/^hcm\./, "")}
              </div>
              <div style={{ fontSize: "11px", lineHeight: 1.6 }}>
                {h.details || "—"}
                {h.reason ? <span style={{ color: MUTED }}> · {h.reason}</span> : null}
              </div>
              <div style={{ fontSize: "11px", color: MUTED }}>{h.performedBy || "—"}</div>
            </div>
          ))}
        </div>
      </Section>
    </section>
  );
}
