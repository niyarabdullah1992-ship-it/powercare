import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { BookOpen, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import JournalEntryCard from "@/components/individual/JournalEntryCard";
import StreakCard from "@/components/individual/StreakCard";
import ExportButtons from "@/components/individual/ExportButtons";
import WeeklySummaryCard from "@/components/individual/WeeklySummaryCard";

const uid = () => `jrn_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const MOODS = [
  { key: "great", emoji: "😄", ar: "رائع", en: "Great", labelKey: "moodGreat" },
  { key: "good", emoji: "🙂", ar: "جيد", en: "Good", labelKey: "moodGood" },
  { key: "ok", emoji: "😐", ar: "عادي", en: "Okay", labelKey: "moodOk" },
  { key: "tired", emoji: "😔", ar: "متعب", en: "Tired", labelKey: "moodTired" },
  { key: "bad", emoji: "😞", ar: "سيء", en: "Bad", labelKey: "moodBad" },
];

export default function LifeJournal() {
  const { t, lang } = useI18n();
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
      <PageHeader
        title={t("lifeJournal")}
        icon={BookOpen}
        actions={
          <ExportButtons
            title={t("lifeJournal")}
            filename="my-life-journal"
            headers={[t("date"), t("moodLabel"), t("reportLabel")]}
            rows={entries.map((e2) => {
              const m = MOODS.find((m2) => m2.key === e2.mood);
              return [e2.date, m ? `${m.emoji} ${t(m.labelKey)}` : "", e2.text];
            })}
            ar={ar}
          />
        }
      />

      <StreakCard data={data} ar={ar} />

      <WeeklySummaryCard data={data} ar={ar} />

      {/* New entry */}
      <form onSubmit={addEntry} className="p-5 rounded-2xl border border-border bg-card space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-2">{t("indHowWasDay")}</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMood(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mood === m.key ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
              >
                <span>{m.emoji}</span> {t(m.labelKey)}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={t("indJournalPlaceholder")}
          className="w-full px-3 py-2.5 rounded-xl border border-input text-sm font-body bg-background resize-y"
        />
        <button type="submit" disabled={!text.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-40">
          <Plus className="w-4 h-4" /> {t("indSaveReport")}
        </button>
      </form>

      {/* Past entries */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-body">{t("indLifeLog")} ({entries.length})</p>
        {entries.length === 0 ? (
          <div className="p-6 rounded-2xl border border-border bg-card text-center">
            <p className="text-sm text-muted-foreground font-body">
              {t("indNoReports")}
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