import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

export default function AddCalendarEvent({ onCreate, ar }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title || !date) return;
    setSaving(true);
    try {
      await onCreate({
        title,
        start: new Date(`${date}T${startTime}`).toISOString(),
        end: new Date(`${date}T${endTime}`).toISOString(),
      });
      setTitle("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-muted/50">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={ar ? "عنوان الحدث" : "Event title"} required dir="auto"
        className="flex-1 min-w-[160px] px-3 py-2 rounded-md border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
        className="px-3 py-2 rounded-md border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring" />
      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
        className="px-2 py-2 rounded-md border border-border bg-card text-sm font-body" />
      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
        className="px-2 py-2 rounded-md border border-border bg-card text-sm font-body" />
      <button type="submit" disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {ar ? "إضافة" : "Add"}
      </button>
    </form>
  );
}