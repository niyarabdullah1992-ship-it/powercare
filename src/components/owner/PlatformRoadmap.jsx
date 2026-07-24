import React from "react";
import { GitBranch } from "lucide-react";
import RoadmapScorecard from "@/components/owner/RoadmapScorecard";
import RoadmapPhase from "@/components/owner/RoadmapPhase";
import { roadmapPhases, strengths } from "@/lib/powercareRoadmap";

export default function PlatformRoadmap({ ar }) {
  const language = ar ? "ar" : "en";
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-accent/35 bg-primary p-6 text-primary-foreground shadow-elevated sm:p-8">
        <div className="flex items-center gap-2 text-accent"><GitBranch className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">{ar ? "PowerCare 2026 · تحديث يوليو" : "PowerCare 2026 · July update"}</span></div>
        <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">{ar ? "خارطة التطور المحدثة" : "Updated development roadmap"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-primary-foreground/70">{ar ? "عرض محدث لما تم إنجازه، وما نعمل عليه الآن، وخطوات التوسع المؤسسي التالية." : "A current view of delivered capabilities, active priorities, and the next stage of enterprise expansion."}</p>
      </div>
      <RoadmapScorecard ar={ar} />
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-heading text-xl font-semibold text-card-foreground">{ar ? "القدرات المتاحة الآن" : "Capabilities available now"}</h2>
        <div className="mt-4 flex flex-wrap gap-2">{strengths[language].map((item) => <span key={item} className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-medium text-foreground/75">{item}</span>)}</div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">{roadmapPhases[language].map((phase) => <RoadmapPhase key={phase.phase} data={phase} />)}</div>
      <div className="rounded-xl border border-accent/30 bg-accent/10 p-5 text-sm leading-7 text-foreground/75"><strong>{ar ? "التوجه الاستراتيجي: " : "Strategic direction: "}</strong>{ar ? "نحوّل القدرات التي تم إطلاقها إلى تشغيل مؤسسي موثوق، ثم نوسّع التكاملات والتحليلات الذكية دون إضافة تعقيد غير ضروري." : "Turn delivered capabilities into reliable enterprise operations, then expand integrations and intelligent analytics without unnecessary complexity."}</div>
    </section>
  );
}