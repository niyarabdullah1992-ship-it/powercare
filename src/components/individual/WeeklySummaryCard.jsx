import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";

export default function WeeklySummaryCard({ data, ar }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const entries = (data.journalEntries || []).filter((e) => new Date(e.createdAt) >= since);
    const planner = (data.plannerItems || []).filter((i) => i.date && new Date(i.date + "T00:00:00") >= since);
    const doneItems = planner.filter((i) => i.done);

    const context = [
      `Journal entries (last 7 days): ${entries.length === 0 ? "none" : entries.map((e) => `[${e.date} | mood: ${e.mood}] ${e.text}`).join("\n")}`,
      `Planner items (last 7 days): ${planner.length} total, ${doneItems.length} completed. Items: ${planner.map((i) => `${i.date} ${i.time || ""} ${i.title} (${i.done ? "done" : "not done"})`).join("; ") || "none"}`,
    ].join("\n\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Niro, a warm personal life coach inside the PowerCare app. Based on the user's last 7 days of journal entries and daily planner below, write a short personal weekly summary ${ar ? "in Arabic" : "in English"} (markdown, max ~150 words) with:
1. A warm one-line greeting.
2. What they accomplished and how their mood trended.
3. One specific, encouraging piece of advice for the coming week.
If there is very little data, gently encourage them to journal more.

${context}`,
    });
    setSummary(result);
    setLoading(false);
  };

  return (
    <div className="p-5 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/15 text-accent">
            <Sparkles className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="font-heading text-lg font-semibold leading-tight">{ar ? "ملخصك الأسبوعي من Niro" : "Your weekly summary by Niro"}</h3>
            <p className="text-xs text-muted-foreground font-body">{ar ? "يقرأ Niro أسبوعك ويكتب لك ملخصًا ونصيحة شخصية" : "Niro reads your week and writes a personal recap & advice"}</p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? (ar ? "يكتب Niro..." : "Niro is writing...") : summary ? (ar ? "تحديث الملخص" : "Refresh summary") : (ar ? "أنشئ ملخصي" : "Generate my summary")}
        </button>
      </div>
      {summary && (
        <div className="mt-4 pt-4 border-t border-accent/20 prose prose-sm max-w-none font-body dark:prose-invert">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}