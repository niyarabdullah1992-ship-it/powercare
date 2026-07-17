import React from "react";

const LANGUAGES = ["ar", "en", "fr", "es", "tr", "ur", "hi", "bn", "ru"];

export default function ManualLanguageSwitcher({ lang, onChange }) {
  return (
    <div className="no-print overflow-x-auto no-scrollbar" aria-label="Manual language">
      <div className="flex min-w-max gap-2 rounded-full border border-border bg-card p-2">
        {LANGUAGES.map((code) => (
          <button key={code} type="button" onClick={() => onChange(code)} aria-pressed={lang === code} className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase transition-colors ${lang === code ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}