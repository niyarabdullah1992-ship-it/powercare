import React from "react";
import Reveal from "./Reveal";
import { ArrowUpRight } from "lucide-react";

const projects = [
  {
    id: 1,
    title: "Villa Lumen",
    category: "سكن فاخر",
    year: "2024",
    location: "وادي الحجر",
    description:
      "فيلا منحوتة من الخرسانة والزجاج، يتدفق الضوء عبر فراغاتها كأنه مادة سائلة، حيث يذوب الداخل في الخارج.",
  },
  {
    id: 2,
    title: "Pavilion Silvan",
    category: "استدامة",
    year: "2023",
    location: "غابة الأرز",
    description:
      "جناح معلق فوق الغابة، يوازن بين الكتلة الخرسانية الصارمة والطبيعة الحية، نموذج للعمارة الصامتة.",
  },
  {
    id: 3,
    title: "Stone Joint Study",
    category: "تفاصيل",
    year: "2025",
    location: "المرسم",
    description:
      "دراسة ماكرو لتقاطع الحجر الخام مع الفولاذ والزجاج — احتفاء بملمس المواد في أنقى تعبيراتها.",
  },
];

export default function Projects({ images }) {
  return (
    <section id="projects" className="bg-background py-24 md:py-40 px-6 md:px-12">
      <div className="mx-auto max-w-[1600px]">
        {/* Section header */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-24">
            <div>
              <p className="text-[11px] tracking-widest-xl uppercase text-accent font-body mb-4">
                02 — الأعمال
              </p>
              <h2 className="hero-title text-4xl md:text-6xl lg:text-7xl max-w-2xl">
                قطع فنية
                <br />
                <span className="italic font-light">لا مجرد مشاريع</span>
              </h2>
            </div>
            <p className="max-w-sm text-muted-foreground font-body text-base leading-relaxed">
              كل مشروع هو حوار بين الموقع والمادة والضوء — ننحت الفراغ ليكون
              نصًا صامتًا يُقرأ عبر الزمن.
            </p>
          </div>
        </Reveal>

        {/* Project grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 120}>
              <a
                href="#contact"
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
              >
                <div className="relative overflow-hidden bg-muted aspect-[3/4]">
                  <img
                    src={images[i]}
                    alt={p.title}
                    className="image-zoom w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />

                  {/* Hover overlay text */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                    <span className="text-[10px] tracking-widest-xl uppercase text-white/70 font-body mb-2">
                      {p.category} · {p.year}
                    </span>
                    <h3 className="hero-title text-2xl md:text-3xl text-white mb-2">
                      {p.title}
                    </h3>
                    <p className="text-white/0 group-hover:text-white/80 text-sm font-body leading-relaxed max-h-0 group-hover:max-h-32 overflow-hidden transition-all duration-700">
                      {p.description}
                    </p>
                  </div>

                  {/* Corner arrow */}
                  <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <ArrowUpRight className="w-4 h-4 text-white" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Below image caption */}
                <div className="flex items-center justify-between mt-4 pb-4 border-b border-border">
                  <span className="font-body text-sm text-foreground">{p.title}</span>
                  <span className="font-body text-xs text-muted-foreground">
                    {p.location}
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}