import React, { useState } from "react";
import { Users, Plus, Trash2, IdCard, Car, X } from "lucide-react";

const EMPTY_VEHICLE = { type: "", plate: "" };
const EMPTY = { name: "", idNumber: "", vehicles: [{ ...EMPTY_VEHICLE }] };

// الموظفون الذين دخلوا لدى الجهة: الاسم، رقم الهوية، وسيارة أو أكثر لكل موظف.
export default function ProofCrewEditor({ value = [], onChange, employees = [], ar }) {
  const [row, setRow] = useState(EMPTY);
  const set = (key) => (event) => setRow((current) => ({ ...current, [key]: event.target.value }));

  const setVehicle = (index, key) => (event) =>
    setRow((current) => ({
      ...current,
      vehicles: current.vehicles.map((vehicle, i) => (i === index ? { ...vehicle, [key]: event.target.value } : vehicle)),
    }));

  const addVehicle = () => setRow((current) => ({ ...current, vehicles: [...current.vehicles, { ...EMPTY_VEHICLE }] }));
  const removeVehicle = (index) => setRow((current) => ({ ...current, vehicles: current.vehicles.filter((_, i) => i !== index) }));

  const add = () => {
    if (!row.name.trim()) return;
    const vehicles = row.vehicles.filter((vehicle) => vehicle.type.trim() || vehicle.plate.trim());
    onChange([...value, { ...row, vehicles, id: `crew_${Date.now()}` }]);
    setRow({ ...EMPTY, vehicles: [{ ...EMPTY_VEHICLE }] });
  };

  const vehiclesOf = (crew) => (crew.vehicles?.length ? crew.vehicles : crew.vehicleType || crew.plate ? [{ type: crew.vehicleType, plate: crew.plate }] : []);

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Users className="h-3.5 w-3.5" /> {ar ? "الموظفون الذين دخلوا لدى الجهة" : "Employees who entered the client site"}
        <span className="text-muted-foreground">({value.length})</span>
      </p>

      {value.map((crew) => (
        <div key={crew.id} className="flex items-start justify-between gap-2 rounded-md border border-border p-2 text-xs font-body">
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium text-foreground">{crew.name}</p>
            {crew.idNumber && (
              <p className="inline-flex items-center gap-1 text-muted-foreground"><IdCard className="h-3 w-3" /><span dir="ltr">{crew.idNumber}</span></p>
            )}
            {vehiclesOf(crew).map((vehicle, index) => (
              <p key={index} className="inline-flex items-center gap-1 text-muted-foreground">
                <Car className="h-3 w-3" />{vehicle.type}{vehicle.plate ? ` · ${vehicle.plate}` : ""}
              </p>
            ))}
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
      </div>

      <div className="space-y-2">
        {row.vehicles.map((vehicle, index) => (
          <div key={index} className="flex items-center gap-2">
            <input value={vehicle.type} onChange={setVehicle(index, "type")} placeholder={ar ? "نوع السيارة" : "Vehicle type"} className="min-w-0 flex-1 rounded-md border border-input px-3 py-2 text-sm text-foreground" />
            <input value={vehicle.plate} onChange={setVehicle(index, "plate")} placeholder={ar ? "رقم اللوحة" : "Plate number"} dir="ltr" className="min-w-0 flex-1 rounded-md border border-input px-3 py-2 text-sm text-foreground" />
            {row.vehicles.length > 1 && (
              <button type="button" onClick={() => removeVehicle(index)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={addVehicle} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-body text-muted-foreground hover:border-accent/40 hover:text-accent">
          <Car className="h-3.5 w-3.5" /><Plus className="h-3 w-3" /> {ar ? "سيارة أخرى" : "Another vehicle"}
        </button>
      </div>

      <button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 px-3 py-2 text-xs font-body text-accent hover:bg-accent/5">
        <Plus className="h-3.5 w-3.5" /> {ar ? "إضافة موظف" : "Add employee"}
      </button>
    </div>
  );
}