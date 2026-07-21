import React from "react";
import { AlertTriangle, Banknote, CheckCircle2, CircleDot, ClipboardCheck, FileText, FolderOpen, Info, LayoutDashboard, ListTodo, Megaphone, MessageSquare, PenLine, Radio, ReceiptText, ShieldAlert, ShieldCheck, Sparkles, Trophy, UserCog, Users, Warehouse } from "lucide-react";
import ManualBrowserShot from "@/components/manual/ManualBrowserShot";
import { MANUAL_SCREEN_GUIDES } from "@/lib/siteManualScreens";

const ICONS = { dashboard: LayoutDashboard, tasks: ListTodo, attendance: ClipboardCheck, inventory: Warehouse, expenses: ReceiptText, signing: PenLine, niro: Sparkles, employees: Users, stations: Radio, hr: UserCog, payroll: Banknote, performance: Trophy, safety: ShieldCheck, reports: FileText, chat: MessageSquare, files: FolderOpen, complaints: Megaphone };

const InfoList = ({ title, items, tone = "neutral" }) => {
  const styles = { neutral: "border-border bg-muted/35", warning: "border-amber-300/60 bg-amber-50 text-amber-950", danger: "border-destructive/25 bg-destructive/5", success: "border-emerald-300/60 bg-emerald-50 text-emerald-950" };
  const Icon = tone === "warning" ? AlertTriangle : tone === "danger" ? ShieldAlert : tone === "success" ? CheckCircle2 : Info;
  return <div className={`rounded-xl border p-4 ${styles[tone]}`}><h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Icon className="h-4 w-4 text-accent" />{title}</h3><ul className="space-y-2 text-sm leading-7">{items.map((item, index) => <li key={index} className="flex gap-2"><CircleDot className="mt-2 h-3 w-3 shrink-0 text-accent" /><span>{item}</span></li>)}</ul></div>;
};

export default function ManualChapter({ chapter, labels, lang, exportMode }) {
  const screen = chapter.screen || (lang === "ar" ? MANUAL_SCREEN_GUIDES[chapter.id] : null);
  const ChapterIcon = ICONS[chapter.id] || Info;
  return (
    <section id={chapter.id} className="manual-chapter scroll-mt-24 rounded-2xl border border-accent/20 bg-card p-5 shadow-soft md:p-7">
      <div className="mb-5 flex items-center gap-4"><span className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-2 text-primary-foreground"><ChapterIcon className="h-5 w-5" /><b className="text-xs">{chapter.number}</b></span><h2 className="font-heading text-2xl font-semibold md:text-3xl">{chapter.name}</h2></div>
      <ManualBrowserShot route={chapter.route} title={chapter.name} captureLabel={labels.screenshot} language={lang} forceActive={exportMode} />
      <p className="mt-5 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm leading-7 text-foreground/80">{chapter.purpose}</p>
      {screen && <div className="mt-5 rounded-xl border border-accent/20 bg-accent/5 p-4"><h3 className="text-xs font-bold uppercase tracking-wider text-accent">{labels.appearance}</h3><p className="mt-2 text-sm leading-7">{screen.appearance}</p></div>}
      <div className="mt-6"><h3 className="mb-4 text-sm font-bold text-accent">{labels.steps}</h3><ol className="space-y-3">{chapter.steps.map((step, index) => <li key={index} className="flex gap-3 rounded-xl border border-border bg-background/60 p-3 text-sm leading-7"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{index + 1}</span><span>{step}</span></li>)}</ol></div>
      {screen && <div className="mt-6 grid gap-4 md:grid-cols-2"><InfoList title={labels.contains} items={screen.contains} /><InfoList title={labels.controls} items={screen.controls} /></div>}
      <div className="mt-4 grid gap-4 md:grid-cols-2"><InfoList title={labels.roles} items={chapter.roles} tone="warning" /><InfoList title={labels.rules} items={chapter.rules} tone="danger" />{chapter.tips.length > 0 && <InfoList title={labels.tips} items={chapter.tips} tone="success" />}{screen && <InfoList title={labels.states} items={screen.states} />}</div>
    </section>
  );
}