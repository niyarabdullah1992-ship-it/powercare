import React, { useEffect, useState } from "react";
import { updateCompany } from "@/lib/store";
import { deriveDailyTaskQuota } from "@/lib/dailyTaskQuota";
import { ACCENT, MUTED, NAVY, field, ui } from "@/lib/platformStyles";

export default function DailyTaskQuotaCard({
  ar,
  tasks,
  data,
  companyId,
  stationId,
  canEdit,
  onSaved,
}) {
  const derived = deriveDailyTaskQuota({ tasks, data, stationId });
  const [draft, setDraft] = useState(derived.quota || "");
  const [hint, setHint] = useState("");

  useEffect(() => {
    setDraft(derived.quota || "");
  }, [derived.quota]);

  const save = () => {
    const n = Math.max(0, Math.round(Number(draft) || 0));
    if (!companyId) return;
    updateCompany(companyId, (d) => {
      d.settings = { ...(d.settings || {}), dailyTaskQuota: n };
    }, { sync: "none" });
    setHint(ar ? "حُفظت — كل يوم وحده." : "Saved — each day stands alone.");
    onSaved?.();
  };

  return (
    <div
      title={ar
        ? "كل يوم بيومه — ما لا يُنجز اليوم لا يُرحَّل للغد."
        : "Each day stands alone — today's shortfall does not roll to tomorrow."}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        maxWidth: 420,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: NAVY }}>
          {ar ? "حصة اليوم" : "Today's quota"}
        </div>
        <div style={{ fontSize: 11, color: derived.quota ? (derived.met ? ACCENT : MUTED) : MUTED, marginTop: 2 }}>
          {derived.quota > 0
            ? (ar
              ? `${derived.done} / ${derived.quota}${derived.met ? " — أُغلق اليوم" : ` — متبقّي ${derived.remaining}`}`
              : `${derived.done} / ${derived.quota}${derived.met ? " — day met" : ` — ${derived.remaining} left`}`)
            : (ar ? "لم تُثبَّت بعد" : "Not set yet")}
        </div>
      </div>
      {canEdit ? (
        <>
          <input
            type="number"
            min={0}
            max={999}
            aria-label={ar ? "تثبيت العدد اليومي" : "Set daily count"}
            placeholder="30"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ ...field, width: 64, padding: "6px 8px" }}
          />
          <button type="button" onClick={save} style={{ ...ui.btnPrimary, padding: "6px 12px" }}>
            {ar ? "تثبيت" : "Pin"}
          </button>
        </>
      ) : null}
      {hint ? <span style={{ fontSize: 10, color: MUTED, width: "100%" }}>{hint}</span> : null}
    </div>
  );
}
