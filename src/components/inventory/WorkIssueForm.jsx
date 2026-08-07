import React, { useState } from "react";
import MultiImageUploader from "@/components/inventory/MultiImageUploader";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function WorkIssueForm({ items, employees, stations = [], stationId, canChooseStation, onSubmit, ar }) {
  const today = new Date().toISOString().slice(0, 10);
  const [imageUrls, setImageUrls] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(canChooseStation ? "" : stationId);
  const issueStationId = canChooseStation ? selectedStationId : stationId;
  const availableItems = items.filter((item) => item.currentLocationId === issueStationId && Number(item.quantity) > 0);
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (await onSubmit({ ...Object.fromEntries(new FormData(form)), imageUrls })) { form.reset(); setImageUrls([]); }
  };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
    {!canChooseStation && <input type="hidden" name="fromLocationId" value={issueStationId} />}
    <div className="md:col-span-2 xl:col-span-4"><h3 className="font-semibold">{ar ? "صرف مواد للعمل" : "Issue materials to work"}</h3><p className="text-sm text-muted-foreground">{ar ? "خصم المواد من مخزون المحطة وتوثيق المستلم ومرجع العمل." : "Deduct station stock and document the recipient and work reference."}</p></div>
    {canChooseStation && <MobileSelect name="fromLocationId" value={selectedStationId} onChange={setSelectedStationId} searchable searchPlaceholder={ar ? "ابحث عن محطة..." : "Search stations..."} placeholder={ar ? "اختر محطة الصرف" : "Choose issue station"} className="w-full rounded-lg" options={stations.map((station) => ({ value: station.stationId || station.id, label: station.location ? `${station.name} — ${station.location}` : station.name }))} />}
    <select name="itemId" required disabled={!issueStationId} className="rounded-lg border px-3 py-2"><option value="">{ar ? "الصنف" : "Item"}</option>{availableItems.map((item) => <option key={item.displayKey || item.id} value={item.id}>{item.name} · {item.quantity}</option>)}</select>
    <input name="quantity" type="number" min="1" defaultValue="1" required placeholder={ar ? "الكمية" : "Quantity"} className="rounded-lg border px-3 py-2" />
    <select name="employeeId" required className="rounded-lg border px-3 py-2"><option value="">{ar ? "الموظف المستلم" : "Receiving employee"}</option>{employees.map((employee) => <option key={employee.employeeId} value={employee.employeeId}>{employee.name}</option>)}</select>
    <input name="workReference" required placeholder={ar ? "المهمة أو المشروع" : "Task or project"} className="rounded-lg border px-3 py-2" />
    <input name="workDate" type="date" defaultValue={today} required className="rounded-lg border px-3 py-2" />
    <input name="notes" placeholder={ar ? "ملاحظات (اختياري)" : "Notes (optional)"} className="rounded-lg border px-3 py-2 md:col-span-2" />
    <MultiImageUploader value={imageUrls} onChange={setImageUrls} ar={ar} />
    <button disabled={!issueStationId || !availableItems.length} className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-40">{ar ? "تأكيد الصرف للعمل" : "Confirm work issue"}</button>
  </form>;
}