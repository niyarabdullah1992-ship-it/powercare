import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MobilePhoneFrame from "@/components/landing/MobilePhoneFrame";

const SCREENS = [
  {
    id: "attendance",
    num: "01",
    titleAr: "تسجيل الحضور",
    titleEn: "Check in",
    blurbAr: "الزر يعمل فقط داخل نطاق المحطة. خارجه يظهر السبب والمسافة — لا رسالة خطأ مبهمة.",
    blurbEn: "The button works only inside the station geofence. Outside it, the reason and distance are named — never a vague error.",
    to: "/app/attendance",
    ctaAr: "فتح الحضور",
    ctaEn: "Open attendance",
    phoneTitleAr: "الحضور",
    phoneTitleEn: "Attendance",
    preview: "attendance",
  },
  {
    id: "tasks",
    num: "02",
    titleAr: "مهامي",
    titleEn: "My tasks",
    blurbAr: "مهام اليوم فقط، مرتبة بأولويتها. المتأخرة أعلى القائمة بلونها.",
    blurbEn: "Today’s tasks only, ordered by priority. Overdue items rise to the top in their status color.",
    to: "/app/tasks",
    ctaAr: "فتح المهام",
    ctaEn: "Open tasks",
    phoneTitleAr: "مهامي",
    phoneTitleEn: "My tasks",
    preview: "tasks",
  },
  {
    id: "proof",
    num: "03",
    titleAr: "إغلاق العمل",
    titleEn: "Close the work",
    blurbAr: "لا يُغلق العمل دون صورة بعد التنفيذ، مختومة بالموقع والوقت تلقائيًا.",
    blurbEn: "Work cannot close without an after photo, stamped with place and time automatically.",
    to: "/app/work-proof",
    ctaAr: "فتح إثبات العمل",
    ctaEn: "Open work proof",
    phoneTitleAr: "إثبات العمل",
    phoneTitleEn: "Work proof",
    preview: "proof",
  },
  {
    id: "anon",
    num: "04",
    titleAr: "بلاغ مجهول",
    titleEn: "Anonymous report",
    blurbAr: "الرمز يتغيّر دوريًا. الشاشة تقول صراحةً من يقرأ البلاغ ومن لا يقرأه.",
    blurbEn: "The code rotates on a schedule. The screen states clearly who can read the report — and who cannot.",
    to: "/app/complaints",
    ctaAr: "فتح البلاغات",
    ctaEn: "Open complaints",
    phoneTitleAr: "بلاغ مجهول",
    phoneTitleEn: "Anonymous",
    preview: "anon",
  },
];

