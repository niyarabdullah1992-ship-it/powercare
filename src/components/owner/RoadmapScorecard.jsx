import React from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

export default function RoadmapScorecard({ ar }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-landing-gold/25 bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-landing-gold/10 px-3 py-1 text-xs font-semibold text-landing-gold-deep">{ar ? "التقييم العام" : "Overall score"}</span>
          <ShieldCheck className="h-5 w-5 text-landing-gold" />
        </div>
        <div className="flex items-end gap-2"><strong className="font-heading text-5xl text-[#3a2f22]">8.5</strong><span className="pb-1 text-sm text-[#3a2f22]/45">/ 10</span></div>
        <p className="mt-3 text-sm leading-6 text-[#3a2f22]/60">{ar ? "منصة ناضجة وظيفياً؛ الأولوية الآن للثقة والموثوقية." : "Functionally mature; trust and reliability are now the priority."}</p>
      </div>
      <div className="rounded-2xl border border-landing-gold/25 bg-[#3a2f22] p-5 text-white shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-landing-gold-light">{ar ? "درجة الشمولية" : "Coverage score"}</span>
          <Sparkles className="h-5 w-5 text-landing-gold-light" />
        </div>
        <div className="flex items-end gap-2"><strong className="font-heading text-5xl">9</strong><span className="pb-1 text-sm text-white/45">/ 10</span></div>
        <p className="mt-3 text-sm leading-6 text-white/60">{ar ? "شمولية استثنائية بميزة تنافسية واضحة في التوقيع الرقمي والذكاء الاصطناعي." : "Exceptional breadth, differentiated by digital signing and embedded AI."}</p>
      </div>
    </div>
  );
}