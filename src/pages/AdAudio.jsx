import React from "react";
import { Download, Volume2 } from "lucide-react";

const AUDIO_URL = "https://media.base44.com/files/public/6a4f617bd7360a0ae9581d2a/e72913a71_speech.mp3";

export default function AdAudio() {
  return (
    <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card text-center space-y-6">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Volume2 className="w-7 h-7" />
        </span>
        <h1 className="font-heading text-2xl font-semibold">صوت إعلان باوركير</h1>
        <audio controls src={AUDIO_URL} className="w-full" />
        <a
          href={AUDIO_URL}
          download="powercare-ad.mp3"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent transition-colors"
        >
          <Download className="w-4 h-4" /> تنزيل الملف (MP3)
        </a>
      </div>
    </div>
  );
}