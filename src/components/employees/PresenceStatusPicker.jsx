import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { setPresenceStatus } from "@/lib/store";
import { isOnLeaveToday } from "@/lib/leaveTypes";

export const PRESENCE_OPTIONS = [
  { key: "online", labelKey: "presenceOnline", dot: "bg-emerald-500" },
  { key: "away", labelKey: "presenceAway", dot: "bg-amber-500" },
  { key: "busy", labelKey: "presenceBusy", dot: "bg-red-500" },
  { key: "call", labelKey: "presenceInCall", dot: "bg-violet-500" },
];

// Lets the employee manually set their own presence status. Automatically
// overridden to "On Leave" (read-only) if they have an approved leave today.
export default function PresenceStatusPicker({ user }) {
  const { t } = useI18n();
  const { company } = useAuth();
  const onLeave = isOnLeaveToday(user);
  const current = PRESENCE_OPTIONS.find((o) => o.key === user.presenceStatus) || PRESENCE_OPTIONS[0];

  if (onLeave) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted text-xs font-body">
        <span className="w-2 h-2 rounded-full bg-sky-500" /> {t("onLeaveStatus")}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      <select
        value={current.key}
        onChange={(e) => setPresenceStatus(company.id, user.id, e.target.value)}
        className="px-2.5 py-1.5 rounded-full border border-border text-xs font-body bg-card"
      >
        {PRESENCE_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>{t(o.labelKey)}</option>
        ))}
      </select>
    </div>
  );
}