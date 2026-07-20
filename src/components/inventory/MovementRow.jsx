import React, { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import ImageGallery from "@/components/inventory/ImageGallery";
import { useI18n } from "@/lib/i18n";

export default function MovementRow({ entry, itemName, stationName, personName, ar }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const transfer = entry.movementType === "transfer";
  const before = transfer ? `${stationName(entry.fromLocationId)}: ${entry.sourceBalanceBefore ?? entry.balanceBefore ?? "—"} · ${stationName(entry.toLocationId)}: ${entry.destinationBalanceBefore ?? "—"}` : (entry.balanceBefore ?? "—");
  const after = transfer ? `${stationName(entry.fromLocationId)}: ${entry.sourceBalanceAfter ?? entry.balanceAfter ?? "—"} · ${stationName(entry.toLocationId)}: ${entry.destinationBalanceAfter ?? "—"}` : (entry.balanceAfter ?? "—");
  const decrease = Number(transfer ? entry.sourceBalanceAfter : entry.balanceAfter) < Number(transfer ? entry.sourceBalanceBefore : entry.balanceBefore);
  const tone = decrease ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700";
  const label = { purchase: ar ? "شراء" : "Purchase", receive: ar ? "استلام" : "Receive", issue: t("issueToWork"), return: ar ? "إرجاع" : "Return", transfer: ar ? "نقل بين المحطات" : "Station transfer" }[entry.movementType] || entry.movementType;
  const status = { purchase: ar ? "تم تسجيل الشراء" : "Purchase recorded", receive: ar ? "تم الاستلام" : "Received", issue: ar ? "تم التسليم للعمل" : "Issued to work", return: ar ? "تم الإرجاع" : "Returned", transfer: ar ? "مكتمل — خُصم من المصدر وأُضيف للوجهة" : "Completed — deducted from source and added to destination" }[entry.movementType] || "—";
  return <Fragment><tr className="border-t">
    <td data-label={ar ? "التاريخ" : "Date"} className="p-3">{new Date(entry.created_date).toLocaleString(ar ? "ar-SA" : "en")}</td>
    <td data-label={ar ? "الصنف" : "Item"} className="p-3 font-medium">{itemName(entry.itemId)}</td>
    <td data-label={ar ? "الحركة" : "Type"} className="p-3"><span>{label}</span>{entry.movementType === "issue" && <span className="mt-1 block w-fit rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">{t("finalInventoryMovement")}</span>}</td>
    <td data-label={ar ? "الحالة" : "Status"} className="p-3 text-xs text-muted-foreground">{status}</td>
    <td data-label={ar ? "الكمية" : "Qty"} className="p-3">{entry.quantity}</td>
    <td data-label={ar ? "من / إلى" : "From / To"} className="p-3">{stationName(entry.fromLocationId)} / {stationName(entry.toLocationId)}</td>
    <td data-label={ar ? "الموظف المسؤول" : "Responsible employee"} className="p-3 font-medium">{personName(entry.employeeId)}</td>
    <td data-label={ar ? "منفذ العملية" : "Performed by"} className="p-3 font-medium">{personName(entry.performedBy)}</td>
    <td data-label={ar ? "قبل" : "Before"} className={`p-3 text-xs font-semibold ${tone}`}>{before}</td>
    <td data-label={ar ? "بعد" : "After"} className={`p-3 text-xs font-semibold ${tone}`}>{after}</td>
    <td className="p-3">{(["transfer", "issue"].includes(entry.movementType) || entry.imageUrls?.length) && <button onClick={() => setOpen(!open)} className="rounded-lg border p-1.5"><ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} /></button>}</td>
  </tr>{open && entry.movementType === "transfer" && <tr className="border-t bg-muted/30"><td colSpan="11" className="p-4"><div className="grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-lg bg-red-50 p-3 text-red-700">{stationName(entry.fromLocationId)}: {entry.sourceBalanceBefore ?? "—"} → {entry.sourceBalanceAfter ?? "—"}</div><div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">{stationName(entry.toLocationId)}: {entry.destinationBalanceBefore ?? "—"} → {entry.destinationBalanceAfter ?? "—"}</div></div></td></tr>}{open && entry.movementType === "issue" && <tr className="border-t bg-muted/30"><td colSpan="11" className="p-4"><div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><span className="text-muted-foreground">{ar ? "المستلم: " : "Recipient: "}</span>{personName(entry.employeeId)}</div><div><span className="text-muted-foreground">{ar ? "مرجع العمل: " : "Work reference: "}</span>{entry.workReference || "—"}</div><div><span className="text-muted-foreground">{ar ? "تاريخ العمل: " : "Work date: "}</span>{entry.workDate || "—"}</div><div><span className="text-muted-foreground">{ar ? "ملاحظات: " : "Notes: "}</span>{entry.notes || "—"}</div></div>{entry.imageUrls?.length ? <div className="mt-4 border-t pt-4"><p className="mb-2 font-medium">{t("completedWorkImages")}</p><ImageGallery images={entry.imageUrls} ar={ar} /></div> : null}</td></tr>}</Fragment>;
}