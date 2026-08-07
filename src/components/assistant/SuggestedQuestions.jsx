import React from "react";
import { useI18n } from "@/lib/i18n";

export default function SuggestedQuestions({ onPick, disabled }) {
  const { t } = useI18n();
  const suggestions = [t("aiSuggest1"), t("aiSuggest2"), t("aiSuggest3"), t("aiSuggest4")];
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((q) => (
        <button
          key={q}
          onClick={() => onPick(q)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-full border border-border bg-card text-xs font-body text-foreground/80 hover:bg-accent/10 hover:text-accent hover:border-accent/40 disabled:opacity-50"
          dir="auto"
        >
          {q}
        </button>
      ))}
    </div>
  );
}