import React, { useState } from "react";
import { updateCompany } from "@/lib/store";
import { levelName } from "@/lib/hrLevels";

export default function StationMemberForm({ company, data, station, lang, onDone }) {
  const ar = lang === "ar";
  const levels = (data.hrLevels || []).filter((level) => level.active !== false);
  const [form, setForm] = useState({ name: "", email: "", type: "employee", hrLevelId: levels[0]?.id || "" });
  const [error, setError] = useState("");
  const submit = (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    const allowed = (data.settings?.allowedEmails || []).map((item) => String(item).trim().toLowerCase());
    if ((data.employees || []).some((employee) => employee.email?.toLowerCase() === email)) return setError(ar ? "البريد مستخدم مسبقًا" : "Email already exists");
    if (allowed.length && !allowed.includes(email)) return setError(ar ? "البريد غير موجود في القائمة المسموحة" : "Email is not on the allowed list");
    updateCompany(company.id, (draft) => {
      const id = `emp_${Math.random().toString(36).slice(2, 9)}`;
      const employee = { id, name: form.name.trim(), email, role: form.type === "manager" ? "station_manager" : "employee", stationId: station.id, phone: "", anonymousId: `ANON-${Math.floor(Math.random() * 1e8).toString(16).toUpperCase().padStart(8, "0")}`, managedStations: form.type === "employee" ? [] : [station.id], profile: {}, createdAt: new Date().toISOString() };
      if (form.type === "hr") { employee.hrLevelId = form.hrLevelId; employee.hrStationId = station.id; }
      draft.employees.push(employee);
      if (form.type === "manager") { const target = draft.stations.find((item) => item.id === station.id); if (target) target.managerId = id; }
    });
    onDone();
  };
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-accent/30 bg-card p-5 md:grid-cols-2">
    <h2 className="font-heading text-xl font-semibold md:col-span-2">{ar ? "إضافة عضو للمحطة" : "Add station member"}</h2>
    <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={ar ? "اسم الموظف" : "Employee name"} className="rounded-md border border-input px-3 py-2 text-sm" />
    <input required type="email" value={form.email} onChange={(event) => { setError(""); setForm({ ...form, email: event.target.value }); }} placeholder={ar ? "البريد الإلكتروني" : "Email address"} className="rounded-md border border-input px-3 py-2 text-sm" />
    <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="rounded-md border border-input px-3 py-2 text-sm"><option value="employee">{ar ? "موظف" : "Employee"}</option><option value="hr" disabled={!levels.length}>HR</option><option value="manager">{ar ? "مدير المحطة" : "Station manager"}</option></select>
    {form.type === "hr" && <select required value={form.hrLevelId} onChange={(event) => setForm({ ...form, hrLevelId: event.target.value })} className="rounded-md border border-input px-3 py-2 text-sm">{levels.map((level) => <option key={level.id} value={level.id}>{levelName(level, lang)}</option>)}</select>}
    {!levels.length && <p className="text-xs text-muted-foreground md:col-span-2">{ar ? "أضف منصب HR أولًا من إعدادات الهيكل" : "Create an HR position in the hierarchy settings first"}</p>}
    {error && <p className="text-xs text-destructive md:col-span-2">{error}</p>}
    <div className="flex gap-2 md:col-span-2"><button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">{ar ? "حفظ" : "Save"}</button><button type="button" onClick={onDone} className="rounded-md border border-border px-4 py-2 text-sm">{ar ? "إلغاء" : "Cancel"}</button></div>
  </form>;
}