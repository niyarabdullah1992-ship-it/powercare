import React, { useState } from "react";
import { Plus, AlertTriangle, History } from "lucide-react";
import FlowSwipeAction from "@/components/flow/FlowSwipeAction";
import ApprovalHistory from "@/components/safety/ApprovalHistory";
import SafetyApprovalControl from "@/components/safety/SafetyApprovalControl";
import StationSafetyLog from "@/components/safety/StationSafetyLog";
import { canSetSafetyLevelSafe } from "@/lib/safetyLogic";
import { HIERARCHY_OF_CONTROLS, checkHazardCloseGate } from "@/lib/hseDerivations";
import { toast } from "@/components/ui/use-toast";

const LEVELS = [
  ["green", "آمنة", "Safe", "bg-emerald-100 text-emerald-700 border-emerald-300"],
  ["amber", "تحت المراقبة", "Watch", "bg-amber-100 text-amber-700 border-amber-300"],
  ["red", "حرجة", "Critical", "bg-red-100 text-red-700 border-red-300"],
];

function hazardLabel(h) {
  return typeof h === "string" ? h : h?.description || h?.title || String(h);
}

export default function SafetyOverviewTab({
  station, rec, canEdit, canApprove, approvalIssues, lang,
  onUpdate, onCloseHazard, onApprove, onRevokeApproval, onIncident,
}) {
  const ar = lang === "ar";
  const L = (a, e) => (ar ? a : e);
  const [hazard, setHazard] = useState("");
  const [incident, setIncident] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [closingIdx, setClosingIdx] = useState(null);
  const [controlId, setControlId] = useState("eng");
  const [beforeOk, setBeforeOk] = useState(false);
  const [afterOk, setAfterOk] = useState(false);

  const addHazard = () => {
    if (!hazard.trim()) return;
    onUpdate({ hazards: [...(rec?.hazards || []), hazard.trim()] });
    setHazard("");
  };

  const attemptClose = (i) => {
    setClosingIdx(i);
    setControlId("eng");
    setBeforeOk(false);
    setAfterOk(false);
  };

  const confirmClose = () => {
    if (closingIdx == null) return;
    const gate = checkHazardCloseGate({
      controlId,
      likelihood: 3,
      severity: 3,
      beforePhoto: beforeOk ? { stamped: true, at: new Date().toISOString() } : null,
      afterPhoto: afterOk ? { stamped: true, at: new Date().toISOString() } : null,
    });
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : (gate.reasonEn || gate.reason), variant: "destructive" });
      return;
    }
    const result = onCloseHazard(closingIdx, {
      controlId,
      beforePhoto: { stamped: true, at: new Date().toISOString() },
      afterPhoto: { stamped: true, at: new Date().toISOString() },
      likelihood: 3,
      severity: 3,
    });
    if (result && result.ok === false) {
      toast({ description: ar ? result.reason : (result.reasonEn || result.reason), variant: "destructive" });
      return;
    }
    setClosingIdx(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[11px] text-muted-foreground">{L("مستوى السلامة", "Safety level")}</p>
        <div className="flex gap-1.5">
          {LEVELS.map(([v, a, e, c]) => (
            <button
              key={v}
              disabled={!canEdit || (v === "green" && !canSetSafetyLevelSafe(rec))}
              onClick={() => onUpdate({ level: v })}
              className={`rounded-full border px-3 py-1 text-[11px] ${rec?.level === v ? c : "border-border text-muted-foreground"} disabled:opacity-40`}
            >
              {ar ? a : e}
            </button>
          ))}
        </div>
      </div>

      <label className="block text-[11px] text-muted-foreground">
        {L("آخر تفتيش", "Last inspection")}
        <input
          type="date"
          disabled={!canEdit}
          max={new Date().toISOString().slice(0, 10)}
          value={rec?.lastInspection ? String(rec.lastInspection).slice(0, 10) : ""}
          onChange={(e) => onUpdate({ lastInspection: e.target.value ? new Date(e.target.value).toISOString() : null })}
          className="mt-1 block rounded-md border border-input px-2 py-1.5 text-xs"
        />
      </label>

      <div>
        <p className="mb-1.5 text-[11px] text-muted-foreground">{L("المخاطر المفتوحة", "Open hazards")}</p>
        {(rec?.hazards || []).map((h, i) => (
          <div key={i} className="mb-1 flex items-center gap-2 rounded-md bg-muted px-2 py-1.5 text-xs">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            <span className="flex-1">{hazardLabel(h)}</span>
            {canEdit && (
              <div className="w-36">
                <FlowSwipeAction
                  sensitive
                  label={L("اسحب للإغلاق", "Swipe to close")}
                  onAction={() => attemptClose(i)}
                  confirmLabel={L("تأكيد", "Confirm")}
                  cancelLabel={L("إلغاء", "Cancel")}
                />
              </div>
            )}
          </div>
        ))}
        {canEdit && (
          <div className="mt-2 flex gap-2">
            <input value={hazard} onChange={(e) => setHazard(e.target.value)} placeholder={L("إضافة خطر", "Add hazard")} className="min-w-0 flex-1 rounded-md border border-input px-2 py-1.5 text-xs" />
            <button onClick={addHazard} className="rounded-md border p-2"><Plus className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>

      {closingIdx != null && (
        <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
          <p className="font-medium">{L("إغلاق بضابط وإثبات مصوّر", "Close with control + photo proof")}</p>
          <select value={controlId} onChange={(e) => setControlId(e.target.value)} className="w-full rounded-md border border-input px-2 py-1.5">
            {HIERARCHY_OF_CONTROLS.map((c) => (
              <option key={c.id} value={c.id}>{ar ? c.ar : c.en}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setBeforeOk(true)} className={`rounded-md border px-2 py-1 ${beforeOk ? "border-emerald-400 text-emerald-700" : ""}`}>
              {beforeOk ? L("قبل ✓", "Before ✓") : L("التقط قبل", "Capture before")}
            </button>
            <button type="button" onClick={() => setAfterOk(true)} className={`rounded-md border px-2 py-1 ${afterOk ? "border-emerald-400 text-emerald-700" : ""}`}>
              {afterOk ? L("بعد ✓", "After ✓") : L("التقط بعد", "Capture after")}
            </button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={confirmClose} className="rounded-md bg-foreground px-3 py-1.5 text-background">{L("أغلق", "Close")}</button>
            <button type="button" onClick={() => setClosingIdx(null)} className="rounded-md border px-3 py-1.5">{L("إلغاء", "Cancel")}</button>
          </div>
        </div>
      )}

      {canEdit && (
        <div className="flex gap-2">
          <input value={incident} onChange={(e) => setIncident(e.target.value)} placeholder={L("وصف حادث السلامة", "Safety incident description")} className="min-w-0 flex-1 rounded-md border border-input px-2 py-1.5 text-xs" />
          <button disabled={!incident.trim()} onClick={() => { onIncident(incident.trim()); setIncident(""); }} className="rounded-md border border-red-200 px-3 text-xs text-red-600 disabled:opacity-40">
            {L("تسجيل حادث", "Log incident")}
          </button>
        </div>
      )}

      <div className="space-y-2 border-t pt-3">
        <button onClick={() => setShowLog(true)} className="flex w-full items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs text-muted-foreground">
          <History className="h-3.5 w-3.5" />{L("سجل المحطة", "Station record")}
        </button>
        <ApprovalHistory log={rec?.approvalLog} lang={lang} />
        <SafetyApprovalControl rec={rec} canApprove={canApprove} approvalIssues={approvalIssues} lang={lang} onApprove={onApprove} onRevoke={onRevokeApproval} />
      </div>
      {showLog && <StationSafetyLog station={station} rec={rec} lang={lang} onClose={() => setShowLog(false)} />}
    </div>
  );
}
