import React, { useEffect, useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import SmartDepartmentGrid from "@/components/hr/SmartDepartmentGrid";
import { rankFromScore, rankLabel, saveSmartPosition, scorePermissions, suggestSmartTitle } from "@/lib/smartPositions";

export default function SmartPositionModal({ companyId, employees, positions, initial, lang, onClose, readOnly = false }) {
  const ar = lang === "ar";
  const [employeeId, setEmployeeId] = useState(initial?.employeeId || "");
  const [permissions, setPermissions] = useState(initial?.permissions || {});
  const [title, setTitle] = useState(initial?.title || "");
  const [manual, setManual] = useState(initial?.titleManual === true);
  const score = scorePermissions(permissions);
  const suggestion = useMemo(() => suggestSmartTitle(permissions, ar), [permissions, ar]);
  useEffect(() => { if (!manual) setTitle(suggestion); }, [suggestion, manual]);
  const chooseEmployee = (id) => { const saved = positions.find((item) => item.employeeId === id); setEmployeeId(id); setPermissions(saved?.permissions || {}); setTitle(saved?.title || ""); setManual(saved?.titleManual === true); };
  const submit = (event) => { event.preventDefault(); if (readOnly || !employeeId || !title.trim() || score < 1) return; saveSmartPosition(companyId, employeeId, title.trim(), permissions, manual); onClose(); };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 p-4" onClick={onClose}><form onSubmit={submit} onClick={(event) => event.stopPropagation()} dir={ar ? "rtl" : "ltr"} className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-auto rounded-xl border border-accent/40 bg-card p-5 shadow-elevated"><div className="flex items-start justify-between"><div><h3 className="font-heading text-2xl font-semibold">{initial ? (ar ? "تعديل المنصب الذكي" : "Edit smart position") : (ar ? "إضافة موظف للشجرة" : "Add employee to tree")}</h3><p className="text-xs text-muted-foreground">{ar ? "حدد الأقسام ومستوى الوصول لكل قسم" : "Choose departments and access level"}</p></div><button type="button" onClick={onClose} className="rounded-md p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div>
  <select value={employeeId} disabled={!!initial} onChange={(event) => chooseEmployee(event.target.value)} required className="w-full rounded-md border border-input px-3 py-2 text-sm"><option value="">{ar ? "اختر الموظف" : "Select employee"}</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select>
  <SmartDepartmentGrid permissions={permissions} onChange={setPermissions} ar={ar} disabled={readOnly} />
  <div className="rounded-lg border border-accent/30 bg-accent/5 p-3"><div className="mb-2 flex items-center justify-between text-xs"><span>{ar ? "النقاط والمستوى" : "Score and rank"}</span><strong>{score} · {rankLabel(rankFromScore(score), ar)}</strong></div><label className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-accent"><Sparkles className="h-3 w-3" />{ar ? "مقترح بالذكاء الاصطناعي" : "AI suggested"}</label><input value={title} disabled={readOnly} onChange={(event) => { setTitle(event.target.value); setManual(true); }} placeholder={suggestion} required className="w-full rounded-md border border-input px-3 py-2 text-sm" /></div>
  {readOnly ? <button type="button" onClick={onClose} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{ar ? "إغلاق" : "Close"}</button> : <button type="submit" disabled={!employeeId || score < 1} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-40">{ar ? "حفظ وإعادة ترتيب الشجرة" : "Save and reorder tree"}</button>}</form></div>;
}