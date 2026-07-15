import React from "react";

const STATS = [
  { value: "10K+", ar: "مهمة أُنجزت عبر المنصة", en: "Tasks completed on the platform" },
  { value: "50K+", ar: "ساعة حضور مسجّلة وموثّقة", en: "Attendance hours verified" },
  { value: "5K+", ar: "وثيقة موقّعة رقميًا بأمان", en: "Documents digitally signed" },
  { value: "99.9%", ar: "دقة التحقق من الموقع", en: "Location verification accuracy" },
];

export default function StatsBand({ lang }) {
  const ar = lang === "ar";
  return (
    <section className="bg-[#2b2118] px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-10 text-center text-xs font-body uppercase tracking-widest-xl text-landing-gold-light">
          {ar ? "أرقام تتحدث عنا" : "Numbers that speak for us"}
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.value} className="text-center">
              <p className="font-heading text-4xl font-semibold text-landing-gold-light md:text-6xl">{s.value}</p>
              <p className="mt-2 text-sm font-body leading-relaxed text-white/60">{ar ? s.ar : s.en}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}