import { useEffect, useRef, useState } from "react";

const WAKE_WORDS = ["نيرو", "نيروا", "نيرة", "niro", "nero", "neero", "nyro"];

// Continuous speech recognition with a wake word: says "نيرو ..." → the rest is
// sent as a command. Saying just "نيرو" wakes it up; the next sentence is the command.
export default function useVoiceWakeWord({ enabled, lang, onCommand }) {
  const [listening, setListening] = useState(false);
  const [awake, setAwake] = useState(false);
  const [directReady, setDirectReady] = useState(false);
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
      setListening(false); setAwake(false); setDirectReady(false); awakeRef.current = false;
      return;
    }
    // Fresh attempt — clear any previous denial so the toggle doesn't get stuck
    // in an on/off loop after a one-time failure.
    setDenied(false);
    const rec = new SR();
    rec.lang = lang === "ar" ? "ar-SA" : "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    awakeRef.current = true;
    setDirectReady(true);
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
          setAwake(false); setDirectReady(false); awakeRef.current = false;
        } else {
          setDirectReady(false); setAwake(true); awakeRef.current = true;
        }
      } else if (awakeRef.current) {
        onCommandRef.current(transcript);
        setAwake(false); setDirectReady(false); awakeRef.current = false;
      }
    };
    let stopped = false;
    let restartTimer = null;
    const restart = () => {
      if (stopped || !enabledRef.current) { setListening(false); return; }
      try { rec.start(); } catch {
        // Recognition engine not ready yet — retry shortly instead of giving up.
        restartTimer = setTimeout(restart, 400);
      }
    };
    rec.onend = () => {
      // Browsers stop recognition after silence/inactivity — always restart while enabled.
      if (!stopped && enabledRef.current) restartTimer = setTimeout(restart, 250);
      else setListening(false);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") {
        enabledRef.current = false;
        setDenied(true);
        setListening(false);
      }
      // Other errors (no-speech, aborted, network) are transient — onend will restart.
    };
    restart();
    return () => {
      stopped = true;
      clearTimeout(restartTimer);
      rec.onend = null;
      try { rec.stop(); } catch { /* ignore */ }
      setListening(false); setAwake(false); setDirectReady(false); awakeRef.current = false;
    };
  }, [enabled, lang, supported, SR]);

  return { supported, listening, awake, directReady, denied };
}