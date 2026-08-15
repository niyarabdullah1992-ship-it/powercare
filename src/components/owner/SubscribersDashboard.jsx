import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Loader2, Search } from "lucide-react";
import SubscriberRow from "@/components/owner/SubscriberRow";
import SubscriberAnalytics from "@/components/owner/SubscriberAnalytics";
import SubscriptionRevenueSummary from "@/components/owner/SubscriptionRevenueSummary";
import SubscriptionBulkExport from "@/components/owner/SubscriptionBulkExport";
import { subscriptionTotals, subscriptionBillableAmount, formatSubscriptionMoney } from "@/lib/subscriptionTax";

export default function SubscribersDashboard({ ar }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("subscriptionOverview", {});
      setData(res.data);
    } catch {
      setError(ar ? "تعذر تحميل البيانات." : "Failed to load data.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const summary = data?.summary;
  const allRows = [...(data?.subscriptions || []), ...(data?.companiesWithoutSubscription || [])];
  const rows = allRows.filter((r) => {
    if (statusFilter === "active" && !(r.status === "active" || r.status === "trialing" || r.status === "manual_active")) return false;
    if (statusFilter === "problem" && !(r.status === "past_due" || r.status === "unpaid" || r.status === "canceled")) return false;
    if (statusFilter === "none" && r.status !== "no_subscription") return false;
    if (statusFilter === "frozen" && !r.frozen) return false;
    const q = search.trim().toLowerCase();
    if (q && !(r.companyName || "").toLowerCase().includes(q) && !(r.email || "").toLowerCase().includes(q)) return false;
    return true;
  });
  const tableTotals = subscriptionTotals(rows.reduce((sum, row) => sum + subscriptionBillableAmount(row), 0));
  const stats = summary ? [
    { label: ar ? "الشركات المسجلة" : "Registered companies", value: summary.totalCompanies },
    { label: ar ? "اشتراكات نشطة" : "Active subscriptions", value: summary.activeSubscriptions },
    { label: ar ? "تجريبي" : "Trialing", value: summary.trialing },
    { label: ar ? "متأخر الدفع" : "Past due", value: summary.pastDue, warn: summary.pastDue > 0 },
    { label: ar ? "الاشتراكات المجمّدة" : "Frozen subscriptions", value: summary.frozen || 0, warn: summary.frozen > 0 },
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-soft">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-accent">{ar ? "مركز العمليات المالية" : "Financial operations"}</p><h1 className="mt-1 font-heading text-2xl font-semibold text-card-foreground">{ar ? "إدارة الاشتراكات" : "Subscription management"}</h1></div>
        <button onClick={load} disabled={loading} className="rounded-md border border-border bg-card p-2 text-accent hover:bg-muted" title={ar ? "تحديث" : "Refresh"}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> {ar ? "جارٍ التحميل…" : "Loading…"}
        </div>
      )}
      {error && <p className="text-sm text-red-500 font-body">{error}</p>}

      {summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stats.map((s) => (
              <div key={s.label} className={`ops-kpi-card rounded-xl border bg-card p-4 text-center shadow-soft ${s.warn ? "border-destructive/40" : "border-border"}`}>
                <p className={`font-heading text-3xl font-semibold ${s.warn ? "text-destructive" : "text-card-foreground"}`}>{s.value}</p>
                <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <SubscriptionRevenueSummary amount={summary.mrr} ar={ar} />
          <div className="flex justify-end"><SubscriptionBulkExport rows={allRows} ar={ar} /></div>
          <SubscriberAnalytics data={data} ar={ar} />

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ar ? "بحث باسم الشركة أو الإيميل…" : "Search by company or email…"}
                className="w-full rounded-md border border-input bg-card py-2.5 pe-3 ps-9 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-1.5">
              {[
                { key: "all", ar: "الكل", en: "All" },
                { key: "active", ar: "نشط", en: "Active" },
                { key: "problem", ar: "متعثر/ملغى", en: "Issues" },
                { key: "frozen", ar: "مجمّد", en: "Frozen" },
                { key: "none", ar: "بدون اشتراك", en: "No sub" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-body font-semibold transition-colors ${
                    statusFilter === f.key ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {ar ? f.ar : f.en}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm font-body mobile-cards">
              <thead>
                <tr className="border-b border-border bg-secondary text-start text-[11px] uppercase tracking-wide text-secondary-foreground/70">
                  <th className="px-4 py-3 text-start">{ar ? "الشركة" : "Company"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "الباقة" : "Plan"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "بداية الاشتراك" : "Start"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "نهاية الاشتراك" : "End"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "المتبقي" : "Left"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "بيان الاشتراك" : "Account statement"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">{ar ? "لا يوجد مشتركون بعد." : "No subscribers yet."}</td></tr>
                )}
                {rows.map((r, i) => (
                  <SubscriberRow key={r.id || r.accountId || i} row={r} ar={ar} onChanged={load} />
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-[#E2E8F0]/40 bg-secondary"><td colSpan={8} className="px-4 py-4"><div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-xs"><span>{ar ? "قبل الضريبة" : "Before VAT"}: <strong dir="ltr">{formatSubscriptionMoney(tableTotals.subtotal, "USD", ar)}</strong></span><span>{ar ? "الضريبة 15%" : "VAT 15%"}: <strong dir="ltr">{formatSubscriptionMoney(tableTotals.vat, "USD", ar)}</strong></span><span className="text-sm text-accent-foreground">{ar ? "الإجمالي شامل الضريبة" : "Total including VAT"}: <strong dir="ltr">{formatSubscriptionMoney(tableTotals.total, "USD", ar)}</strong></span></div></td></tr></tfoot>
              </table>
          </div>
        </>
      )}
    </div>
  );
}