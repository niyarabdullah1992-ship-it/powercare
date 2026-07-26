import React from "react";
import { Plus, X } from "lucide-react";

const EMPTY = { name: "", email: "", employeeId: null, role: "", stationId: null, signatureUrl: "", external: false };

export default function GroupSignerList({ ar, currentUser, employees, signers, setSigners, activeSigner, setActiveSigner }) {
  const update = (index, patch) => setSigners((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const choose = (index, value) => { const employee = employees.find((item) => item.email === value || item.name === value); update(index, employee ? { name: employee.name, email: employee.email || "", employeeId: employee.id || employee.employeeId, role: employee.role || "", stationId: employee.stationId || null, signatureUrl: employee.profile?.signatureUrl || "", external: false } : { name: value }); };
  const self = (signer) => signer.email.trim().toLowerCase() === String(currentUser.email || "").trim().toLowerCase();
  return <div className="space-y-2.5">
    <datalist id="group-team-signers">{employees.filter((employee) => employee.email).map((employee) => <option key={employee.id || employee.employeeId} value={employee.name}>{employee.email}</option>)}</datalist>
    {signers.map((signer, index) => <div key={index} onClick={() => setActiveSigner(index)} className={`relative rounded-xl border p-3 ${activeSigner === index ? "border-accent bg-accent/5 ring-1 ring-accent/30" : "border-border bg-card"}`}>
      <div className="mb-2 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{index + 1}</span><span className="text-[11px] font-bold">{ar ? `الموقّع ${index + 1}` : `Signer ${index + 1}`}</span>{signers.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); setSigners((rows) => rows.filter((_, rowIndex) => rowIndex !== index)); }} className="ms-auto rounded-md p-1 text-destructive"><X className="h-3.5 w-3.5" /></button>}</div>
      <div className="grid gap-2"><input readOnly={self(signer)} list={self(signer) ? undefined : "group-team-signers"} value={signer.name} onChange={(event) => choose(index, event.target.value)} placeholder={ar ? "اسم الموقّع" : "Signer name"} className="rounded-lg border border-input px-3 py-2 text-xs read-only:bg-muted" /><input readOnly={self(signer)} value={signer.email} onChange={(event) => update(index, { email: event.target.value })} placeholder={ar ? "البريد الإلكتروني" : "Email address"} dir="ltr" className="rounded-lg border border-input px-3 py-2 text-xs read-only:bg-muted" /></div>
    </div>)}
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setSigners((rows) => [...rows, { ...EMPTY }])} className="inline-flex items-center justify-center gap-1 rounded-lg border border-accent/30 px-2 py-2 text-[11px] font-bold text-accent"><Plus className="h-3.5 w-3.5" />{ar ? "موظف" : "Employee"}</button><button type="button" onClick={() => setSigners((rows) => [...rows, { ...EMPTY, external: true }])} className="inline-flex items-center justify-center gap-1 rounded-lg border border-accent/30 px-2 py-2 text-[11px] font-bold text-accent"><Plus className="h-3.5 w-3.5" />{ar ? "موقّع خارجي" : "External"}</button></div>
  </div>;
}