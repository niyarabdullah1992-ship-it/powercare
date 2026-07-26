import React from "react";

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
    </div>
  );
}