import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ImageLightbox({ images, index, onIndex, onClose, ar }) {
  const [startX, setStartX] = useState(null);
  const move = (step) => onIndex((index + step + images.length) % images.length);
  const finishSwipe = (endX) => {
    if (startX !== null && Math.abs(endX - startX) > 45) move(endX < startX ? 1 : -1);
    setStartX(null);
  };
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/95 p-3" onClick={onClose}>
    <button type="button" onClick={onClose} aria-label={ar ? "إغلاق" : "Close"} className="absolute end-4 top-4 rounded-full bg-card/90 p-2 text-foreground"><X className="h-6 w-6" /></button>
    {images.length > 1 && <button type="button" onClick={(e) => { e.stopPropagation(); move(-1); }} aria-label={ar ? "الصورة السابقة" : "Previous image"} className="absolute start-3 z-10 rounded-full bg-card/90 p-2 text-foreground"><ChevronLeft className="h-6 w-6 rtl:rotate-180" /></button>}
    <img src={images[index]} alt={`${ar ? "صورة" : "Image"} ${index + 1}`} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => setStartX(e.touches[0].clientX)} onTouchEnd={(e) => finishSwipe(e.changedTouches[0].clientX)} className="max-h-[88vh] max-w-full select-none object-contain" />
    {images.length > 1 && <button type="button" onClick={(e) => { e.stopPropagation(); move(1); }} aria-label={ar ? "الصورة التالية" : "Next image"} className="absolute end-3 z-10 rounded-full bg-card/90 p-2 text-foreground"><ChevronRight className="h-6 w-6 rtl:rotate-180" /></button>}
    <span className="absolute bottom-4 rounded-full bg-card/90 px-3 py-1 text-xs text-foreground">{index + 1} / {images.length}</span>
  </div>;
}