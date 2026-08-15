import React, { useMemo, useState } from "react";
import { formatDate } from "@/lib/dateFormat";
import { useAuth } from "@/lib/PowerCareAuth";
import { submitLeaveRequest, setLeaveRequestStatus } from "@/lib/store";
import {
  computeLeaveDays,
  leaveNeedsAttachment,
  LEAVE_TYPES,
} from "@/lib/leaveDerivations";
import { generateAbsenceDeduction } from "@/lib/deductionGenerators";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import EmployeeIdentityRow from "@/components/employees/EmployeeIdentityRow";
import { ChromeBox, identityFrame } from "@/components/shared/IdentityCard";
import { ACCENT, MUTED, NAVY, OK, WARN, BAD, NEUTRAL, emptyState, field, statCard, CARD, SURFACE } from "@/lib/platformStyles";

async function workforce(payload) {
  const res = await base44.functions.invoke("workforce", payload);
  return res?.data ?? res;
}

const COLS = "minmax(170px,1.4fr) 110px 108px minmax(150px,1fr) 90px 130px 116px 150px";

/** Platform.dc.html L6278–6287 — statutory rules (Labour Law), not manager discretion. */
const STATUTORY_LEAVE_TYPES = [
  {
    key: "annual",
    ar: "سنوية",
    en: "Annual",
    ruleAr: "21 يومًا بأجر كامل، وترتفع إلى 30 بعد خمس سنوات خدمة (م.109)",
    ruleEn: "21 days on full pay, rising to 30 after five years' service (art. 109)",
  },
  {
    key: "sick",
    ar: "مرضية",
    en: "Sick",
    ruleAr: "30 يومًا بأجر كامل، ثم 60 بثلاثة أرباع الأجر، ثم 30 بلا أجر (م.117)",
    ruleEn: "30 days full pay, then 60 at three-quarters, then 30 unpaid (art. 117)",
  },
  {
    key: "maternity",
    ar: "وضع",
    en: "Maternity",
    ruleAr: "عشرة أسابيع توزّعها المرأة كما تشاء قبل الوضع وبعده (م.151)",
    ruleEn: "Ten weeks the employee distributes before and after delivery as she chooses (art. 151)",
  },
  {
    key: "paternity",
    ar: "أبوة",
    en: "Paternity",
    ruleAr: "ثلاثة أيام بأجر كامل خلال أسبوع من الولادة (م.113)",
    ruleEn: "Three days on full pay within a week of the birth (art. 113)",
  },
  {
    key: "marriage",
    ar: "زواج",
    en: "Marriage",
    ruleAr: "خمسة أيام بأجر كامل (م.113)",
    ruleEn: "Five days on full pay (art. 113)",
  },
  {
    key: "bereavement",
    ar: "وفاة",
    en: "Bereavement",
    ruleAr: "خمسة أيام لوفاة الزوج أو أحد الأصول أو الفروع (م.113)",
    ruleEn: "Five days on the death of a spouse, parent or child (art. 113)",
  },
  {
    key: "hajj",
    ar: "حج",
    en: "Hajj",
    ruleAr: "من عشرة إلى خمسة عشر يومًا مرة واحدة طوال الخدمة (م.114)",
    ruleEn: "Ten to fifteen days, once in the whole period of service (art. 114)",
  },
  {
    key: "exam",
    ar: "امتحان",
    en: "Study exam",
    ruleAr: "أيام الامتحان الفعلية بأجر كامل للمنتسب لجهة تعليمية (م.115)",
    ruleEn: "The actual examination days on full pay for an enrolled employee (art. 115)",
  },
  {
    key: "holiday",
    ar: "أعياد",
    en: "Eid / public holidays",
    ruleAr: "أيام العيدين بأجر كامل — الفطر والأضحى وفق الإعلان الرسمي (عادة أربعة أيام لكل عيد).",
    ruleEn: "Eid holidays on full pay — Fitr and Adha per the official announcement (typically four days each).",
  },
  {
    key: "other",
    ar: "أخرى",
    en: "Other",
    ruleAr: "إجازة غير مصنّفة أعلاه — تُذكر سببها عند الطلب، ولا تُخصم من الرصيد السنوي إلا إذا قررت الإدارة ذلك.",
    ruleEn: "Leave not listed above — the reason is written on the request and is not taken from annual balance unless management decides so.",
  },
];

const typeRowStyle = {
  display: "flex",
  gap: "10px",
  padding: "10px 0",
  borderTop: "1px solid #F1F5F9",
};

const fieldInput = { ...field };

