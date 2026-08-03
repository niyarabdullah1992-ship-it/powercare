import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, LockKeyhole, LogOut } from "lucide-react";
import { ALL_PLANS_CURRENTLY_FREE } from "@/lib/pricingPolicy";

export default function TrialExpiryGate({ company, children }) {
  const [access, setAccess] = useState(null);
  const [checkedCompanyId, setCheckedCompanyId] = useState(null);
  useEffect(() => {
    if (!company?.id) return;
    let active = true;
    setAccess(null);
    setCheckedCompanyId(null);
    base44.functions.invoke("companyDirectory", { action: "accountExists", companyId: company.id })
      .then((res) => { if (active) { setAccess(res.data); setCheckedCompanyId(company.id); } })
      .catch(() => { if (active) { setAccess({ exists: true }); setCheckedCompanyId(company.id); } });
    return () => { active = false; };
  }, [company?.id]);
  if (company?.id && (access === null || checkedCompanyId !== company.id)) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  if (access?.frozen) return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-elevated"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"><LockKeyhole className="h-8 w-8 text-muted-foreground" /></span><h1 className="mt-5 font-heading text-3xl font-semibold">تم إيقاف الوصول مؤقتًا</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">تم تجميد اشتراك هذه الشركة مؤقتًا. {access.frozenReason || "يرجى التواصل مع دعم NiroVera لمزيد من المعلومات."}</p><button onClick={() => { localStorage.removeItem("powercare_session"); window.location.href = "/"; }} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"><LogOut className="h-4 w-4" />العودة إلى الصفحة الرئيسية</button></div></div>;
  if (ALL_PLANS_CURRENTLY_FREE || access?.subscriptionExempt || company?.subscriptionExempt || !company?.subscriptionEnd) return children;
  const rawEnd = String(company.subscriptionEnd);
  const expiresAt = new Date(/^\d{4}-\d{2}-\d{2}$/.test(rawEnd) ? `${rawEnd}T23:59:59.999` : rawEnd).getTime();
  if (Number.isFinite(expiresAt) && Date.now() > expiresAt) return <Navigate to="/pricing?expired=1" replace />;
  return children;
}