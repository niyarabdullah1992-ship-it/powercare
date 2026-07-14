import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { updateCompany } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Sparkles, Loader2 } from "lucide-react";

const uid = () => `pln_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

// Free-text → Niro AI turns it into timed planner items for the selected day.
export default function NiroPlanBox({ companyId, date }) {
  const { t, lang, languages } = useI18n();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = async () => {
    const goal = text.trim();
    if (!goal || loading) return;
    setLoading(true);
    setError("");
    const langLabel = languages.find((l) => l.code === lang)?.label || "English";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Niro, a personal day-planning assistant. The user described their day in free text: "${goal}". Today's date: ${date}. Break it into a realistic daily schedule of 3-8 items, each with a 24-hour time "HH:MM" and a short title (max 8 words). Respect any times the user mentioned; otherwise choose sensible times between 06:00 and 23:00, in logical order. Write the titles in ${langLabel}.`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { type: "object", properties: { time: { type: "string" }, title: { type: "string" } } },
            },
          },
        },
      });
      const items = (res?.items || []).filter((i) => i.title);
      if (items.length === 0) {
        setError(t("niroPlanEmpty"));
        return;
      }
      updateCompany(companyId, (d) => {
        d.plannerItems = d.plannerItems || [];
        for (const it of items) {
          d.plannerItems.push({ id: uid(), date, time: it.time || "", title: it.title, done: false, createdAt: new Date().toISOString() });
        }
      });
      setText("");
    } catch {
      setError(t("niroPlanFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-accent/40 bg-accent/5 space-y-2">
      <p className="text-xs uppercase tracking-wider text-accent font-body flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> {t("niroPlanTitle")}
      </p>
      <div className="flex gap-2 flex-wrap">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && plan()}
          placeholder={t("niroPlanPlaceholder")}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-md border border-input text-sm font-body bg-background"
        />
        <button onClick={plan} disabled={!text.trim() || loading} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-body hover:opacity-90 transition-opacity disabled:opacity-40">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? t("niroPlanning") : t("niroPlanBtn")}
        </button>
      </div>
      {error && <p className="text-xs text-destructive font-body">{error}</p>}
    </div>
  );
}