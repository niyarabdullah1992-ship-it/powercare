import React, { useState } from "react";
import { ChevronDown, ChevronUp, GitBranch, KeyRound, MapPin, Move, Route, UserPlus } from "lucide-react";
import ComplaintEscalationGuide from "@/components/hr/ComplaintEscalationGuide";
import HRHiringGuide from "@/components/hr/HRHiringGuide";

const items = [
  [UserPlus, "أنشئ الهيكل مباشرة", "Create directly", "أضف محطة أو موظفًا، ثم حدّد المسمى والموقع والصلاحيات.", "Add a site or employee, then define title, location and access."],
  [GitBranch, "افهم العلاقة", "Understand hierarchy", "العقدة العليا تدير ما تحتها، والفروع تمثل الفرق والمحطات التابعة.", "Higher nodes manage descendants; branches represent reporting teams and sites."],
  [Move, "غيّر الموضع والعلاقة", "Move and reorganize", "ضع العقدة أعلى أو أسفل عقدة أخرى لتغيير التبعية، أو بجانبها لتغيير الترتيب.", "Drop above or below another node to change reporting, or beside it to change order."],
  [KeyRound, "اربط الصلاحيات", "Attach permissions", "صلاحيات العرض والإدارة تتبع الموظف وموقعه داخل الهيكل.", "View and manage permissions follow the employee and hierarchy position."],
  [MapPin, "اربط الموظف بالمحطة", "Connect people to sites", "استخدم خيار «تابع» لوضع موظفين ومحطات فرعية معًا تحت المحطة نفسها دون إزالة أي فرع.", "Use Inside to place employees and child sites together under the same site without removing any branch."],
  [Route, "فعّل مسار التصعيد", "Drive escalation", "ترتيب المديرين في الشجرة يحدد انتقال الشكاوى والاعتراضات تلقائيًا.", "Management order automatically drives complaints and dispute escalation."],
];

export default function OrgTreeGuide({ ar }) {
  const [open, setOpen] = useState(false);
  return <div className="border-b border-accent/20 bg-secondary/45 px-4 py-4"><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-start"><div><h3 className="text-sm font-semibold">{ar ? "كيف تعمل شجرة الموارد البشرية؟" : "How does the HR tree work?"}</h3><p className="mt-1 text-xs text-muted-foreground">{ar ? "اضغط لعرض شرح الشجرة ومسار تصعيد الشكاوى." : "Select to view the tree and complaint escalation guide."}</p></div>{open ? <ChevronUp className="h-5 w-5 shrink-0 text-accent" /> : <ChevronDown className="h-5 w-5 shrink-0 text-accent" />}</button>{open && <div className="mt-4"><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{items.map(([Icon, arTitle, enTitle, arText, enText]) => <div key={enTitle} className="flex gap-3 rounded-md border bg-card p-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><div><p className="text-xs font-semibold">{ar ? arTitle : enTitle}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{ar ? arText : enText}</p></div></div>)}</div><div className="mt-4"><HRHiringGuide lang={ar ? "ar" : "en"} /></div><ComplaintEscalationGuide ar={ar} /></div>}</div>;
}