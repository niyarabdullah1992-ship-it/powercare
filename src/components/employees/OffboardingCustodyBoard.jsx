import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Package, UserMinus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import {
  checkCompleteOffboardingGate,
  checkMarkReturnedGate,
} from "@/lib/offboardingDerivations";
import { toast } from "@/components/ui/use-toast";

async function offboardingApi(payload) {
  const res = await base44.functions.invoke("offboarding", payload);
  return res?.data ?? res;
}

const STEP_LABEL = {
  assets: { ar: "تسليم العهد والأصول", en: "Return assigned assets" },
  safety: { ar: "إخلاء طرف من السلامة", en: "Safety clearance" },
  settlement: { ar: "تسوية المستحقات المالية", en: "Final settlement" },
  access: { ar: "إلغاء صلاحيات الدخول", en: "Revoke system access" },
  qiwa: { ar: "إنهاء العقد في منصة قوى", en: "Terminate contract in Qiwa" },
  certificate: { ar: "شهادة الخبرة", en: "Experience certificate" },
};

const STATE_LABEL = {
  blocked: { ar: "موقوف", en: "Blocked", cls: "border-red-200 bg-red-50 text-red-700" },
  done: { ar: "مكتمل", en: "Done", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  ready: { ar: "جاهز للاحتساب", en: "Ready to compute", cls: "border-amber-200 bg-amber-50 text-amber-900" },
  on_completion: { ar: "عند الإغلاق", en: "On completion", cls: "border-border bg-muted text-muted-foreground" },
};

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function OffboardingCustodyBoard({ employee, canManage = false, lang = "ar" }) {
  const ar = lang === "ar";
  const { company, currentUser } = useAuth();
  const [caseRow, setCaseRow] = useState(null);
  const [busy, setBusy] = useState(false);

  const applyRemote = (remote) => {
    setCaseRow(remote?.case || null);
  };

  const load = async () => {
    if (!company?.id || !employee?.id) return;
    try {
      let remote = await offboardingApi({
        action: "get",
        companyId: company.id,
        employeeId: employee.id,
      });
      if (!remote?.case && canManage) {
        remote = await offboardingApi({
          action: "seedDemo",
          companyId: company.id,
          employeeId: employee.id,
          employeeName: employee.name,
          stationId: employee.stationId || null,
          hireDate: employee.profile?.hireDate || employee.hireDate || undefined,
          base: employee.profile?.salary?.base ?? employee.salary?.base,
          allowances: employee.profile?.salary?.allowances ?? employee.salary?.allowances,
          annualLeaveUsed: employee.profile?.leave?.annual,
        });
      }
      applyRemote(remote);
    } catch {
      setCaseRow(null);
    }
  };

  useEffect(() => { load(); }, [company?.id, employee?.id, canManage]);

  const run = async (payload, okMsg) => {
    if (!company?.id || !employee?.id) return;
    setBusy(true);
    try {
      const remote = await offboardingApi({
        ...payload,
        companyId: company.id,
        employeeId: employee.id,
      });
      if (remote?.error) {
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error),
          variant: "destructive",
        });
      } else {
        if (okMsg) toast({ description: okMsg });
        applyRemote(remote);
      }
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const markReturned = async (asset) => {
    const gate = checkMarkReturnedGate(caseRow, asset.id);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run(
      { action: "markReturned", assetId: asset.id },
      ar ? `استُلمت: ${asset.name}` : `Returned: ${asset.name}`,
    );
  };

  const complete = async () => {
    const gate = checkCompleteOffboardingGate(caseRow);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    if (!window.confirm(
      ar
        ? "سيتم إنهاء الخدمة وإلغاء الصلاحيات وإشعار قوى. هل تريد المتابعة؟"
        : "This will complete offboarding, revoke access and notify Qiwa. Continue?",
    )) return;
    await run(
      { action: "complete" },
      ar ? "أُنهيت الخدمة وأُلغيت الصلاحيات وأُشعرت قوى" : "Offboarding completed, access revoked and Qiwa notified",
    );
  };

  if (!currentUser) return null;

  const eos = caseRow?.eos;
  const completed = caseRow?.status === "completed";
  const outstanding = caseRow?.outstandingCount || 0;
  const gateOpen = !!caseRow?.gateOpen;

  return (
    <section className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-accent/15 p-2"><UserMinus className="h-5 w-5 text-accent" /></span>
          <div>
            <h2 className="font-heading text-lg font-semibold">
              {ar ? "إنهاء الخدمة" : "Offboarding"}
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              {ar
                ? "لا يُغلق إنهاء الخدمة قبل استلام كل العهد وإلغاء الصلاحيات — الخطوتان مترابطتان في النظام."
                : "Offboarding cannot close before every asset is returned and access is revoked — the two steps are linked."}
            </p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
          completed
            ? "border-border bg-muted text-muted-foreground"
            : gateOpen
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {completed
            ? (ar ? "مكتمل" : "Completed")
            : gateOpen
              ? (ar ? "جاهز للإغلاق" : "Ready to close")
              : (ar ? "موقوف على العهدة" : "Blocked on custody")}
        </span>
      </div>

      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
        completed || gateOpen
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}>
        <Package className="h-4 w-4 shrink-0" />
        {completed
          ? (ar ? "أُنهيت الخدمة — الصلاحيات ملغاة وقوى أُشعرت" : "Offboarding completed — access revoked and Qiwa notified")
          : outstanding > 0
            ? (ar
              ? `${outstanding} عهدة لم تُستلم — إنهاء الخدمة موقوف`
              : `${outstanding} assets outstanding — offboarding is blocked`)
            : (ar ? "كل العهد مُستلمة — يمكن إنهاء الخدمة" : "All assets returned — offboarding can complete")}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold">{ar ? "العهد المسجّلة" : "Assigned assets"}</h3>
        <ul className="mt-3 divide-y">
          {(caseRow?.assets || []).map((asset) => {
            const returned = asset.status === "returned";
            return (
              <li key={asset.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{asset.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">{asset.serial || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                    returned
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}>
                    {returned ? (ar ? "مُستلم" : "Returned") : (ar ? "لم يُسلَّم" : "Outstanding")}
                  </span>
                  {canManage && !completed && !returned && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => markReturned(asset)}
                      className="rounded-md border border-accent/40 bg-white px-3 py-1.5 text-[11px] font-semibold text-accent disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (ar ? "استلمت العهدة" : "Mark returned")}
                    </button>
                  )}
                  {returned && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </div>
              </li>
            );
          })}
          {!caseRow?.assets?.length && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              {ar ? "لا عهد مسجّلة بعد." : "No custody assets yet."}
            </li>
          )}
        </ul>
      </div>

      {eos && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold">{ar ? "مكافأة نهاية الخدمة" : "End-of-service award"}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {ar
              ? "محسوبة وفق المادة 84 من نظام العمل السعودي على آخر أجر شامل، مضافًا إليها بدل الإجازات غير المستنفدة."
              : "Computed under Article 84 of the Saudi Labor Law on the final total wage, plus payment for unused annual leave."}
          </p>
          {eos.preStart ? (
            <p className="mt-3 text-sm text-amber-800">
              {ar
                ? "لا تستحق مكافأة نهاية خدمة قبل أول يوم عمل فعلي."
                : "No end-of-service gratuity accrues before the first actual working day."}
            </p>
          ) : (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{ar ? "آخر أجر شامل" : "Final wage"}</dt><dd className="font-mono" dir="ltr">{fmt(eos.wage)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{ar ? "نصف شهر × أول 5 سنوات" : "Half month × first 5 years"}</dt><dd className="font-mono" dir="ltr">{fmt(eos.firstFive)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{ar ? "شهر كامل × ما بعد 5 سنوات" : "Full month × years beyond 5"}</dt><dd className="font-mono" dir="ltr">{fmt(eos.beyondFive)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{ar ? `بدل ${eos.unusedAnnualDays} يوم إجازة` : `${eos.unusedAnnualDays} days unused leave`}</dt><dd className="font-mono" dir="ltr">{fmt(eos.leaveCash)}</dd></div>
              <div className="flex justify-between gap-3 border-t pt-2 font-semibold"><dt>{ar ? "الإجمالي المستحق" : "Total due"}</dt><dd className="font-mono" dir="ltr">{fmt(eos.total)}</dd></div>
            </dl>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">{ar ? "خطوات الإغلاق" : "Closure steps"}</h3>
        <ul className="space-y-2">
          {(caseRow?.steps || []).map((step) => {
            const label = STEP_LABEL[step.id] || { ar: step.id, en: step.id };
            const state = STATE_LABEL[step.state] || STATE_LABEL.on_completion;
            return (
              <li key={step.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{ar ? label.ar : label.en}</span>
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${state.cls}`}>
                  {ar ? state.ar : state.en}
                </span>
              </li>
            );
          })}
        </ul>

        {canManage && (
          <button
            type="button"
            disabled={busy || completed || !gateOpen}
            onClick={complete}
            className={`mt-4 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
              completed || !gateOpen
                ? "border border-border bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground"
            }`}
            title={
              completed
                ? (ar ? "الخدمة منتهية بالفعل" : "Already completed")
                : !gateOpen
                  ? (ar ? "استلم كل العهد أولًا" : "Return every asset first")
                  : undefined
            }
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
            {completed
              ? (ar ? "أُنهيت الخدمة" : "Offboarding completed")
              : (ar ? "أنهِ الخدمة" : "Complete offboarding")}
          </button>
        )}
        {!canManage && (
          <p className="mt-3 text-xs text-muted-foreground">
            {ar ? "إجراءات إنهاء الخدمة متاحة للإدارة والموارد البشرية فقط." : "Offboarding is available to management and HR only."}
          </p>
        )}
      </div>
    </section>
  );
}
