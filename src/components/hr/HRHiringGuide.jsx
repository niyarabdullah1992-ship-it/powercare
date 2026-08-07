import React from "react";
import { ArrowDown, UserPlus, Users } from "lucide-react";

const CONTENT = {
  ar: {
    title: "كيف توظف فريق الموارد البشرية داخل الشجرة؟",
    intro: "يمكن وضع مدير الموارد البشرية تحت المحطة مباشرة، أو تحت مدير آخر داخل المحطة، ثم إضافة مساعديه وموظفيه تحته.",
    steps: ["اختر المحطة التي سيتبع لها قسم الموارد البشرية.", "اضغط «إضافة» واختر «موظف»، ثم أدخل بيانات مدير الموارد البشرية واختر المحطة.", "حدد مسمى «مدير الموارد البشرية» وصلاحياته، ثم ضعه تحت المحطة مباشرة أو تحت المدير المسؤول داخلها.", "أضف المساعدين والموظفين من زر «إضافة» وحدد محطتهم ومسمياتهم وصلاحياتهم.", "اجعل مدير الموارد البشرية المسؤول المباشر عنهم، أو ضع مشرفًا تحته ثم اربط الموظفين بالمشرف.", "احفظ وتأكد من ظهور المساعدين والموظفين تحت مدير الموارد البشرية."],
    examples: ["المحطة ↓ مدير الموارد البشرية ↓ المساعدون والموظفون", "المحطة ↓ المدير المسؤول ↓ مدير الموارد البشرية ↓ المساعدون والموظفون"]
  },
  en: {
    title: "How do you hire an HR team in the tree?",
    intro: "Place the HR manager directly below the station or below another manager in that station, then add assistants and employees below the HR manager.",
    steps: ["Choose the station that the HR team belongs to.", "Select Add and Employee, enter the HR manager details, and choose the station.", "Set the HR Manager title and permissions, then place them below the station or its responsible manager.", "Add assistants and employees with their station, titles and required permissions.", "Choose the HR manager as their direct parent, or place a supervisor between them.", "Save and confirm assistants and employees appear below the HR manager."],
    examples: ["Station ↓ HR Manager ↓ Assistants and employees", "Station ↓ Responsible manager ↓ HR Manager ↓ Assistants and employees"]
  }
};

export default function HRHiringGuide({ lang }) {
  const copy = CONTENT[lang === "ar" ? "ar" : "en"];
  return <section className="rounded-xl border border-accent/30 bg-card p-5" dir={lang === "ar" ? "rtl" : "ltr"}>
    <div className="flex items-start gap-3"><span className="rounded-lg bg-accent/15 p-2"><UserPlus className="h-5 w-5 text-accent" /></span><div><h2 className="font-heading text-xl font-semibold">{copy.title}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.intro}</p></div></div>
    <ol className="mt-4 grid gap-2 md:grid-cols-2">{copy.steps.map((step, index) => <li key={step} className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{index + 1}</span><span>{step}</span></li>)}</ol>
    <div className="mt-4 space-y-2">{copy.examples.map((example, index) => <div key={example} className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm font-semibold"><Users className="h-4 w-4 shrink-0 text-accent" /><span>{index + 1}. {example}</span><ArrowDown className="h-4 w-4 shrink-0 text-muted-foreground" /></div>)}</div>
  </section>;
}