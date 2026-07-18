import React from "react";

const badge = { pending: "bg-amber-100 text-amber-800", approved: "bg-blue-100 text-blue-800", rejected: "bg-red-100 text-red-800", issued: "bg-emerald-100 text-emerald-800" };
export default function RequestsList({ requests, items, employees, canManage, onReview, onIssue, ar }) {
  const itemName = (id) => items.find((item) => item.id === id)?.name || "—";
  const employeeName = (id) => employees.find((employee) => employee.employeeId === id)?.name || "—";
  return <div className="space-y-3">{requests.map((request) => <div key={request.id} className="rounded-xl border border-border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{itemName(request.itemId)} · {request.quantity}</p><p className="text-xs text-muted-foreground">{employeeName(request.requesterId)}{request.notes ? ` — ${request.notes}` : ""}</p></div><span className={`rounded-full px-2 py-1 text-[10px] ${badge[request.status]}`}>{request.status}</span></div>
    {canManage && request.status === "pending" && <div className="mt-3 flex gap-2"><button onClick={() => onReview(request.id, "approved")} className="rounded-lg bg-accent px-3 py-1.5 text-xs text-accent-foreground">{ar ? "موافقة" : "Approve"}</button><button onClick={() => onReview(request.id, "rejected")} className="rounded-lg border px-3 py-1.5 text-xs">{ar ? "رفض" : "Reject"}</button></div>}
    {canManage && request.status === "approved" && <button onClick={() => onIssue(request.id)} className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground">{ar ? "مسح QR والصرف" : "Scan QR & issue"}</button>}
  </div>)}{!requests.length && <p className="py-8 text-center text-sm text-muted-foreground">{ar ? "لا توجد طلبات." : "No requests."}</p>}</div>;
}