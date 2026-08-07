import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { seatVacancy } from "@/lib/jobCatalogApi";

// اعتماد الحساب يتطلّب ربط الموظف بمقعد وظيفي شاغر — يرث منه المسمى والدرجة والمدير.
export default function InviteApproveDialog({ invite, seats, titles, stations, onConfirm, onClose, lang }) {
  const ar = lang === "ar";
  const [seatId, setSeatId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const vacant = seats.filter((seat) => seatVacancy(seat) > 0);
  const titleOf = (seat) => titles.find((t) => t.id === seat.titleId);
  const unitOf = (seat) => stations.find((s) => s.id === seat.unitId)?.name || seat.unitId;

  const confirm = async () => {
    const seat = vacant.find((s) => s.id === seatId);
    if (!seat) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm(seat, titleOf(seat));
    } catch (err) {
      setError(err?.response?.data?.error === "no_vacant_seat" ? (ar ? "لا يوجد مقعد شاغر — تم شغل المقعد للتو." : "No vacant seat — it was just filled.") : err.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">{ar ? `اعتماد حساب: ${invite.name}` : `Approve account: ${invite.name}`}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        {vacant.length === 0 ? (
          <p className="text-sm text-destructive">{ar ? "لا توجد مقاعد شاغرة — أضف مقعدًا في كتالوج المسميات أولًا. يُمنع التعيين بدون مقعد شاغر." : "No vacant seats — add one in the job catalog first. Appointment without a vacant seat is blocked."}</p>
        ) : (
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{ar ? "المقعد الوظيفي الشاغر *" : "Vacant job seat *"}</label>
            <select value={seatId} onChange={(e) => setSeatId(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm">
              <option value="">{ar ? "اختر مقعدًا…" : "Choose a seat…"}</option>
              {vacant.map((seat) => (
                <option key={seat.id} value={seat.id}>
                  {(titleOf(seat)?.name || "—")} — {unitOf(seat)} ({ar ? "شاغر" : "vacant"}: {seatVacancy(seat)})
                </option>
              ))}
            </select>
            {seatId && (
              <p className="mt-2 text-xs text-muted-foreground">
                {ar ? "سيرث الموظف المسمى والدرجة والمدير ومسار الاعتماد من هذا المقعد." : "The employee inherits title, grade, manager and approval path from this seat."}
              </p>
            )}
          </div>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button onClick={confirm} disabled={!seatId || busy} className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50 flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {ar ? "اعتماد وتفعيل الحساب" : "Approve & activate account"}
        </button>
      </div>
    </div>
  );
}