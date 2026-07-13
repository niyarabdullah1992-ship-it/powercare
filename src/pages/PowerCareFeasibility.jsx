import React from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router-dom";
import PresentationSlide from "@/components/presentation/PresentationSlide";
import { feasibilitySlides } from "@/lib/feasibilityContent";
import "@/pages/powercare-presentation.css";

export default function PowerCareFeasibility() {
  return <div className="pc-presentation-page">
    <nav className="pc-deck-toolbar">
      <Link to="/" className="pc-toolbar-link"><ArrowLeft /> العودة | Back</Link>
      <div><b>PowerCare</b><span>دراسة الجدوى والتسويق | Feasibility & Marketing</span></div>
      <button onClick={() => window.print()}><Download /> حفظ PDF | Save PDF</button>
    </nav>
    <main className="pc-deck">
      {feasibilitySlides.map((slide, index) => <PresentationSlide key={slide.eyebrow} slide={slide} index={index} total={feasibilitySlides.length} />)}
    </main>
  </div>;
}