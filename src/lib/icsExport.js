// Builds calendar files from the user's data — no OAuth account linking needed.
// Two formats: .ics (standard calendar) and .csv (opens in Excel AND importable
// into Google Calendar via Settings → Import & export).
const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const fmtDT = (d, hhmm) => `${fmtDate(d)}T${(hhmm || "00:00").replace(":", "")}00`;

// Shared event collector: the user's shifts for the next `daysAhead` days,
// their approved leave periods, and scheduled maintenance plans they can see.
function collectPersonalEvents({ data, user, daysAhead = 28 }) {
  const events = [];
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
        events.push({
          uid: `shift-${sch.stationId}-${st.id}-${fmtDate(day)}`,
          title: `${st.label} — ${stationName(sch.stationId)}`,
          startDate: day, startTime: st.start,
          endDate: endDay, endTime: st.end,
          allDay: false,
        });
      });
    });
  }

  // Approved leave — all-day date ranges.
  (user.leaveRequests || []).filter((r) => r.status === "approved").forEach((r) => {
    const start = new Date(r.activeStartDate || r.startDate);
    const end = new Date(r.activeEndDate || r.endDate);
    if (isNaN(start) || isNaN(end)) return;
    events.push({ uid: `leave-${r.id}`, title: `Leave (${r.type})`, description: r.reason, startDate: start, endDate: end, allDay: true });
  });

  // Scheduled maintenance plans — the user's station, or all for managers/HQ staff.
  (data.plans || []).filter((p) => !user.stationId || p.stationId === user.stationId).forEach((p) => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate || p.startDate);
    if (isNaN(start) || isNaN(end)) return;
    events.push({ uid: `plan-${p.id}`, title: `${p.title} — ${stationName(p.stationId)}`, description: p.notes, startDate: start, endDate: end, allDay: true });
  });

  return events;
}

export function buildPersonalIcs(opts) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PowerCare//Schedule//EN", "CALSCALE:GREGORIAN"];
  collectPersonalEvents(opts).forEach((e) => {
    // DTEND for all-day events is exclusive → +1 day.
    const endExcl = new Date(e.endDate.getFullYear(), e.endDate.getMonth(), e.endDate.getDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@powercare`,
      `SUMMARY:${esc(e.title)}`,
      e.description ? `DESCRIPTION:${esc(e.description)}` : null,
      e.allDay ? `DTSTART;VALUE=DATE:${fmtDate(e.startDate)}` : `DTSTART:${fmtDT(e.startDate, e.startTime)}`,
      e.allDay ? `DTEND;VALUE=DATE:${fmtDate(endExcl)}` : `DTEND:${fmtDT(e.endDate, e.endTime)}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

// CSV in Google Calendar's official import format — also opens directly in Excel.
// Columns: Subject, Start Date, Start Time, End Date, End Time, All Day Event, Description
export function buildPersonalCsv(opts) {
  const q = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
  const dateUS = (d) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
  const time12 = (hhmm) => {
    const [h, m] = (hhmm || "00:00").split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${pad(m)} ${ampm}`;
  };
  const rows = [["Subject", "Start Date", "Start Time", "End Date", "End Time", "All Day Event", "Description"]];
  collectPersonalEvents(opts).forEach((e) => {
    rows.push([
      e.title,
      dateUS(e.startDate),
      e.allDay ? "" : time12(e.startTime),
      dateUS(e.endDate),
      e.allDay ? "" : time12(e.endTime),
      e.allDay ? "True" : "False",
      e.description || "",
    ]);
  });
  // BOM so Excel renders Arabic text correctly.
  return "\ufeff" + rows.map((r) => r.map(q).join(",")).join("\r\n");
}

export function downloadIcs(icsContent, filename = "powercare-schedule.ics") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([icsContent], { type: "text/calendar;charset=utf-8" }));
  a.download = filename;
  a.click();
}

export function downloadCsv(csvContent, filename = "powercare-schedule.csv") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8" }));
  a.download = filename;
  a.click();
}