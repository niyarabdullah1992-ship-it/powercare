/** Shift / rota derivation — pre-publication statutory checks (Labour Law arts. 98, 101, 104).
 *  Design ref: NiroVera Platform.dc.html class Component (shifts / publishRota).
 */

export type ShiftType = { id: string; label?: string; start: string; end: string };

/** dateKey (YYYY-MM-DD) → shiftTypeId → employee ids */
export type DayAssignments = Record<string, Record<string, string[]>>;

export type RotaCheck = {
  id: string;
  ok: boolean;
  labelAr: string;
  labelEn: string;
  noteAr: string;
  noteEn: string;
};

export type PublishGateResult = {
  checks: RotaCheck[];
  blocked: boolean;
  failed: RotaCheck | null;
  openCells: number;
  weeklyMaxHours: number;
  coveragePct: number;
};

export function minutesBetween(start: string, end: string) {
  const [sh, sm] = String(start || "0:0").split(":").map(Number);
  const [eh, em] = String(end || "0:0").split(":").map(Number);
  let m = (eh * 60 + em) - (sh * 60 + sm);
  if (m < 0) m += 1440;
  return m;
}

export function dateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function weekIndex(year: number, monthIndex: number, day: number) {
  return Math.floor((day - 1 + new Date(year, monthIndex, 1).getDay()) / 7);
}

function weekLength(year: number, monthIndex: number, w: number) {
  const days = daysInMonth(year, monthIndex);
  let n = 0;
  for (let d = 1; d <= days; d++) if (weekIndex(year, monthIndex, d) === w) n++;
  return n;
}

function cellOf(assignments: DayAssignments, year: number, monthIndex: number, day: number, shiftId: string) {
  const key = dateKey(year, monthIndex, day);
  return Array.isArray(assignments?.[key]?.[shiftId]) ? assignments[key][shiftId] : [];
}

