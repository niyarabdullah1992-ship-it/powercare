import React, { useEffect, useMemo, useState } from "react";
import { ArrowUp, Plus, Trash2 } from "lucide-react";
import { updateCompany } from "@/lib/store";
import { sortComplaintChainByTree } from "@/lib/escalation";

export default function ComplaintEscalationEditor({ data, companyId, canManage, lang }) {
  const ar = lang === "ar";
  const eligible = useMemo(() => (data.orgTree || []).filter((node) => node.type === "employee").map((node) => {
    const access = (data.smartPositions || []).find((position) => position.employeeId === node.refId);
    return { employeeId: node.refId, title: node.title, permissions: access?.permissions || {}, employee: data.employees.find((employee) => employee.id === node.refId) };
  }).filter((item) => item.employee && item.permissions.complaints === "manage"), [data.orgTree, data.smartPositions, data.employees]);
  const [chain, setChain] = useState(data.complaintEscalationChain || []);
  const [selected, setSelected] = useState("");
  const ordered = useMemo(() => sortComplaintChainByTree(chain, data), [chain, data.orgTree]);
  useEffect(() => setChain((data.complaintEscalationChain || []).filter((id) => eligible.some((person) => person.employeeId === id))), [data.complaintEscalationChain, eligible]);
  const rows = ordered.map((id) => eligible.find((person) => person.employeeId === id)).filter(Boolean);
  const displayRows = [...rows].reverse();
  const available = eligible.filter((person) => !chain.includes(person.employeeId));
  const add = () => { if (selected) { setChain([...chain, selected]); setSelected(""); } };
  const save = () => updateCompany(companyId, (draft) => {
    draft.complaintEscalationChain = ordered;
    [...(draft.anonymousReports || []), ...(draft.publicReports || [])].filter((report) => report.status === "open").forEach((report) => { report.escalationLevel = Math.min(report.escalationLevel || 0, ordered.length - 1); });
  });
  return <section className="rounded-xl border border-accent/30 bg-card p-4" dir={ar ? "rtl" : "ltr"}><div><h3 className="font-heading text-lg font-semibold">{ar ? "مسار تصعيد الشكاوى" : "Complaint escalation path"}</h3><p className="text-xs text-muted-foreground">{ar ? "اختر الأشخاص؛ يبدأ التصعيد من الشخص الأدنى في الشجرة ثم يصعد تلقائيًا إلى من فوقه." : "Choose the people; escalation starts with the lowest person in the tree and automatically moves upward."}</p></div>
    <div className="mt-4 space-y-1">{displayRows.map((row, index) => <React.Fragment key={row.employeeId}><div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">{rows.length - index}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{row.employee.name}</span><span className="block truncate text-[10px] text-muted-foreground">{row.title}</span></span>{canManage && <button type="button" onClick={() => setChain(chain.filter((id) => id !== row.employeeId))} className="p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>}</div>{index < displayRows.length - 1 && <ArrowUp className="mx-auto h-4 w-4 text-accent" />}</React.Fragment>)}{!displayRows.length && <p className="py-3 text-center text-xs text-muted-foreground">{ar ? "لم يتم اختيار أشخاص للتصعيد" : "No escalation people selected"}</p>}</div>
    {canManage && <div className="mt-4 flex flex-wrap gap-2"><select value={selected} onChange={(event) => setSelected(event.target.value)} className="min-w-56 flex-1 rounded-md border px-3 py-2 text-sm"><option value="">{ar ? "اختر شخصًا من الشجرة" : "Choose a person from the tree"}</option>{available.map((person) => <option key={person.employeeId} value={person.employeeId}>{person.employee.name} — {person.title}</option>)}</select><button type="button" onClick={add} disabled={!selected} className="flex items-center gap-1 rounded-md border px-3 py-2 text-xs disabled:opacity-40"><Plus className="h-4 w-4" />{ar ? "اختيار" : "Select"}</button><button type="button" onClick={save} disabled={!ordered.length} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">{ar ? "حفظ المسار" : "Save path"}</button></div>}
  </section>;
}