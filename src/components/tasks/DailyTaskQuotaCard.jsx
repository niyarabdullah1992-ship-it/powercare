import React, { useEffect, useState } from "react";
import { updateCompany } from "@/lib/store";
import { deriveDailyTaskQuota } from "@/lib/dailyTaskQuota";
import { ACCENT, BORDER, CARD, MUTED, NAVY, SURFACE, field, ui } from "@/lib/platformStyles";

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
    setHint(ar ? "حُفظت الحصة اليومية — كل يوم يُحسب وحده." : "Daily quota saved — each day is counted on its own.");
    onSaved?.();
  };

  const pct = derived.quota ? Math.min(100, Math.round((derived.done / derived.quota) * 100)) : 0;

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 13,
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
          {ar ? "حصة اليوم" : "Today's quota"}
        </div>
        <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.7 }}>
          {ar
            ? "كل يوم بيومه — ما لا يُنجز اليوم لا يُرحَّل للغد."
            : "Each day stands alone — today's shortfall does not roll to tomorrow."}
        </div>
      </div>

      {derived.quota > 0 ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 600, color: derived.met ? ACCENT : NAVY }}>
              {derived.done}
            </span>
            <span style={{ fontSize: 13, color: MUTED }}>/ {derived.quota}</span>
            <span style={{ fontSize: 12, color: derived.met ? ACCENT : "#B45309", fontWeight: 600 }}>
              {derived.met
                ? (ar ? "أُغلق اليوم" : "Day met")
                : (ar ? `متبقّي ${derived.remaining}` : `${derived.remaining} left`)}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: SURFACE, marginTop: 8, overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: `${pct}%`, background: derived.met ? ACCENT : NAVY }} />
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>
            {ar
              ? `إن ثُبّتت ${derived.quota} يومياً فالمتوقع هذا الشهر ${derived.monthExpected} مهمة.`
              : `${derived.quota} a day projects ${derived.monthExpected} this month.`}
          </div>
        </>
      ) : (
        <p style={{ margin: "10px 0 0", fontSize: 12, color: MUTED }}>
          {ar
            ? "لم تُثبَّت حصة يومية بعد. مثال: 30 تعني 30 مهمة تُنجز اليوم، وغداً ثلاثين جديدة."
            : "No daily quota yet. Example: 30 means 30 tasks today, and 30 new ones tomorrow."}
        </p>
      )}

      {canEdit && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 12 }}>
          <label style={{ fontSize: 11, color: MUTED }}>
            {ar ? "تثبيت العدد اليومي" : "Set daily count"}
          </label>
          <input
            type="number"
            min={0}
            max={999}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ ...field, width: 88 }}
          />
          <button type="button" onClick={save} style={ui.btnPrimary}>
            {ar ? "تثبيت" : "Pin"}
          </button>
          {hint ? <span style={{ fontSize: 11, color: MUTED }}>{hint}</span> : null}
        </div>
      )}
    </div>
  );
}
