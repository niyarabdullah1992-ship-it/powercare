import React from "react";
import { GitBranch } from "lucide-react";
import RoadmapScorecard from "@/components/owner/RoadmapScorecard";
import RoadmapPhase from "@/components/owner/RoadmapPhase";
import { roadmapPhases, strengths } from "@/lib/powercareRoadmap";

export default function PlatformRoadmap({ ar }) {
  const language = ar ? "ar" : "en";
  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-[#3a2f22] to-[#654b2d] p-6 text-white shadow-xl sm:p-8">
        <div className="flex items-center gap-2 text-landing-gold-light"><GitBranch className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">PowerCare 2026</span></div>
        <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">{ar ? "خارطة الاستقرار والنمو" : "Stability & growth roadmap"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">{ar ? "المنصة وصلت إلى مرحلة النضج الوظيفي. نبدأ بإزالة نقاط الاحتكاك التي تؤثر في الثقة، ثم نستثمر في النمو والتميّز التنافسي." : "The platform has reached functional maturity. Remove trust-impacting friction first, then invest in growth and competitive differentiation."}</p>
      </div>
      <RoadmapScorecard ar={ar} />
      <div className="rounded-2xl border border-[#3a2f22]/10 bg-white p-5 shadow-soft">
        <h2 className="font-heading text-xl font-semibold text-[#3a2f22]">{ar ? "القدرات الحالية" : "Current strengths"}</h2>
        <div className="mt-4 flex flex-wrap gap-2">{strengths[language].map((item) => <span key={item} className="rounded-full bg-landing-bg px-3 py-1.5 text-xs font-medium text-[#3a2f22]/70">{item}</span>)}</div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">{roadmapPhases[language].map((phase) => <RoadmapPhase key={phase.phase} data={phase} />)}</div>
      <div className="rounded-2xl border border-landing-gold/30 bg-landing-gold/10 p-5 text-sm leading-7 text-[#3a2f22]/75"><strong>{ar ? "المنطق الاستراتيجي: " : "Strategic rationale: "}</strong>{ar ? "الاحتفاظ بالعملاء يبدأ من الاستقرار. التوقيع الرقمي وNiro هما الفارق الحقيقي عن Bayzat وZimyo، ويجب تثبيتهما قبل توسيع نطاق الميزات." : "Retention starts with stability. Digital signing and Niro are the real differentiators from Bayzat and Zimyo, and should be hardened before expanding the feature set."}</div>
    </section>
  );
}