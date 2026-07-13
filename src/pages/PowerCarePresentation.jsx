import React from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router-dom";
import PresentationSlide from "@/components/presentation/PresentationSlide";
import { presentationSlides } from "@/lib/presentationContent";
import "@/pages/powercare-presentation.css";

export default function PowerCarePresentation() {
  return <div className="pc-presentation-page">
    <nav className="pc-deck-toolbar">
      <Link to="/" className="pc-toolbar-link"><ArrowLeft /> العودة | Back</Link>
      <div><b>PowerCare</b><span>عرض الملكية الفكرية | IP Presentation</span></div>
      <button onClick={() => window.print()}><Download /> حفظ PDF | Save PDF</button>
    </nav>
    <main className="pc-deck">
      {presentationSlides.map((slide, index) => <PresentationSlide key={slide.eyebrow} slide={slide} index={index} total={presentationSlides.length} />)}
    </main>
  </div>;
}