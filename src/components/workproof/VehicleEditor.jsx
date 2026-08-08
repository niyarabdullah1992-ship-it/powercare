import React from "react";
import { Plus, Trash2 } from "lucide-react";

// Vehicles entering the site for the job — plate, type and driver.
export default function VehicleEditor({ vehicles, onChange, ar }) {
  const update = (index, key, value) => onChange(vehicles.map((vehicle, i) => (i === index ? { ...vehicle, [key]: value } : vehicle)));
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground font-body">{ar ? "بيانات السيارات الداخلة" : "Vehicles entering site"}</p>
      {vehicles.map((vehicle, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
          <input value={vehicle.plate || ""} onChange={(e) => update(index, "plate", e.target.value)} placeholder={ar ? "رقم اللوحة" : "Plate number"} className="rounded-md border px-3 py-2 text-sm font-body" />
          <input value={vehicle.type || ""} onChange={(e) => update(index, "type", e.target.value)} placeholder={ar ? "نوع السيارة" : "Vehicle type"} className="rounded-md border px-3 py-2 text-sm font-body" />
          <input value={vehicle.driverName || ""} onChange={(e) => update(index, "driverName", e.target.value)} placeholder={ar ? "اسم السائق" : "Driver name"} className="rounded-md border px-3 py-2 text-sm font-body" />
          <button type="button" onClick={() => onChange(vehicles.filter((_, i) => i !== index))} className="rounded-md border border-border p-2 text-destructive hover:bg-muted" aria-label="remove">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...vehicles, { plate: "", type: "", driverName: "" }])} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-body hover:bg-muted">
        <Plus className="h-3.5 w-3.5" />{ar ? "إضافة سيارة" : "Add vehicle"}
      </button>
    </div>
  );
}