const okStyle = {
  padding: "5px 13px",
  borderRadius: "8px",
  border: `1px solid ${ACCENT}`,
  background: ACCENT,
  color: "#fff",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const noStyle = {
  padding: "5px 13px",
  borderRadius: "8px",
  border: "1px solid #E2E8F0",
  background: CARD,
  color: MUTED,
  fontSize: "11px",
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

function hasAttachment(request) {
  return (Array.isArray(request.files) && request.files.length > 0)
    || !!request.attachmentUrl
    || !!request.documentUrl;
}

function statusMeta(status, ar) {
  if (status === "approved") return { label: ar ? "معتمد" : "Approved", style: OK };
  if (status === "rejected") return { label: ar ? "مرفوض" : "Rejected", style: BAD };
  return { label: ar ? "بانتظار القرار" : "Pending", style: WARN };
}

/**
 * Platform leave queue only — L2517–2601 (stats chips + queue header/rows).
 * Skips statutory rules card (L2604+).
 */
export default function AttendanceLeaveRequests({ employees, stations, t, lang }) {
  const ar = lang === "ar";
  const { company, currentUser, refresh } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ employeeId: "", type: "annual", from: "", to: "" });

  const stationName = (id) => stations.find((station) => station.id === id)?.name || t("hq");

  const requests = useMemo(
    () => employees
      .flatMap((employee) => (employee.leaveRequests || []).map((request) => ({ ...request, employee })))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [employees],
  );

  const pending = requests.filter((r) => (r.status || "pending") === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");
  const pendingDays = pending.reduce(
    (n, r) => n + (Number(r.days) || computeLeaveDays(r.startDate, r.endDate) || 0),
    0,
  );

  /** L6292–6297 */
  const lvStats = [
    {
      value: String(pending.length),
      label: ar ? "بانتظار قرارك" : "awaiting your decision",
      warn: pending.length > 0,
    },
    {
      value: String(approved.length),
      label: ar ? "اعتُمدت" : "approved",
    },
    {
      value: String(rejected.length),
      label: ar ? "رُفضت بسبب مقيَّد" : "rejected with a recorded reason",
    },
    {
      value: String(pendingDays),
      label: ar ? "يوم إجازة بانتظار الاعتماد" : "leave days awaiting approval",
    },
  ];

  const lvReady = form.employeeId && form.type && form.from && form.to
    && new Date(form.to) >= new Date(form.from);
  const lvCreateStyle = lvReady
    ? {
      height: "36px",
      padding: "0 16px",
      borderRadius: "9px",
      border: "none",
      background: ACCENT,
      color: "#fff",
      fontSize: "12px",
      fontWeight: 600,
      cursor: busy ? "wait" : "pointer",
      fontFamily: "inherit",
      opacity: busy ? 0.6 : 1,
    }
    : {
      height: "36px",
      padding: "0 16px",
      borderRadius: "9px",
      border: "none",
      background: "#E2E8F0",
      color: MUTED,
      fontSize: "12px",
      fontWeight: 600,
      cursor: "not-allowed",
      fontFamily: "inherit",
    };

  const createRequest = () => {
    if (!lvReady || !company?.id) return;
    submitLeaveRequest(company.id, form.employeeId, {
      type: form.type,
      startDate: form.from,
      endDate: form.to,
      reason: "",
      files: [],
    });
    toast({
      description: ar
        ? "سُجّل طلب الإجازة — بانتظار الاعتماد"
        : "Leave request recorded — awaiting approval",
    });
    setForm({ employeeId: "", type: "annual", from: "", to: "" });
    setFormOpen(false);
    refresh?.();
  };

  const decide = async (request, status) => {
    if (!company?.id || !currentUser) return;
    const attached = hasAttachment(request);
    if (status === "approved" && leaveNeedsAttachment(request) && !attached) {
      toast({
        description: ar
          ? "لا يمكن الاعتماد — يلزم مستند لطلب يتجاوز 5 أيام (أو لنوع يتطلب مرفقًا)."
          : "Approval blocked — a document is required for a request over 5 days (or a type that requires an attachment).",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      try {
        const remote = await workforce({
          action: status === "approved" ? "approveLeave" : "rejectLeave",
          companyId: company.id,
          employeeId: request.employee.id,
          requestId: request.id,
        });
        if (remote?.error === "ATTACHMENT_REQUIRED") {
          toast({
            description: ar ? remote.reason : (remote.reasonEn || remote.reason),
            variant: "destructive",
          });
          return;
        }
      } catch {
        // Local store fallback
      }
      setLeaveRequestStatus(
        company.id,
        request.employee.id,
        request.id,
        status,
        currentUser.name,
      );
      if (status === "approved" && request.type === "unpaid") {
        const days = Number(request.days) || computeLeaveDays(request.startDate, request.endDate) || 0;
        if (days > 0) {
          generateAbsenceDeduction(company.id, request.employee.id, request.id, days, currentUser);
        }
      }
      refresh?.();
    } finally {
      setBusy(false);
    }
  };

  const headCell = {
    display: "grid",
    gridTemplateColumns: COLS,
    gap: "10px",
    padding: "10px 18px",
    background: SURFACE,
    borderBottom: "1px solid #E2E8F0",
    fontSize: "10px",
    letterSpacing: "0.06em",
    color: MUTED,
    fontWeight: 600,
  };

  const rowCell = {
    display: "grid",
    gridTemplateColumns: COLS,
    gap: "10px",
    padding: "12px 18px",
    borderBottom: "1px solid #F1F5F9",
    alignItems: "center",
  };

  return (
    <div style={{ maxWidth: "1320px", display: "flex", flexDirection: "column", gap: "16px", margin: "0 auto" }} dir={ar ? "rtl" : "ltr"}>
      {/* L2517–2524 stats chips */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(166px,1fr))", gap: "12px" }}>
        {lvStats.map((s) => (
          <div
            key={s.label}
            style={statCard}
          >
            <div
              dir="ltr"
              style={{
                fontFamily: "'IBM Plex Sans',sans-serif",
                fontSize: "24px",
                fontWeight: 600,
                lineHeight: 1,
                textAlign: "right",
                color: s.warn ? "#B45309" : NAVY,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "7px", lineHeight: 1.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* L2526–2601 queue */}
      <ChromeBox padded={false}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
                {ar ? "طلبات بانتظار القرار" : "Requests awaiting decision"}
              </div>
              <div style={{ fontSize: "11px", color: MUTED, marginTop: "3px" }}>
                {ar
                  ? "الطلب الذي يتجاوز 5 أيام يحتاج مبررًا ومستندًا. الإجازة بلا أجر المعتمدة تُنشئ بند خصم في المسير."
                  : "A request over 5 days needs a justification and a document. Approved unpaid leave writes a payroll deduction line."}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen((v) => !v)}
              style={{
                padding: "8px 15px",
                borderRadius: "9px",
                border: "none",
                background: "#1E9E63",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {ar ? "+ سجّل طلب إجازة" : "+ Record a leave request"}
            </button>
          </div>

          {formOpen && (
            <div style={{ marginTop: "13px", padding: "15px 16px", borderRadius: "12px", background: SURFACE, border: "1px solid #E2E8F0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "11px" }}>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" }}>
                    {ar ? "الموظف" : "Employee"}
                  </span>
                  <select
                    value={form.employeeId}
                    onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                    style={fieldInput}
                  >
                    <option value="">{ar ? "اختر الموظف" : "Select an employee"}</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" }}>
                    {ar ? "نوع الإجازة" : "Leave type"}
                  </span>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    style={fieldInput}
                  >
                    {(LEAVE_TYPES || []).map((ty) => (
                      <option key={ty.key} value={ty.key}>{ar ? ty.ar : ty.en}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" }}>
                    {ar ? "من" : "From"}
                  </span>
                  <input type="date" value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} style={fieldInput} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" }}>
                    {ar ? "إلى" : "To"}
                  </span>
                  <input type="date" value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} style={fieldInput} />
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "13px", flexWrap: "wrap" }}>
                <span style={{ flex: "1 1 240px", fontSize: "11px", color: MUTED, lineHeight: 1.65 }}>
                  {ar
                    ? "الطلب المسجَّل هنا يدخل الطابور نفسه ويخضع للاعتماد نفسه — ولا يُخصم من الرصيد قبل الاعتماد."
                    : "A request recorded here enters the same queue and the same approval — nothing is deducted from the balance before approval."}
                </span>
                <button
                  type="button"
                  onClick={() => { setFormOpen(false); setForm({ employeeId: "", type: "annual", from: "", to: "" }); }}
                  style={{
                    height: "36px",
                    padding: "0 14px",
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
                <button type="button" disabled={!lvReady || busy} onClick={createRequest} style={lvCreateStyle}>
                  {ar ? "أرسل الطلب للاعتماد" : "Submit for approval"}
                </button>
              </div>
            </div>
          )}
        </div>

        {requests.length === 0 ? (
          <div style={{ ...emptyState, border: "none", borderRadius: 0 }}>
            {t("noLeaveRequests")}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "940px" }}>
              <div style={headCell}>
                <div>{ar ? "الموظف" : "EMPLOYEE"}</div>
                <div>{ar ? "الفرع" : "STATION"}</div>
                <div>{ar ? "نوع الإجازة" : "LEAVE TYPE"}</div>
                <div>{ar ? "الفترة" : "PERIOD"}</div>
                <div>{ar ? "الأيام" : "DAYS"}</div>
                <div>{ar ? "الرصيد بعد الاعتماد" : "BALANCE AFTER"}</div>
                <div>{ar ? "الحالة" : "STATUS"}</div>
                <div />
              </div>
              {requests.map((request) => {
                const typeMeta = (LEAVE_TYPES || []).find((x) => x.key === request.type);
                const days = Number(request.days) || computeLeaveDays(request.startDate, request.endDate);
                const pendingRow = (request.status || "pending") === "pending";
                const attached = hasAttachment(request);
                const needsDoc = pendingRow && leaveNeedsAttachment(request) && !attached;
                const canOk = pendingRow && !needsDoc;
                const st = statusMeta(request.status || "pending", ar);
                const bal = request.balanceAfter
                  || request.balanceLabel
                  || (typeMeta?.requiresFile
                    ? (ar ? "بتقرير طبي" : "With medical report")
                    : "—");
                const balDir = /^[\d\s→—\-]+$/.test(String(bal)) ? "ltr" : "auto";
                const fileStyle = attached ? OK : (days > 5 ? BAD : NEUTRAL);
                const fileText = attached
                  ? (ar ? "مرفق طبي/مستند" : "Document attached")
                  : (ar ? "بلا مرفق" : "No attachment");

                return (
                  <div
                    key={`${request.employee.id}-${request.id}`}
                    style={rowCell}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#F7F8FA"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <EmployeeIdentityRow
                        employee={request.employee}
                        employeeId={request.employee.id}
                        name={request.employee.name}
                        showId={false}
                        compact
                      />
                      <div style={{ marginTop: "4px" }}>
                        <span style={fileStyle}>{fileText}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: MUTED }}>{stationName(request.employee.stationId)}</div>
                    <div style={{ fontSize: "12px", color: MUTED }}>
                      {ar ? (typeMeta?.ar || t(request.type)) : (typeMeta?.en || t(request.type))}
                    </div>
                    <div dir="ltr" style={{ fontSize: "12px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>
                      {formatDate(request.startDate, lang)} → {formatDate(request.endDate, lang)}
                    </div>
                    <div style={{ fontSize: "12px", color: MUTED }}>
                      {ar ? `${days} أيام` : `${days} days`}
                    </div>
                    <div dir={balDir} style={{ fontSize: "12px", color: NAVY, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>
                      {bal}
                    </div>
                    <div>
                      <span style={st.style}>{st.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: "7px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {canOk && (
                        <button type="button" disabled={busy} onClick={() => decide(request, "approved")} style={{ ...okStyle, opacity: busy ? 0.6 : 1 }}>
                          {ar ? "اعتمد" : "Approve"}
                        </button>
                      )}
                      {needsDoc && (
                        <span style={BAD}>
                          {ar
                            ? "لا يمكن الاعتماد — يلزم مستند لطلب يتجاوز 5 أيام"
                            : "Approval blocked — a document is required for a request over 5 days"}
                        </span>
                      )}
                      {pendingRow && (
                        <button type="button" disabled={busy} onClick={() => decide(request, "rejected")} style={{ ...noStyle, opacity: busy ? 0.6 : 1 }}>
                          {ar ? "ارفض" : "Reject"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ChromeBox>

      {/* L2604–2615 statutory entitlement — reference only, not a second leave board */}
      <details style={{ ...identityFrame, padding: "14px 18px" }}>
        <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600, color: NAVY, listStyle: "none" }}>
          {ar ? "الاستحقاق النظامي لكل نوع — مرجع" : "Statutory entitlement by type — reference"}
        </summary>
        <div style={{ fontSize: "11px", color: MUTED, marginTop: "8px", lineHeight: 1.7, maxWidth: "840px" }}>
          {ar
            ? "الاستحقاق قاعدة لا تقدير — يُقاس عليه كل طلب قبل الاعتماد. الطابور أعلاه هو سطح القرار."
            : "Entitlement is a rule, not a judgement — every request is measured against it. The queue above is the decision surface."}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "0 26px", marginTop: "8px" }}>
          {STATUTORY_LEAVE_TYPES.map((ty) => (
            <div key={ty.key} style={typeRowStyle}>
              <span style={{ minWidth: "74px", fontSize: "12px", fontWeight: 600, color: NAVY }}>
                {ar ? ty.ar : ty.en}
              </span>
              <span style={{ flex: 1, fontSize: "11px", color: MUTED, lineHeight: 1.7 }}>
                {ar ? ty.ruleAr : ty.ruleEn}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
