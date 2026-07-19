import React, { useState } from "react";
import ImageLightbox from "@/components/inventory/ImageLightbox";

export default function ImageGallery({ images = [], ar, className = "" }) {
  const [active, setActive] = useState(null);
  if (!images.length) return null;
  return <><div className={`grid grid-cols-3 gap-2 sm:grid-cols-5 ${className}`}>
    {images.map((url, index) => <button type="button" key={`${url}-${index}`} onClick={() => setActive(index)} className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
      <img src={url} alt={`${ar ? "صورة" : "Image"} ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-105" />
    </button>)}
  </div>{active !== null && <ImageLightbox images={images} index={active} onIndex={setActive} onClose={() => setActive(null)} ar={ar} />}</>;
}