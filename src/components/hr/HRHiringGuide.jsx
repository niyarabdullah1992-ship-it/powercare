import React from "react";
import { ArrowDown, UserPlus, Users } from "lucide-react";

const CONTENT = {
  ar: {
    title: "كيف توظف فريق الموارد البشرية داخل الشجرة؟",
    intro: "ابدأ بالمحطة، ثم أضف مدير الموارد البشرية تحتها، وبعد ذلك أضف مساعديه وموظفيه تحته داخل الشجرة.",
    steps: ["اختر المحطة التي سيتبع لها قسم الموارد البشرية.", "اضغط «إضافة» واختر «موظف»، ثم أدخل بيانات مدير الموارد البشرية واختر المحطة.", "حدد مسمى «مدير الموارد البشرية» وامنحه صلاحيات HR المناسبة، ثم اجعل المحطة هي العقدة الأعلى له.", "أضف المساعدين والموظفين من زر «إضافة» وحدد محطتهم ومسمياتهم وصلاحياتهم.", "اجعل مدير الموارد البشرية المسؤول المباشر عنهم، أو ضع مشرفًا تحته ثم اربط الموظفين بالمشرف.", "احفظ وتأكد من ترتيب الشجرة: المحطة، ثم مدير HR، ثم المساعدون والموظفون."],
    example: "مثال: المحطة ← مدير HR ← مساعد المدير ← أخصائي توظيف وموظف رواتب"
  },
  en: {
    title: "How do you hire an HR team in the tree?",
    intro: "Start with the station, place the HR manager below it, then place assistants and HR employees below the manager.",
    steps: ["Choose the station that the HR team belongs to.", "Select Add and Employee, enter the HR manager details, and choose the station.", "Set the HR Manager title and permissions, then place the manager below the station.", "Add assistants and employees with their station, titles and required permissions.", "Choose the HR manager as their direct parent, or place a supervisor between them.", "Save and confirm the order: station, HR manager, then assistants and employees."],
    example: "Example: Station → HR Manager → HR Assistant → Recruiter and Payroll Officer"
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