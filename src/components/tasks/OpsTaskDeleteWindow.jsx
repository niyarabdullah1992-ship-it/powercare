import React, { useEffect, useState } from "react";

const WINDOW_MS = 3 * 60 * 1000;

/** Delete is allowed only within 3 minutes of creation — shows a live countdown. */
export default function OpsTaskDeleteWindow({ createdAt, allowed, busy, ar, onDelete }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const created = new Date(createdAt || 0).getTime();
  const left = created ? WINDOW_MS - (now - created) : 0;
  if (!allowed || left <= 0) return null;
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => { if (window.confirm(ar ? "حذف المهمة نهائيًا؟" : "Delete this task permanently?")) onDelete?.(); }}
      style={{
        padding: "4px 10px",
        borderRadius: 8,
        border: "1px solid #FECACA",
        background: "#FEF2F2",
        color: "#B91C1C",
        fontSize: 11,
        fontWeight: 600,
        cursor: busy ? "wait" : "pointer",
        fontFamily: "inherit",
      }}
    >
      {ar ? `حذف · ${mm}:${ss}` : `Delete · ${mm}:${ss}`}
    </button>
  );
}