function spansOf(
  employeeId: string,
  shiftTypes: ShiftType[],
  assignments: DayAssignments,
  year: number,
  monthIndex: number,
) {
  const out: { d: number; label: string; start: number; end: number }[] = [];
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

/**
 * Four hard gates before publish + leave exclusion note.
 * Rest day default: Friday (JS getDay() === 5), matching the design matrix.
 */
export function checkPublishGates(input: {
  year: number;
  monthIndex: number;
  shiftTypes: ShiftType[];
  assignments: DayAssignments;
  onLeaveIds?: Iterable<string>;
  restDow?: number;
  namesById?: Record<string, string>;
}): PublishGateResult {
  const year = Number(input.year);
  const monthIndex = Number(input.monthIndex);
  const shiftTypes = Array.isArray(input.shiftTypes) ? input.shiftTypes : [];
  const assignments = input.assignments || {};
  const restDow = input.restDow == null ? 5 : Number(input.restDow);
  const onLeave = new Set(Array.from(input.onLeaveIds || []).map(String));
  const names = input.namesById || {};
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

  const wMin: Record<string, Record<number, number>> = {};
  const wDays: Record<string, Record<number, Set<number>>> = {};
  const assignedIds = new Set<string>();

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

  const weeklyMaxHours = Math.round(
    Math.max(0, ...Object.values(wMin).flatMap((o) => Object.values(o)), 0) / 60,
  );

  let restBreach11: { name: string; gap: number; from: { label: string; d: number }; to: { label: string; d: number } } | null = null;
  for (const id of assignedIds) {
    const sp = spansOf(id, shiftTypes, assignments, year, monthIndex);
    for (let i = 1; i < sp.length; i++) {
      const gap = sp[i].start - sp[i - 1].end;
      if (gap < 11 * 60) {
        restBreach11 = {
          name: names[id] || id,
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
  const restBreachName = noRest.length ? names[noRest[0][0]] || noRest[0][0] : "";
  const restOk = !restBreachName;

  // Re-scan raw matrix for anyone on approved leave who is still assigned.
  const leaveOnMatrix: string[] = [];
  for (let d = 1; d <= days; d++) {
    for (const st of shiftTypes) {
      for (const id of cellOf(assignments, year, monthIndex, d, st.id)) {
        if (onLeave.has(id) && !leaveOnMatrix.includes(id)) leaveOnMatrix.push(id);
      }
    }
  }

  const checks: RotaCheck[] = [
    {
      id: "hours_48",
      ok: weeklyMaxHours <= 48,
      labelAr: `أعلى حمل أسبوعي ${weeklyMaxHours} ساعة من حد 48`,
      labelEn: `Heaviest weekly load ${weeklyMaxHours} h against the 48 h cap`,
      noteAr: "محسوب لكل أسبوع تقويمي على حدة من المصفوفة نفسها — أثقل أسبوع لأثقل موظف، لا متوسط الشهر.",
      noteEn: "Computed per calendar week from the matrix itself — the heaviest week for the heaviest employee, never a monthly average.",
    },
    {
      id: "rest_11h",
      ok: doubleOk && !restBreach11,
      labelAr: !doubleOk
        ? "موظف مسند إلى ورديتين في يوم واحد"
        : restBreach11
          ? `${restBreach11.name}: ${restBreach11.gap === 0 ? "بلا فاصل" : `${restBreach11.gap} ساعة فقط`} بين ${restBreach11.from.label} يوم ${restBreach11.from.d} و${restBreach11.to.label} يوم ${restBreach11.to.d}`
          : "راحة 11 ساعة بين ورديتين",
      labelEn: !doubleOk
        ? "Someone is assigned two shifts in one day"
        : restBreach11
          ? `${restBreach11.name}: only ${restBreach11.gap} h between ${restBreach11.from.label} on day ${restBreach11.from.d} and ${restBreach11.to.label} on day ${restBreach11.to.d}`
          : "11 h rest between shifts",
      noteAr: "لا يُسند موظف إلى وردية تبدأ قبل مرور 11 ساعة على انتهاء وردية سابقة.",
      noteEn: "No one is assigned to a shift starting less than 11 hours after their previous one ends.",
    },
    {
      id: "weekly_rest",
      ok: restOk,
      labelAr: restOk
        ? "راحة أسبوعية 24 ساعة متصلة"
        : `${restBreachName} مجدول أسبوعًا كاملًا بلا يوم راحة`,
      labelEn: restOk
        ? "24 h continuous weekly rest"
        : `${restBreachName} is scheduled a full week with no rest day`,
      noteAr: "يوم راحة كامل لكل موظف في كل أسبوع، ولا يُستبدل بأجر.",
      noteEn: "A full rest day every week for every employee, never substituted with pay.",
    },
    {
      id: "coverage",
      ok: openCells === 0,
      labelAr: openCells === 0
        ? "كل ورديات الشهر مُسندة"
        : `${openCells} خلية في الشهر بلا إسناد`,
      labelEn: openCells === 0
        ? "Every shift this month is assigned"
        : `${openCells} cell${openCells === 1 ? "" : "s"} unassigned this month`,
      noteAr: "اضغط + في أي خلية فارغة لإسناد موظف — النقص يُسدّ بالإسناد لا بتمديد وردية قائمة.",
      noteEn: "Press + in any empty cell to assign someone — a gap is closed by assignment, never by extending an existing shift.",
    },
    {
      id: "leave_excluded",
      ok: leaveOnMatrix.length === 0,
      labelAr: leaveOnMatrix.length
        ? `${leaveOnMatrix.length} على إجازة معتمدة ما زالوا في الإسناد`
        : `${onLeave.size} على إجازة معتمدة — مستبعدون من الإسناد`,
      labelEn: leaveOnMatrix.length
        ? `${leaveOnMatrix.length} on approved leave still appear in the assignment`
        : `${onLeave.size} on approved leave — excluded from assignment`,
      noteAr: "من له إجازة معتمدة لا يظهر في الإسناد أصلًا، فلا يُسجَّل غيابه.",
      noteEn: "Anyone on approved leave never enters the assignment, so they are never recorded absent.",
    },
  ];

  const failed = checks.find((c) => !c.ok) || null;
  return {
    checks,
    blocked: !!failed,
    failed,
    openCells,
    weeklyMaxHours,
    coveragePct,
  };
}
