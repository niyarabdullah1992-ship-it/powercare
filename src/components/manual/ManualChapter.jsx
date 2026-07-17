import React from "react";
import { MANUAL_SCREEN_GUIDES } from "@/lib/siteManualScreens";

const List = ({ title, items, ordered }) => (
  <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">{title}</h3>{React.createElement(ordered ? "ol" : "ul", { className: `space-y-2 text-sm leading-7 text-muted-foreground ${ordered ? "list-decimal" : "list-disc"} ps-5` }, items.map((item, index) => <li key={index}>{item}</li>))}</div>
);

export default function ManualChapter({ chapter }) {
  const screen = MANUAL_SCREEN_GUIDES[chapter.id];
  return (
    <section id={chapter.id} className="manual-chapter scroll-mt-24 rounded-2xl border border-border bg-card p-5 md:p-7">
      <h2 className="font-heading text-2xl font-semibold md:text-3xl">{chapter.title}</h2>
      <p className="mt-2 text-sm leading-7 text-foreground/80">{chapter.purpose}</p>
      {screen && <div className="mt-5 rounded-xl border border-accent/20 bg-accent/5 p-4"><h3 className="text-xs font-bold uppercase tracking-wider text-accent">شكل واجهة القسم</h3><p className="mt-2 text-sm leading-7 text-foreground/80">{screen.appearance}</p></div>}
      {screen && <div className="mt-6 grid gap-6 lg:grid-cols-2"><List title="ماذا تحتوي الشاشة؟" items={screen.contains} /><List title="الأزرار وماذا تفعل" items={screen.controls} /><List title="الحالات والرسائل الظاهرة" items={screen.states} /></div>}
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><List title="من يستخدم القسم؟" items={chapter.roles} /><List title="طريقة الاستخدام خطوة بخطوة" items={chapter.steps} ordered /><List title="قواعد وضوابط مهمة" items={chapter.rules} />{chapter.tips.length > 0 && <List title="نصائح عملية" items={chapter.tips} />}</div>
    </section>
  );
}