import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { BookOpen, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import JournalEntryCard from "@/components/individual/JournalEntryCard";

const uid = () => `jrn_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const MOODS = [
  { key: "great", emoji: "😄", ar: "رائع", en: "Great" },
  { key: "good", emoji: "🙂", ar: "جيد", en: "Good" },
  { key: "ok", emoji: "😐", ar: "عادي", en: "Okay" },
  { key: "tired", emoji: "😔", ar: "متعب", en: "Tired" },
  { key: "bad", emoji: "😞", ar: "سيء", en: "Bad" },
];

export default function LifeJournal() {
  const { lang } = useI18n();
  const { data, company } = useAuth();
  const ar = lang === "ar";
  const [mood, setMood] = useState("good");
  const [text, setText] = useState("");

  if (!data || !company) return null;

  const entries = [...(data.journalEntries || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const addEntry = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    updateCompany(company.id, (d) => {
      d.journalEntries = d.journalEntries || [];
      d.journalEntries.unshift({ id: uid(), date: localDate(), mood, text: trimmed, createdAt: new Date().toISOString() });
    });
    setText("");
    setMood("good");
  };

  const removeEntry = (id) => updateCompany(company.id, (d) => {
    d.journalEntries = (d.journalEntries || []).filter((x) => x.id !== id);
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title={ar ? "تقارير حياتي" : "My Life Journal"} icon={BookOpen} />

      {/* New entry */}
      <form onSubmit={addEntry} className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">{ar ? "كيف كان يومك؟" : "How was your day?"}</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMood(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mood === m.key ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
              >
                <span>{m.emoji}</span> {ar ? m.ar : m.en}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={ar
            ? "اكتب تقرير يومك... ماذا أنجزت؟ ماذا تعلمت؟ كيف تشعر؟"
            : "Write your day's report... What did you accomplish? What did you learn? How do you feel?"}
          className="w-full px-3 py-2.5 rounded-xl border border-input text-sm font-body bg-background resize-y"
        />
        <button type="submit" disabled={!text.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-40">
          <Plus className="w-4 h-4" /> {ar ? "حفظ تقرير اليوم" : "Save today's report"}
        </button>
      </form>

      {/* Past entries */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-body">{ar ? "سجل حياتك" : "Your life log"} ({entries.length})</p>
        {entries.length === 0 ? (
          <div className="p-6 rounded-2xl border border-border bg-card text-center">
            <p className="text-sm text-muted-foreground font-body">
              {ar ? "لا توجد تقارير بعد — اكتب أول تقرير عن يومك أعلاه." : "No reports yet — write your first daily report above."}
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} moods={MOODS} ar={ar} onDelete={() => removeEntry(entry.id)} />
          ))
        )}
      </div>
    </div>
  );
}