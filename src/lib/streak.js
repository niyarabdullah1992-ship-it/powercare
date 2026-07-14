// Achievement streak: consecutive days with activity (a journal entry written
// or a planner item completed). The streak stays alive if the last activity
// was today or yesterday.

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function getActivityDays(data) {
  const days = new Set();
  (data.journalEntries || []).forEach((e) => {
    if (e.date) days.add(e.date);
    else if (e.createdAt) days.add(dayKey(new Date(e.createdAt)));
  });
  (data.plannerItems || []).forEach((i) => {
    if (i.done && i.date) days.add(i.date);
  });
  return days;
}

export function computeStreak(data) {
  const days = getActivityDays(data);
  if (days.size === 0) return { current: 0, best: 0, activeToday: false };

  const today = new Date();
  const activeToday = days.has(dayKey(today));

  // Current streak: walk back from today (or yesterday if today has no activity yet).
  let current = 0;
  const cursor = new Date(today);
  if (!activeToday) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak: longest run among all activity days.
  const sorted = [...days].sort();
  let best = 0, run = 0, prev = null;
  for (const d of sorted) {
    if (prev) {
      const diff = (new Date(d + "T00:00:00") - new Date(prev + "T00:00:00")) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = d;
  }

  return { current, best: Math.max(best, current), activeToday };
}