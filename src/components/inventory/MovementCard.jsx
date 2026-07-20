import React, { useState } from "react";
import { ArrowLeft, ArrowLeftRight, ArrowRight, CalendarDays, ChevronDown, PackageMinus, ShoppingCart, UserRound } from "lucide-react";
import ImageGallery from "@/components/inventory/ImageGallery";
import MovementBalancePanel from "@/components/inventory/MovementBalancePanel";
import { useI18n } from "@/lib/i18n";

export default function MovementCard({ entry, itemName, stationName, personName, ar }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const transfer = entry.movementType === "transfer";
  const issue = entry.movementType === "issue";
  const purchase = entry.movementType === "purchase";
  const label = { purchase: ar ? "شراء" : "Purchase", receive: ar ? "استلام" : "Receive", issue: t("issueToWork"), return: ar ? "إرجاع" : "Return", transfer: ar ? "نقل بين المحطات" : "Station transfer" }[entry.movementType] || entry.movementType;
  const status = { purchase: ar ? "تم تسجيل الشراء" : "Purchase recorded", receive: ar ? "تم الاستلام" : "Received", issue: ar ? "تم التسليم للعمل" : "Issued to work", return: ar ? "تم الإرجاع" : "Returned", transfer: ar ? "مكتمل" : "Completed" }[entry.movementType] || "—";
  const sourceBefore = entry.sourceBalanceBefore ?? entry.balanceBefore ?? "—";
  const sourceAfter = entry.sourceBalanceAfter ?? entry.balanceAfter ?? "—";
  const destinationBefore = entry.destinationBalanceBefore ?? entry.balanceBefore ?? "—";
  const destinationAfter = entry.destinationBalanceAfter ?? entry.balanceAfter ?? "—";
  const Icon = purchase ? ShoppingCart : issue ? PackageMinus : ArrowLeftRight;
  const expandable = issue && (entry.workReference || entry.workDate || entry.notes || entry.imageUrls?.length);

  return <article className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-accent/10 p-2 text-accent"><Icon className="h-5 w-5" /></span><div><h3 className="font-semibold">{itemName(entry.itemId)}</h3><p className="text-sm text-muted-foreground">{label} · {status}</p></div></div>
      <div className="text-end"><span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">{entry.quantity} {ar ? "وحدة" : "units"}</span><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{new Date(entry.created_date).toLocaleString(ar ? "ar-SA" : "en")}</p></div>
    </div>
    <div className={`grid items-stretch gap-3 p-4 ${purchase ? "md:grid-cols-1" : "md:grid-cols-[1fr_auto_1fr]"}`}>
      {!purchase && <MovementBalancePanel label={issue ? (ar ? "الصرف من" : "Issued from") : (ar ? "المصدر" : "Source")} name={stationName(entry.fromLocationId)} before={sourceBefore} after={sourceAfter} ar={ar} />}
      {!purchase && <div className="flex items-center justify-center rounded-full bg-accent/10 p-2 text-accent md:self-center">{ar ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}</div>}
      <MovementBalancePanel label={issue ? (ar ? "المستلم" : "Recipient") : (ar ? "الوجهة" : "Destination")} name={issue ? personName(entry.employeeId) : stationName(entry.toLocationId)} before={destinationBefore} after={destinationAfter} recipient={issue ? (ar ? "تم تسليم الكمية للعمل" : "Quantity issued for work") : ""} tone="destination" ar={ar} />
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{ar ? "نفذها: " : "Performed by: "}<b className="text-foreground">{personName(entry.performedBy)}</b></span>{expandable && <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded-lg border px-2 py-1 text-foreground">{ar ? "تفاصيل العمل" : "Work details"}<ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} /></button>}</div>
    {open && <div className="border-t border-border bg-muted/30 p-4 text-sm"><div className="grid gap-3 sm:grid-cols-3"><p><span className="text-muted-foreground">{ar ? "مرجع العمل: " : "Work reference: "}</span>{entry.workReference || "—"}</p><p><span className="text-muted-foreground">{ar ? "تاريخ العمل: " : "Work date: "}</span>{entry.workDate || "—"}</p><p><span className="text-muted-foreground">{ar ? "ملاحظات: " : "Notes: "}</span>{entry.notes || "—"}</p></div>{entry.imageUrls?.length ? <div className="mt-4 border-t pt-4"><p className="mb-2 font-medium">{t("completedWorkImages")}</p><ImageGallery images={entry.imageUrls} ar={ar} /></div> : null}</div>}
  </article>;
}