import React from "react";
import { Plus, Trash2 } from "lucide-react";

const cls = "rounded-md border border-input bg-card px-3 py-2 text-sm font-body";

// Vehicles entering the site for the job — plate, type, manufacturer, model, year and driver.
export default function VehicleEditor({ vehicles, onChange, ar }) {
  const update = (index, key, value) => onChange(vehicles.map((vehicle, i) => (i === index ? { ...vehicle, [key]: value } : vehicle)));
  const fields = [
    { key: "plate", label: ar ? "رقم اللوحة" : "Plate number" },
    { key: "type", label: ar ? "نوع المركبة" : "Vehicle type" },
    { key: "make", label: ar ? "الشركة المصنّعة" : "Manufacturer" },
    { key: "model", label: ar ? "الموديل" : "Model" },
    { key: "year", label: ar ? "سنة الصنع" : "Year" },
    { key: "driverName", label: ar ? "اسم السائق" : "Driver name" },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground font-body">{ar ? "بيانات السيارات الداخلة" : "Vehicles entering site"}</p>
      {vehicles.map((vehicle, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-border bg-muted/25 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-body">{ar ? "سيارة" : "Vehicle"} {index + 1}</span>
            <button type="button" onClick={() => onChange(vehicles.filter((_, i) => i !== index))} className="text-xs text-destructive font-body hover:underline">
              {ar ? "حذف" : "Remove"}
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {fields.map((field) => (
              <label key={field.key} className="block space-y-1">
                <span className="block text-[11px] text-muted-foreground font-body">{field.label}</span>
                <input
                  value={vehicle[field.key] || ""}
                  onChange={(e) => update(index, field.key, e.target.value)}
                  inputMode={field.key === "year" ? "numeric" : undefined}
                  className={`w-full ${cls}`}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...vehicles, { plate: "", type: "", make: "", model: "", year: "", driverName: "" }])} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-body hover:bg-muted">
        <Plus className="h-3.5 w-3.5" />{ar ? "إضافة سيارة" : "Add vehicle"}
      </button>
    </div>
  );
}