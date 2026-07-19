import React, { useState } from "react";
import QrScanner from "@/components/inventory/QrScanner";

export default function IssueScanner({ requests, items, selectedRequest, onIssue, ar }) {
  const [requestId, setRequestId] = useState(selectedRequest || ""); const [code, setCode] = useState("");
  const approved = requests.filter((request) => request.status === "approved");
  const name = (id) => items.find((item) => item.id === id)?.name || "—";
  return <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-accent/30 bg-card p-5"><div><h2 className="font-heading text-2xl font-semibold">{ar ? "قراءة الباركود والصرف" : "Read barcode and issue"}</h2><p className="text-sm text-muted-foreground">{ar ? "ارفع صورة الباركود لطلب معتمد، أو أدخل الكود يدوياً." : "Upload a barcode image for an approved request, or enter its code manually."}</p></div>
    <select value={requestId} onChange={(event) => setRequestId(event.target.value)} className="w-full rounded-lg border px-3 py-2"><option value="">{ar ? "اختر الطلب المعتمد" : "Choose approved request"}</option>{approved.map((request) => <option key={request.id} value={request.id}>{name(request.itemId)} · {request.quantity}</option>)}</select>
    <QrScanner value={code} onChange={setCode} ar={ar} />
    <button disabled={!requestId || !code} onClick={async () => { if (await onIssue(requestId, code)) setCode(""); }} className="w-full rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground disabled:opacity-50">{ar ? "تأكيد الصرف" : "Confirm issue"}</button>
  </div>;
}