function AttendancePreview({ ar }) {
  return (
    <div className="flex flex-col gap-3 p-3.5" dir={ar ? "rtl" : "ltr"}>
      <div className="rounded-2xl bg-[#0B1A3F] p-4 text-white">
        <p className="text-[11px] font-semibold tracking-[0.1em] text-[#6EE7B7]">
          {ar ? "وردية الصباح" : "Morning shift"}
        </p>
        <p className="mt-2 font-heading text-[40px] font-semibold leading-none" dir="ltr">
          05:47
        </p>
        <p className="mt-2 text-[12px] text-[#94A3B8]">
          {ar ? "محطة الجبيل 1" : "Jubail Station 1"}
        </p>
      </div>
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#0E7A4B]" />
          <span className="text-[13px] font-medium text-[#0B1A3F]">
            {ar ? "داخل نطاق المحطة" : "Inside station range"}
          </span>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-[#5A6B85]">
          {ar ? "تبعد 12 م · دقة الموقع 4 م" : "12 m away · location accuracy 4 m"}
        </p>
      </div>
      <div className="flex h-12 items-center justify-center rounded-2xl bg-[#0E7A4B] text-[14px] font-semibold text-white">
        {ar ? "تسجيل الدخول للوردية" : "Clock in to shift"}
      </div>
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5">
        <p className="text-[12px] font-semibold text-[#5A6B85]">{ar ? "وردية أمس" : "Yesterday"}</p>
        <div className="mt-2 flex items-center gap-2 text-[13px] font-medium text-[#0B1A3F]" dir="ltr">
          <span>05:52</span>
          <span className="h-0.5 flex-1 rounded bg-[#E2E8F0]" />
          <span>14:06</span>
        </div>
        <p className="mt-2 text-[12px] text-[#5A6B85]">
          {ar ? "8س 14د · بلا ملاحظات" : "8h 14m · no notes"}
        </p>
      </div>
    </div>
  );
}

function TasksPreview({ ar }) {
  return (
    <div className="flex flex-col gap-2.5 p-3.5" dir={ar ? "rtl" : "ltr"}>
      <div className="flex gap-2">
        <span className="rounded-full bg-[#0B1A3F] px-3 py-1.5 text-[12px] font-semibold text-white">
          {ar ? "اليوم · 4" : "Today · 4"}
        </span>
        <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] text-[#5A6B85]">
          {ar ? "الأسبوع · 11" : "Week · 11"}
        </span>
      </div>
      <div className="rounded-2xl border border-[#FECACA] bg-white p-3.5">
        <div className="flex items-start gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#DC2626]" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-snug text-[#0B1A3F]">
              {ar ? "استبدال صمام الضغط العالي" : "Replace HP valve"}
            </p>
            <p className="mt-1 text-[11px] font-medium text-[#DC2626]">
              {ar ? "متأخرة يومين" : "2 days overdue"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="flex-1 rounded-xl bg-[#0E7A4B] py-2 text-center text-[12px] font-semibold text-white">
            {ar ? "ابدأ" : "Start"}
          </span>
          <span className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#5A6B85]">
            {ar ? "تفاصيل" : "Details"}
          </span>
        </div>
      </div>
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5">
        <div className="flex items-start gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#F59E0B]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-snug text-[#0B1A3F]">
              {ar ? "فحص دوري لوحدة التبريد" : "Cooling unit PM"}
            </p>
            <p className="mt-1 text-[11px] text-[#5A6B85]">{ar ? "اليوم · 70%" : "Today · 70%"}</p>
            <div className="mt-2 h-1 overflow-hidden rounded bg-[#F1F5F9]">
              <span className="block h-full w-[70%] rounded bg-[#F59E0B]" />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5">
        <div className="flex items-start gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#94A3B8]" />
          <div>
            <p className="text-[13px] font-semibold leading-snug text-[#0B1A3F]">
              {ar ? "معايرة أجهزة التدفق" : "Calibrate flow meters"}
            </p>
            <p className="mt-1 text-[11px] text-[#5A6B85]">{ar ? "غدًا · لم تبدأ" : "Tomorrow · not started"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofPreview({ ar }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3 p-3.5" dir={ar ? "rtl" : "ltr"}>
      <div>
        <p className="text-[14px] font-semibold leading-snug text-[#0B1A3F]">
          {ar ? "استبدال صمام الضغط العالي" : "Replace HP valve"}
        </p>
        <p className="mt-1 font-mono text-[11px] text-[#94A3B8]" dir="ltr">
          OPS-4821
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex h-[120px] flex-col items-center justify-center gap-1 rounded-xl border border-[#E2E8F0] bg-white">
          <span className="text-[10px] tracking-wide text-[#94A3B8]">{ar ? "قبل" : "Before"}</span>
          <span className="font-heading text-[13px] text-[#CBD5E1]" dir="ltr">
            06:18
          </span>
          <span className="text-[11px] font-medium text-[#0E7A4B]">{ar ? "مرفوعة" : "Uploaded"}</span>
        </div>
        <div className="flex h-[120px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#0E7A4B] bg-white">
          <span className="text-[10px] tracking-wide text-[#94A3B8]">{ar ? "بعد" : "After"}</span>
          <span className="text-[13px] font-semibold text-[#0E7A4B]">{ar ? "التقط صورة" : "Take photo"}</span>
        </div>
      </div>
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
        <div className="flex items-center gap-2 text-[12px] text-[#0B1A3F]">
          <span className="h-2 w-2 rounded-full bg-[#0E7A4B]" />
          {ar ? "داخل نطاق الجبيل 1 · 5 م" : "Inside Jubail 1 · 5 m"}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-[#5A6B85]">
          <span className="h-2 w-2 rounded-full bg-[#CBD5E1]" />
          {ar ? "بانتظار مراجعة المشرف" : "Awaiting supervisor review"}
        </div>
      </div>
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
        <p className="text-[12px] font-semibold text-[#5A6B85]">{ar ? "ملاحظة التنفيذ" : "Execution note"}</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#94A3B8]">
          {ar ? "اكتب ما تغيّر أو ما يحتاج متابعة…" : "Note what changed or needs follow-up…"}
        </p>
      </div>
      <div className="mt-auto">
        <div className="flex h-11 items-center justify-center rounded-xl bg-[#E2E8F0] text-[14px] font-semibold text-[#94A3B8]">
          {ar ? "أغلق العمل" : "Close work"}
        </div>
        <p className="mt-2 text-center text-[11px] text-[#94A3B8]">
          {ar ? "يُفعَّل بعد رفع صورة «بعد»" : "Enabled after the “after” photo"}
        </p>
      </div>
    </div>
  );
}

function AnonPreview({ ar }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3 p-3.5" dir={ar ? "rtl" : "ltr"}>
      <div className="rounded-2xl bg-[#0B1A3F] p-4 text-white">
        <p className="text-[12px] font-semibold text-[#6EE7B7]">{ar ? "هويتك محمية" : "Your identity is protected"}</p>
        <p className="mt-2 text-[12px] leading-relaxed text-[#CBD5E1]">
          {ar
            ? "يصل بلاغك برمز مؤقت. لا يستطيع مديرك ولا مدير النظام ربطه بك."
            : "Your report arrives under a temporary code. Neither your manager nor the system admin can link it to you."}
        </p>
        <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-center font-mono text-[13px]" dir="ltr">
          ANON-4F2B91C0
        </p>
        <p className="mt-2 text-center text-[11px] text-[#94A3B8]">
          {ar ? "يتغيّر الرمز بعد 21 يومًا" : "Code rotates after 21 days"}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(ar ? ["سلامة", "سلوك", "مرافق", "اقتراح"] : ["Safety", "Conduct", "Facilities", "Idea"]).map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1.5 text-[12px] ${
              i === 0 ? "bg-[#0B1A3F] font-semibold text-white" : "border border-[#E2E8F0] bg-white text-[#5A6B85]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="flex-1 rounded-2xl border border-[#E2E8F0] bg-white p-3.5">
        <p className="text-[13px] leading-relaxed text-[#94A3B8]">
          {ar ? "اشرح ما حدث، ومتى، وأين. أرفق صورة إن أمكن." : "Explain what happened, when, and where. Attach a photo if you can."}
        </p>
      </div>
      <div className="flex h-11 items-center justify-center rounded-xl bg-[#0E7A4B] text-[14px] font-semibold text-white">
        {ar ? "أرسل البلاغ" : "Send report"}
      </div>
      <p className="text-center text-[11px] leading-relaxed text-[#94A3B8]">
        {ar
          ? "يصل لمنسق السلامة ويُصعَّد تلقائيًا بعد 24 ساعة"
          : "Goes to the safety coordinator; auto-escalates after 24 hours"}
      </p>
    </div>
  );
}

const PREVIEWS = {
  attendance: AttendancePreview,
  tasks: TasksPreview,
  proof: ProofPreview,
  anon: AnonPreview,
};

export default function MobileFieldScreens({ ar }) {
  return (
    <section id="field-screens" className="border-b border-[#E4E7EC] bg-[#F7F8FA]">
      <div className="mx-auto max-w-[1320px] px-6 py-16 md:px-8 md:py-[72px]">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0E7A4B]">
            {ar ? "يوم الميدان" : "FIELD DAY"}
          </p>
          <h2 className="mt-3 font-heading text-[28px] font-semibold text-[#0B1A3F] md:text-[32px]">
            {ar ? "كل شاشة فعل واحد" : "One job per screen"}
          </h2>
          <p className="mt-3 text-[15px] leading-[1.85] text-[#5A6478]">
            {ar
              ? "لا قوائم ولا إعدادات في الجيب — أربع أفعال تغطي الحضور والمهمة والإثبات والبلاغ، وكلها تغذي دورة الإثبات في المنصة."
              : "No menus or settings in the pocket — four actions cover attendance, task, proof, and report, each feeding the platform proof cycle."}
          </p>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
          {SCREENS.map((screen, index) => {
            const Preview = PREVIEWS[screen.preview];
            return (
              <motion.article
                key={screen.id}
                className="mobile-field-screen flex flex-col gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-heading text-[13px] font-semibold text-[#0E7A4B]">{screen.num}</span>
                    <h3 className="m-0 text-[16px] font-semibold text-[#0B1A3F]">
                      {ar ? screen.titleAr : screen.titleEn}
                    </h3>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-[1.7] text-[#5A6B85]">
                    {ar ? screen.blurbAr : screen.blurbEn}
                  </p>
                </div>

                <MobilePhoneFrame title={ar ? screen.phoneTitleAr : screen.phoneTitleEn}>
                  <Preview ar={ar} />
                </MobilePhoneFrame>

                <Link
                  to="/login"
                  state={{ from: screen.to }}
                  className="institutional-cta self-start rounded-[9px] bg-[#0B1A3F] px-4 py-2.5 text-[13px] text-white transition-colors hover:bg-[#14233C]"
                >
                  {ar ? screen.ctaAr : screen.ctaEn}
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
