import React from "react";

const tones = { pending: "bg-amber-100 text-amber-800", approved: "bg-blue-100 text-blue-800", rejected: "bg-red-100 text-red-800", ordered: "bg-violet-100 text-violet-800", received: "bg-emerald-100 text-emerald-800" };
export default function ProcurementRequestList({ requests, canApprove, onReview, onOrder, ar }) {
  return <div className="space-y-2">{requests.map((request) => <div key={request.id} className="rounded-xl border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{request.requestNumber}</strong><p className="text-xs text-muted-foreground">{request.requesterName} · {request.justification}</p></div><span className={`rounded-full px-2 py-1 text-xs ${tones[request.status]}`}>{request.status}</span></div>
    <div className="mt-3 space-y-1 text-sm">{request.items.map((item, index) => <p key={index}>{item.name} ({item.itemCode}) · {item.quantity} × {Number(item.estimatedUnitCost || 0).toLocaleString()} SAR</p>)}</div>
    {canApprove && request.status === "pending" && <div className="mt-3 flex gap-2"><button onClick={() => onReview(request.id, "approved")} className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">{ar ? "موافقة" : "Approve"}</button><button onClick={() => onReview(request.id, "rejected")} className="rounded-lg border px-3 py-2 text-sm text-destructive">{ar ? "رفض" : "Reject"}</button></div>}
    {canApprove && request.status === "approved" && <button onClick={() => onOrder(request)} className="mt-3 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">{ar ? "إنشاء أمر شراء" : "Create purchase order"}</button>}
  </div>)}{!requests.length && <p className="py-8 text-center text-muted-foreground">{ar ? "لا توجد طلبات شراء." : "No purchase requests."}</p>}</div>;
}