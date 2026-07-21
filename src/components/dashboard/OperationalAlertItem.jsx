import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Boxes, ChevronDown, Clock3, ListTodo, Sparkles, UserX } from "lucide-react";

const icons = { stock: Boxes, requests: Clock3, absence: UserX, tasks: ListTodo };
const copy = {
  ar: {
    stock: ["مخزون ناقص", "انخفض رصيد بعض الأصناف عن الحد الأدنى المحدد.", "راجع الأصناف الحرجة وابدأ طلب توريد حسب الأولوية التشغيلية."],
    requests: ["طلبات متأخرة الصرف", "توجد طلبات معتمدة لم تُصرف خلال 48 ساعة.", "ابدأ بالطلبات الأقدم وتحقق من توفر المواد قبل جدولة الصرف."],
    absence: ["غياب غير مبرر", "توجد حالات غياب مسجلة دون عذر معتمد.", "تواصل مع الموظفين ثم حدّث الحالة أو ارفعها للمسؤول المباشر."],
    tasks: ["مهام متأخرة", "تجاوزت بعض المهام موعدها دون إكمال.", "ابدأ بالمهام الأعلى خطورة وحدد العائق والمسؤول وموعد المعالجة."],
    niro: "اقتراح نيرو", open: "فتح القسم", affected: "حالات متأثرة",
  },
  en: {
    stock: ["Low stock", "Some item balances are below their minimum levels.", "Review critical items and start replenishment by operational priority."],
    requests: ["Delayed approved requests", "Approved requests have been waiting over 48 hours.", "Start with the oldest requests and verify availability before issuing."],
    absence: ["Unexcused absences", "Attendance records include absences without an approved excuse.", "Contact the employees, then update or escalate each case."],
    tasks: ["Overdue tasks", "Some incomplete tasks have passed their deadlines.", "Prioritize the highest-risk tasks and assign blockers, owners, and recovery dates."],
    niro: "Niro suggestion", open: "Open section", affected: "Affected cases",
  },
};

export default function OperationalAlertItem({ alert, lang }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const text = copy[lang === "ar" ? "ar" : "en"];
  const [label, detail, solution] = text[alert.category];
  const Icon = icons[alert.category] || AlertTriangle;
  return <div className="rounded-xl border border-border bg-background overflow-hidden">
    <button onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-start hover:bg-amber-500/5"><Icon className="h-5 w-5 shrink-0 text-amber-700" /><span className="min-w-0 flex-1"><strong className="block text-2xl leading-none">{alert.count}</strong><span className="mt-1 block text-xs text-muted-foreground">{label}</span></span><ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} /></button>
    {open && <div className="border-t border-border px-4 py-4 text-sm"><p className="leading-6 text-foreground/80">{detail} <strong>{alert.count} {text.affected}</strong>.</p><div className="mt-3 rounded-xl bg-accent/10 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-accent"><Sparkles className="h-4 w-4" />{text.niro}</p><p className="mt-2 leading-6">{solution}</p></div><button onClick={() => navigate(alert.to)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">{text.open}<ArrowUpRight className="h-3.5 w-3.5" /></button></div>}
  </div>;
}