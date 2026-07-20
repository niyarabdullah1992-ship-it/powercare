import React from "react";

const badge = { pending: "bg-amber-100 text-amber-800", approved: "bg-blue-100 text-blue-800", rejected: "bg-red-100 text-red-800", issued: "bg-emerald-100 text-emerald-800" };

export default function RequestsList({ requests, items, employees, stations, canReview, onReview, ar }) {
  const item = (id) => items.find((entry) => entry.id === id);
  const employeeName = (id) => employees.find((employee) => employee.employeeId === id)?.name || "—";
  const stationName = (id) => stations.find((station) => station.stationId === id)?.name || "—";
  const statusLabel = (status) => ({ pending: ar ? "معلق" : "Pending", rejected: ar ? "مرفوض" : "Rejected", issued: ar ? "تم التحويل" : "Transferred", approved: ar ? "معتمد" : "Approved" }[status] || status);
  return <div className="space-y-3">{requests.map((request) => <div key={request.id} className="rounded-xl border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item(request.itemId)?.name || "—"} · {request.quantity}</p><p className="text-xs text-muted-foreground">{stationName(request.sourceStationId)} → {stationName(request.stationId)} · {employeeName(request.requesterId)}{request.notes ? ` — ${request.notes}` : ""}</p></div><span className={`rounded-full px-2 py-1 text-[10px] ${badge[request.status] || badge.pending}`}>{statusLabel(request.status)}</span></div>{canReview && request.status === "pending" && <div className="mt-3 flex gap-2"><button onClick={() => onReview(request.id, "approved")} className="rounded-lg bg-accent px-3 py-1.5 text-xs text-accent-foreground">{ar ? "موافقة وتحويل" : "Approve & transfer"}</button><button onClick={() => onReview(request.id, "rejected")} className="rounded-lg border px-3 py-1.5 text-xs">{ar ? "رفض" : "Reject"}</button></div>}</div>)}{!requests.length && <p className="py-8 text-center text-sm text-muted-foreground">{ar ? "لا توجد طلبات." : "No requests."}</p>}</div>;
}