import React, { useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";

// Desktop-friendly precise location picker: search any place by name, or paste
// exact coordinates ("24.7136, 46.6753" — e.g. copied from Google Maps).
export default function LocationSearchBox({ t, onPick }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    const text = q.trim();
    if (!text) return;
    // Pasted coordinates → jump straight there.
    const m = text.match(/^(-?\d{1,3}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
    if (m) {
      const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        setResults(null);
        onPick([lat, lng]);
        return;
      }
    }
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(text)}`, {
        headers: { "Accept-Language": document.documentElement.lang || "en" },
      });
      const rows = await res.json();
      setResults(Array.isArray(rows) ? rows : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-1">
      <form onSubmit={search} className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlacePlaceholder")}
          dir="auto"
          className="flex-1 px-3 py-1.5 rounded-md border border-input text-xs font-body"
        />
        <button
          type="submit"
          disabled={searching}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body disabled:opacity-50 shrink-0"
        >
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          {t("searchBtn")}
        </button>
      </form>
      {results && (
        <div className="max-h-28 overflow-y-auto rounded-md border border-border divide-y divide-border bg-card">
          {results.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-muted-foreground font-body">{t("searchNoResults")}</p>
          )}
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => { onPick([parseFloat(r.lat), parseFloat(r.lon)], r); setResults(null); }}
              className="w-full flex items-start gap-1.5 px-3 py-2 text-start text-[11px] font-body hover:bg-muted"
              dir="auto"
            >
              <MapPin className="w-3 h-3 mt-0.5 text-accent shrink-0" />
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}