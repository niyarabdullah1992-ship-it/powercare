// Browser text-to-speech for Niro's voice replies.
export default function speak(text, lang) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const clean = text
    .replace(/[*_#`>|]/g, "")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\n+/g, ". ")
    .trim()
    .slice(0, 500);
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = lang === "ar" ? "ar-SA" : "en-US";
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}