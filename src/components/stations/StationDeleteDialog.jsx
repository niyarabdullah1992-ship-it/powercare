import React, { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import useStationDeletion from "@/hooks/useStationDeletion";
import StationDeleteSummary from "@/components/stations/StationDeleteSummary";

export default function StationDeleteDialog({ station, stations, data, company, lang }) {
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("transfer");
  const [target, setTarget] = useState("");
  const { summary, loading, error, loadSummary, remove } = useStationDeletion(company, data, station.id);
  const destinations = stations.filter((item) => item.id !== station.id);
  const show = () => { setTarget(destinations[0]?.id || ""); setMode(destinations.length ? "transfer" : "delete"); setOpen(true); loadSummary(); };
  const confirm = async () => { if (await remove(mode, mode === "transfer" ? target : null)) setOpen(false); };

  return <>
    <button onClick={show} className="rounded-md p-1 text-destructive hover:bg-destructive/10" title={ar ? "حذف" : "Delete"}><Trash2 className="h-3.5 w-3.5" /></button>
    {open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => !loading && setOpen(false)}>
      <div className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-5 shadow-elevated" onClick={(event) => event.stopPropagation()}>
        <div><h3 className="font-heading text-xl font-semibold">{ar ? `حذف محطة ${station.name}` : `Delete ${station.name}`}</h3><p className="mt-1 text-sm text-muted-foreground">{ar ? "راجع البيانات المرتبطة قبل المتابعة." : "Review linked data before continuing."}</p></div>
        {loading && !summary ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div> : <StationDeleteSummary summary={summary} ar={ar} />}
        <div className="space-y-2"><p className="text-sm font-medium">{ar ? "ماذا تريد أن يحدث بالبيانات؟" : "What should happen to the data?"}</p>
          {destinations.length > 0 && <label className="flex cursor-pointer gap-3 rounded-xl border border-border p-3"><input type="radio" checked={mode === "transfer"} onChange={() => setMode("transfer")} /><span><strong className="block text-sm">{ar ? "نقل إلى محطة أخرى" : "Transfer to another station"}</strong><span className="text-xs text-muted-foreground">{ar ? "نقل الموظفين والمهام والحضور والسلامة والجداول." : "Move employees, tasks, attendance, safety, and schedules."}</span></span></label>}
          <label className="flex cursor-pointer gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3"><input type="radio" checked={mode === "delete"} onChange={() => setMode("delete")} /><span><strong className="block text-sm text-destructive">{ar ? "حذف البيانات نهائياً" : "Permanently delete data"}</strong><span className="text-xs text-destructive/80">{ar ? "لا يمكن التراجع؛ سيصبح الموظفون بلا محطة." : "This cannot be undone; employees become unassigned."}</span></span></label>
        </div>
        {mode === "transfer" && <select value={target} onChange={(event) => setTarget(event.target.value)} className="w-full rounded-lg border border-input px-3 py-2 text-sm">{destinations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
        {mode === "delete" && <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" />{ar ? "سيتم حذف المهام والحضور والسلامة والجداول المرتبطة نهائياً." : "Linked tasks, attendance, safety, and schedules will be deleted permanently."}</div>}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><button disabled={loading} onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm">{ar ? "إلغاء" : "Cancel"}</button><button disabled={loading || (mode === "transfer" && !target)} onClick={confirm} className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{ar ? "تأكيد الحذف" : "Confirm deletion"}</button></div>
      </div>
    </div>}
  </>;
}