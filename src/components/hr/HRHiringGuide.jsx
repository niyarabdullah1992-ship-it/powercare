import React from "react";
import { ArrowDown, UserPlus, Users } from "lucide-react";

const CONTENT = {
  ar: {
    title: "كيف توظف فريق الموارد البشرية داخل الشجرة؟",
    intro: "أنشئ حساب الموظف أولًا، ثم اربطه بمدير الموارد البشرية ليصبح جزءًا من قسم HR داخل الهيكل نفسه.",
    steps: ["من قسم الموظفين أضف الموظف الجديد وأدخل بياناته ودوره ومحطته.", "ارجع إلى الشجرة؛ ستجد الموظف في قائمة الموظفين غير المعينين.", "اسحب الموظف وضعه أسفل مدير الموارد البشرية، أو اختره من زر إضافة موظف.", "حدد مسماه: توظيف، رواتب، تدريب، علاقات موظفين، أو مساعد مدير HR.", "امنحه صلاحيات عمله فقط وحدد نطاق المحطات التي يخدمها.", "احفظ وتأكد من ظهور بطاقته تحت المدير أو المشرف المسؤول."],
    example: "مثال: مدير HR ← مساعد المدير ← أخصائي توظيف وموظف رواتب"
  },
  en: {
    title: "How do you hire an HR team in the tree?",
    intro: "Create the employee account first, then connect it to the HR manager inside the same organization tree.",
    steps: ["Add the employee from Employees and enter their role and station.", "Return to the tree and find them under Unassigned employees.", "Drag them below the HR manager, or select them with Add employee.", "Set their HR title: recruiter, payroll, training, relations, or HR assistant.", "Grant only the permissions they need and choose their station scope.", "Save and confirm their card appears below the responsible manager."],
    example: "Example: HR Manager → HR Assistant → Recruiter and Payroll Officer"
  }
};

export default function HRHiringGuide({ lang }) {
  const copy = CONTENT[lang === "ar" ? "ar" : "en"];
  return <section className="rounded-xl border border-accent/30 bg-card p-5" dir={lang === "ar" ? "rtl" : "ltr"}>
    <div className="flex items-start gap-3"><span className="rounded-lg bg-accent/15 p-2"><UserPlus className="h-5 w-5 text-accent" /></span><div><h2 className="font-heading text-xl font-semibold">{copy.title}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.intro}</p></div></div>
    <ol className="mt-4 grid gap-2 md:grid-cols-2">{copy.steps.map((step, index) => <li key={step} className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{index + 1}</span><span>{step}</span></li>)}</ol>
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm font-semibold"><Users className="h-4 w-4 text-accent" /><span>{copy.example}</span><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>
  </section>;
}