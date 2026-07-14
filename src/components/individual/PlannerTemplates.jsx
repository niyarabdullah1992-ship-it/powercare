import React from "react";
import { Briefcase, Rocket, GraduationCap } from "lucide-react";

// Ready-made day templates shown when the selected day is empty — one tap
// fills the planner so new users never face a blank page.
const templates = (ar) => [
  {
    id: "employee", icon: Briefcase, name: ar ? "يوم الموظف" : "Employee day",
    items: ar
      ? [["07:00", "استيقاظ وتجهيز"], ["08:30", "بدء العمل"], ["12:00", "استراحة الغداء"], ["16:00", "إنهاء مهام اليوم"], ["18:00", "رياضة"], ["21:30", "تخطيط الغد"]]
      : [["07:00", "Wake up & get ready"], ["08:30", "Start work"], ["12:00", "Lunch break"], ["16:00", "Wrap up today's tasks"], ["18:00", "Workout"], ["21:30", "Plan tomorrow"]],
  },
  {
    id: "founder", icon: Rocket, name: ar ? "يوم رائد الأعمال" : "Entrepreneur day",
    items: ar
      ? [["06:30", "قراءة وتخطيط"], ["09:00", "اجتماعات"], ["13:00", "غداء"], ["15:00", "متابعة العملاء"], ["19:00", "وقت العائلة"], ["22:00", "مراجعة اليوم"]]
      : [["06:30", "Reading & planning"], ["09:00", "Meetings"], ["13:00", "Lunch"], ["15:00", "Client follow-ups"], ["19:00", "Family time"], ["22:00", "Review the day"]],
  },
  {
    id: "student", icon: GraduationCap, name: ar ? "يوم الطالب" : "Student day",
    items: ar
      ? [["07:00", "مراجعة سريعة"], ["09:00", "محاضرات"], ["14:00", "غداء وراحة"], ["16:00", "مذاكرة"], ["20:00", "حل الواجبات"], ["22:30", "نوم مبكر"]]
      : [["07:00", "Quick review"], ["09:00", "Classes"], ["14:00", "Lunch & rest"], ["16:00", "Study session"], ["20:00", "Homework"], ["22:30", "Early sleep"]],
  },
];

export default function PlannerTemplates({ ar, onApply }) {
  return (
    <div className="p-4 rounded-2xl border border-dashed border-accent/40 bg-accent/5">
      <p className="text-xs font-body text-muted-foreground mb-3">
        {ar ? "يومك فارغ — ابدأ بقالب جاهز بضغطة واحدة:" : "Your day is empty — start with a one-tap template:"}
      </p>
      <div className="flex flex-wrap gap-2">
        {templates(ar).map((tp) => (
          <button
            key={tp.id}
            onClick={() => onApply(tp.items)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border bg-card text-xs font-body hover:border-accent/50 hover:bg-accent/10 transition"
          >
            <tp.icon className="w-3.5 h-3.5 text-accent" strokeWidth={1.75} /> {tp.name}
          </button>
        ))}
      </div>
    </div>
  );
}