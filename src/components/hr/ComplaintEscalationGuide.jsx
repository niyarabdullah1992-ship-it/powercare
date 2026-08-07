import React from "react";
import { Flag } from "lucide-react";

export default function ComplaintEscalationGuide({ ar }) {
  const steps = ar ? [
    "اضغط علامة (+) بجوار الموظف لإضافته إلى مسار الشكاوى.",
    "الموظف الأدنى في الشجرة يأخذ «شكوى 1»، والذي فوقه يأخذ «شكوى 2»، وهكذا تلقائيًا.",
    "تصل الشكوى أولًا إلى المستوى 1، وإذا لم تُحل تنتقل إلى المستوى 2 ثم المستوى التالي.",
    "يمكنك اختيار أي عدد من المستويات، مثل 3 أو 4 أو 5، والعدد يساوي عدد الأشخاص المختارين.",
    "لإزالة شخص من المسار، اضغط شارة الشكوى الموجودة بجوار اسمه."
  ] : [
    "Select the (+) badge beside an employee to add them to the complaint path.",
    "The lowest selected employee becomes ‘Complaint 1’; the person above becomes ‘Complaint 2’, automatically.",
    "A complaint goes to level 1 first, then moves to level 2 and the next levels if unresolved.",
    "You can use any number of levels, such as 3, 4 or 5; the level count equals the selected people.",
    "To remove someone, select the complaint badge beside their name."
  ];
  return <div className="mt-3 rounded-md border border-accent/30 bg-accent/5 p-3"><div className="flex items-center gap-2"><Flag className="h-4 w-4 text-accent" /><p className="text-xs font-semibold">{ar ? "طريقة إعداد مسار تصعيد الشكاوى" : "How to set up complaint escalation"}</p></div><ol className="mt-2 space-y-1.5 text-[11px] leading-5 text-muted-foreground">{steps.map((step, index) => <li key={step} className="flex gap-2"><span className="font-bold text-accent">{index + 1}.</span><span>{step}</span></li>)}</ol><p className="mt-2 border-t border-accent/20 pt-2 text-[11px] font-medium">{ar ? "مثال: مشرف الموظفين = شكوى 1، مدير الموارد البشرية = شكوى 2، مدير الموارد البشرية الأعلى = شكوى 3." : "Example: Team supervisor = Complaint 1, HR manager = Complaint 2, senior HR director = Complaint 3."}</p></div>;
}