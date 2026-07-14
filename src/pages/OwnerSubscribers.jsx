import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { ShieldAlert, ArrowLeft, RefreshCw, Loader2, Users, Search } from "lucide-react";
import Logo from "@/components/Logo";
import SubscriberRow from "@/components/owner/SubscriberRow";
import SubscriberAnalytics from "@/components/owner/SubscriberAnalytics";

export default function OwnerSubscribers() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

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

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user]);

  if (user === undefined) return null;

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-landing-bg flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-sm text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="font-heading text-xl font-semibold text-[#3a2f22]">
            {ar ? "الوصول مرفوض" : "Access Denied"}
          </h2>
          <button onClick={() => navigate("/")} className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold">
            {ar ? "رجوع" : "Back"}
          </button>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const allRows = [...(data?.subscriptions || []), ...(data?.companiesWithoutSubscription || [])];
  const rows = allRows.filter((r) => {
    if (statusFilter === "active" && !(r.status === "active" || r.status === "trialing")) return false;
    if (statusFilter === "problem" && !(r.status === "past_due" || r.status === "unpaid" || r.status === "canceled")) return false;
    if (statusFilter === "none" && r.status !== "no_subscription") return false;
    const q = search.trim().toLowerCase();
    if (q && !(r.companyName || "").toLowerCase().includes(q) && !(r.email || "").toLowerCase().includes(q)) return false;
    return true;
  });
  const stats = summary ? [
    { label: ar ? "الشركات المسجلة" : "Registered companies", value: summary.totalCompanies },
    { label: ar ? "اشتراكات نشطة" : "Active subscriptions", value: summary.activeSubscriptions },
    { label: ar ? "تجريبي" : "Trialing", value: summary.trialing },
    { label: ar ? "متأخر الدفع" : "Past due", value: summary.pastDue, warn: summary.pastDue > 0 },
    { label: ar ? "ينتهي خلال 14 يوم" : "Ending within 14 days", value: summary.endingSoon, warn: summary.endingSoon > 0 },
  ] : [];

  return (
    <div className="min-h-screen bg-landing-bg px-4 py-8 sm:px-6" dir={ar ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-heading font-semibold text-lg text-[#3a2f22] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-landing-gold" /> {ar ? "تحليلات المشتركين" : "Subscribers Analytics"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="p-2 text-landing-gold hover:text-landing-gold-deep" title={ar ? "تحديث" : "Refresh"}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link to="/owner-panel" className="flex items-center gap-1.5 text-sm text-[#3a2f22]/60 hover:text-[#3a2f22] font-body">
              <ArrowLeft className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} /> {ar ? "لوحة المالك" : "Owner Panel"}
            </Link>
          </div>
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
                    <th className="px-4 py-3 text-start">{ar ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-[#3a2f22]/40">{ar ? "لا يوجد مشتركون بعد." : "No subscribers yet."}</td></tr>
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
    </div>
  );
}