import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";

// AI-written one-glance daily brief for managers. Generated once per day per
// language and cached locally, so it costs a single LLM call per day.
export default function SmartDailySummary({ companyId, lang, t, facts }) {
  const day = new Date().toISOString().slice(0, 10);
  const cacheKey = `pc_brief_${companyId}_${lang}_${day}`;
  const [text, setText] = useState(() => localStorage.getItem(cacheKey) || "");
  const [loading, setLoading] = useState(false);

  const generate = async (force) => {
    if (!force && localStorage.getItem(cacheKey)) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Niro, the smart assistant of a workforce-management platform. Write a short daily brief for a manager (2-3 sentences max, no lists, no headings, no emojis). Be warm, concrete and actionable — mention the most important numbers and what deserves attention first. Write ONLY in the language with ISO code "${lang}". Today's facts: ${facts.join("; ")}.`,
      });
      const clean = String(res || "").trim();
      if (clean) {
        localStorage.setItem(cacheKey, clean);
        setText(clean);
      }
    } catch {
      // Brief stays hidden — dashboard works fine without it.
    }
    setLoading(false);
  };

  useEffect(() => { generate(false); }, [lang]);

  if (!text && !loading) return null;

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] tracking-widest-xl uppercase text-muted-foreground font-body">{t("aiDailyBrief")}</p>
          <button
            onClick={() => generate(true)}
            disabled={loading}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            title={t("refreshBrief")}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
        </div>
        {loading && !text ? (
          <p className="text-sm font-body text-muted-foreground mt-1">{t("aiBriefLoading")}</p>
        ) : (
          <p className="text-sm font-body leading-relaxed mt-1" dir="auto">{text}</p>
        )}
      </div>
    </div>
  );
}