import React, { useEffect, useState } from "react";
import { Check, Loader2, ReceiptText, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { checkApproveClaimGate, checkMarkPaidGate } from "@/lib/expenseDerivations";
import { toast } from "@/components/ui/use-toast";

async function budgetApi(payload) {
  const res = await base44.functions.invoke("budget", payload);
  return res?.data ?? res;
}

const TAG_LABEL = {
  on_track: { ar: "ضمن الحد", en: "On track", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  watch: { ar: "مراقبة", en: "Watch", cls: "border-amber-200 bg-amber-50 text-amber-900" },
  near_limit: { ar: "قارب النفاد", en: "Near limit", cls: "border-red-200 bg-red-50 text-red-700" },
  over: { ar: "متجاوز", en: "Over", cls: "border-red-300 bg-red-100 text-red-800" },
};

const STATUS_LABEL = {
  pending: { ar: "بانتظار الاعتماد", en: "Awaiting approval", cls: "border-amber-200 bg-amber-50 text-amber-900" },
  approved: { ar: "معتمدة", en: "Approved", cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  rejected: { ar: "مرفوضة", en: "Rejected", cls: "border-red-200 bg-red-50 text-red-700" },
  paid: { ar: "مصروفة", en: "Paid", cls: "border-border bg-muted text-muted-foreground" },
};

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function ExpenseBudgetBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, currentUser } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [claims, setClaims] = useState([]);
  const [companySum, setCompanySum] = useState(null);
  const [alert, setAlert] = useState(null);
  const [busy, setBusy] = useState(false);

  const applyRemote = (remote) => {
    if (Array.isArray(remote?.budgets)) setBudgets(remote.budgets);
    if (Array.isArray(remote?.claims)) setClaims(remote.claims);
    if (remote?.company) setCompanySum(remote.company);
    if (remote?.alert) setAlert(remote.alert);
  };

  const load = async () => {
    if (!company?.id) return;
    try {
      let remote = await budgetApi({ action: "list", companyId: company.id });
      if (Array.isArray(remote?.budgets) && remote.budgets.length === 0) {
        remote = await budgetApi({ action: "seedDemo", companyId: company.id });
      }
      applyRemote(remote);
    } catch {
      setBudgets([]);
      setClaims([]);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const run = async (payload, okMsg) => {
    if (!company?.id) return;
    setBusy(true);
    try {
      const remote = await budgetApi({ ...payload, companyId: company.id });
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

  const approve = async (claim) => {
    const budget = budgets.find((b) => b.stationId === claim.stationId);
    const gate = checkApproveClaimGate(claim, budget, claims);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run({ action: "approve", claimId: claim.id }, ar ? "اعتمدت المطالبة" : "Claim approved");
  };

  const markPaid = async (claim) => {
    const gate = checkMarkPaidGate(claim);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run({ action: "markPaid", claimId: claim.id }, ar ? "سُجّل الصرف" : "Marked paid");
  };

  if (!currentUser) return null;

  const barColor = (tag) => {
    if (tag === "near_limit" || tag === "over") return "#DC2626";
    if (tag === "watch") return "#F59E0B";
    return "hsl(var(--accent))";
  };

  return (
    <section className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-accent/15 p-2"><ReceiptText className="h-5 w-5 text-accent" /></span>
            <div>
              <h2 className="font-heading text-lg font-semibold">
                {ar ? "استهلاك الميزانية التشغيلية" : "Operating budget consumption"}
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                {ar
                  ? "يُحدَّث لحظيًا مع كل مطالبة معتمدة · الإيصال مطلوب قبل الاعتماد"
                  : "Updates live with every approved claim · receipt required before approval"}
              </p>
            </div>
          </div>
          <div className="text-end">
            <div className="font-heading text-2xl font-semibold tabular-nums" dir="ltr">
              {fmt(companySum?.spent)}
            </div>
            <div className="text-xs text-muted-foreground">
              {ar ? `من ${fmt(companySum?.limit)} ر.س` : `of ${fmt(companySum?.limit)} SAR`}
            </div>
          </div>
        </div>

        {(alert?.delayedPayoutCount > 0 || alert?.pendingCount > 0) && (
          <p className="mt-3 text-xs text-amber-800">
            {ar
              ? `${alert.delayedPayoutCount} معتمدة لم تُصرف خلال 48 ساعة · ${alert.pendingCount} بانتظار الاعتماد`
              : `${alert.delayedPayoutCount} approved unpaid after 48h · ${alert.pendingCount} awaiting approval`}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {budgets.map((b) => {
            const tag = TAG_LABEL[b.tag] || TAG_LABEL.on_track;
            return (
              <div key={b.stationId} className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 text-muted-foreground">{b.stationName || b.stationId}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.min(100, b.pct || 0)}%`, background: barColor(b.tag) }}
                  />
                </span>
                <span className="w-12 text-end tabular-nums text-muted-foreground" dir="ltr">{b.pct}%</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tag.cls}`}>
                  {ar ? tag.ar : tag.en}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{ar ? "المطالبات" : "Claims"}</h3>
          <span className="text-xs text-muted-foreground">
            {ar ? "المطالبة تحتاج إيصالًا مرفقًا قبل الاعتماد" : "A receipt attachment is required before approval"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="border-b p-2 text-start">{ar ? "المطالبة" : "Claim"}</th>
                <th className="border-b p-2 text-start">{ar ? "المسؤول" : "Owner"}</th>
                <th className="border-b p-2 text-start">{ar ? "المحطة" : "Station"}</th>
                <th className="border-b p-2 text-start">{ar ? "المبلغ" : "Amount"}</th>
                <th className="border-b p-2 text-start">{ar ? "الحالة" : "Status"}</th>
                <th className="border-b p-2 text-start">{ar ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => {
                const st = STATUS_LABEL[c.status] || STATUS_LABEL.pending;
                const station = budgets.find((b) => b.stationId === c.stationId);
                return (
                  <tr key={c.id}>
                    <td className="border-b p-2">
                      <div className="font-medium">{c.title}</div>
                      <div className="font-mono text-[10px] text-muted-foreground" dir="ltr">{c.ref}</div>
                    </td>
                    <td className="border-b p-2 text-muted-foreground">{c.owner || "—"}</td>
                    <td className="border-b p-2 text-muted-foreground">{station?.stationName || c.stationId}</td>
                    <td className="border-b p-2 tabular-nums font-semibold" dir="ltr">{fmt(c.amount)}</td>
                    <td className="border-b p-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${st.cls}`}>
                        {ar ? st.ar : st.en}
                        {c.delayed ? (ar ? " · متأخر" : " · delayed") : ""}
                        {!c.hasReceipt && c.status === "pending" ? (ar ? " · بلا إيصال" : " · no receipt") : ""}
                      </span>
                    </td>
                    <td className="border-b p-2">
                      <div className="flex flex-wrap gap-1">
                        {c.status === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => approve(c)}
                              className="inline-flex h-7 items-center gap-1 rounded-md bg-accent px-2 text-[10px] font-semibold text-accent-foreground disabled:opacity-50"
                            >
                              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              {ar ? "اعتماد" : "Approve"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => run(
                                { action: "reject", claimId: c.id, reason: c.hasReceipt ? "rejected" : "no receipt" },
                                ar ? "رُفضت المطالبة" : "Claim rejected",
                              )}
                              className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold disabled:opacity-50"
                            >
                              <X className="h-3 w-3" />
                              {ar ? "رفض" : "Reject"}
                            </button>
                          </>
                        )}
                        {c.status === "approved" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => markPaid(c)}
                            className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold disabled:opacity-50"
                          >
                            {ar ? "سجّل الصرف" : "Mark paid"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {claims.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">{ar ? "لا مطالبات على اللوح بعد." : "No claims on the board yet."}</p>
        )}
      </div>
    </section>
  );
}
