import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { visibleStations } from "@/lib/permissions";
import { useAuth } from "@/lib/PowerCareAuth";
import { deriveTeamAttendanceToday } from "@/lib/attendance";
import { listLocalTodayAttendance, mergeAttendanceRows } from "@/lib/localAttendanceFallback";
import { stationIdForTreeEmployee } from "@/lib/orgTree";
import QuickCheckInCard from "@/components/attendance/QuickCheckInCard";
import CommandGlanceBoard, { buildCommandGlance } from "@/components/dashboard/CommandGlanceBoard";

/**
 * Station-manager Command Center — same board language as exec, station-scoped.
 */
export default function StationManagerDashboard({ user, data }) {
  const { lang } = useI18n();
  const { company } = useAuth();
  const [attendanceRows, setAttendanceRows] = useState([]);
  const stations = visibleStations(user, data);
  const stationIds = new Set(stations.map((s) => s.id));

  const defaultStationId = data.stations?.[0]?.id || null;
  const team = (data.employees || []).filter((employee) =>
    stationIds.has(stationIdForTreeEmployee(data, employee.id) || employee.stationId || defaultStationId),
  );
  const tasks = (data.tasks || []).filter((tk) => stationIds.has(tk.stationId));
  const reports = (data.reports || []).filter((r) => stationIds.has(r.stationId));

  useEffect(() => {
    const apply = (cloudRows) => {
      setAttendanceRows(mergeAttendanceRows(cloudRows || [], listLocalTodayAttendance(company?.id, data)));
    };
    if (!team.length) {
      apply([]);
      return undefined;
    }
    const load = () => {
      base44.functions
        .invoke("supabaseAttendance", { action: "listDaily", employeeIds: team.map((e) => e.id) })
        .then((res) => apply(res?.data?.rows || []))
        .catch(() => apply([]));
    };
    load();
    window.addEventListener("attendance-updated", load);
    return () => window.removeEventListener("attendance-updated", load);
  }, [team.map((e) => e.id).join(","), company?.id, data?.personalAttendance?.length]);

  const mergedAttendanceRows = mergeAttendanceRows(
    attendanceRows,
    listLocalTodayAttendance(company?.id, data),
  );
  const todayAtt = deriveTeamAttendanceToday(team, mergedAttendanceRows, data);

  const glance = buildCommandGlance({
    lang,
    tasks,
    employees: team,
    attendanceRows: mergedAttendanceRows,
    reports: [
      ...reports,
      ...(data.anonymousReports || []).filter((row) => stationIds.has(row.stationId)),
    ],
    proofs: (data.workProofs || []).filter((proof) => stationIds.has(proof.stationId)),
    present: todayAtt.presentLike,
    scheduled: todayAtt.scheduled,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <CommandGlanceBoard lang={lang} {...glance} />
      <QuickCheckInCard currentUser={user} company={company} />
    </div>
  );
}
