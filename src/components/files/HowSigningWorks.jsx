import React, { useState } from "react";
import { ShieldCheck, Fingerprint, QrCode, FileWarning, ChevronDown } from "lucide-react";

// Collapsible explainer: how the signature verification (SHA-256 + QR) works
// and why a copied badge is always detected.
export default function HowSigningWorks({ ar }) {
  const [open, setOpen] = useState(false);

  const steps = ar
    ? [
        { icon: Fingerprint, title: "بصمة رقمية فريدة", text: "عند التوقيع تُحسب بصمة SHA-256 من كل بايت في الملف الموقّع وتُسجَّل في سجل التحقق مع رقم تحقق مشفّر لا يتكرر." },
        { icon: QrCode, title: "ختم برمز QR", text: "يُطبع على المستند ختم يحوي رقم التحقق ورمز QR — مسحه يفتح صفحة التحقق العامة مباشرة." },
        { icon: ShieldCheck, title: "تحقق فوري", text: "أي جهة ترفع الملف في صفحة التحقق تُقارَن بصمته بالسجل: تطابق = الملف سليم وموثّق." },
        { icon: FileWarning, title: "كشف التزوير", text: "لو نُسخ الختم على ملف آخر أو عُدّل حرف واحد بعد التوقيع، تتغير البصمة بالكامل ويظهر فورًا «مزوّر أو معدّل»." },
      ]
    : [
        { icon: Fingerprint, title: "Unique digital fingerprint", text: "On signing, a SHA-256 fingerprint is computed from every byte of the signed file and registered with a one-time encrypted verification ID." },
        { icon: QrCode, title: "QR-coded stamp", text: "A stamp with the verification ID and a QR code is printed on the document — scanning it opens the public verification page." },
        { icon: ShieldCheck, title: "Instant verification", text: "Anyone can upload the file on the verify page: a matching fingerprint means the document is authentic." },
        { icon: FileWarning, title: "Forgery detection", text: "If the stamp is copied onto another file or a single character changes after signing, the fingerprint changes completely and it's flagged as tampered." },
      ];

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-5 py-3.5 text-start"
      >
        <span className="flex items-center gap-2 font-heading text-sm font-semibold">
          <ShieldCheck className="w-4 h-4 text-accent" />
          {ar ? "كيف تعمل خاصية التوقيع الموثّق وكشف التزوير؟" : "How does verified signing & forgery detection work?"}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 grid sm:grid-cols-2 gap-3">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-card border border-border">
              <s.icon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold font-body">{s.title}</p>
                <p className="text-[11px] text-muted-foreground font-body mt-0.5 leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
          <p className="sm:col-span-2 text-[11px] text-muted-foreground font-body bg-muted rounded-md px-3 py-2">
            {ar
              ? "القاعدة الذهبية: لا تُعتمد الوثيقة بشكل الختم، بل بنتيجة التحقق — امسح رمز QR أو ارفع الملف في قسم «التحقق من حالة ملف موقّع» أدناه."
              : "Golden rule: trust the verification result, not the stamp's look — scan the QR or upload the file in the \"Verify a signed document\" section below."}
          </p>
        </div>
      )}
    </div>
  );
}