// Browser text-to-speech for Niro's voice replies.
const preferredVoice = (voices, locale) => voices
  .filter((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()))
  .sort((a, b) => {
    const quality = (voice) => {
      const name = voice.name.toLowerCase();
      return (voice.lang.toLowerCase() === locale.toLowerCase() ? 8 : 0)
        + (/natural|neural|premium|enhanced|online/.test(name) ? 8 : 0)
        + (/microsoft|google|apple|siri/.test(name) ? 4 : 0)
        + (/zariyah|hamed|maged|tarik|salma|majed/.test(name) ? 3 : 0)
        - (/compact|espeak|festival/.test(name) ? 6 : 0);
    };
    return quality(b) - quality(a);
  })[0];

export default function speak(text, lang) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
  const synthesis = window.speechSynthesis;
  synthesis.cancel();

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
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = locale;
    utter.voice = preferredVoice(synthesis.getVoices(), locale) || null;
    utter.rate = lang === "ar" ? 0.92 : 0.96;
    utter.pitch = lang === "ar" ? 0.97 : 1;
    utter.volume = 1;
    synthesis.speak(utter);
  };

  if (synthesis.getVoices().length) play();
  else synthesis.addEventListener("voiceschanged", play, { once: true });
}