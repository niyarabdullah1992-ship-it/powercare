import { useEffect, useRef, useState } from "react";

const WAKE_WORDS = ["نيرو", "نيروا", "نيرة", "niro", "nero", "neero", "nyro"];

// Continuous speech recognition with a wake word: says "نيرو ..." → the rest is
// sent as a command. Saying just "نيرو" wakes it up; the next sentence is the command.
export default function useVoiceWakeWord({ enabled, lang, onCommand }) {
  const [listening, setListening] = useState(false);
  const [awake, setAwake] = useState(false);
  const [denied, setDenied] = useState(false);
  const awakeRef = useRef(false);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const SR = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const supported = !!SR;

  useEffect(() => {
    if (!supported || !enabled) {
      setListening(false); setAwake(false); awakeRef.current = false;
      return;
    }
    const rec = new SR();
    rec.lang = lang === "ar" ? "ar-SA" : "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).slice(e.resultIndex)
        .filter((r) => r.isFinal).map((r) => r[0].transcript).join(" ").trim();
      if (!transcript) return;
      const lower = transcript.toLowerCase();
      const wake = WAKE_WORDS.find((w) => lower.includes(w));
      if (wake) {
        const command = transcript.slice(lower.indexOf(wake) + wake.length).replace(/^[\s,،.؟!يا]+/, "").trim();
        if (command.length > 1) {
          onCommandRef.current(command);
          setAwake(false); awakeRef.current = false;
        } else {
          setAwake(true); awakeRef.current = true;
        }
      } else if (awakeRef.current) {
        onCommandRef.current(transcript);
        setAwake(false); awakeRef.current = false;
      }
    };
    rec.onend = () => {
      if (enabledRef.current) { try { rec.start(); } catch { /* already running */ } }
      else setListening(false);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        enabledRef.current = false;
        setDenied(true);
        setListening(false);
      }
    };
    try { rec.start(); } catch { /* ignore double-start */ }
    return () => {
      rec.onend = null;
      try { rec.stop(); } catch { /* ignore */ }
      setListening(false); setAwake(false); awakeRef.current = false;
    };
  }, [enabled, lang, supported, SR]);

  return { supported, listening, awake, denied };
}