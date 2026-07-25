import { base44 } from "@/api/base44Client";

const VOICE_NAMES = {
  female: /zariyah|salma|zeina|laila|hoda|jenny|aria|samantha|victoria|karen|susan|ava|zira/i,
  male: /hamed|maged|majed|tarik|guy|ryan|david|daniel|mark|george/i,
};

let speechRequestId = 0;
let activeAudio = null;

const emitLoading = (loading) => window.dispatchEvent(new CustomEvent("niro-voice-loading", { detail: loading }));

const cleanSpeechText = (text) => text
  .replace(/\[[^\]]*\]\([^)]*\)/g, "")
  .replace(/https?:\/\/\S+/g, "")
  .replace(/[*_#`>|•]/g, "")
  .replace(/\n{2,}/g, ". ")
  .replace(/\n/g, "، ")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 700);

const preferredVoice = (voices, locale, gender) => voices
  .filter((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()))
  .sort((a, b) => {
    const score = (voice) => {
      const name = voice.name.toLowerCase();
      return (voice.lang.toLowerCase() === locale.toLowerCase() ? 8 : 0)
        + (/natural|neural|premium|enhanced|online/.test(name) ? 8 : 0)
        + (VOICE_NAMES[gender].test(name) ? 6 : 0)
        - (VOICE_NAMES[gender === "female" ? "male" : "female"].test(name) ? 6 : 0);
    };
    return score(b) - score(a);
  })[0];

function playDeviceFallback(text, lang, gender, requestId) {
  if (requestId !== speechRequestId || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const locale = lang === "ar" ? "ar-SA" : "en-US";
  utterance.lang = locale;
  utterance.voice = preferredVoice(window.speechSynthesis.getVoices(), locale, gender) || null;
  utterance.rate = lang === "ar" ? 0.92 : 0.96;
  utterance.pitch = lang === "ar" ? 0.97 : 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  speechRequestId += 1;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel();
    emitLoading(false);
  }
}

export default async function speak(text, lang, gender = "female") {
  if (typeof window === "undefined" || !text) return;
  stopSpeaking();
  const requestId = speechRequestId;
  const clean = cleanSpeechText(text);
  if (!clean) return;

  emitLoading(true);
  try {
    const { url } = await base44.integrations.Core.GenerateSpeech({
      text: clean,
      voice: gender === "male" ? "storm" : "honey",
      language_code: lang === "ar" ? "ar" : "en",
    });
    if (requestId !== speechRequestId) return;
    activeAudio = new Audio(url);
    activeAudio.onended = () => { activeAudio = null; };
    await activeAudio.play();
  } catch {
    playDeviceFallback(clean, lang, gender, requestId);
  } finally {
    if (requestId === speechRequestId) emitLoading(false);
  }
}