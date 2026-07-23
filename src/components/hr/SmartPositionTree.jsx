import React, { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import SmartPositionModal from "@/components/hr/SmartPositionModal";
import SmartRankLane from "@/components/hr/SmartRankLane";
import { canManageEmployees, hasHRPermission, isCompanyOwner } from "@/lib/permissions";

const RANKS = ["executive", "manager", "supervisor", "employee"];

export default function SmartPositionTree({ data, company, currentUser, lang }) {
  const ar = lang === "ar";
  const [editing, setEditing] = useState(undefined);
  const positions = data.smartPositions || [];
  const rows = useMemo(() => positions.map((position) => ({ position, employee: data.employees.find((employee) => employee.id === position.employeeId) })).filter((item) => item.employee).sort((a, b) => b.position.score - a.position.score), [positions, data.employees]);
  const canManage = isCompanyOwner(currentUser, data) || canManageEmployees(currentUser) || hasHRPermission(currentUser, data, "manage_employees");
  return <section className="overflow-hidden rounded-xl border border-accent/30 bg-card shadow-sm" dir={ar ? "rtl" : "ltr"}><header className="flex flex-wrap items-center justify-between gap-3 border-b border-accent/20 bg-primary px-4 py-4 text-primary-foreground"><div className="flex items-center gap-3"><span className="rounded-lg bg-accent/15 p-2"><Sparkles className="h-5 w-5 text-accent" /></span><div><h2 className="font-heading text-xl font-semibold">{ar ? "شجرة الصلاحيات الذكية" : "Smart authority tree"}</h2><p className="text-[11px] text-primary-foreground/70">{ar ? "ترتيب تلقائي حسب قوة ونطاق الصلاحيات" : "Automatically ranked by permission strength and scope"}</p></div></div>{canManage && <button onClick={() => setEditing(null)} className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"><Plus className="h-4 w-4" />{ar ? "إضافة موظف" : "Add employee"}</button>}</header>
  <div className="overflow-auto p-5 md:p-7">{rows.length ? <div className="mx-auto min-w-max">{RANKS.map((rank) => <SmartRankLane key={rank} rank={rank} items={rows.filter((item) => item.position.rank === rank)} ar={ar} onEdit={setEditing} />)}</div> : <div className="py-10 text-center"><Sparkles className="mx-auto h-7 w-7 text-accent" /><p className="mt-3 text-sm font-semibold">{ar ? "لم تتم إضافة موظفين للشجرة بعد" : "No employees added to the tree yet"}</p></div>}</div>
  {editing !== undefined && <SmartPositionModal companyId={company.id} employees={data.employees || []} positions={positions} initial={editing} lang={lang} readOnly={!canManage} onClose={() => setEditing(undefined)} />}</section>;
}