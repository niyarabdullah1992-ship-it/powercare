/** Daily task quota — each calendar day is its own bucket (no rollover). */

export function localTodayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function readDailyTaskQuota(data, stationId) {
  const settings = data?.settings || {};
  const byStation = settings.dailyTaskQuotaByStation || {};
  if (stationId && stationId !== "all" && byStation[stationId] != null) {
    return Math.max(0, Number(byStation[stationId]) || 0);
  }
  return Math.max(0, Number(settings.dailyTaskQuota) || 0);
}

export function taskClosedOnDay(task, dayKey) {
  const stamps = [
    task.approvedAt,
    task.completedAt,
    task.closedAt,
    task.status === "completed" ? task.updatedAt : null,
  ];
  return stamps.some((iso) => iso && String(iso).slice(0, 10) === dayKey);
}

export function countCompletedOnDay(tasks, dayKey, stationId) {
  return (tasks || []).filter((task) => {
    if (stationId && stationId !== "all") {
      const sid = task.stationId || task.station_id;
      if (sid && String(sid) !== String(stationId)) return false;
    }
    return taskClosedOnDay(task, dayKey);
  }).length;
}

export function deriveDailyTaskQuota({ tasks, data, stationId, today = new Date() }) {
  const dayKey = localTodayKey(today);
  const quota = readDailyTaskQuota(data, stationId);
  const done = countCompletedOnDay(tasks, dayKey, stationId);
  const remaining = Math.max(0, quota - done);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return {
    dayKey,
    quota,
    done,
    remaining,
    met: quota > 0 && done >= quota,
    monthExpected: quota > 0 ? quota * daysInMonth : 0,
    daysInMonth,
  };
}
