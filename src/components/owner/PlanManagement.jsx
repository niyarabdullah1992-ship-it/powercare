import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PlanForm from "@/components/owner/PlanForm";
import PlanCard from "@/components/owner/PlanCard";
import { normalizePlanConfig } from "@/lib/subscriptionPlans";

const emptyPlan = normalizePlanConfig({ slug: "", nameAr: "", nameEn: "", monthlyPrice: 0, yearlyPrice: 0, currency: "USD", featuresAr: [], featuresEn: [], active: true, freeNow: true, sortOrder: 99 });
export default function PlanManagement({ ar }) {
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = () => base44.entities.SubscriptionPlan.list("sortOrder", 50).then((items) => setPlans(items.map(normalizePlanConfig)));
  useEffect(() => { load(); }, []);
  const save = async (event) => { event.preventDefault(); const { id, created_date, updated_date, created_by_id, created_by, ...payload } = editing; id ? await base44.entities.SubscriptionPlan.update(id, payload) : await base44.entities.SubscriptionPlan.create(payload); setEditing(null); load(); };
  const remove = async (plan) => { if (!window.confirm(ar ? `حذف باقة ${plan.nameAr}؟` : `Delete ${plan.nameEn}?`)) return; await base44.entities.SubscriptionPlan.delete(plan.id); load(); };
  const toggle = async (plan) => { await base44.entities.SubscriptionPlan.update(plan.id, { active: !plan.active }); load(); };
  return <div className="space-y-5">
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-soft"><div><p className="text-xs font-semibold uppercase tracking-widest text-accent">{ar ? "كتالوج الاشتراكات" : "Subscription catalog"}</p><h1 className="mt-1 font-heading text-2xl font-semibold">{ar ? "باقات NiroVera" : "NiroVera plans"}</h1></div><button onClick={() => setEditing({ ...emptyPlan })} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />{ar ? "إنشاء باقة" : "Create plan"}</button></div>
    {editing && <PlanForm value={editing} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)} ar={ar} />}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} ar={ar} onEdit={() => setEditing({ ...plan })} onToggle={() => toggle(plan)} onDelete={() => remove(plan)} />)}</div>
  </div>;
}