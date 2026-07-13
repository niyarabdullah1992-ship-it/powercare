import React, { useState, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import useVoiceWakeWord from "./useVoiceWakeWord";
import speak from "./speak";

export default function VoiceControl({ onCommand }) {
  const { lang } = useI18n();
  const [enabled, setEnabled] = useState(false);
  const { supported, listening, awake, denied } = useVoiceWakeWord({ enabled, lang, onCommand });
  const ar = lang === "ar";

  // Audible acknowledgment when the wake word is heard alone.
  useEffect(() => {
    if (awake) speak(ar ? "نعم، تفضل" : "Yes, go ahead", lang);
  }, [awake, ar, lang]);

  if (!supported) return null;

  const status = denied
    ? (ar ? "تم رفض إذن الميكروفون" : "Microphone permission denied")
    : awake
      ? (ar ? "نيرو يستمع… تفضل" : "Niro is listening… go ahead")
      : listening
        ? (ar ? "قل «نيرو» ثم اطلب ما تريد" : 'Say "Niro" then ask anything')
        : null;

  return (
    <div className="ms-auto flex items-center gap-2">
      {status && (
        <span className={`hidden sm:block text-xs font-body ${awake ? "text-accent font-semibold" : "text-muted-foreground"}`}>
          {status}
        </span>
      )}
      <button
        type="button"
        onClick={() => { setEnabled((v) => !v); }}
        aria-label={ar ? "الاستماع الصوتي" : "Voice listening"}
        className={`relative p-2.5 rounded-full border transition-colors ${
          enabled
            ? "bg-accent text-accent-foreground border-accent"
            : "bg-card text-muted-foreground border-border hover:text-foreground"
        }`}
      >
        {enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        {listening && (
          <span className={`absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full ${awake ? "bg-green-500 animate-ping" : "bg-green-500 animate-pulse"}`} />
        )}
      </button>
    </div>
  );
}