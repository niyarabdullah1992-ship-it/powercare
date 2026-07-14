import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { updateCompany } from "@/lib/store";
import { Sparkles, Loader2 } from "lucide-react";

const uid = () => `pln_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

// Free-text → Niro AI turns it into timed planner items for the selected day.
export default function NiroPlanBox({ companyId, date, ar }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = async () => {
    const goal = text.trim();
    if (!goal || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Niro, a personal day-planning assistant. The user described their day in free text: "${goal}". Today's date: ${date}. Break it into a realistic daily schedule of 3-8 items, each with a 24-hour time "HH:MM" and a short title (max 8 words). Respect any times the user mentioned; otherwise choose sensible times between 06:00 and 23:00, in logical order. Write the titles in ${ar ? "Arabic" : "the same language the user wrote in"}.`,
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
        setError(ar ? "لم أتمكن من التخطيط — جرّب وصفاً أوضح." : "Couldn't build a plan — try a clearer description.");
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
      setError(ar ? "تعذر الاتصال بـ Niro — حاول مرة أخرى." : "Niro is unavailable — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-accent/40 bg-accent/5 space-y-2">
      <p className="text-xs uppercase tracking-wider text-accent font-body flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> {ar ? "خطط يومك مع Niro" : "Plan your day with Niro"}
      </p>
      <div className="flex gap-2 flex-wrap">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && plan()}
          placeholder={ar
            ? "اكتب يومك بحرية... (مثل: رياضة صباحاً، اجتماع الساعة 11، قراءة مساءً)"
            : "Describe your day freely... (e.g. gym in the morning, meeting at 11, reading tonight)"}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-md border border-input text-sm font-body bg-background"
        />
        <button onClick={plan} disabled={!text.trim() || loading} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-body hover:opacity-90 transition-opacity disabled:opacity-40">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? (ar ? "يخطط..." : "Planning...") : (ar ? "خطط لي" : "Plan it")}
        </button>
      </div>
      {error && <p className="text-xs text-destructive font-body">{error}</p>}
    </div>
  );
}