import React from "react";
import { Clock, ExternalLink } from "lucide-react";

export default function CalendarEventList({ events, ar }) {
  if (!events.length) {
    return (
      <p className="text-sm text-muted-foreground font-body text-center py-8">
        {ar ? "لا توجد أحداث قادمة في تقويمك." : "No upcoming events in your calendar."}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {events.map((ev) => {
        const start = ev.start?.dateTime || ev.start?.date;
        return (
          <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Clock className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" dir="auto">{ev.summary || (ar ? "(بدون عنوان)" : "(no title)")}</p>
              <p className="text-xs text-muted-foreground">{start ? new Date(start).toLocaleString(ar ? "ar" : "en") : ""}</p>
            </div>
            {ev.htmlLink && (
              <a href={ev.htmlLink} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}