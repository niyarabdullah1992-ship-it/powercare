import React from "react";
import Reveal from "./Reveal";

const steps = [
  {
    num: "I",
    title: "الاستماع",
    text: "نبدأ من الصمت — نستمع إلى الموقع، إلى الضوء، إلى طموح من سيسكن الفراغ. كل مشروع يولد من حوار صادق قبل أي خط.",
  },
  {
    num: "II",
    title: "النحت",
    text: "ننحت الكتلة من المادة الخام: حجر، خرسانة، زجاج، خشب. كل تفصيل مدروس بدقة هندسية تخدم التجربة الحسية للساكن.",
  },
  {
    num: "III",
    title: "الضوء",
    text: "الضوء هو المادة الأهم — نرسم حركته عبر النهار والفصول، فتصبح المعمارية كائنًا حيًا يتنفس مع دورة الشمس.",
  },
  {
    num: "IV",
    title: "الإرث",
    text: "نبني ليبقى — عمارة صامتة تتجاوز الموضة، تحتفي بالاستدامة كأخلاق لا كشعار، وتترك أثرًا يتعمق مع الزمن.",
  },
];

export default function Philosophy({ image }) {
  return (
    <section
      id="philosophy"
      className="relative bg-foreground text-background py-24 md:py-40 px-6 md:px-12 overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0 opacity-15">
        <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>

      <div className="relative mx-auto max-w-[1400px]">
        {/* Header */}
        <Reveal>
          <div className="text-center mb-20 md:mb-28">
            <p className="text-[11px] tracking-widest-xl uppercase text-background/60 font-body mb-4">
              03 — الفلسفة
            </p>
            <h2 className="hero-title text-4xl md:text-6xl lg:text-7xl max-w-3xl mx-auto">
              العمارة حوارٌ
              <br />
              <span className="italic font-light text-background/90">بين الإنسان والمكان</span>
            </h2>
          </div>
        </Reveal>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-background/10">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 100}>
              <div className="bg-foreground p-8 md:p-10 h-full flex flex-col min-h-[280px]">
                <span className="hero-title text-5xl text-background/30 mb-8">{s.num}</span>
                <h3 className="hero-title text-2xl md:text-3xl mb-4 text-background">{s.title}</h3>
                <p className="font-body text-sm md:text-base text-background/70 leading-relaxed">
                  {s.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Quote */}
        <Reveal delay={200}>
          <blockquote className="mt-20 md:mt-28 text-center max-w-3xl mx-auto">
            <p className="hero-title italic text-2xl md:text-4xl leading-relaxed text-background/90">
              «لا نصمم مباني — ننحت زمنًا من الضوء والحجر،
              ليكون المكان نصًا يُقرأ عبر الأجيال.»
            </p>
            <footer className="mt-8 text-[11px] tracking-widest-xl uppercase text-background/50 font-body">
              — بيان المرسم
            </footer>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}