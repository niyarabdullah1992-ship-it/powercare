// Browser text-to-speech for Niro's voice replies.
const VOICE_NAMES = {
  female: /zariyah|salma|zeina|laila|hoda|jenny|aria|samantha|victoria|karen|susan|ava|zira/i,
  male: /hamed|maged|majed|tarik|guy|ryan|david|daniel|mark|george/i,
};

const preferredVoice = (voices, locale, gender) => voices
  .filter((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()))
  .sort((a, b) => {
    const quality = (voice) => {
      const name = voice.name.toLowerCase();
      return (voice.lang.toLowerCase() === locale.toLowerCase() ? 8 : 0)
        + (/natural|neural|premium|enhanced|online/.test(name) ? 8 : 0)
        + (/microsoft|google|apple|siri/.test(name) ? 4 : 0)
        + (VOICE_NAMES[gender].test(name) ? 6 : 0)
        - (VOICE_NAMES[gender === "female" ? "male" : "female"].test(name) ? 6 : 0)
        - (/compact|espeak|festival/.test(name) ? 6 : 0);
    };
    return quality(b) - quality(a);
  })[0];

let speechRequestId = 0;

export function stopSpeaking() {
  speechRequestId += 1;
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

export default function speak(text, lang, gender = "female") {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
  const synthesis = window.speechSynthesis;
  stopSpeaking();
  const requestId = speechRequestId;

  const clean = text
    .replace(/\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_#`>|•]/g, "")
    .replace(/\n{2,}/g, ". … ")
    .replace(/\n/g, "، ")
    .replace(/([.!؟?])\s*/g, "$1 … ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
  const locale = lang === "ar" ? "ar-SA" : "en-US";

  const play = () => {
    if (requestId !== speechRequestId) return;
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = locale;
    utter.voice = preferredVoice(synthesis.getVoices(), locale, gender) || null;
    utter.rate = lang === "ar" ? 0.92 : 0.96;
    utter.pitch = lang === "ar" ? 0.97 : 1;
    utter.volume = 1;
    synthesis.speak(utter);
  };

  if (synthesis.getVoices().length) play();
  else synthesis.addEventListener("voiceschanged", play, { once: true });
}