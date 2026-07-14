import React from "react";
import { Trash2 } from "lucide-react";

export default function JournalEntryCard({ entry, moods, ar, onDelete }) {
  const mood = moods.find((m) => m.key === entry.mood);
  const dateLabel = new Date(entry.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeLabel = new Date(entry.createdAt).toLocaleTimeString(ar ? "ar-SA" : "en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-heading font-semibold">{dateLabel}</p>
          <p className="text-xs text-muted-foreground font-body">{timeLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mood && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-body">
              {mood.emoji} {ar ? mood.ar : mood.en}
            </span>
          )}
          <button onClick={onDelete} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted" aria-label="delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm font-body whitespace-pre-wrap leading-relaxed">{entry.text}</p>
    </div>
  );
}