import React, { useState } from "react";
import ProcurementRequestForm from "@/components/inventory/ProcurementRequestForm";
import ProcurementRequestList from "@/components/inventory/ProcurementRequestList";
import PurchaseOrderForm from "@/components/inventory/PurchaseOrderForm";
import PurchaseOrderList from "@/components/inventory/PurchaseOrderList";

export default function ProcurementTab({ requests, orders, stationId, canApprove, canReceive, run, ar }) {
  const [ordering, setOrdering] = useState(null);
  const createOrder = async (payload) => { if (await run("createPurchaseOrder", payload)) setOrdering(null); };
  return <div className="space-y-4">
    <ProcurementRequestForm stationId={stationId} onSubmit={(payload) => run("submitProcurement", payload)} ar={ar} />
    <PurchaseOrderForm request={ordering} onSubmit={createOrder} onClose={() => setOrdering(null)} ar={ar} />
    <section className="space-y-2"><h2 className="font-heading text-xl font-semibold">{ar ? "طلبات الشراء" : "Purchase requests"}</h2><ProcurementRequestList requests={requests} canApprove={canApprove} onReview={(requestId, decision) => run("reviewProcurement", { requestId, decision })} onOrder={setOrdering} ar={ar} /></section>
    <section className="space-y-2"><h2 className="font-heading text-xl font-semibold">{ar ? "أوامر الشراء" : "Purchase orders"}</h2><PurchaseOrderList orders={orders} canReceive={canReceive} onReceive={(orderId) => run("receivePurchaseOrder", { orderId })} ar={ar} /></section>
  </div>;
}