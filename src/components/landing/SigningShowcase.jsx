import React, { useEffect, useState } from "react";
import { PenLine, FileText, CheckCircle2, ShieldCheck, Fingerprint } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Animated live demo of the verified digital-signing flow: a document appears,
// each party's signature "signs itself", then the encrypted verification badge
// is stamped — and the loop restarts.
export default function SigningShowcase() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const steps = [
    { icon: FileText, label: ar ? "عقد الخدمة.pdf — جاهز للتوقيع" : "service-contract.pdf — ready to sign" },
    { icon: PenLine, sig: ar ? "تركي المطيري" : "Turki Almutairi", label: ar ? "وقّع الطرف الأول" : "First party signed" },
    { icon: PenLine, sig: ar ? "سارة الحربي" : "Sara Alharbi", label: ar ? "وقّع الطرف الثاني" : "Second party signed" },
    { icon: ShieldCheck, badge: "PWC-8F3A-Q2K9-77DX", label: ar ? "شارة تحقق مشفّرة + بصمة الملف" : "Encrypted verification badge + file fingerprint" },
  ];

  const [shown, setShown] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setShown((s) => (s >= steps.length ? 0 : s + 1)),
      shown >= steps.length ? 4000 : 900
    );
    return () => clearTimeout(timer);
  }, [shown, steps.length]);

  return (
    <div className="px-4 py-14 sm:px-6 md:px-10">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-landing-gold/10 text-landing-gold text-sm font-body font-semibold mb-4">
          <PenLine className="w-4 h-4" strokeWidth={1.75} /> {ar ? "التوقيع الإلكتروني الموثّق" : "Verified Digital Signing"}
        </p>
        <h2 className="font-heading text-3xl md:text-4xl font-semibold text-[#3a2f22]">
          {ar ? "وقّع أي مستند... بشارة تحقق مشفّرة" : "Sign any document... with an encrypted verification badge"}
        </h2>
        <p className="text-sm text-[#3a2f22]/55 font-body mt-3 max-w-xl mx-auto">
          {ar
            ? "أرسل المستند لعدة موقّعين، كلٌّ يوقّع في مكانه المحدد، وتُختم النسخة النهائية ببصمة رقمية يمكن لأي جهة التحقق منها."
            : "Send a document to multiple signers, each signs at their assigned spot, and the final copy is sealed with a digital fingerprint anyone can verify."}
        </p>
      </div>

      <div className="max-w-lg mx-auto rounded-2xl border border-landing-gold/20 bg-white shadow-xl shadow-[#3a2f22]/10 p-5">
        <div className="space-y-2 min-h-[260px]">
          {steps.slice(0, shown).map((step, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-landing-gold/20 bg-landing-bg/60 px-4 py-3">
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 text-landing-gold border border-landing-gold/20">
                <step.icon className="w-4 h-4" strokeWidth={1.75} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body text-[#3a2f22]" dir="auto">{step.label}</p>
                {step.sig && (
                  <p className="text-xl text-landing-gold-deep leading-tight" style={{ fontFamily: ar ? "'Aref Ruqaa', serif" : "'Great Vibes', cursive" }} dir="auto">
                    {step.sig}
                  </p>
                )}
                {step.badge && (
                  <p className="flex items-center gap-1.5 text-[11px] font-body text-landing-gold-deep mt-0.5" dir="ltr">
                    <Fingerprint className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} /> {step.badge}
                  </p>
                )}
              </div>
              <CheckCircle2 className="w-4 h-4 text-landing-gold/60 shrink-0" strokeWidth={1.75} />
            </div>
          ))}
          {shown >= steps.length && (
            <p className="flex items-center justify-center gap-1.5 text-xs font-body font-semibold text-emerald-700 pt-2">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
              {ar ? "اكتمل التوقيع — المستند موثّق وقابل للتحقق" : "Signing complete — document sealed & verifiable"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}