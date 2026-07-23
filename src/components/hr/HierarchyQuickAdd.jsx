import React, { useState } from "react";
import { Plus } from "lucide-react";

export default function HierarchyQuickAdd({ stations, stationId, setStationId, onAdd, lang }) {
  const ar = lang === "ar";
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const submit = (event) => { event.preventDefault(); if (!name.trim() || !stationId) return; onAdd({ name: name.trim(), position: position.trim(), stationId }); setName(""); setPosition(""); };
  return <form onSubmit={submit} className="grid gap-2 rounded-xl border border-accent/25 bg-accent/5 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
    <input value={name} onChange={(event) => setName(event.target.value)} placeholder={ar ? "اسم الموظف" : "Employee name"} className="border px-3 py-2 text-sm" />
    <input value={position} onChange={(event) => setPosition(event.target.value)} placeholder={ar ? "المنصب" : "Position"} className="border px-3 py-2 text-sm" />
    <select value={stationId} onChange={(event) => setStationId(event.target.value)} className="border px-3 py-2 text-sm"><option value="">{ar ? "اختر المحطة" : "Select station"}</option>{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select>
    <button className="flex items-center justify-center gap-1.5 bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="h-4 w-4" />{ar ? "إضافة سريعة" : "Quick add"}</button>
  </form>;
}