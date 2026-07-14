import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Share2, Download, Loader2, Flame, CheckCircle2, Clock } from "lucide-react";
import { computeStreak } from "@/lib/streak";
import Logo from "@/components/Logo";

// Shareable weekly achievement card — renders a branded stats card the user
// can download or share as an image (free marketing on every share).
export default function WeeklyShareCard({ data, ar }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceKey = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`;
  const doneTasks = (data.plannerItems || []).filter((i) => i.done && (i.date || "") >= sinceKey).length;
  const minutes = (data.personalAttendance || [])
    .filter((r) => (r.date || "") >= sinceKey && r.checkOut)
    .reduce((s, r) => s + Math.max(0, (new Date(r.checkOut) - new Date(r.checkIn)) / 60000), 0);
  const hours = Math.round(minutes / 6) / 10;
  const streak = computeStreak(data);

  const captureBlob = async () => {
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true });
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  };

  const download = (blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "powercare-week.png";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await captureBlob();
      const file = new File([blob], "powercare-week.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "PowerCare" }).catch(() => {});
      } else {
        download(blob);
      }
    } finally {
      setBusy(false);
    }
  };

  const saveImage = async () => {
    setBusy(true);
    try { download(await captureBlob()); } finally { setBusy(false); }
  };

  const stats = [
    { icon: CheckCircle2, value: doneTasks, label: ar ? "مهمة منجزة" : "tasks done" },
    { icon: Clock, value: hours, label: ar ? "ساعة عمل" : "work hours" },
    { icon: Flame, value: streak.current, label: ar ? "يوم متتالي" : "day streak" },
  ];

  return (
    <div className="space-y-3">
      <div
        ref={cardRef}
        dir={ar ? "rtl" : "ltr"}
        className="rounded-2xl p-6 bg-gradient-to-br from-landing-gold-light via-landing-gold to-landing-gold-deep text-white shadow-md"
      >
        <div className="flex items-center gap-2 mb-4">
          <Logo size={28} />
          <p className="font-heading font-semibold">PowerCare</p>
          <p className="ms-auto text-[11px] text-white/80 font-body">{ar ? "إنجازي هذا الأسبوع" : "My week in review"}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/15 py-4">
              <s.icon className="w-4 h-4 mx-auto mb-1.5 text-white/90" strokeWidth={1.75} />
              <p className="hero-title text-3xl">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/80 font-body mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-white/70 font-body mt-4">powercares.pro</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={share} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-body hover:bg-accent transition disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
          {ar ? "مشاركة إنجازي" : "Share my week"}
        </button>
        <button onClick={saveImage} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-xs font-body hover:bg-muted transition disabled:opacity-50">
          <Download className="w-3.5 h-3.5" /> {ar ? "تنزيل كصورة" : "Download image"}
        </button>
      </div>
    </div>
  );
}