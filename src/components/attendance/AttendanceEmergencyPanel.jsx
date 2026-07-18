import React, { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";

const toLocalInput = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const defaultWindow = () => {
  const start = new Date();
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + 60 * 60000);
  return { start: toLocalInput(start.toISOString()), end: toLocalInput(end.toISOString()), active: false };
};

export default function AttendanceEmergencyPanel({ company }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [window, setWindow] = useState(defaultWindow);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => base44.functions.invoke("supabaseAttendance", { action: "getSettings", companyId: company.id }).then(({ data }) => {
    const start = toLocalInput(data?.settings?.emergency_start_at);
    const end = toLocalInput(data?.settings?.emergency_end_at);
    setWindow(start && end && new Date(end) > new Date(start)
      ? { start, end, active: !!data?.settings?.emergency_active }
      : defaultWindow());
  });
  useEffect(() => { load(); }, [company.id]);

  const save = async (event) => {
    event.preventDefault();
    const start = new Date(window.start);
    const end = new Date(window.end);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setMessage(ar ? "يجب أن يكون وقت النهاية بعد وقت البداية." : "End time must be after start time.");
      return;
    }
    setSaving(true); setMessage("");
    try {
      await base44.functions.invoke("supabaseAttendance", { action: "setAttendanceEmergency", companyId: company.id, startAt: start.toISOString(), endAt: end.toISOString() });
      await load(); setMessage(ar ? "تم حفظ فترة الاستثناء." : "Emergency window saved.");
    } catch (error) {
      const code = error?.response?.data?.error;
      setMessage(code === "Invalid emergency time range" && ar ? "يجب أن يكون وقت النهاية بعد وقت البداية." : (code || (ar ? "تعذر حفظ الاستثناء." : "Unable to save the emergency window.")));
    } finally { setSaving(false); }
  };

  const cancel = async () => {
    setSaving(true); setMessage("");
    try { await base44.functions.invoke("supabaseAttendance", { action: "clearAttendanceEmergency", companyId: company.id }); await load(); }
    catch (error) { setMessage(error?.response?.data?.error || (ar ? "تعذر إلغاء الاستثناء." : "Unable to cancel the exception.")); }
    finally { setSaving(false); }
  };

  return <form onSubmit={save} className="space-y-4 rounded-xl border border-amber-300 bg-amber-50/60 p-5">
    <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" /><div><h3 className="font-heading text-lg font-semibold">{ar ? "استثناء الموقع للطوارئ" : "Emergency location exception"}</h3><p className="text-xs text-muted-foreground">{ar ? "يلغي شرط الموقع مؤقتًا لجميع موظفي الشركة، ثم يعود تلقائيًا." : "Temporarily removes the location requirement company-wide, then restores it automatically."}</p></div></div>
    {window.active && <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800">{ar ? "الاستثناء الطارئ نشط الآن." : "The emergency exception is active now."}</p>}
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-muted-foreground">{ar ? "وقت البداية" : "Start time"}<input required type="datetime-local" value={window.start} onChange={(e) => { const start = e.target.value; const end = !window.end || new Date(window.end) <= new Date(start) ? toLocalInput(new Date(new Date(start).getTime() + 60 * 60000).toISOString()) : window.end; setWindow({ ...window, start, end }); setMessage(""); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label><label className="text-xs text-muted-foreground">{ar ? "وقت النهاية" : "End time"}<input required type="datetime-local" min={window.start} value={window.end} onChange={(e) => { setWindow({ ...window, end: e.target.value }); setMessage(""); }} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label></div>
    {message && <p className="text-xs text-foreground">{message}</p>}
    <div className="flex gap-2"><button disabled={saving} className="rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (ar ? "حفظ الفترة" : "Save window")}</button>{window.active && <button type="button" disabled={saving} onClick={cancel} className="rounded-md border px-4 py-2 text-sm">{ar ? "إلغاء الآن" : "Cancel now"}</button>}</div>
  </form>;
}