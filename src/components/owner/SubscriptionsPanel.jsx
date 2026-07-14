import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Loader2, AlertTriangle, RefreshCw } from "lucide-react";

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700",
  trialing: "bg-blue-100 text-blue-700",
  past_due: "bg-red-100 text-red-700",
  unpaid: "bg-red-100 text-red-700",
  canceled: "bg-gray-200 text-gray-600",
  incomplete: "bg-amber-100 text-amber-700",
  no_subscription: "bg-gray-100 text-gray-500",
};

const STATUS_AR = {
  active: "نشط",
  trialing: "تجريبي",
  past_due: "متأخر الدفع",
  unpaid: "غير مدفوع",
  canceled: "ملغى",
  incomplete: "غير مكتمل",
  no_subscription: "بدون اشتراك",
};

export default function SubscriptionsPanel({ lang }) {
  const ar = lang === "ar";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("subscriptionOverview", {});
      setData(res.data);
    } catch {
      setError(ar ? "تعذر تحميل بيانات الاشتراكات." : "Failed to load subscription data.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fmtDate = (ts) => (ts ? new Date(ts).toLocaleDateString(ar ? "ar" : "en", { year: "numeric", month: "short", day: "numeric" }) : "—");

  const summary = data?.summary;
  const stats = summary ? [
    { label: ar ? "الشركات المسجلة" : "Registered companies", value: summary.totalCompanies },
    { label: ar ? "اشتراكات نشطة" : "Active subscriptions", value: summary.activeSubscriptions },
    { label: ar ? "تجريبي" : "Trialing", value: summary.trialing },
    { label: ar ? "متأخر الدفع" : "Past due", value: summary.pastDue, warn: summary.pastDue > 0 },
    { label: ar ? "ينتهي خلال 14 يوم" : "Ending within 14 days", value: summary.endingSoon, warn: summary.endingSoon > 0 },
  ] : [];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold flex items-center gap-2 text-[#3a2f22]">
          <CreditCard className="w-4 h-4" /> {ar ? "الاشتراكات" : "Subscriptions"}
        </h3>
        <button onClick={load} disabled={loading} className="p-2 text-landing-gold hover:text-landing-gold-deep" title={ar ? "تحديث" : "Refresh"}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !data && (
        <div className="flex items-center gap-2 text-sm text-[#3a2f22]/50 font-body py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> {ar ? "جارٍ التحميل…" : "Loading…"}
        </div>
      )}
      {error && <p className="text-sm text-red-500 font-body">{error}</p>}

      {summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stats.map((s) => (
              <div key={s.label} className={`rounded-lg p-3 text-center ${s.warn ? "bg-red-50" : "bg-landing-bg"}`}>
                <p className={`hero-title text-2xl ${s.warn ? "text-red-600" : "text-[#3a2f22]"}`}>{s.value}</p>
                <p className="text-[10px] font-body text-[#3a2f22]/50 mt-1 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-xs font-body text-[#3a2f22]/60">
            <span>{ar ? "مجاني" : "Free"}: <b>{summary.byPlan.Free ?? 0}</b></span>
            <span>Starter: <b>{summary.byPlan.Starter}</b></span>
            <span>Professional: <b>{summary.byPlan.Professional}</b></span>
            <span>Enterprise: <b>{summary.byPlan.Enterprise}</b></span>
            <span>{ar ? "مخصص" : "Custom"}: <b>{summary.byPlan.Custom ?? 0}</b></span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {[...(data.subscriptions || []), ...(data.companiesWithoutSubscription || [])].length === 0 && (
              <p className="text-sm text-[#3a2f22]/40 font-body">{ar ? "لا توجد اشتراكات بعد." : "No subscriptions yet."}</p>
            )}
            {(data.subscriptions || []).map((s) => {
              const endingSoon = s.daysLeft != null && s.daysLeft <= 14 && (s.status === "trialing" || s.cancelAtPeriodEnd);
              return (
                <div key={s.id} className={`p-3 rounded-lg ${endingSoon ? "bg-red-50 border border-red-200" : "bg-landing-bg"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-[#3a2f22]">{s.companyName || s.email}</p>
                      <p className="text-xs text-[#3a2f22]/40 truncate">{s.email}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[s.status] || "bg-gray-100 text-gray-600"}`}>
                      {ar ? (STATUS_AR[s.status] || s.status) : s.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-body text-[#3a2f22]/60">
                    <span>{s.plan}{s.billing ? ` · ${ar ? (s.billing === "yearly" ? "سنوي" : "شهري") : s.billing}` : ""}</span>
                    {s.amount != null && <span>{s.amount} {s.currency}</span>}
                    <span>
                      {s.status === "trialing"
                        ? (ar ? "تنتهي التجربة" : "Trial ends") : s.cancelAtPeriodEnd
                          ? (ar ? "ينتهي" : "Ends") : (ar ? "يتجدد" : "Renews")}: <b>{fmtDate(s.endsAt)}</b>
                    </span>
                    {s.daysLeft != null && s.daysLeft >= 0 && (
                      <span className={endingSoon ? "text-red-600 font-semibold flex items-center gap-1" : ""}>
                        {endingSoon && <AlertTriangle className="w-3 h-3" />}
                        {ar ? `باقي ${s.daysLeft} يوم` : `${s.daysLeft} days left`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {(data.companiesWithoutSubscription || []).map((c, i) => (
              <div key={`${c.email}-${i}`} className="p-3 rounded-lg bg-landing-bg flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-[#3a2f22]">{c.companyName || c.email}</p>
                  <p className="text-xs text-[#3a2f22]/40 truncate">{c.email} · {c.plan}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES.no_subscription}`}>
                  {ar ? STATUS_AR.no_subscription : "no subscription"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}