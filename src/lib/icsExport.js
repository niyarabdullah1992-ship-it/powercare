// Builds a standard .ics calendar file (importable into Google Calendar, Outlook,
// Apple Calendar...) from the user's data — no OAuth account linking needed.
const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const fmtDT = (d, hhmm) => `${fmtDate(d)}T${(hhmm || "00:00").replace(":", "")}00`;

function event({ uid, title, description, start, end, allDay }) {
  return [
    "BEGIN:VEVENT",
    `UID:${uid}@powercare`,
    `SUMMARY:${esc(title)}`,
    description ? `DESCRIPTION:${esc(description)}` : null,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    "END:VEVENT",
  ].filter(Boolean);
}

// Personal calendar: the user's shifts for the next `daysAhead` days, their
// approved leave periods, and scheduled maintenance plans they can see.
export function buildPersonalIcs({ data, user, daysAhead = 28 }) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PowerCare//Schedule//EN", "CALSCALE:GREGORIAN"];
  const stationName = (id) => data.stations?.find((s) => s.id === id)?.name || "";

  // Shifts — expand the weekly assignment grid into dated events.
  const today = new Date();
  for (let i = 0; i < daysAhead; i++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const weekday = day.getDay();
    (data.schedules || []).forEach((sch) => {
      const dayAssignments = sch.assignments?.[weekday] || {};
      (sch.shiftTypes || []).forEach((st) => {
        if (!(dayAssignments[st.id] || []).includes(user.id)) return;
        // Overnight shifts (e.g. 22:00 → 06:00) end on the next day.
        const overnight = st.end < st.start;
        const endDay = overnight ? new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1) : day;
        lines.push(...event({
          uid: `shift-${sch.stationId}-${st.id}-${fmtDate(day)}`,
          title: `${st.label} — ${stationName(sch.stationId)}`,
          start: fmtDT(day, st.start),
          end: fmtDT(endDay, st.end),
        }));
      });
    });
  }

  // Approved leave — all-day date ranges (DTEND is exclusive, so +1 day).
  (user.leaveRequests || []).filter((r) => r.status === "approved").forEach((r) => {
    const start = new Date(r.activeStartDate || r.startDate);
    const end = new Date(r.activeEndDate || r.endDate);
    if (isNaN(start) || isNaN(end)) return;
    const endExcl = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
    lines.push(...event({
      uid: `leave-${r.id}`,
      title: `Leave (${r.type})`,
      description: r.reason,
      start: fmtDate(start),
      end: fmtDate(endExcl),
      allDay: true,
    }));
  });

  // Scheduled maintenance plans — the user's station, or all for managers/HQ staff.
  (data.plans || []).filter((p) => !user.stationId || p.stationId === user.stationId).forEach((p) => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate || p.startDate);
    if (isNaN(start) || isNaN(end)) return;
    const endExcl = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
    lines.push(...event({
      uid: `plan-${p.id}`,
      title: `${p.title} — ${stationName(p.stationId)}`,
      description: p.notes,
      start: fmtDate(start),
      end: fmtDate(endExcl),
      allDay: true,
    }));
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(icsContent, filename = "powercare-schedule.ics") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([icsContent], { type: "text/calendar;charset=utf-8" }));
  a.download = filename;
  a.click();
}