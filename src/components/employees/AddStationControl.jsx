import React, { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { updateCompany } from "@/lib/store";
import { canAddStation } from "@/lib/planLimits";
import StationLocationEditor from "@/components/stations/StationLocationEditor";

const empty = { name: "", location: "", type: "", lat: null, lng: null, radiusMeters: null };
export default function AddStationControl({ company, data, canManage, t }) {
  const [open, setOpen] = useState(false); const [picking, setPicking] = useState(false); const [form, setForm] = useState(empty);
  if (!canManage) return null;
  const limited = !canAddStation(company, data);
  const add = (event) => {
    event.preventDefault(); if (limited) return;
    updateCompany(company.id, (draft) => draft.stations.push({ id: `st_${Math.random().toString(36).slice(2, 9)}`, ...form, status: "active", managerId: null, createdAt: new Date().toISOString() }));
    setForm(empty); setOpen(false); setPicking(false);
  };
  return <div className="rounded-xl border border-border bg-card p-4"><button disabled={limited} onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"><Plus className="h-4 w-4" />{t("addStation")}</button>{limited && <p className="mt-2 text-xs text-amber-700">{t("stationLimitReached")}</p>}{open && !limited && <form onSubmit={add} className="mt-4 grid gap-3 md:grid-cols-3"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("stationName")} className="rounded-md border border-input px-3 py-2 text-sm" /><input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t("location")} className="rounded-md border border-input px-3 py-2 text-sm" /><input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder={t("stationType")} className="rounded-md border border-input px-3 py-2 text-sm" /><div className="md:col-span-3"><button type="button" onClick={() => setPicking(true)} className="flex items-center gap-1.5 text-xs text-accent"><MapPin className="h-3.5 w-3.5" />{form.lat != null ? t("editLocation") : t("setLocation")}</button></div><div className="flex gap-2 md:col-span-3"><button className="rounded-md bg-foreground px-4 py-2 text-sm text-background">{t("save")}</button><button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm">{t("cancel")}</button></div></form>}{picking && <StationLocationEditor t={t} station={form} onSave={(coords) => { setForm({ ...form, ...coords }); setPicking(false); }} onCancel={() => setPicking(false)} />}</div>;
}