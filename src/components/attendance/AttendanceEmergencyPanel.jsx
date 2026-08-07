import React, { useEffect, useState } from "react";
import { Loader2, MapPin, MapPinOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";

export default function AttendanceEmergencyPanel({ company }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const locationEnabled = settings?.gps_enabled !== false;
  const scheduleEnabled = settings?.schedule_required !== false;

  useEffect(() => {
    base44.functions.invoke("supabaseAttendance", { action: "getSettings", companyId: company.id })
      .then(({ data }) => setSettings(data?.settings || null));
  }, [company.id]);

  const toggleLocation = async () => {
    const next = !locationEnabled;
    setSaving(true);
    setMessage("");
    try {
      const { data } = await base44.functions.invoke("supabaseAttendance", {
        action: "updateSettings",
        companyId: company.id,
        workStartTime: settings?.work_start_time || "08:00",
        lateThresholdMinutes: settings?.late_threshold_minutes ?? 15,
        gpsEnabled: next,
        gpsRequired: next,
      });
      await base44.functions.invoke("supabaseAttendance", { action: "clearAttendanceEmergency", companyId: company.id });
      setSettings(data?.settings || { ...settings, gps_enabled: next, gps_required: next });
      setMessage(ar ? "تم تحديث شرط الموقع." : "Location requirement updated.");
    } catch (error) {
      setMessage(error?.response?.data?.error || (ar ? "تعذر تحديث شرط الموقع." : "Unable to update location requirement."));
    } finally {
      setSaving(false);
    }
  };

  const toggleSchedule = async () => {
    setSaving(true);
    setMessage("");
    try {
      const { data } = await base44.functions.invoke("supabaseAttendance", {
        action: "setScheduleRequirement",
        companyId: company.id,
        scheduleRequired: !scheduleEnabled,
      });
      setSettings({ ...settings, schedule_required: data?.scheduleRequired !== false });
      setMessage(ar ? "تم تحديث شرط الجدول." : "Schedule requirement updated.");
    } catch (error) {
      setMessage(error?.response?.data?.error || (ar ? "تعذر تحديث شرط الجدول." : "Unable to update schedule requirement."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        {locationEnabled ? <MapPin className="mt-0.5 h-5 w-5 text-accent" /> : <MapPinOff className="mt-0.5 h-5 w-5 text-destructive" />}
        <div className="flex-1">
          <h3 className="font-heading text-lg font-semibold">{ar ? "شرط الموقع" : "Location requirement"}</h3>
          <p className="text-xs text-muted-foreground">{locationEnabled ? (ar ? "يجب أن يكون الموظف داخل موقع العمل لتسجيل الحضور والانصراف." : "Employees must be at the workplace to check in or out.") : (ar ? "شرط الموقع متوقف لجميع موظفي الشركة." : "Location requirement is disabled for all company employees.")}</p>
        </div>
      </div>
      <div className="flex items-start gap-3 border-t border-border pt-4">
        <div className="flex-1">
          <h3 className="font-heading text-lg font-semibold">{ar ? "شرط جدول اليوم" : "Today's schedule requirement"}</h3>
          <p className="text-xs text-muted-foreground">{scheduleEnabled ? (ar ? "يجب إدراج الموظف في جدول اليوم لتسجيل الحضور." : "Employees must be listed on today's schedule to check in.") : (ar ? "يمكن للموظفين تسجيل الحضور دون إدراجهم في جدول اليوم." : "Employees can check in without being listed on today's schedule.")}</p>
        </div>
      </div>
      {message && <p className="text-xs text-foreground">{message}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={saving || !settings} onClick={toggleLocation} className={`rounded-md px-4 py-2 text-sm disabled:opacity-50 ${locationEnabled ? "bg-destructive text-destructive-foreground" : "bg-foreground text-background"}`}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : locationEnabled ? (ar ? "إيقاف شرط الموقع" : "Disable location requirement") : (ar ? "تشغيل شرط الموقع" : "Enable location requirement")}
        </button>
        <button type="button" disabled={saving || !settings} onClick={toggleSchedule} className={`rounded-md px-4 py-2 text-sm disabled:opacity-50 ${scheduleEnabled ? "bg-destructive text-destructive-foreground" : "bg-foreground text-background"}`}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : scheduleEnabled ? (ar ? "إيقاف شرط الجدول" : "Disable schedule requirement") : (ar ? "تشغيل شرط الجدول" : "Enable schedule requirement")}
        </button>
      </div>
    </div>
  );
}