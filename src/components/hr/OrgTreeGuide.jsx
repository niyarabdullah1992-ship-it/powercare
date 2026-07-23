import React from "react";
import { GitBranch, KeyRound, MapPin, Move, Route, UserPlus } from "lucide-react";

const items = [
  [UserPlus, "أنشئ الهيكل مباشرة", "Create directly", "أضف محطة أو موظفًا، ثم حدّد المسمى والموقع والصلاحيات.", "Add a site or employee, then define title, location and access."],
  [GitBranch, "افهم العلاقة", "Understand hierarchy", "العقدة العليا تدير ما تحتها، والفروع تمثل الفرق والمحطات التابعة.", "Higher nodes manage descendants; branches represent reporting teams and sites."],
  [Move, "غيّر موضع العقد", "Move any node", "اسحب أعلى أو أسفل أو يمينًا أو يسارًا لتغيير المستوى أو الترتيب.", "Drag up, down, left or right to change level or order."],
  [KeyRound, "اربط الصلاحيات", "Attach permissions", "صلاحيات العرض والإدارة تتبع الموظف وموقعه داخل الهيكل.", "View and manage permissions follow the employee and hierarchy position."],
  [MapPin, "اربط الموظف بالمحطة", "Connect people to sites", "وضع الموظف تحت محطة يحدد نطاقه التشغيلي ومسؤولياته المحلية.", "Placing a person under a site defines operating scope and local responsibility."],
  [Route, "فعّل مسار التصعيد", "Drive escalation", "ترتيب المديرين في الشجرة يحدد انتقال الشكاوى والاعتراضات تلقائيًا.", "Management order automatically drives complaints and dispute escalation."],
];

export default function OrgTreeGuide({ ar }) {
  return <div className="border-b border-accent/20 bg-secondary/45 px-4 py-4"><div className="mb-3"><h3 className="text-sm font-semibold">{ar ? "كيف تعمل شجرة الموارد البشرية؟" : "How does the HR tree work?"}</h3><p className="mt-1 text-xs text-muted-foreground">{ar ? "الشجرة ليست رسمًا فقط؛ كل موضع فيها يحدد علاقة إدارية ونطاق عمل وصلاحيات ومسار تصعيد." : "The tree is not only a diagram; every position defines reporting, scope, permissions and escalation."}</p></div><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{items.map(([Icon, arTitle, enTitle, arText, enText]) => <div key={enTitle} className="flex gap-3 rounded-md border bg-card p-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><div><p className="text-xs font-semibold">{ar ? arTitle : enTitle}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{ar ? arText : enText}</p></div></div>)}</div></div>;
}