import React, { useState } from "react";
import { updateCompany } from "@/lib/store";
import { MapPin, Plus, X } from "lucide-react";

const uid = () => `plc_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

export default function PlaceManager({ places, companyId, selected, onSelect, ar }) {
  const [name, setName] = useState("");

  const addPlace = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = uid();
    updateCompany(companyId, (d) => {
      d.personalPlaces = d.personalPlaces || [];
      d.personalPlaces.push({ id, name: trimmed, createdAt: new Date().toISOString() });
    });
    onSelect(id);
    setName("");
  };

  const removePlace = (id) => {
    updateCompany(companyId, (d) => {
      d.personalPlaces = (d.personalPlaces || []).filter((p) => p.id !== id);
    });
    if (selected === id) onSelect("");
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-body flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" /> {ar ? "مقراتي" : "My Places"}
      </p>
      <div className="flex flex-wrap gap-2">
        {places.map((p) => (
          <span
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-body cursor-pointer transition ${selected === p.id ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {p.name}
            <button onClick={(e) => { e.stopPropagation(); removePlace(p.id); }} className="opacity-60 hover:opacity-100" aria-label="remove">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {places.length === 0 && (
          <p className="text-xs text-muted-foreground font-body">{ar ? "لا توجد مقرات بعد — أضف مقرك الأول أدناه." : "No places yet — add your first one below."}</p>
        )}
      </div>
      <form onSubmit={addPlace} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={ar ? "اسم المقر (مثل: المنزل، المكتب، المقهى...)" : "Place name (e.g. Home, Office, Café...)"}
          className="flex-1 px-3 py-2 rounded-md border border-input text-sm font-body bg-background"
        />
        <button type="submit" className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-body hover:bg-muted">
          <Plus className="w-4 h-4" /> {ar ? "إضافة" : "Add"}
        </button>
      </form>
    </div>
  );
}