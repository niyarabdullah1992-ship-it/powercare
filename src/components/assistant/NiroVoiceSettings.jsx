import React, { useEffect, useState } from "react";
import { Loader2, VolumeX } from "lucide-react";
import { stopSpeaking } from "./speak";

export default function NiroVoiceSettings({ gender, onGenderChange, ar }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = (event) => setLoading(Boolean(event.detail));
    window.addEventListener("niro-voice-loading", update);
    return () => window.removeEventListener("niro-voice-loading", update);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <select
        value={gender}
        onChange={(event) => onGenderChange(event.target.value)}
        aria-label={ar ? "اختيار صوت نيرو" : "Choose Niro voice"}
        className="h-9 rounded-md border border-border bg-card px-2 text-xs text-foreground"
      >
        <option value="male">{ar ? "صوت رجل" : "Male voice"}</option>
        <option value="female">{ar ? "صوت امرأة" : "Female voice"}</option>
      </select>
      <button
        type="button"
        onClick={stopSpeaking}
        className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground hover:text-foreground"
        aria-label={ar ? "إيقاف صوت نيرو" : "Stop Niro voice"}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <VolumeX className="h-4 w-4" />}
        <span className="hidden sm:inline">{loading ? (ar ? "تجهيز الصوت" : "Preparing") : (ar ? "إيقاف" : "Stop")}</span>
      </button>
    </div>
  );
}