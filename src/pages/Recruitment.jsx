import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import {
  RQ_STAGES,
  applicableHireSteps,
  checkAdvanceGate,
  checkConfirmStartGate,
} from "@/lib/hiringDerivations";
import { careersPublicPath } from "@/lib/careersContent";
import { toast } from "@/components/ui/use-toast";
import useStationScope, { matchesStationScope } from "@/hooks/useStationScope";
import { ACCENT, BAD, MUTED, NAVY, OK, WARN, NEUTRAL, cardShell, emptyState, num, pill, statCard, tag, ui, field, SURFACE } from "@/lib/platformStyles";
import PlatformStampShell from "@/components/shared/PlatformStampShell";

async function hiring(payload) {
  const res = await base44.functions.invoke("hiring", payload);
  return res?.data ?? res;
}

const STAGE_LABEL = {
  req: { ar: "طلب التوظيف والاعتماد", en: "Requisition and approval" },
  post: { ar: "الإعلان في المنصة الوطنية", en: "Posted on the national portal" },
  screen: { ar: "الفرز والاختبار الفني", en: "Screening and technical test" },
  intv: { ar: "المقابلات", en: "Interviews" },
  offer: { ar: "العرض الوظيفي", en: "Job offer" },
};

const HIRE_STEP_LABEL = {
  offer: { ar: "عرض وظيفي موقّع", en: "Signed offer" },
  qiwa: { ar: "توثيق العقد في قوى", en: "Qiwa contract" },
  gosi: { ar: "تسجيل التأمينات", en: "GOSI registration" },
  med: { ar: "الفحص الطبي", en: "Pre-placement medical" },
  iqama: { ar: "الإقامة / نقل الخدمة", en: "Iqama / transfer" },
  hse: { ar: "تدريب السلامة التعريفي", en: "HSE induction" },
  assets: { ar: "تسليم العهدة", en: "Assets handover" },
};

const REJECT_REASONS = [
  { ar: "لا يستوفي الحد الأدنى للخبرة", en: "Below the minimum experience" },
  { ar: "شهادة السلامة غير سارية", en: "Safety certificate not valid" },
  { ar: "لم يجتز الاختبار الفني", en: "Did not pass the technical test" },
  { ar: "اعتذر عن المتابعة", en: "Withdrew from the process" },
];

/** Platform.dc.html L2927–2980 field chrome */
const fieldInput = { ...field };

const btnGhost = { ...ui.btnGhost, textDecoration: "none" };

const btnMuted = { ...ui.btnGhost, padding: "6px 12px", fontSize: "11px" };

const stepDone = tag("#ECFDF3", "#15803D", "#BBF7D0");
const stepActiveOk = tag("#FFFBEB", "#B45309", "#FDE68A");
const stepActiveLate = tag("#FEF2F2", "#DC2626", "#FECACA");
const stepIdle = tag("#F7F8FA", MUTED, "#E2E8F0");

function stepDot(done, active, late) {
  const color = done ? ACCENT : active ? (late ? "#DC2626" : "#F59E0B") : "#E2E8F0";
  return {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  };
}

