import React, { useState, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import useVoiceWakeWord from "./useVoiceWakeWord";
import speak from "./speak";

// Short two-tone chime confirming the microphone actually started listening.
function playListeningChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[660, 0], [990, 0.14]].forEach(([freq, at]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.13);
    });
    setTimeout(() => ctx.close(), 500);
  } catch { /* audio not available */ }
}

export default function VoiceControl({ onCommand, voiceGender }) {
  const { lang } = useI18n();
  const [enabled, setEnabled] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const { supported, listening, awake, directReady, denied } = useVoiceWakeWord({ enabled, lang, onCommand });
  const ar = lang === "ar";

  const toggle = async () => {
    if (enabled) { setEnabled(false); return; }
    setMicDenied(false);
    // Explicitly request the microphone first — this shows the browser's permission
    // prompt and surfaces a clear message instead of silently shutting off.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setEnabled(true);
    } catch {
      setMicDenied(true);
    }
  };

  // Audible acknowledgment when the wake word is heard alone.
  useEffect(() => {
    if (awake) speak(ar ? "نعم، تفضل" : "Yes, go ahead", lang, voiceGender);
  }, [awake, ar, lang, voiceGender]);

  // If the browser denied the microphone, flip the button back off so its state is honest.
  useEffect(() => {
    if (denied) setEnabled(false);
  }, [denied]);

  // Audible confirmation the moment listening actually starts.
  useEffect(() => {
    if (enabled && listening) playListeningChime();
  }, [enabled, listening]);

  if (!supported) return null;

  const status = (denied || micDenied)
    ? (ar ? "المتصفح رفض الميكروفون — افتح التطبيق في نافذة مستقلة واسمح بالميكروفون" : "Microphone blocked — open the app in its own tab and allow the microphone")
    : (awake || directReady)
      ? (ar ? "نيرو يستمع… قل طلبك مباشرة" : "Niro is listening… say your command")
      : listening
        ? (ar ? "قل «نيرو» ثم اطلب ما تريد" : 'Say "Niro" then ask anything')
        : null;

  return (
    <div className="ms-auto flex items-center gap-2">
      {status && (
        <span className={`max-w-[200px] text-xs font-body leading-tight ${awake || directReady ? "text-accent font-semibold" : (denied || micDenied) ? "text-red-500" : "text-muted-foreground"}`}>
          {status}
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label={ar ? "الاستماع الصوتي" : "Voice listening"}
        className={`relative p-2.5 rounded-full border transition-colors ${
          enabled
            ? "bg-accent text-accent-foreground border-accent"
            : "bg-card text-muted-foreground border-border hover:text-foreground"
        }`}
      >
        {enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        {listening && (
          <span className={`absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full ${awake || directReady ? "bg-green-500 animate-ping" : "bg-green-500 animate-pulse"}`} />
        )}
      </button>
    </div>
  );
}