import React, { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function MovementRow({ entry, itemName, stationName, performerName, ar }) {
  const [open, setOpen] = useState(false);
  const decrease = Number(entry.balanceAfter) < Number(entry.balanceBefore);
  const tone = decrease ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700";
  const label = { purchase: ar ? "شراء" : "Purchase", receive: ar ? "استلام" : "Receive", issue: ar ? "صرف" : "Issue", return: ar ? "إرجاع" : "Return", transfer: ar ? "نقل" : "Transfer" }[entry.movementType] || entry.movementType;
  return <Fragment><tr className="border-t">
    <td data-label={ar ? "التاريخ" : "Date"} className="p-3">{new Date(entry.created_date).toLocaleString(ar ? "ar-SA" : "en")}</td>
    <td data-label={ar ? "الصنف" : "Item"} className="p-3 font-medium">{itemName(entry.itemId)}</td>
    <td data-label={ar ? "الحركة" : "Type"} className="p-3">{label}</td><td data-label={ar ? "الكمية" : "Qty"} className="p-3">{entry.quantity}</td>
    <td data-label={ar ? "من / إلى" : "From / To"} className="p-3">{stationName(entry.fromLocationId)} / {stationName(entry.toLocationId)}</td>
    <td data-label={ar ? "المنفذ" : "Performed by"} className="p-3">{performerName(entry.performedBy)}</td>
    <td data-label={ar ? "قبل" : "Before"} className={`p-3 font-semibold ${tone}`}>{entry.balanceBefore ?? "—"}</td>
    <td data-label={ar ? "بعد" : "After"} className={`p-3 font-semibold ${tone}`}>{entry.balanceAfter ?? "—"}</td>
    <td className="p-3">{entry.movementType === "transfer" && <button onClick={() => setOpen(!open)} className="rounded-lg border p-1.5"><ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} /></button>}</td>
  </tr>{open && <tr className="border-t bg-muted/30"><td colSpan="9" className="p-4"><div className="grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-lg bg-red-50 p-3 text-red-700">{stationName(entry.fromLocationId)}: {entry.sourceBalanceBefore ?? "—"} → {entry.sourceBalanceAfter ?? "—"}</div><div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">{stationName(entry.toLocationId)}: {entry.destinationBalanceBefore ?? "—"} → {entry.destinationBalanceAfter ?? "—"}</div></div></td></tr>}</Fragment>;
}