import React, { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

const cache = new Map();

export default function ManualBrowserShot({ route, title, captureLabel, forceActive = false }) {
  const hostRef = useRef(null);
  const [active, setActive] = useState(false);
  const [image, setImage] = useState(() => cache.get(route) || "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (hostRef.current && (image || failed)) hostRef.current.dataset.captureReady = "true";
  }, [image, failed]);

  useEffect(() => {
    if (forceActive) { setActive(true); return; }
    const node = hostRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setActive(true), { rootMargin: "500px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [forceActive]);

  const capture = async (event) => {
    if (image) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const frameDoc = event.currentTarget.contentDocument;
      const target = frameDoc?.querySelector("main") || frameDoc?.body;
      if (!target) throw new Error("screen unavailable");
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(target, { scale: 0.75, useCORS: true, logging: false, backgroundColor: "#f5efe5" });
      const url = canvas.toDataURL("image/jpeg", 0.82);
      cache.set(route, url);
      setImage(url);
    } catch {
      setFailed(true);
    }
  };

  return (
    <div ref={hostRef} className="manual-screen-shot overflow-hidden rounded-2xl border border-accent/25 bg-primary shadow-elevated">
      <div className="flex h-10 items-center gap-2 border-b border-white/10 px-4 text-primary-foreground/70">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/80" /><span className="h-2.5 w-2.5 rounded-full bg-landing-gold" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span className="mx-auto flex items-center gap-2 text-[11px]"><Camera className="h-3.5 w-3.5" />{captureLabel}: {title}</span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {image ? <img src={image} alt={`${captureLabel}: ${title}`} className="h-full w-full object-cover object-top" /> : active ? <iframe title={title} src={route} onLoad={capture} className="h-full w-full border-0 pointer-events-none" /> : null}
        {!image && !failed && <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted/70"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>}
        {failed && <iframe title={title} src={route} className="h-full w-full border-0 pointer-events-none" />}
      </div>
    </div>
  );
}