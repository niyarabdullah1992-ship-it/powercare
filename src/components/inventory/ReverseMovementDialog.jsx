import React, { useEffect, useMemo, useState } from "react";
import { Undo2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ReverseMovementDialog({ movement, movements = [], items, stations, onClose, onConfirm, ar }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { setReason(""); }, [movement?.id]);
  const item = items.find((entry) => entry.id === movement?.itemId);
  const movementLabel = { purchase: ar ? "شراء" : "Purchase", transfer: ar ? "نقل" : "Transfer", issue: ar ? "صرف" : "Issue", return: ar ? "إرجاع" : "Return", receive: ar ? "استلام" : "Receive" }[movement?.movementType] || "—";
  const stationName = (id) => stations.find((station) => (station.stationId || station.id) === id)?.name || "—";
  const effects = useMemo(() => {
    if (!movement || !item) return [];
    const quantity = Number(movement.quantity) || 0;
    const balance = (id) => Number(item.locationBalances?.find((entry) => entry.locationId === id)?.quantity || 0);
    if (movement.movementType === "purchase") return [{ id: movement.toLocationId, before: balance(movement.toLocationId), delta: -quantity }];
    if (movement.movementType === "issue") return [{ id: movement.fromLocationId, before: balance(movement.fromLocationId), delta: quantity }];
    return [{ id: movement.toLocationId, before: balance(movement.toLocationId), delta: -quantity }, { id: movement.fromLocationId, before: balance(movement.fromLocationId), delta: quantity }];
  }, [movement, item]);
  const dependencies = useMemo(() => {
    if (!movement || movement.movementType === "issue") return [];
    const originalTime = new Date(movement.created_date).getTime();
    return movements.filter((entry) => entry.id !== movement.id && entry.itemId === movement.itemId && !entry.isReversal && !entry.reversedAt && entry.fromLocationId === movement.toLocationId && new Date(entry.created_date).getTime() > originalTime);
  }, [movement, movements]);
  const blocked = dependencies.length > 0 || effects.some((effect) => effect.before + effect.delta < 0);
  const submit = async () => { setSubmitting(true); const saved = await onConfirm(reason.trim()); setSubmitting(false); if (saved) onClose(); };
  return <Dialog open={!!movement} onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><Undo2 className="h-5 w-5 text-accent" />{ar ? "تأكيد التراجع عن الحركة" : "Confirm movement reversal"}</DialogTitle></DialogHeader>
    <div className="space-y-4"><div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/50 p-3 text-sm"><p><span className="text-muted-foreground">{ar ? "النوع" : "Type"}</span><b className="block">{movementLabel}</b></p><p><span className="text-muted-foreground">{ar ? "الصنف" : "Item"}</span><b className="block">{item?.name || "—"}</b></p><p><span className="text-muted-foreground">{ar ? "الكمية" : "Quantity"}</span><b className="block">{movement?.quantity || 0}</b></p></div>
      <div className="space-y-2">{effects.map((effect) => <div key={effect.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-lg border p-3 text-sm"><span className="font-medium">{stationName(effect.id)}</span><span><small className="block text-muted-foreground">{ar ? "قبل التراجع" : "Before"}</small><b>{effect.before}</b></span><span><small className="block text-muted-foreground">{ar ? "بعد التراجع" : "After"}</small><b className={effect.before + effect.delta < 0 ? "text-destructive" : "text-foreground"}>{effect.before + effect.delta}</b></span></div>)}{dependencies.length > 0 ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{ar ? `انتقلت الكمية أو صُرفت لاحقًا من ${stationName(movement?.toLocationId)}. يجب التراجع عن الحركات الأحدث أولًا.` : `The quantity was later transferred or issued from ${stationName(movement?.toLocationId)}. Reverse the newer movements first.`}</p> : blocked && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{ar ? "لا يمكن التراجع لأن الرصيد الحالي لا يكفي لعكس هذه الحركة." : "This movement cannot be reversed because current stock is insufficient."}</p>}</div>
      <label className="block text-sm"><span className="mb-1 block text-muted-foreground">{ar ? "سبب التراجع (إلزامي)" : "Reversal reason (required)"}</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="w-full rounded-lg border p-3" /></label>
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">{ar ? "إلغاء" : "Cancel"}</button><button type="button" onClick={submit} disabled={!reason.trim() || submitting || blocked} className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-50">{submitting ? (ar ? "جارٍ التراجع..." : "Reversing...") : (ar ? "تأكيد التراجع" : "Confirm reversal")}</button></div>
    </div></DialogContent></Dialog>;
}