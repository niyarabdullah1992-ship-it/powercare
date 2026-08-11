import React, { useEffect, useState } from "react";
import { Briefcase, Loader2, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import {
  RQ_STAGES,
  applicableHireSteps,
  checkAdvanceGate,
  checkConfirmStartGate,
} from "@/lib/hiringDerivations";
import { careersPublicPath } from "@/lib/careersContent";
import { toast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

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

export default function Recruitment() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    stationId: data?.stations?.[0]?.id || "",
    grade: "G6",
    saudiFirst: true,
  });
  const [appName, setAppName] = useState({});
  const [nitaqatNote, setNitaqatNote] = useState({});

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

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <PageHeader
        title={ar ? "التوظيف والتعيين" : "Recruitment & onboarding"}
        description={ar
          ? "المهلة تُحسب من يوم فتح الشاغر لا من دخول المرحلة — والعرض لا يُصدر بلا مرشح مسمّى."
          : "SLA runs from the vacancy open day, not stage entry — and no offer without a named pick."}
        icon={Briefcase}
      />

      {stats && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            [stats.vacanciesOpen, ar ? "شواغر مفتوحة" : "vacancies open"],
            [stats.applications, ar ? "طلبات" : "applications"],
            [stats.avgDaysOpen, ar ? "متوسط أيام الشغور" : "avg days open"],
            [stats.stagesLate, ar ? "مراحل متأخرة" : "stages late"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border bg-card px-4 py-3">
              <div className="font-heading text-2xl font-semibold tabular-nums">{value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      )}

      {isHr && (
        <form onSubmit={openVacancy} className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
          <label className="grid gap-1 text-xs">
            <span>{ar ? "المسمى" : "Title"}</span>
            <input
              required
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-xs">
            <span>{ar ? "المحطة" : "Station"}</span>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={form.stationId}
              onChange={(e) => setForm((f) => ({ ...f, stationId: e.target.value }))}
            >
              {(data?.stations || []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs">
            <span>{ar ? "الدرجة" : "Grade"}</span>
            <input
              className="h-9 w-20 rounded-md border bg-background px-3 text-sm"
              value={form.grade}
              onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
            />
          </label>
          <button
            type="submit"
            disabled={busy || !form.title}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {ar ? "افتح شاغرًا" : "Open vacancy"}
          </button>
        </form>
      )}

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">{ar ? "مسار التوظيف" : "Recruitment path"}</h2>
        {vacancies.filter((v) => !v.board?.done && !v.withdrawn).length === 0 && (
          <p className="text-sm text-muted-foreground">{ar ? "لا شواغر مفتوحة في هذا النطاق." : "No open vacancies in this scope."}</p>
        )}
        {vacancies.filter((v) => !v.board?.done && !v.withdrawn).map((v) => {
          const b = v.board || {};
          const stageLabel = STAGE_LABEL[b.stageId] || { ar: b.stageId, en: b.stageId };
          return (
            <article key={v.key} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-base font-semibold">{v.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stationName(v.stationId)} · {v.grade} · {ar ? `مفتوح منذ ${b.ageDays} يومًا` : `open ${b.ageDays} days`}
                  </p>
                  {company?.id ? (
                    <p className="mt-1.5 text-xs">
                      <Link
                        to={careersPublicPath(company.id, v.key)}
                        className="text-accent hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {ar ? "رابط التقديم العام" : "Public careers link"}
                      </Link>
                      <span className="text-muted-foreground">
                        {" · "}
                        {ar ? "بلا حساب موظف" : "no employee account"}
                      </span>
                    </p>
                  ) : null}
                </div>
                <span className={`rounded-md border px-2 py-1 text-xs font-medium ${b.late ? "border-red-200 bg-red-50 text-red-700" : "border-border bg-muted/50"}`}>
                  {b.late
                    ? (ar ? `تأخّرت ${Math.abs(b.daysLeft)} يومًا عن المهلة` : `${Math.abs(b.daysLeft)} days past due`)
                    : b.daysLeft === 0
                      ? (ar ? "تستحق اليوم" : "Due today")
                      : (ar ? `تبقّى ${b.daysLeft} يومًا` : `${b.daysLeft} days left`)}
                </span>
              </div>

              <p className="text-sm">
                <span className="font-medium">{ar ? stageLabel.ar : stageLabel.en}</span>
                <span className="text-muted-foreground"> · {ar ? `مهلة المرحلة ${b.stageSla} أيام` : `Stage SLA ${b.stageSla} days`} · {ar ? "من يوم الفتح" : "from open day"}</span>
              </p>

              <div className="flex flex-wrap gap-1.5">
                {RQ_STAGES.map((s, i) => (
                  <span
                    key={s.id}
                    className={`rounded px-2 py-0.5 text-[10px] ${i < b.at ? "bg-emerald-50 text-emerald-800" : i === b.at ? (b.late ? "bg-red-50 text-red-700 font-semibold" : "bg-amber-50 text-amber-900 font-semibold") : "bg-muted text-muted-foreground"}`}
                  >
                    {ar ? STAGE_LABEL[s.id].ar : STAGE_LABEL[s.id].en}
                  </span>
                ))}
              </div>

              {!b.nitaqatEffectStated && b.at === 0 && isHr && (
                <div className="flex flex-wrap items-end gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                  <p className="w-full text-xs text-amber-900">
                    {ar ? "بوابة: بيان أثر نطاقات قبل الإعلان." : "Gate: state Nitaqat effect before posting."}
                  </p>
                  <input
                    className="h-8 flex-1 rounded-md border bg-background px-2 text-xs"
                    placeholder={ar ? "ملاحظة الأثر (اختياري)" : "Effect note (optional)"}
                    value={nitaqatNote[v.key] || ""}
                    onChange={(e) => setNitaqatNote((m) => ({ ...m, [v.key]: e.target.value }))}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run({ action: "stateNitaqatEffect", key: v.key, note: nitaqatNote[v.key] }, ar ? "سُجّل أثر نطاقات." : "Nitaqat effect recorded.")}
                    className="h-8 rounded-md border border-amber-300 bg-white px-3 text-xs font-medium"
                  >
                    {ar ? "سجّل الأثر" : "State effect"}
                  </button>
                </div>
              )}

              {b.at === RQ_STAGES.length - 1 && !b.pickName && (
                <p className="text-xs font-medium text-red-700">
                  {ar ? "لا يمكن إصدار العرض — لم يُختر مرشح من القائمة القصيرة." : "Offer blocked — no candidate selected from the shortlist."}
                </p>
              )}
              {b.pickName && b.at >= RQ_STAGES.length - 1 && (
                <p className="text-xs text-emerald-800">{ar ? `المرشح المختار: ${b.pickName}` : `Selected: ${b.pickName}`}</p>
              )}

              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold">{ar ? "المتقدمون" : "Applicants"}</h4>
                  {isHr && (
                    <div className="flex gap-1">
                      <input
                        className="h-7 w-36 rounded border bg-background px-2 text-xs"
                        placeholder={ar ? "اسم المتقدم" : "Applicant name"}
                        value={appName[v.key] || ""}
                        onChange={(e) => setAppName((m) => ({ ...m, [v.key]: e.target.value }))}
                      />
                      <button
                        type="button"
                        disabled={busy || !appName[v.key]}
                        onClick={() => {
                          run({ action: "addApplicant", vacancyKey: v.key, name: appName[v.key], saudi: true }, ar ? "سُجّل متقدم." : "Applicant added.");
                          setAppName((m) => ({ ...m, [v.key]: "" }));
                        }}
                        className="h-7 rounded border px-2 text-[10px] font-medium"
                      >
                        {ar ? "+ أضف" : "+ Add"}
                      </button>
                    </div>
                  )}
                </div>
                {(v.applicants || []).length === 0 && (
                  <p className="text-xs text-muted-foreground">{ar ? "لا متقدمين بعد." : "No applicants yet."}</p>
                )}
                {(v.applicants || []).map((a) => (
                  <div key={a.id} className={`flex flex-wrap items-center gap-2 border-t border-border/60 py-2 text-xs ${a.state === "out" ? "opacity-60" : ""}`}>
                    <span className="font-medium">{a.name}</span>
                    <span className="text-muted-foreground">{a.saudi ? (ar ? "سعودي" : "Saudi") : (ar ? "غير سعودي" : "Non-Saudi")} · {a.state || "new"}</span>
                    {a.ref ? (
                      <span dir="ltr" className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {a.ref}
                      </span>
                    ) : null}
                    {a.source === "careers" ? (
                      <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-800">
                        {ar ? "Careers" : "Careers"}
                      </span>
                    ) : null}
                    {a.deletionRequested ? (
                      <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-900">
                        {ar ? "طلب حذف" : "Deletion requested"}
                      </span>
                    ) : null}
                    {isHr && a.state !== "out" && (
                      <>
                        {a.state !== "short" && a.state !== "pick" && (
                          <button type="button" disabled={busy} className="rounded border px-2 py-0.5" onClick={() => run({ action: "setApplicantState", id: a.id, state: "short" })}>
                            {ar ? "قائمة قصيرة" : "Shortlist"}
                          </button>
                        )}
                        <button type="button" disabled={busy} className="rounded border px-2 py-0.5" onClick={() => run({ action: "setApplicantState", id: a.id, state: "pick" })}>
                          {ar ? "اختره للعرض" : "Select for offer"}
                        </button>
                        <select
                          className="h-7 max-w-[10rem] rounded border bg-background px-1"
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

              {isHr && (
                <button
                  type="button"
                  disabled={busy || !b.canAdvance || (b.at === 0 && !b.nitaqatEffectStated)}
                  onClick={() => advance(v)}
                  className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                >
                  {b.at === RQ_STAGES.length - 1
                    ? (ar ? `أصدر العرض لـ${b.pickName || "…"}` : `Issue offer to ${b.pickName || "…"}`)
                    : (ar ? `أنجز: ${stageLabel.ar}` : `Complete: ${stageLabel.en}`)}
                </button>
              )}
            </article>
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">{ar ? "التعيينات الجارية" : "Onboarding in progress"}</h2>
        <p className="text-xs text-muted-foreground">
          {ar
            ? "لا يُحدَّد تاريخ مباشرة قبل اكتمال الحلقات الإلزامية — وأثر نطاقات يُعرض قبل العرض لا بعده."
            : "No start date until mandatory links close — Nitaqat effect is shown before the offer, not after."}
        </p>
        {onboarding.filter((h) => !h.confirmed).length === 0 && (
          <p className="text-sm text-muted-foreground">{ar ? "لا تعيينات جارية." : "No onboarding in progress."}</p>
        )}
        {onboarding.filter((h) => !h.confirmed).map((h) => {
          const st = h.status || {};
          const steps = applicableHireSteps(!!h.saudi);
          return (
            <article key={h.key} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h3 className="font-heading font-semibold">{h.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {h.saudi ? (ar ? "سعودي — يرفع نسبة التوطين" : "Saudi — raises Saudization") : (ar ? "غير سعودي — يخفض نسبة التوطين" : "Non-Saudi — lowers Saudization")}
                  </p>
                </div>
                <span className={`rounded-md border px-2 py-1 text-xs ${st.ready ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                  {st.ready
                    ? (ar ? "مستوفٍ — يجوز تحديد المباشرة" : "Complete — start date may be set")
                    : (ar ? `لا يجوز تحديد المباشرة — ينقص ${st.blockingIds?.length || 0}` : `Start blocked — ${st.blockingIds?.length || 0} open`)}
                </span>
              </div>
              <div className="space-y-1">
                {steps.map((s) => {
                  const ok = !!(h.stepsDone || {})[s.id];
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-2 text-xs">
                      <span>{ar ? HIRE_STEP_LABEL[s.id]?.ar : HIRE_STEP_LABEL[s.id]?.en}{s.must ? "" : ` (${ar ? "اختياري" : "optional"})`}</span>
                      {ok ? (
                        <span className="text-emerald-700">{ar ? "مكتمل" : "Done"}</span>
                      ) : isHr ? (
                        <button type="button" disabled={busy} className="rounded border px-2 py-0.5" onClick={() => run({ action: "completeHireStep", key: h.key, stepId: s.id })}>
                          {ar ? "سجّل الإنجاز" : "Mark complete"}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {isHr && (
                <button
                  type="button"
                  disabled={busy || !st.ready}
                  onClick={() => {
                    const gate = checkConfirmStartGate(h);
                    if (!gate.ok) {
                      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
                      return;
                    }
                    run({ action: "confirmStart", key: h.key }, ar ? "اعتُمدت المباشرة." : "Start confirmed.");
                  }}
                  className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                >
                  {ar ? "أكد تاريخ المباشرة" : "Confirm start date"}
                </button>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
