import React, { useState } from "react";
import { Plus, X, AlertTriangle, BadgeCheck, History } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormat";
import ApprovalHistory from "@/components/safety/ApprovalHistory";
import StationSafetyLog from "@/components/safety/StationSafetyLog";
import { canSetSafetyLevelSafe } from "@/lib/safetyLogic";

const LEVELS = [
  { val: "green", ar: "آمنة", en: "Safe", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { val: "amber", ar: "تحت المراقبة", en: "Watch", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  { val: "red", ar: "حرجة", en: "Critical", cls: "bg-red-100 text-red-700 border-red-300" },
];

// Data-entry card for one station's safety record: level, inspection date, hazards,
// incident logging — then management approval, which the HSE reports are built on.
export default function StationSafetyCard({ station, rec, canEdit, canApprove, approvalIssues = [], lang, onUpdate, onCloseHazard, onApprove, onIncident }) {
  const ar = lang === "ar";
  const [hazard, setHazard] = useState("");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [showIncident, setShowIncident] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const hazards = rec?.hazards || [];
  const approved = !!rec?.approvedBy;
  // "Safe" requires all hazards closed and a valid inspection after the latest incident.
  const safeBlocked = !canSetSafetyLevelSafe(rec);
  const incidentToday = !!rec?.lastIncidentAt && new Date(rec.lastIncidentAt).toDateString() === new Date().toDateString();

  const addHazard = () => {
    if (!hazard.trim()) return;
    onUpdate({ hazards: [...hazards, hazard.trim()] });
    setHazard("");
  };

  const submitIncident = () => {
    const desc = incidentDesc.trim();
    if (!desc) return; // a description is required — prevents empty duplicate entries
    onIncident(desc);
    setIncidentDesc("");
    setShowIncident(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm h-full flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-body font-semibold text-sm truncate">{station.name}</h3>
        {approved ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border bg-emerald-100 text-emerald-700 border-emerald-300 shrink-0">
            <BadgeCheck className="w-3 h-3" /> {ar ? "معتمد" : "Approved"}
          </span>
        ) : (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] border bg-amber-100 text-amber-700 border-amber-300 shrink-0">
            {ar ? "بانتظار الاعتماد" : "Pending approval"}
          </span>
        )}
      </div>

      {/* Safety level */}
      <div>
        <p className="text-[11px] text-muted-foreground font-body mb-1.5">{ar ? "مستوى السلامة" : "Safety level"}</p>
        <div className="flex items-center gap-1.5">
          {LEVELS.map((l) => {
            const blocked = l.val === "green" && safeBlocked;
            return (
              <button
                key={l.val}
                disabled={!canEdit || blocked}
                title={blocked ? (ar ? "يتطلب اختيار «آمنة» إغلاق المخاطر وإجراء تفتيش صالح بعد آخر حادثة" : "Safe requires closed hazards and a valid inspection after the latest incident") : undefined}
                onClick={() => onUpdate({ level: l.val })}
                className={`px-3 py-1 rounded-full text-[11px] font-body border transition ${
                  rec?.level === l.val ? l.cls : "border-border text-muted-foreground hover:bg-muted"
                } disabled:cursor-not-allowed ${blocked ? "opacity-50" : ""}`}
              >
                {ar ? l.ar : l.en}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-red-600 font-semibold font-body mt-1.5">
          {ar
            ? "يُقفل خيار «آمنة» حتى إغلاق جميع المخاطر وإجراء تفتيش صالح بعد آخر حادثة."
            : "Safe stays locked until all hazards are closed and a valid inspection follows the latest incident."}
        </p>
        {rec?.lastIncidentAt && (
          <p className={`text-[10px] font-body mt-1 ${incidentToday ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
            {incidentToday
              ? (ar ? "⚠ سُجّلت حادثة اليوم في هذه المحطة — " : "⚠ An incident was logged today at this station — ")
              : (ar ? "آخر حادثة: " : "Last incident: ")}
            {formatDateTime(rec.lastIncidentAt, lang)}
          </p>
        )}
      </div>

      {/* Last inspection */}
      <div>
        <p className="text-[11px] text-muted-foreground font-body mb-1.5">{ar ? "تاريخ آخر تفتيش" : "Last inspection date"}</p>
        <input
          type="date"
          disabled={!canEdit}
          value={rec?.lastInspection ? String(rec.lastInspection).slice(0, 10) : ""}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onUpdate({ lastInspection: e.target.value ? new Date(e.target.value).toISOString() : null })}
          className="px-2.5 py-1.5 rounded-md border border-input bg-background text-xs font-body"
        />
      </div>

      {/* Hazards */}
      <div>
        <p className="text-[11px] text-muted-foreground font-body mb-1.5">{ar ? "المخاطر المرصودة" : "Open hazards"}</p>
        <div className="space-y-1.5">
          {hazards.map((h, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="flex-1 text-xs font-body">{h}</span>
              {canEdit && (
                <button onClick={() => onCloseHazard(i)} title={ar ? "إغلاق الخطر وحفظه في السجل" : "Close hazard and keep it in the record"} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {hazards.length === 0 && <p className="text-xs text-muted-foreground font-body">{ar ? "لا توجد مخاطر مفتوحة" : "No open hazards"}</p>}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 mt-2">
            <input
              value={hazard}
              onChange={(e) => setHazard(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHazard()}
              placeholder={ar ? "إضافة خطر…" : "Add hazard…"}
              className="flex-1 px-2.5 py-1.5 rounded-md border border-input bg-background text-xs font-body focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={addHazard} className="p-1.5 rounded-md border border-border hover:bg-muted"><Plus className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* Incident logging */}
      {canEdit && (
        showIncident ? (
          <div className="space-y-2">
            <input
              value={incidentDesc}
              onChange={(e) => setIncidentDesc(e.target.value)}
              placeholder={ar ? "وصف الحادث…" : "Incident description…"}
              autoFocus
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-xs font-body focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center gap-2">
              <button onClick={submitIncident} disabled={!incidentDesc.trim()} className="flex-1 py-1.5 rounded-md bg-red-600 text-white text-xs font-body font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                {ar ? "تسجيل الحادث" : "Log incident"}
              </button>
              <button onClick={() => setShowIncident(false)} className="px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                {ar ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowIncident(true)} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-red-200 text-red-600 text-xs font-body hover:bg-red-50">
            <AlertTriangle className="w-3.5 h-3.5" /> {ar ? "تسجيل حادث سلامة" : "Log safety incident"}
          </button>
        )
      )}

      {/* Approval — pinned to the card bottom so all cards align */}
      <div className="pt-3 border-t border-border/60 mt-auto space-y-2">
        <button
          type="button"
          onClick={() => setShowLog(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-border text-xs font-body text-muted-foreground hover:bg-muted hover:text-foreground transition"
        >
          <History className="w-3.5 h-3.5" />
          {ar ? `سجل المحطة (${(rec?.approvalLog?.length || 0) + (rec?.incidentLog?.length || 0)})` : `Station record (${(rec?.approvalLog?.length || 0) + (rec?.incidentLog?.length || 0)})`}
        </button>
        <ApprovalHistory log={rec?.approvalLog} lang={lang} />
        {approved ? (
          <p className="text-[11px] text-muted-foreground font-body">
            {ar ? "اعتمده" : "Approved by"} <span className="font-semibold text-foreground">{rec.approvedBy}</span>
            {rec.approvedAt ? ` — ${formatDateTime(rec.approvedAt, lang)}` : ""}
          </p>
        ) : canApprove ? (
          <div className="space-y-1.5">
            {approvalIssues.length > 0 && <p className="text-[10px] text-red-600 font-body">{approvalIssues[0]}</p>}
            <button disabled={approvalIssues.length > 0} onClick={onApprove} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-foreground text-background text-xs font-body font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              <BadgeCheck className="w-3.5 h-3.5" /> {ar ? "اعتماد بيانات السلامة" : "Approve safety data"}
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground font-body">{ar ? "بانتظار اعتماد الإدارة" : "Awaiting management approval"}</p>
        )}
      </div>

      {showLog && <StationSafetyLog station={station} rec={rec} lang={lang} onClose={() => setShowLog(false)} />}
    </div>
  );
}