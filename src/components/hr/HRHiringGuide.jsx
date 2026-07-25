import React from "react";
import { ArrowDown, UserPlus, Users } from "lucide-react";

const CONTENT = {
  ar: {
    title: "كيف توظف فريق الموارد البشرية داخل الشجرة؟",
    intro: "أضف موظف الموارد البشرية مباشرة من الشجرة، وحدد محطته وصلاحياته ومديره ليصبح جزءًا من قسم HR داخل الهيكل نفسه.",
    steps: ["اضغط «إضافة» داخل الشجرة، ثم اختر «موظف».", "أدخل اسم الموظف وبريده الإلكتروني، ثم اختر محطته من قائمة المحطات.", "حدد مسماه: توظيف، رواتب، تدريب، علاقات موظفين، أو مساعد مدير HR.", "اختر صلاحيات عمله فقط، مثل التوظيف أو الرواتب أو التدريب.", "حدد مدير الموارد البشرية أو المشرف بوصفه المسؤول المباشر من حقل التبعية.", "احفظ وتأكد من ظهور بطاقته تحت المدير أو المشرف المسؤول."],
    example: "مثال: مدير HR ← مساعد المدير ← أخصائي توظيف وموظف رواتب"
  },
  en: {
    title: "How do you hire an HR team in the tree?",
    intro: "Add the HR employee directly from the tree, then choose their station, permissions and manager.",
    steps: ["Select Add inside the tree, then choose Employee.", "Enter the employee name and email, then select their station.", "Set their HR title: recruiter, payroll, training, relations, or HR assistant.", "Grant only the work permissions they need.", "Choose the HR manager or supervisor as their direct parent.", "Save and confirm their card appears below the responsible manager."],
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