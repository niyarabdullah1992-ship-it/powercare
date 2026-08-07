import React from "react";
import Logo from "@/components/Logo";
import PresentationVisual from "@/components/presentation/PresentationVisual";

export default function PresentationSlide({ slide, index, total }) {
  return <section className={`pc-slide ${index === 0 ? "pc-cover" : ""}`}>
    <header><Logo size={34} /><span>{slide.eyebrow}</span><b>{String(index + 1).padStart(2, "0")}</b></header>
    <div className="pc-slide-grid">
      <article dir="rtl">
        <p className="pc-kicker">POWERCARE • SOFTWARE WORK</p>
        <h1>{slide.titleAr}</h1>
        <h2 dir="ltr">{slide.titleEn}</h2>
        <p className="pc-summary">{slide.summaryAr}</p>
        <p className="pc-summary-en" dir="ltr">{slide.summaryEn}</p>
        {slide.points && <div className="pc-points">{slide.points.map(([ar, en]) => <div key={ar}><i /><span><b>{ar}</b><small dir="ltr">{en}</small></span></div>)}</div>}
        {slide.details && <div className="pc-details">{slide.details.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>}
      </article>
      <PresentationVisual type={slide.visual} steps={slide.steps} />
    </div>
    <footer><span>POWERCARE • CONFIDENTIAL PRESENTATION</span><span>{index + 1} / {total}</span></footer>
  </section>;
}