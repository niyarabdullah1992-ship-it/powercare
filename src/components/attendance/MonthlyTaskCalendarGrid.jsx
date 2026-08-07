import React from "react";
import { Link } from "react-router-dom";
import { CalendarOff } from "lucide-react";
import { calendarDateKey, employeeScheduledOn, tasksDueOn } from "@/lib/attendanceCalendar";

export default function MonthlyTaskCalendarGrid({ days, tasks, schedules, user, lang }) {
  const ar = lang === "ar";
  const weekdays = ar ? ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const scheduleReady = schedules.some((schedule) => (schedule.shiftTypes || []).length > 0);
  return <div className="overflow-hidden rounded-xl border border-border bg-card">
    <div className="grid grid-cols-7 border-b border-border bg-secondary">{weekdays.map((day) => <div key={day} className="p-2 text-center text-[10px] font-semibold text-secondary-foreground sm:text-xs">{day}</div>)}</div>
    <div className="grid grid-cols-7">{days.map((date, index) => {
      if (!date) return <div key={`blank-${index}`} className="min-h-24 border-b border-e border-border/60 bg-muted/25" />;
      const key = calendarDateKey(date); const dayTasks = tasksDueOn(tasks, key);
      const off = scheduleReady && !employeeScheduledOn(schedules, user.id, key);
      const today = key === calendarDateKey(new Date());
      return <div key={key} className={`min-h-24 border-b border-e border-border/60 p-1.5 sm:min-h-32 sm:p-2 ${today ? "bg-accent/10" : "bg-card"}`}>
        <div className="mb-1 flex items-center justify-between"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${today ? "bg-primary text-primary-foreground" : "text-foreground"}`}>{date.getDate()}</span>{off && <CalendarOff className="h-3.5 w-3.5 text-muted-foreground" />}</div>
        {off && <p className="mb-1 truncate text-[9px] font-medium text-muted-foreground">{ar ? "راحة أسبوعية" : "Weekly off"}</p>}
        <div className="space-y-1">{dayTasks.slice(0, 2).map((task) => { const mine = task.employee_id === user.id; return <Link key={task.id} to="/app/tasks" className={`block truncate rounded px-1.5 py-1 text-[9px] font-semibold sm:text-[10px] ${mine ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"}`}>{mine ? (ar ? "مهمتي · " : "Mine · ") : ""}{task.title}</Link>; })}{dayTasks.length > 2 && <p className="text-[9px] text-muted-foreground">+{dayTasks.length - 2}</p>}</div>
      </div>;
    })}</div>
  </div>;
}