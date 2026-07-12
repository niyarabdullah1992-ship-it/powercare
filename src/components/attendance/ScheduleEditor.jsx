import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save } from "lucide-react";

const DAY_KEYS = ["daySun", "dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"];
const DEFAULT_DAYS = [0, 1, 2, 3, 4]; // Sun–Thu

function ScheduleRow({ employee, initial, companyId, t, onSaved }) {
  const [startTime, setStartTime] = useState(initial?.start_time || "08:00");
  const [endTime, setEndTime] = useState(initial?.end_time || "17:00");
  const [days, setDays] = useState(
    initial?.working_days ? initial.working_days.split(",").map(Number) : DEFAULT_DAYS
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleDay = (d) => {
    setSaved(false);
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("supabaseAttendance", {
        action: "upsertSchedule",
        userRole: "director",
        employeeId: employee.id,
        companyId,
        startTime,
        endTime,
        workingDays: days,
      });
      setSaved(true);
      onSaved?.();
    } catch {
      // best-effort
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-border/60">
      <td className="py-2 pe-3">{employee.name}</td>
      <td className="py-2 pe-3">
        <input type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); setSaved(false); }} className="px-2 py-1 rounded-md border border-input text-xs font-body" />
      </td>
      <td className="py-2 pe-3">
        <input type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); setSaved(false); }} className="px-2 py-1 rounded-md border border-input text-xs font-body" />
      </td>
      <td className="py-2 pe-3">
        <div className="flex flex-wrap gap-1">
          {DAY_KEYS.map((key, d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-body border transition ${days.includes(d) ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}
            >
              {t(key).slice(0, 3)}
            </button>
          ))}
        </div>
      </td>
      <td className="py-2 pe-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {t("saveSchedule")}
        </button>
        {saved && <span className="ms-1.5 text-xs text-emerald-600">✓</span>}
      </td>
    </tr>
  );
}

// Manager-only: define each employee's shift start/end time and working days.
// Check-ins are compared against this schedule (falls back to company defaults if unset).
export default function ScheduleEditor({ employees, company, t }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!employees.length) { setSchedules([]); setLoading(false); return; }
    setLoading(true);
    base44.functions.invoke("supabaseAttendance", { action: "listSchedules", employeeIds: employees.map((e) => e.id) })
      .then((res) => setSchedules(res?.data?.schedules || []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.map((e) => e.id).join(",")]);

  const byEmployee = Object.fromEntries(schedules.map((s) => [s.employee_id, s]));

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="font-heading text-lg font-semibold">{t("workSchedule")}</h3>
      <p className="text-xs text-muted-foreground font-body">{t("manageScheduleNoteAttendance")}</p>
      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noAttendanceRecords")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-start text-xs text-muted-foreground border-b border-border">
                <th className="py-2 pe-3 text-start">{t("employeeName")}</th>
                <th className="py-2 pe-3 text-start">{t("workStartTime")}</th>
                <th className="py-2 pe-3 text-start">{t("workEndTime")}</th>
                <th className="py-2 pe-3 text-start">{t("workingDaysLabel")}</th>
                <th className="py-2 pe-3 text-start"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <ScheduleRow key={e.id} employee={e} initial={byEmployee[e.id]} companyId={company.id} t={t} onSaved={load} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}