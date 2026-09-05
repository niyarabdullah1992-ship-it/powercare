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
          className="px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-white text-xs font-body text-[#14284B] hover:bg-[#F7F8FA] hover:border-[#14284B] disabled:opacity-50"
          dir="auto"
        >
          {q}
        </button>
      ))}
    </div>
  );
}