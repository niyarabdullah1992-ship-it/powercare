import React, { useEffect, useState } from "react";
import { FileSignature, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

export default function SigningStatusPanel({ companyId, user, lang }) {
  const [rows, setRows] = useState(null); const ar = lang === "ar";
  useEffect(() => { let active = true; const load = () => base44.functions.invoke("multiSign", { action: "list", companyId, sessionToken: getCompanyToken(companyId), userId: user.id, email: user.email || "" }).then((r) => active && setRows(r.data?.requests || [])).catch(() => active && setRows([])); load(); const timer = setInterval(load, 15000); return () => { active = false; clearInterval(timer); }; }, [companyId, user.id, user.email]);
  if (rows === null) return <div className="rounded-xl border border-border bg-card p-4"><Loader2 className="h-4 w-4 animate-spin text-accent" /></div>;
  const pending = rows.filter((r) => r.myStatus === "pending" || r.status === "pending").length;
  const signed = rows.filter((r) => r.status === "completed").length;
  const rejected = rows.filter((r) => r.status === "rejected").length;
  return <Link to="/app/signing" className="block rounded-xl border border-accent/25 bg-card p-3 shadow-sm hover:border-accent/50">
    <div className="flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-semibold"><FileSignature className="h-4 w-4 text-accent" />{ar ? "حالة التوقيعات" : "Signing status"}</p><span className="text-xs text-accent">{ar ? "فتح" : "Open"}</span></div>
    <div className="mt-3 grid grid-cols-3 gap-2 text-center"><span className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">{pending} {ar ? "معلق" : "Pending"}</span><span className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">{signed} {ar ? "موقّع" : "Signed"}</span><span className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{rejected} {ar ? "مرفوض" : "Rejected"}</span></div>
  </Link>;
}