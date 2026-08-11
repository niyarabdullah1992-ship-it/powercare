/** Client mirror of base44/shared/shiftDerivations.ts — keep in sync. */

export function minutesBetween(start, end) {
  const [sh, sm] = String(start || "0:0").split(":").map(Number);
  const [eh, em] = String(end || "0:0").split(":").map(Number);
  let m = (eh * 60 + em) - (sh * 60 + sm);
  if (m < 0) m += 1440;
  return m;
}

export function dateKey(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function weekIndex(year, monthIndex, day) {
  return Math.floor((day - 1 + new Date(year, monthIndex, 1).getDay()) / 7);
}

function weekLength(year, monthIndex, w) {
  const days = daysInMonth(year, monthIndex);
  let n = 0;
  for (let d = 1; d <= days; d++) if (weekIndex(year, monthIndex, d) === w) n++;
  return n;
}

function cellOf(assignments, year, monthIndex, day, shiftId) {
  const key = dateKey(year, monthIndex, day);
  return Array.isArray(assignments?.[key]?.[shiftId]) ? assignments[key][shiftId] : [];
}

function spansOf(employeeId, shiftTypes, assignments, year, monthIndex) {
  const out = [];
  const days = daysInMonth(year, monthIndex);
  for (let d = 1; d <= days; d++) {
    for (const st of shiftTypes) {
      if (!cellOf(assignments, year, monthIndex, d, st.id).includes(employeeId)) continue;
      const a = String(st.start).split(":").map(Number);
      const b = String(st.end).split(":").map(Number);
      const start = (d - 1) * 1440 + a[0] * 60 + a[1];
      let end = (d - 1) * 1440 + b[0] * 60 + b[1];
      if (end <= start) end += 1440;
      out.push({ d, label: st.label || st.id, start, end });
    }
  }
  return out.sort((x, y) => x.start - y.start);
}

export function checkPublishGates({
  year,
  monthIndex,
  shiftTypes = [],
  assignments = {},
  onLeaveIds = [],
  restDow = 5,
  namesById = {},
}) {
  const onLeave = new Set([...onLeaveIds].map(String));
  const days = daysInMonth(year, monthIndex);

  let filled = 0;
  let staffable = 0;
  for (let d = 1; d <= days; d++) {
    const restDay = new Date(year, monthIndex, d).getDay() === restDow;
    for (const st of shiftTypes) {
      const ids = cellOf(assignments, year, monthIndex, d, st.id).filter((id) => !onLeave.has(id));
      if (restDay) continue;
      staffable++;
      if (ids.length) filled++;
    }
  }
  const openCells = Math.max(0, staffable - filled);
  const coveragePct = staffable ? Math.round((filled / staffable) * 100) : 0;

  const wMin = {};
  const wDays = {};
  const assignedIds = new Set();

  for (let d = 1; d <= days; d++) {
    const w = weekIndex(year, monthIndex, d);
    for (const st of shiftTypes) {
      for (const id of cellOf(assignments, year, monthIndex, d, st.id)) {
        if (onLeave.has(id)) continue;
        assignedIds.add(id);
        wMin[id] = wMin[id] || {};
        wDays[id] = wDays[id] || {};
        wMin[id][w] = (wMin[id][w] || 0) + minutesBetween(st.start, st.end);
        (wDays[id][w] = wDays[id][w] || new Set()).add(d);
      }
    }
  }

  const weeklyMaxHours = Math.round(Math.max(0, ...Object.values(wMin).flatMap((o) => Object.values(o)), 0) / 60);

  let restBreach11 = null;
  for (const id of assignedIds) {
    const sp = spansOf(id, shiftTypes, assignments, year, monthIndex);
    for (let i = 1; i < sp.length; i++) {
      const gap = sp[i].start - sp[i - 1].end;
      if (gap < 11 * 60) {
        restBreach11 = {
          name: namesById[id] || id,
          gap: Math.max(0, Math.round(gap / 60)),
          from: { label: sp[i - 1].label, d: sp[i - 1].d },
          to: { label: sp[i].label, d: sp[i].d },
        };
        break;
      }
    }
    if (restBreach11) break;
  }

  let doubleOk = true;
  for (let i = 0; i < shiftTypes.length; i++) {
    for (let j = i + 1; j < shiftTypes.length; j++) {
      for (let d = 1; d <= days; d++) {
        const A = cellOf(assignments, year, monthIndex, d, shiftTypes[i].id);
        const B = cellOf(assignments, year, monthIndex, d, shiftTypes[j].id);
        if (A.some((x) => B.includes(x) && !onLeave.has(x))) {
          doubleOk = false;
          break;
        }
      }
      if (!doubleOk) break;
    }
    if (!doubleOk) break;
  }

  const noRest = Object.entries(wDays).filter(([, o]) =>
    Object.entries(o).some(([w, set]) => weekLength(year, monthIndex, Number(w)) === 7 && set.size >= 7),
  );
  const restBreachName = noRest.length ? namesById[noRest[0][0]] || noRest[0][0] : "";
  const restOk = !restBreachName;

  const leaveOnMatrix = [];
  for (let d = 1; d <= days; d++) {
    for (const st of shiftTypes) {
      for (const id of cellOf(assignments, year, monthIndex, d, st.id)) {
        if (onLeave.has(id) && !leaveOnMatrix.includes(id)) leaveOnMatrix.push(id);
      }
    }
  }

  const checks = [
    {
      id: "hours_48",
      ok: weeklyMaxHours <= 48,
      labelAr: `أعلى حمل أسبوعي ${weeklyMaxHours} ساعة من حد 48`,
      labelEn: `Heaviest weekly load ${weeklyMaxHours} h against the 48 h cap`,
    },
    {
      id: "rest_11h",
      ok: doubleOk && !restBreach11,
      labelAr: !doubleOk
        ? "موظف مسند إلى ورديتين في يوم واحد"
        : restBreach11
          ? `${restBreach11.name}: ${restBreach11.gap} ساعة فقط بين ورديتين`
          : "راحة 11 ساعة بين ورديتين",
      labelEn: !doubleOk
        ? "Someone is assigned two shifts in one day"
        : restBreach11
          ? `${restBreach11.name}: only ${restBreach11.gap} h between shifts`
          : "11 h rest between shifts",
    },
    {
      id: "weekly_rest",
      ok: restOk,
      labelAr: restOk ? "راحة أسبوعية 24 ساعة متصلة" : `${restBreachName} بلا يوم راحة`,
      labelEn: restOk ? "24 h continuous weekly rest" : `${restBreachName} has no rest day`,
    },
    {
      id: "coverage",
      ok: openCells === 0,
      labelAr: openCells === 0 ? "كل ورديات الشهر مُسندة" : `${openCells} خلية بلا إسناد`,
      labelEn: openCells === 0 ? "Every shift this month is assigned" : `${openCells} unassigned cells`,
    },
    {
      id: "leave_excluded",
      ok: leaveOnMatrix.length === 0,
      labelAr: leaveOnMatrix.length
        ? `${leaveOnMatrix.length} على إجازة ما زالوا في الإسناد`
        : `${onLeave.size} على إجازة معتمدة — مستبعدون`,
      labelEn: leaveOnMatrix.length
        ? `${leaveOnMatrix.length} on leave still assigned`
        : `${onLeave.size} on approved leave — excluded`,
    },
  ];

  const failed = checks.find((c) => !c.ok) || null;
  return { checks, blocked: !!failed, failed, openCells, weeklyMaxHours, coveragePct };
}
