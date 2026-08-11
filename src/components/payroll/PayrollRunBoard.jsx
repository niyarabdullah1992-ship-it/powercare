import React, { useEffect, useState } from "react";
import { Banknote, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { monthKey as localMonthKey } from "@/lib/payroll";
import {
  OT_RATE,
  checkApprovePayrollGate,
  checkSendWpsGate,
} from "@/lib/payrollDerivations";
import { toast } from "@/components/ui/use-toast";

async function payrollApi(payload) {
  const res = await base44.functions.invoke("payroll", payload);
  return res?.data ?? res;
}

const fmt = (n, currency = "SAR") =>
  `${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} ${currency}`;

export default function PayrollRunBoard({ month: monthProp, lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [month, setMonth] = useState(monthProp || localMonthKey());
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [seedHours, setSeedHours] = useState("4");

  useEffect(() => {
    if (monthProp) setMonth(monthProp);
  }, [monthProp]);

  const stationName = (id) => {
    if (!id || id === "__unassigned__") return ar ? "غير مخصص" : "Unassigned";
    return data?.stations?.find((s) => s.id === id)?.name || id;
  };

  const applyRemote = (remote) => {
    if (remote?.run) setRun(remote.run);
    else if (remote?.ok && remote.run === null) setRun(null);
  };

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await payrollApi({ action: "list", companyId: company.id, month });
      applyRemote(remote);
    } catch {
      setRun(null);
    }
  };

  useEffect(() => { load(); }, [company?.id, month]);

  const runAction = async (payload, okMsg) => {
    if (!company?.id) return;
    setBusy(true);
    try {
      const remote = await payrollApi({ ...payload, companyId: company.id, month });
      if (remote?.error) {
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error),
          variant: "destructive",
        });
      } else {
        if (okMsg) toast({ description: okMsg });
        if (remote.run) setRun(remote.run);
        else applyRemote(remote);
      }
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const ensureFromEmployees = async () => {
    const employees = (data?.employees || []).filter((e) => e.role !== "owner");
    const items = employees.map((e) => {
      const base = Number(e.profile?.baseSalary) || 0;
      const allowances = Number(e.profile?.allowances) || 0;
      return {
        employeeId: e.id,
        employeeName: e.name,
        stationId: e.stationId || null,
        base,
        allowances,
        bonus: 0,
        overtimeHours: Number(seedHours) || 0,
        deductions: 0,
        currency: String(e.profile?.currency || "SAR").toUpperCase(),
        qiwaWage: base + allowances,
      };
    });
    await runAction(
      { action: "ensureRun", items },
      ar ? `فُتح مسير ${month}` : `Opened run ${month}`,
    );
  };

  const approve = async () => {
    if (!run) return;
    const gate = checkApprovePayrollGate(run);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await runAction(
      { action: "approve" },
      ar ? "اعتُمد المسير — جاهز لملف حماية الأجور." : "Run approved — ready for the WPS file.",
    );
  };

  const sendWps = async () => {
    if (!run) return;
    const gate = checkSendWpsGate(run);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await runAction(
      { action: "sendWps" },
      ar
        ? (gate.late ? "أُرسل ملف WPS بعد المهلة النظامية." : "أُنشئ ملف حماية الأجور وأُرسل للبنك.")
        : (gate.late ? "WPS file sent after the statutory deadline." : "WPS file generated and sent to the bank."),
    );
  };

  if (!currentUser) return null;

  const totals = run?.totals;
  const wps = run?.wps;
  const currency = run?.items?.[0]?.currency || "SAR";

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-accent/15 p-2"><Banknote className="h-5 w-5 text-accent" /></span>
          <div>
            <h2 className="font-heading text-lg font-semibold">{ar ? "مسير الرواتب وحماية الأجور" : "Payroll run & WPS"}</h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              {ar
                ? `الإضافي ${OT_RATE * 100}% من أجر الساعة (المادة 107). ملف WPS يُرفع بعد الاعتماد ومطابقة عقود قوى فقط.`
                : `Overtime at ${OT_RATE * 100}% of hourly wage (Article 107). WPS is sent only after approval and Qiwa contract match.`}
            </p>
          </div>
        </div>
        <label className="grid gap-1 text-[11px]">
          <span>{ar ? "الشهر" : "Month"}</span>
          <input
            type="month"
            className="h-8 rounded-md border bg-background px-2 text-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>

      {!run && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed p-3">
          <p className="w-full text-xs text-muted-foreground">
            {ar ? "لا مسير لهذا الشهر على الخادم بعد." : "No server payroll run for this month yet."}
          </p>
          <label className="grid gap-1 text-[11px]">
            <span>{ar ? "ساعات إضافية تجريبية للجميع" : "Seed OT hours (all)"}</span>
            <input className="h-8 w-24 rounded-md border bg-background px-2 text-sm" value={seedHours} onChange={(e) => setSeedHours(e.target.value)} />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={ensureFromEmployees}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {ar ? "افتح المسير من الملفات" : "Open run from profiles"}
          </button>
        </div>
      )}

      {run && totals && (
        <>
          <div className="grid gap-3 rounded-xl bg-[#14284B] p-4 text-white sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="text-[10px] font-semibold tracking-wider text-emerald-300">{ar ? "مسير الرواتب" : "PAYROLL RUN"}</div>
              <div className="mt-1 text-sm">{month} · {totals.heads} {ar ? "موظفًا" : "employees"}</div>
              <div className="mt-2 font-heading text-3xl font-semibold tabular-nums">{fmt(totals.total, currency)}</div>
              <div className="mt-1 text-xs text-white/60">{ar ? "الإجمالي قبل الاعتماد" : "Total before approval"}</div>
            </div>
            <div>
              <div className="text-xs text-white/60">{ar ? "الأساسي والبدلات" : "Base & allowances"}</div>
              <div className="mt-1 tabular-nums">{fmt(totals.baseAndAllowances, currency)}</div>
            </div>
            <div>
              <div className="text-xs text-white/60">{ar ? "ساعات إضافية" : "Overtime"}</div>
              <div className="mt-1 tabular-nums">{fmt(totals.overtime, currency)}</div>
              <div className="mt-3 text-xs text-white/60">{ar ? "استقطاعات" : "Deductions"}</div>
              <div className="mt-1 tabular-nums">{fmt(totals.deductions, currency)}</div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{ar ? "حماية الأجور (WPS)" : "Wage Protection (WPS)"}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  wps?.status === "sent" ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : wps?.status === "ready" ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-border bg-muted text-muted-foreground"
                }`}>
                  {wps?.status === "sent"
                    ? (ar ? "أُرسل إلى البنك" : "Sent to the bank")
                    : wps?.status === "ready"
                      ? (ar ? "جاهز للإرسال" : "Ready to send")
                      : (ar ? "بانتظار الاعتماد" : "Awaiting approval")}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {ar
                  ? "يُرفع شهريًا عبر البنك، وتُقارن مبالغه بعقود قوى قبل الإرسال."
                  : "Filed monthly through the bank; amounts are matched to Qiwa contracts before send."}
              </p>
              <div className="mt-3 space-y-1 text-xs">
                <div>{ar ? "المهلة النظامية" : "Statutory deadline"}: <span className="font-medium" dir="ltr">{wps?.deadline || "—"}</span>
                  {wps?.late ? <span className="ms-2 text-red-600">{ar ? "(متأخر)" : "(late)"}</span> : null}
                </div>
                <div>{ar ? "مطابقة قوى" : "Qiwa match"}: <span className="font-medium" dir="ltr">{wps?.matchLabel}</span></div>
              </div>
              <button
                type="button"
                disabled={busy || run.status === "sent"}
                onClick={sendWps}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {run.status === "sent"
                  ? (ar ? "أُرسل — حمّل نسخة" : "Sent — download copy")
                  : (ar ? "أنشئ ملف حماية الأجور" : "Generate the WPS file")}
              </button>
            </div>

            <div className="rounded-lg border p-3">
              <h3 className="text-sm font-semibold">{ar ? "اعتماد المسير" : "Approve run"}</h3>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {ar ? "الحالة" : "Status"}: <span className="font-medium">{run.status || "draft"}</span>
                {totals.issueCount > 0 && (
                  <span className="ms-2 text-red-600">{totals.issueCount} {ar ? "بندًا فيه خلل" : "lines with issues"}</span>
                )}
              </p>
              <button
                type="button"
                disabled={busy || run.status === "approved" || run.status === "sent"}
                onClick={approve}
                className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-40"
              >
                {run.status === "approved" || run.status === "sent"
                  ? (ar ? "اعتُمد وأُرسل للبنك" : "Approved and sent to bank")
                  : (ar ? "اعتمد المسير وأرسله للبنك" : "Approve run and send to bank")}
              </button>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {ar
                  ? "الزر يعتمد المسير فقط — إرسال WPS خطوة منفصلة بعد مطابقة قوى."
                  : "This approves the run only — WPS send is a separate step after Qiwa match."}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{ar ? "التوزيع حسب المحطة" : "Breakdown by station"}</h3>
            <p className="text-[11px] text-muted-foreground">
              {ar ? "الأساسي والبدلات والإضافي قبل الاعتماد النهائي" : "Base, allowances and overtime before final approval"}
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="border-b p-2 text-start">{ar ? "المحطة" : "Station"}</th>
                    <th className="border-b p-2 text-start">{ar ? "العدد" : "Heads"}</th>
                    <th className="border-b p-2 text-start">{ar ? "أساسي+بدلات" : "Base+allow."}</th>
                    <th className="border-b p-2 text-start">{ar ? "إضافي" : "OT"}</th>
                    <th className="border-b p-2 text-start">{ar ? "الصافي" : "Net"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(run.byStation || []).map((r) => (
                    <tr key={r.stationId}>
                      <td className="border-b p-2 font-medium">{stationName(r.stationId)}</td>
                      <td className="border-b p-2 tabular-nums">{r.heads}</td>
                      <td className="border-b p-2 tabular-nums" dir="ltr">{fmt(r.baseAndAllowances, "")}</td>
                      <td className={`border-b p-2 tabular-nums ${r.overtime > 50000 ? "font-semibold text-red-600" : ""}`} dir="ltr">{fmt(r.overtime, "")}</td>
                      <td className="border-b p-2 tabular-nums" dir="ltr">{fmt(r.total, "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
