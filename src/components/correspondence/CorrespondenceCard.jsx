import React, { useState } from "react";
import { ArrowRightLeft, Stamp, AlertTriangle, Clock } from "lucide-react";
import { directionLabel, statusLabel, slaState } from "@/lib/correspondence";

const SLA_STYLE = {
  breached: "bg-destructive/10 text-destructive",
  atRisk: "bg-amber-500/10 text-amber-600",
  onTime: "bg-accent/10 text-accent-text",
  none: "bg-muted text-muted-foreground",
};

export default function CorrespondenceCard({ record, employees, lang, onRefer, onClose }) {
  const ar = lang === "ar";
  const [referTo, setReferTo] = useState("");
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState("");
  const sla = slaState(record);

  const slaText = { breached: ar ? "تجاوزت المهلة" : "SLA breached", atRisk: ar ? "قرب التجاوز" : "Due soon", onTime: ar ? "ضمن المهلة" : "On time", none: ar ? "بلا مهلة" : "No SLA" }[sla];

  const submitRefer = () => {
    const employee = employees.find((item) => item.id === referTo);
    if (!employee) return;
    onRefer(record.id, { toEmployeeId: employee.id, toName: employee.name, note });
    setReferTo(""); setNote("");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-primary px-2 py-1 font-mono text-xs text-primary-foreground">{record.number}</span>
        <span className="text-xs text-muted-foreground">{directionLabel(record.direction, ar)}</span>
        <span className={`rounded-md px-2 py-1 text-xs font-medium ${SLA_STYLE[sla]}`}>
          {sla === "breached" ? <AlertTriangle className="me-1 inline h-3 w-3" /> : <Clock className="me-1 inline h-3 w-3" />}{slaText}
        </span>
        <span className="ms-auto text-xs text-muted-foreground">{statusLabel(record.status, ar)}</span>
      </div>

      <div>
        <p className="font-heading text-base font-semibold">{record.subject}</p>
        {record.counterparty && <p className="text-xs text-muted-foreground">{ar ? "الجهة:" : "Counterparty:"} {record.counterparty}</p>}
        {record.summary && <p className="mt-1 text-sm">{record.summary}</p>}
      </div>

      {record.referrals.length > 0 && (
        <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{ar ? "سلسلة الإحالات" : "Referral chain"}</p>
          {record.referrals.map((referral, index) => (
            <p key={index} className="text-xs">
              <ArrowRightLeft className="me-1 inline h-3 w-3 text-accent" />
              {referral.byName} → {referral.toName}{referral.note ? ` — ${referral.note}` : ""}
            </p>
          ))}
        </div>
      )}

      {record.decision ? (
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-accent-text"><Stamp className="h-3.5 w-3.5" />{ar ? "قرار مختوم" : "Sealed decision"}</p>
          <p className="mt-1 text-sm">{record.decision.text}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{record.decision.byName} · {new Date(record.decision.at).toLocaleString(lang)}</p>
        </div>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border p-2">
            <p className="text-xs font-medium">{ar ? "إحالة" : "Refer"}</p>
            <select value={referTo} onChange={(e) => setReferTo(e.target.value)} className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm">
              <option value="">{ar ? "اختر الموظف" : "Select employee"}</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={ar ? "ملاحظة الإحالة" : "Referral note"} className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm" />
            <button onClick={submitRefer} disabled={!referTo} className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-50">{ar ? "إحالة" : "Refer"}</button>
          </div>
          <div className="space-y-2 rounded-lg border border-border p-2">
            <p className="text-xs font-medium">{ar ? "ختم القرار وإغلاق" : "Seal decision & close"}</p>
            <textarea value={decision} onChange={(e) => setDecision(e.target.value)} rows={2} placeholder={ar ? "نص القرار" : "Decision text"} className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm" />
            <button onClick={() => decision.trim() && onClose(record.id, decision.trim())} disabled={!decision.trim()} className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">{ar ? "ختم وإغلاق" : "Seal & close"}</button>
          </div>
        </div>
      )}
    </div>
  );
}