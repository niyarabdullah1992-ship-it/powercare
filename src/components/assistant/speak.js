// Browser text-to-speech for Niro's voice replies.
const preferredVoice = (voices, locale) => voices
  .filter((voice) => voice.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()))
  .sort((a, b) => {
    const quality = (voice) => {
      const name = voice.name.toLowerCase();
      return (voice.lang === locale ? 4 : 0)
        + (/natural|premium|enhanced/.test(name) ? 3 : 0)
        + (/google|microsoft|siri/.test(name) ? 2 : 0)
        + (/zariyah|hamed|maged|tarik/.test(name) ? 1 : 0);
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
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
  const locale = lang === "ar" ? "ar-SA" : "en-US";
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = locale;
  utter.voice = preferredVoice(synthesis.getVoices(), locale) || null;
  utter.rate = lang === "ar" ? 1.2 : 1.1;
  utter.pitch = 1.03;
  utter.volume = 1;
  synthesis.speak(utter);
}