export default function Recruitment() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    stationId: data?.stations?.[0]?.id || "",
    grade: "G6",
    saudiFirst: true,
  });
  const [appName, setAppName] = useState({});
  const [nitaqatNote, setNitaqatNote] = useState({});
  const headerScope = useStationScope();

  // A new requisition opens on the station currently in scope.
  useEffect(() => {
    if (headerScope !== "all") setForm((f) => ({ ...f, stationId: headerScope }));
  }, [headerScope]);

  const isHr = currentUser && (
    ["owner", "director", "ops_manager", "station_manager", "pgm", "admin"].includes(currentUser.role)
    || data?.ownerId === currentUser?.id
  );

  const stationName = (id) => data?.stations?.find((s) => s.id === id)?.name || id || "—";

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await hiring({ action: "list", companyId: company.id });
      if (remote?.ok || Array.isArray(remote?.vacancies)) {
        setVacancies(remote.vacancies || []);
        setOnboarding(remote.onboarding || []);
        setStats(remote.stats || null);
      }
    } catch {
      setVacancies([]);
      setOnboarding([]);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const run = async (payload, okMsg) => {
    if (!company?.id) return;
    setBusy(true);
    try {
      const remote = await hiring({ ...payload, companyId: company.id });
      if (remote?.error) {
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error),
          variant: "destructive",
        });
      } else {
        if (okMsg) toast({ description: okMsg });
        setVacancies(remote.vacancies || []);
        setOnboarding(remote.onboarding || []);
        setStats(remote.stats || null);
      }
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const openVacancy = async (e) => {
    e.preventDefault();
    await run(
      { action: "openVacancy", ...form },
      ar ? `فُتح شاغر «${form.title}» — مهلة الاعتماد 3 أيام من يوم الفتح.` : `Vacancy «${form.title}» opened — approval SLA 3 days from open day.`,
    );
    setForm((f) => ({ ...f, title: "" }));
    setFormOpen(false);
  };

  const advance = async (v) => {
    const gate = checkAdvanceGate(v);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    const stage = RQ_STAGES[Math.min(v.at || 0, RQ_STAGES.length - 1)];
    await run(
      { action: "advance", key: v.key },
      ar ? `أُنجزت مرحلة ${STAGE_LABEL[stage.id]?.ar || stage.id}` : `Completed ${STAGE_LABEL[stage.id]?.en || stage.id}`,
    );
  };

  if (!currentUser) return null;

  const openList = vacancies
    .filter((v) => matchesStationScope(v.stationId, headerScope, data?.stations))
    .filter((v) => !v.board?.done && !v.withdrawn);
  const activeOnboarding = onboarding
    .filter((h) => matchesStationScope(h.stationId, headerScope, data?.stations))
    .filter((h) => !h.confirmed);

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "التوظيف" : "Recruitment"}
      hint={ar ? "طلب الشاغر حتى اعتماد المباشرة — بوابات واضحة في كل مرحلة." : "From requisition to confirmed start — named gates at every stage."}
      maxWidth={1280}
    >
      {/* L2906–2912 stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(166px,1fr))", gap: "12px" }}>
        {[
          [stats?.vacanciesOpen ?? openList.length, ar ? "شواغر مفتوحة" : "vacancies open"],
          [stats?.applications ?? 0, ar ? "طلبات" : "applications"],
          [stats?.avgDaysOpen ?? "—", ar ? "متوسط أيام الشغور" : "avg days open"],
          [stats?.stagesLate ?? 0, ar ? "مراحل متأخرة" : "stages late"],
        ].map(([value, label]) => (
          <div key={label} style={statCard}>
            <div dir="ltr" style={num(NAVY)}>{value}</div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "7px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* L2915–2922 requisition card */}
      <div style={cardShell}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
              {ar ? "التوظيف والتعيين" : "Recruitment & onboarding"}
            </div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.7, maxWidth: "860px" }}>
              {ar
                ? "من طلب التوظيف إلى أول يوم عمل — بمهلة لكل مرحلة. العرض لا يُصدر بلا مرشح مسمّى."
                : "From requisition to first day — with a deadline on every stage. No offer without a named pick."}
            </div>
          </div>
          {company?.id && (
            <Link to={careersPublicPath(company.id)} style={btnGhost}>
              {ar ? "صفحة الوظائف العامة" : "Public careers page"}
            </Link>
          )}
          {isHr && (
            <button type="button" style={ui.btnPrimary} onClick={() => setFormOpen((o) => !o)}>
              {ar ? "افتح شاغرًا" : "Open vacancy"}
            </button>
          )}
        </div>

        {isHr && formOpen && (
          <form
            onSubmit={openVacancy}
            style={{
              marginTop: "14px",
              padding: "15px 16px",
              borderRadius: "12px",
              background: SURFACE,
              border: "1px solid #E2E8F0",
            }}
          >
            <div style={{ fontSize: "11px", letterSpacing: "0.06em", color: MUTED, fontWeight: 600, marginBottom: "8px" }}>
              {ar ? "طلب التوظيف" : "Requisition"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "11px" }}>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" }}>
                  {ar ? "المسمى" : "Title"}
                </span>
                <input
                  required
                  style={fieldInput}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" }}>
                  {ar ? "الفرع" : "Station"}
                </span>
                <select
                  style={fieldInput}
                  value={form.stationId}
                  onChange={(e) => setForm((f) => ({ ...f, stationId: e.target.value }))}
                >
                  {(data?.stations || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: MUTED, marginBottom: "5px" }}>
                  {ar ? "الدرجة" : "Grade"}
                </span>
                <input
                  style={fieldInput}
                  value={form.grade}
                  onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                />
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "13px", flexWrap: "wrap" }}>
              <span style={{ flex: "1 1 240px", fontSize: "11px", color: MUTED, lineHeight: 1.65 }}>
                {ar
                  ? "المسمى والفرع والدرجة مطلوبة."
                  : "Title, station and grade are required."}
              </span>
              <button type="button" style={btnGhost} onClick={() => setFormOpen(false)}>
                {ar ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" disabled={busy || !form.title} style={{ ...ui.btnPrimary, opacity: busy || !form.title ? 0.4 : 1 }}>
                {ar ? "أنشئ الشاغر" : "Create vacancy"}
              </button>
            </div>
          </form>
        )}

        <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY, marginTop: "18px" }}>
          {ar ? "مسار التوظيف" : "Recruitment path"}
        </div>

        {openList.length === 0 && (
          <div style={{ padding: "22px 0 6px", textAlign: "center", fontSize: "13px", color: MUTED }}>
            {ar ? "لا شواغر مفتوحة في هذا النطاق." : "No open vacancies in this scope."}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
          {openList.map((v) => {
            const b = v.board || {};
            const stageLabel = STAGE_LABEL[b.stageId] || { ar: b.stageId, en: b.stageId };
            const at = b.at || 0;
            const progressPct = Math.round(((at + (b.done ? 1 : 0)) / RQ_STAGES.length) * 100);
            const dueStyle = b.late ? BAD : b.daysLeft === 0 ? WARN : NEUTRAL;
            const dueText = b.late
              ? (ar ? `تأخّرت ${Math.abs(b.daysLeft)} يومًا عن المهلة` : `${Math.abs(b.daysLeft)} days past due`)
              : b.daysLeft === 0
                ? (ar ? "تستحق اليوم" : "Due today")
                : (ar ? `تبقّى ${b.daysLeft} يومًا` : `${b.daysLeft} days left`);

            return (
              <div key={v.key} style={{ border: "1px solid #E2E8F0", borderRadius: "13px", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: NAVY }}>{v.title}</span>
                  <span style={{ fontSize: "12px", color: MUTED }}>
                    {stationName(v.stationId)} · {v.grade} · {ar ? `مفتوح منذ ${b.ageDays ?? 0} يومًا` : `open ${b.ageDays ?? 0} days`}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: "11px", color: MUTED, whiteSpace: "nowrap" }}>
                    {ar ? `منذ ${b.ageDays ?? 0}ي` : `${b.ageDays ?? 0}d`}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "11px", flexWrap: "wrap" }}>
                  <span style={{ flex: "1 1 140px", height: "5px", borderRadius: "4px", background: "#F1F5F9", overflow: "hidden" }}>
                    <span style={{ display: "block", width: `${progressPct}%`, height: "100%", background: ACCENT, borderRadius: "4px" }} />
                  </span>
                  <span style={{ fontSize: "11px", color: MUTED, whiteSpace: "nowrap" }}>
                    {at + 1}/{RQ_STAGES.length}
                  </span>
                  <span style={dueStyle}>{dueText}</span>
                </div>

                <div style={{ display: "flex", gap: "14px", marginTop: "11px", flexWrap: "wrap" }}>
                  {RQ_STAGES.map((s, i) => {
                    const done = i < at;
                    const active = i === at;
                    const style = done ? stepDone : active ? (b.late ? stepActiveLate : stepActiveOk) : stepIdle;
                    return (
                      <span key={s.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={stepDot(done, active, b.late)} />
                        <span style={{ ...style, fontWeight: active ? 600 : 500 }}>
                          {ar ? STAGE_LABEL[s.id].ar : STAGE_LABEL[s.id].en}
                        </span>
                      </span>
                    );
                  })}
                </div>

                {company?.id && (
                  <div style={{ marginTop: "12px", padding: "11px 13px", borderRadius: "11px", background: SURFACE, border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: NAVY }}>{ar ? "رابط التقديم" : "Careers link"}</span>
                      <span style={OK}>{ar ? "منشور" : "Live"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                      <Link
                        to={careersPublicPath(company.id, v.key)}
                        target="_blank"
                        rel="noreferrer"
                        dir="ltr"
                        style={{
                          fontSize: "11px",
                          color: "#14683F",
                          fontFamily: "'IBM Plex Mono',monospace",
                          background: "#ECFDF3",
                          border: "1px solid #BBF7D0",
                          borderRadius: "7px",
                          padding: "4px 9px",
                          textDecoration: "none",
                        }}
                      >
                        {careersPublicPath(company.id, v.key)}
                      </Link>
                      <span style={{ flex: "1 1 240px", fontSize: "11px", color: MUTED, lineHeight: 1.6 }}>
                        {ar ? "صفحة عامة يفتحها المرشح من جواله — لا يحتاج حسابًا." : "Public page — no platform account needed."}
                      </span>
                    </div>
                  </div>
                )}

                {!b.nitaqatEffectStated && at === 0 && isHr && (
                  <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "11px", background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                    <div style={{ fontSize: "11px", color: "#B45309", lineHeight: 1.7 }}>
                      {ar ? "بوابة: بيان أثر نطاقات قبل الإعلان." : "Gate: state Nitaqat effect before posting."}
                    </div>
                    <div style={{ display: "flex", gap: "7px", marginTop: "8px", flexWrap: "wrap" }}>
                      <input
                        style={{ ...fieldInput, flex: "1 1 160px" }}
                        placeholder={ar ? "ملاحظة الأثر (اختياري)" : "Effect note (optional)"}
                        value={nitaqatNote[v.key] || ""}
                        onChange={(e) => setNitaqatNote((m) => ({ ...m, [v.key]: e.target.value }))}
                      />
                      <button
                        type="button"
                        disabled={busy}
                        style={btnMuted}
                        onClick={() => run({ action: "stateNitaqatEffect", key: v.key, note: nitaqatNote[v.key] }, ar ? "سُجّل أثر نطاقات." : "Nitaqat effect recorded.")}
                      >
                        {ar ? "سجّل الأثر" : "State effect"}
                      </button>
                    </div>
                  </div>
                )}

                {at === RQ_STAGES.length - 1 && !b.pickName && (
                  <div style={{ marginTop: "10px", fontSize: "11px", fontWeight: 600, color: "#DC2626" }}>
                    {ar ? "لا يمكن إصدار العرض — لم يُختر مرشح من القائمة القصيرة." : "Offer blocked — no candidate selected from the shortlist."}
                  </div>
                )}
                {b.pickName && at >= RQ_STAGES.length - 1 && (
                  <div style={{ marginTop: "10px", fontSize: "11px", color: "#15803D" }}>
                    {ar ? `المرشح المختار: ${b.pickName}` : `Selected: ${b.pickName}`}
                  </div>
                )}

                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: MUTED }}>{ar ? "المتقدمون" : "Applicants"}</span>
                    <span style={{ flex: 1 }} />
                    {isHr && (
                      <>
                        <input
                          style={{ ...fieldInput, width: "140px", height: "30px", fontSize: "11px" }}
                          placeholder={ar ? "اسم المتقدم" : "Applicant name"}
                          value={appName[v.key] || ""}
                          onChange={(e) => setAppName((m) => ({ ...m, [v.key]: e.target.value }))}
                        />
                        <button
                          type="button"
                          disabled={busy || !appName[v.key]}
                          style={{ ...btnMuted, opacity: busy || !appName[v.key] ? 0.4 : 1 }}
                          onClick={() => {
                            run({ action: "addApplicant", vacancyKey: v.key, name: appName[v.key], saudi: true }, ar ? "سُجّل متقدم." : "Applicant added.");
                            setAppName((m) => ({ ...m, [v.key]: "" }));
                          }}
                        >
                          {ar ? "+ أضف" : "+ Add"}
                        </button>
                      </>
                    )}
                  </div>
                  {(v.applicants || []).length === 0 && (
                    <div style={{ padding: "12px 0 2px", fontSize: "11px", color: MUTED }}>
                      {ar ? "لا متقدمين بعد." : "No applicants yet."}
                    </div>
                  )}
                  {(v.applicants || []).map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        padding: "10px 0",
                        borderTop: "1px solid #F1F5F9",
                        opacity: a.state === "out" ? 0.6 : 1,
                      }}
                    >
                      <span style={{ flex: "1 1 220px", minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: NAVY }}>{a.name}</span>
                        <span style={{ display: "block", fontSize: "11px", color: MUTED, marginTop: "2px" }}>
                          {a.saudi ? (ar ? "سعودي" : "Saudi") : (ar ? "غير سعودي" : "Non-Saudi")} · {a.state || "new"}
                          {a.ref ? ` · ${a.ref}` : ""}
                          {a.source === "careers" ? (ar ? " · Careers" : " · Careers") : ""}
                        </span>
                      </span>
                      {isHr && a.state !== "out" && (
                        <>
                          {a.state !== "short" && a.state !== "pick" && (
                            <button type="button" disabled={busy} style={btnMuted} onClick={() => run({ action: "setApplicantState", id: a.id, state: "short" })}>
                              {ar ? "قائمة قصيرة" : "Shortlist"}
                            </button>
                          )}
                          <button type="button" disabled={busy} style={ui.btnRow} onClick={() => run({ action: "setApplicantState", id: a.id, state: "pick" })}>
                            {ar ? "اختره للعرض" : "Select for offer"}
                          </button>
                          <select
                            style={{ ...fieldInput, width: "auto", height: "30px", fontSize: "11px" }}
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value) return;
                              run({ action: "setApplicantState", id: a.id, state: "out", reason: e.target.value });
                              e.target.value = "";
                            }}
                          >
                            <option value="">{ar ? "استبعد بسبب…" : "Reject with…"}</option>
                            {REJECT_REASONS.map((r) => (
                              <option key={r.en} value={ar ? r.ar : r.en}>{ar ? r.ar : r.en}</option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", paddingTop: "11px", borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
                  <span style={{ flex: "1 1 240px", minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "12px", fontWeight: 600, color: NAVY }}>
                      {ar ? stageLabel.ar : stageLabel.en}
                    </span>
                    <span style={{ display: "block", fontSize: "11px", color: MUTED, lineHeight: 1.65, marginTop: "2px" }}>
                      {ar ? `مهلة المرحلة ${b.stageSla} أيام · من يوم الفتح` : `Stage SLA ${b.stageSla} days · from open day`}
                    </span>
                  </span>
                  {isHr && (
                    <button
                      type="button"
                      disabled={busy || !b.canAdvance || (at === 0 && !b.nitaqatEffectStated)}
                      onClick={() => advance(v)}
                      style={{
                        ...ui.btnPrimary,
                        opacity: busy || !b.canAdvance || (at === 0 && !b.nitaqatEffectStated) ? 0.4 : 1,
                      }}
                    >
                      {at === RQ_STAGES.length - 1
                        ? (ar ? `أصدر العرض لـ${b.pickName || "…"}` : `Issue offer to ${b.pickName || "…"}`)
                        : (ar ? `أنجز: ${stageLabel.ar}` : `Complete: ${stageLabel.en}`)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Onboarding — same card chrome */}
      <div style={cardShell}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
          {ar ? "التعيينات الجارية" : "Onboarding in progress"}
        </div>
        <div style={{ fontSize: "11px", color: MUTED, marginTop: "4px", lineHeight: 1.7, maxWidth: "820px" }}>
          {ar
            ? "لا يُحدَّد تاريخ مباشرة قبل اكتمال الحلقات الإلزامية — وأثر نطاقات يُعرض قبل العرض لا بعده."
            : "No start date until mandatory links close — Nitaqat effect is shown before the offer, not after."}
        </div>

        {activeOnboarding.length === 0 && (
          <div style={{ ...emptyState, marginTop: "14px" }}>
            {ar ? "لا تعيينات جارية." : "No onboarding in progress."}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
          {activeOnboarding.map((h) => {
            const st = h.status || {};
            const steps = applicableHireSteps(!!h.saudi);
            return (
              <div key={h.key} style={{ border: "1px solid #E2E8F0", borderRadius: "13px", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: NAVY }}>{h.name}</span>
                  <span style={{ fontSize: "12px", color: MUTED }}>
                    {h.saudi ? (ar ? "سعودي — يرفع نسبة التوطين" : "Saudi — raises Saudization") : (ar ? "غير سعودي — يخفض نسبة التوطين" : "Non-Saudi — lowers Saudization")}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={st.ready ? OK : BAD}>
                    {st.ready
                      ? (ar ? "مستوفٍ — يجوز تحديد المباشرة" : "Complete — start date may be set")
                      : (ar ? `لا يجوز تحديد المباشرة — ينقص ${st.blockingIds?.length || 0}` : `Start blocked — ${st.blockingIds?.length || 0} open`)}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                  {steps.map((s) => {
                    const ok = !!(h.stepsDone || {})[s.id];
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                        <span style={{ fontSize: "12px", color: NAVY }}>
                          {ar ? HIRE_STEP_LABEL[s.id]?.ar : HIRE_STEP_LABEL[s.id]?.en}
                          {s.must ? "" : ` (${ar ? "اختياري" : "optional"})`}
                        </span>
                        {ok ? (
                          <span style={OK}>{ar ? "مكتمل" : "Done"}</span>
                        ) : isHr ? (
                          <button type="button" disabled={busy} style={btnMuted} onClick={() => run({ action: "completeHireStep", key: h.key, stepId: s.id })}>
                            {ar ? "سجّل الإنجاز" : "Mark complete"}
                          </button>
                        ) : (
                          <span style={pill("#F7F8FA", MUTED, "#E2E8F0")}>{ar ? "معلّق" : "Pending"}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isHr && (
                  <button
                    type="button"
                    disabled={busy || !st.ready}
                    style={{ ...ui.btnPrimary, marginTop: "12px", opacity: busy || !st.ready ? 0.4 : 1 }}
                    onClick={() => {
                      const gate = checkConfirmStartGate(h);
                      if (!gate.ok) {
                        toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
                        return;
                      }
                      run({ action: "confirmStart", key: h.key }, ar ? "اعتُمدت المباشرة." : "Start confirmed.");
                    }}
                  >
                    {ar ? "أكد تاريخ المباشرة" : "Confirm start date"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PlatformStampShell>
  );
}
