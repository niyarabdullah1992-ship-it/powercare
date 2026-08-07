import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { MapPin, ListTodo, MessageSquare, Megaphone, Sparkles, PartyPopper, ChevronRight, ChevronLeft, X } from "lucide-react";

// جولة تعريفية تظهر مرة واحدة للموظف الجديد عند أول دخول — تشرح أهم أقسام التطبيق.
const STEPS = [
  { icon: PartyPopper, ar: { title: "أهلًا بك في NiroVera!", desc: "هذه جولة سريعة (دقيقة واحدة) تعرّفك على أهم ما تحتاجه في يومك. يمكنك تخطيها في أي وقت." }, en: { title: "Welcome to NiroVera!", desc: "A quick one-minute tour of everything you need day to day. You can skip anytime." } },
  { icon: MapPin, ar: { title: "تسجيل الحضور", desc: "أول شيء في يومك: بطاقة تسجيل الحضور أعلى الصفحة الرئيسية — ضغطة واحدة وسيتم التحقق من موقعك تلقائيًا داخل نطاق المحطة." }, en: { title: "Check-in", desc: "First thing each day: the check-in card at the top of your home page — one tap, and your GPS location is verified automatically." } },
  { icon: ListTodo, ar: { title: "مهامي", desc: "من قسم «المهام» تتابع كل مهمة مسندة إليك: سجّل تقدمك، أرفق إثبات الإنجاز عند الاكتمال، وبلّغ عن أي معوّق يوقف العمل." }, en: { title: "My Tasks", desc: "In the Tasks section you track every task assigned to you: log progress, attach completion proof, and report blocking issues." } },
  { icon: MessageSquare, ar: { title: "المحادثات", desc: "تواصل مع فريق محطتك في المحادثة الجماعية، أو راسل أي زميل مباشرة — مع إمكانية إرفاق صور وملفات." }, en: { title: "Chat", desc: "Talk with your station's team group chat, or message any colleague directly — with photos and file attachments." } },
  { icon: Megaphone, ar: { title: "الشكاوى والبلاغات", desc: "لديك ملاحظة أو مشكلة؟ قدّمها باسمك أو بهوية مجهولة تمامًا — وتُصعّد تلقائيًا عبر الهرم الإداري حتى تُحل." }, en: { title: "Complaints & Reports", desc: "Have a concern? Submit it with your name or fully anonymously — it escalates automatically until resolved." } },
  { icon: Sparkles, ar: { title: "المساعد الذكي نيرو", desc: "اسأل نيرو عن مهامك، حضورك، أو أي قسم في المنصة — ويمكنه تنفيذ إجراءات فعلية مثل تسجيل تقدم مهمة. جرّبه الآن!" }, en: { title: "Niro AI Assistant", desc: "Ask Niro about your tasks, attendance, or any section — it can even execute real actions like logging task progress. Try it!" } },
];

export default function EmployeeTour({ user, company }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const key = `powercare_tour_done_${company?.id}_${user?.id}`;
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem(key); } catch { return false; }
  });
  const [step, setStep] = useState(0);

  if (!open) return null;

  const finish = () => {
    try { localStorage.setItem(key, "1"); } catch { /* ignore */ }
    setOpen(false);
  };

  const s = STEPS[step];
  const txt = isAr ? s.ar : s.en;
  const Icon = s.icon;
  const last = step === STEPS.length - 1;
  const Next = isAr ? ChevronLeft : ChevronRight;
  const Back = isAr ? ChevronRight : ChevronLeft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5 relative">
        <button onClick={finish} aria-label="skip" className="absolute top-3 end-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground">
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
          <Icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
        </div>

        <div className="text-center space-y-2">
          <h3 className="font-heading text-xl font-semibold">{txt.title}</h3>
          <p className="text-sm text-muted-foreground font-body leading-6">{txt.desc}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-accent" : "w-1.5 bg-muted-foreground/30"}`} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-4 py-2.5 rounded-lg border border-border text-sm font-body hover:bg-muted">
              <Back className="w-4 h-4" /> {isAr ? "السابق" : "Back"}
            </button>
          ) : (
            <button onClick={finish} className="px-4 py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:bg-muted">
              {isAr ? "تخطي" : "Skip"}
            </button>
          )}
          <button
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg bg-foreground text-background text-sm font-body hover:bg-accent"
          >
            {last ? (isAr ? "ابدأ العمل 🚀" : "Get started 🚀") : (isAr ? "التالي" : "Next")}
            {!last && <Next className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}