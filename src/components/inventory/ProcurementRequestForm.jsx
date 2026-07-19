import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

const blank = { itemCode: "", name: "", quantity: 1, estimatedUnitCost: 0 };
export default function ProcurementRequestForm({ stationId, onSubmit, ar }) {
  const [items, setItems] = useState([{ ...blank }]);
  const [justification, setJustification] = useState("");
  const change = (index, key, value) => setItems(items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const submit = async (event) => {
    event.preventDefault();
    const clean = items.map((item) => ({ ...item, quantity: Number(item.quantity), estimatedUnitCost: Number(item.estimatedUnitCost) }));
    if (await onSubmit({ stationId, justification, items: clean })) { setItems([{ ...blank }]); setJustification(""); }
  };
  return <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-4">
    <div><h2 className="font-heading text-xl font-semibold">{ar ? "طلب شراء جديد" : "New purchase request"}</h2><p className="text-xs text-muted-foreground">{ar ? "أضف المواد المطلوبة وأرسلها للموافقة." : "Add required materials and submit for approval."}</p></div>
    {items.map((item, index) => <div key={index} className="grid gap-2 rounded-lg bg-muted/40 p-3 md:grid-cols-5">
      <input required value={item.itemCode} onChange={(e) => change(index, "itemCode", e.target.value)} placeholder={ar ? "كود الصنف" : "Item code"} className="rounded-lg border px-3 py-2" />
      <input required value={item.name} onChange={(e) => change(index, "name", e.target.value)} placeholder={ar ? "اسم الصنف" : "Item name"} className="rounded-lg border px-3 py-2" />
      <input required type="number" min="1" value={item.quantity} onChange={(e) => change(index, "quantity", e.target.value)} className="rounded-lg border px-3 py-2" />
      <input required type="number" min="0" step="0.01" value={item.estimatedUnitCost} onChange={(e) => change(index, "estimatedUnitCost", e.target.value)} placeholder={ar ? "التكلفة التقديرية" : "Estimated unit cost"} className="rounded-lg border px-3 py-2" />
      <button type="button" disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== index))} className="rounded-lg border p-2 text-destructive disabled:opacity-30"><Trash2 className="mx-auto h-4 w-4" /></button>
    </div>)}
    <button type="button" onClick={() => setItems([...items, { ...blank }])} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Plus className="h-4 w-4" />{ar ? "إضافة صنف" : "Add item"}</button>
    <textarea required value={justification} onChange={(e) => setJustification(e.target.value)} placeholder={ar ? "مبرر الشراء" : "Purchase justification"} className="min-h-20 w-full rounded-lg border px-3 py-2" />
    <button disabled={!stationId} className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-40">{ar ? "إرسال للموافقة" : "Submit for approval"}</button>
  </form>;
}