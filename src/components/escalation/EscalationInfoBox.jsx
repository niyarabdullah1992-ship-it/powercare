import React from "react";
import { Info } from "lucide-react";

// Short, always-visible explainer reused wherever an escalation chain is shown
// (Anonymous/Public Complaints, task-rejection disputes) so the concept only
// needs to be explained once, in the same words, everywhere.
export default function EscalationInfoBox({ t }) {
  return (
    <div className="p-3.5 rounded-xl border border-accent/30 bg-accent/5 flex items-start gap-2.5">
      <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium font-body text-accent">{t("escalationInfoTitle")}</p>
        <p className="text-xs text-muted-foreground font-body mt-0.5">{t("escalationInfoText")}</p>
      </div>
    </div>
  );
}