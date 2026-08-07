import React, { useState } from "react";
import { Users, Plus, Trash2, IdCard, Car } from "lucide-react";

const EMPTY = { name: "", idNumber: "", vehicleType: "", plate: "" };

// الموظفون الذين دخلوا لدى الجهة: الاسم، رقم الهوية، نوع السيارة ولوحتها.
export default function ProofCrewEditor({ value = [], onChange, employees = [], ar }) {
  const [row, setRow] = useState(EMPTY);
  const set = (key) => (event) => setRow((current) => ({ ...current, [key]: event.target.value }));

  const add = () => {
    if (!row.name.trim()) return;
    onChange([...value, { ...row, id: `crew_${Date.now()}` }]);
    setRow(EMPTY);
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Users className="h-3.5 w-3.5" /> {ar ? "الموظفون الذين دخلوا لدى الجهة" : "Employees who entered the client site"}
        <span className="text-muted-foreground">({value.length})</span>
      </p>

      {value.map((crew) => (
        <div key={crew.id} className="flex items-start justify-between gap-2 rounded-md border border-border p-2 text-xs font-body">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{crew.name}</p>
            <p className="flex flex-wrap items-center gap-2.5 text-muted-foreground">
              {crew.idNumber && <span className="inline-flex items-center gap-1"><IdCard className="h-3 w-3" /><span dir="ltr">{crew.idNumber}</span></span>}
              {(crew.vehicleType || crew.plate) && (
                <span className="inline-flex items-center gap-1"><Car className="h-3 w-3" />{crew.vehicleType}{crew.plate ? ` · ${crew.plate}` : ""}</span>
              )}
            </p>
          </div>
          <button type="button" onClick={() => onChange(value.filter((entry) => entry.id !== crew.id))} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}

      <div className="grid gap-2 sm:grid-cols-2">
        <input list="proof-crew-names" value={row.name} onChange={set("name")} placeholder={ar ? "اسم الموظف" : "Employee name"} className="rounded-md border border-input px-3 py-2 text-sm text-foreground" />
        <datalist id="proof-crew-names">
          {employees.map((employee) => <option key={employee.id} value={employee.name} />)}
        </datalist>
        <input value={row.idNumber} onChange={set("idNumber")} placeholder={ar ? "رقم الهوية" : "ID number"} dir="ltr" className="rounded-md border border-input px-3 py-2 text-sm text-foreground" />
        <input value={row.vehicleType} onChange={set("vehicleType")} placeholder={ar ? "نوع السيارة" : "Vehicle type"} className="rounded-md border border-input px-3 py-2 text-sm text-foreground" />
        <input value={row.plate} onChange={set("plate")} placeholder={ar ? "رقم اللوحة" : "Plate number"} dir="ltr" className="rounded-md border border-input px-3 py-2 text-sm text-foreground" />
      </div>
      <button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 px-3 py-2 text-xs font-body text-accent hover:bg-accent/5">
        <Plus className="h-3.5 w-3.5" /> {ar ? "إضافة موظف" : "Add employee"}
      </button>
    </div>
  );
}