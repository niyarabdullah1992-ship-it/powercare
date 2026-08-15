import React, { useEffect, useState } from "react";
import { Loader2, MapPin, MapPinOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { canManageStations } from "@/lib/permissions";
import { isLocalPreviewActive } from "@/lib/localPreview";
import { localAttendanceSettings } from "@/lib/localAttendanceFallback";
import StationLocationEditor from "@/components/stations/StationLocationEditor";
import { useI18n } from "@/lib/i18n";
import {
  ACCENT,
  BORDER,
  DANGER,
  MUTED,
  NAVY,
  OK,
  SURFACE,
  WARN,
  field,
  labelMuted,
  tableShell,
  ui,
} from "@/lib/platformStyles";

const sectionHead = { fontSize: 13, fontWeight: 600, color: NAVY, margin: 0 };
const sectionNote = { fontSize: 11, color: MUTED, margin: "4px 0 0", lineHeight: 1.55 };
const divider = { borderTop: `1px solid ${BORDER}`, margin: "14px 0" };

function previewSettings(company) {
  return {
    ...localAttendanceSettings(),
    work_start_time: "08:00",
    late_threshold_minutes: 15,
    gps_required: false,
    ...(company?.attendanceSettings || {}),
  };
}

function ToggleRow({ icon: Icon, title, note, enabled, onToggle, busy, ar, enableLabel, disableLabel }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 12, padding: "10px 0" }}>
      <Icon style={{ width: 16, height: 16, color: enabled ? ACCENT : DANGER, marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
        <p style={sectionHead}>{title}</p>
        <p style={sectionNote}>{note}</p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onToggle}
        style={{
          ...(enabled ? ui.btnDanger : ui.btnPrimary),
          opacity: busy ? 0.5 : 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {busy ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : null}
        {enabled ? disableLabel : enableLabel}
      </button>
    </div>
  );
}

/** Unified attendance settings — platform chrome, one shell. */
export default function AttendanceSettingsBoard({ company, currentUser, t, canEditSettings }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const local = isLocalPreviewActive();

  useEffect(() => {
    if (!company?.id) return;
    if (local) {
      setSettings(previewSettings(company));
      return;
    }
    base44.functions
      .invoke("supabaseAttendance", { action: "getSettings", companyId: company.id })
      .then((res) => setSettings(res?.data?.settings || previewSettings(company)))
      .catch(() => setSettings(previewSettings(company)));
  }, [company?.id, local]);

  if (!settings || !data) {
    return (
      <div style={{ ...tableShell, padding: 24, textAlign: "center", fontSize: 12, color: MUTED }}>
        {ar ? "جاري التحميل…" : "Loading…"}
      </div>
    );
  }

  const locationEnabled = settings.gps_enabled === true;
  const scheduleEnabled = settings.schedule_required !== false;
  const stationList = data.stations || [];
  const stations = canManageStations(currentUser, data)
    ? stationList
    : stationList.filter((s) => s.managerId === currentUser.id || currentUser.stationId === s.id);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      if (local) {
        persistLocalPolicy({});
        setSaved(true);
        return;
      }
      const res = await base44.functions.invoke("supabaseAttendance", {
        action: "updateSettings",
        companyId: company.id,
        userRole: currentUser.role,
        workStartTime: settings.work_start_time,
        lateThresholdMinutes: settings.late_threshold_minutes,
        gpsEnabled: settings.gps_enabled === true,
        gpsRequired: settings.gps_required === true,
      });
      if (res?.data?.settings) setSettings(res.data.settings);
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.error || (ar ? "تعذر الحفظ" : "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const persistLocalPolicy = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    updateCompany(company.id, (d) => {
      d.attendanceSettings = {
        ...(d.attendanceSettings || {}),
        gps_enabled: next.gps_enabled === true,
        gps_required: next.gps_required === true,
        schedule_required: next.schedule_required !== false,
        work_start_time: next.work_start_time || "08:00",
        late_threshold_minutes: next.late_threshold_minutes ?? 15,
      };
    });
  };

  const toggleLocation = async () => {
    const next = !locationEnabled;
    setSaving(true);
    setMessage("");
    try {
      if (local) {
        persistLocalPolicy({ gps_enabled: next, gps_required: next });
        setMessage(ar ? "تم تحديث شرط الموقع." : "Location requirement updated.");
        return;
      }
      const { data: res } = await base44.functions.invoke("supabaseAttendance", {
        action: "updateSettings",
        companyId: company.id,
        workStartTime: settings.work_start_time || "08:00",
        lateThresholdMinutes: settings.late_threshold_minutes ?? 15,
        gpsEnabled: next,
        gpsRequired: next,
      });
      await base44.functions.invoke("supabaseAttendance", { action: "clearAttendanceEmergency", companyId: company.id });
      setSettings(res?.settings || { ...settings, gps_enabled: next, gps_required: next });
      setMessage(ar ? "تم تحديث شرط الموقع." : "Location requirement updated.");
    } catch (err) {
      setMessage(err?.response?.data?.error || (ar ? "تعذر التحديث." : "Update failed."));
    } finally {
      setSaving(false);
    }
  };

  const toggleSchedule = async () => {
    setSaving(true);
    setMessage("");
    try {
      if (local) {
        persistLocalPolicy({ schedule_required: !scheduleEnabled });
        setMessage(ar ? "تم تحديث شرط الجدول." : "Schedule requirement updated.");
        return;
      }
      const { data: res } = await base44.functions.invoke("supabaseAttendance", {
        action: "setScheduleRequirement",
        companyId: company.id,
        scheduleRequired: !scheduleEnabled,
      });
      setSettings({ ...settings, schedule_required: res?.scheduleRequired !== false });
      setMessage(ar ? "تم تحديث شرط الجدول." : "Schedule requirement updated.");
    } catch (err) {
      setMessage(err?.response?.data?.error || (ar ? "تعذر التحديث." : "Update failed."));
    } finally {
      setSaving(false);
    }
  };

  const saveLocation = (id, coords) => {
    updateCompany(company.id, (d) => {
      const s = d.stations.find((x) => x.id === id);
      if (s) {
        s.lat = coords.lat;
        s.lng = coords.lng;
        s.radiusMeters = coords.radiusMeters;
      }
    });
    setEditingId(null);
  };

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}
      dir={ar ? "rtl" : "ltr"}
    >
      <section style={tableShell}>
        <div style={{ padding: "11px 14px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{t("attendanceSettings")}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
            {ar ? "افتراضي يدوي · شغّل شرط الموقع إن أردت التحقق من الفرع" : "Manual by default · turn on location to verify the station"}
          </div>
        </div>
        <div style={{ padding: "12px 14px" }}>
          <ToggleRow
            icon={locationEnabled ? MapPin : MapPinOff}
            title={ar ? "شرط الموقع" : "Location requirement"}
            note={
              locationEnabled
                ? (ar ? "يجب أن يكون الموظف داخل موقع الفرع لوضع حضر. حدّد مواقع الفروع في العمود المجاور." : "Employees must be at the station to mark Present. Set station locations in the other column.")
                : (ar ? "التسجيل يدوي: إذا حضر يضع حضر. الموقع غير مطلوب." : "Manual punch: mark Present on arrival. Location is not required.")
            }
            enabled={locationEnabled}
            onToggle={toggleLocation}
            busy={saving}
            ar={ar}
            enableLabel={ar ? "تشغيل" : "Enable"}
            disableLabel={ar ? "إيقاف" : "Disable"}
          />
          <ToggleRow
            icon={MapPin}
            title={ar ? "شرط جدول اليوم" : "Today's schedule requirement"}
            note={
              scheduleEnabled
                ? (ar ? "يجب إدراج الموظف في جدول اليوم للبصمة." : "Employees must be on today's schedule to punch.")
                : (ar ? "البصمة مسموحة دون إدراج في الجدول." : "Punch allowed without schedule listing.")
            }
            enabled={scheduleEnabled}
            onToggle={toggleSchedule}
            busy={saving}
            ar={ar}
            enableLabel={ar ? "تشغيل" : "Enable"}
            disableLabel={ar ? "إيقاف" : "Disable"}
          />
          {message ? <p style={{ margin: "8px 0 0", fontSize: 11, color: ACCENT }}>{message}</p> : null}

          {canEditSettings && (
            <>
              <div style={divider} />
              <form onSubmit={saveSettings}>
                <p style={{ ...sectionHead, marginBottom: 10 }}>{ar ? "أوقات الدوام" : "Work times"}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
                  <div>
                    <label style={labelMuted}>{t("workStartTime")}</label>
                    <input
                      type="time"
                      value={settings.work_start_time || "08:00"}
                      onChange={(e) => setSettings({ ...settings, work_start_time: e.target.value })}
                      style={field}
                    />
                  </div>
                  <div>
                    <label style={labelMuted}>{t("lateThresholdMinutes")}</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.late_threshold_minutes ?? 15}
                      onChange={(e) => setSettings({ ...settings, late_threshold_minutes: e.target.value })}
                      style={field}
                    />
                  </div>
                </div>
                <p style={{ ...sectionNote, marginTop: 10 }}>{t("gpsNote")}</p>
                {error ? <p style={{ margin: "8px 0 0", fontSize: 11, color: DANGER }}>{error}</p> : null}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                  <button type="submit" disabled={saving} style={{ ...ui.btnPrimary, opacity: saving ? 0.5 : 1 }}>
                    {t("saveSettings")}
                  </button>
                  {saved ? <span style={{ fontSize: 11, color: ACCENT }}>✓</span> : null}
                </div>
              </form>
            </>
          )}
        </div>
      </section>

      <section style={tableShell}>
        <div style={{ padding: "11px 14px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin style={{ width: 14, height: 14, color: ACCENT }} />
            <div>
              <p style={sectionHead}>{t("workplaceLocations")}</p>
              <p style={sectionNote}>{t("workplaceLocationsNote")}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {stations.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: MUTED }}>{ar ? "لا توجد فروع ظاهرة في نطاقك." : "No stations in your scope."}</p>
          ) : stations.map((s) => {
            const hasLocation = s.lat != null && s.lng != null;
            return (
              <div
                key={s.id}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  background: SURFACE,
                  padding: "10px 12px",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }} dir="auto">{s.name}</span>
                    {hasLocation ? (
                      <span style={OK}>
                        <CheckCircle2 style={{ width: 10, height: 10, display: "inline", verticalAlign: "middle" }} />
                        {" "}{t("locationSet")} · {s.radiusMeters || 200}{t("metersUnit")}
                      </span>
                    ) : (
                      <span style={WARN}>
                        <AlertTriangle style={{ width: 10, height: 10, display: "inline", verticalAlign: "middle" }} />
                        {" "}{t("locationNotSet")}
                      </span>
                    )}
                  </div>
                  {editingId !== s.id && (
                    <button type="button" onClick={() => setEditingId(s.id)} style={ui.btnGhost}>
                      {hasLocation ? t("editLocation") : t("setLocation")}
                    </button>
                  )}
                </div>
                {editingId === s.id && (
                  <div style={{ marginTop: 10 }}>
                    <StationLocationEditor
                      t={t}
                      station={s}
                      onSave={(coords) => saveLocation(s.id, coords)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
