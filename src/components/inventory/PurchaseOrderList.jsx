import React from "react";

export default function PurchaseOrderList({ orders, canReceive, onReceive, ar }) {
  return <div className="space-y-2">{orders.map((order) => <div key={order.id} className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-4 md:items-center">
    <div><strong>{order.orderNumber}</strong><p className="text-xs text-muted-foreground">{order.supplierName}</p></div>
    <div className="text-sm">{order.items.map((item) => item.name).join("، ")}</div>
    <div><strong>{Number(order.totalCost).toLocaleString()} SAR</strong><p className="text-xs text-muted-foreground">{order.status}</p></div>
    {canReceive && order.status === "issued" ? <button onClick={() => onReceive(order.id)} className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">{ar ? "استلام وإضافة للمخزون" : "Receive into inventory"}</button> : <span className="text-sm text-muted-foreground">{order.status === "received" ? (ar ? "تم الاستلام" : "Received") : "—"}</span>}
  </div>)}{!orders.length && <p className="py-8 text-center text-muted-foreground">{ar ? "لا توجد أوامر شراء." : "No purchase orders."}</p>}</div>;
}