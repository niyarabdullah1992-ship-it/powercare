import React, { useState } from "react";
import { Sun, Sunset, Moon, Pencil, Trash2, Check } from "lucide-react";
import { updateShiftType, removeShiftType } from "@/lib/store";

const ICONS = [Sun, Sunset, Moon];

export default function ShiftTypeEditor({ companyId, stationId, shiftType, index, canManage }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ label: shiftType.label, start: shiftType.start, end: shiftType.end });
  const Icon = ICONS[index % ICONS.length];

  const save = (e) => {
    e.preventDefault();
    updateShiftType(companyId, stationId, shiftType.id, form);
    setEditing(false);
  };

  if (editing) {
    return (
      <form onSubmit={save} className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-accent bg-white shadow-sm">
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="w-24 text-xs font-body border-b border-input focus:outline-none bg-transparent"
        />
        <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="text-xs font-body border-b border-input focus:outline-none w-[85px] bg-transparent" />
        <span className="text-xs text-muted-foreground">–</span>
        <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="text-xs font-body border-b border-input focus:outline-none w-[85px] bg-transparent" />
        <button type="submit" className="text-accent hover:opacity-70"><Check className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => { removeShiftType(companyId, stationId, shiftType.id); setEditing(false); }} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => canManage && setEditing(true)}
      className="flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-white shadow-sm text-xs font-body hover:border-accent transition-colors"
    >
      <Icon className="w-3.5 h-3.5 text-accent" />
      <span className="font-semibold">{shiftType.label}</span>
      <span className="text-muted-foreground">{shiftType.start} – {shiftType.end}</span>
      {canManage && <Pencil className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
}