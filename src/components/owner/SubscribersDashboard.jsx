import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Loader2, Search } from "lucide-react";
import SubscriberRow from "@/components/owner/SubscriberRow";
import SubscriberAnalytics from "@/components/owner/SubscriberAnalytics";
import SubscriptionRevenueSummary from "@/components/owner/SubscriptionRevenueSummary";

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
  const stats = summary ? [
    { label: ar ? "الشركات المسجلة" : "Registered companies", value: summary.totalCompanies },
    { label: ar ? "اشتراكات نشطة" : "Active subscriptions", value: summary.activeSubscriptions },
    { label: ar ? "تجريبي" : "Trialing", value: summary.trialing },
    { label: ar ? "متأخر الدفع" : "Past due", value: summary.pastDue, warn: summary.pastDue > 0 },
    { label: ar ? "الاشتراكات المجمّدة" : "Frozen subscriptions", value: summary.frozen || 0, warn: summary.frozen > 0 },
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={load} disabled={loading} className="p-2 text-landing-gold hover:text-landing-gold-deep" title={ar ? "تحديث" : "Refresh"}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !data && (
        <div className="flex items-center gap-2 text-sm text-[#3a2f22]/50 font-body py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> {ar ? "جارٍ التحميل…" : "Loading…"}
        </div>
      )}
      {error && <p className="text-sm text-red-500 font-body">{error}</p>}

      {summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stats.map((s) => (
              <div key={s.label} className={`rounded-xl p-4 text-center bg-white shadow-sm ${s.warn ? "ring-1 ring-red-200" : ""}`}>
                <p className={`hero-title text-3xl ${s.warn ? "text-red-600" : "text-[#3a2f22]"}`}>{s.value}</p>
                <p className="text-[11px] font-body text-[#3a2f22]/50 mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          <SubscriptionRevenueSummary amount={summary.mrr} ar={ar} />
          <SubscriberAnalytics data={data} ar={ar} />

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3a2f22]/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ar ? "بحث باسم الشركة أو الإيميل…" : "Search by company or email…"}
                className="w-full ps-9 pe-3 py-2.5 rounded-xl bg-white shadow-sm text-sm font-body text-[#3a2f22] focus:outline-none focus:ring-2 focus:ring-landing-gold"
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
                    statusFilter === f.key ? "bg-landing-gold text-white" : "bg-white text-[#3a2f22]/60 shadow-sm hover:text-[#3a2f22]"
                  }`}
                >
                  {ar ? f.ar : f.en}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-sm font-body mobile-cards">
              <thead>
                <tr className="text-start text-[11px] uppercase tracking-wide text-[#3a2f22]/45 border-b border-[#3a2f22]/10">
                  <th className="px-4 py-3 text-start">{ar ? "الشركة" : "Company"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "الباقة" : "Plan"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "الحالة" : "Status"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "بداية الاشتراك" : "Start"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "نهاية الاشتراك" : "End"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "المتبقي" : "Left"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "الفاتورة" : "Invoice"}</th>
                  <th className="px-4 py-3 text-start">{ar ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-[#3a2f22]/40">{ar ? "لا يوجد مشتركون بعد." : "No subscribers yet."}</td></tr>
                )}
                {rows.map((r, i) => (
                  <SubscriberRow key={r.id || r.accountId || i} row={r} ar={ar} onChanged={load} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}