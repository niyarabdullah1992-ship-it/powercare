import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Owner/director-only panel — configure the work start time, late threshold, and
// whether GPS is requested at check-in (and whether it's mandatory or flexible).
export default function AttendanceSettingsPanel({ company, currentUser, t }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.functions.invoke("supabaseAttendance", { action: "getSettings", companyId: company.id })
      .then((res) => setSettings(res?.data?.settings))
      .catch(() => setSettings(null));
  }, [company?.id]);

  if (!settings) return null;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await base44.functions.invoke("supabaseAttendance", {
        action: "updateSettings",
        companyId: company.id,
        userRole: currentUser.role,
        workStartTime: settings.work_start_time,
        lateThresholdMinutes: settings.late_threshold_minutes,
        gpsEnabled: true,
        gpsRequired: true,
      });
      if (res?.data?.settings) setSettings(res.data.settings);
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="p-5 rounded-xl border border-border bg-card space-y-4">
      <h3 className="font-heading text-lg font-semibold">{t("attendanceSettings")}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground font-body block mb-1">{t("workStartTime")}</label>
          <input
            type="time"
            value={settings.work_start_time || "08:00"}
            onChange={(e) => setSettings({ ...settings, work_start_time: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-input text-sm font-body"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-body block mb-1">{t("lateThresholdMinutes")}</label>
          <input
            type="number" min="0"
            value={settings.late_threshold_minutes ?? 15}
            onChange={(e) => setSettings({ ...settings, late_threshold_minutes: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-input text-sm font-body"
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground font-body">{t("gpsNote")}</p>

      {error && <p className="text-xs text-destructive font-body whitespace-pre-wrap break-words">{error}</p>}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-body disabled:opacity-50">
          {t("saveSettings")}
        </button>
        {saved && <span className="text-xs text-emerald-600 font-body">✓</span>}
      </div>
    </form>
  );
}