import React, { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProductFeedbackDashboard({ ar, companies = [] }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { base44.entities.ProductFeedback.list("-created_date", 200).then(setRows); }, []);
  const names = useMemo(() => Object.fromEntries(companies.map((company) => [company.id, company.name])), [companies]);
  if (!rows) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-landing-gold" /></div>;
  const average = rows.length ? (rows.reduce((sum, row) => sum + row.rating, 0) / rows.length).toFixed(1) : "—";
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs text-[#3a2f22]/50">{ar ? "إجمالي التقييمات" : "Total feedback"}</p><p className="mt-2 text-3xl font-bold text-[#3a2f22]">{rows.length}</p></div><div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs text-[#3a2f22]/50">{ar ? "متوسط التقييم" : "Average rating"}</p><p className="mt-2 flex items-center gap-2 text-3xl font-bold text-[#3a2f22]">{average}<Star className="h-6 w-6 fill-landing-gold text-landing-gold" /></p></div></div>
    <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-[#3a2f22]"><MessageSquare className="h-5 w-5 text-landing-gold" />{ar ? "اقتراحات المستخدمين" : "User suggestions"}</h2>{rows.length === 0 ? <p className="py-12 text-center text-sm text-[#3a2f22]/45">{ar ? "لا توجد اقتراحات بعد." : "No suggestions yet."}</p> : <div className="mt-5 space-y-3">{rows.map((row) => <article key={row.id} className="rounded-xl bg-landing-bg p-4"><div className="flex flex-wrap items-center gap-2 text-xs text-[#3a2f22]/50"><span className="font-bold text-landing-gold">{row.rating}/5</span><span>{names[row.companyId] || row.companyId}</span><span>·</span><span>{row.role || (ar ? "زائر" : "Visitor")}</span><span>·</span><span>{row.page}</span><span className="ms-auto">{new Date(row.created_date).toLocaleString(ar ? "ar-SA" : "en-GB")}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#3a2f22]">{row.message}</p></article>)}</div>}</section>
  </div>;
}