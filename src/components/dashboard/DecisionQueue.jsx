import React from "react";
import { Link } from "react-router-dom";
import { Bot, FileBarChart, ListChecks, ShieldAlert, Sparkles } from "lucide-react";

export default function DecisionQueue({ pendingReports, delayedTasks, safetySignals = 0, lang }) {
  const ar = lang === "ar";
  const commands = [
    ...(safetySignals > 0 ? [{ icon: ShieldAlert, title: ar ? "عالج وضع السلامة العاجل" : "Address urgent safety status", note: ar ? `${safetySignals} إشارة سلامة تتطلب تدخلاً` : `${safetySignals} safety signals need intervention`, prompt: ar ? "حلل وضع السلامة الحالي: المحطات الحرجة والحوادث الأخيرة والمخاطر المفتوحة، واقترح خطة معالجة عاجلة" : "Analyze the current safety status: critical stations, recent incidents and open hazards, and propose an urgent remediation plan" }] : []),
    { icon: FileBarChart, title: ar ? "أنشئ تقريراً تنفيذياً شاملاً PDF" : "Create an executive PDF report", note: ar ? `${pendingReports} تقارير تنتظر المراجعة` : `${pendingReports} reports await review`, prompt: ar ? "أنشئ مستنداً تنفيذياً شاملاً يلخص المهام والحضور والسلامة مع أهم المخاطر والقرارات المقترحة" : "Create a comprehensive executive document summarizing tasks, attendance, safety, key risks and recommended decisions" },
    { icon: ListChecks, title: ar ? "حلّل المهام المعرضة للتأخير" : "Analyze delay-prone tasks", note: ar ? `${delayedTasks} مهام تحتاج قراراً` : `${delayedTasks} tasks need a decision`, prompt: ar ? "حلل المهام الحالية وحدد المعرض منها للتأخير مع توصيات عملية" : "Analyze current tasks at risk of delay and recommend actions" },
  ];
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-accent">Decision Engine</p><h2 className="mt-1 font-heading text-2xl font-semibold">{ar ? "قرارات مقترحة" : "Recommended Decisions"}</h2></div><Bot className="h-5 w-5 text-accent" /></div>
      <div className="space-y-2">{commands.map(({ icon: Icon, title, note, prompt }) => <Link key={title} to={`/app/assistant?prompt=${encodeURIComponent(prompt)}`} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-3 hover:bg-white/10"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="text-xs text-white/50">{note}</p></div><Sparkles className="h-4 w-4 text-accent opacity-40 group-hover:opacity-100" /></Link>)}</div>
    </section>
  );
}