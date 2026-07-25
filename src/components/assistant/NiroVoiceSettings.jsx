import React from "react";
import { VolumeX } from "lucide-react";
import { stopSpeaking } from "./speak";

export default function NiroVoiceSettings({ gender, onGenderChange, ar }) {
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
        <VolumeX className="h-4 w-4" />
        <span className="hidden sm:inline">{ar ? "إيقاف" : "Stop"}</span>
      </button>
    </div>
  );
}