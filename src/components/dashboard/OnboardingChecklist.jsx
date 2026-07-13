import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from "lucide-react";

// Guided first steps for new companies — hidden automatically once everything is set up.
export default function OnboardingChecklist({ data, lang }) {
  const ar = lang === "ar";
  const text = (arabic, english, japanese) => ar ? arabic : lang === "ja" ? japanese : english;
  const steps = [
    {
      done: data.stations.length > 0,
      to: "/app/stations",
      title: text("أضف محطتك الأولى", "Add your first station", "最初のステーションを追加"),
      desc: text("المحطات هي مقرات العمل التي ينتمي إليها الموظفون.", "Stations are the work sites your employees belong to.", "ステーションは従業員が所属する勤務拠点です。"),
    },
    {
      done: data.employees.length > 1,
      to: "/app/employees",
      title: text("أضف موظفيك", "Add your employees", "従業員を追加"),
      desc: text("أضف فريقك وحدد درجاتهم الوظيفية وصلاحياتهم.", "Add your team and set their grades and permissions.", "チームを追加し、職位と権限を設定します。"),
    },
    {
      done: data.stations.some((s) => s.lat && s.lng),
      to: "/app/attendance",
      title: text("حدد موقع العمل على الخريطة", "Set the workplace location", "勤務先の場所を設定"),
      desc: text("لتفعيل التحقق من الحضور عبر GPS عند تسجيل الموظفين.", "Enables GPS check-in verification for attendance.", "出勤時のGPS位置確認を有効にします。"),
    },
  ];

  if (steps.every((s) => s.done)) return null;
  const doneCount = steps.filter((s) => s.done).length;
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <div className="rounded-2xl border border-accent/30 bg-card overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-heading text-xl font-semibold">
            {text("أهلًا بك — لنجهّز شركتك", "Welcome — let's set up your company", "ようこそ — 会社の設定を始めましょう")}
          </h3>
          <span className="text-xs font-body text-muted-foreground">{doneCount}/{steps.length}</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
      </div>
      <div className="divide-y divide-border">
        {steps.map((s, i) => (
          <Link
            key={i}
            to={s.to}
            className={`flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors ${s.done ? "opacity-60" : ""}`}
          >
            {s.done ? (
              <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-body font-semibold ${s.done ? "line-through" : ""}`}>{s.title}</p>
              <p className="text-xs text-muted-foreground font-body">{s.desc}</p>
            </div>
            {!s.done && <Arrow className="w-4 h-4 text-accent shrink-0" />}
          </Link>
        ))}
      </div>
    </div>
  );
}