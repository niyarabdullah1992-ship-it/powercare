import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SubscriberAnalytics from "@/components/owner/SubscriberAnalytics";
import VisitorStatsCard from "@/components/owner/VisitorStatsCard";

export default function SaasAnalyticsDashboard({ lang }) {
  const ar = lang === "ar";
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    base44.functions.invoke("subscriptionOverview", {})
      .then((response) => setData(response.data))
      .catch(() => setError(true));
  }, []);

  const summary = data?.summary;
  const metrics = summary ? [
    [ar ? "إجمالي الشركات" : "Total companies", summary.totalCompanies],
    [ar ? "الاشتراكات النشطة" : "Active subscriptions", summary.activeSubscriptions],
    [ar ? "الفترة التجريبية" : "Trials", summary.trialing],
    [ar ? "الإيراد الشهري" : "Monthly revenue", `$${summary.mrr ?? 0}`],
  ] : [];

  return <div className="space-y-5">
    <div className="rounded-2xl bg-gradient-to-br from-[#3a2f22] to-[#654b2d] p-6 text-white shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-landing-gold-light">PowerCare SaaS</p>
      <h2 className="mt-2 font-heading text-3xl font-semibold">{ar ? "مركز أداء المنصة" : "Platform performance center"}</h2>
      <p className="mt-2 text-sm text-white/60">{ar ? "متابعة النمو والاشتراكات والإيرادات وزوار الموقع." : "Track growth, subscriptions, revenue, and website visitors."}</p>
    </div>
    {!data && !error && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-landing-gold" /></div>}
    {error && <p className="text-sm text-red-500">{ar ? "تعذر تحميل تحليلات المنصة." : "Couldn't load platform analytics."}</p>}
    {summary && <><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-5 text-center shadow-sm"><p className="hero-title text-3xl text-[#3a2f22]">{value}</p><p className="mt-1 text-xs text-[#3a2f22]/50">{label}</p></div>)}</div><SubscriberAnalytics data={data} ar={ar} /></>}
    <VisitorStatsCard lang={lang} />
  </div>;
}