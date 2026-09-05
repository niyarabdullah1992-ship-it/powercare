import React from "react";
import { field } from "@/lib/platformStyles";

export default function NiroVoiceSettings({ gender, onGenderChange, ar }) {
  return (
    <select
      value={gender}
      onChange={(event) => onGenderChange(event.target.value)}
      aria-label={ar ? "اختيار صوت نيرو" : "Choose Niro voice"}
      style={{ ...field, width: "auto", minWidth: 128 }}
    >
      <option value="male">{ar ? "صوت رجل" : "Male voice"}</option>
      <option value="female">{ar ? "صوت امرأة" : "Female voice"}</option>
    </select>
  );
}
